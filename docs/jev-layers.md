# How Donna uses Jev

Jev (TypeSafe AI, `POST /v1/systemone`) gives calibrated probabilities for yes/no (`noul`), `choice` and `score` questions. Donna uses it as evidence at three points, never as the sole decision-maker. Code lives in `intake/`; measured results are in `jev-guards-eval.md`.

## 1. Intake classifier (`classify_intake`)
Category, severity, and probabilities for landlord approval, self-fixability, safety risk and missing info; thresholds in `intake/classify.ts` (`THRESHOLDS`). `needs_landlord_approval` is passed through `calibrateApproval` (raw value kept as `needs_landlord_approval_raw`): the raw Jev output saturates at ~0.85 for any repair, and the label is mostly not predictable from request text beyond admin tasks. See `intake-eval.md` for held-out numbers and caveats.

## 2. Reply classifier (`classify_reply`, `intake/reply.ts`)
Called on each new inbound message from a landlord, tenant or contractor. One Jev call returns an intent (role-specific choice) plus noul probabilities: `needs_human_response`, `is_unconditional_approval` (landlord only), `mentions_amount`, `safety_concern`, `dissatisfied`. `decideAutonomy` maps this to `auto` or `review`, the decision Dwelly's system otherwise hands to a human every time.

`AUTONOMY` thresholds: review if `needs_human_response >= 0.5` (0.85 when the intent is a confident approve/decline, intent prob >= 0.9, so a flat "no, I'll arrange my own" is handled automatically), `safety_concern >= 0.5`, `dissatisfied >= 0.6`, or intent is `question`, `complaint` or `conditional_approval`; otherwise auto.

## 3. Outbound guardrail (`intake/guard.ts`)
Every `send_message`, `request_landlord_approval` message, and `record_approval_response` (when approving) is checked against compact ticket evidence (recent events and approvals, at most about 6k chars). Questions: `claims_work_done_unverified`, `promises_specific_date_unconfirmed`, `contains_credentials_or_bank_details`, `commits_landlord_money`, and for approval records `approval_is_conditional_or_ambiguous`.

`GUARD` thresholds: block at `>= 0.7`; credentials `>= 0.5`; ambiguous/conditional approval `>= 0.5`. A block throws an Error with the reasons and a rewrite instruction, so it shows as a failed action in the run log and Donna can retry. Successful tool output includes the `guard` probabilities (audit trail). If Jev is unreachable the guard fails open and the output carries `guard unavailable: ...`.

## 4. Consent helper (`intake/consent.ts`)
`checkConsent(transcriptText) -> {ok, p}`: is this transcript a clear, unconditional landlord approval? `ok` at `p >= 0.7`. Intended for the console server after voice calls.

## Measured accuracy (small hand-written sets, see eval doc)
- Outbound guard: 12/12 (6 should-block, 6 should-pass).
- Reply intent: 10/10. Autonomy: 9/10; the miss is a clean decline ("I'll arrange my own contractor") that Jev rated 0.72 for needs_human_response, so it goes to review (a defensible conservative error).

## Context, scope and profile rules (intake)

- `classify_intake` now sends a compact `profile` (landlord/tenant/property facts, <= 1.2k chars) and `history` (last 5 jobs at the property) to Jev. Optional `estimate_gbp` input.
- `approvalFromProfile` (`intake/profile.ts`) runs before trusting Jev: a recorded `pre_approved_limit_gbp` / `call_before_spend_above_gbp` that covers the estimate, or `pays_contractor_directly`, gives needs_landlord_approval = 0; an estimate above the lowest recorded cap gives 1; otherwise Jev. The tool returns `approval_source` ("profile_rule" | "jev"), `approval_rule`, `needs_landlord_approval_jev` and `profile_used`.
- New `scope` question (maintenance_repair, maintenance_admin, tenancy_finance, tenancy_legal_or_dispute, neighbour_or_antisocial, emergency_safety, other_non_property). If P(not maintenance_*/emergency_safety) >= `THRESHOLDS.OUT_OF_SCOPE` (0.5), `decideRoute` returns `out_of_scope_handover` before any other route.
- New informational `non_english` noul; all questions are told to judge content in any language.
