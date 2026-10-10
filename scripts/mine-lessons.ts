// Mine generalised lessons from the dataset's human operators.
// node scripts/mine-lessons.ts [--cases 001-035|all] [--reset-dataset-lessons] [--from-json data/lessons/lessons-001-035.json]
import fs from "node:fs";
import path from "node:path";
import { openDb } from "../crm/db.ts";
import { all, run } from "../crm/repo.ts";
import { loadCase } from "../crm/cases.ts";
import { addLesson, askClaude, jaccard, LESSON_SYSTEM, listLessons, parseLessonJson, words, type Lesson } from "../crm/lessons.ts";

const args = process.argv.slice(2);
const arg = (n: string) => {
  const i = args.indexOf(n);
  return i >= 0 ? args[i + 1] : undefined;
};
const range = arg("--cases") ?? "all";
const fromJson = arg("--from-json");
const reset = args.includes("--reset-dataset-lessons") || !!fromJson;
const TRIGGERS = ["landlord_reply", "tenant_reply", "contractor_reply", "contractor_completion", "invoice_received", "quote_received", "no_response", "reminders", "extraction_failed", "new_request"];

openDb();
listLessons({ limit: 1 }); // ensures the lessons table exists
if (reset) run("DELETE FROM lessons WHERE source='dataset'");

function inRange(c: string): boolean {
  if (range === "all") return true;
  const [a, b] = range.split("-").map(Number);
  const n = Number(c);
  return n >= a && n <= (b ?? a);
}
const dump = (rows: Lesson[]) => {
  fs.mkdirSync("data/lessons", { recursive: true });
  const file = `data/lessons/lessons-${range}.json`;
  fs.writeFileSync(file, JSON.stringify(rows, null, 2));
  return file;
};

type Dp = { id: string; case: string; cutoff: number; trigger: string; reference_events: { n: number; channel: string; from: string; to: string; body: string }[]; outcome?: string };
type Ev = { n: number; channel: string; from: string; to: string; body: string };
const fmt = (e: Ev, max: number) => `[event ${e.n}] ${e.channel} | ${e.from} -> ${e.to}\n${e.body.slice(0, max)}`;

async function mine() {
  const dps = (JSON.parse(fs.readFileSync("data/practice/decision-points.json", "utf8")) as Dp[]).filter((d) => inRange(d.case));
  console.log(`${dps.length} decision points in ${range}`);
  let next = 0;
  let done = 0;
  let failed = 0;
  async function worker() {
    while (next < dps.length) {
      const dp = dps[next++];
      try {
        const c = loadCase("Property Management", dp.case);
        if (!c) throw new Error("case not found");
        const before = (c.history as Ev[]).filter((e) => e.n <= dp.cutoff).slice(-8);
        const prompt =
          `Case title: ${c.title}\n\nHistory up to the decision point:\n${before.map((e) => fmt(e, 700)).join("\n\n")}\n\n` +
          `What the human operator did next:\n${dp.reference_events.slice(0, 5).map((e) => fmt(e, 700)).join("\n\n")}\n\n` +
          `Dataset label for the moment: ${dp.trigger}\nTrigger must be exactly one of: ${TRIGGERS.join(", ")}.\nWrite ONE generalised lesson JSON.`;
        const d = parseLessonJson(await askClaude(LESSON_SYSTEM, prompt, 600));
        if (!d) throw new Error("unparseable");
        if (d.trigger && !TRIGGERS.includes(d.trigger)) d.trigger = null;
        addLesson({ ...d, source: "dataset", source_ref: `PM${dp.case} event ${dp.reference_events[0]?.n ?? dp.cutoff + 1}` });
      } catch (e) {
        failed++;
        console.error(`  ${dp.id}: ${e instanceof Error ? e.message : e}`);
      }
      if (++done % 10 === 0) console.log(`  ${done}/${dps.length}`);
    }
  }
  await Promise.all(Array.from({ length: 6 }, worker));
  console.log(`mined, ${failed} failed`);
}

