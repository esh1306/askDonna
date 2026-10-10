# Case PM043-1 - Answer

## Decision

**act**

## Summary

Ava Rowan, the landlord, clearly approved sending a contractor (event 013), and Oakfield Homes is already on the job, so scheduling carries on. One problem needed fixing: a manual email to the contractor (event 011) gave another person's name and phone number as the tenant. I emailed Oakfield with the correct tenant details and asked them to delete the wrong ones. I also replied to the landlord, put a 3-day hold on the contractor and passed the data issue to the human queue.

## Judgement

- **Case type:** maintenance
- **Why this decision:** Event 013: 'Yes, that is fine to send out a contractor' answers the agency's questions in events 003 and 006. The classifier rated it an unconditional approval (0.92, auto). Oakfield Homes was already assigned (events 008, 010), so no new assignment was needed. Event 011 gave the contractor 'Grace Ashford, 07700 900641', which doesn't match the tenant on the ticket (Isaac Quinn, 07700 900844, event 010). Left as it was, the contractor might ring the wrong person, and someone else's data has been shared. I corrected it with the contractor directly. The possible data protection issue needs a human to decide.

| Alternative considered | Why not |
|---|---|
| No action (system return to auto mode) | The wrong tenant contact would have stayed with the contractor, and the landlord would have had no acknowledgement. |
| Re-assign contractor | Oakfield Homes is already assigned and the landlord approved attendance. Assigning again would add nothing. |
| Escalate and hold the job | The job is approved and routine. Only the data issue needs a human, so the repair can keep moving. |

**Checks performed before acting**

- Landlord reply classified: approve, unconditional 0.92, needs human response 0.09
- Compared tenant details in events 009/010 with event 011: name and phone differ
- Looked for pending approvals or spend limits: none recorded
- No attachments or invoices on the ticket
- No open holds before this action

**Assumptions**

- Grace Ashford's details were pasted from another case by mistake
- 'Oliver' in event 011 is the contact at Oakfield Homes

## Actions taken

