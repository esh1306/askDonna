import { test } from "node:test";
import assert from "node:assert/strict";
import { buildRequest, decideRoute, parseResponse, THRESHOLDS } from "./classify.ts";
import { CATEGORY_KEYS, SEVERITY_KEYS } from "./taxonomy.ts";
import { binaryReport } from "./eval.ts";

const canned = {
  model: "jev-latest",
  answers: {
    category: {
      choice: "appliance",
      probabilities: { appliance: 0.8, plumbing: 0.1, other: 0.1 },
      confidence: 0.8,
    },
    severity: {
      score: 0,
      legend: "routine",
      probabilities: { routine: 0.7, urgent: 0.25, emergency: 0.05 },
      confidence: 0.7,
    },
    needs_landlord_approval: { noul: 0.82 },
    likely_self_fixable: { noul: 0.1 },
    safety_risk: { noul: 0.03 },
    needs_more_info: { noul: 0.05 },
  },
  usage: { input_tokens: 100, output_tokens: 5 },
};

test("buildRequest shapes state, model and all eight questions", () => {
  const req = buildRequest({ request: "Dishwasher broken", property: "Flat 1", reporter_role: "Tenant", extra: { floor: "1" } });
  assert.equal(req.model, "jev-latest");
  assert.deepEqual(req.state, { request: "Dishwasher broken", property: "Flat 1", reporter_role: "Tenant", floor: "1" });
  assert.deepEqual(Object.keys(req.questions), ["scope", "non_english", "category", "severity", "needs_landlord_approval", "likely_self_fixable", "safety_risk", "needs_more_info"]);
  assert.equal(req.questions.category.type, "choice");
  assert.deepEqual(Object.keys(req.questions.category.criteria), CATEGORY_KEYS);
  assert.equal(req.questions.severity.type, "score");
  assert.equal(req.questions.severity.criteria.length, SEVERITY_KEYS.length);
  assert.equal(req.questions.needs_landlord_approval.type, "noul");
  assert.ok(req.questions.category.instructions.length > 50);
  JSON.stringify(req); // serialisable
});

test("parseResponse maps choice, score and noul answers", () => {
  const r = parseResponse(canned, 123);
  assert.equal(r.category, "appliance");
  assert.equal(r.category_probs.appliance, 0.8);
  assert.equal(r.category_probs.garden_external, 0);
  assert.equal(r.severity, "routine");
  assert.ok(Math.abs(r.severity_probs.urgent - 0.25) < 1e-9);
  assert.equal(r.needs_landlord_approval_raw, 0.82);
  assert.ok(Math.abs(r.needs_landlord_approval - 0.646) < 1e-9); // calibrateApproval(0.82)
  assert.equal(r.latencyMs, 123);
});

test("parseResponse handles integer and fractional score without probabilities", () => {
  const mk = (score: unknown) => ({ answers: { ...canned.answers, severity: { score } } });
  assert.equal(parseResponse(mk(2)).severity, "emergency");
  assert.equal(parseResponse(mk(1)).severity, "urgent");
  assert.equal(parseResponse(mk(0.5)).severity, "urgent");
  assert.equal(parseResponse(mk(1)).severity_probs.urgent, 1);
});

test("parseResponse rejects malformed input", () => {
  assert.throws(() => parseResponse({ nope: 1 }));
  assert.throws(() => parseResponse({ answers: { ...canned.answers, safety_risk: {} } }));
});

test("decideRoute applies thresholds in priority order", () => {
  const base = parseResponse(canned);
  assert.equal(decideRoute(base), "request_landlord_approval");
  assert.equal(decideRoute({ ...base, safety_risk: THRESHOLDS.SAFETY_RISK }), "emergency_dispatch");
  assert.equal(decideRoute({ ...base, severity_probs: { routine: 0.1, urgent: 0.2, emergency: 0.7 } }), "emergency_dispatch");
  assert.equal(decideRoute({ ...base, needs_more_info: 0.9 }), "ask_for_info");
  assert.equal(decideRoute({ ...base, likely_self_fixable: 0.9 }), "self_fix_first");
  assert.equal(decideRoute({ ...base, likely_self_fixable: 0.9, safety_risk: 0.3 }), "request_landlord_approval");
  assert.equal(decideRoute({ ...base, needs_landlord_approval: 0.2 }), "standard");
});

test("binaryReport computes accuracy, brier and calibration", () => {
  const r = binaryReport("x", [
    { p: 0.9, y: true },
    { p: 0.1, y: false },
    { p: 0.7, y: false },
    { p: 0.3, y: true },
  ]);
  assert.equal(r.accuracy, 0.5);
  assert.equal(r.precision, 0.5);
  assert.equal(r.recall, 0.5);
  assert.ok(Math.abs(r.brier - (0.01 + 0.01 + 0.49 + 0.49) / 4) < 1e-9);
  assert.equal(r.calibration.reduce((a, c) => a + c.n, 0), 4);
});
