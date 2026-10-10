import { loadEnv } from "./env.ts";
import { CATEGORIES, CATEGORY_KEYS, SEVERITIES, SEVERITY_KEYS, type Category, type Severity } from "./taxonomy.ts";

export const JEV_URL = "https://api.typesafe.ai/v1/systemone";
export const JEV_MODEL = "jev-latest";

export type IntakeState = {
  request: string;
  property?: string;
  reporter_role?: string;
  extra?: Record<string, string>;
  /** Compact landlord/tenant/property facts (see profile.ts buildProfile). */
  profile?: string;
  /** Short list of prior jobs at the property. */
  history?: string[];
};

export const SCOPES = {
  maintenance_repair: "A fault or repair at the property that a contractor or the landlord would fix.",
  maintenance_admin: "Property-maintenance admin: inspections, meter or solar readings, photos, check-out works, access arrangements.",
  tenancy_finance: "Rent, arrears, deposit, fees, charges, refunds, payment queries.",
  tenancy_legal_or_dispute: "Eviction or notices, tenancy disputes, legal claims, complaints about the agency or its staff, insurance claims.",
  neighbour_or_antisocial: "Neighbour noise or nuisance, antisocial behaviour, parking and boundary issues with neighbours.",
  emergency_safety: "An immediate danger to people or property: gas smell, fire, flooding in progress, electrical burning, break-in.",
  other_non_property: "Anything else that is not about maintaining a property.",
} as const;
export type Scope = keyof typeof SCOPES;
export const SCOPE_KEYS = Object.keys(SCOPES) as Scope[];
export const IN_SCOPE: readonly Scope[] = ["maintenance_repair", "maintenance_admin", "emergency_safety"];

export type IntakeResult = {
  scope: Scope;
  scope_probs: Record<Scope, number>;
  /** Informational: the request is written in a language other than English. */
  non_english: number;
  category: Category;
  category_probs: Record<Category, number>;
  severity: Severity;
  severity_probs: Record<Severity, number>;
  needs_landlord_approval: number;
  /** Raw (uncalibrated) Jev probability; `needs_landlord_approval` is this passed through calibrateApproval. */
  needs_landlord_approval_raw: number;
  likely_self_fixable: number;
  safety_risk: number;
  needs_more_info: number;
  raw: unknown;
  latencyMs: number;
};

export type Route =
  | "emergency_dispatch"
  | "self_fix_first"
  | "request_landlord_approval"
  | "ask_for_info"
  | "out_of_scope_handover"
  | "standard";

/** Routing thresholds (probabilities from calibrated Jev answers). */
export const THRESHOLDS = {
  /** safety_risk >= SAFETY_RISK OR P(severity=emergency) >= EMERGENCY_SEVERITY => emergency_dispatch */
  SAFETY_RISK: 0.75,
  EMERGENCY_SEVERITY: 0.6,
  /** needs_more_info >= this (and not emergency) => ask_for_info */
  NEEDS_MORE_INFO: 0.6,
  /** likely_self_fixable >= SELF_FIXABLE and safety_risk < SELF_FIX_MAX_SAFETY => self_fix_first */
  SELF_FIXABLE: 0.6,
  SELF_FIX_MAX_SAFETY: 0.2,
  /** P(scope is not maintenance_* / emergency_safety) >= this => out_of_scope_handover (checked first) */
  OUT_OF_SCOPE: 0.5,
  /** needs_landlord_approval >= this => request_landlord_approval */
  LANDLORD_APPROVAL: 0.5,
} as const;

/**
 * Jev's raw needs_landlord_approval is overconfident: it sits at 0.78-0.92 for every repair (only ~65% truly had an approval step;
 * the label depends on per-landlord standing authority that is not in the request text) and ~0.1-0.25 for admin tasks, which is the
 * one signal that IS predictable (3/3 admin cases had no approval). Linear shrink for the "yes" side so the output is a calibrated
 * probability (~0.63-0.68, near the 64% base rate); the low side is halved to ~0.1. Fitted on cases 001-035 only. Decision stays at
 * THRESHOLDS.LANDLORD_APPROVAL=0.5: every non-admin repair -> request approval, admin -> standard.
 */
