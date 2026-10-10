# How Donna uses Jev

Jev (TypeSafe AI, `POST /v1/systemone`) gives calibrated probabilities for yes/no (`noul`), `choice` and `score` questions. Donna uses it as evidence at three points, never as the sole decision-maker. Code lives in `intake/`; measured results are in `jev-guards-eval.md`.

## 1. Intake classifier (`classify_intake`)
Category, severity, and probabilities for landlord approval, self-fixability, safety risk and missing info; thresholds in `intake/classify.ts` (`THRESHOLDS`). See `intake-eval.md`.

## 2. Reply classifier (`classify_reply`, `intake/reply.ts`)
Called on each new inbound message from a landlord, tenant or contractor. One Jev call returns an intent (role-specific choice) plus noul probabilities: `needs_human_response`, `is_unconditional_approval` (landlord only), `mentions_amount`, `safety_concern`, `dissatisfied`. `decideAutonomy` maps this to `auto` or `review`, the decision Dwelly's system otherwise hands to a human every time.

`AUTONOMY` thresholds: review if `needs_human_response >= 0.5`, `safety_concern >= 0.5`, `dissatisfied >= 0.6`, or intent is `question`, `complaint` or `conditional_approval`; otherwise auto.

## 3. Outbound guardrail (`intake/guard.ts`)
Every `send_message`, `request_landlord_approval` message, and `record_approval_response` (when approving) is checked against compact ticket evidence (recent events and approvals, at most about 6k chars). Questions: `claims_work_done_unverified`, `promises_specific_date_unconfirmed`, `contains_credentials_or_bank_details`, `commits_landlord_money`, and for approval records `approval_is_conditional_or_ambiguous`.

`GUARD` thresholds: block at `>= 0.7`; credentials `>= 0.5`; ambiguous/conditional approval `>= 0.5`. A block throws an Error with the reasons and a rewrite instruction, so it shows as a failed action in the run log and Donna can retry. Successful tool output includes the `guard` probabilities (audit trail). If Jev is unreachable the guard fails open and the output carries `guard unavailable: ...`.

## 4. Consent helper (`intake/consent.ts`)
`checkConsent(transcriptText) -> {ok, p}`: is this transcript a clear, unconditional landlord approval? `ok` at `p >= 0.7`. Intended for the console server after voice calls.

## Measured accuracy (small hand-written sets, see eval doc)
- Outbound guard: 12/12 (6 should-block, 6 should-pass).
- Reply intent: 10/10. Autonomy: 9/10; the miss is a clean decline ("I'll arrange my own contractor") that Jev rated 0.72 for needs_human_response, so it goes to review (a defensible conservative error).
