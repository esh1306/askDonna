import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "gates-")), "crm.db");
process.env.CRM_DB = tmp;
const repo = await import("./repo.ts");
const { spendGate } = await import("./gates.ts");

function newTicket(severity: string | null, category: string | null = "plumbing") {
  const p = repo.upsertProperty(`1 Test Road ${Math.random()}`);
  const ll = repo.upsertContact({ role: "landlord", name: `LL ${Math.random()}`, forceNew: true });
  if (!ll.ok) throw new Error("contact");
  return repo.run(
    `INSERT INTO tickets (case_ref, property_id, landlord_id, title, category, severity, stage, status, created_at, updated_at)
     VALUES (?,?,?,?,?,?, 'intake','open', datetime('now'), datetime('now'))`,
    `T/${Math.random()}`,
    p,
    ll.contact_id,
    "Leak",
    category,
    severity,
  ).id;
}

test("no approval: spend is refused", () => {
  assert.equal(spendGate(newTicket(null)).ok, false);
});

test("emergency severity alone does not unlock spend (exploit regression)", () => {
  const id = newTicket("emergency");
  const g = spendGate(id);
  assert.equal(g.ok, false);
});

test("emergency + high-priority escalation unlocks spend", () => {
  const id = newTicket("emergency");
  repo.escalate(id, { reason: "gas smell", priority: "high" });
  assert.equal(spendGate(id).ok, true);
});

test("approved landlord approval unlocks spend", () => {
  const id = newTicket(null);
  const a = repo.requestApproval(id, "fix leak", 120, "email");
  if (!a.ok) throw new Error(a.error);
  assert.equal(spendGate(id).ok, false);
  repo.resolveApproval(a.approval_id, "approved", "Yes please");
  assert.equal(spendGate(id).ok, true);
});

test("admin and compliance work need no spend approval", () => {
  assert.equal(spendGate(newTicket(null, "inspection_admin")).ok, true);
});
