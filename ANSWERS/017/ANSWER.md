# Case 017 - Answer

## Decision

**escalate**

## Summary

I've passed this case to a person because the agency needs to decide the scope and the fire-door question. The landlord hasn't approved the £186 painting quote: he asked whether it could come from the repair budget, and wants the scope and the building's response confirmed before booking. The quote covers paint only. It doesn't deal with a door the building lists as fire-resisting, which catches at the top and was noted closing slowly. I moved the stage forward to landlord approval and placed a hold to chase the building manager. I also updated the tenant, saved key facts to the CRM and briefed the team.

## Judgement

- **Case type:** maintenance
- **Why this decision:** Event 017 asks a question with conditions (confirm scope and building response first). The reply classifier agreed: question, with a 0.02 chance of being an unconditional approval. No spend limit or repair budget is recorded, so I couldn't approve or book. The door is fire-resisting and doesn't close properly (events 005, 010, 013). The quote expressly excludes the closing problem and any fire-safety assessment (event 016 and the attachment). Deciding what to do about the door, and who is responsible for it, needs agency judgement. Nothing is overdue: the building manager was asked only on 12 Feb, so I placed a hold to chase them.

| Alternative considered | Why not |
|---|---|
| Record the landlord's reply as approval and assign Pale Finch | It isn't an unconditional approval, the landlord asked for the building's response first, and painting doesn't fix the door's closing problem. |
| Send a formal £186 approval request to the landlord now | The scope isn't settled (the fire-door question and the building's response are both outstanding), so asking him to approve now would be premature. |
| Wait only, without escalating | The landlord's budget question and the fire-door scope need a decision from the agency. A hold alone would leave those unanswered. |

**Checks performed before acting**

- Read the quote attachment: amount, contractor, address and exclusions
- Classified the landlord's reply in event 017
- Checked approvals and holds (none existed) and the landlord's spend limit (none recorded)
- Recall_lessons returned no lessons
- Checked the building manager's statements on fire-resisting doors and the request to be consulted first
- Checked tenant access and vulnerability notes

**Assumptions**

- 'Repair budget' refers to something not recorded in the CRM
- The family member receiving home care may make the household vulnerable

## Actions taken

