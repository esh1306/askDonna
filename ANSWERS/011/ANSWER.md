# Case 011 - Answer

## Decision

**escalate**

## Summary

The landlord approved a leak repair at 16 Brindlewick Mews, but it has stopped. The contractor saw an unidentified fibrous ceiling lining (possibly asbestos, not confirmed) where he needed to cut. A young child lives in the flat. The landlord's approval covers the plumbing only, and she wants the cost and timing before agreeing to a specialist check. Nobody has priced one yet. I escalated to a human at high priority so staff can get a surveyor quote and take it to the landlord. I moved the ticket on to landlord_approval, placed a 2-day hold, updated the tenant with safety advice and recorded the key facts.

## Judgement

- **Case type:** maintenance
- **Why this decision:** There is a possible hazardous material in a home with a young child (event 17), and the leak keeps coming back (event 20). The landlord has said her approval doesn't cover an assessment and asked for cost and timing first (event 22). Nobody can give that cost yet: Kellan can't price it (event 23). Getting a specialist quote and judging the safety risk needs agency staff, so I escalated at high priority. The stage was behind the evidence, so I moved it to landlord_approval. The tenant was told what to do next and when they'll hear from us.

| Alternative considered | Why not |
|---|---|
| Assign or rebook Kellan for the repair | The lining hasn't been identified and the landlord has ruled out work beyond the quote. Cutting could disturb hazardous material. |
| Ask the landlord to approve an assessment now with request_landlord_approval | She asked for the cost and timing first, and we have no figure. Asking without one would be invented or premature. |
| Just wait for the landlord | She is waiting on us for a cost, so the case would stall. There is also a safety question. |

**Checks performed before acting**

- Landlord approval scope (events 13, 22): plumbing only, with a cost cap
- Survey records: none from the landlord or the building manager (events 6, 13, 22)
- Nothing disturbed (events 18, 23)
- Tenant safety: tap out of use, no sagging, hatch closed (event 20)
- No attachments, so the estimate amount can't be seen
- CRM contractor record doesn't match the contractor actually on the job

**Assumptions**

- The tenant can be reached by SMS through the outbox
- The estimate amount exists in Kellan's email (event 11) but wasn't captured in the CRM

## Actions taken

