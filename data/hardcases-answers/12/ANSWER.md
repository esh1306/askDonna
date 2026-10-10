# Case 12 - Answer

## Decision

**request_info**

## Summary

The landlord approved this repair on two conditions: Harlow Heating only, and no more than £150. Neither option we have meets both. Harlow Heating is booked until 3 November, and Quick Fix Heating's quote is £230 from a different firm. So I have booked nobody. I emailed the landlord three options and asked them to choose (approval #35). I updated the tenant and put the case on hold with a follow-up in 2 days.

## Judgement

- **Case type:** maintenance
- **Why this decision:** The landlord said 'ONLY with Harlow Heating' and 'Max £150, nothing more without asking me first' (event 003). Quick Fix Heating breaks both conditions: it's a different firm and £80 over the limit. Harlow's emergency visit is at double rate with no price given, so it would probably go over £150. Waiting for Harlow is the only option within the approval, but it means a 4-week delay. That is the landlord's choice to make, so I asked them, in line with lessons #11 and #9.

| Alternative considered | Why not |
|---|---|
| Assign Quick Fix Heating | Breaks the landlord's contractor condition and is over the £150 limit |
| Book Harlow Heating's emergency visit | Double rate with no price given; the landlord said to ask before spending more than £150 |
| Book Harlow Heating for 3 November without asking | Within the approval, but a 4-week wait with a cold room; the landlord should decide that knowing the other options |
| Treat it as an emergency and escalate | Only one room is affected, the rest of the house is heated and no vulnerable person is recorded |

**Checks performed before acting**

- Checked the landlord's conditions word for word (event 003)
- Compared the £230 quote with the £150 limit
- Checked Harlow Heating's availability (event 004 and the fact on their profile)
- Safety: only one room affected, no vulnerability recorded
- No existing approvals, holds or open human-queue items before acting

**Assumptions**

- Email is the landlord's channel, since they replied to our email

## Actions taken

| # | Tool | Input (gist) | Result | Output (gist) |
|---|---|---|---|---|
| 1 | `get_ticket_context` | {"ticket_id":70} | ok | {"ok":true,"ticket":{"id":70,"case_ref":"R/12","property_id":64,"tenant_id":182,"landlord_id":183,"contractor_id":171,"… |
| 2 | `recall_lessons` | {"ticket_id":70,"situation_text":"Landlord approved up to £150 only with Harlow Heating; Harlow booked until 3 Nov (emergency double rate);… | ok | {"ok":true,"count":5,"lessons":[{"id":11,"situation":"A contractor has replied to a quote request for check-out remedia… |
| 3 | `classify_reply` | {"ticket_id":70,"text":"We can attend Monday 6th. Radiator inspection and valve replacement quote: £230 including parts.","sender_role":"co… | ok | {"autonomy":"review","intent":"quote_or_estimate","intent_probs":{"quote_or_estimate":0.8,"invoice":0,"completion_repor… |
| 4 | `request_landlord_approval` | {"ticket_id":70,"summary":"Bedroom radiator not heating. Landlord approved up to £150 with Harlow Heating only; Harlow is booked until 3 No… | ok | {"ok":true,"approval_id":35,"message_id":27,"landlord":"Landlord (R/12)","guard":{"blocked":false,"reasons":[],"probs":… |
| 5 | `send_message` | {"ticket_id":70,"to":"tenant","channel":"email","subject":"Bedroom radiator – 27 Thistle Lane (ref R/12)","body":"Hello,\n\nHere's an updat… | ok | {"ok":true,"message_id":29,"guard":{"blocked":false,"reasons":[],"probs":{"claims_work_done_unverified":0.05,"promises_… |
| 6 | `place_hold` | {"ticket_id":70,"reason":"Waiting for landlord to choose: wait for Harlow (from 3 Nov), Harlow emergency visit at double rate (price TBC), … | ok | {"ok":true,"hold_id":251} |
| 7 | `add_profile_fact` | {"entity_type":"contact","entity_id":183,"key":"preferred_heating_contractor","value":"Harlow Heating only (did landlord's boiler); require… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":53,"entity_type":"contact","entity_id":183,"key":"preferred_… |
| 8 | `move_stage` | {"ticket_id":70,"to":"landlord_approval","reason":"Landlord approval conditional (event 003: Harlow only, max £150); Harlow unavailable (ev… | ok | {"ok":true,"from":"intake","to":"landlord_approval","status":"on_hold"} |

Agent's own account of its actions (from the structured result):

- `recall_lessons` - Looked up how the team handled similar cases where a quote needs the landlord's agreement -> Lessons #11 and #9: send the quote to the landlord, put the case on hold, and don't instruct the contractor
- `classify_reply` - Classified Quick Fix Heating's quote email -> Classed as a quote; flagged for review (93% chance it needs a human reply)
- `request_landlord_approval` - Emailed the landlord three options: wait for Harlow Heating from 3 November, get a price for Harlow's double-rate emergency visit, or approve Quick Fix Heating at £230 -> Approval #35 created and email sent
- `send_message` - Emailed the tenant: nothing booked yet, we're waiting for the landlord, we'll chase by 6 October, plus tips to check the valve and bleed the radiator -> Sent (message 29)
- `place_hold` - Put the case on hold waiting for the landlord, follow-up in 2 days -> Hold 251
- `add_profile_fact` - Recorded on the landlord's profile that they use only Harlow Heating and want to be asked before any spend over the approved limit -> Fact 53 saved
- `move_stage` - Moved the case from intake to landlord approval -> Now in landlord approval, on hold

## Approvals

| Party | Status | Channel |
|---|---|---|
| Landlord | conditional approval (event 003: Harlow Heating only, max £150); not usable as it stands | email |
| Landlord | requested (#35): choose between the options, including Quick Fix Heating at £230 | email |

## Escalation & handover

- Escalation needed: **no**
- Reason: The landlord can decide this themselves. No safety risk or vulnerable person is recorded, and the rest of the house is heated.
- Recommendation: If the landlord hasn't replied by the follow-up date, chase them. If there's still no reply after that, or the tenant reports anyone vulnerable to the cold, escalate.

## What could not be verified

- Price of Harlow Heating's emergency visit
- Whether Quick Fix Heating's £230 includes VAT
- Whether anyone in the household is vulnerable to the cold

## What failed

_No failures recorded._

## Risks & red flags

- The tenant's bedroom stays cold while we wait; waiting for Harlow Heating means about 4 weeks
- Booking Quick Fix Heating without the landlord's say-so would break their explicit conditions

## Final result / next follow-up

- Final status: In landlord approval, on hold waiting for the landlord to choose (approval #35, hold 251)
- Next follow-up: 2 days after the hold was placed (by about 6 October) - Chase the landlord for their choice if they haven't replied, and keep the tenant updated
- Confidence: 0.85

## Run metadata

- Case folder: `data/hardcases/12`
- Session id: wrun_01M4K15ESJ0TGMSWGSNY1F6WQG
- Started: 2026-10-10T13:48:43.943Z  Finished: 2026-10-10T13:49:31.063Z  Duration: 47.1s
- Events recorded: 304
- Model(s): anthropic/claude-opus-5.5
- Tokens: in 90970 / out 4520; cost: not reported
