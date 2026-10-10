import fs from "node:fs";
import path from "node:path";
import { loadCase } from "../crm/cases.ts";
import type { CaseDetail } from "../crm/case-types.ts";
import type { Category } from "./taxonomy.ts";

const TRACK = "Property Management";
const OUT = path.resolve(import.meta.dirname, "../data/intake-labels.json");

export type CaseLabel = {
  case: string;
  title: string;
  property: string;
  reporter_role: string;
  input_text: string;
  labels: {
    category: Category;
    needs_landlord_approval: boolean;
    resolved_without_contractor: boolean;
    dwelly_severity?: string;
    dwelly_issue?: string;
  };
  evidence: Record<string, unknown>;
};

// ordered rules over title + initial request (lower-cased)
const RULES: [Category, RegExp][] = [
  ["inspection_admin", /\binspection\b|solar panel|readings?\b/],
  ["cleaning_checkout_works", /check[- ]?out|checkout|carpet|repaint|vacating/],
  ["appliance", /dishwasher|washing machine|oven|extractor|fridge|cooker|hob\b|tumble dryer/],
  ["electrical_lighting", /spotlight|light fitting|lighting|socket|fuse|wiring|electric(?!al shower)/],
  ["heating_hot_water", /boiler|radiator|heating|hot water/],
  ["doors_windows_locks", /\bdoor\b|window|\block\b|\bkey\b|hinge|handle/],
  ["garden_external", /garden|hedge|shed|fence|\btree\b|patio|communal|back garden/],
  ["plumbing", /toilet|\bbath|shower|\btap\b|basin|sink|drain|pipe|plumb|cistern|flush|leak/],
];

// manual overrides for cases the rules misplace/can't place (reviewed by reading titles + requests)
const CATEGORY_OVERRIDE: Record<string, Category> = {
  "007": "electrical_lighting", // lounge lighting + ceiling, title says check-out works but primary jobs are repairs
  "028": "garden_external", // loose water pipe in back garden
  "045": "doors_windows_locks", // kitchen window + patio door windows
  "037": "plumbing", // shower cable/handle leaking
  "036": "plumbing", // shower pull knob
  "009": "garden_external", // front garden follow-up (inspection is only where it was spotted)
  "014": "doors_windows_locks", // front door (fridge engineer mentioned in passing)
  "049": "garden_external", // shed door
};

function inputText(c: CaseDetail): { text: string; usedExtra: boolean } {
  const base = (c.sections["Initial request"] ?? "").trim();
  const firstProvider = c.history.findIndex((e) => /maintenance provider assigned/i.test(e.body));
  const limit = firstProvider < 0 ? c.history.length : firstProvider;
  const msg = c.history.slice(0, limit).find((e) => /tenant/i.test(e.from) && /email|sms/i.test(e.channel) && e.body.trim().length > 0);
  if (msg) {
    const body = msg.body.trim().slice(0, 800);
    const probe = body.slice(0, 60);
    if (!base.includes(probe)) return { text: `${base}\n\nFirst tenant message:\n${body}`, usedExtra: true };
  }
  return { text: base, usedExtra: false };
}

function parseDwelly(c: CaseDetail): { severity?: string; issue?: string } {
  const note = c.history.find((e) => /AI Intake Classification/.test(e.body));
  if (!note) return {};
  const body = note.body.replace(/\*/g, "");
  const sev = body.match(/Severity:\s*([A-Za-z]+)/)?.[1]?.toLowerCase();
  const lines = body.split("\n").map((l) => l.trim());
  const i = lines.findIndex((l) => /^Issue:/.test(l));
  let issue: string | undefined;
  if (i >= 0) {
    const same = lines[i].replace(/^Issue:\s*/, "");
    issue = same || lines.slice(i + 1).find((l) => l && !/^Severity:/.test(l));
  }
  return { severity: sev, issue };
}

// Outcome-based overrides for resolved_without_contractor (read from Outcome text; label only)
// Rule: true when tenant or landlord handled it with no Dwelly-dispatched contractor doing the work.
const RWC_OVERRIDE: Record<string, boolean> = {
  "047": true, // landlord arranged his own contractor (same treatment as 041/045): no Dwelly-dispatched contractor
};

