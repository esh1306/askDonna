// Usage: node runner/run-cases.ts --cases <dir> --out <ANSWERS dir> [--concurrency 3] [--only 1,4] [--dry-run]
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runTurn, summarize, type EveEvent, type TurnOutcome } from "./eve-client.ts";
import { resultJsonSchema } from "./output-schema.ts";
import { renderAnswer, renderReasoning, decisionLine, extractActions, extractUsage, type RenderCtx } from "./render.ts";

export interface Prepared {
  inputText: string;
  crmBefore?: unknown;
  /** Called after the run; returns the CRM snapshot to diff against crmBefore. */
  afterRun?: () => Promise<unknown> | unknown;
}
export type PrepareFn = (caseDir: string, caseNumber: string) => Promise<Prepared> | Prepared;

const SECTION_DROP = /^(outcome|overview)$/i;
const LINE_DROP = /^- \*\*(status|completed|updated):\*\*/i;

/** index.md minus Outcome/Overview sections (and outcome-leaking status lines). */
export function stripIndex(md: string): string {
  const out: string[] = [];
  let skipping = false;
  for (const line of md.split(/\r?\n/)) {
    const h = /^##\s+(.*?)\s*$/.exec(line);
    if (h) skipping = SECTION_DROP.test(h[1]!);
    if (skipping) continue;
    if (LINE_DROP.test(line)) continue;
    out.push(line);
  }
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

export async function defaultPrepare(caseDir: string, caseNumber: string): Promise<Prepared> {
  const read = async (f: string) => readFile(join(caseDir, f), "utf8").catch(() => "");
  const index = stripIndex(await read("index.md"));
  const history = (await read("history.md")).trim();
  const att = await readdir(join(caseDir, "attachments")).catch(() => [] as string[]);
  const parts = [
    `# Incoming case ${caseNumber}`,
    "",
    "## Case file",
    index || "(no index.md)",
    "",
    "## Event history",
    history || "(no history.md)",
    "",
    "## Attachments",
    att.length ? att.map((a) => `- attachments/${a}`).join("\n") : "(none)",
  ];
  return { inputText: parts.join("\n") };
}

let prepare: PrepareFn = defaultPrepare;
export function setPrepare(fn: PrepareFn): void {
  prepare = fn;
}

const naturalCmp = (a: string, b: string) => a.localeCompare(b, undefined, { numeric: true });

export async function discoverCases(dir: string): Promise<{ number: string; dir: string }[]> {
  const out: { number: string; dir: string }[] = [];
  for (const name of await readdir(dir)) {
    const p = join(dir, name);
    if (!(await stat(p)).isDirectory()) continue;
    const has = async (f: string) => stat(join(p, f)).then(() => true, () => false);
    if ((await has("index.md")) || (await has("history.md"))) out.push({ number: name, dir: p });
  }
  return out.sort((a, b) => naturalCmp(a.number, b.number));
}

export interface CaseSummary {
  case: string;
  decision: string;
  escalated: string;
  failures: number;
  durationSec: number;
  error?: string;
}

export async function processCase(
  c: { number: string; dir: string },
  outRoot: string,
  opts: { dryRun: boolean; fixture?: EveEvent[] },
): Promise<CaseSummary> {
  const outDir = join(outRoot, answerDirName(c.number));
  await mkdir(outDir, { recursive: true });
  const startedAt = new Date();
  let prepared: Prepared = { inputText: "" };
  let outcome: TurnOutcome = { events: [] };
  let error: string | undefined;
  let crmAfter: unknown;
  try {
    prepared = await prepare(c.dir, c.number);
    if (opts.dryRun) {
      outcome = { events: opts.fixture ?? [], sessionId: "dry-run-fixture" };
      summarize(outcome);
    } else {
      outcome = await runTurn(prepared.inputText, { outputSchema: resultJsonSchema });
    }
    error = outcome.error;
  } catch (e) {
    error = `runner exception: ${(e as Error).message}`;
  }
  try {
    if (prepared.afterRun) crmAfter = await prepared.afterRun();
  } catch (e) {
    error ??= `afterRun failed: ${(e as Error).message}`;
  }
  const finishedAt = new Date();
  const ctx: RenderCtx = {
    caseNumber: c.number,
    caseDir: c.dir,
    inputText: prepared.inputText,
    events: outcome.events,
    result: outcome.result,
    crmBefore: prepared.crmBefore,
    crmAfter,
    startedAt,
    finishedAt,
    error,
    sessionId: outcome.sessionId,
  };
  const ndjson = outcome.events.map((e) => JSON.stringify(e)).join("\n") + (outcome.events.length ? "\n" : "");
  const actions = extractActions(outcome.events);
  const failures =
    actions.filter((a) => a.settled && !a.ok).length + (Array.isArray(outcome.result?.failures) ? outcome.result.failures.length : 0) + (error ? 1 : 0);
  const summary: CaseSummary = {
    case: c.number,
    decision: error ? "FAILED" : outcome.result?.decision ?? "NONE",
    escalated: outcome.result?.escalation ? (outcome.result.escalation.needed ? "yes" : "no") : "n/a",
    failures,
    durationSec: (finishedAt.getTime() - startedAt.getTime()) / 1000,
    error,
  };
  await writeFile(join(outDir, "ANSWER.md"), renderAnswer(ctx));
  await writeFile(join(outDir, "REASONING.md"), renderReasoning(ctx));
  await writeFile(join(outDir, "events.ndjson"), ndjson);
  await writeFile(
    join(outDir, "run.json"),
    JSON.stringify(
      {
        ...summary,
        decisionLine: decisionLine(ctx),
        sessionId: outcome.sessionId,
        startedAt: startedAt.toISOString(),
        finishedAt: finishedAt.toISOString(),
        usage: extractUsage(outcome.events),
        eventCount: outcome.events.length,
        dryRun: opts.dryRun,
        result: outcome.result,
      },
      null,
      2,
    ),
  );
  return summary;
}

export function renderIndex(rows: CaseSummary[], dryRun: boolean): string {
  const L = ["# ANSWERS index", "", dryRun ? "_DRY RUN: rendered from a fixture, no agent was called._" : `Generated ${new Date().toISOString()}`, ""];
  L.push("| Case | Decision | Escalated | Failures | Duration (s) | Note |", "|---|---|---|---|---|---|");
  for (const r of rows) {
    L.push(`| [${r.case}](${r.case}/ANSWER.md) | ${r.decision} | ${r.escalated} | ${r.failures} | ${r.durationSec.toFixed(1)} | ${(r.error ?? "").replace(/\|/g, "\\|").replace(/\s+/g, " ").slice(0, 160)} |`);
  }
  L.push("");
  return L.join("\n");
}

function parseArgs(argv: string[]) {
  const a: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i]!;
    if (!t.startsWith("--")) continue;
    const k = t.slice(2);
    const nxt = argv[i + 1];
    if (nxt === undefined || nxt.startsWith("--")) a[k] = true;
    else {
      a[k] = nxt;
      i++;
    }
  }
  return a;
}

