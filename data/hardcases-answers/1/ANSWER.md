# Case 1 - Answer

## Decision

**escalate**

## Summary

Mrs Haddad reported a boiler losing pressure and cold radiators. She is the tenant of Flat 4 in the CRM, but she asked for someone to attend Flat 6, which is let to J. Okafor. She then said the boiler is in a shared utility cupboard on her landing. Until we know which flat's boiler it is, we don't know which landlord to ask or where to send an engineer, and there is no contractor or landlord contact on file. I emailed the tenant to confirm the flat and ask about vulnerability, with safety advice, set a 12-hour hold, and escalated at high priority.

## Judgement

- **Case type:** maintenance
- **Why this decision:** Event 2 shows the sender is the tenant of Flat 4 and that Flat 6 belongs to someone else. Event 4 says the boiler is in a shared landing cupboard, so the boiler could serve either flat or be communal. That decides who pays and who approves. It is urgent (cold weather forecast, event 3; Jev rated it an emergency), but there is no known vulnerable tenant, no leak or gas risk, no contractor on file and no landlord contact. Sending an engineer now could mean the wrong flat or the wrong person paying.

| Alternative considered | Why not |
|---|---|
| Send an engineer as an emergency now | There is no contractor on record, the flat is unconfirmed, no vulnerable tenant is known and there is no gas or water risk. That falls short of the emergency criteria, and it could commit the wrong landlord's money. |
| Ask landlord 2 (Flat 4) for approval | The boiler may belong to Flat 6 or be communal. Landlord 2 also has no contact details or preferred channel on file. |
| Just ask the tenant and wait | It is urgent and the property details conflict. A person should check building records and phone the tenant today rather than wait for an email reply. |

**Checks performed before acting**

- Loaded ticket context (events 1–4)
- Compared the flat in the tenant's request with the CRM tenancy (Flat 4 vs Flat 6)
- Checked for a contractor, landlord contact, spend limit or past jobs: none found
- classify_intake: heating, severity emergency 0.95
- classify_reply on event 4: needs review, access/availability

**Assumptions**

- The 'Thursday afternoon' in event 4 means Thursday of the week starting 28/09

## Actions taken

