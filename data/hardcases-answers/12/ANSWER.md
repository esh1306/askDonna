# Case 12 - Answer

## Decision

**request_info**

## Summary

The landlord approved the bedroom radiator repair on two conditions: Harlow Heating only, and no more than £150. Neither option we have meets both. Harlow is fully booked until 3 November, and its sooner emergency visit is double rate and not priced. Quick Fix Heating quoted £230 and is not the named firm. I asked the landlord to choose between three options and gave the tenant safe checks to try and an update. Nothing is booked, and a hold is in place to follow up in 2 days.

## Judgement

- **Case type:** maintenance
- **Why this decision:** Event 003 is a conditional approval: Harlow only, £150 maximum, ask before spending more. The classifier also read it as conditional_approval, with only 0.02 chance of being unconditional. Event 004: Harlow can't do a standard visit before 3 November, and an emergency visit is double rate. Event 005: Quick Fix quoted £230, which is £80 over the cap and not the firm the landlord named. Neither option is within the landlord's authority, and only the landlord can decide, so I asked them. This is not a safety emergency: one room is affected, the rest of the house heats normally, and no vulnerability has been recorded. So I didn't dispatch anyone without approval.

| Alternative considered | Why not |
|---|---|
| Assign Quick Fix for Monday 6 October | The landlord explicitly said Harlow only and £150 maximum. £230 is over the cap and the firm isn't the landlord's choice. |
| Book Harlow's emergency visit | It is double rate and unpriced, so it would probably go over £150 without the landlord's say-so. |
| Wait for Harlow's standard slot without asking | The tenant would have a freezing room for about a month. The landlord should make that trade-off knowingly. |
| Escalate to a human | The landlord can resolve this directly. I'll escalate if there's no reply after follow-up or if the tenant reports vulnerability. |
| Treat as an emergency | The classifier's emergency probability was only 0.43. Heating works in the rest of the house and no vulnerability is known, so I asked the tenant about vulnerability instead. |

**Checks performed before acting**

- Approval status: no approval record in the CRM; the landlord's email (event 003) is conditional, so I did not record it as approved
- Compared amounts: Quick Fix £230 against the £150 cap = £80 over
- Contractor: Quick Fix is not the landlord's named contractor (Harlow)
- Harlow's availability and emergency rate (event 004)
- Safety and severity: only one room affected, rest of the heating works, no vulnerability on file
- No existing holds, queue items or property history

**Assumptions**

- Email is a suitable channel for the landlord: no preference is recorded, and the original request (event 002) went by email
- 'Monday 6th' in event 005 means Monday 6 October 2026

## Actions taken

