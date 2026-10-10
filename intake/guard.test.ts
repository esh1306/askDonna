import { test } from "node:test";
import assert from "node:assert/strict";
import { GUARD, evaluateGuard, buildGuardQuestions, checkOutbound } from "./guard.ts";
import { AUTONOMY, decideAutonomy, parseReply, buildReplyQuestions } from "./reply.ts";

const base = { intent: "approve", needs_human_response: 0.1, safety_concern: 0.05, dissatisfied: 0.05 };

test("decideAutonomy thresholds", () => {
  assert.equal(decideAutonomy(base), "auto");
  assert.equal(decideAutonomy({ ...base, needs_human_response: AUTONOMY.NEEDS_HUMAN_RESPONSE }), "review");
  assert.equal(decideAutonomy({ ...base, safety_concern: 0.5 }), "review");
  assert.equal(decideAutonomy({ ...base, dissatisfied: 0.59 }), "auto");
  assert.equal(decideAutonomy({ ...base, dissatisfied: 0.6 }), "review");
  for (const i of ["question", "complaint", "conditional_approval"]) assert.equal(decideAutonomy({ ...base, intent: i }), "review");
});

test("evaluateGuard thresholds", () => {
  const ok = { claims_work_done_unverified: 0.69, promises_specific_date_unconfirmed: 0.1, contains_credentials_or_bank_details: 0.49, commits_landlord_money: 0.0 };
  assert.equal(evaluateGuard(ok).blocked, false);
  assert.equal(evaluateGuard({ ...ok, claims_work_done_unverified: GUARD.BLOCK }).blocked, true);
  const cred = evaluateGuard({ ...ok, contains_credentials_or_bank_details: 0.5 });
  assert.equal(cred.blocked, true);
  assert.match(cred.reasons[0], /credentials/);
});

test("guard questions shape", () => {
  assert.equal(Object.keys(buildGuardQuestions("message")).length, 4);
  assert.ok("approval_is_conditional_or_ambiguous" in buildGuardQuestions("approval_record"));
  assert.ok("is_unconditional_approval" in buildReplyQuestions("landlord"));
  assert.ok(!("is_unconditional_approval" in buildReplyQuestions("tenant")));
});

test("parseReply canned", () => {
  const r = parseReply(
    {
      intent: { choice: "conditional_approval", probabilities: { conditional_approval: 0.9, approve: 0.1 } },
      needs_human_response: { noul: 0.7 },
      is_unconditional_approval: { noul: 0.1 },
      mentions_amount: { noul: 0.9 },
      safety_concern: { noul: 0 },
      dissatisfied: { noul: 0 },
    },
    "landlord",
  );
  assert.equal(r.intent, "conditional_approval");
  assert.equal(decideAutonomy(r), "review");
});

test("checkOutbound fails open without network/key", async () => {
  const r = await checkOutbound({ kind: "message", text: "x", recipientRole: "tenant", context: "" }, { apiKey: "" }).catch((e) => e);
  // empty apiKey falls through ?? (empty string is not nullish) -> HTTP error or network -> fail open
  assert.equal(r.blocked, false);
  assert.match(r.reasons[0], /guard unavailable/);
});
