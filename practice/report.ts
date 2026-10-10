// Usage: node practice/report.ts  -> docs/practice-eval.md + data/practice/report.json
import fs from "node:fs";
import path from "node:path";
import { JUDGE_DIR, PRACTICE_DIR, ROOT } from "./common.ts";

const rows: any[] = fs.existsSync(JUDGE_DIR)
  ? fs
      .readdirSync(JUDGE_DIR)
      .filter((f) => f.endsWith(".json"))
      .sort()
      .map((f) => JSON.parse(fs.readFileSync(path.join(JUDGE_DIR, f), "utf8")))
  : [];
const n = rows.length;
const count = (v: string) => rows.filter((r) => r.verdict === v).length;
const mean = (k: string) => (n ? rows.reduce((s, r) => s + (r.scores?.[k] ?? 0), 0) / n : 0);
const flags: Record<string, number> = {};
for (const r of rows) {
  for (const f of [...(r.red_flags ?? []), ...(r.prohibited_actions ?? [])]) {
    const k = String(f).toLowerCase().slice(0, 90);
    flags[k] = (flags[k] ?? 0) + 1;
  }
}
const byTrigger: Record<string, { n: number; pass: number }> = {};
for (const r of rows) {
  const t = (byTrigger[r.trigger] ??= { n: 0, pass: 0 });
  t.n++;
  if (r.verdict === "pass") t.pass++;
}
const failures = rows.filter((r) => r.verdict === "fail" || r.critical_failure);
const report = {
  generated: new Date().toISOString(),
  judged: n,
  verdicts: { pass: count("pass"), partial: count("partial"), fail: count("fail") },
  critical_failures: rows.filter((r) => r.critical_failure).length,
  required_outcome_met: rows.filter((r) => r.required_outcome_met).length,
  mean_scores: { correct_outcome: mean("correct_outcome"), judgement_safety: mean("judgement_safety"), actions_valid: mean("actions_valid") },
  by_trigger: byTrigger,
  common_red_flags: Object.entries(flags).sort((a, b) => b[1] - a[1]).slice(0, 15),
  failures: failures.map((r) => ({ id: r.id, case: r.case, critical: r.critical_failure, reason: String(r.reasoning ?? "").split(/(?<=[.!?])\s/)[0] })),
};
fs.mkdirSync(PRACTICE_DIR, { recursive: true });
fs.writeFileSync(path.join(PRACTICE_DIR, "report.json"), JSON.stringify(report, null, 2));

const L = ["# Practice evaluation (50 PM cases, judged at handoff decision points)", "", `Generated ${report.generated}`, ""];
if (!n) {
  L.push("No judge results yet. Run `node practice/run.ts`, then `node practice/judge.ts`, then `node practice/report.ts`.", "");
} else {
  const v = report.verdicts;
  L.push(`Judged: **${n}** | pass ${v.pass} | partial ${v.partial} | fail ${v.fail} | critical failures ${report.critical_failures} | required outcome met ${report.required_outcome_met}`, "");
  L.push("## Mean scores (0-5)", "");
  L.push(`- correct_outcome: ${report.mean_scores.correct_outcome.toFixed(2)}`, `- judgement_safety: ${report.mean_scores.judgement_safety.toFixed(2)}`, `- actions_valid: ${report.mean_scores.actions_valid.toFixed(2)}`, "");
  L.push("## By trigger", "", "| Trigger | N | Pass |", "|---|---|---|");
  for (const [k, t] of Object.entries(byTrigger)) L.push(`| ${k} | ${t.n} | ${t.pass} |`);
  L.push("", "## Failures and critical failures", "");
  L.push(...(failures.length ? failures.map((f) => `- **${f.id}**${f.critical ? " (CRITICAL)" : ""}: ${f.reason}`) : ["None."]), "");
  L.push("## Common red flags and prohibited actions", "");
  L.push(...(report.common_red_flags.length ? report.common_red_flags.map(([k, c]) => `- (${c}x) ${k}`) : ["None."]), "");
}
fs.mkdirSync(path.join(ROOT, "docs"), { recursive: true });
fs.writeFileSync(path.join(ROOT, "docs", "practice-eval.md"), L.join("\n"));
console.log(n ? `Report: ${n} judged, pass ${report.verdicts.pass} partial ${report.verdicts.partial} fail ${report.verdicts.fail}` : "No judge results; wrote empty report.");