export function calibrateApproval(raw: number): number {
  return raw < 0.5 ? raw * 0.5 : 0.4 + 0.3 * raw;
}

const SCORE_SEVERITY_LEVELS = SEVERITY_KEYS.map((k) => `${k}: ${SEVERITIES[k]}`);

const CATEGORY_CRITERIA: Record<string, string> = Object.fromEntries(CATEGORY_KEYS.map((k) => [k, CATEGORIES[k]]));

const GENERAL =
  "The request may be in any language (judge its content, not its language) and may be a ticket title, an email, a chat message or an agency note. " +
  "Use the profile and history in the state when present. ";

const SCOPE_CRITERIA: Record<string, string> = Object.fromEntries(SCOPE_KEYS.map((k) => [k, SCOPES[k]]));

export function buildQuestions() {
  return {
    scope: {
      type: "choice",
      instructions:
        GENERAL +
        "Decide what kind of request this is for a UK residential lettings agency. Only faults/repairs and property-maintenance admin are the agency's maintenance desk work. " +
        "Rent, arrears, deposits and fees are tenancy_finance. Evictions, disputes, legal or insurance-claim questions and complaints about the agency are tenancy_legal_or_dispute. " +
        "Neighbour noise or behaviour is neighbour_or_antisocial. A gas smell, fire, active flooding, sparking or a break-in is emergency_safety even if short. " +
        "A normal repair report, even if angry or in another language, is maintenance_repair.",
      criteria: SCOPE_CRITERIA,
    },
    non_english: {
      type: "noul",
      instructions: "Informational only: is the request written wholly or mainly in a language other than English?",
    },
    category: {
      type: "choice",
      instructions:
        GENERAL + "You triage maintenance requests for a UK residential lettings agency. If the request is not a maintenance job at all (rent, deposit, dispute, neighbour, complaint), choose other. Choose the single category that best describes the " +
        "PRIMARY fault or job in the request. Judge by what is broken or being asked for, not by who reports it. " +
        "Location beats item type for outdoor things: a pipe, tap or drain in the garden or outside the building, and a shed, gate or fence (even its door or hinges), are garden_external, not plumbing or doors_windows_locks. " +
        "But a door or window of the dwelling itself that merely opens onto the garden or balcony (back door, garden door, patio door) stays doors_windows_locks. " +
        "Requests from the agency about check-out cleaning, carpets, repainting or post-tenancy works are cleaning_checkout_works, " +
        "unless the list is plainly a specific electrical, plumbing or appliance fault. " +
        "Inspections, meter/solar readings and photo requests are inspection_admin. Use other only if nothing fits.",
      criteria: CATEGORY_CRITERIA,
    },
    severity: {
      type: "score",
      instructions:
        GENERAL + "Rate how urgent this maintenance request is for a UK lettings agency, from routine to emergency. If it is not a maintenance request at all, answer routine unless it states an immediate danger. A recorded vulnerable household (infant, elderly, disabled) makes a loss of heating, hot water or security more urgent. " +
        "Nearly all requests are routine: the agency's own intake note rates ordinary repair requests routine. " +
        "Emergency is rare and needs an explicit, stated danger in progress: active leak or flooding, gas smell, electrical sparking or burning, " +
        "no heating or hot water in cold weather, or an external door/window that cannot be secured at all. " +
        "Urgent is also uncommon: the home is largely unusable and the agent should act within days (no working toilet or only shower, no cooking at all). " +
        "Routine includes: a door or window that is stiff, sticks, is hard to close or lock, a loose handle, hinge or latch, a lock that is hard to turn, " +
        "a slow-filling cistern, one tap not working, an appliance that works badly or not at all (oven, washing machine, dishwasher), wear and tear, cosmetic issues, garden work, quotes, check-out works and admin. " +
        "Do not escalate because the tenant sounds frustrated or because an appliance is inconvenient to lose; judge physical danger and loss of use.",
      criteria: SCORE_SEVERITY_LEVELS,
    },
    needs_landlord_approval: {
      type: "noul",
      instructions:
        "Would the letting agent, acting for the landlord, normally take the landlord's approval (an authorisation step, or approving a quote or cost) before a contractor is instructed? " +
        "In UK managed lettings this is the default for any repair or replacement of landlord-owned items or fabric, garden and communal works, redecoration, carpets and check-out works: answer yes. " +
        "Answer no for pure admin (inspections, meter or solar readings, photos, appointment changes), for tenant-owned or tenant-only matters, " +
        "and for genuine emergencies where the agent must act at once. " +
        "If the landlord's recorded facts in the profile give standing authority or a spend limit that plausibly covers this job (pre-approved limit, pays contractor directly), answer no. " +
        "If the profile records that the landlord wants a call or approval before spending, answer yes. " +
        "With no such facts, the request does not show whether the landlord pre-authorised small jobs, so do not guess: stay near the default for ordinary repairs.",
    },
    likely_self_fixable: {
      type: "noul",
      instructions:
        "Would this probably be closed WITHOUT any contractor being paid, because the tenant, the landlord or the issue itself sorts it out? " +
        "Yes signals: the tenant describes a minor, safe fault they could try to deal with (a sticking, sagging or swollen door or shed door that can be lifted or eased, a slow-draining or blocked bath, sink or toilet that a plunger may clear, " +
        "a fan or appliance that may just need a switch, reset, fuse or filter cleaned, a fault that appears linked to heat, weather or settling, a tenant who already says they have checked or can manage), " +
        "or an item the tenant may simply replace with their own (a washing machine), or the request mentions the landlord or a family member handling it. " +
        "No signals: a lock, glazing, gas, electrical, structural or plumbing fault needing parts, tools or a qualified trade; leaks; check-out works; garden clearance; admin; or where the tenant says checks were already done and it still fails.",
    },
    safety_risk: {
      type: "noul",
      instructions:
        "Is there a risk to the safety of occupants or serious property damage if this is not attended to quickly? " +
        "Consider gas, electricity, water ingress or flooding, structural problems, fire risk, and security (property cannot be locked or secured). " +
        "Minor inconvenience, noise, cosmetic problems or an appliance that simply does not work are not safety risks.",
    },
    needs_more_info: {
      type: "noul",
      instructions:
        "Is the request too vague or incomplete for the agent to decide what work is needed or to brief a contractor " +
        "(e.g. no clear fault, no location, no description of symptoms, only a title or one or two words)? " +
        "Answer no if the problem and its location are reasonably clear even if details like model or access are missing.",
    },
  } as const;
}

