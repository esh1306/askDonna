// Usage: node practice/run.ts [--limit N] [--ids PM001-1,PM005-2 | 001,002] [--concurrency 3] [--dry-run]
// The agent sees ONLY events up to each decision point's cutoff (no Outcome/Overview).
// Tickets are imported into a SEPARATE CRM db (data/practice/practice.db). The eve server MUST be started
// with the same CRM_DB, otherwise its tools will not find the ticket:
//   CRM_DB=data/practice/practice.db <your usual eve start command>
import fs from "node:fs";
import path from "node:path";
import { ANSWERS_DIR, CASES_TMP, PM_DIR, ROOT, loadDps, parseArgs, selectDps, type DecisionPoint } from "./common.ts";

process.env.CRM_DB = path.resolve(ROOT, process.env.PRACTICE_CRM_DB ?? "data/practice/practice.db");
process.env.CASES_DIR ??= path.resolve(PM_DIR, "..");

const { processCase, setPrepare } = await import("../runner/run-cases.ts");
const { crmPrepare } = await import("../runner/prepare-crm.ts");

/** Copy a case with history truncated to the first `cutoff` events. */
export function buildTempCase(dp: DecisionPoint): string {
  const src = path.join(PM_DIR, dp.case);
  const dst = path.join(CASES_TMP, dp.id);
  fs.rmSync(dst, { recursive: true, force: true });
  fs.mkdirSync(dst, { recursive: true });
  // index.md lists every attachment, including ones that only arrive after the cutoff: drop that section.
  const index = fs.readFileSync(path.join(src, "index.md"), "utf8").replace(/\r\n/g, "\n");
  fs.writeFileSync(path.join(dst, "index.md"), index.replace(/^## Attachments\n[\s\S]*?(?=^## |(?![\s\S]))/m, ""));
  const hist = fs.readFileSync(path.join(src, "history.md"), "utf8").replace(/\r\n/g, "\n");
  const parts = hist.split(/(?=<a id="event-\d+"><\/a>\n)/);
  const head = parts[0]!.replace(/Total events: \d+/, `Total events: ${dp.cutoff}`);
  const visible = head + parts.slice(1, 1 + dp.cutoff).join("");
  fs.writeFileSync(path.join(dst, "history.md"), visible);
  // Only attachments already referenced by a visible event existed at the decision point.
  const referenced = new Set([...visible.matchAll(/\(attachments\/([^)]+)\)/g)].map((m) => m[1]!));
  if (referenced.size) {
    fs.mkdirSync(path.join(dst, "attachments"), { recursive: true });
    for (const name of referenced) {
      const f = path.join(src, "attachments", name);
      if (fs.existsSync(f)) fs.copyFileSync(f, path.join(dst, "attachments", name));
    }
  }
  return dst;
}

const args = parseArgs(process.argv.slice(2));
const dryRun = args["dry-run"] === true;
const concurrency = Math.max(1, Number(args.concurrency ?? 3) || 3);
const sel = selectDps(loadDps(), args);
if (!sel.length) {
  console.error("No decision points selected.");
  process.exit(1);
}

if (!dryRun) {
  const base = process.env.EVE_URL ?? "http://127.0.0.1:2000";
  try {
    await fetch(base, { signal: AbortSignal.timeout(4000) });
  } catch {
    console.error(`Cannot reach the eve server at ${base}. Start it first with the practice DB:\n  CRM_DB=data/practice/practice.db <eve start command>\n(or use --dry-run to test the plumbing).`);
    process.exit(1);
  }
}
setPrepare(crmPrepare);
let fixture: any[] | undefined;
if (dryRun) {
  const fx = path.join(ROOT, "runner", "fixtures", "sample-events.ndjson");
  fixture = fs.readFileSync(fx, "utf8").split("\n").filter((l) => l.trim()).map((l) => JSON.parse(l));
}
fs.mkdirSync(ANSWERS_DIR, { recursive: true });
console.log(`Running ${sel.length} decision point(s), concurrency ${concurrency}${dryRun ? " (dry run)" : ""}; CRM_DB=${process.env.CRM_DB}`);
let next = 0;
const worker = async () => {
  while (next < sel.length) {
    const dp = sel[next++]!;
    try {
      const dir = buildTempCase(dp);
      const r = await processCase({ number: dp.id, dir }, ANSWERS_DIR, { dryRun, fixture });
      console.log(`[${dp.id}] cutoff=${dp.cutoff} ${r.decision}${r.error ? ` (${r.error})` : ""} ${r.durationSec.toFixed(1)}s`);
    } catch (e) {
      console.error(`[${dp.id}] crash: ${(e as Error).message}`);
    }
  }
};
await Promise.all(Array.from({ length: Math.min(concurrency, sel.length) }, worker));
console.log(`Answers in ${ANSWERS_DIR}`);