| # | Tool | Input (gist) | Result | Output (gist) |
|---|---|---|---|---|
| 1 | `get_ticket_context` | {"ticket_id":1} | ok | {"ok":true,"ticket":{"id":1,"case_ref":"R/1","property_id":1,"tenant_id":1,"landlord_id":2,"contractor_id":null,"title"… |
| 2 | `classify_reply` | {"ticket_id":1,"text":"Sorry, I should say - the boiler is in the shared utility cupboard on our landing. I do live on the 2nd floor. Pleas… | ok | {"autonomy":"review","intent":"access_or_availability","intent_probs":{"confirms_fixed":0,"still_broken":0,"access_or_a… |
| 3 | `classify_intake` | {"ticket_id":1,"text":"Boiler keeps losing pressure and radiators are cold. Boiler located in shared utility cupboard on the 2nd-floor land… | ok | {"route":"emergency_dispatch","scope":"maintenance_repair","scope_probs":{"maintenance_repair":1,"maintenance_admin":0,… |
| 4 | `send_message` | {"ticket_id":1,"to":"tenant","channel":"email","subject":"Boiler losing pressure – 18 Orchard Court (ref R/1)","body":"Dear Mrs Haddad,\n\n… | ok | {"ok":true,"message_id":7,"guard":{"blocked":false,"reasons":[],"probs":{"claims_work_done_unverified":0.06,"promises_s… |
| 5 | `place_hold` | {"ticket_id":1,"reason":"Awaiting tenant confirmation of which flat/boiler is affected (Flat 4 per CRM vs Flat 6 named in event 1; boiler i… | ok | {"ok":true,"hold_id":21} |
| 6 | `add_profile_fact` | {"entity_type":"contact","entity_id":1,"key":"availability_note","value":"Says she can be at home Thursday afternoon (week of 2026-09-28) f… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":11,"entity_type":"contact","entity_id":1,"key":"availability… |
| 7 | `add_profile_fact` | {"entity_type":"property","entity_id":1,"key":"boiler_location","value":"Tenant reports boiler is in shared utility cupboard on 2nd-floor l… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":12,"entity_type":"property","entity_id":1,"key":"boiler_loca… |
| 8 | `add_profile_fact` | {"entity_type":"contact","entity_id":1,"key":"preferred_channel","value":"email","source_ref":"events 1 and 4 (tenant reported by email)","… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":13,"entity_type":"contact","entity_id":1,"key":"preferred_ch… |
| 9 | `escalate_to_human` | {"ticket_id":1,"reason":"Urgent no-heating report with conflicting property: CRM tenant of Flat 4 asked for attendance at Flat 6 (let to J.… | ok | {"ok":true,"queue_id":6} |

Agent's own account of its actions (from the structured result):

- `classify_reply` - Classified the tenant follow-up (event 4) -> Needs review, access/availability, needs a human reply 0.56
- `classify_intake` - Classified the report -> Heating/hot water, emergency 0.95, needs landlord approval 0.65
- `send_message` - Emailed the tenant asking her to confirm the flat/boiler and any vulnerability, with interim safety advice; noted Thursday availability without confirming a visit -> Sent, message 7, passed the guard
- `place_hold` - Waiting on tenant clarification -> Hold 21, follow-up in 0.5 days
- `add_profile_fact` - Recorded the tenant's Thursday afternoon availability, the boiler location (unconfirmed which flat it serves) and email as preferred channel -> Facts 11, 12, 13 recorded
- `escalate_to_human` - Escalated at high priority: flats conflict, possible communal boiler, no contractor or landlord contact on file -> Queue item 6

## Approvals

| Party | Status | Channel |
|---|---|---|
| Landlord (unconfirmed: Flat 4 or Flat 6) | not_requested: waiting for the flat to be confirmed | none |

## Escalation & handover

- Escalation needed: **yes**
- Reason: Urgent heating fault where the flat on record and the flat named conflict. The boiler may be communal, and there is no contractor or landlord contact on file.
- Handover summary: Mrs Haddad (CRM: Flat 4) reports the boiler losing pressure and radiators cold, and asked for Flat 6 (let to J. Okafor). The boiler is in the shared 2nd-floor landing cupboard. She is available Thursday afternoon. I emailed her to clarify; hold 21 follows up in 12h.
- Recommendation: Phone the tenant today to confirm the flat and any vulnerability. Check which flat the boiler serves and whether it is communal. Then get the correct landlord's approval (or treat as an emergency if someone vulnerable lives there) and instruct a Gas Safe engineer for Thursday afternoon. Check whether Flat 6's heating is also affected.

## What could not be verified

- Which flat the boiler serves (Flat 4 or Flat 6) and whether it is communal
- Whether anyone in the household is vulnerable
- Landlord contact details and approval route
- Whether J. Okafor at Flat 6 is affected

## What failed

_No failures recorded._

## Risks & red flags

- Cold weather forecast and no heating: could become an emergency if an occupant is vulnerable
- Risk of sending an engineer to, or charging, the wrong flat or landlord
- A shared boiler or cupboard may be the freeholder's responsibility

## Final result / next follow-up

- Final status: Intake. On hold waiting for the tenant (hold 21) and escalated to the human queue at high priority (item 6).
- Next follow-up: 2026-09-28 evening (12h hold) - Chase the tenant's confirmation of the flat and vulnerability; ops to phone her and check building records
- Confidence: 0.8

## Run metadata

- Case folder: `C:\Users\sahid\Documents\Projects\Hackathons\DwellyHack\dwelly-agent\data\hardcases\1`
- Session id: wrun_01M4JY5GH15YE39WY5PNATPE8B
- Started: 2026-10-10T12:56:19.981Z  Finished: 2026-10-10T12:57:23.704Z  Duration: 63.7s
- Events recorded: 467
- Model(s): anthropic/claude-opus-5.5
- Tokens: in 96677 / out 5829; cost: not reported