| # | Tool | Input (gist) | Result | Output (gist) |
|---|---|---|---|---|
| 1 | `get_ticket_context` | {"ticket_id":37} | ok | {"ok":true,"ticket":{"id":37,"case_ref":"R/12","property_id":29,"tenant_id":93,"landlord_id":94,"contractor_id":95,"tit… |
| 2 | `classify_intake` | {"ticket_id":37,"estimate_gbp":230} | ok | {"route":"request_landlord_approval","scope":"maintenance_repair","scope_probs":{"maintenance_repair":1,"maintenance_ad… |
| 3 | `classify_reply` | {"ticket_id":37,"text":"Yes go ahead but ONLY with Harlow Heating, they did my boiler. Max £150, nothing more without asking me first.","se… | ok | {"autonomy":"review","intent":"conditional_approval","intent_probs":{"approve":0,"decline":0,"conditional_approval":1,"… |
| 4 | `classify_reply` | {"ticket_id":37,"text":"We can attend Monday 6th. Radiator inspection and valve replacement quote: £230 including parts.","sender_role":"co… | ok | {"autonomy":"review","intent":"quote_or_estimate","intent_probs":{"quote_or_estimate":0.73,"invoice":0,"completion_repo… |
| 5 | `add_profile_fact` | {"entity_type":"contact","entity_id":94,"key":"preferred_contractor_heating","value":"Harlow Heating (did landlord's boiler); landlord said… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":47,"entity_type":"contact","entity_id":94,"key":"preferred_c… |
| 6 | `add_profile_fact` | {"entity_type":"contact","entity_id":94,"key":"approval_cap_r12_gbp","value":"150 (job-specific cap for bedroom radiator, R/12; nothing mor… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":48,"entity_type":"contact","entity_id":94,"key":"approval_ca… |
| 7 | `add_profile_fact` | {"entity_type":"contact","entity_id":95,"key":"availability_note","value":"As of 2026-10-03 fully booked until 3 November 2026; emergency v… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":49,"entity_type":"contact","entity_id":95,"key":"availabilit… |
| 8 | `move_stage` | {"ticket_id":37,"to":"landlord_approval","reason":"Landlord approval sought (event 002) and given only conditionally (event 003: Harlow onl… | ok | {"ok":true,"from":"intake","to":"landlord_approval","status":"open"} |
| 9 | `send_message` | {"ticket_id":37,"to":"landlord","channel":"email","subject":"27 Thistle Lane – bedroom radiator (ref R/12): your decision needed","body":"D… | ok | {"ok":true,"message_id":53,"guard":{"blocked":false,"reasons":[],"probs":{"claims_work_done_unverified":0.51,"promises_… |
| 10 | `send_message` | {"ticket_id":37,"to":"tenant","channel":"email","subject":"27 Thistle Lane – bedroom radiator (ref R/12) update","body":"Dear Tenant,\n\nRe… | ok | {"ok":true,"message_id":55,"guard":{"blocked":false,"reasons":[],"probs":{"claims_work_done_unverified":0.1,"promises_s… |
| 11 | `place_hold` | {"ticket_id":37,"reason":"Awaiting landlord's choice: wait for Harlow (from 3 Nov), price Harlow emergency visit, or approve Quick Fix at £… | ok | {"ok":true,"hold_id":88} |

Agent's own account of its actions (from the structured result):

- `get_ticket_context` - Loaded the case -> 5 events, no approvals, holds or property history
- `classify_intake` - Classified the job with the £230 estimate -> Heating category; routed to landlord approval; emergency probability 0.43
- `classify_reply` - Classified the landlord reply (event 003) -> Conditional approval; flagged for review
- `classify_reply` - Classified the Quick Fix reply (event 005) -> Quote; flagged for review
- `add_profile_fact` - Recorded that the landlord wants Harlow Heating for this job -> fact 47
- `add_profile_fact` - Recorded the landlord's £150 cap for job R/12 -> fact 48
- `add_profile_fact` - Recorded Harlow's availability and emergency rate -> fact 49
- `move_stage` - Moved the ticket from intake to landlord_approval -> ok
- `send_message` - Emailed the landlord three options: wait for Harlow, get a price for Harlow's emergency visit, or approve Quick Fix at £230 -> message 53 sent
- `send_message` - Emailed the tenant an update, safe valve and bleeding checks, and asked about vulnerability -> message 55 sent
- `place_hold` - Hold waiting on the landlord, 2-day follow-up -> hold 88

## Approvals

| Party | Status | Channel |
|---|---|---|
| Landlord | granted only with conditions (Harlow only, max £150), which no available option meets; new decision requested | email |

## Escalation & handover

- Escalation needed: **no**
- Reason: The landlord can resolve the choice directly. Escalate if there is no reply after follow-up, the tenant reports vulnerability, or the landlord asks for anything above the cap without clear approval.
- Recommendation: If the landlord picks option 3, record the approval at £230 and assign Quick Fix. If they pick option 2, ask Harlow for a price and take it back to the landlord. If they pick option 1, book Harlow from 3 November.

## What could not be verified

- Price of Harlow's emergency visit
- Whether Quick Fix's £230 is a fixed price or an estimate
- Whether anyone in the household is vulnerable
- Landlord's preferred contact channel
- Whether the cause is a valve, trapped air or sludge

## What failed

_No failures recorded._

## Risks & red flags

- A cold bedroom heading into autumn; if a vulnerable occupant is reported, treat it as urgent and escalate
- Quick Fix's 6 October slot may lapse while we wait for the landlord

## Final result / next follow-up

- Final status: landlord_approval stage; on hold waiting for the landlord (hold 88)
- Next follow-up: 2 days from now (around 2026-10-05) - Chase the landlord's choice of option; check the tenant's reply on vulnerability and whether the checks fixed the radiator
- Confidence: 0.85

## Run metadata

- Case folder: `C:\Users\sahid\Documents\Projects\Hackathons\DwellyHack\dwelly-agent\data\hardcases\12`
- Session id: wrun_01M4JY93E5K2T4RZA2TG2FX3GB
- Started: 2026-10-10T12:58:17.868Z  Finished: 2026-10-10T12:59:13.119Z  Duration: 55.3s
- Events recorded: 421
- Model(s): anthropic/claude-opus-5.5
- Tokens: in 99432 / out 6035; cost: not reported
