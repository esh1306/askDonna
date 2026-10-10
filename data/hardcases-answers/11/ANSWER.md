# Case 11 - Answer

## Decision

**escalate**

## Summary

The tenant wrote in Polish. Water has been coming through the bathroom ceiling for about an hour, there is water near the socket by the mirror, and an elderly woman lives in the flat above. I treated this as an emergency. I sent the tenant safety advice in Polish and emailed the landlord. I couldn't send anyone out because the records have no contractor and no history for this property, so I passed the case to the operations team at high priority to send someone urgently and check on the neighbour upstairs. A hold is set to follow up in 6 hours.

## Judgement

- **Case type:** safety_emergency
- **Why this decision:** Water still coming in plus water at an electrical socket counts as an emergency under the rules. Intake classification agreed: emergency, safety risk 0.98. Emergency work doesn't need landlord approval, but there was no contractor on record to send, so a person has to arrange it. I gave the tenant safety steps in his own language and told the landlord at the same time.

| Alternative considered | Why not |
|---|---|
| Ask the landlord to approve first | Approval doesn't hold up emergency safety work |
| Assign a contractor | There is no contractor on the ticket or in this property's history |
| Book a normal visit for tomorrow after 14:00 | Too slow for water at an electrical socket |

**Checks performed before acting**

- Ticket context: no history, contacts or contractor
- Translated the Polish message
- Ran the intake classification
- Checked approvals and holds: none existed
- Outgoing messages passed the guard

**Assumptions**

- The flat above is the likely source of the leak
- The tenant reads Polish best

## Actions taken

