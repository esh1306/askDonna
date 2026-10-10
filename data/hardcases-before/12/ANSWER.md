# Case 12 - Answer

## Decision

**request_info**

## Summary

The landlord said yes, but only to Harlow Heating and only up to £150. Neither condition can be met: Harlow is booked until 3 November, unless they do an emergency visit at double rate. Quick Fix Heating can come on Monday 6 October but quoted £230, which is not Harlow and is over the cap. I booked no one and emailed the landlord the three options to choose from. I also emailed the tenant an update with a safe valve and bleeding check, and asked whether anyone in the home is vulnerable. The case is on hold with a follow-up in 1 day.

## Judgement

- **Case type:** maintenance
- **Why this decision:** Event 003 is a conditional approval: Harlow only, cap of £150, ask before spending more. Events 004 and 005 show that neither condition can be met without the landlord changing it. The landlord can resolve this directly, so I asked them instead of escalating. I didn't treat it as an emergency because only one room is affected and the rest of the heating works.

| Alternative considered | Why not |
|---|---|
| Assign Quick Fix at £230 | The landlord said Harlow only and nothing over £150 without asking |
| Book Harlow's emergency visit | Double rate is probably over £150 and no price was given |
| Book Harlow for 3 Nov | A five-week wait with no heat in the bedroom; the landlord should decide that trade-off |
| Escalate to a human | The landlord can answer this; nothing needs agency judgement yet |

**Checks performed before acting**

- Approvals in the CRM (none before mine)
- Landlord's conditions vs both contractor offers
- Severity: one room only
- Classifier results for every inbound message
- Property history and profile facts (empty)

**Assumptions**

- 'Monday 6th' means Monday 6 October 2026
- The landlord's reply in event 003 is a reply to the request in event 002

## Actions taken