export async function main(argv = process.argv.slice(2)): Promise<void> {
  const args = parseArgs(argv);
  if (typeof args.cases !== "string" || typeof args.out !== "string") {
    console.error("Usage: node runner/run-cases.ts --cases <dir> --out <ANSWERS dir> [--concurrency 3] [--only 1,4] [--dry-run]");
    process.exit(2);
  }
  const casesDir = resolve(args.cases);
  const outRoot = resolve(args.out);
  const dryRun = args["dry-run"] === true;
  const concurrency = Math.max(1, Number(args.concurrency ?? 3) || 3);
  const only = typeof args.only === "string" ? new Set(args.only.split(",").map((s) => s.trim()).filter(Boolean)) : undefined;
  const norm = (s: string) => s.replace(/^0+(?=\d)/, "");

  let cases = await discoverCases(casesDir);
  if (only) {
    const o = new Set([...only].map(norm));
    cases = cases.filter((c) => o.has(norm(c.number)));
  }
  if (!cases.length) {
    console.error(`No cases found in ${casesDir}${only ? ` matching --only ${[...only].join(",")}` : ""}`);
    process.exit(1);
  }
  let fixture: EveEvent[] | undefined;
  if (dryRun) {
    const fx = join(fileURLToPath(new URL(".", import.meta.url)), "fixtures", "sample-events.ndjson");
    fixture = (await readFile(fx, "utf8")).split("\n").filter((l) => l.trim()).map((l) => JSON.parse(l));
  }
  await mkdir(outRoot, { recursive: true });
  console.log(`Processing ${cases.length} case(s), concurrency ${concurrency}${dryRun ? " (dry run)" : ""}`);

  const rows: CaseSummary[] = new Array(cases.length);
  let next = 0;
  const worker = async () => {
    while (next < cases.length) {
      const i = next++;
      const c = cases[i]!;
      try {
        rows[i] = await processCase(c, outRoot, { dryRun, fixture });
      } catch (e) {
        rows[i] = { case: c.number, decision: "FAILED", escalated: "n/a", failures: 1, durationSec: 0, error: `runner crash: ${(e as Error).message}` };
        await mkdir(join(outRoot, answerDirName(c.number)), { recursive: true }).catch(() => {});
        await writeFile(join(outRoot, answerDirName(c.number), "ANSWER.md"), `# Case ${c.number} - Answer\n\n## Decision\n\n**FAILED - ${(e as Error).message}**\n`).catch(() => {});
      }
      console.log(`[${c.number}] ${rows[i]!.decision}${rows[i]!.error ? ` (${rows[i]!.error})` : ""} in ${rows[i]!.durationSec.toFixed(1)}s`);
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, cases.length) }, worker));
  await writeFile(join(outRoot, "INDEX.md"), renderIndex(rows, dryRun));
  console.log(`Wrote ${join(outRoot, "INDEX.md")}`);
}

if (process.argv[1] && basename(process.argv[1]) === "run-cases.ts") {
  await main();
}

/** Submission format is ANSWERS/1/, ANSWERS/2/ ...: numeric case folders lose their leading zeros. */
export function answerDirName(caseNumber: string): string {
  return /^\d+$/.test(caseNumber) ? String(Number(caseNumber)) : caseNumber;
}
