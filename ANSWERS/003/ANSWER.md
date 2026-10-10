# Case 003 - Answer

## Decision

**escalate**

## Summary

I've put the Copper Finch tap-works invoice on hold. It names a different property (28 Larkspur Quay, Brindlewick) and has no amounts or work date. I've asked the contractor for a corrected, itemised invoice and for findings on the vent leak and bedroom damp, which the invoice doesn't cover. I've asked the tenant to confirm the taps are fixed and given them containment advice, and updated the landlord. I escalated the landlord's insurance and roof-leak history requests, plus the invoice mismatch, to a human. A 3-day hold is set on the contractor.

## Judgement

- **Case type:** mixed
- **Why this decision:** The landlord approved the work by email (event 004), but the invoice (event 022 / attachment) names another property and shows no amount. It can't be forwarded or paid, and the contractor needs to correct it. The vent and damp issues were in scope (event 008) but there are no findings on them (event 021). The landlord's requests about building insurance and roof-leak history (events 004 and 005) were never actioned. Insurance is outside the maintenance remit, and the repeated water ingress needs agency judgement. That calls for a human handover, while the contractor and tenant are asked for what only they can answer.

| Alternative considered | Why not |
|---|---|
| Forward the invoice to the landlord and move to close-out | The property address doesn't match, there is no amount, and the vent and damp are unresolved. |
| Close the tap work and open a separate ticket for the roof | The invoice isn't verified yet, and the tenant hasn't confirmed the taps are fixed. |
| Send a new approval request to the landlord so the stage can move forward | The landlord already said yes clearly. Asking again would be redundant, so I've asked a human to record the existing approval instead. |

**Checks performed before acting**

- Invoice property checked against the ticket property: they differ (28 Larkspur Quay, Brindlewick vs 8-12 Juniper Mews, Vellumford)
- Invoice amount: none shown
- Contractor on the invoice matches the assigned contractor (Copper Finch Plumbing)
- Invoice scope checked against the approved scope: taps only, nothing on the vent or damp
- Approval records: none in the CRM, so move_stage was refused
- Booking conflict in events 014-017: resolved by event 017, the visit happened on 12 Sept (event 020)
- No lessons found

**Assumptions**

- The contractor's "8-10 Juniper Mews" in event 020 was a slip, since the tenant confirmed the right building
- The invoice probably belongs to this job despite the wrong address, but that is unconfirmed

## Actions taken

