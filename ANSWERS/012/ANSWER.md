# Case 012 - Answer

## Decision

**wait**

## Summary

Keypath Repairs (Edrin Moss) says on the phone that the window-lock work was done on 19 Sept. Nothing on file backs this up. On 17 Sept Edrin said he had not collected the management keys and could not find the tenant at home. There is also no visit record and no invoice. I've asked the tenant to confirm whether anyone came and whether the locks and keys now work, and asked about the bathroom mould. I've asked Keypath to send its invoice with the visit date, how they got in, what was done to each window and how many keys were supplied. The ticket is on hold until 27 Sept. No invoice goes to the landlord until both replies are in and they match.

## Judgement

- **Case type:** maintenance
- **Why this decision:** The only evidence the work was done is Edrin's word (events 023/025). It conflicts with his 17 Sept statement (event 022): no keys collected, tenant out at work. The tenant can settle this quickly, so I asked them rather than escalating. Paying or forwarding an invoice would need proof the work was done and a check of the amount, especially as the landlord set no cost limit (event 003). So the right move is to get both sides' accounts and hold the ticket with a follow-up date. classify_reply suggested human review (needs_human_response 0.72, dissatisfied 0.45). That fits holding off on closing, not escalating straight away. recall_lessons returned no lessons to follow.

| Alternative considered | Why not |
|---|---|
| Accept the completion claim and move to close-out | Nothing on file shows a visit, and the claim contradicts event 022. That breaks the rule against treating work as done without confirmation. |
| Escalate to a human now | The tenant and contractor can answer the open questions. Escalating now would stall a routine job. If the replies conflict or the invoice doesn't match, I'll escalate. |
| Ask the landlord for approval again so the CRM stage can move | The landlord already approved by email (event 003). Asking again would be noise. I recorded the approval as a profile fact instead. |

**Checks performed before acting**

- Approvals: the landlord approved by email (event 003) with no cost limit or scope. There is no approval record in the CRM, so moving to scheduling was refused.
- Contractor: Hearthline Access was stood down (event 012) and Keypath Repairs instructed (event 018).
- Dates and access: Keypath said on 17 Sept they had no keys and no access, then claimed the work was done on 19 Sept. The two statements conflict.
- Invoice: none on file and no attachments, so there is no amount to check.
- Safety: the tenant reported bathroom mould (event 006). There are no emergency signs. A bedroom sash that won't lock is a security issue to keep an eye on.
- Lessons: none found.

**Assumptions**

- The landlord's 'proceed' in event 003 covers inspection and repair of the sash locks and keys, but not an open-ended amount.

## Actions taken

