# Case 6 - Answer

## Decision

**escalate**

## Summary

The tenant reported a live gas smell and a CO alarm at night with a toddler in the property. This is an emergency. I sent the tenant evacuation and safety steps straight away, including the National Gas Emergency Service number 0800 111 999 and 999 if anyone has symptoms. I assigned the preferred gas engineer, Calder Heating, as emergency safety work without approval, and emailed Calder and the landlord. I escalated to on-call staff at high priority so they can phone the tenant, Calder and the landlord, because none of their contact details are in the profiles.

## Judgement

- **Case type:** safety_emergency
- **Why this decision:** Event 281 is a gas escape plus a CO alarm with a vulnerable child present: a life-safety emergency. Jev agreed (emergency_safety, safety_risk 0.98). Under emergency rules, safety advice and dispatch can't wait for approval. A human still needs to make phone calls overnight: to confirm the family is out, get the engineer's attendance confirmed and reach a landlord who is usually unresponsive overnight (event 282). The CRM profiles hold no contact details, so my messages may not be delivered.

| Alternative considered | Why not |
|---|---|
| Request landlord approval before dispatching | Emergency safety work. The landlord is historically non-responsive overnight, so waiting would put lives at risk. |
| Only advise the tenant and wait | An engineer still needs to attend, and the risks need active human follow-up. |
| Escalate only, without messaging the tenant | The tenant asked 'What do I do??', so they needed safety steps immediately. |

**Checks performed before acting**

- Loaded the ticket context: no holds, approvals, history or contact details
- Classified the intake: emergency, safety_risk 0.98
- Checked the landlord's overnight responsiveness and the out-of-hours number (event 282)
- Confirmed the preferred contractor is Calder Heating (event 282)
- All outbound messages passed the guard

**Assumptions**

- The tenant can receive SMS through the CRM outbox even though no number is in the profile
- The National Gas Emergency Service attends to make the supply safe before the private engineer carries out repairs

## Actions taken