function dedupe() {
  const rows = all<Lesson>("SELECT * FROM lessons WHERE source='dataset' ORDER BY id");
  const sig = new Map(rows.map((l) => [l.id, words(`${l.situation} ${l.action}`)]));
  const gone = new Set<number>();
  let merged = 0;
  for (const a of rows) {
    if (gone.has(a.id)) continue;
    for (const b of rows) {
      if (b.id <= a.id || gone.has(b.id)) continue;
      if (jaccard(sig.get(a.id)!, sig.get(b.id)!) >= 0.6) {
        gone.add(b.id);
        merged++;
        run("UPDATE lessons SET weight=weight+?, source_ref=source_ref||'; '||? WHERE id=?", b.weight, b.source_ref ?? "", a.id);
        run("DELETE FROM lessons WHERE id=?", b.id);
      }
    }
  }
  console.log(`dedupe: merged ${merged}`);
}

if (fromJson) {
  const rows = JSON.parse(fs.readFileSync(fromJson, "utf8")) as Lesson[];
  for (const l of rows) addLesson({ situation: l.situation, trigger: l.trigger, stage: l.stage, category: l.category, action: l.action, rationale: l.rationale, source: "dataset", source_ref: l.source_ref, weight: l.weight });
  console.log(`imported ${rows.length} lessons from ${fromJson}`);
} else {
  await mine();
  dedupe();
}

const rows = listLessons({ source: "dataset", limit: 5000 }).sort((a, b) => a.id - b.id);
if (!fromJson) {
  const file = dump(rows);
  const byTrigger: Record<string, number> = {};
  for (const l of rows) byTrigger[l.trigger ?? "(none)"] = (byTrigger[l.trigger ?? "(none)"] ?? 0) + 1;
  const examples = [...rows].sort((a, b) => b.weight - a.weight).filter((l) => l.trigger).slice(0, 10);
  const md = `# Learning from humans

Donna improves by learning how the team's human operators actually handle maintenance tickets. This is a loop of four steps: mine, capture, recall, vote.

## The loop

1. **Mined from the dataset.** \`scripts/mine-lessons.ts\` takes every decision point in \`data/practice/decision-points.json\` (the moment the agent would act, plus the events the human did next). It sends the last ~8 events before the cutoff and the human's next events to Claude Sonnet, which writes one generalised lesson: situation, trigger, stage, category, action, rationale, with no names, addresses or amounts. Near-duplicates (Jaccard >= 0.6 on situation plus action) are merged and the survivor's weight goes up. Results are stored in the \`lessons\` table (source \`dataset\`).
2. **Captured from live humans.** When an employee acts in the console (assigns a contractor, resolves an escalation, approves, sends a message, or rejects/edits a suggestion), \`learnFromHumanAction\` snapshots the ticket, asks Claude to explain the action as a reusable lesson, and stores it (source \`human\` or \`feedback\`). The action is also written to \`action_log\` with actor \`human\`.
3. **Recalled by the agent.** Before deciding, Donna calls the \`recall_lessons\` tool. Scoring is deterministic: stage match +2, trigger match +2, category match +1, plus keyword overlap (Jaccard x 5), all multiplied by (0.5 + weight/(weight+2)). The top 5 with score > 0 come back with ids; Donna follows a lesson when it fits, cites its id, and says when it deviates. Set \`DONNA_LESSONS=0\` to switch recall off (for before/after comparisons).
4. **Voted.** Employees accept (+1) or reject (-1) a lesson in the console; weight never drops below 0, so bad lessons fade and good ones rise.

A companion tool, \`find_contractors\`, ranks contractors by history at the property, jobs in the same category, and trade-name match, so Donna can pick one when approval arrives without a named provider.

## Mined lessons (${range})

Total after dedupe: **${rows.length}** (file: \`${file}\`).

| Trigger | Lessons |
|---|---|
${Object.entries(byTrigger).sort((a, b) => b[1] - a[1]).map(([k, v]) => `| ${k} | ${v} |`).join("\n")}

## Ten example lessons

${examples.map((l, i) => `${i + 1}. **${l.trigger}** / ${l.stage ?? "any stage"} / ${l.category ?? "any category"} (weight ${l.weight}, ${l.source_ref})\n   - Situation: ${l.situation}\n   - Action: ${l.action}\n   - Why: ${l.rationale}`).join("\n")}
`;
  fs.writeFileSync("docs/learning.md", md);
  console.log(`wrote ${file} and docs/learning.md (${rows.length} lessons)`);
}
