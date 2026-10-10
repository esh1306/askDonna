# Case PM002-2 - Answer

## Decision

**act**

## Summary

Riverside Works says the approved toilet and cistern replacement is finished. It says it attached an invoice and a photo, but neither is in the CRM. I moved the ticket to closeout and asked the contractor to send the invoice and photo again. I asked the tenant to confirm the toilet works. The ticket is on hold with a follow-up in 2 days. Nothing can be paid until a human checks the invoice against the approved quote. The quote amount isn't in the CRM either.

## Judgement

- **Case type:** maintenance
- **Why this decision:** Event 034 is a completion report (classifier: completion_report 0.97, autonomy auto). The landlord approved the quote in events 019 and 021, and works were booked for 15/08 (event 027). The next step is closeout: check the invoice and get the tenant to confirm. The invoice isn't visible, so the contractor is the right person to ask. That is better than escalating straight away.

| Alternative considered | Why not |
|---|---|
| Escalate to a human now for the invoice check | There is no invoice to check yet. The contractor can fix that by sending it again. Escalating now would only stall the job. |
| Close the ticket | Neither the tenant nor any visible evidence confirms the work is done, and the invoice hasn't been checked. |
| No action / return to auto mode | The invoice isn't visible, so someone has to ask for it. Otherwise closeout would stall. |

**Checks performed before acting**

- Approval status: landlord approved attendance (approval 3) and the quote (approval 4, event 019). Neither approval has an amount.
- Quote attachment-65 and the invoice aren't visible, so the amount can't be checked.
- Contractor identity: the event 026 caller was named 'Willow Utilities', but every booking email went to Riverside Works. Treated this as a probable naming difference and flagged it for the invoice payee check.
- Duplicate check: ticket 9 (R/PM002-1) is open in works at the same property with the same title.
- Open holds: none before this action.

**Assumptions**

- The 'Willow Utilities' in event 026 and Ava Fletcher in event 034 are acting for Riverside Works, the assigned contractor.

## Actions taken

| # | Tool | Input (gist) | Result | Output (gist) |
|---|---|---|---|---|
| 1 | `get_ticket_context` | {"ticket_id":6} | ok | {"ok":true,"ticket":{"id":6,"case_ref":"R/PM002-2","property_id":5,"tenant_id":12,"landlord_id":13,"contractor_id":14,"… |
| 2 | `find_tickets` | {"property_address":"15 Willowmere Road"} | ok | {"matches":2,"tickets":[{"id":6,"case_ref":"R/PM002-2","title":"Blocked toilet at Flat 3, 15 Willowmere Road, Alderwick… |
| 3 | `classify_reply` | {"ticket_id":6,"text":"Ava Fletcher confirms the completion of the job regarding the blocked toilet, attaches a completed image and invoice… | ok | {"autonomy":"auto","intent":"completion_report","intent_probs":{"quote_or_estimate":0,"invoice":0.03,"completion_report… |
| 4 | `move_stage` | {"ticket_id":6,"to":"closeout","reason":"Contractor (Ava Fletcher, Riverside Works) reported completion of the approved toilet/cistern repl… | ok | {"ok":true,"from":"works","to":"closeout","status":"open"} |
| 5 | `send_message` | {"ticket_id":6,"to":"contractor","channel":"email","subject":"Invoice and completion photo – Flat 3, 15 Willowmere Road, Alderwick, ZZ3 2ZZ… | ok | {"ok":true,"message_id":5,"guard":{"blocked":false,"reasons":[],"probs":{"claims_work_done_unverified":0.37,"promises_s… |
| 6 | `send_message` | {"ticket_id":6,"to":"tenant","channel":"sms","body":"Hello Noah, this is Northbridge Lettings re the toilet at Flat 3, 15 Willowmere Road (… | ok | {"ok":true,"message_id":6,"guard":{"blocked":false,"reasons":[],"probs":{"claims_work_done_unverified":0.65,"promises_s… |
| 7 | `place_hold` | {"ticket_id":6,"reason":"Awaiting re-sent invoice and completion photo from Riverside Works (not visible in CRM, event 034) and tenant conf… | ok | {"ok":true,"hold_id":18} |
| 8 | `add_profile_fact` | {"entity_type":"property","entity_id":5,"key":"toilet_and_cistern_replaced","value":"Contractor reports new toilet and cistern fitted Aug 2… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":6,"entity_type":"property","entity_id":5,"key":"toilet_and_c… |

Agent's own account of its actions (from the structured result):

- `find_tickets` - Checked for other tickets at this property -> Found ticket 9 (R/PM002-1), open in works, same title
- `classify_reply` - Classified the contractor's email (event 034) -> completion_report 0.97, autonomy auto
- `move_stage` - Moved works → closeout because the contractor reported completion -> Stage is now closeout
- `send_message` - Emailed Riverside Works to send the invoice and completion photo again, with the job reference -> Queued (message 5)
- `send_message` - Texted the tenant to confirm the new toilet flushes and drains with no leaks -> Queued (message 6)
- `place_hold` - Hold while waiting for the contractor's invoice and the tenant's confirmation -> Hold 18, follow-up in 2 days
- `add_profile_fact` - Recorded the reported toilet and cistern replacement on the property -> Fact 6 saved

## Approvals

| Party | Status | Channel |
|---|---|---|
| Landlord (Quinn) | granted (quote, event 019; amount not visible) | email |

## Escalation & handover

- Escalation needed: **no**
- Reason: Not needed yet. The contractor can resolve the missing invoice by sending it again.
- Recommendation: When the invoice arrives, a human should check the amount against approved quote attachment-65 and check that the payee is Riverside Works before paying. If either doesn't match, escalate.

## What could not be verified

- Work completion (reported only by the contractor)
- Invoice amount and payee
- Approved quote amount
- Whether 'Willow Utilities' and Ava Fletcher are acting for Riverside Works

## What failed

_No failures recorded._

## Risks & red flags

- Possible duplicate ticket: R/PM002-1 (ticket 9) is still open at the same property. Risk of paying for the same job twice.
- The event 026 caller was named Willow Utilities, not Riverside Works. Check the invoice payee.
- Tenant's call (event 031) mentions 'communication from another party' with no detail.
- The tenant contact number differs between messages (07700 900422 and 07700 900946).

## Final result / next follow-up

- Final status: closeout – on hold (waiting on contractor's invoice and tenant's confirmation)
- Next follow-up: In 2 days (hold 18) - Chase Riverside Works for the invoice and photo, and the tenant for confirmation. Once the invoice arrives, check it against the approved quote and payee, then close. Review duplicate ticket 9.
- Confidence: 0.78

## Run metadata

- Case folder: `C:\Users\sahid\Documents\Projects\Hackathons\DwellyHack\dwelly-agent\data\practice\cases\PM002-2`
- Session id: wrun_01M4JY5GRTNWDS2KD5YV8QR16M
- Started: 2026-10-10T12:56:20.109Z  Finished: 2026-10-10T12:57:04.820Z  Duration: 44.7s
- Events recorded: 202
- Model(s): anthropic/claude-opus-5.5
- Tokens: in 120508 / out 4233; cost: not reported
