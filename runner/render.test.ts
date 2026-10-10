import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { renderAnswer, renderReasoning, diffObjects, displayPath, type RenderCtx } from "./render.ts";
import { summarize, type EveEvent } from "./eve-client.ts";
import { resultSchema } from "./output-schema.ts";

const events: EveEvent[] = readFileSync(new URL("./fixtures/sample-events.ndjson", import.meta.url), "utf8")
  .split("\n")
  .filter(Boolean)
  .map((l) => JSON.parse(l));
const out = { events } as any;
summarize(out);

const base = (over: Partial<RenderCtx> = {}): RenderCtx => ({
  caseNumber: "003",
  caseDir: "/x/003",
  inputText: "hello input",
  events,
  result: out.result,
  startedAt: "2026-10-10T16:30:00.000Z",
  finishedAt: "2026-10-10T16:30:12.000Z",
  ...over,
});

test("fixture result matches the output schema", () => {
  assert.equal(resultSchema.safeParse(out.result).success, true);
  assert.equal(out.error, undefined);
});

test("ANSWER contains decision, failed action and usage", () => {
  const md = renderAnswer(base());
  assert.match(md, /\*\*act\*\*/);
  assert.match(md, /`schedule_follow_up`[^\n]*FAILED: Scheduler unavailable/);
  assert.match(md, /`send_message`[^\n]*ok/);
  assert.match(md, /Tokens: in 7700 \/ out 940; cost: \$0.0412/);
  assert.match(md, /## What could not be verified/);
});

test("REASONING includes reasoning, narration, tool trace and CRM diff", () => {
  const md = renderReasoning(base({ crmBefore: { a: 1, s: "open" }, crmAfter: { a: 1, s: "closed" } }));
  assert.match(md, /check the CRM for the approved estimate/);
  assert.match(md, /Narration:\*\* Checking the CRM/);
  assert.match(md, /result \(\*\*FAILED\*\*\)/);
  assert.match(md, /changed `s`: open -> closed/);
});

test("missing result: no invented decision", () => {
  const noResult = events.filter((e) => e.type !== "result.completed");
  const md = renderAnswer(base({ events: noResult, result: undefined }));
  assert.match(md, /NO STRUCTURED DECISION/);
  assert.doesNotMatch(md, /\*\*act\*\*/);
  assert.doesNotMatch(md, /Awaiting landlord payment/);
  assert.match(md, /Not available/);
});

test("errored run is marked FAILED and states the error", () => {
  const md = renderAnswer(base({ events: [], result: undefined, error: "HTTP 500 boom" }));
  assert.match(md, /\*\*FAILED - HTTP 500 boom\*\*/);
  assert.match(md, /No tool calls were recorded/);
  const r = renderReasoning(base({ events: [], result: undefined, error: "HTTP 500 boom" }));
  assert.match(r, /No events were recorded/);
});

test("turn.failed in stream becomes error via summarize", () => {
  const o: any = { events: [{ type: "turn.failed", data: { code: "MODEL_CALL_FAILED", message: "no key" }, meta: {} }] };
  summarize(o);
  assert.match(o.error, /MODEL_CALL_FAILED/);
});

test("diffObjects", () => {
  assert.deepEqual(diffObjects({ a: 1 }, { a: 1 }), []);
  assert.equal(diffObjects({ a: 1 }, { a: 1, b: 2 }).length, 1);
});

test("case folder is printed relative to the project root, not absolute", () => {
  const abs = process.cwd() + "/data/hardcases/13";
  assert.equal(displayPath(abs), "data/hardcases/13");
  assert.equal(displayPath("/elsewhere/case-9", "/root/proj"), "case-9");
  const md = renderAnswer(base({ caseDir: abs }));
  assert.ok(md.includes("Case folder: `data/hardcases/13`"));
  assert.ok(!md.includes(process.cwd()));
});