| # | Tool | Input (gist) | Result | Output (gist) |
|---|---|---|---|---|
| 1 | `get_ticket_context` | {"ticket_id":64} | ok | {"ok":true,"ticket":{"id":64,"case_ref":"R/12","property_id":64,"tenant_id":169,"landlord_id":170,"contractor_id":171,"… |
| 2 | `classify_reply` | {"ticket_id":64,"text":"Yes go ahead but ONLY with Harlow Heating, they did my boiler. Max £150, nothing more without asking me first.","se… | ok | {"autonomy":"review","intent":"conditional_approval","intent_probs":{"approve":0,"decline":0,"conditional_approval":1,"… |
| 3 | `classify_reply` | {"ticket_id":64,"text":"Sorry, we are fully booked until 3 November. We could do an emergency visit sooner but that is double rate.","sende… | ok | {"autonomy":"review","intent":"scheduling","intent_probs":{"quote_or_estimate":0,"invoice":0,"completion_report":0,"sch… |
| 4 | `classify_reply` | {"ticket_id":64,"text":"We can attend Monday 6th. Radiator inspection and valve replacement quote: £230 including parts.","sender_role":"co… | ok | {"autonomy":"review","intent":"scheduling","intent_probs":{"quote_or_estimate":0.45,"invoice":0,"completion_report":0,"… |
| 5 | `classify_intake` | {"ticket_id":64} | ok | {"route":"request_landlord_approval","scope":"maintenance_repair","scope_probs":{"maintenance_repair":1,"maintenance_ad… |
| 6 | `request_landlord_approval` | {"ticket_id":64,"summary":"Bedroom radiator not heating. Landlord approved Harlow Heating only, max £150. Harlow is booked until 3 November… | ok | {"ok":true,"approval_id":33,"message_id":21,"landlord":"Landlord (R/12)","guard":{"blocked":false,"reasons":[],"probs":… |
| 7 | `send_message` | {"ticket_id":64,"to":"tenant","channel":"email","subject":"27 Thistle Lane – bedroom radiator (ref R/12) – update","body":"Hello,\n\nThank … | ok | {"ok":true,"message_id":22,"guard":{"blocked":false,"reasons":[],"probs":{"claims_work_done_unverified":0.1,"promises_s… |
| 8 | `add_profile_fact` | {"entity_type":"contact","entity_id":170,"key":"preferred_contractor_heating","value":"Harlow Heating (did landlord's boiler); landlord sai… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":42,"entity_type":"contact","entity_id":170,"key":"preferred_… |
| 9 | `add_profile_fact` | {"entity_type":"contact","entity_id":170,"key":"spend_cap_requires_asking_gbp","value":"150 (R/12 radiator job: max £150, nothing more with… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":43,"entity_type":"contact","entity_id":170,"key":"spend_cap_… |
| 10 | `add_profile_fact` | {"entity_type":"contact","entity_id":171,"key":"availability_note","value":"Fully booked until 3 November 2026 (as of 3 Oct 2026); emergenc… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":44,"entity_type":"contact","entity_id":171,"key":"availabili… |
| 11 | `move_stage` | {"ticket_id":64,"to":"landlord_approval","reason":"Landlord's conditional approval (event 003: Harlow only, max £150) can't be met: Harlow … | ok | {"ok":true,"from":"intake","to":"landlord_approval","status":"open"} |
| 12 | `place_hold` | {"ticket_id":64,"reason":"Waiting on landlord's choice: Quick Fix £230 Mon 6 Oct vs Harlow (3 Nov standard, or emergency at double rate). T… | ok | {"ok":true,"hold_id":248} |

Agent's own account of its actions (from the structured result):

- `classify_reply` - Classified the landlord's reply and both contractor emails -> Landlord reply: conditional approval (unconditional 0.02). Both contractor emails: review
- `classify_intake` - Classified the original report -> heating_hot_water; severity probabilities split (emergency 0.46); route request_landlord_approval
- `request_landlord_approval` - Emailed the landlord the three options: wait for Harlow (3 Nov), Harlow emergency visit at double rate (price to be obtained), or Quick Fix at £230 on Mon 6 Oct; asked them to reply APPROVE for Quick Fix or DECLINE and name their choice -> approval_id 33 created, email sent, guard passed
- `send_message` - Emailed the tenant: update with no booking claimed, valve and bleeding advice, and a question about vulnerability -> Sent, message 22
- `add_profile_fact` - Saved the landlord's preferred contractor (Harlow), the landlord's £150 cap and Harlow's availability -> 3 facts saved, no conflicts
- `move_stage` - Moved the ticket from intake to landlord_approval -> ok
- `place_hold` - Placed a hold waiting on the landlord, follow-up in 1 day -> hold 248

## Approvals

| Party | Status | Channel |
|---|---|---|
| Landlord (R/12) | conditional (event 003: Harlow only, ≤£150), conditions cannot be met | email |
| Landlord (R/12) | requested (approval 33: Quick Fix £230 or choose a Harlow option) | email |

## Escalation & handover

- Escalation needed: **no**
- Reason: The landlord can settle this themselves by picking an option. Escalate if they don't reply after follow-ups or if the tenant turns out to be vulnerable.
- Recommendation: Act on the landlord's choice: assign Quick Fix if they approve £230, ask Harlow for an emergency price if they want that, or book Harlow from 3 Nov.

## What could not be verified

- How much Harlow's emergency visit would cost (they only said double rate)
- Whether anyone in the home is vulnerable
- Whether the property is tenanted (blank in the CRM)
- The landlord's preferred channel (not recorded, so I used email)
- Quick Fix has not been checked or used before at this property

## What failed

_No failures recorded._

## Risks & red flags

- The tenant has a cold bedroom as weather gets colder; becomes urgent if anyone in the home is vulnerable
- The intake classifier gave 'emergency' a 0.46 probability; I treated it as non-emergency because the rest of the house heats
- The landlord explicitly forbade other contractors and anything over £150, so Quick Fix must not be assigned without a new approval

## Final result / next follow-up

- Final status: landlord_approval stage, on hold waiting on the landlord (hold 248), approval 33 pending
- Next follow-up: 2026-10-04 (1 day) - Chase the landlord for a decision on approval 33; check whether the tenant has replied about vulnerability or the valve check
- Confidence: 0.85

## Run metadata

- Case folder: `C:\Users\sahid\Documents\Projects\Hackathons\DwellyHack\dwelly-agent\data\hardcases\12`
- Session id: wrun_01M4JXH2C8D2PF1AKSPSAWW173
- Started: 2026-10-10T12:45:10.324Z  Finished: 2026-10-10T12:46:04.166Z  Duration: 53.8s
- Events recorded: 369
- Model(s): anthropic/claude-opus-5.5
- Tokens: in 81006 / out 5384; cost: not reported