| # | Tool | Input (gist) | Result | Output (gist) |
|---|---|---|---|---|
| 1 | `get_ticket_context` | {"ticket_id":22} | ok | {"ok":true,"ticket":{"id":22,"case_ref":"R/6","property_id":17,"tenant_id":56,"landlord_id":57,"contractor_id":null,"ti… |
| 2 | `send_message` | {"ticket_id":22,"to":"tenant","channel":"sms","body":"Flat 2, 5 Linden Terrace (ref R/6): ACT NOW. 1) Get your toddler and everyone out of … | ok | {"ok":true,"message_id":24,"guard":{"blocked":false,"reasons":[],"probs":{"claims_work_done_unverified":0.67,"promises_… |
| 3 | `classify_intake` | {"ticket_id":22} | ok | {"route":"emergency_dispatch","scope":"emergency_safety","scope_probs":{"maintenance_repair":0,"maintenance_admin":0,"t… |
| 4 | `assign_contractor` | {"ticket_id":22,"contractor_name":"Calder Heating","company":"Calder Heating","reason":"Emergency: gas smell plus CO alarm with a toddler i… | ok | {"ok":true,"contractor_id":72,"stage":"scheduling"} |
| 5 | `add_profile_fact` | {"entity_type":"property","entity_id":17,"key":"household_has_young_child","value":"yes - toddler in the household (vulnerable occupant)","… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":26,"entity_type":"property","entity_id":17,"key":"household_… |
| 6 | `add_profile_fact` | {"entity_type":"contact","entity_id":57,"key":"out_of_hours_responsiveness","value":"historically non-responsive overnight; out-of-hours nu… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":27,"entity_type":"contact","entity_id":57,"key":"out_of_hour… |
| 7 | `add_profile_fact` | {"entity_type":"property","entity_id":17,"key":"preferred_gas_engineer","value":"Calder Heating (office closes 17:30; has an emergency line… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":28,"entity_type":"property","entity_id":17,"key":"preferred_… |
| 8 | `send_message` | {"ticket_id":22,"to":"contractor","channel":"email","subject":"EMERGENCY gas/CO callout: Flat 2, 5 Linden Terrace, Harrowby ZZ7 3ZZ (ref R/… | ok | {"ok":true,"message_id":30,"guard":{"blocked":false,"reasons":[],"probs":{"claims_work_done_unverified":0.21,"promises_… |
| 9 | `send_message` | {"ticket_id":22,"to":"landlord","channel":"email","subject":"URGENT: gas smell and CO alarm at Flat 2, 5 Linden Terrace (ref R/6)","body":"… | ok | {"ok":true,"message_id":31,"guard":{"blocked":false,"reasons":[],"probs":{"claims_work_done_unverified":0.43,"promises_… |
| 10 | `escalate_to_human` | {"ticket_id":22,"reason":"Live gas escape and CO alarm with a toddler in the property, overnight. Needs a human to make phone calls now.","… | ok | {"ok":true,"queue_id":11} |
| 11 | `place_hold` | {"ticket_id":22,"reason":"Waiting for the tenant to confirm they're out safely and for Calder Heating's ETA. Chase in 1 hour.","waiting_on"… | ok | {"ok":true,"hold_id":64} |

Agent's own account of its actions (from the structured result):

- `send_message` - Safety SMS to the tenant: evacuate, no ignition sources, gas off at the meter only if quick, call 0800 111 999, call 999 if anyone has CO symptoms -> Queued, message 24
- `classify_intake` - Classified the report -> emergency_dispatch, severity emergency, safety_risk 0.98
- `assign_contractor` - Assigned Calder Heating as emergency safety work without approval -> contractor_id 72, stage scheduling
- `add_profile_fact` - Recorded the toddler in the household, the landlord's overnight non-responsiveness and the preferred gas engineer -> Facts 26, 27 and 28 created
- `send_message` - Emergency callout email to Calder Heating, asking for an ETA and to check before any work beyond making safe and diagnosis -> Queued, message 30
- `send_message` - Emailed the landlord about the emergency and the actions taken, saying approval will be sought for further repair costs -> Queued, message 31
- `escalate_to_human` - High-priority handover for phone calls to the tenant, Calder and the landlord -> queue_id 11
- `place_hold` - Hold to chase the tenant's safety confirmation and Calder's ETA -> hold 64, follow-up 0.25 days

## Approvals

| Party | Status | Channel |
|---|---|---|
| Landlord Ms R. Aziz | not_needed (emergency safety work); landlord informed by email, and approval will be sought for further repair costs | email |

## Escalation & handover

- Escalation needed: **yes**
- Reason: Live gas escape and CO alarm with a toddler present overnight; urgent phone calls needed
- Handover summary: Safety SMS sent to the tenant. Calder Heating assigned as an emergency and emailed. Landlord emailed. The family's safety, Calder's attendance and landlord contact are all unconfirmed, and the profiles hold no contact details.
- Recommendation: On-call staff, now: phone the tenant to confirm everyone is out and 0800 111 999 has been called (call 999 if not, or if anyone has symptoms). Phone Calder's emergency line (check the number) for an ETA. Phone the landlord on 07700 900123. Arrange temporary heating or accommodation if the gas is capped.

## What could not be verified

- Whether the tenant and toddler have evacuated
- Whether the tenant called 0800 111 999
- Whether the messages will be delivered, as there are no contact details in the profiles
- Whether Calder Heating will attend, and its ETA
- The Calder emergency line number in the note (0800 000 0000), which looks like a placeholder
- The cause of the gas smell and CO

## What failed

_No failures recorded._

## Risks & red flags

- Risk to life: gas escape plus carbon monoxide with a young child present
- The landlord is historically non-responsive overnight
- There are no contact details for the tenant, landlord or contractor in the CRM profiles
- The gas may be capped off, leaving the family without heating

## Final result / next follow-up

- Final status: Scheduling. Calder Heating assigned as emergency work; high-priority human queue item 11; hold 64 open.
- Next follow-up: Within 6 hours (hold 64, 0.25 days); on-call staff to phone immediately - Confirm the tenant is out safely, get Calder's ETA and reach the landlord
- Confidence: 0.85

## Run metadata

- Case folder: `C:\Users\sahid\Documents\Projects\Hackathons\DwellyHack\dwelly-agent\data\hardcases\6`
- Session id: wrun_01M4JY7BZ0F7JQY9Y298N34W5T
- Started: 2026-10-10T12:57:21.072Z  Finished: 2026-10-10T12:58:17.861Z  Duration: 56.8s
- Events recorded: 493
- Model(s): anthropic/claude-opus-5.5
- Tokens: in 95798 / out 6190; cost: not reported
