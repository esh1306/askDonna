import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import fs from "node:fs";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "lessons-test-"));
process.env.CRM_DB = path.join(tmp, "test.db");

const { openDb, closeDb } = await import("./db.ts");
const L = await import("./lessons.ts");

before(() => {
  openDb();
});
after(() => {
  closeDb();
  fs.rmSync(tmp, { recursive: true, force: true });
});

test("recall ranks stage/trigger/keyword matches and honours weight", () => {
  const a = L.addLesson({ situation: "landlord approved attendance, no contractor named", trigger: "landlord_reply", stage: "landlord_approval", category: "plumbing", action: "assign a contractor used before at the property", rationale: "r", source: "dataset", source_ref: "x" });
  const b = L.addLesson({ situation: "contractor sent invoice for completed works", trigger: "invoice_received", stage: "closeout", category: null, action: "forward invoice to landlord", rationale: "r", source: "dataset", source_ref: null });
  const r = L.recallLessons({ text: "landlord approved, need a contractor", stage: "landlord_approval", trigger: "landlord_reply", category: "plumbing" });
  assert.equal(r[0].id, a.id);
  assert.ok(r[0].score > 0);
  assert.ok(!r.some((x) => x.id === b.id) || r[0].score > r[r.length - 1].score);
  assert.equal(L.recallLessons({ text: "zzzz qqqq" }).length, 0);
  // weight lifts a lesson
  const c = L.addLesson({ situation: "landlord approved attendance, no contractor named", trigger: "landlord_reply", stage: "landlord_approval", category: "plumbing", action: "assign a contractor used before at the property", rationale: "r", source: "human", source_ref: null });
  L.voteLesson(c.id, 1);
  L.voteLesson(c.id, 1);
  const r2 = L.recallLessons({ text: "landlord approved", stage: "landlord_approval", trigger: "landlord_reply", category: "plumbing" });
  assert.equal(r2[0].id, c.id);
  assert.equal(L.recallLessons({ text: "landlord approved", stage: "landlord_approval" }, 1).length, 1);
});

test("voteLesson never goes below 0; markUsed counts; flag disables recall", () => {
  const l = L.addLesson({ situation: "s thing", trigger: null, stage: null, category: null, action: "a", rationale: "", source: "feedback", source_ref: null });
  assert.equal(L.voteLesson(l.id, -1)?.weight, 0);
  assert.equal(L.voteLesson(l.id, -1)?.weight, 0);
  assert.equal(L.voteLesson(l.id, 1)?.weight, 1);
  assert.equal(L.voteLesson(9999, 1), null);
  L.markUsed([l.id, l.id]);
  assert.equal(L.listLessons({ q: "thing" })[0].uses, 2);
  process.env.DONNA_LESSONS = "0";
  assert.deepEqual(L.recallLessons({ text: "thing" }), []);
  delete process.env.DONNA_LESSONS;
});

test("parseLessonJson is defensive", () => {
  const d = L.parseLessonJson('Sure! ```json\n{"situation":"s","trigger":"no_response","stage":null,"category":"null","action":"a","rationale":"r"}\n```');
  assert.equal(d?.trigger, "no_response");
  assert.equal(d?.category, null);
  assert.equal(L.parseLessonJson("nope"), null);
});
