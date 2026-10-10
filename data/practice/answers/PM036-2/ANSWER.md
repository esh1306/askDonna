# Case PM036-2 - Answer

## Decision

**wait**

## Summary

The contractor has confirmed that Oliver (Keystone Services) is booked to fit the replacement taps at 9:30am on Wednesday 4 November 2026. He arranged it directly with the tenant by phone (events 038 and 039). He says the work is free of charge because the tap he fitted in February was faulty. Nothing needs a reply from the agency, so I put the ticket on hold waiting for the contractor. I'll follow up after the visit for a completion report.

## Judgement

- **Case type:** maintenance
- **Why this decision:** Event 039 ('All booked in 9.30am Wednesday 4th') matches the contractor's call with the tenant in event 038 (Wed 4 Nov, about 9:30–10:00). classify_reply rated it routine scheduling (autonomy auto, needs_human_response 0.1). The landlord approved the attendance in event 006, and the contractor says the rework is free (event 025), so no new cost decision is needed. The ticket had no open hold, so I added one with a follow-up date so the job doesn't go quiet. This follows lessons #16 and #1: when the provider and tenant have arranged things between them and nothing needs an agency reply, hold rather than intervene. Lesson #19 will apply after the visit: don't assume the work is done, chase for the outcome.

| Alternative considered | Why not |
|---|---|
| Message the tenant to confirm the appointment | The tenant booked it directly with the contractor on the phone (event 038), so another message wouldn't move the job on. |
| Escalate because of the repeated delays and tap problems | A firm date is now booked and the rework is free. Nothing needs agency judgement yet. If the 4 Nov visit fails, I'll reconsider. |
| Move the ticket to close-out | The work hasn't been done yet. The visit is booked for a future date. |

**Checks performed before acting**

- Landlord approval 52 shows as approved ('Yes please!', event 006)
- Checked that the contractor's email (event 039) matches the call record (event 038) on the date and time
- Checked that 4 November 2026 is a Wednesday
- No open holds, approvals or human-queue items before acting
- No invoice or amount on the ticket; rework stated to be free of charge (event 025)
- No safety concern raised: the tenant reports the shower and tap running together (event 030), which is a fault but not a hazard

**Assumptions**

- Keystone Services, 'Oliver' and Oliver Turner are the same contractor
- The rework will not be charged to the landlord, based on the contractor's statement

## Actions taken

| # | Tool | Input (gist) | Result | Output (gist) |
|---|---|---|---|---|
| 1 | `get_ticket_context` | {"ticket_id":95} | ok | {"ok":true,"ticket":{"id":95,"case_ref":"R/PM036-2","property_id":50,"tenant_id":235,"landlord_id":236,"contractor_id":… |
| 2 | `classify_reply` | {"ticket_id":95,"text":"All booked in\n9.30am Wednesday 4th","sender_role":"contractor","context":"Contractor Oliver (Keystone Services) re… | ok | {"autonomy":"auto","intent":"scheduling","intent_probs":{"quote_or_estimate":0,"invoice":0,"completion_report":0,"sched… |
| 3 | `recall_lessons` | {"ticket_id":95,"situation_text":"Contractor confirms appointment booked with tenant (9:30am Wed 4 Nov) to fit replacement tap free of char… | ok | {"ok":true,"count":5,"lessons":[{"id":19,"situation":"A repair visit has been confirmed with both the tenant and the co… |
| 4 | `place_hold` | {"ticket_id":95,"reason":"Waiting for Provider: Oliver (Keystone Services) booked replacement tap installation with tenant for Wed 4 Nov 20… | ok | {"ok":true,"hold_id":246} |
| 5 | `add_profile_fact` | {"entity_type":"contact","entity_id":237,"key":"warranty_rework_free_of_charge","value":"Contractor stated the tap installed in February at… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":138,"entity_type":"contact","entity_id":237,"key":"warranty_… |
| 6 | `add_profile_fact` | {"entity_type":"property","entity_id":50,"key":"shower_tap_history","value":"Shower tap fitted Feb 2026 by Oliver Turner (Keystone Services… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":139,"entity_type":"property","entity_id":50,"key":"shower_ta… |

Agent's own account of its actions (from the structured result):

- `get_ticket_context` - Loaded the ticket context -> Stage is works; approval 52 approved; no open holds
- `classify_reply` - Classified the contractor's email from event 039 -> Intent: scheduling; autonomy: auto; needs_human_response 0.1
- `recall_lessons` - Looked up past decisions on similar cases -> Lessons #16, #1 and #19 apply
- `place_hold` - Put the ticket on hold waiting for the contractor until after the 4 Nov visit -> Hold 246 created, follow-up in 6 days
- `add_profile_fact` - Recorded on the contractor's profile that the rework is free of charge -> Fact 138 recorded
- `add_profile_fact` - Recorded the shower tap history on the property -> Fact 139 recorded

## Approvals

| Party | Status | Channel |
|---|---|---|
| Landlord (Sawyer) | granted | email |

## Escalation & handover

- Escalation needed: **no**
- Reason: A routine booking confirmation; nothing needs agency judgement

## What could not be verified

- That the replacement work will really be free of charge (the contractor says so; there is no written confirmation)
- That the visit on 4 Nov goes ahead
- There is no contact email or phone in the CRM for the tenant, landlord or contractor

## What failed

_No failures recorded._

## Risks & red flags

- This is a repeat failure: the tap fitted in February was faulty, there have been several delays, and the tenant has been without a properly working shower since 24 Sept
- If an invoice arrives, it would conflict with the contractor's statement that the work is free of charge

## Final result / next follow-up

- Final status: The ticket is still in the works stage, on hold waiting for the contractor (hold 246)
- Next follow-up: 2026-11-05 - Chase Keystone Services (Oliver) for the outcome of the 4 Nov installation. If there's no reply, check with the tenant. If an invoice arrives, query it, because the contractor said the work would be free.
- Confidence: 0.88

## Run metadata

- Case folder: `C:\Users\sahid\Documents\Projects\Hackathons\DwellyHack\dwelly-agent\data\practice\cases\PM036-2`
- Session id: wrun_01M4JZX7BV3RB38PHRQ88AS7J7
- Started: 2026-10-10T13:26:45.614Z  Finished: 2026-10-10T13:27:22.714Z  Duration: 37.1s
- Events recorded: 147
- Model(s): anthropic/claude-opus-5.5
- Tokens: in 102158 / out 3792; cost: not reported
