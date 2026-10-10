import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import fs from "node:fs";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "crm-test-"));
process.env.CRM_DB = path.join(tmp, "test.db");

const { openDb, resetDb, closeDb } = await import("./db.ts");
const repo = await import("./repo.ts");
const { importCase } = await import("./import.ts");

before(() => {
  openDb();
  resetDb();
});
after(() => {
  closeDb();
  fs.rmSync(tmp, { recursive: true, force: true });
});

test("import 042 (full): closed, contacts + facts", () => {
  const r = importCase("Property Management", "042");
  assert.ok(r.ok);
  if (!r.ok) return;
  assert.equal(r.case_ref, "PM/042");
  assert.equal(r.stage, "closed");
  assert.equal(r.status, "closed");
  assert.equal(r.events, 31);
  const ctx = repo.getTicketContext(r.ticket_id);
  assert.ok(ctx.ok);
  if (!ctx.ok) return;
  assert.equal(ctx.property?.address, "Flat 20, 120 Alder Lane, Cedarford, ZZ9 0ZZ");
  assert.equal(ctx.tenant?.name, "Noah");
  assert.equal(ctx.landlord?.name, "Mercer");
  assert.equal(ctx.ticket.severity, "ROUTINE");
  assert.ok(ctx.property?.facts.some((f) => f.key === "has_pets" && f.value === "no"));
  assert.ok(ctx.property?.facts.some((f) => f.key === "has_access_considerations" && f.value === "no"));
  assert.ok(ctx.property?.facts.every((f) => f.source_ref?.startsWith("PM/042#event-")));
  assert.equal(ctx.approvals[0]?.status, "approved");
});

test("import with cutoff stops at landlord approval and re-import is idempotent", () => {
  const r = importCase("Property Management", "042", { cutoff: 6 });
  assert.ok(r.ok);
  if (!r.ok) return;
  assert.equal(r.stage, "landlord_approval");
  assert.equal(r.status, "on_hold");
  assert.equal(r.events, 6);
  const ctx = repo.getTicketContext(r.ticket_id);
  assert.ok(ctx.ok);
  if (!ctx.ok) return;
  assert.equal(ctx.open_holds.length, 1);
  assert.equal(ctx.open_holds[0].waiting_on, "Landlord");
  assert.equal(ctx.approvals[0]?.status, "pending");
  assert.equal(repo.findTickets({ propertyAddress: "Alder Lane" }).length, 1);
});

test("addFact conflict handling", () => {
  const t = repo.getTicketByCaseRef("PM/042")!;
  const e = { type: "property" as const, id: t.property_id! };
  const a = repo.addFact(e, "boiler_make", "Vaillant", "PM/042#event-001", 0.9);
  assert.ok(a.ok && !a.conflict);
  const same = repo.addFact(e, "boiler_make", "Vaillant", "PM/042#event-002", 0.9);
  assert.ok(same.ok && !same.conflict && same.unchanged);
  const c = repo.addFact(e, "boiler_make", "Worcester", "PM/042#event-003", 0.9);
  assert.ok(c.ok && c.conflict);
  if (c.ok && c.conflict) assert.equal(c.existing.value, "Vaillant");
  const ctx = repo.getTicketContext(t.id);
  assert.ok(ctx.ok);
  if (ctx.ok) assert.equal(ctx.property!.facts.filter((f) => f.key === "boiler_make" && f.status === "conflict").length, 2);
});

test("invalid moveStage rejected, valid accepted", () => {
  const t = repo.getTicketByCaseRef("PM/042")!; // stage landlord_approval
  const back = repo.moveStage(t.id, "intake", "oops");
  assert.equal(back.ok, false);
  const same = repo.moveStage(t.id, "landlord_approval", "same");
  assert.equal(same.ok, false);
  const fwd = repo.moveStage(t.id, "provider_selection", "landlord said yes");
  assert.ok(fwd.ok);
  const paused = repo.moveStage(t.id, "paused", "not tenanted");
  assert.ok(paused.ok && paused.status === "on_hold");
  const out = repo.moveStage(t.id, "works", "resume");
  assert.ok(out.ok);
  assert.equal(repo.moveStage(t.id, "closed", "done").ok, true);
  assert.equal(repo.moveStage(t.id, "works", "reopen").ok, false);
  assert.equal(repo.moveStage(9999, "works", "x").ok, false);
});

test("approval flow, holds, outbox, escalation, action log", () => {
  const t = repo.getTicketByCaseRef("PM/042")!;
  const t2 = importCase("Property Management", "011", { cutoff: 4 });
  assert.ok(t2.ok);
  if (!t2.ok) return;
  const imported = repo.getTicketContext(t2.ticket_id);
  assert.ok(imported.ok && imported.approvals.length === 1 && imported.approvals[0].status === "pending");
  assert.equal(repo.requestApproval(t2.ticket_id, "dup", 1, "email").ok, false); // one already pending from import
  if (imported.ok) assert.ok(repo.resolveApproval(imported.approvals[0].id, "approved", "ok").ok);
  const ap = repo.requestApproval(t2.ticket_id, "Quote for dishwasher repair", 180, "email");
  assert.ok(ap.ok);
  if (!ap.ok) return;
  const res = repo.resolveApproval(ap.approval_id, "approved", "Yes go ahead");
  assert.ok(res.ok);
  assert.equal(repo.resolveApproval(ap.approval_id, "rejected", null).ok, false);

  const h = repo.placeHold(t2.ticket_id, "Waiting for Landlord", "Landlord", "2000-01-01T00:00:00Z");
  assert.ok(h.ok);
  assert.equal(repo.dueFollowUps("2030-01-01T00:00:00Z").length >= 1, true);
  if (h.ok) assert.ok(repo.releaseHold(h.hold_id).ok);

  const ctx = repo.getTicketContext(t2.ticket_id);
  assert.ok(ctx.ok);
  const m = repo.queueMessage(t2.ticket_id, "email", ctx.ok ? ctx.landlord!.id : "x", "Update", "Hello");
  assert.ok(m.ok);
  if (m.ok) assert.ok(repo.markMessage(m.message_id, "sent").ok);
  assert.ok(repo.escalate(t2.ticket_id, { reason: "conflicting amounts", summary: "s", checked: "c", uncertain: "u", recommendation: "r", priority: "high" }).ok);
  const logs = openDb().prepare("SELECT COUNT(*) n FROM action_log WHERE ticket_id=?").get(t2.ticket_id) as { n: number };
  assert.ok(logs.n >= 6);
  assert.ok(t.id > 0);
});

test("getTicketContext shape", () => {
  const t = repo.getTicketByCaseRef("PM/011")!;
  const ctx = repo.getTicketContext(t.id, { events: 3 });
  assert.ok(ctx.ok);
  if (!ctx.ok) return;
  for (const k of ["ticket", "property", "tenant", "landlord", "contractor", "events", "open_holds", "approvals", "open_human_queue", "history_for_property"])
    assert.ok(k in ctx, k);
  assert.ok(ctx.events.length <= 3);
  assert.equal(ctx.open_human_queue.length, 1);
  assert.equal(repo.getTicketContext(99999).ok, false);
  assert.ok(repo.searchEvents(t.id, "dishwasher").length > 0);
});
