import fs from "node:fs";
import path from "node:path";
import { buildRequest, classifyIntake, decideRoute, getApiKey, MissingKeyError, type IntakeResult } from "./classify.ts";
import { loadLabels, type CaseLabel } from "./labels.ts";
import { CATEGORY_KEYS, type Category } from "./taxonomy.ts";

const ROOT = path.resolve(import.meta.dirname, "..");
const args = process.argv.slice(2);
const flag = (n: string) => args.includes(n);
const opt = (n: string) => {
  const i = args.indexOf(n);
  return i >= 0 ? args[i + 1] : undefined;
};

function stateFor(l: CaseLabel) {
  return { request: l.input_text, property: l.property || undefined, reporter_role: l.reporter_role || undefined };
}

export type BinaryReport = {
  name: string;
  n: number;
  accuracy: number;
  precision: number;
  recall: number;
  brier: number;
  base_rate: number;
  tp: number;
  fp: number;
  tn: number;
  fn: number;
  calibration: { bucket: string; n: number; mean_pred: number; frac_true: number }[];
};

export function binaryReport(name: string, rows: { p: number; y: boolean }[]): BinaryReport {
  let tp = 0, fp = 0, tn = 0, fn = 0, brier = 0;
  for (const { p, y } of rows) {
    const pred = p >= 0.5;
    if (pred && y) tp++;
    else if (pred && !y) fp++;
    else if (!pred && y) fn++;
    else tn++;
    brier += (p - (y ? 1 : 0)) ** 2;
  }
  const n = rows.length || 1;
  const calibration = [0, 1, 2, 3, 4].map((b) => {
    const r = rows.filter(({ p }) => Math.min(4, Math.floor(p * 5)) === b);
    return {
      bucket: `${(b * 0.2).toFixed(1)}-${((b + 1) * 0.2).toFixed(1)}`,
      n: r.length,
      mean_pred: r.length ? r.reduce((a, x) => a + x.p, 0) / r.length : 0,
      frac_true: r.length ? r.filter((x) => x.y).length / r.length : 0,
    };
  });
  return {
    name,
    n: rows.length,
    accuracy: (tp + tn) / n,
    precision: tp + fp ? tp / (tp + fp) : 0,
    recall: tp + fn ? tp / (tp + fn) : 0,
    brier: brier / n,
    base_rate: rows.filter((r) => r.y).length / n,
    tp, fp, tn, fn,
    calibration,
  };
}

async function pool<T, R>(items: T[], size: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: size }, async () => {
      while (i < items.length) {
        const k = i++;
        out[k] = await fn(items[k]);
      }
    }),
  );
  return out;
}

/** Tune split = cases 001-035 (used for prompt/threshold choices); held-out = 036-050 (never looked at while tuning). */
export const splitOf = (c: string): "tune" | "heldout" => (Number(c) <= 35 ? "tune" : "heldout");

function sweep(rows: { p: number; y: boolean }[]) {
  return [0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9].map((t) => {
    const ok = rows.filter(({ p, y }) => p >= t === y).length;
    return { t, acc: rows.length ? ok / rows.length : 0 };
  });
}

const pct = (x: number) => `${(x * 100).toFixed(1)}%`;

