# Case PM033-1 - Answer

## Decision

**escalate**

## Summary

The landlord has approved the agency instructing a contractor for the leaking bathroom tap (event 008), but I couldn't assign one because there's no plumber on record and the landlord didn't name one. Choosing a provider needs agency judgement, so it's in the operations queue (item 29) at normal priority. I emailed the tenant to say a plumber is being arranged, gave them safe steps to contain the leak and asked when they're available. A hold is set to follow up in 1 day.

## Judgement

- **Case type:** maintenance
- **Why this decision:** Event 008 is a clear approval of the attendance the agency described in event 003: "agrees to have a contractor instructed". The classifier agrees (approve p=1.0, unconditional 0.84, auto). Normally the next step would be assign_contractor. But the ticket has no contractor, the property has no previous jobs and the landlord didn't name anyone. Picking a name would mean inventing one, so choosing the provider has to go to ops.

| Alternative considered | Why not |
|---|---|
| Assign a contractor now | No contractor appears anywhere in the records, so any name would be made up. |
| Ask the landlord to name a contractor | The landlord has already handed the choice to the agency. Asking again would hold up approved work. |
| Treat it as an emergency and escalate at high priority | The leak only happens while the shower is running, so the tenant can contain it. The emergency score was only 0.57. I sent containment advice and kept the priority at normal, flagged as urgent. |
| Wait with no action | Approved work would stall and the tenant would have no update. |

**Checks performed before acting**

- Checked all 8 events and confirmed the landlord's reply came after the agency's question in event 003
- No pending approval record exists, so record_approval_response did not apply
- Contractor on ticket: none. Property job history: none. Attachments: none
- Classified the landlord's reply (approval) and the intake (plumbing, possible safety risk)
- Checked for conflicts: 'Freya Mercer' is not a conflict because no landlord name is on file, so I recorded it as the name she signed with
- The outbound message to the tenant passed the guard

**Assumptions**

- Freya Mercer is the landlord, or is replying on the landlord's behalf
- The leak can be contained by limiting use of the shower

## Actions taken

| # | Tool | Input (gist) | Result | Output (gist) |
|---|---|---|---|---|
| 1 | `get_ticket_context` | {"ticket_id":65} | ok | {"ok":true,"ticket":{"id":65,"case_ref":"R/PM033-1","property_id":47,"tenant_id":162,"landlord_id":163,"contractor_id":… |
| 2 | `classify_reply` | {"ticket_id":65,"text":"The customer, Freya Mercer, agrees to have a contractor instructed for the property issue reported on Flat 19, 159 … | ok | {"autonomy":"auto","intent":"approve","intent_probs":{"approve":1,"decline":0,"conditional_approval":0,"question":0,"ot… |
| 3 | `classify_intake` | {"ticket_id":65} | ok | {"route":"request_landlord_approval","scope":"maintenance_repair","scope_probs":{"maintenance_repair":0.99,"maintenance… |
| 4 | `add_profile_fact` | {"entity_type":"contact","entity_id":163,"key":"approved_agency_contractor_r_pm033_1","value":"Agreed for agency to instruct a contractor f… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":84,"entity_type":"contact","entity_id":163,"key":"approved_a… |
| 5 | `add_profile_fact` | {"entity_type":"contact","entity_id":163,"key":"name_as_signed","value":"Freya Mercer (named as 'the customer' in landlord's reply)","sourc… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":85,"entity_type":"contact","entity_id":163,"key":"name_as_si… |
| 6 | `move_stage` | {"ticket_id":65,"to":"provider_selection","reason":"Landlord agreed in event 008 for agency to instruct a contractor; case remains in provi… | FAILED: ticket is already in stage 'provider_selection' |  |
| 7 | `send_message` | {"ticket_id":65,"to":"tenant","channel":"email","subject":"Bathroom tap – Flat 19, 159 Juniper Mews (ref R/PM033-1)","body":"Hello,\n\nRe: … | ok | {"ok":true,"message_id":88,"guard":{"blocked":false,"reasons":[],"probs":{"claims_work_done_unverified":0.43,"promises_… |
| 8 | `escalate_to_human` | {"ticket_id":65,"reason":"Landlord approved instructing a contractor but no plumber is on record for this property; someone needs to choose… | ok | {"ok":true,"queue_id":29} |
| 9 | `place_hold` | {"ticket_id":65,"reason":"Landlord approved (event 008); waiting for agency to choose a plumber to assign, and for tenant's availability.",… | ok | {"ok":true,"hold_id":152} |

Agent's own account of its actions (from the structured result):

- `get_ticket_context` - Loaded the case -> 8 events, no contractor, no history, no holds or approvals
- `classify_reply` - Classified the landlord's reply in event 008 -> Approval (p=1.0), autonomy auto
- `classify_intake` - Classified the tenant's report -> Plumbing; emergency 0.57; safety risk 0.55
- `add_profile_fact` - Recorded on the landlord's profile that they agreed to an agency contractor -> Fact 84 saved
- `add_profile_fact` - Recorded the name the landlord signed with -> Fact 85 saved
- `move_stage` (FAILED) - Tried to confirm the stage as provider_selection -> Rejected because the ticket is already in that stage (no change needed)
- `send_message` - Emailed the tenant: plumber being arranged, how to contain the leak, request for availability, update promised within 2 working days -> Message 88 queued, guard passed
- `escalate_to_human` - Asked ops to choose and assign a plumber -> Queue item 29
- `place_hold` - Hold waiting on the agency to choose a plumber, follow-up in 1 day -> Hold 152

## Approvals

| Party | Status | Channel |
|---|---|---|
| Landlord (Freya Mercer) | granted | email (event 008) |

## Escalation & handover

- Escalation needed: **yes**
- Reason: The work is approved, but there's no contractor on record to assign
- Handover summary: The landlord agreed by email (event 008) for the agency to instruct a contractor for the tap that squirts when the shower runs. No cost cap was given. The tenant has had containment advice and been told a plumber is being arranged. No contractor or property history is on file.
- Recommendation: Assign a panel plumber on ticket 65 as an urgent job. Get a quote before any significant work and send it to the landlord if it goes beyond a standard call-out.

## What could not be verified

- Who Freya Mercer is: assumed to be the landlord or acting for them
- Repair cost
- Tenant availability and contact details
- Whether the leak is getting worse

## What failed

- Tool `move_stage` failed: ticket is already in stage 'provider_selection'
- Agent reported: move_stage was rejected because the ticket is already in provider_selection (no change needed)

## Risks & red flags

- Possible water damage if the leak gets worse; the classifier scored safety risk at 0.55
- The landlord set no spend limit, so a quote may need further approval
- The landlord's and tenant's contact details are not on file

## Final result / next follow-up

- Final status: provider_selection, on hold (waiting on the agency to choose a plumber), with ops queue item 29
- Next follow-up: 2026-10-05 (1 day) - Check that a plumber has been assigned, then notify the contractor and the tenant
- Confidence: 0.8

## Run metadata

- Case folder: `C:\Users\sahid\Documents\Projects\Hackathons\DwellyHack\dwelly-agent\data\practice\cases\PM033-1`
- Session id: wrun_01M4JYD24BVB19S6WTN48G3V99
- Started: 2026-10-10T13:00:27.594Z  Finished: 2026-10-10T13:01:12.730Z  Duration: 45.1s
- Events recorded: 328
- Model(s): anthropic/claude-opus-5.5
- Tokens: in 80634 / out 4851; cost: not reported
