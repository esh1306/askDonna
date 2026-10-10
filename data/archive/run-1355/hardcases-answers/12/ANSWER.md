# Case 12 - Answer

## Decision

**request_info**

## Summary

I've asked the landlord to decide how to proceed with the bedroom radiator, and nothing has been booked. Their approval (event 3) only covered Harlow Heating, up to £150. Harlow can't come until 3 November unless it's an emergency visit at double rate (event 4). The other offer, from Quick Fix, is £230, which is over the cap and a different contractor (event 5). I've emailed the landlord the three options, updated the tenant and asked whether anyone in the household is vulnerable, and put the case on hold to follow up in one day.

## Judgement

- **Case type:** maintenance
- **Why this decision:** The landlord's approval in event 3 explicitly excludes other contractors and anything over £150 without asking first. Both options available now break those conditions: Quick Fix at £230 (event 5) and a Harlow emergency visit at double rate (event 4). Only the landlord can make this decision, and they can answer quickly, so I asked them directly rather than escalating. One cold room with the rest of the house heated, and no known vulnerability, doesn't meet the emergency criteria, so this doesn't justify acting without approval.

| Alternative considered | Why not |
|---|---|
| Assign Quick Fix at £230 | The landlord limited the job to Harlow Heating and £150; booking Quick Fix would breach both conditions. |
| Book a Harlow emergency visit | It is double rate with no price given, and would likely go over the £150 cap. |
| Wait for Harlow on 3 November without asking | That would leave the tenant's bedroom without heating for a month without giving the landlord the choice. |
| Escalate to a human | The landlord can resolve this themselves; I'll escalate if they don't reply or if the tenant turns out to be vulnerable. |
| Treat as an emergency | Only one room is affected, the rest of the house is heated, and no vulnerability is recorded. I've asked the tenant about vulnerability. |

**Checks performed before acting**

- Checked the scope and conditions of the landlord's approval (event 3)
- Checked Harlow's availability and its existing profile fact
- Compared the Quick Fix quote of £230 against the £150 cap
- Checked for existing approvals or holds: none
- Ran classify_reply on event 5 (result: review, quote) and classify_intake (category: heating, severity uncertain)
- Checked whether this is an emergency: one room, rest of the house heated

**Assumptions**

- The landlord prefers email, since the earlier exchange was by email; no preferred channel is recorded.
- 'Monday 6th' means Monday 6 October 2026.

## Actions taken

