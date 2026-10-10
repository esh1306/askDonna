import { loadEnv } from "./env.ts";
import { CATEGORIES, CATEGORY_KEYS, SEVERITIES, SEVERITY_KEYS, type Category, type Severity } from "./taxonomy.ts";

export const JEV_URL = "https://api.typesafe.ai/v1/systemone";
export const JEV_MODEL = "jev-latest";

export type IntakeState = {
  request: string;
  property?: string;
  reporter_role?: string;
  extra?: Record<string, string>;
};

export type IntakeResult = {
  category: Category;
  category_probs: Record<Category, number>;
  severity: Severity;
  severity_probs: Record<Severity, number>;
  needs_landlord_approval: number;
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
  /** needs_landlord_approval >= this => request_landlord_approval */
  LANDLORD_APPROVAL: 0.5,
} as const;

const SCORE_SEVERITY_LEVELS = SEVERITY_KEYS.map((k) => `${k}: ${SEVERITIES[k]}`);

const CATEGORY_CRITERIA: Record<string, string> = Object.fromEntries(CATEGORY_KEYS.map((k) => [k, CATEGORIES[k]]));

export function buildQuestions() {
  return {
    category: {
      type: "choice",
      instructions:
        "You triage maintenance requests for a UK residential lettings agency. Choose the single category that best describes the " +
        "PRIMARY fault or job in the request. Judge by what is broken or being asked for, not by who reports it. " +
        "Requests from the agency about check-out cleaning, carpets, repainting or post-tenancy works are cleaning_checkout_works. " +
        "Inspections, meter/solar readings and photo requests are inspection_admin. Use other only if nothing fits.",
      criteria: CATEGORY_CRITERIA,
    },
    severity: {
      type: "score",
      instructions:
        "Rate how urgent this maintenance request is for a UK lettings agency, from routine to emergency. " +
        "Emergency means a safety risk or damage in progress: active leak or flooding, gas smell, electrical danger or sparking, " +
        "no heating in cold weather, or an insecure property (external door will not lock, broken window letting people in). " +
        "Urgent means it materially affects daily use (e.g. toilet or only shower unusable, no oven, front door hard to lock) and should be dealt with within days. " +
        "Routine is everything else: wear and tear, cosmetic issues, garden work, quotes, admin. A faulty appliance that is merely inconvenient is routine. " +
        "Do not escalate just because the tenant sounds frustrated; judge the physical risk and loss of use.",
      criteria: SCORE_SEVERITY_LEVELS,
    },
    needs_landlord_approval: {
      type: "noul",
      instructions:
        "Would the letting agent need the landlord's approval (for the cost or the works) before sending a contractor? " +
        "Answer yes for repairs or replacements of landlord-owned items or fabric that may cost money, non-urgent works, quotes, and check-out works. " +
        "Answer no for genuine emergencies where the agent acts immediately, for tenant-only matters, for pure admin tasks (inspections, readings) and for trivial things the tenant can do.",
    },
    likely_self_fixable: {
      type: "noul",
      instructions:
        "Could the tenant plausibly resolve this themselves with simple, safe steps without a contractor " +
        "(e.g. plunger on a blocked toilet or drain, finding a reset switch, cleaning a filter, lifting or adjusting a sticking door, replacing a fuse or bulb)? " +
        "Answer no if it needs tools, parts, qualified trades (gas, electrical, locksmith, glazing), involves water or electricity danger, or is landlord/agency work such as check-out works.",
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
  return {
    category: cat.value,
    category_probs: cat.probs,
    severity: sev.value,
    severity_probs: sev.probs,
    needs_landlord_approval: parseNoul(a.needs_landlord_approval, "needs_landlord_approval"),
    likely_self_fixable: parseNoul(a.likely_self_fixable, "likely_self_fixable"),
    safety_risk: parseNoul(a.safety_risk, "safety_risk"),
    needs_more_info: parseNoul(a.needs_more_info, "needs_more_info"),
    raw: json,
    latencyMs,
  };
}

// ---------- routing ----------

export function decideRoute(
  r: Pick<IntakeResult, "severity_probs" | "needs_landlord_approval" | "likely_self_fixable" | "safety_risk" | "needs_more_info">,
): Route {
  const T = THRESHOLDS;
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