| # | Tool | Input (gist) | Result | Output (gist) |
|---|---|---|---|---|
| 1 | `get_ticket_context` | {"ticket_id":78} | ok | {"ok":true,"ticket":{"id":78,"case_ref":"R/PM043-1","property_id":57,"tenant_id":193,"landlord_id":194,"contractor_id":… |
| 2 | `classify_reply` | {"ticket_id":78,"text":"HI Theo\n\nYes, that is fine to send out a contractor.\n\nKind regards\n\nAva Rowan","sender_role":"landlord","cont… | ok | {"autonomy":"auto","intent":"approve","intent_probs":{"approve":1,"decline":0,"conditional_approval":0,"question":0,"ot… |
| 3 | `send_message` | {"ticket_id":78,"to":"contractor","channel":"email","subject":"Correction – tenant contact – R/PM043-1, Flat 8, 118 Meadow Row, Alderwick, … | FAILED: Blocked by Jev outbound guard (message). claims_work_done_unverified (p=0.75): claims work is done/booked/paid/approved… |  |
| 4 | `send_message` | {"ticket_id":78,"to":"landlord","channel":"email","subject":"Washing machine – Flat 8, 118 Meadow Row – R/PM043-1","body":"Hi Ava,\n\nThank… | ok | {"ok":true,"message_id":103,"guard":{"blocked":false,"reasons":[],"probs":{"claims_work_done_unverified":0.47,"promises… |
| 5 | `add_profile_fact` | {"entity_type":"contact","entity_id":194,"key":"approval_r_pm043_1_attendance","value":"Approved contractor attendance for washing machine … | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":115,"entity_type":"contact","entity_id":194,"key":"approval_… |
| 6 | `add_profile_fact` | {"entity_type":"contact","entity_id":194,"key":"preferred_channel","value":"email (replied by email to email+SMS chase)","source_ref":"even… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":116,"entity_type":"contact","entity_id":194,"key":"preferred… |
| 7 | `send_message` | {"ticket_id":78,"to":"contractor","channel":"email","subject":"Correction – tenant contact – R/PM043-1, Flat 8, 118 Meadow Row, Alderwick, … | ok | {"ok":true,"message_id":107,"guard":{"blocked":false,"reasons":[],"probs":{"claims_work_done_unverified":0.11,"promises… |
| 8 | `place_hold` | {"ticket_id":78,"reason":"Waiting for Oakfield Homes to confirm appointment with tenant Isaac Quinn (or send quote if parts needed); correc… | ok | {"ok":true,"hold_id":200} |
| 9 | `escalate_to_human` | {"ticket_id":78,"reason":"Another tenant's name and phone number were sent to the contractor in error (possible data protection incident)",… | ok | {"ok":true,"queue_id":35} |

Agent's own account of its actions (from the structured result):

- `classify_reply` - Classified landlord email event 013 -> approve, unconditional 0.92, auto
- `send_message` (FAILED) - First draft of contractor correction -> Blocked by outbound guard (wording suggested authority to complete repair)
- `send_message` - Landlord acknowledgement: contractor to arrange visit; any quote for parts will come to her for approval -> Sent, message 103
- `add_profile_fact` - Recorded landlord's approval of attendance with no cost cap -> Fact 115
- `add_profile_fact` - Recorded landlord preferred channel as email (low confidence) -> Fact 116
- `send_message` - Rewritten contractor email: correct tenant Isaac Quinn 07700 900844, delete Grace Ashford details, quote before any parts or complex work -> Sent, message 107
- `place_hold` - Waiting on contractor to confirm appointment or send quote -> Hold 200, follow-up in 3 days
- `escalate_to_human` - Wrong tenant contact sent to contractor (possible data protection issue) -> Queue item 35

## Approvals

| Party | Status | Channel |
|---|---|---|
| Ava Rowan (landlord) | granted (contractor attendance; no cost cap stated) | email |

## Escalation & handover

- Escalation needed: **yes**
- Reason: Another person's name and phone number were sent to the contractor in error (event 011)
- Handover summary: Event 011 named Grace Ashford, 07700 900641 as the tenant. The tenant on the ticket is Isaac Quinn, 07700 900844. I have sent the contractor a correction and asked them to delete the wrong details. The repair itself is approved and moving.
- Recommendation: Find which case Grace Ashford belongs to, then assess and log under the data protection process. Confirm Oakfield deleted the details. Consider asking the landlord for a spend limit.

## What could not be verified

- Who Grace Ashford / 07700 900641 is
- Whether Oakfield has already contacted the wrong number
- The 'easy and cheap' instruction in event 011: no matching landlord message is visible before it
- Appointment date (none arranged yet)

## What failed

- Tool `send_message` failed: Blocked by Jev outbound guard (message). claims_work_done_unverified (p=0.75): claims work is done/booked/paid/approved without evidence in the records: rewrite without claiming completion; say only what is confirmed. Rewrite the text to fix this and retry, or escalate_to_human if you cannot.
- Agent reported: First contractor message was blocked by the outbound guard. I rewrote it and sent it.

## Risks & red flags

- Possible data protection incident: a third party's details were shared with the contractor
- No spend limit is recorded, so any repair beyond attendance needs a quote and approval

## Final result / next follow-up

- Final status: scheduling – on hold waiting for contractor (hold 200); human queue item 35 open for the data issue
- Next follow-up: in 3 days (around 2026-04-16) - Chase Oakfield Homes for an appointment date with Isaac Quinn or a quote if parts are needed
- Confidence: 0.85

## Run metadata

- Case folder: `C:\Users\sahid\Documents\Projects\Hackathons\DwellyHack\dwelly-agent\data\practice\cases\PM043-1`
- Session id: wrun_01M4JYFH7YFNJGMJMS8MX9B4K0
- Started: 2026-10-10T13:01:48.593Z  Finished: 2026-10-10T13:02:48.191Z  Duration: 59.6s
- Events recorded: 425
- Model(s): anthropic/claude-opus-5.5
- Tokens: in 112776 / out 5813; cost: not reported
