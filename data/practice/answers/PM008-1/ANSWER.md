# Case PM008-1 - Answer

## Decision

**escalate**

## Summary

The landlord hasn't approved the first estimate. They've asked for a second contractor's quote to compare against it. I emailed them to say we'll get a second quote and that no work goes ahead until they choose one. I also told them that our last email had the check-out inspection report attached instead of the estimate. Picking and instructing a second contractor, and finding the missing first estimate, need a person at the agency, so I've passed the case to the human queue and put it on hold until we get the second quote.

## Judgement

- **Case type:** maintenance
- **Why this decision:** Event 009 is a question/conditional request, not an approval (classifier: question 0.73, unconditional approval 0.02, needs human response 0.8). Event 008 asked whether the landlord needs a reply. They do: they asked for a second quote. No second contractor is on record and I can't see the first estimate, so someone at the agency has to source the quote. I let the landlord know so they aren't left waiting.

| Alternative considered | Why not |
|---|---|
| Return to auto mode without replying | The landlord asked a direct question and needs a reply. The job also can't progress without a second quote. |
| Record an approval and assign contractor 1 | The landlord didn't approve anything. They asked for a comparison first. |
| Assign a second contractor myself | There's no second contractor on record or used before at this property. Choosing one is the agency's call. |

**Checks performed before acting**

- Loaded full context: 9 events, no approvals, holds or property history
- Searched 'estimate': no estimate document or amount in the records
- Read both attachments: both are check-out inspection reports, not estimates
- Classified the landlord reply
- Checked the stage: it shows 'scheduling', which is ahead of the evidence

**Assumptions**

- 'Can try one other subcontractor' means the landlord wants a second quote before deciding

## Actions taken

| # | Tool | Input (gist) | Result | Output (gist) |
|---|---|---|---|---|
| 1 | `get_ticket_context` | {"ticket_id":17} | ok | {"ok":true,"ticket":{"id":17,"case_ref":"R/PM008-1","property_id":13,"tenant_id":44,"landlord_id":45,"contractor_id":46… |
| 2 | `classify_reply` | {"ticket_id":17,"text":"Morning, Can try one other subcontractor to quote for comparison? Best","sender_role":"landlord","context":"Agency … | ok | {"autonomy":"review","intent":"question","intent_probs":{"approve":0,"decline":0.01,"conditional_approval":0.25,"questi… |
| 3 | `read_attachment` | {"ticket_id":17,"name":"attachment-03-check-out-inspection-report.pdf"} | ok | {"ok":true,"name":"attachment-03-check-out-inspection-report.pdf","text":"# Transcription\n\n## Page 1\n\n**Northbridge… |
| 4 | `read_attachment` | {"ticket_id":17,"name":"attachment-01-check-out-inspection-report.pdf"} | ok | {"ok":true,"name":"attachment-01-check-out-inspection-report.pdf","text":"# Transcription: Northbridge Lettings, Check-… |
| 5 | `search_case` | {"ticket_id":17,"query":"estimate"} | ok | {"query":"estimate","matches":3,"events":[{"id":219,"ticket_id":17,"ts":"2025-04-03T02:34:11Z","kind":"note","direction… |
| 6 | `send_message` | {"ticket_id":17,"to":"landlord","channel":"email","subject":"Flat 5, 55 Lantern Quay – second quote for check-out works (Ref R/PM008-1 / NB… | ok | {"ok":true,"message_id":27,"guard":{"blocked":false,"reasons":[],"probs":{"claims_work_done_unverified":0.08,"promises_… |
| 7 | `add_profile_fact` | {"entity_type":"property","entity_id":13,"key":"occupancy_status","value":"vacant - tenant has vacated, check-out works pending","source_re… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":31,"entity_type":"property","entity_id":13,"key":"occupancy_… |
| 8 | `add_profile_fact` | {"entity_type":"contact","entity_id":45,"key":"wants_comparison_quotes","value":"yes - asked for a second subcontractor quote for compariso… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":33,"entity_type":"contact","entity_id":45,"key":"wants_compa… |
| 9 | `escalate_to_human` | {"ticket_id":17,"reason":"Landlord requested a second comparison quote; agency must choose and instruct a second contractor, and the origin… | ok | {"ok":true,"queue_id":10} |
| 10 | `place_hold` | {"ticket_id":17,"reason":"Agency to instruct a second contractor for comparison quote (landlord request event 009) and locate original esti… | ok | {"ok":true,"hold_id":61} |

Agent's own account of its actions (from the structured result):

- `classify_reply` - Classified the landlord's email from event 009 -> Question; review; needs human response 0.8
- `read_attachment` - Read both attachments to look for the estimate -> Both are check-out inspection reports; no estimate visible
- `search_case` - Searched the case for 'estimate' -> No estimate document or amount found
- `send_message` - Emailed the landlord: we'll get a second quote, no work goes ahead until they choose, and the previous attachment looked like the inspection report -> Sent (message 27); guard passed
- `add_profile_fact` - Recorded on the landlord's profile that they want comparison quotes (first attempt failed: invalid entity_type, retried as contact) -> Fact 33 recorded
- `add_profile_fact` - Recorded that the property is vacant -> Fact 31 recorded
- `escalate_to_human` - Asked the agency to source a second quote and find the original estimate -> Queue item 10
- `place_hold` - Put the case on hold, waiting on the agency for the second quote -> Hold 61, follow-up in 5 days

## Approvals

| Party | Status | Channel |
|---|---|---|
| Landlord (Langley) | not given: landlord wants a second comparison quote first | email |

## Escalation & handover

- Escalation needed: **yes**
- Reason: The landlord wants a second quote. Choosing and instructing another contractor is the agency's call, and the original estimate isn't in the records.
- Handover summary: The landlord (event 009) wants a second quote for the check-out works before deciding. The estimate emailed in event 006 wasn't actually attached: the inspection report was sent twice. The landlord has had an acknowledgement. No contractor details are in the CRM.
- Recommendation: 1. Find contractor 1's estimate and add it to the ticket. 2. Instruct a second contractor to quote the same scope. 3. Send both quotes to the landlord together. 4. Correct the ticket stage. 5. Send damage costs to the deposit team if a deduction is intended.

## What could not be verified

- Contractor 1's name and estimate amount
- Whether the landlord ever received the actual estimate
- The inspection report's appointment date of 5 January 2026, which doesn't fit the April 2025 case dates

## What failed

- Agent reported: First add_profile_fact call failed (used entity_type 'landlord'); the retry as 'contact' worked

## Risks & red flags

- The estimate was apparently never attached to the landlord email
- The inspection report date conflicts with the case dates
- The stage shows 'scheduling' with nothing approved
- There may be deposit deductions (burnt carpet) for the lettings team

## Final result / next follow-up

- Final status: Open: on hold waiting on the agency for the second quote (hold 61), and in the human queue (item 10). The stage still says 'scheduling'; it needs correcting by a person, because stages can't move backwards.
- Next follow-up: In 5 days (hold 61) - Check the second quote has been instructed or received and both quotes sent to the landlord; update the landlord as promised
- Confidence: 0.85

## Run metadata

- Case folder: `C:\Users\sahid\Documents\Projects\Hackathons\DwellyHack\dwelly-agent\data\practice\cases\PM008-1`
- Session id: wrun_01M4JY6W3NM5QHB5XMMEN6HA2E
- Started: 2026-10-10T12:57:04.836Z  Finished: 2026-10-10T12:58:14.893Z  Duration: 70.1s
- Events recorded: 371
- Model(s): anthropic/claude-opus-5.5
- Tokens: in 131540 / out 5330; cost: not reported