| # | Tool | Input (gist) | Result | Output (gist) |
|---|---|---|---|---|
| 1 | `get_ticket_context` | {"ticket_id":67} | ok | {"ok":true,"ticket":{"id":67,"case_ref":"R/12","property_id":64,"tenant_id":176,"landlord_id":177,"contractor_id":171,"… |
| 2 | `classify_reply` | {"ticket_id":67,"text":"We can attend Monday 6th. Radiator inspection and valve replacement quote: £230 including parts.","sender_role":"co… | ok | {"autonomy":"review","intent":"quote_or_estimate","intent_probs":{"quote_or_estimate":0.65,"invoice":0,"completion_repo… |
| 3 | `classify_intake` | {"ticket_id":67,"estimate_gbp":230} | ok | {"route":"request_landlord_approval","scope":"maintenance_repair","scope_probs":{"maintenance_repair":1,"maintenance_ad… |
| 4 | `add_profile_fact` | {"entity_type":"contact","entity_id":177,"key":"preferred_contractor_heating","value":"Harlow Heating only (they did the boiler); landlord … | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":51,"entity_type":"contact","entity_id":177,"key":"preferred_… |
| 5 | `add_profile_fact` | {"entity_type":"contact","entity_id":177,"key":"approval_cap_r12_radiator_gbp","value":"150 (max £150, nothing more without asking first; c… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":52,"entity_type":"contact","entity_id":177,"key":"approval_c… |
| 6 | `request_landlord_approval` | {"ticket_id":67,"summary":"Bedroom radiator not heating. Harlow Heating (landlord's only approved contractor, £150 cap) is fully booked unt… | FAILED: Blocked by Jev outbound guard (landlord approval request). claims_work_done_unverified (p=0.77): claims work is done/bo… |  |
| 7 | `send_message` | {"ticket_id":67,"to":"tenant","channel":"email","subject":"Bedroom radiator – 27 Thistle Lane (ref R/12)","body":"Hello,\n\nThank you for r… | ok | {"ok":true,"message_id":24,"guard":{"blocked":false,"reasons":[],"probs":{"claims_work_done_unverified":0.22,"promises_… |
| 8 | `move_stage` | {"ticket_id":67,"to":"landlord_approval","reason":"Landlord's approval (event 3) was conditional on Harlow Heating and a £150 cap. Harlow i… | ok | {"ok":true,"from":"intake","to":"landlord_approval","status":"open"} |
| 9 | `request_landlord_approval` | {"ticket_id":67,"summary":"Bedroom radiator not heating. Harlow Heating (the landlord's specified contractor, £150 cap) reports no availabi… | ok | {"ok":true,"approval_id":34,"message_id":25,"landlord":"Landlord (R/12)","guard":{"blocked":false,"reasons":[],"probs":… |
| 10 | `place_hold` | {"ticket_id":67,"reason":"Waiting for the landlord to choose: Quick Fix at £230 (above the £150 cap and not Harlow), a Harlow emergency vis… | ok | {"ok":true,"hold_id":250} |

Agent's own account of its actions (from the structured result):

- `get_ticket_context` - Loaded the case -> 5 events, no approvals or holds
- `classify_reply` - Classified the Quick Fix email (event 5) -> review; quote; needs a human response 0.92
- `classify_intake` - Classified the job -> heating; route: request landlord approval; severity uncertain
- `add_profile_fact` - Recorded on the landlord's profile that heating work must use Harlow Heating only -> fact 51
- `add_profile_fact` - Recorded the £150 cap for this job on the landlord's profile -> fact 52
- `request_landlord_approval` (FAILED) - First attempt to email the landlord the options -> Blocked by the guard as a possible unverified 'approved/done' claim
- `send_message` - Emailed the tenant: update, safe checks on the radiator valves, and a question about vulnerability -> message 24 sent
- `move_stage` - Moved from intake to landlord approval -> ok
- `request_landlord_approval` - Reworded email to the landlord with the three options (Quick Fix at £230 / Harlow emergency visit / wait until 3 November) -> approval 34, message 25
- `place_hold` - Hold waiting on the landlord, follow-up in 1 day -> hold 250

## Approvals

| Party | Status | Channel |
|---|---|---|
| Landlord | Conditional approval (event 3, Harlow Heating only, up to £150); not recorded as an approval in the CRM | email |
| Landlord | requested (approval 34, Quick Fix at £230 or another option) | email |

## Escalation & handover

- Escalation needed: **no**
- Reason: The landlord can make this decision themselves
- Recommendation: Escalate if the landlord hasn't replied after follow-up, or if the tenant reports a vulnerable household member.

## What could not be verified

- Price of a Harlow emergency visit
- Whether anyone in the household is vulnerable
- Whether the Quick Fix 6 October slot is still available
- The landlord's preferred contact channel

## What failed

- Tool `request_landlord_approval` failed: Blocked by Jev outbound guard (landlord approval request). claims_work_done_unverified (p=0.77): claims work is done/booked/paid/approved without evidence in the records: rewrite without claiming completion; say only what is confirmed. Rewrite the text to fix this and retry, or escalate_to_human if…
- Agent reported: First landlord approval email was blocked by the guard; reworded and resent successfully

## Risks & red flags

- Quote is over the cap and from a contractor the landlord didn't choose
- The tenant's bedroom is cold heading into the colder months
- The Quick Fix slot may be lost if the landlord doesn't reply quickly

## Final result / next follow-up

- Final status: landlord_approval, on hold waiting for the landlord (hold 250)
- Next follow-up: 2026-10-04 (in 1 day) - Chase the landlord's decision on approval 34; check the tenant's answer on vulnerability
- Confidence: 0.85

## Run metadata

- Case folder: `C:\Users\sahid\Documents\Projects\Hackathons\DwellyHack\dwelly-agent\data\hardcases\12`
- Session id: wrun_01M4JXMGYZ8NSW32MBQ8PZ2MQW
- Started: 2026-10-10T12:47:03.521Z  Finished: 2026-10-10T12:47:59.524Z  Duration: 56.0s
- Events recorded: 444
- Model(s): anthropic/claude-opus-5.5
- Tokens: in 100180 / out 5848; cost: not reported
