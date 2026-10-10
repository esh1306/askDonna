# Case PM018-1 - Answer

## Decision

**escalate**

## Summary

Riverside Services has not replied to the job instruction or 3 reminders sent between 17 and 23 Dec, so the routine garden job has stalled in scheduling. I've escalated it to the ops team (normal priority) to chase or reassign the contractor. I've also flagged three things: the contractor was given two different tenant phone numbers, the tenant said the garden is communal, and the approval on file has no cost cap. The tenant has been emailed an update and a 3-day follow-up hold is set.

## Judgement

- **Case type:** maintenance
- **Why this decision:** The contractor was instructed in event 008 and reminded in events 009, 010 and 011, and never replied. The system flag in event 012 asks someone to check. A fifth automated reminder is unlikely to work. Someone needs to phone the contractor or reassign the job, and that is agency judgement. The tenant's answer 'communal area' in event 002 raises a question about who is responsible for the garden, which also needs agency judgement. The tenant had not been updated since 17 Dec.

| Alternative considered | Why not |
|---|---|
| Send another reminder to Riverside | Three reminders have already gone unanswered, so one more would only add noise. |
| Reassign to a different contractor myself | There's no other contractor on record. The gardener may be back from leave soon (event 004). Communal responsibility may mean the job belongs to someone else, so a person should decide. |
| Wait | Nothing has happened for 8 days and the system has flagged it. Waiting longer would leave the job sitting silent. |

**Checks performed before acting**

- Read all 12 events and the ticket context
- Approval status: #15 approved, no amount
- Holds: none open before this turn
- Contractor replies: none on the ticket
- Tenant contact numbers in event 008 and events 009-011 don't match
- Tenant said the overgrowth is in a communal area (event 002)
- No attachments are visible

**Assumptions**

- The 'gardener on annual leave' in event 004 refers to Riverside Services
- Today is on or around 25 Dec 2025, the date of the last event

## Actions taken

| # | Tool | Input (gist) | Result | Output (gist) |
|---|---|---|---|---|
| 1 | `get_ticket_context` | {"ticket_id":38} | ok | {"ok":true,"ticket":{"id":38,"case_ref":"R/PM018-1","property_id":30,"tenant_id":96,"landlord_id":97,"contractor_id":98… |
| 2 | `search_case` | {"ticket_id":38,"query":"communal"} | ok | {"query":"communal","matches":1,"events":[{"id":460,"ticket_id":38,"ts":"2025-12-16T07:54:00Z","kind":"note","direction… |
| 3 | `escalate_to_human` | {"ticket_id":38,"reason":"Contractor Riverside Services has not answered the original instruction or 3 reminders over 8 days; the job has s… | ok | {"ok":true,"queue_id":17} |
| 4 | `send_message` | {"ticket_id":38,"to":"tenant","channel":"email","subject":"Garden maintenance – Flat 17, 67 Willowmere Road (ref R/PM018-1)","body":"Dear F… | ok | {"ok":true,"message_id":54,"guard":{"blocked":false,"reasons":[],"probs":{"claims_work_done_unverified":0.16,"promises_… |
| 5 | `add_profile_fact` | {"entity_type":"property","entity_id":30,"key":"garden_area_type","value":"communal (per tenant; responsibility not yet confirmed)","source… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":50,"entity_type":"property","entity_id":30,"key":"garden_are… |
| 6 | `add_profile_fact` | {"entity_type":"contact","entity_id":98,"key":"responsiveness_note","value":"No reply to job instruction plus 3 reminders 17-23 Dec 2025 on… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":51,"entity_type":"contact","entity_id":98,"key":"responsiven… |
| 7 | `place_hold` | {"ticket_id":38,"reason":"Ops to chase Riverside Services (unresponsive after 3 reminders) or reassign, and confirm who is responsible for … | ok | {"ok":true,"hold_id":85} |

Agent's own account of its actions (from the structured result):

- `get_ticket_context` - Loaded the full case -> 12 events, approval #15 approved, no holds, no attachments
- `search_case` - Checked for any other mention of 'communal' -> Only the intake Q&A (event 002)
- `escalate_to_human` - Handed over the unresponsive contractor, the mismatched tenant numbers and the communal responsibility question -> queue_id 17
- `send_message` - Emailed the tenant an update and a 3-day timeline -> message_id 54, guard passed
- `add_profile_fact` - Recorded on the property that the garden is communal (per tenant) -> fact 50
- `add_profile_fact` - Recorded the contractor's non-response on their profile -> fact 51
- `place_hold` - Set a 3-day follow-up waiting on the agency -> hold_id 85

## Approvals

| Party | Status | Channel |
|---|---|---|
| Landlord (R/PM018-1) | granted (approval #15, no amount set; recorded before this turn) | email |

## Escalation & handover

- Escalation needed: **yes**
- Reason: Contractor has not replied to the instruction or 3 reminders, and whether the communal garden is the landlord's responsibility needs agency judgement
- Handover summary: Garden job at Flat 17, 67 Willowmere Road was approved and assigned to Riverside on 17 Dec. Riverside has not replied to anything. The gardener is reportedly on leave. The contractor was given two different tenant numbers. The tenant says the garden is communal. The approval has no cost cap.
- Recommendation: Phone Riverside to get their return date and confirm the tenant number, or reassign the job. Confirm whether the freeholder or managing agent is responsible for the communal garden. Get the landlord to approve any quote amount.

## What could not be verified

- Whether Riverside received the instruction or is on annual leave
- Which tenant phone number is correct
- Whether the garden is communal and who is responsible for it
- Tree size and whether it is a hazard (near cables or the building)
- Access arrangements and pets

## What failed

_No failures recorded._

## Risks & red flags

- Contractor unresponsive for 8 days
- The contractor was given two different tenant numbers (07700 900504 ext 900418 vs 07700 900710)
- The communal area may not be the landlord's responsibility
- Approval was given with no amount, so any quote needs sign-off on the cost

## Final result / next follow-up

- Final status: scheduling – on hold (hold 85, waiting on agency), escalated to human queue item 17
- Next follow-up: in 3 days (around 28 Dec 2025) - Check whether ops has reached Riverside or reassigned the job, and whether communal responsibility is confirmed. Send the tenant the update promised in today's email.
- Confidence: 0.85

## Run metadata

- Case folder: `C:\Users\sahid\Documents\Projects\Hackathons\DwellyHack\dwelly-agent\data\practice\cases\PM018-1`
- Session id: wrun_01M4JY95P570F378VT9CWVK8CV
- Started: 2026-10-10T12:58:20.163Z  Finished: 2026-10-10T12:59:08.630Z  Duration: 48.5s
- Events recorded: 314
- Model(s): anthropic/claude-opus-5.5
- Tokens: in 81541 / out 4519; cost: not reported