| # | Tool | Input (gist) | Result | Output (gist) |
|---|---|---|---|---|
| 1 | `get_ticket_context` | {"ticket_id":86} | ok | {"ok":true,"ticket":{"id":86,"case_ref":"R/012","property_id":80,"tenant_id":230,"landlord_id":231,"contractor_id":232,… |
| 2 | `recall_lessons` | {"ticket_id":86,"situation_text":"Contractor verbally claims lock work completed on a date when access was unconfirmed (no keys collected, … | ok | {"ok":true,"count":0,"lessons":[]} |
| 3 | `classify_reply` | {"ticket_id":86,"text":"Edrin says the work is complete and promises to send the invoice later today.","sender_role":"contractor","context"… | ok | {"autonomy":"review","intent":"completion_report","intent_probs":{"quote_or_estimate":0,"invoice":0.29,"completion_repo… |
| 4 | `move_stage` | {"ticket_id":86,"to":"scheduling","reason":"Landlord authorised the agency to proceed with its own provider for the lock work (event 003); … | FAILED: Move to 'scheduling' refused: No landlord approval or standing authority is on record for this ticket. Request approval… |  |
| 5 | `send_message` | {"ticket_id":86,"to":"tenant","channel":"email","subject":"Window locks – Unit 2, 18 Brindlewick Mews (ref R/012)","body":"Dear Perrin,\n\n… | ok | {"ok":true,"message_id":62,"guard":{"blocked":false,"reasons":[],"probs":{"claims_work_done_unverified":0.47,"promises_… |
| 6 | `send_message` | {"ticket_id":86,"to":"contractor","channel":"email","subject":"Invoice and visit details – Unit 2, 18 Brindlewick Mews (ref R/012)","body":… | ok | {"ok":true,"message_id":63,"guard":{"blocked":false,"reasons":[],"probs":{"claims_work_done_unverified":0.07,"promises_… |
| 7 | `add_profile_fact` | {"entity_type":"contact","entity_id":230,"key":"access_preference","value":"Usually at work during the day; asks contractors to use managem… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":92,"entity_type":"contact","entity_id":230,"key":"access_pre… |
| 8 | `add_profile_fact` | {"entity_type":"contact","entity_id":231,"key":"approval_r012_lock_work","value":"Authorised agency to use its own provider for window lock… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":93,"entity_type":"contact","entity_id":231,"key":"approval_r… |
| 9 | `add_profile_fact` | {"entity_type":"property","entity_id":80,"key":"reported_bathroom_mould","value":"Tenant reported mould appearing in bathroom (bathroom sas… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":94,"entity_type":"property","entity_id":80,"key":"reported_b… |
| 10 | `add_profile_fact` | {"entity_type":"contact","entity_id":232,"key":"reliability_note","value":"Keypath Repairs (Edrin Moss) did not confirm visit times after 3… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":95,"entity_type":"contact","entity_id":232,"key":"reliabilit… |
| 11 | `place_hold` | {"ticket_id":86,"reason":"Waiting for tenant to confirm whether Keypath attended and locks/keys now work, and for Keypath's invoice with at… | ok | {"ok":true,"hold_id":268} |

Agent's own account of its actions (from the structured result):

- `get_ticket_context` - Loaded the ticket, profiles and all 25 events -> Stage intake; no holds, no approval records, no attachments
- `recall_lessons` - Looked for past lessons on unverified completion claims -> No lessons
- `classify_reply` - Classified Edrin's latest call (completion claim) -> completion_report 0.71; autonomy review; needs_human_response 0.72
- `move_stage` (FAILED) - Tried to move the ticket from intake to scheduling, based on the landlord's approval in event 003 -> Refused: no landlord approval or standing authority is recorded in the CRM
- `send_message` - Emailed the tenant asking whether Keypath attended, whether the locks and keys now work, and about the bathroom mould; follow-up on 27 Sept -> Queued, message 62
- `send_message` - Emailed Keypath asking for the invoice plus visit date, how they got in, work done per window, keys supplied and an itemised breakdown -> Queued, message 63
- `add_profile_fact` - Recorded the tenant's access preference (at work in the day; management keys) -> Fact 92
- `add_profile_fact` - Recorded the landlord's approval for the lock work (no cost limit) -> Fact 93
- `add_profile_fact` - Recorded the reported bathroom mould on the property -> Fact 94
- `add_profile_fact` - Recorded a reliability note on Keypath Repairs -> Fact 95
- `place_hold` - Put the ticket on hold waiting for the tenant's confirmation and Keypath's invoice -> Hold 268, follow-up in 2 days

## Approvals

| Party | Status | Channel |
|---|---|---|
| Sella Marr (landlord) | granted by email (event 003), no cost limit; not recorded as an approval in the CRM | email |

## Escalation & handover

- Escalation needed: **no**
- Reason: Not needed yet: the tenant and contractor can answer the open questions.
- Recommendation: Escalate if the tenant says nobody came or the locks still don't work, if the invoice doesn't match the work described, or if Keypath doesn't send it by the follow-up date. Separately, someone should add the landlord's event 003 approval to the CRM so the stage can move past intake.

## What could not be verified

- That Keypath went to the property on 19 Sept or did any work
- How Keypath got in, given they said on 17 Sept they had no keys
- Whether keys were supplied for the bedroom, bathroom and kitchen sashes
- The invoice amount (nothing received)
- What date and time Tarin Vale and the tenant agreed (event 016)
- How bad the bathroom mould is now

## What failed

- Tool `move_stage` failed: Move to 'scheduling' refused: No landlord approval or standing authority is on record for this ticket. Request approval with request_landlord_approval (or record the landlord's clear answer with record_approval_response) before assigning a contractor or moving the job into scheduling, works or clos…
- Agent reported: move_stage to scheduling was refused because the landlord's email approval (event 003) isn't recorded as an approval in the CRM, so the ticket is still at 'intake'

## Risks & red flags

- Keypath says the work is done, but this contradicts their own 17 Sept statement about having no access
- The landlord set no cost limit, so any invoice needs checking before it goes to the landlord
- The bedroom sash may still not lock (a security issue) if the work wasn't actually done
- Bathroom mould reported on 9 Sept with nothing done; the stuck sash may be limiting ventilation
- Keypath has been unreliable about confirming visit times

## Final result / next follow-up

- Final status: On hold (hold 268) waiting for the tenant's confirmation and Keypath's invoice with visit details; stage is still intake in the CRM
- Next follow-up: 2025-09-27 - Chase the tenant for confirmation and Keypath for the invoice and visit details. Then check the invoice against the work described. If it is all confirmed and matches, pass the invoice to the landlord and move to close-out. If not, escalate. Raise the bathroom mould as its own job.
- Confidence: 0.8

## Run metadata

- Case folder: `012`
- Session id: wrun_01M4K77DB6BT6Z80TPRG4QM5ER
- Started: 2026-10-10T15:34:39.628Z  Finished: 2026-10-10T15:35:49.256Z  Duration: 69.6s
- Events recorded: 450
- Model(s): anthropic/claude-opus-5.5
- Tokens: in 167510 / out 6798; cost: not reported