| # | Tool | Input (gist) | Result | Output (gist) |
|---|---|---|---|---|
| 1 | `get_ticket_context` | {"ticket_id":63} | ok | {"ok":true,"ticket":{"id":63,"case_ref":"R/11","property_id":63,"tenant_id":167,"landlord_id":168,"contractor_id":null,… |
| 2 | `classify_intake` | {"ticket_id":63,"text":"Tenant (Polish): water has been pouring from the bathroom ceiling into the bath for an hour; an elderly lady lives … | ok | {"route":"emergency_dispatch","scope":"emergency_safety","scope_probs":{"maintenance_repair":0.01,"maintenance_admin":0… |
| 3 | `send_message` | {"ticket_id":63,"to":"tenant","channel":"sms","subject":"Wyciek w łazience – Flat 3, 12 Bramble Gardens, Kingsfold, ZZ6 4ZZ (ref. R/11)","b… | ok | {"ok":true,"message_id":19,"guard":{"blocked":false,"reasons":[],"probs":{"claims_work_done_unverified":0.27,"promises_… |
| 4 | `send_message` | {"ticket_id":63,"to":"landlord","channel":"email","subject":"Emergency: water leak through bathroom ceiling near socket – Flat 3, 12 Brambl… | ok | {"ok":true,"message_id":18,"guard":{"blocked":false,"reasons":[],"probs":{"claims_work_done_unverified":0.61,"promises_… |
| 5 | `add_profile_fact` | {"entity_type":"contact","entity_id":167,"key":"preferred_language","value":"Polish (pl) – reported in Polish via WhatsApp; to be confirmed… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":39,"entity_type":"contact","entity_id":167,"key":"preferred_… |
| 6 | `add_profile_fact` | {"entity_type":"property","entity_id":63,"key":"flat_above_occupant","value":"Elderly resident lives in the flat above (possible vulnerabil… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":40,"entity_type":"property","entity_id":63,"key":"flat_above… |
| 7 | `add_profile_fact` | {"entity_type":"property","entity_id":63,"key":"landlord_approval_cap_default_gbp","value":"200 (default cap per case file CRM block; not c… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":41,"entity_type":"property","entity_id":63,"key":"landlord_a… |
| 8 | `escalate_to_human` | {"ticket_id":63,"reason":"Emergency: uncontained water through bathroom ceiling with water at an electrical socket; no contractor on record… | ok | {"ok":true,"queue_id":10} |
| 9 | `place_hold` | {"ticket_id":63,"reason":"Emergency escalated to ops for urgent plumber/electrician dispatch and welfare check; awaiting confirmation of at… | ok | {"ok":true,"hold_id":247} |

Agent's own account of its actions (from the structured result):

- `get_ticket_context` - Loaded ticket 63 -> No contractor, contact details, history, approvals or holds. The CRM shows the address as unknown.
- `classify_intake` - Classified the tenant's report -> Emergency, plumbing, safety risk 0.98, route: emergency dispatch
- `send_message` - Sent the tenant safety advice by SMS, in Polish -> Message 19 queued; the guard let it through
- `send_message` - Emailed the landlord that this is an emergency and urgent attendance is being arranged -> Message 18 queued; the guard let it through
- `add_profile_fact` - Recorded the tenant's preferred language (Polish), an elderly resident in the flat above, and the default £200 approval cap (marked unconfirmed) -> Facts 39, 40 and 41 saved
- `escalate_to_human` - High-priority handover to operations -> Queue item 10
- `place_hold` - Hold waiting on the agency to confirm dispatch, follow-up in 0.25 days -> Hold 247

## Approvals

| Party | Status | Channel |
|---|---|---|
| Mr D. Hewitt (landlord) | not_needed | email (told about the emergency, not asked for approval) |

## Escalation & handover

- Escalation needed: **yes**
- Reason: Emergency: water coming through the ceiling, wet electrical socket, and no contractor on record to send
- Handover summary: Water is coming through the bathroom ceiling, probably from the flat above where an elderly woman lives, and there is water at the socket by the mirror. The tenant speaks Polish. He has had safety advice in Polish and the landlord has been told by email. The ticket was created about 18 hours after the report.
- Recommendation: 1. Phone the tenant, with a Polish speaker if possible, to check he is safe and whether it is still leaking. 2. Send an emergency plumber and an electrician; this is emergency safety work, so it can go ahead without landlord approval. 3. Contact the upstairs flat or the building's freeholder or managing agent, and check on the elderly resident. 4. Phone the landlord and add his contact details and the property address to the CRM.

## What could not be verified

- Whether the leak is still active, or the socket still wet, 18 hours after the report
- Where the leak is coming from and who is responsible for it
- Whether the elderly neighbour upstairs is safe
- Whether the SMS and email reached anyone: no phone number or email is on record
- The £200 default approval cap (from the case file only, not confirmed by the landlord)
- Whether 'tomorrow after 14:00' means 10 Oct

## What failed

- Agent reported: No contractor on record, so I couldn't send anyone myself
- Agent reported: Tenant and landlord contact details are missing and the CRM shows the property address as unknown

## Risks & red flags

- Electrical danger: water at the socket
- Escape of water still active when reported
- A possibly vulnerable elderly resident upstairs
- About 18 hours between the report and the ticket being created
- Language barrier: the tenant wrote in Polish

## Final result / next follow-up

- Final status: intake; escalated (queue 10, high priority); hold 247 waiting on the agency
- Next follow-up: In 6 hours (0.25 days) - Confirm that a plumber and an electrician have been sent, the tenant is safe, and someone has checked on the upstairs neighbour
- Confidence: 0.85

## Run metadata

- Case folder: `C:\Users\sahid\Documents\Projects\Hackathons\DwellyHack\dwelly-agent\data\hardcases\11`
- Session id: wrun_01M4JXGPZPJ52K6AAXFWR4SNWT
- Started: 2026-10-10T12:44:58.675Z  Finished: 2026-10-10T12:45:54.180Z  Duration: 55.5s
- Events recorded: 505
- Model(s): anthropic/claude-opus-5.5
- Tokens: in 77132 / out 5858; cost: not reported
