import { test } from "node:test";
import assert from "node:assert/strict";
import { approvalFromProfile, buildHistory, buildProfile } from "./profile.ts";
import { buildRequest, decideRoute, parseResponse, SCOPE_KEYS } from "./classify.ts";

const f = (key: string, value: string) => ({ key, value });

test("approvalFromProfile: no facts or no estimate with a limit -> undecided", () => {
  assert.deepEqual(approvalFromProfile(undefined, 100), { decided: false });
  assert.deepEqual(approvalFromProfile([], 100), { decided: false });
  assert.deepEqual(approvalFromProfile([f("pre_approved_limit_gbp", "200")]), { decided: false });
  assert.deepEqual(approvalFromProfile([f("has_pets", "no")], 100), { decided: false });
});

test("approvalFromProfile: estimate within / over recorded limits", () => {
  const within = approvalFromProfile([f("call_before_spend_above_gbp", "300 (landlord asks to be called)")], 250);
  assert.ok(within.decided && !within.needs);
  const over = approvalFromProfile([f("pre_approved_limit_gbp", "150")], 151);
  assert.ok(over.decided && over.needs);
  const eq = approvalFromProfile([f("pre_approved_limit_gbp", "£150")], 150);
  assert.ok(eq.decided && !eq.needs);
  // two caps: the lowest one triggers needs=true
  const two = approvalFromProfile([f("pre_approved_limit_gbp", "500"), f("call_before_spend_above_gbp", "300")], 400);
  assert.ok(two.decided && two.needs);
});

test("approvalFromProfile: pays_contractor_directly", () => {
  const d = approvalFromProfile([f("pays_contractor_directly", "true")]);
  assert.ok(d.decided && !d.needs);
  assert.deepEqual(approvalFromProfile([f("pays_contractor_directly", "false")]), { decided: false });
  const typed = f("pays_contractor_directly", "yes: plumbing only");
  assert.ok(approvalFromProfile([typed], undefined, "plumbing").decided);
  assert.deepEqual(approvalFromProfile([typed], undefined, "electrical_lighting"), { decided: false });
  // over-cap estimate still wins over paying directly
  const o = approvalFromProfile([f("pays_contractor_directly", "true"), f("pre_approved_limit_gbp", "100")], 500);
  assert.ok(o.decided && o.needs);
});

test("buildProfile / buildHistory are compact", () => {
  const p = buildProfile({ landlord: { facts: [f("pre_approved_limit_gbp", "200")] }, tenant: { facts: [] }, property: { facts: [f("tenanted", "false")] } }, 1200);
  assert.match(p, /Landlord facts: pre_approved_limit_gbp=200/);
  assert.match(p, /Property facts: tenanted=false/);
  assert.doesNotMatch(p, /Tenant facts/);
  assert.equal(buildProfile({}), "");
  assert.ok(buildProfile({ landlord: { facts: [f("x", "y".repeat(5000))] } }, 300).length <= 300);
  assert.equal(buildHistory(Array.from({ length: 9 }, (_, i) => ({ title: `job ${i}`, status: "closed" }))).length, 5);
});

test("buildRequest passes profile/history and asks scope + non_english", () => {
  const req = buildRequest({ request: "x", profile: "Landlord facts: a=b", history: ["old job"] });
  assert.equal((req.state as any).profile, "Landlord facts: a=b");
  assert.deepEqual((req.state as any).history, ["old job"]);
  assert.deepEqual(Object.keys(req.questions.scope.criteria), SCOPE_KEYS);
  assert.equal(req.questions.non_english.type, "noul");
});

const canned = (scope: Record<string, number>) =>
  parseResponse({
    answers: {
      scope: { choice: Object.entries(scope).sort((a, b) => b[1] - a[1])[0][0], probabilities: scope },
      category: { choice: "other", probabilities: { other: 1 } },
      severity: { score: 0, probabilities: { routine: 1 } },
      needs_landlord_approval: { noul: 0.8 },
      likely_self_fixable: { noul: 0.1 },
      safety_risk: { noul: 0.1 },
      needs_more_info: { noul: 0.1 },
      non_english: { noul: 0.9 },
    },
  });

test("decideRoute: out_of_scope_handover for non-maintenance scopes, checked first", () => {
  const fin = canned({ tenancy_finance: 0.9, maintenance_repair: 0.1 });
  assert.equal(fin.scope, "tenancy_finance");
  assert.equal(fin.non_english, 0.9);
  assert.equal(decideRoute(fin), "out_of_scope_handover");
  assert.equal(decideRoute({ ...fin, safety_risk: 0.99 }), "out_of_scope_handover");
  assert.equal(decideRoute(canned({ neighbour_or_antisocial: 0.6, maintenance_repair: 0.4 })), "out_of_scope_handover");
  assert.equal(decideRoute(canned({ maintenance_repair: 0.9, tenancy_finance: 0.1 })), "request_landlord_approval");
  assert.equal(decideRoute(canned({ maintenance_admin: 1 })), "request_landlord_approval");
  assert.equal(decideRoute({ ...canned({ emergency_safety: 1 }), safety_risk: 0.9 }), "emergency_dispatch");
  assert.equal(decideRoute({ ...canned({ maintenance_repair: 1 }), scope_probs: undefined, scope: "tenancy_legal_or_dispute" }), "out_of_scope_handover");
});