export function buildRequest(state: IntakeState) {
  const s: Record<string, unknown> = { request: state.request };
  if (state.property) s.property = state.property;
  if (state.profile) s.profile = state.profile;
  if (state.history?.length) s.history = state.history;
  if (state.reporter_role) s.reporter_role = state.reporter_role;
  if (state.extra) Object.assign(s, state.extra);
  return { state: s, model: JEV_MODEL, questions: buildQuestions() };
}

// ---------- parsing (defensive: exact Jev field shapes for score are unverified) ----------

type AnyObj = Record<string, unknown>;
const isObj = (x: unknown): x is AnyObj => typeof x === "object" && x !== null && !Array.isArray(x);

function normalize<K extends string>(probs: Record<K, number>): Record<K, number> {
  const sum = Object.values<number>(probs).reduce((a, b) => a + b, 0);
  if (sum <= 0) return probs;
  return Object.fromEntries(Object.entries<number>(probs).map(([k, v]) => [k, v / sum])) as Record<K, number>;
}

function numProbs(x: unknown): Record<string, number> | null {
  if (!isObj(x)) return null;
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(x)) if (typeof v === "number") out[k] = v;
  return Object.keys(out).length ? out : null;
}

function zero<K extends string>(keys: readonly K[]): Record<K, number> {
  return Object.fromEntries(keys.map((k) => [k, 0])) as Record<K, number>;
}

