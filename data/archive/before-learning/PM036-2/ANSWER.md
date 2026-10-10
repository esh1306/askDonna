# Case PM036-2 - Answer

## Decision

**wait**

## Summary

The landlord approved the job and Keystone Services (Oliver Turner) has booked the replacement tap fitting for Wednesday 4 November 2026 at about 9:30am (events 038 and 039). The contractor says the work is free because it replaces a faulty tap he fitted in February. I emailed the tenant to confirm the booking, recorded the free-of-charge arrangement against the contractor, and put the job on hold with a 7-day follow-up to check it was finished.

## Judgement

- **Case type:** maintenance
- **Why this decision:** The landlord approved in event 006 and the contractor is on the job. The latest inbound message (event 039) books the visit, and it matches the call summary in event 038 (Wed 4 Nov, 9:30–10:00). The classifier rated the message routine scheduling with a low chance of needing a human (0.1). The next step is the contractor's, so the right move is to wait on a hold with a follow-up date. There were no open holds, so I placed a new one.

| Alternative considered | Why not |
|---|---|
| Escalate to a human | No conflict, complaint, safety risk or cost issue. The approved work is booked. |
| Message the contractor | He has just confirmed the booking and said he will report back when it's done (event 037). Chasing him now would add nothing. |
| Move stage to closeout | The work hasn't been done yet. |
| No message to tenant | The tenant has had repeated delays (events 028–031), and a confirmed date plus a check-in time from the agency helps. That is one message. |

**Checks performed before acting**

- Landlord approval: approval 35 approved ('Yes please!', event 006). No amount needed because the contractor says the work is free (event 025).
- Date consistency: event 038 (Wed 4 Nov, 9:30–10:00) matches event 039 (9.30am Wednesday 4th). 4 Nov 2026 is a Wednesday.
- Open holds: none before this action. Open human-queue items: none.
- Property history: a related ticket, R/PM036-1 (id 69, 'Shower Tap Repair'), is still open at landlord_approval.
- Attachments: none on the ticket.

**Assumptions**

- 'Oliver'/'Oliver Turner' is the Keystone Services engineer on this ticket. The 'Isaac Kendall' SMS sender is the agency's automated messaging persona.
- The free-of-charge rework covers the whole repair, including the shower/tap running together reported in event 030.

## Actions taken

| # | Tool | Input (gist) | Result | Output (gist) |
|---|---|---|---|---|
| 1 | `get_ticket_context` | {"ticket_id":70} | ok | {"ok":true,"ticket":{"id":70,"case_ref":"R/PM036-2","property_id":50,"tenant_id":175,"landlord_id":176,"contractor_id":… |
| 2 | `classify_reply` | {"ticket_id":70,"text":"All booked in\n9.30am Wednesday 4th","sender_role":"contractor","context":"Contractor (Oliver Turner, Keystone Serv… | ok | {"autonomy":"auto","intent":"scheduling","intent_probs":{"quote_or_estimate":0,"invoice":0,"completion_report":0,"sched… |
| 3 | `send_message` | {"ticket_id":70,"to":"tenant","channel":"email","subject":"Shower tap repair – Flat 13, 73 Juniper Mews (ref R/PM036-2)","body":"Dear Noah,… | ok | {"ok":true,"message_id":92,"guard":{"blocked":false,"reasons":[],"probs":{"claims_work_done_unverified":0.08,"promises_… |
| 4 | `add_profile_fact` | {"entity_type":"contact","entity_id":177,"key":"warranty_rework_free_of_charge","value":"Oliver Turner (Keystone Services) replacing faulty… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":100,"entity_type":"contact","entity_id":177,"key":"warranty_… |
| 5 | `place_hold` | {"ticket_id":70,"reason":"Contractor booked to fit replacement tap Wed 4 Nov 2026 ~9:30am (events 038, 039). Await completion confirmation … | ok | {"ok":true,"hold_id":168} |

Agent's own account of its actions (from the structured result):

- `get_ticket_context` - Loaded the full ticket, approvals, holds and history -> Stage works, approval 35 approved, no open holds, related ticket 69 open
- `classify_reply` - Classified the contractor's booking confirmation (event 039) -> intent scheduling, autonomy auto, needs_human 0.1
- `send_message` - Emailed the tenant: fitting booked Wed 4 Nov around 9:30am, no charge, check-in by Fri 6 Nov -> Queued, message_id 92, guard passed
- `add_profile_fact` - Recorded on the contractor's profile that the tap replacement is free warranty rework -> Fact 100 saved, no conflict
- `place_hold` - Hold waiting on the contractor to confirm the fitting is complete -> Hold 168, follow-up in 7 days

## Approvals

| Party | Status | Channel |
|---|---|---|
| Landlord (Sawyer) | granted | email |

## Escalation & handover

- Escalation needed: **no**
- Reason: Routine booked works. No conflict, cost or safety issue.

## What could not be verified

- That the work is free of charge (contractor's word only, events 025 and 031)
- That the appointment goes ahead on 4 Nov
- Whether the problem in event 030 (shower and tap running at the same time) is covered by the new tap
- The 'bank holiday Wednesday' in event 028: there is no UK bank holiday in October, so this call summary may be wrong

## What failed

_No failures recorded._

## Risks & red flags

- Repeat fault with a tap fitted in February; contractor reliability is worth watching
- If an invoice arrives, it conflicts with the free-of-charge statement in event 025 and should not be paid without checking
- Related ticket R/PM036-1 (id 69) is still open at landlord_approval and may be a duplicate that needs tidying up
- Long delay for the tenant; risk of dissatisfaction

## Final result / next follow-up

- Final status: works – on hold waiting on the contractor (hold 168) until the fitting on 4 Nov is complete
- Next follow-up: 2026-11-06 (7 days from hold) - Confirm with the contractor and tenant that the tap was fitted on 4 Nov and works. Make sure no invoice is raised for the free rework. Then move to closeout.
- Confidence: 0.86

## Run metadata

- Case folder: `C:\Users\sahid\Documents\Projects\Hackathons\DwellyHack\dwelly-agent\data\practice\cases\PM036-2`
- Session id: wrun_01M4JYE57Q6D20Y2A3TCYZD6VM
- Started: 2026-10-10T13:01:03.500Z  Finished: 2026-10-10T13:01:39.449Z  Duration: 35.9s
- Events recorded: 174
- Model(s): anthropic/claude-opus-5.5
- Tokens: in 94908 / out 3664; cost: not reported
