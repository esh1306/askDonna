# Case 11 - Answer

## Decision

**escalate**

## Summary

I've treated this as an emergency. The tenant wrote in Polish that water has been coming through the bathroom ceiling for about an hour and is near the socket by the mirror. I texted him safety advice in Polish, told the landlord by email and escalated to the operations team as high priority, because there's no contractor on record for me to send. I also recorded the tenant's language and the elderly neighbour in the flat above, moved the ticket to provider selection and set a 6-hour hold.

## Judgement

- **Case type:** safety_emergency
- **Why this decision:** Water near an electrical socket plus a leak that isn't contained counts as an emergency under our rules. The intake check agreed: emergency, safety risk 0.97. There's no contractor on record, so I couldn't send one myself. The safe steps were: give the tenant safety advice in his language, tell the landlord at the same time, and hand the call-out to a person as high priority.

| Alternative considered | Why not |
|---|---|
| Ask the landlord for approval first | Approval doesn't hold up emergency safety work. Waiting for it would leave the electrical risk in place. |
| Assign a contractor myself | There's no contractor on the ticket, at the property before, or named by the landlord. I won't invent one. |
| Book the visit for tomorrow after 14:00 | The leak is active now and water is near the electrics. It can't wait until tomorrow. |

**Checks performed before acting**

- Loaded the ticket: no events, contractor, property history, contact details or profile facts
- Ran the intake check: emergency, plumbing, safety risk 0.97
- Looked for a landlord spend limit: none on the profile (the £200 cap appears only in the case file)
- No duplicate or open holds or approvals on the ticket

**Assumptions**

- The leak most likely comes from the flat above
- The tenant will receive the SMS (no phone number is on record; he wrote via WhatsApp)
- I used the address from the case file because the CRM property record has a placeholder address

## Actions taken