function renderMd(summary: any): string {
  const L: string[] = [];
  L.push("# Intake classification eval (Jev)", "");
  L.push(`Run: ${summary.ran_at}  |  cases: ${summary.n}  |  model: jev-latest  |  mean latency: ${summary.mean_latency_ms}ms (p95 ${summary.p95_latency_ms}ms)`, "");
  L.push("Labels come from `data/intake-labels.json` (derived from case outcomes/history, not from the classifier input). Input text is only the initial request (+ first pre-dispatch tenant message).", "");
  L.push("## Category", "", `Accuracy: **${pct(summary.category.accuracy)}** (${summary.category.correct}/${summary.n})`, "");
  const used = CATEGORY_KEYS.filter((k) => summary.category.confusion[k] || CATEGORY_KEYS.some((j) => summary.category.confusion[j]?.[k]));
  L.push("Confusion matrix (rows = label, columns = predicted):", "");
  L.push(`| label \\ pred | ${used.join(" | ")} |`, `|---|${used.map(() => "---").join("|")}|`);
  for (const r of used) L.push(`| ${r} | ${used.map((c) => summary.category.confusion[r]?.[c] ?? 0).join(" | ")} |`);
  L.push("");
  L.push("## Split results (tune = cases 001-035, held-out = 036-050, all = 50)", "");
  L.push("| question | metric | tune | held-out | all |", "|---|---|---|---|---|");
  for (const r of summary.splits) L.push(`| ${r.q} | ${r.metric} | ${r.tune} | ${r.heldout} | ${r.all} |`);
  L.push("");
  L.push("Accuracy by decision threshold (tune / held-out / all):", "", "| question | " + [0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9].join(" | ") + " |", "|---|---|---|---|---|---|---|---|");
  for (const sw of summary.sweeps) L.push(`| ${sw.q} | ${sw.cells.join(" | ")} |`);
  L.push("");
  for (const b of summary.binary) {
    L.push(`## ${b.name}`, "");
    L.push(`n=${b.n}, base rate ${pct(b.base_rate)}, accuracy@0.5 **${pct(b.accuracy)}**, precision ${pct(b.precision)}, recall ${pct(b.recall)}, Brier ${b.brier.toFixed(3)} (always-base-rate baseline ${(b.base_rate * (1 - b.base_rate)).toFixed(3)})`, "");
    L.push(`TP ${b.tp} / FP ${b.fp} / TN ${b.tn} / FN ${b.fn}`, "");
    L.push("| bucket | n | mean predicted | fraction true |", "|---|---|---|---|");
    for (const c of b.calibration) L.push(`| ${c.bucket} | ${c.n} | ${c.n ? c.mean_pred.toFixed(2) : "-"} | ${c.n ? c.frac_true.toFixed(2) : "-"} |`);
    L.push("");
  }
  L.push("## Unlabelled questions (mean predicted probability)", "");
  L.push(`safety_risk: ${summary.mean.safety_risk.toFixed(3)}, needs_more_info: ${summary.mean.needs_more_info.toFixed(3)}. No ground truth exists for these in the cases; Dwelly rated every case with an intake note ROUTINE.`, "");
  L.push("## Severity vs Dwelly's own intake classification", "");
  L.push(`Cases with a Dwelly severity: ${summary.severity.n}. Agreement: **${pct(summary.severity.agreement)}**. Predicted severity distribution (all cases): ${JSON.stringify(summary.severity.predicted_distribution)}`, "");
  L.push("## Routes", "", JSON.stringify(summary.routes), "");
  L.push("## Worst misses", "");
  L.push("| case | question | label | predicted | confidence in label | note |", "|---|---|---|---|---|---|");
  for (const m of summary.worst) L.push(`| ${m.case} | ${m.question} | ${m.label} | ${m.predicted} | ${m.p_label.toFixed(2)} | ${m.title} |`);
  L.push("");
  if (summary.errors?.length) L.push("## Errors", "", ...summary.errors.map((e: string) => `- ${e}`), "");
  return L.join("\n");
}

