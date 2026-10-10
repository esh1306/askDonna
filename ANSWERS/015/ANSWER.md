# Case 015 - Answer

## Decision

**escalate**

## Summary

The £665 post-tenancy quote from Brindlewick does not have a clear, unconditional approval. The landlord made approval depend on recovering the cost from the deposit (events 8 and 10). The deposit is £650 and is in dispute. Her later "approved quote" message (event 16) doesn't say which quote it means. I escalated the approval and deposit questions to the property manager. I placed a hold until 30 Sep to match the agency's "wait 3 working days" instruction. I moved the stage to landlord_approval. I did not assign or book the contractor.

## Judgement

- **Case type:** mixed
- **Why this decision:** Event 8 is a conditional approval: 'Happy to approve if they are recovered from the bond'. Event 10 repeats the condition. Whether the cost can be recovered depends on a disputed £650 deposit claim (event 11), which is less than the £665 quote. Deposits are not mine to decide. Event 16 ('approved quote') doesn't say which quote it means, and when it arrived the separate maintenance quote was the one awaiting approval (event 15). So there is no unconditional approval for this work. The agency has also told the contractor to hold until the major maintenance is done (events 15, 18, 20, 21).

| Alternative considered | Why not |
|---|---|
| Treat event 16 as approval and assign or book Brindlewick | The message doesn't identify which quote it approves and doesn't remove the deposit condition. The agency has also told the contractor to hold until the major maintenance is done. |
| Email the landlord myself to ask which quote she approved | Her answer is tied to the deposit dispute, which the property manager is already handling (event 11). I left it to Mira in the handover so the landlord doesn't get two parallel conversations. |
| Chase the contractor for dates | The contractor has already agreed to wait (events 13 and 19), and the agency says not to book yet. Another message would not move the job on. |
| Only place a hold | The conditional and ambiguous approval and the deposit issue need a person's judgement. A hold alone would leave them unresolved. |

**Checks performed before acting**

- Approval status: no approval record and no spend limit on the landlord's profile; the landlord's replies are conditional (events 8, 10) and ambiguous (event 16)
- Amount: the quote is £665 lump sum with no VAT shown, against a £650 deposit
- Scope: compared the quote with the inspection report. Disturbed soil is not covered, and carpet shampooing is extra to the original request
- The contractor was told 'approved' without the condition (event 9), then told to hold (events 12, 15)
- Dates: the 28 Sep move-in (event 15) against no booking; latest instruction to wait 3 working days (event 21)
- No open holds, queue items or lessons before this action

**Assumptions**

- 3 working days from Thu 25 Sep runs to about Tue 30 Sep, so the follow-up is set 5 calendar days out
- There is no current tenant to notify because the property is vacant

## Actions taken