export function buildLabel(id: string): CaseLabel | null {
  const c = loadCase(TRACK, id);
  if (!c) return null;
  const h = c.history;
  const all = h.map((e) => e.body).join("\n");
  const outcome = (c.sections["Outcome"] ?? "") + " " + (c.sections["Overview"] ?? "");

  const approvalSignals = [
    /Please complete landlord approval step first/i,
    /Reason: Waiting for Landlord/i,
    /Landlord approval confirmed/i,
    /Quote was approved by landlord/i,
  ].filter((r) => r.test(all)).map(String);

  const noPayment = /completed without payment/i.test(all);
  const providerAssigned = /maintenance provider assigned/i.test(all);
  const selfOrLandlord = /tenant (?:fixed|found|replaced|cleared|resolved|tried)|tenants fixed|landlord (?:confirmed that (?:he|the)|sorted|resolved|completed)|LL completed|without a contractor|found the switch|settling|replaced the faulty/i.test(outcome + all);
  const rwc = id in RWC_OVERRIDE ? RWC_OVERRIDE[id] : noPayment && !providerAssigned || (noPayment && selfOrLandlord && !/under warranty|at no charge|paid the contractor/i.test(outcome));

  const text = `${c.title}\n${c.sections["Initial request"] ?? ""}`.toLowerCase();
  const rule = RULES.find(([, r]) => r.test(text))?.[0];
  const category = CATEGORY_OVERRIDE[id] ?? rule ?? "other";
  const dw = parseDwelly(c);
  const it = inputText(c);

  return {
    case: id,
    title: c.title,
    property: c.details["Property"] ?? "",
    reporter_role: c.details["Source role"] ?? "",
    input_text: it.text,
    labels: {
      category,
      needs_landlord_approval: approvalSignals.length > 0,
      resolved_without_contractor: rwc,
      ...(dw.severity ? { dwelly_severity: dw.severity } : {}),
      ...(dw.issue ? { dwelly_issue: dw.issue } : {}),
    },
    evidence: {
      category_source: id in CATEGORY_OVERRIDE ? "override" : rule ? "rule" : "unplaced",
      approval_signals: approvalSignals,
      completed_without_payment: noPayment,
      provider_assigned: providerAssigned,
      self_or_landlord_signal: selfOrLandlord,
      used_first_tenant_message: it.usedExtra,
      outcome_excerpt: (c.sections["Outcome"] ?? "").slice(0, 300),
    },
  };
}

export function loadLabels(): CaseLabel[] {
  return JSON.parse(fs.readFileSync(OUT, "utf8"));
}

function main() {
  const labels: CaseLabel[] = [];
  for (let i = 1; i <= 50; i++) {
    const l = buildLabel(String(i).padStart(3, "0"));
    if (l) labels.push(l);
  }
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(labels, null, 2));

  const unplaced = labels.filter((l) => l.evidence.category_source === "unplaced");
  if (unplaced.length) console.log("UNPLACED (assign in CATEGORY_OVERRIDE):", unplaced.map((l) => `${l.case} ${l.title}`).join(" | "));
  const dist = (f: (l: CaseLabel) => string) => {
    const m: Record<string, number> = {};
    for (const l of labels) m[f(l)] = (m[f(l)] ?? 0) + 1;
    return m;
  };
  console.log(`wrote ${labels.length} labels -> ${OUT}`);
  console.log("category:", dist((l) => l.labels.category));
  console.log("needs_landlord_approval:", dist((l) => String(l.labels.needs_landlord_approval)));
  console.log("resolved_without_contractor:", dist((l) => String(l.labels.resolved_without_contractor)));
  console.log("dwelly_severity:", dist((l) => l.labels.dwelly_severity ?? "(none)"));
  console.log("with extra tenant message:", labels.filter((l) => l.evidence.used_first_tenant_message).length);
  console.log("\nREVIEW (no-payment cases):");
  for (const l of labels.filter((l) => l.evidence.completed_without_payment))
    console.log(`${l.case} rwc=${l.labels.resolved_without_contractor} provider=${l.evidence.provider_assigned} :: ${String(l.evidence.outcome_excerpt).slice(0, 110)}`);
  console.log("\nCATEGORIES:");
  for (const l of labels) console.log(`${l.case} ${l.labels.category.padEnd(24)} ${l.title}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === import.meta.filename) main();
