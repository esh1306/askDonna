# Case PM034-1 - Answer

## Decision

**request_info**

## Summary

Meadow Works say they finished the shower job (event 010). Their email says an invoice is attached, but I can't see one in the CRM, and the system couldn't read the email (event 009). I moved the ticket from scheduling to closeout. I asked Meadow Works to resend the invoice and say whether cold water now comes through, and asked the tenant to confirm the cold side works. The ticket is on hold until 4 June. Nothing gets paid until the invoice has been checked.

## Judgement

- **Case type:** maintenance
- **Why this decision:** Event 010 is a completion report, so the work stage is behind. But there's no invoice to check, and it's not certain the reported fault (no cold water) was fixed. The contractor and tenant can answer both, so I asked them rather than escalating.

| Alternative considered | Why not |
|---|---|
| Close the ticket now | There's no invoice and no tenant confirmation, and 'main problem' is vague |
| Escalate to a person | Nothing is in dispute yet, and the missing pieces can be got by asking |
| Leave it in scheduling | The contractor reports the work is done, so the stage was behind the evidence |

**Checks performed before acting**

- Approval status (approved, no amount)
- Attachments (none visible)
- Contractor matches the one assigned (Meadow Works)
- Safety: low, but added a tip to test the water temperature
- Open holds and human queue (none)

**Assumptions**

- Event 010 comes from Meadow Works, the assigned contractor

## Actions taken

| # | Tool | Input (gist) | Result | Output (gist) |
|---|---|---|---|---|
| 1 | `get_ticket_context` | {"ticket_id":67} | ok | {"ok":true,"ticket":{"id":67,"case_ref":"R/PM034-1","property_id":48,"tenant_id":167,"landlord_id":168,"contractor_id":… |
| 2 | `classify_reply` | {"ticket_id":67,"text":"The engineer found a temperature issue with the shower, cleaned and greased it, which resolved the main problem. An… | ok | {"autonomy":"review","intent":"completion_report","intent_probs":{"quote_or_estimate":0,"invoice":0.44,"completion_repo… |
| 3 | `move_stage` | {"ticket_id":67,"to":"closeout","reason":"Contractor Meadow Works reported in event 010 (2025-06-01) that the engineer attended, cleaned an… | ok | {"ok":true,"from":"scheduling","to":"closeout","status":"open"} |
| 4 | `send_message` | {"ticket_id":67,"to":"contractor","channel":"email","subject":"Invoice not received – Shower repair, Flat 9, 9 Willowmere Road (Ref R/PM034… | ok | {"ok":true,"message_id":85,"guard":{"blocked":false,"reasons":[],"probs":{"claims_work_done_unverified":0.16,"promises_… |
| 5 | `send_message` | {"ticket_id":67,"to":"tenant","channel":"email","subject":"Shower repair – Flat 9, 9 Willowmere Road (Ref R/PM034-1)","body":"Dear Ava,\n\n… | ok | {"ok":true,"message_id":86,"guard":{"blocked":false,"reasons":[],"probs":{"claims_work_done_unverified":0.29,"promises_… |
| 6 | `place_hold` | {"ticket_id":67,"reason":"Awaiting resent invoice from Meadow Works (not visible despite event 010 saying attached) and tenant confirmation… | ok | {"ok":true,"hold_id":154} |
| 7 | `add_profile_fact` | {"entity_type":"contact","entity_id":169,"key":"attended_r_pm034_1_after_reminder","value":"Did not confirm appointment booking after initi… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":93,"entity_type":"contact","entity_id":169,"key":"attended_r… |

Agent's own account of its actions (from the structured result):

- `get_ticket_context` - Loaded ticket, profiles, events and approvals -> Stage was scheduling. Approval 31 approved with no amount. No attachments, holds or property history visible.
- `classify_reply` - Classified the contractor's email (event 010) -> Completion report 0.56, invoice 0.44, needs a person to review 0.68, safety concern 0.04
- `move_stage` - Moved stage from scheduling to closeout because the contractor reports the work is done -> Now in closeout
- `send_message` - Emailed Meadow Works asking them to resend the invoice with the reference and say whether cold water now flows -> Sent (message 85)
- `send_message` - Emailed the tenant asking her to confirm the cold side works, with a safety tip and a check-back date of 4 June -> Sent (message 86)
- `place_hold` - Put the ticket on hold waiting for the invoice and the tenant's confirmation -> Hold 154, follow-up in 3 days
- `add_profile_fact` - Noted on Meadow Works' record that they didn't confirm booking after a reminder and that their invoice didn't arrive -> Fact 93 recorded

## Approvals

| Party | Status | Channel |
|---|---|---|
| Landlord (R/PM034-1) | granted (attendance, no amount set) - approval 31 | email |

## Escalation & handover

- Escalation needed: **no**
- Reason: The contractor and tenant can answer what's missing (the invoice and whether the fix worked). No dispute or safety risk at present.
- Recommendation: If the invoice doesn't arrive by the follow-up date, or doesn't match Meadow Works, this property or a reasonable amount for the approved attendance, pass it to a person to check before paying.

## What could not be verified

- The work being done and the problem being fixed: only the contractor says so
- Whether the cold supply itself was restored. 'Main problem' and 'temperature issue' may not cover the reported lack of cold water
- The invoice amount, payee and contents: no invoice is visible

## What failed

- Agent reported: The invoice the contractor says is attached isn't visible in the CRM, and the system couldn't read their email (event 009)

## Risks & red flags

- The landlord approved with no amount, so any invoice may need the landlord's sign-off on the cost
- 'Resolved the main problem' suggests something may still be outstanding
- Possible scald risk if the cold side still doesn't work

## Final result / next follow-up

- Final status: In closeout, on hold (hold 154) waiting for the contractor's invoice and the tenant's confirmation
- Next follow-up: 2025-06-04 - Chase Meadow Works for the invoice and the tenant for confirmation. When the invoice arrives, check payee, property and amount before going further; close the ticket once the tenant confirms.
- Confidence: 0.8

## Run metadata

- Case folder: `C:\Users\sahid\Documents\Projects\Hackathons\DwellyHack\dwelly-agent\data\practice\cases\PM034-1`
- Session id: wrun_01M4JYDBVARQ0M6ND4TKNM1629
- Started: 2026-10-10T13:00:37.532Z  Finished: 2026-10-10T13:01:15.733Z  Duration: 38.2s
- Events recorded: 232
- Model(s): anthropic/claude-opus-5.5
- Tokens: in 87511 / out 3888; cost: not reported