| # | Tool | Input (gist) | Result | Output (gist) |
|---|---|---|---|---|
| 1 | `get_ticket_context` | {"ticket_id":36} | ok | {"ok":true,"ticket":{"id":36,"case_ref":"R/11","property_id":28,"tenant_id":91,"landlord_id":92,"contractor_id":null,"t… |
| 2 | `classify_intake` | {"ticket_id":36,"text":"Tenant (Polish): water has been coming through the bathroom ceiling into the bath for an hour; an elderly lady live… | ok | {"route":"emergency_dispatch","scope":"emergency_safety","scope_probs":{"maintenance_repair":0.02,"maintenance_admin":0… |
| 3 | `send_message` | {"ticket_id":36,"to":"tenant","channel":"sms","subject":"Przeciek w łazience – Flat 3, 12 Bramble Gardens (R/11)","body":"Dzień dobry Panie… | ok | {"ok":true,"message_id":48,"guard":{"blocked":false,"reasons":[],"probs":{"claims_work_done_unverified":0.59,"promises_… |
| 4 | `send_message` | {"ticket_id":36,"to":"landlord","channel":"email","subject":"Emergency: water leak near electrics – Flat 3, 12 Bramble Gardens (R/11)","bod… | ok | {"ok":true,"message_id":49,"guard":{"blocked":false,"reasons":[],"probs":{"claims_work_done_unverified":0.67,"promises_… |
| 5 | `escalate_to_human` | {"ticket_id":36,"reason":"Emergency: active ceiling leak with water near a bathroom socket; no contractor on record to dispatch out of hour… | ok | {"ok":true,"queue_id":18} |
| 6 | `add_profile_fact` | {"entity_type":"contact","entity_id":91,"key":"preferred_language","value":"Polish","source_ref":"event 1 (tenant WhatsApp 2026-10-09 18:22… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":52,"entity_type":"contact","entity_id":91,"key":"preferred_l… |
| 7 | `add_profile_fact` | {"entity_type":"contact","entity_id":91,"key":"contact_channel_used","value":"WhatsApp","source_ref":"event 1 (tenant WhatsApp 2026-10-09 1… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":53,"entity_type":"contact","entity_id":91,"key":"contact_cha… |
| 8 | `add_profile_fact` | {"entity_type":"property","entity_id":28,"key":"flat_above_occupant","value":"Elderly resident lives in flat above (possible vulnerable nei… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":54,"entity_type":"property","entity_id":28,"key":"flat_above… |
| 9 | `move_stage` | {"ticket_id":36,"to":"provider_selection","reason":"Emergency safety leak (event 1; Jev emergency 1.0). Approval isn't needed for emergency… | ok | {"ok":true,"from":"intake","to":"provider_selection","status":"open"} |
| 10 | `place_hold` | {"ticket_id":36,"reason":"Emergency escalated: waiting for the agency to dispatch an emergency plumber/electrician and confirm the electric… | ok | {"ok":true,"hold_id":86} |

Agent's own account of its actions (from the structured result):

- `classify_intake` - Classified the translated report -> emergency, plumbing, safety risk 0.97, route emergency_dispatch
- `send_message` - SMS to the tenant in Polish with safety advice and next steps -> message 48 queued; guard passed
- `send_message` - Emergency notice to the landlord by email; no cost agreed -> message 49 queued; guard passed
- `escalate_to_human` - High-priority handover for emergency call-out -> queue_id 18
- `add_profile_fact` - Tenant's preferred language: Polish -> fact 52
- `add_profile_fact` - Tenant contacted us via WhatsApp -> fact 53
- `add_profile_fact` - Elderly resident lives in the flat above -> fact 54
- `move_stage` - Moved from intake to provider selection -> ok
- `place_hold` - Hold on the agency for emergency call-out, follow-up in 6 hours -> hold 86

## Approvals

| Party | Status | Channel |
|---|---|---|
| Landlord Mr D. Hewitt | not_needed (emergency safety work); landlord notified | email |

## Escalation & handover

- Escalation needed: **yes**
- Reason: Emergency leak with water near the electrics, and no contractor on record to send
- Handover summary: Water has been coming through the bathroom ceiling of Flat 3, 12 Bramble Gardens into the bath for about an hour, with water near the socket by the mirror. The source is probably the elderly neighbour's flat above. The tenant, who writes in Polish, has had safety advice by SMS. The landlord has had an emergency notice by email. No contractor or cost yet.
- Recommendation: Phone the tenant now, with a Polish speaker if possible, to confirm the electrics are off and the water has stopped. Send an emergency plumber tonight and an electrician to check the socket. Contact the block manager or the flat above, and do a welfare check on the elderly neighbour. Update the landlord on cost by phone.

## What could not be verified

- Where the leak is coming from
- Whether the electrics have been turned off
- Whether the elderly neighbour is OK
- Whether the tenant received the SMS (no phone number on record)
- The landlord's £200 spend limit (only in the case file, not on his profile)
- The full property address (taken from the case file; CRM has a placeholder)

## What failed

_No failures recorded._

## Risks & red flags

- Water near a live socket: risk of electric shock
- Possible vulnerable elderly neighbour above, who may be the source of the leak
- Language barrier: the tenant needs safety advice in Polish
- No contact details on record in the CRM

## Final result / next follow-up

- Final status: provider_selection; escalated (high); hold 86 on the agency
- Next follow-up: In 6 hours (0.25 days) - Check that an emergency contractor has been sent and the electrics are confirmed safe; update the tenant in Polish
- Confidence: 0.85

## Run metadata

- Case folder: `C:\Users\sahid\Documents\Projects\Hackathons\DwellyHack\dwelly-agent\data\hardcases\11`
- Session id: wrun_01M4JY92NG2K2GZP4DX6GE74J1
- Started: 2026-10-10T12:58:17.071Z  Finished: 2026-10-10T12:59:09.481Z  Duration: 52.4s
- Events recorded: 451
- Model(s): anthropic/claude-opus-5.5
- Tokens: in 76343 / out 5640; cost: not reported
