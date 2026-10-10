// Usage: node practice/hard-report.ts -> docs/hardcases-eval.md
import fs from "node:fs";
import path from "node:path";
import { ROOT } from "./common.ts";

const dir = path.join(ROOT, "data", "hardcases-judge");
const rows: any[] = fs.existsSync(dir)
  ? fs
      .readdirSync(dir)
      .filter((f) => f.endsWith(".json"))
      .map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")))
      .sort((a, b) => Number(a.case) - Number(b.case))
  : [];
const n = rows.length;
const cnt = (v: string) => rows.filter((r) => r.verdict === v).length;
const mean = (k: string) => (n ? (rows.reduce((s, r) => s + (r.scores?.[k] ?? 0), 0) / n).toFixed(2) : "0");
let md = `# Hard-case rehearsal eval\n\nCases judged: ${n}. pass ${cnt("pass")} / partial ${cnt("partial")} / fail ${cnt("fail")}. Critical failures: ${rows.filter((r) => r.critical_failure).length}.\n\nMean scores: correct_outcome ${mean("correct_outcome")}, judgement_safety ${mean("judgement_safety")}, communication ${mean("communication")}.\n\n`;
md += `| Case | Theme | Verdict | Required met | Crit | Outcome | Safety | Comms | Prohibited hit |\n|---|---|---|---|---|---|---|---|---|\n`;
for (const r of rows) {
  const met = (r.required_met ?? []).filter(Boolean).length;
  md += `| ${r.case} | ${r.theme} | ${r.verdict} | ${met}/${(r.required_met ?? []).length} | ${r.critical_failure ? "YES" : "-"} | ${r.scores?.correct_outcome} | ${r.scores?.judgement_safety} | ${r.scores?.communication} | ${(r.prohibited_hit ?? []).join("; ") || "-"} |\n`;
}
md += `\n## Misses\n\n`;
const misses = rows.filter((r) => r.verdict !== "pass");
if (!misses.length) md += "None.\n";
for (const r of misses) {
  md += `### Case ${r.case} (${r.theme}) - ${r.verdict}${r.critical_failure ? " - CRITICAL" : ""}\n\n`;
  if ((r.red_flags_hit ?? []).length) md += `- Red flags: ${r.red_flags_hit.join("; ")}\n`;
  if ((r.prohibited_hit ?? []).length) md += `- Prohibited: ${r.prohibited_hit.join("; ")}\n`;
  md += `- ${r.reasoning}\n\n`;
}
fs.mkdirSync(path.join(ROOT, "docs"), { recursive: true });
fs.writeFileSync(path.join(ROOT, "docs", "hardcases-eval.md"), md);
console.log(`wrote docs/hardcases-eval.md (${n} cases)`);