| # | Tool | Input (gist) | Result | Output (gist) |
|---|---|---|---|---|
| 1 | `get_ticket_context` | {"ticket_id":85} | ok | {"ok":true,"ticket":{"id":85,"case_ref":"R/011","property_id":79,"tenant_id":227,"landlord_id":228,"contractor_id":229,… |
| 2 | `recall_lessons` | {"ticket_id":85,"situation_text":"Contractor paused ceiling opening for leak repair after seeing unidentified fibrous lining (possible asbe… | ok | {"ok":true,"count":0,"lessons":[]} |
| 3 | `classify_reply` | {"ticket_id":85,"text":"Confirms she has no further records. Says her authorization covered the quoted plumbing work only, not a specialist… | ok | {"autonomy":"review","intent":"question","intent_probs":{"approve":0,"decline":0,"conditional_approval":0.06,"question"… |
| 4 | `classify_intake` | {"ticket_id":85,"text":"Leaking compression joint above kitchen ceiling, recurs when tap used; tap now out of use. Access requires opening … | ok | {"route":"emergency_dispatch","scope":"maintenance_repair","scope_probs":{"maintenance_repair":0.99,"maintenance_admin"… |
| 5 | `escalate_to_human` | {"ticket_id":85,"reason":"Suspected hazardous ceiling lining blocks an approved leak repair; needs an asbestos/specialist assessment that i… | ok | {"ok":true,"queue_id":27} |
| 6 | `move_stage` | {"ticket_id":85,"to":"landlord_approval","reason":"Stage was behind the evidence: landlord approved the plumbing scope (ev 13), the work st… | ok | {"ok":true,"from":"intake","to":"landlord_approval","status":"open"} |
| 7 | `place_hold` | {"ticket_id":85,"reason":"Waiting on agency to get a quote and timing for a specialist assessment of the lining, then on the landlord's dec… | ok | {"ok":true,"hold_id":267} |
| 8 | `send_message` | {"ticket_id":85,"to":"tenant","channel":"sms","body":"Hello, this is Northbridge Lettings about the kitchen ceiling leak at 16 Brindlewick … | ok | {"ok":true,"message_id":64,"guard":{"blocked":false,"reasons":[],"probs":{"claims_work_done_unverified":0.05,"promises_… |
| 9 | `add_profile_fact` | {"entity_type":"contact","entity_id":227,"key":"access_call_on_arrival","value":"Contractors must call on arrival; young child present in h… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":96,"entity_type":"contact","entity_id":227,"key":"access_cal… |
| 10 | `add_profile_fact` | {"entity_type":"contact","entity_id":228,"key":"requires_contact_before_scope_or_cost_increase","value":"true - wants likely cost and timin… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":97,"entity_type":"contact","entity_id":228,"key":"requires_c… |
| 11 | `add_profile_fact` | {"entity_type":"property","entity_id":79,"key":"kitchen_ceiling_unidentified_fibrous_lining","value":"Pale fibrous-looking lining behind ki… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":98,"entity_type":"property","entity_id":79,"key":"kitchen_ce… |

Agent's own account of its actions (from the structured result):

- `get_ticket_context` - Loaded ticket, contacts and the 24 events -> Stage intake, no holds or approvals, no attachments; CRM contractor record is the building manager, not Kellan
- `recall_lessons` - Looked for team lessons on similar cases -> No lessons found
- `classify_reply` - Classified the landlord's email in event 22 -> Question; needs a human response 0.90; autonomy review
- `classify_intake` - Classified the current problem -> Plumbing; severity emergency 0.94; safety_risk 0.85
- `escalate_to_human` - Handed over at high priority: an assessment of the unidentified material is needed but has no price or approval, and a child is in the flat -> queue_id 27
- `move_stage` - Moved the stage from intake to landlord_approval to match the evidence -> intake -> landlord_approval
- `place_hold` - Hold while the agency gets an assessment quote and the landlord decides -> hold_id 267, follow-up in 2 days
- `send_message` - SMS to the tenant: keep the tap out of use and the hatch closed, the ceiling check needs landlord agreement, no date booked, update within 2 days, when to call us -> message_id 64, passed the guard
- `add_profile_fact` - Tenant: contractors must call on arrival, young child at home, weekday access after 10:00 -> fact 96
- `add_profile_fact` - Landlord: must be contacted before any scope or cost increase -> fact 97
- `add_profile_fact` - Property: unidentified fibrous ceiling lining, no survey, don't disturb -> fact 98

## Approvals

| Party | Status | Channel |
|---|---|---|
| Ossa Fenlow (Landlord) | granted by email for the quoted plumbing scope only (event 13); not recorded as an approval in the CRM | email |
| Ossa Fenlow (Landlord) | pending: her decision on extra assessment or repair scope, which needs a cost and timing first (events 22, 24) | email |

## Escalation & handover

- Escalation needed: **yes**
- Reason: A suspected hazardous ceiling lining blocks the approved leak repair. The specialist assessment needed is outside the landlord's approval and has no price. A young child lives in the flat.
- Handover summary: The leaking joint can only be reached by cutting near an unidentified fibrous lining, so the work stopped and nothing was disturbed. The tenant has stopped using the kitchen tap. The landlord's approval covers the plumbing only, and she wants the cost and timing before agreeing to more. The plumbing estimate amount isn't visible in the CRM. The CRM contractor record shows the building manager instead of Kellan Orve.
- Recommendation: Get a quote and earliest date for an asbestos survey or sample from a licensed or UKAS-accredited firm. Ask Bren Talwick (building manager) whether the block has an asbestos register. Take the cost and timing to Ossa Fenlow for approval. Ask Kellan whether the pipe can be isolated meanwhile without disturbing the ceiling. Fix the CRM contractor record.

## What could not be verified

- What the lining is made of (possibly asbestos-containing, not confirmed)
- The plumbing estimate amount
- The cost and lead time of a specialist assessment
- Whether the pipe can be isolated without disturbing the ceiling
- Whether the block has an asbestos register

## What failed

_No failures recorded._

## Risks & red flags

- Possible asbestos-containing material near the repair point, with a young child in the household
- The leak keeps coming back, and repeated water could damage the ceiling (there is already a narrow crack)
- The CRM contractor field (id 229) shows building manager Bren Talwick instead of Kellan Orve
- The landlord's approval isn't recorded in the CRM approvals table
- The tenant has lost use of the kitchen tap

## Final result / next follow-up

- Final status: Stage landlord_approval, on hold (hold 267) waiting on the agency, escalated to the human queue (item 27) at high priority
- Next follow-up: 2025-06-15 (2 days) - Check whether the agency has a surveyor quote and timing and has sent it to the landlord. Give the tenant the promised update.
- Confidence: 0.82

## Run metadata

- Case folder: `011`
- Session id: wrun_01M4K776ACJ7Z9WXZCABPKCWNG
- Started: 2026-10-10T15:34:32.436Z  Finished: 2026-10-10T15:35:43.716Z  Duration: 71.3s
- Events recorded: 479
- Model(s): anthropic/claude-opus-5.5
- Tokens: in 125976 / out 6824; cost: not reported