| # | Tool | Input (gist) | Result | Output (gist) |
|---|---|---|---|---|
| 1 | `get_ticket_context` | {"ticket_id":91} | ok | {"ok":true,"ticket":{"id":91,"case_ref":"R/017","property_id":85,"tenant_id":245,"landlord_id":246,"contractor_id":247,… |
| 2 | `read_attachment` | {"ticket_id":91,"name":"fire-door-quotation.pdf"} | ok | {"ok":true,"name":"fire-door-quotation.pdf","text":"# Transcription\n\n**Document type:** Contractor quotation (1 page)… |
| 3 | `classify_reply` | {"ticket_id":91,"text":"Replied that the quotation appears affordable and asked whether it can be approved from the repair budget. Asked fo… | ok | {"autonomy":"review","intent":"question","intent_probs":{"approve":0,"decline":0,"conditional_approval":0.14,"question"… |
| 4 | `recall_lessons` | {"ticket_id":91,"situation_text":"Fire-resisting flat entrance door catching at top and closing slowly; decorator quoted £186 to paint only… | ok | {"ok":true,"count":0,"lessons":[]} |
| 5 | `classify_intake` | {"ticket_id":91,"estimate_gbp":186} | ok | {"route":"request_landlord_approval","scope":"maintenance_repair","scope_probs":{"maintenance_repair":1,"maintenance_ad… |
| 6 | `move_stage` | {"ticket_id":91,"to":"landlord_approval","reason":"Inspection done (event 010) and quotation NBL-017-Q1 £186 received (event 011, attachmen… | ok | {"ok":true,"from":"intake","to":"landlord_approval","status":"open"} |
| 7 | `place_hold` | {"ticket_id":91,"reason":"Awaiting building manager (Ravi Dast) reply to 12 Feb scope query on painting the fire-resisting flat entrance do… | ok | {"ok":true,"hold_id":272} |
| 8 | `send_message` | {"ticket_id":91,"to":"tenant","channel":"email","subject":"Entrance door – 14 Lantern Mews (ref R/017)","body":"Dear Ms Vale,\n\nThank you … | ok | {"ok":true,"message_id":73,"guard":{"blocked":false,"reasons":[],"probs":{"claims_work_done_unverified":0.04,"promises_… |
| 9 | `add_profile_fact` | {"entity_type":"contact","entity_id":245,"key":"access_preference","value":"Visits after 10:00 (confirmed 10:30+ for 7 Feb) due to schedule… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":110,"entity_type":"contact","entity_id":245,"key":"access_pr… |
| 10 | `add_profile_fact` | {"entity_type":"contact","entity_id":245,"key":"household_care_needs","value":"Household includes a family member receiving scheduled home-… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":111,"entity_type":"contact","entity_id":245,"key":"household… |
| 11 | `add_profile_fact` | {"entity_type":"contact","entity_id":246,"key":"approval_requirement","value":"Wants a price before any chargeable work; no spending limit … | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":112,"entity_type":"contact","entity_id":246,"key":"approval_… |
| 12 | `add_profile_fact` | {"entity_type":"property","entity_id":85,"key":"flat_entrance_door_fire_resisting","value":"Building file lists flat entrance doors as fire… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":113,"entity_type":"property","entity_id":85,"key":"flat_entr… |
| 13 | `escalate_to_human` | {"ticket_id":91,"reason":"Fire-resisting flat entrance door that catches and was noted closing slowly; landlord's 'approve from repair budg… | ok | {"ok":true,"queue_id":34} |

Agent's own account of its actions (from the structured result):

- `move_stage` - Moved the ticket from intake to landlord_approval, because the quote has been received and is with the landlord -> Moved to landlord_approval
- `place_hold` - Placed a hold while waiting for the building manager's reply to the 12 Feb scope query -> Hold 272 placed, follow-up in 3 days
- `send_message` - Emailed the tenant: no work booked; checking with building management whether painting is suitable; advance notice before visits, which will be after 10:30; keep pulling the door shut and report straight away if it stops latching; update by 17 Feb -> Message 73 queued; guard passed
- `add_profile_fact` - Saved the tenant's access preferences, the household care note, the landlord's approval requirements and the fire-resisting door / building consultation requirement -> Facts 110–113 saved
- `escalate_to_human` - Handover covering the fire-door scope, the landlord's budget question and the recommended next steps -> Queue item 34

## Approvals

| Party | Status | Channel |
|---|---|---|
| Elian Moss (landlord) | inspection approved (event 007); £186 painting quote not approved (only a question asked, event 017) | email |

## Escalation & handover

- Escalation needed: **yes**
- Reason: The door is listed as fire-resisting and catches and closes slowly; the quote is decorative only; and the landlord's 'repair budget' question needs agency judgement.
- Handover summary: £186 paint-only quote (NBL-017-Q1, valid to 28 Feb). The door catches at the top and closes slowly, and has no inspection record. The building manager's reply is pending, and the landlord wants scope and building confirmation before booking. Nothing is booked.
- Recommendation: Chase the building manager (hold 272) and ask whether the building's fire-door programme covers this door. Advise the landlord that the closing problem needs a competent inspection or adjustment coordinated with the building. Then request formal approval for specific amounts before booking anything.

## What could not be verified

- Whether the £186 includes VAT
- Whether painting is suitable for this fire-resisting door
- Who is responsible for the door set (freeholder/building or landlord)
- What 'repair budget' the landlord means
- Whether the tenant's 10 Feb question about painting was answered before today

## What failed

_No failures recorded._

## Risks & red flags

- A fire-resisting flat entrance door is catching and closing slowly, and there is no inspection or certification record
- Painting could affect the door's fire performance if the wrong materials are used
- The household includes a family member receiving home care (possible vulnerability)
- The quote expires on 28 Feb
- The CRM contractor on this ticket (id 247) is the building manager, not Pale Finch Decorating

## Final result / next follow-up

- Final status: landlord_approval stage; on hold for the building manager (hold 272); handed to a person (queue 34)
- Next follow-up: 2025-02-15 - Chase the building manager for the scope response. Update the tenant by 17 Feb.
- Confidence: 0.82

## Run metadata

- Case folder: `017`
- Session id: wrun_01M4K79BYE5YW23PZNRQZJ9WQA
- Started: 2026-10-10T15:35:43.722Z  Finished: 2026-10-10T15:36:59.920Z  Duration: 76.2s
- Events recorded: 550
- Model(s): anthropic/claude-opus-5.5
- Tokens: in 148990 / out 6890; cost: not reported