| # | Tool | Input (gist) | Result | Output (gist) |
|---|---|---|---|---|
| 1 | `get_ticket_context` | {"ticket_id":78} | ok | {"ok":true,"ticket":{"id":78,"case_ref":"R/003","property_id":72,"tenant_id":208,"landlord_id":209,"contractor_id":210,… |
| 2 | `read_attachment` | {"ticket_id":78,"name":"tap-works-invoice.pdf"} | ok | {"ok":true,"name":"tap-works-invoice.pdf","text":"## Transcription\n\n**Header (top of page):**\n- Left label: BILLING … |
| 3 | `recall_lessons` | {"ticket_id":78,"situation_text":"Contractor invoice for tap works shows a different property address and no amount; vent leak and bedroom … | ok | {"ok":true,"count":0,"lessons":[]} |
| 4 | `classify_reply` | {"ticket_id":78,"text":"Invoice NBL-003-INV-14 dated 14 Sept 2025, Copper Finch Plumbing. Property: Flat 4, 28 Larkspur Quay, Brindlewick, … | ok | {"autonomy":"review","intent":"invoice","intent_probs":{"quote_or_estimate":0,"invoice":0.99,"completion_report":0.01,"… |
| 5 | `move_stage` | {"ticket_id":78,"to":"works","reason":"Landlord approved \"Yes, please proceed\" (event 004); Copper Finch Plumbing booked (events 008-019)… | FAILED: Move to 'works' refused: No landlord approval or standing authority is on record for this ticket. Request approval with… |  |
| 6 | `send_message` | {"ticket_id":78,"to":"contractor","channel":"email","subject":"Invoice NBL-003-INV-14 query – Flat 4, 8-12 Juniper Mews, Vellumford (ref R/… | ok | {"ok":true,"message_id":44,"guard":{"blocked":false,"reasons":[],"probs":{"claims_work_done_unverified":0.21,"promises_… |
| 7 | `send_message` | {"ticket_id":78,"to":"tenant","channel":"email","subject":"Update on your repairs – Flat 4, 8-12 Juniper Mews (ref R/003)","body":"Dear Eli… | ok | {"ok":true,"message_id":42,"guard":{"blocked":false,"reasons":[],"probs":{"claims_work_done_unverified":0.55,"promises_… |
| 8 | `send_message` | {"ticket_id":78,"to":"landlord","channel":"email","subject":"Repairs update – Flat 4, 8-12 Juniper Mews, Vellumford (ref R/003)","body":"De… | ok | {"ok":true,"message_id":43,"guard":{"blocked":false,"reasons":[],"probs":{"claims_work_done_unverified":0.45,"promises_… |
| 9 | `place_hold` | {"ticket_id":78,"reason":"Waiting on Copper Finch Plumbing for a corrected invoice (wrong property address, no amounts, no work date) and f… | ok | {"ok":true,"hold_id":260} |
| 10 | `escalate_to_human` | {"ticket_id":78,"reason":"Invoice shows the wrong property and no amount; landlord's insurance and roof-leak history requests are unhandled… | ok | {"ok":true,"queue_id":23} |
| 11 | `add_profile_fact` | {"entity_type":"property","entity_id":72,"key":"recurring_roof_leaks_reported","value":"Landlord says roof leaks have happened repeatedly; … | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":71,"entity_type":"property","entity_id":72,"key":"recurring_… |
| 12 | `add_profile_fact` | {"entity_type":"contact","entity_id":208,"key":"agency_key_access_permitted","value":"yes – tenant agreed contractors may collect agency-he… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":72,"entity_type":"contact","entity_id":208,"key":"agency_key… |

Agent's own account of its actions (from the structured result):

- `get_ticket_context` - Loaded the ticket -> Stage intake; no approvals or holds on record
- `read_attachment` - Read the invoice -> Wrong property address, no amounts, no work date
- `recall_lessons` - Looked for team lessons on similar cases -> None found
- `classify_reply` - Classified the invoice -> Invoice; flagged for review (needs_human 0.83)
- `move_stage` (FAILED) - Tried to move the ticket to works -> Refused: no approval on record in the CRM
- `send_message` - Queried the invoice with the contractor and asked for vent and damp findings -> Sent (id 44)
- `send_message` - Asked the tenant to confirm the taps are fixed, gave containment advice and a follow-up date -> Sent (id 42)
- `send_message` - Updated the landlord: invoice on hold, insurance and history questions passed on -> Sent (id 43)
- `place_hold` - Waiting on the contractor, 3 days -> Hold 260
- `escalate_to_human` - Handed over the invoice mismatch, insurance and roof-history requests, and the missing approval record -> Queue 23
- `add_profile_fact` - Recorded on the property that roof leaks are recurring -> Fact 71
- `add_profile_fact` - Recorded that the tenant permits key access -> Fact 72

## Approvals

| Party | Status | Channel |
|---|---|---|
| Owen Vale (Landlord) | granted by email in event 004, not recorded in the CRM | email |

## Escalation & handover

- Escalation needed: **yes**
- Reason: Invoice shows the wrong property and no amount; the insurance and roof-leak history requests are unhandled; recurring water ingress
- Handover summary: The tap work is invoiced, but the invoice gives the wrong address and no amount, so it is queried with the contractor. Vent and damp findings are outstanding. The landlord asked for an insurance check and a review of the roof-leak history, and neither has been actioned. The landlord's approval needs recording in the CRM.
- Recommendation: Record the event-004 approval in the CRM. Hold the invoice until a corrected version arrives. Handle the insurance and freeholder questions. Arrange a roofer or damp survey once the contractor's findings are in.

## What could not be verified

- Whether the invoice relates to this property
- Cost of the work
- Whether the taps are now fixed
- Whether the vent and damp were inspected
- Building insurance cover
- Source of the leak

## What failed

- Tool `move_stage` failed: Move to 'works' refused: No landlord approval or standing authority is on record for this ticket. Request approval with request_landlord_approval (or record the landlord's clear answer with record_approval_response) before assigning a contractor or moving the job into scheduling, works or close-out.
- Agent reported: move_stage to works refused: no approval record in the CRM

## Risks & red flags

- Invoice property address mismatch
- Invoice has no amount
- Recurring roof water ingress and damp left unaddressed
- Possible water near electrics at the bathroom vent

## Final result / next follow-up

- Final status: Open at intake (stage move refused); on hold waiting on the contractor; escalated to a human
- Next follow-up: 2025-09-17 - Chase Copper Finch for the corrected invoice and vent/damp findings; check the tenant's reply on the taps
- Confidence: 0.82

## Run metadata

- Case folder: `003`
- Session id: wrun_01M4K74THZARK2N9ECR8XRNA44
- Started: 2026-10-10T15:33:14.572Z  Finished: 2026-10-10T15:34:29.781Z  Duration: 75.2s
- Events recorded: 574
- Model(s): anthropic/claude-opus-5.5
- Tokens: in 146356 / out 7034; cost: not reported
