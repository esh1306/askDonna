# Case PM003-2 - Answer

## Decision

**escalate**

## Summary

The contractor says the invoice for the checkout clean, rubbish removal and carpet clean went straight to Theo, so it isn't on the job record. The original estimate, its amount and any landlord approval aren't visible either. I asked the contractor to attach the invoice, the estimate and the completion date, and placed a 2-day hold. I also escalated to a human so the invoice can be checked against the estimate and any tenant deposit deduction can be decided.

## Judgement

- **Case type:** maintenance_admin
- **Why this decision:** Event 17 says the invoice went to Theo directly. Without the estimate amount, the invoice itself or a record of who approved the spend (events 7, 10), the invoice can't be checked or paid. The contractor can provide the documents, and the agency has to decide on the spend authority and the deposit question.

| Alternative considered | Why not |
|---|---|
| No action, because Theo already has the invoice | The CRM would stay unable to check the invoice, and the deposit question would go unhandled |
| Move to closeout | Nothing in the records confirms the work is complete |
| Ask the landlord for approval | There is no amount to put to them, and the agency has already approved the estimate. A human should confirm the right channel and the authority first |

**Checks performed before acting**

- Approval status
- Invoice and estimate presence in the CRM
- Attachment contents
- Duplicate tickets at the property
- Classifier on the latest message

**Assumptions**

- 'Bennett' is the contractor assigned to this ticket

## Actions taken

| # | Tool | Input (gist) | Result | Output (gist) |
|---|---|---|---|---|
| 1 | `get_ticket_context` | {"ticket_id":8} | ok | {"ok":true,"ticket":{"id":8,"case_ref":"R/PM003-2","property_id":7,"tenant_id":17,"landlord_id":18,"contractor_id":19,"… |
| 2 | `classify_reply` | {"ticket_id":8,"text":"hi invoice sent to Theo x","sender_role":"contractor","context":"Checkout clean + rubbish removal + carpet clean; es… | ok | {"autonomy":"auto","intent":"invoice","intent_probs":{"quote_or_estimate":0,"invoice":1,"completion_report":0,"scheduli… |
| 3 | `search_case` | {"ticket_id":8,"query":"invoice"} | ok | {"query":"invoice","matches":1,"events":[{"id":96,"ticket_id":8,"ts":"2025-07-23T18:50:56Z","kind":"email","direction":… |
| 4 | `read_attachment` | {"ticket_id":8,"name":"attachment-01-checkout-inspection-report.pdf"} | ok | {"ok":true,"name":"attachment-01-checkout-inspection-report.pdf","text":"# Transcription\n\n## Page 1\n\n**Northbridge … |
| 5 | `send_message` | {"ticket_id":8,"to":"contractor","channel":"email","subject":"Invoice – Job NBL-003-2766, Flat 30, 30 Harbour View, Northbridge, ZZ9 0ZZ","… | ok | {"ok":true,"message_id":13,"guard":{"blocked":false,"reasons":[],"probs":{"claims_work_done_unverified":0.54,"promises_… |
| 6 | `place_hold` | {"ticket_id":8,"reason":"Waiting for contractor (Bennett) to attach invoice and original estimate to job NBL-003-2766 and confirm completio… | ok | {"ok":true,"hold_id":26} |
| 7 | `escalate_to_human` | {"ticket_id":8,"reason":"Invoice sent directly to Theo off-system; no estimate amount, invoice or landlord approval visible to check it aga… | ok | {"ok":true,"queue_id":3} |

Agent's own account of its actions (from the structured result):

- `get_ticket_context` - Loaded the ticket context -> 17 events, no holds or approvals, sister ticket R/PM003-1 open
- `classify_reply` - Classified the contractor's message in event 17 -> intent invoice, autonomy auto, mentions_amount 0.02
- `search_case` - Searched the case for 'invoice' -> Only match is event 17
- `search_case` (FAILED) - Searched the case for '£' -> Failed: the search needs at least 2 characters. I did not retry.
- `read_attachment` - Read the checkout inspection report -> Standard checkout report that mentions deposit deductions. Appointment date shows 16 March 2026.
- `send_message` - Emailed the contractor asking for the invoice, the original estimate and the completion date -> Sent (message 13), not blocked by the guard
- `place_hold` - Placed a hold waiting on the contractor, follow-up in 2 days -> hold 26
- `escalate_to_human` - Handed over for invoice checking, spend authority and the deposit question -> queue item 3

## Approvals

| Party | Status | Channel |
|---|---|---|
| Agency (Theo Quinn) | granted (estimate approved, event 10; amount not visible) | email/internal note |
| Landlord | not visible in records | n/a |

## Escalation & handover

- Escalation needed: **yes**
- Reason: The invoice went to Theo outside the CRM. There is no estimate amount or landlord approval to check it against, and the cost probably affects the tenant's deposit.
- Handover summary: Bennett (contractor) sent an estimate (event 7, not in the CRM). Theo approved it (events 9–10). Bennett says the invoice was sent to Theo (event 17). I asked Bennett to attach the invoice, the estimate and the completion date (hold 26, 2 days).
- Recommendation: Theo should upload the invoice and estimate to the ticket and check that the amount and payee match the estimate. He should also confirm who authorised the spend and tell the landlord. The deposits team should decide on any deduction from the tenant's deposit. Check whether R/PM003-1 duplicates this job.

## What could not be verified

- Estimate amount
- Invoice amount and payee
- Whether the works are complete
- Whether the landlord approved the cost
- Whether the cost will be deducted from the tenant's deposit

## What failed

- Agent reported: search_case with '£' was rejected because the query was too short. I did not retry.

## Risks & red flags

- The invoice was handled outside the CRM, so it can't be checked against the approved estimate yet
- The checkout report's appointment date (16 March 2026) is after the job was raised (22 July 2025), so the date may be wrong
- Possible duplicate: sister ticket R/PM003-1 has the same title and property

## Final result / next follow-up

- Final status: Still at the scheduling stage, with a hold waiting on the contractor and an item in the human queue
- Next follow-up: 2025-07-25 - Chase the contractor for the invoice, estimate and completion date if they haven't arrived
- Confidence: 0.75

## Run metadata

- Case folder: `C:\Users\sahid\Documents\Projects\Hackathons\DwellyHack\dwelly-agent\data\practice\cases\PM003-2`
- Session id: wrun_01M4JY5GSAVTKJNJD4GBF85DZH
- Started: 2026-10-10T12:56:20.109Z  Finished: 2026-10-10T12:57:17.101Z  Duration: 57.0s
- Events recorded: 277
- Model(s): anthropic/claude-opus-5.5
- Tokens: in 92226 / out 4408; cost: not reported