function argmax<K extends string>(probs: Record<K, number>, keys: readonly K[]): K {
  return keys.reduce((a, b) => (probs[b] > probs[a] ? b : a), keys[0]);
}

export function parseChoice<K extends string>(answer: unknown, keys: readonly K[], name: string): { value: K; probs: Record<K, number> } {
  if (!isObj(answer)) throw new Error(`Jev answer "${name}" missing`);
  const probs = zero(keys);
  const given = numProbs(answer.probabilities);
  if (given) for (const k of keys) if (k in given) probs[k] = given[k];
  const choice = typeof answer.choice === "string" ? answer.choice : undefined;
  let value: K | undefined = choice && (keys as readonly string[]).includes(choice) ? (choice as K) : undefined;
  if (value && !given) probs[value] = 1;
  if (!value) {
    value = argmax(probs, keys);
    if (probs[value] === 0) throw new Error(`Jev answer "${name}" has no usable choice: ${JSON.stringify(answer)}`);
  }
  return { value, probs: normalize(probs) };
}

/** Map a key (label, "label: desc", full description, or index) to a level index. */
function levelIndex(key: string, labels: readonly string[], descs: readonly string[]): number {
  const lk = key.toLowerCase();
  const i = labels.findIndex((l) => lk === l || lk.startsWith(l + ":"));
  if (i >= 0) return i;
  const d = descs.findIndex((x) => x === key);
  if (d >= 0) return d;
  if (/^\d+$/.test(key) && Number(key) < labels.length) return Number(key);
  return -1;
}

function parseScore<K extends string>(answer: unknown, keys: readonly K[], descs: readonly string[], name: string): { value: K; probs: Record<K, number> } {
  if (!isObj(answer)) throw new Error(`Jev answer "${name}" missing`);
  const n = keys.length;
  const probs = zero(keys);
  const given = numProbs(answer.probabilities);
  let mapped = false;
  if (given) {
    for (const [k, v] of Object.entries(given)) {
      const i = levelIndex(k, keys, descs);
      if (i >= 0) {
        probs[keys[i]] += v;
        mapped = true;
      }
    }
  }
  // Jev's numeric `score` is the expected level index (e.g. 0.95 on a 0..2 scale ≈ "urgent"), not a 0..1 fraction.
  // When probabilities are present, the most likely level is the answer.
  let idx = -1;
  const sc = answer.score;
  if (mapped) idx = keys.indexOf(argmax(normalize(probs), keys));
  else if (typeof sc === "number" && sc >= 0 && sc <= n - 1) idx = Math.round(sc);
  else if (typeof sc === "string") idx = levelIndex(sc, keys, descs);
  if (idx < 0 && typeof answer.legend === "string") idx = levelIndex(answer.legend, keys, descs);
  if (!mapped) {
    if (idx < 0) throw new Error(`Jev answer "${name}" has no usable score: ${JSON.stringify(answer)}`);
    probs[keys[idx]] = 1;
  }
  const norm = normalize(probs);
  return { value: idx >= 0 ? keys[idx] : argmax(norm, keys), probs: norm };
}

export function parseNoul(answer: unknown, name: string): number {
  if (typeof answer === "number") return answer;
  if (!isObj(answer)) throw new Error(`Jev answer "${name}" missing`);
  const v = answer.noul;
  if (typeof v === "number") return v;
  if (typeof v === "boolean") return v ? 1 : 0;
  throw new Error(`Jev answer "${name}" has no noul value: ${JSON.stringify(answer)}`);
}