async function main() {
  let labels = loadLabels();
  const only = opt("--case");
  if (only) labels = labels.filter((l) => l.case === only.padStart(3, "0"));
  const lim = opt("--limit");
  if (lim) labels = labels.slice(0, Number(lim));
  if (!labels.length) {
    console.error("No matching cases (run `node intake/labels.ts` first?)");
    process.exit(1);
  }

  if (flag("--dry-run")) {
    console.log(JSON.stringify(buildRequest(stateFor(labels[0])), null, 2));
    return;
  }

  try {
    getApiKey();
  } catch (e) {
    if (e instanceof MissingKeyError) {
      console.error(`${e.message}\nNo evaluation run.`);
      process.exit(0);
    }
    throw e;
  }

  const errors: string[] = [];
  const results = await pool(labels, 5, async (l) => {
    try {
      return await classifyIntake(stateFor(l));
    } catch (e) {
      errors.push(`${l.case}: ${(e as Error).message}`);
      return null;
    }
  });
  const rows = labels.map((l, i) => ({ l, r: results[i] })).filter((x): x is { l: CaseLabel; r: IntakeResult } => x.r !== null);

  // category
  const confusion: Record<string, Record<string, number>> = {};
  let correct = 0;
  for (const { l, r } of rows) {
    const t = l.labels.category as Category;
    (confusion[t] ??= {})[r.category] = (confusion[t][r.category] ?? 0) + 1;
    if (t === r.category) correct++;
  }

  const binary = [
    binaryReport("needs_landlord_approval", rows.map(({ l, r }) => ({ p: r.needs_landlord_approval, y: l.labels.needs_landlord_approval }))),
    binaryReport("likely_self_fixable (label: resolved_without_contractor)", rows.map(({ l, r }) => ({ p: r.likely_self_fixable, y: l.labels.resolved_without_contractor }))),
  ];

  const sub = (f: (c: string) => boolean) => rows.filter(({ l }) => f(l.case));
  const parts = { tune: sub((c) => splitOf(c) === "tune"), heldout: sub((c) => splitOf(c) === "heldout"), all: rows };
  const defs: { q: string; get: (x: { l: CaseLabel; r: IntakeResult }) => { p: number; y: boolean } }[] = [
    { q: "needs_landlord_approval", get: ({ l, r }) => ({ p: r.needs_landlord_approval, y: l.labels.needs_landlord_approval }) },
    { q: "likely_self_fixable", get: ({ l, r }) => ({ p: r.likely_self_fixable, y: l.labels.resolved_without_contractor }) },
  ];
  const splits: { q: string; metric: string; tune: string; heldout: string; all: string }[] = [];
  const catAcc = (rs: typeof rows) => rs.filter(({ l, r }) => l.labels.category === r.category).length;
  splits.push({ q: "category", metric: "accuracy", ...(Object.fromEntries(Object.entries(parts).map(([k, rs]) => [k, `${pct(catAcc(rs) / (rs.length || 1))} (${catAcc(rs)}/${rs.length})`])) as any) });
  const sweeps: { q: string; cells: string[] }[] = [];
  for (const d of defs) {
    const reps = Object.fromEntries(Object.entries(parts).map(([k, rs]) => [k, binaryReport(d.q, rs.map(d.get))])) as Record<string, BinaryReport>;
    for (const [metric, f] of [["accuracy@0.5", (b: BinaryReport) => pct(b.accuracy)], ["precision@0.5", (b: BinaryReport) => pct(b.precision)], ["recall@0.5", (b: BinaryReport) => pct(b.recall)], ["Brier (base-rate baseline)", (b: BinaryReport) => `${b.brier.toFixed(3)} (${(b.base_rate * (1 - b.base_rate)).toFixed(3)})`]] as const)
      splits.push({ q: d.q, metric, tune: f(reps.tune), heldout: f(reps.heldout), all: f(reps.all) });
    const sw = Object.fromEntries(Object.entries(parts).map(([k, rs]) => [k, sweep(rs.map(d.get))]));
    sweeps.push({ q: d.q, cells: sw.all.map((_, i) => `${pct(sw.tune[i].acc)} / ${pct(sw.heldout[i].acc)} / ${pct(sw.all[i].acc)}`) });
  }

  const withSev = rows.filter(({ l }) => l.labels.dwelly_severity);
  const agree = withSev.filter(({ l, r }) => l.labels.dwelly_severity === r.severity).length;
  const sevDist: Record<string, number> = {};
  const routes: Record<string, number> = {};
  for (const { r } of rows) {
    sevDist[r.severity] = (sevDist[r.severity] ?? 0) + 1;
    const rt = decideRoute(r);
    routes[rt] = (routes[rt] ?? 0) + 1;
  }

  const misses: any[] = [];
  for (const { l, r } of rows) {
    const t = l.labels.category as Category;
    if (t !== r.category) misses.push({ case: l.case, question: "category", label: t, predicted: r.category, p_label: r.category_probs[t] ?? 0, title: l.title });
    const bin = (q: string, p: number, y: boolean) => {
      if (p >= 0.5 !== y) misses.push({ case: l.case, question: q, label: String(y), predicted: `p=${p.toFixed(2)}`, p_label: y ? p : 1 - p, title: l.title });
    };
    bin("needs_landlord_approval", r.needs_landlord_approval, l.labels.needs_landlord_approval);
    bin("self_fixable", r.likely_self_fixable, l.labels.resolved_without_contractor);
    if (l.labels.dwelly_severity && l.labels.dwelly_severity !== r.severity)
      misses.push({ case: l.case, question: "severity", label: l.labels.dwelly_severity, predicted: r.severity, p_label: r.severity_probs[l.labels.dwelly_severity as keyof typeof r.severity_probs] ?? 0, title: l.title });
  }
  misses.sort((a, b) => a.p_label - b.p_label);

  const lat = rows.map(({ r }) => r.latencyMs).sort((a, b) => a - b);
  const mean = (f: (r: IntakeResult) => number) => (rows.length ? rows.reduce((a, x) => a + f(x.r), 0) / rows.length : 0);
  const summary = {
    ran_at: new Date().toISOString(),
    n: rows.length,
    mean_latency_ms: Math.round(mean((r) => r.latencyMs)),
    p95_latency_ms: lat[Math.min(lat.length - 1, Math.floor(lat.length * 0.95))] ?? 0,
    category: { accuracy: rows.length ? correct / rows.length : 0, correct, confusion },
    binary,
    splits,
    sweeps,
    mean: { safety_risk: mean((r) => r.safety_risk), needs_more_info: mean((r) => r.needs_more_info) },
    severity: { n: withSev.length, agreement: withSev.length ? agree / withSev.length : 0, predicted_distribution: sevDist },
    routes,
    worst: misses.slice(0, 15),
    errors,
  };

  fs.mkdirSync(path.join(ROOT, "data"), { recursive: true });
  fs.mkdirSync(path.join(ROOT, "docs"), { recursive: true });
  const detail = rows.map(({ l, r }) => ({ case: l.case, labels: l.labels, result: { ...r, route: decideRoute(r) } }));
  fs.writeFileSync(path.join(ROOT, "data/intake-eval.json"), JSON.stringify({ summary, cases: detail }, null, 2));
  // Keep the hand-written "## Iterations" (and anything after it) across regenerations.
  let tail = "";
  try {
    const old = fs.readFileSync(path.join(ROOT, "docs/intake-eval.md"), "utf8");
    const i = old.indexOf("\n## Iterations");
    if (i >= 0) tail = old.slice(i);
  } catch {}
  const md = renderMd(summary) + tail;
  fs.writeFileSync(path.join(ROOT, "docs/intake-eval.md"), md);
  console.log(md);
  console.log(`\nwrote data/intake-eval.json and docs/intake-eval.md`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === import.meta.filename) {
  await main();
}
