# Case 023 - Answer

## Decision

**escalate**

## Summary

I've escalated the case at high priority. Copper Finch sent two invoices for the 5 February visit that overlap. Invoice A (£138, diagnosis) is within what the landlord authorised. Invoice B (£372) charges for an actuator replacement that was never authorised and that the records suggest never happened. Meanwhile a household with a child still has intermittent heating. Neither invoice should be paid until the contractor says which one is current. I moved the ticket to the landlord-approval stage, recorded the key facts, updated the tenant with safety advice and a date to expect news, and placed a 2-day hold.

## Judgement

- **Case type:** maintenance_admin
- **Why this decision:** The rules say never to pay or forward an invoice that doesn't match what was approved. Invoice B (£372) is for work outside the diagnosis-only authority (events 005, 012) and the records don't support it (events 008, 009, 016, 019, 020, 022). A disputed invoice and a vulnerable household both call for a human. Invoice A on its own would match, but it overlaps with B and the contractor can't say whether B replaces it (event 022), so A is held too. The landlord was asked on 12 Feb (event 023), so I didn't message him again or open a duplicate approval request.

| Alternative considered | Why not |
|---|---|
| Send invoice A to the landlord for payment now | The contractor hasn't confirmed whether B replaces A or overlaps it; paying A now risks a double charge or a muddled settlement. |
| Request landlord approval for £372 via a call | The landlord was emailed the same question hours earlier (event 023) and asked questions the contractor still hasn't answered (event 012). A duplicate request would be premature, so I've recommended a phone chase to the human instead. |
| Treat as an emergency and dispatch a contractor | Heating is intermittent, not fully off, hot water works, and there is no leak, gas smell or warning. It's urgent for a vulnerable household, but it doesn't meet the emergency threshold for acting without approval. |
| Just wait without escalating | A disputed invoice plus a vulnerable tenant needs agency judgement. |

**Checks performed before acting**

- Approval status: diagnosis only up to £180, no remedial approval
- Invoice amounts compared with the quote (£138) and estimate (£372)
- Contractor, property and customer the same on both invoices
- Service dates checked against the event timeline
- Tenant's account of no return visit
- Payment status: none recorded
- Bank-detail change requests: none seen
- Open holds and approvals: none before this turn

**Assumptions**

- Landlord's preferred channel is unknown; recent contact has been by email
- Hot water working and no gas or leak symptoms means this is not an emergency

## Actions taken