export function parseResponse(json: unknown, latencyMs = 0): IntakeResult {
  if (!isObj(json) || !isObj(json.answers)) throw new Error(`Unexpected Jev response: ${JSON.stringify(json)?.slice(0, 300)}`);
  const a = json.answers;
  const cat = parseChoice(a.category, CATEGORY_KEYS, "category");
  const sev = parseScore(a.severity, SEVERITY_KEYS, SCORE_SEVERITY_LEVELS, "severity");
  const approvalRaw = parseNoul(a.needs_landlord_approval, "needs_landlord_approval");
  // scope / non_english tolerated as absent (older responses): default to an in-scope repair.
  const scope = a.scope
    ? parseChoice(a.scope, SCOPE_KEYS, "scope")
    : { value: "maintenance_repair" as Scope, probs: { ...zero(SCOPE_KEYS), maintenance_repair: 1 } };
  return {
    scope: scope.value,
    scope_probs: scope.probs,
    non_english: a.non_english === undefined ? 0 : parseNoul(a.non_english, "non_english"),
    category: cat.value,
    category_probs: cat.probs,
    severity: sev.value,
    severity_probs: sev.probs,
    needs_landlord_approval: calibrateApproval(approvalRaw),
    needs_landlord_approval_raw: approvalRaw,
    likely_self_fixable: parseNoul(a.likely_self_fixable, "likely_self_fixable"),
    safety_risk: parseNoul(a.safety_risk, "safety_risk"),
    needs_more_info: parseNoul(a.needs_more_info, "needs_more_info"),
    raw: json,
    latencyMs,
  };
}

// ---------- routing ----------

export function decideRoute(
  r: Pick<IntakeResult, "severity_probs" | "needs_landlord_approval" | "likely_self_fixable" | "safety_risk" | "needs_more_info"> &
    Partial<Pick<IntakeResult, "scope" | "scope_probs">>,
): Route {
  const T = THRESHOLDS;
  const oos = r.scope_probs
    ? SCOPE_KEYS.filter((k) => !IN_SCOPE.includes(k)).reduce((a, k) => a + r.scope_probs![k], 0)
    : r.scope && !IN_SCOPE.includes(r.scope)
      ? 1
      : 0;
  if (oos >= T.OUT_OF_SCOPE) return "out_of_scope_handover";
  if (r.safety_risk >= T.SAFETY_RISK || r.severity_probs.emergency >= T.EMERGENCY_SEVERITY) return "emergency_dispatch";
  if (r.needs_more_info >= T.NEEDS_MORE_INFO) return "ask_for_info";
  if (r.likely_self_fixable >= T.SELF_FIXABLE && r.safety_risk < T.SELF_FIX_MAX_SAFETY) return "self_fix_first";
  if (r.needs_landlord_approval >= T.LANDLORD_APPROVAL) return "request_landlord_approval";
  return "standard";
}

// ---------- transport ----------

export class MissingKeyError extends Error {
  constructor() {
    super("TYPESAFE_API_KEY is not set (env or dwelly-agent/.env). Use --dry-run to print the request without calling Jev.");
  }
}

export function getApiKey(): string {
  loadEnv();
  const k = process.env.TYPESAFE_API_KEY;
  if (!k) throw new MissingKeyError();
  return k;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function classifyIntake(state: IntakeState, opts: { retries?: number; apiKey?: string } = {}): Promise<IntakeResult> {
  const key = opts.apiKey ?? getApiKey();
  const body = JSON.stringify(buildRequest(state));
  const retries = opts.retries ?? 4;
  for (let attempt = 0; ; attempt++) {
    const t0 = performance.now();
    let res: Response | undefined;
    try {
      res = await fetch(JEV_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body,
      });
    } catch (e) {
      if (attempt >= retries) throw e;
    }
    if (res?.ok) return parseResponse(await res.json(), Math.round(performance.now() - t0));
    if (res && res.status !== 429 && res.status < 500) {
      throw new Error(`Jev HTTP ${res.status}: ${(await res.text()).slice(0, 500)}`);
    }
    if (attempt >= retries) throw new Error(`Jev failed after ${attempt + 1} attempts (HTTP ${res?.status ?? "network"})`);
    const retryAfter = Number(res?.headers.get("retry-after"));
    await sleep(retryAfter > 0 ? retryAfter * 1000 : 500 * 2 ** attempt + Math.random() * 250);
  }
}
