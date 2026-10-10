# Case PM033-1 - Answer

## Decision

**escalate**

## Summary

The landlord agreed by email (event 008) for us to instruct a contractor for the bathroom tap leak. I emailed the tenant to say a plumber is being arranged, gave safe steps to limit the water, and asked for their availability and any access needs. I couldn't assign anyone because no plumber is on record for this ticket or property, and I won't invent one. I've passed the case to a person to choose a plumber (queue 19) and put a 1-day hold on it so it gets chased.

## Actions taken

| # | Tool | Input (gist) | Result | Output (gist) |
|---|---|---|---|---|
| 1 | `get_ticket_context` | {"ticket_id":63} | ok | {"ok":true,"ticket":{"id":63,"case_ref":"R/PM033-1","property_id":30,"tenant_id":151,"landlord_id":152,"contractor_id":… |
| 2 | `classify_reply` | {"ticket_id":63,"text":"The customer, Freya Mercer, agrees to have a contractor instructed for the property issue reported on Flat 19, 159 … | ok | {"autonomy":"auto","intent":"approve","intent_probs":{"approve":1,"decline":0,"conditional_approval":0,"question":0,"ot… |
| 3 | `classify_intake` | {"ticket_id":63} | ok | {"route":"request_landlord_approval","category":"plumbing","category_probs":{"plumbing":1,"appliance":0,"doors_windows_… |
| 4 | `find_tickets` | {"property_address":"159 Juniper Mews"} | ok | {"matches":1,"tickets":[{"id":63,"case_ref":"R/PM033-1","title":"Bathroom Tap Plumbing Request","category":"plumbing","… |
| 5 | `add_profile_fact` | {"entity_type":"contact","entity_id":152,"key":"prefers_agency_instructs_contractor","value":"yes - agreed for agency to instruct a contrac… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":83,"entity_type":"contact","entity_id":152,"key":"prefers_ag… |
| 6 | `send_message` | {"ticket_id":63,"to":"tenant","channel":"email","subject":"Bathroom tap – Flat 19, 159 Juniper Mews (ref R/PM033-1)","body":"Hello,\n\nRe: … | ok | {"ok":true,"message_id":76,"guard":{"blocked":false,"reasons":[],"probs":{"claims_work_done_unverified":0.36,"promises_… |
| 7 | `escalate_to_human` | {"ticket_id":63,"reason":"Landlord approved instructing a contractor but no plumber is on record for this property or ticket – a person nee… | ok | {"ok":true,"queue_id":19} |
| 8 | `place_hold` | {"ticket_id":63,"reason":"Awaiting agency selection of plumber (human queue 19) and tenant availability.","waiting_on":"agency","follow_up_… | ok | {"ok":true,"hold_id":154} |

Agent's own account of its actions (from the structured result):

- `get_ticket_context` - Loaded the ticket -> 8 events. No contractor, profile facts, property history or attachments.
- `classify_reply` - Classified the landlord's reply (event 008) -> Approve, unconditional 0.85, autonomy auto
- `classify_intake` - Classified the request -> Plumbing. Severity: emergency 0.58 vs routine 0.35. Safety risk 0.55.
- `find_tickets` - Looked for earlier jobs or contractors at this property -> Only this ticket
- `add_profile_fact` - Recorded on the landlord's profile that they agreed to the agency instructing a contractor -> Fact 83 saved
- `send_message` - Emailed the tenant: landlord has agreed, a plumber is being arranged, steps to limit the water, and a request for availability and access needs -> Message 76 sent; guard did not block it
- `escalate_to_human` - Passed to a person to choose and assign a plumber -> Queue item 19
- `place_hold` - Hold waiting on the agency's plumber choice and the tenant's availability -> Hold 154, follow up in 1 day

## Approvals

| Party | Status | Channel |
|---|---|---|
| Landlord (Freya Mercer, per event 008) | granted (agreed to a contractor being instructed; no cost limit stated) | email |

## Escalation & handover

- Escalation needed: **yes**
- Reason: The landlord has approved, but no plumber is on record to assign.
- Handover summary: Tap leaks only while the shower is running. The landlord agreed by email (event 008) for us to instruct a contractor, with no cost limit and no contractor named. The tenant has been emailed with steps to limit the water and asked for availability. There are no contractors on file and no history at this property.
- Recommendation: Choose a panel plumber and assign them with assign_contractor. Send them the address, ref R/PM033-1 and the tenant's availability. Get the landlord's confirmation if the repair quote is significant.

## What could not be verified

- Freya Mercer is described as 'the customer'; I've assumed she is the landlord but haven't confirmed it
- No contact details or preferred channels are on file for the tenant or landlord
- How much the landlord is willing to spend

## What failed

_No failures recorded._

## Risks & red flags

- Water is escaping and could cause damage. The classifier leaned towards emergency (0.58), but the leak only happens while the shower runs, so it can be contained.
- The landlord set no cost limit, so a larger repair may need their approval again.

## Final result / next follow-up

- Final status: provider_selection: on hold waiting on the agency (plumber choice) and the tenant (availability); escalated to queue 19
- Next follow-up: In 1 day (hold 154) - Check a plumber has been chosen and the tenant has sent availability, then assign and notify the plumber and tenant
- Confidence: 0.8

## Run metadata

- Case folder: `C:\Users\sahid\Documents\Projects\Hackathons\DwellyHack\dwelly-agent\data\practice\cases\PM033-1`
- Session id: wrun_01M4JWJ7WSHNCEF0BSM8H5ZRHJ
- Started: 2026-10-10T12:28:20.190Z  Finished: 2026-10-10T12:28:58.695Z  Duration: 38.5s
- Events recorded: 287
- Model(s): anthropic/claude-opus-5.5
- Tokens: in 105087 / out 3836; cost: not reported