| # | Tool | Input (gist) | Result | Output (gist) |
|---|---|---|---|---|
| 1 | `get_ticket_context` | {"ticket_id":97} | ok | {"ok":true,"ticket":{"id":97,"case_ref":"R/023","property_id":91,"tenant_id":261,"landlord_id":262,"contractor_id":263,… |
| 2 | `read_attachment` | {"ticket_id":97,"name":"invoice-NBL-CFM-250210-A.pdf"} | ok | {"ok":true,"name":"invoice-NBL-CFM-250210-A.pdf","text":"# Transcription\n\n**Document type:** Invoice (the page is hea… |
| 3 | `read_attachment` | {"ticket_id":97,"name":"invoice-NBL-CFM-250210-B.pdf"} | ok | {"ok":true,"name":"invoice-NBL-CFM-250210-B.pdf","text":"# Transcription\n\n**Top-right header:** Copper Finch Mechanic… |
| 4 | `recall_lessons` | {"ticket_id":97,"situation_text":"Contractor sent two overlapping invoices (£138 diagnostic within approval, £372 actuator replacement neve… | ok | {"ok":true,"count":0,"lessons":[]} |
| 5 | `move_stage` | {"ticket_id":97,"to":"landlord_approval","reason":"Diagnosis authorised up to £180 (event 005) and carried out 5 Feb (event 008). Remedial … | ok | {"ok":true,"from":"intake","to":"landlord_approval","status":"open"} |
| 6 | `add_profile_fact` | {"entity_type":"property","entity_id":91,"key":"household_includes_child","value":"yes","source_ref":"event 001 (tenant portal report)","co… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":128,"entity_type":"property","entity_id":91,"key":"household… |
| 7 | `add_profile_fact` | {"entity_type":"contact","entity_id":261,"key":"access_availability","value":"weekdays after 14:00","source_ref":"event 003 (tenant portal)… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":129,"entity_type":"contact","entity_id":261,"key":"access_av… |
| 8 | `add_profile_fact` | {"entity_type":"contact","entity_id":262,"key":"requires_consultation_before_remedial_work","value":"true - authorised diagnosis only up to… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":130,"entity_type":"contact","entity_id":262,"key":"requires_… |
| 9 | `add_profile_fact` | {"entity_type":"contact","entity_id":263,"key":"invoice_reliability_note","value":"R/023: issued two overlapping invoices (A £138 diagnosis… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":131,"entity_type":"contact","entity_id":263,"key":"invoice_r… |
| 10 | `escalate_to_human` | {"ticket_id":97,"reason":"Disputed/overlapping contractor invoices including £372 for actuator work never authorised and not evidenced, whi… | ok | {"ok":true,"queue_id":38} |
| 11 | `send_message` | {"ticket_id":97,"to":"tenant","channel":"email","subject":"Heating repair update – 7 Larkspur Fold (ref R/023)","body":"Dear Ms Vane,\n\nTh… | ok | {"ok":true,"message_id":84,"guard":{"blocked":false,"reasons":[],"probs":{"claims_work_done_unverified":0.05,"promises_… |
| 12 | `place_hold` | {"ticket_id":97,"reason":"Awaiting landlord decision on the £372 actuator repair and the overlapping invoices (ev 023), and contractor's cl… | ok | {"ok":true,"hold_id":279} |

Agent's own account of its actions (from the structured result):

- `get_ticket_context` - Loaded ticket, profiles, events -> 23 events, no holds or approvals, stage intake
- `read_attachment` - Read invoice A -> £138 inc VAT, attendance/diagnosis/actuator inspection/test, service date 5 Feb, no itemisation or job sheet
- `read_attachment` - Read invoice B -> £372 inc VAT, actuator supply and replacement plus diagnosis/testing, service date 5 Feb, no itemisation, VAT breakdown or job sheet
- `recall_lessons` - Looked for past team decisions on similar invoice disputes -> No lessons found
- `move_stage` - Moved intake to landlord_approval, which is where the case really is -> Moved
- `add_profile_fact` - Recorded: child in household, tenant access weekdays after 14:00, landlord wants to be consulted before remedial work, contractor's invoice reliability note -> 4 facts recorded, no conflicts
- `escalate_to_human` - Handed over the invoice dispute and the stalled heating repair for a vulnerable household -> queue_id 38, priority high
- `send_message` - Emailed the tenant: repair not yet approved, update by 14 Feb, heater safety and gas emergency advice -> message 84 sent; guard passed
- `place_hold` - Hold waiting on landlord decision and contractor's invoice clarification -> hold 279, follow-up in 2 days

## Approvals

| Party | Status | Channel |
|---|---|---|
| Soren Dallow (landlord) | granted for diagnosis only, up to £180 inc VAT (event 005); remedial work £372 not approved (event 012), decision outstanding (event 023) | email |

## Escalation & handover

- Escalation needed: **yes**
- Reason: Overlapping invoices, one charging £372 for actuator work that was never authorised or evidenced, while a household with a child still has intermittent heating.
- Handover summary: Invoice A £138 matches the diagnostic quote and is within the £180 authority. Invoice B £372 claims the actuator was replaced on 5 Feb. That contradicts the contractor's own 5 Feb update (no remedial work), her estimate sent later that day asking for authorisation, the 7 Feb parts check, and the tenant's account (no visit since 5 Feb). No payment is recorded and no bank-detail change was requested. The contractor can't say whether B replaces A. The landlord was asked how to proceed on 12 Feb and hasn't replied.
- Recommendation: Don't pay either invoice yet. Ask Copper Finch in writing to withdraw invoice B and confirm A (£138) as the only charge; then send A to the landlord for payment. Phone the landlord for a decision on the repair, and consider a second quote if Copper Finch can't provide clear documents.

## What could not be verified

- Whether the actuator was replaced (evidence says no)
- Whether invoice B replaces invoice A or is charged on top
- Whether the £138 diagnosis would be credited against the repair
- Whether the actuator could be repaired instead, and parts availability
- The landlord's decision on further work

## What failed

_No failures recorded._

## Risks & red flags

- Invoice B charges for work that was not authorised and not evidenced, and its service date is earlier than the estimate requesting authorisation
- Possible double charge for attendance and diagnosis across A and B
- Child in household with intermittent heating in February, using a portable heater
- Repair stalled since 5 Feb with the landlord undecided

## Final result / next follow-up

- Final status: Stage landlord_approval; on hold (279) waiting on landlord and contractor; escalated to ops (queue 38, high priority); no invoices paid or forwarded
- Next follow-up: 2025-02-14 - Chase the landlord for a decision on the repair and the invoices, and the contractor for clarification of invoices A/B; update the tenant as promised
- Confidence: 0.85

## Run metadata

- Case folder: `023`
- Session id: wrun_01M4K7BDGMBSXSDEN926TMR84V
- Started: 2026-10-10T15:36:50.875Z  Finished: 2026-10-10T15:38:03.458Z  Duration: 72.6s
- Events recorded: 443
- Model(s): anthropic/claude-opus-5.5
- Tokens: in 125385 / out 6764; cost: not reported