| # | Tool | Input (gist) | Result | Output (gist) |
|---|---|---|---|---|
| 1 | `get_ticket_context` | {"ticket_id":89} | ok | {"ok":true,"ticket":{"id":89,"case_ref":"R/015","property_id":83,"tenant_id":240,"landlord_id":241,"contractor_id":242,… |
| 2 | `read_attachment` | {"ticket_id":89,"name":"property-preparation-quotation.pdf"} | ok | {"ok":true,"name":"property-preparation-quotation.pdf","text":"# Transcription\n\n**Document type:** Contractor quotati… |
| 3 | `read_attachment` | {"ticket_id":89,"name":"move-out-inspection-report.pdf"} | ok | {"ok":true,"name":"move-out-inspection-report.pdf","text":"## Transcription\n\n**Header (top right):** Move-Out Inspect… |
| 4 | `recall_lessons` | {"ticket_id":89,"situation_text":"Vacant property post-tenancy clean/garden quote £665. Landlord approval conditional on recovering cost fr… | ok | {"ok":true,"count":0,"lessons":[]} |
| 5 | `escalate_to_human` | {"ticket_id":89,"reason":"Landlord approval for the £665 quote depends on recovering the cost from the deposit (a deposit/tenancy matter), … | ok | {"ok":true,"queue_id":32} |
| 6 | `place_hold` | {"ticket_id":89,"reason":"Per ev 21: wait 3 working days for separate major maintenance to complete before booking sanitation; landlord app… | ok | {"ok":true,"hold_id":271} |
| 7 | `move_stage` | {"ticket_id":89,"to":"landlord_approval","reason":"£665 quote received (ev 6) and approval sought from landlord (ev 7); landlord's response… | ok | {"ok":true,"from":"intake","to":"landlord_approval","status":"on_hold"} |
| 8 | `add_profile_fact` | {"entity_type":"contact","entity_id":241,"key":"approval_condition_post_tenancy_costs","value":"Approves post-tenancy cleaning/clearance on… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":108,"entity_type":"contact","entity_id":241,"key":"approval_… |
| 9 | `add_profile_fact` | {"entity_type":"property","entity_id":83,"key":"access_vacant_keys_at_office","value":"Vacant (Sept 2025); key set held at Northbridge Lett… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":109,"entity_type":"property","entity_id":83,"key":"access_va… |

Agent's own account of its actions (from the structured result):

- `get_ticket_context` - Loaded the ticket, its 21 events and the profiles -> Stage intake; no holds, approvals or queue items
- `read_attachment` - Read the quotation -> £665 lump sum, ref NBL-015-Q1; no VAT shown, no breakdown, no validity date; disturbed soil not mentioned
- `read_attachment` - Read the move-out inspection report -> Five items, including disturbed soil (an observation with no action); undated
- `recall_lessons` - Looked for lessons on similar cases -> No lessons found
- `escalate_to_human` - Handed over the conditional/ambiguous approval and the deposit dependency -> Queue item 32
- `place_hold` - Hold waiting on the agency, matching the event 21 instruction -> Hold 271, follow-up in 5 days
- `move_stage` - Moved from intake to landlord_approval to match the evidence -> Now landlord_approval (on hold)
- `add_profile_fact` - Recorded the landlord's condition that post-tenancy costs come from the deposit -> Fact 108
- `add_profile_fact` - Recorded property access: vacant, keys held at the office -> Fact 109

## Approvals

| Party | Status | Channel |
|---|---|---|
| Nessa Quill (landlord) | conditional/ambiguous: depends on recovery from the deposit (events 8, 10); event 16 'approved quote' doesn't say which quote | email/update |

## Escalation & handover

- Escalation needed: **yes**
- Reason: The approval depends on a disputed deposit (£650, less than the £665 quote), and the later approval doesn't say which quote it covers.
- Handover summary: £665 Brindlewick quote (NBL-015-Q1). The landlord approved only if the cost comes from the deposit; the deposit is £650 and disputed. Her 'approved quote' message on 17 Sep doesn't say which quote. The contractor was told 'approved' without the condition, then told to hold. The sanitation work waits on separate major maintenance, which isn't scheduled. Move-in wanted for 28 Sep.
- Recommendation: Mira: get written confirmation from the landlord of which quote she approved and whether the £665 approval stands regardless of what the deposit recovers. Ask Brindlewick about VAT and the disturbed soil. Release the contractor only once the approval is unconditional and the major maintenance has a date. Check the move-in date.

## What could not be verified

- Which quote the landlord's 'approved quote' (event 16) refers to
- Whether £665 includes VAT
- Whether the deposit claim will recover the cost
- Status and date of the separate major maintenance
- Whether the 28 Sep move-in still stands

## What failed

_No failures recorded._

## Risks & red flags

- The contractor was told the quote was approved without the landlord's condition (event 9)
- The £665 quote is more than the £650 deposit, so the landlord's condition may not be met
- The 28 Sep move-in is at risk because nothing is booked
- The quote doesn't cover the disturbed soil from digging
- The quote has no VAT, terms or contractor contact details

## Final result / next follow-up

- Final status: landlord_approval, on hold (hold 271), escalated (queue 32)
- Next follow-up: 2025-09-30 - Check whether the major maintenance is complete and whether the landlord has given unconditional approval for the £665 quote; if both are done, release Brindlewick to propose a date
- Confidence: 0.82

## Run metadata

- Case folder: `015`
- Session id: wrun_01M4K796NWRCSRVBB1QQ7EV26H
- Started: 2026-10-10T15:35:38.338Z  Finished: 2026-10-10T15:36:42.563Z  Duration: 64.2s
- Events recorded: 341
- Model(s): anthropic/claude-opus-5.5
- Tokens: in 91758 / out 5735; cost: not reported
