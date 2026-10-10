# Case PM046-2 - Answer

## Decision

**request_info**

## Summary

Lantern Utilities (Mercer) emailed "Attached invoice" (event 041), but no attachment is visible on the ticket, so I can't check it against the landlord's approval of £90 + VAT. I've asked the contractor to resend the invoice as a PDF and confirm the hinge was replaced at the 30/09 visit. The ticket has moved to works and is on hold with a 3-day follow-up. Once the invoice arrives and matches, it goes to the landlord and the ticket moves to close-out.

## Judgement

- **Case type:** maintenance
- **Why this decision:** The landlord first agreed to a contractor visit (event 007), then approved the hinge replacement at £90 + VAT (events 016/018). The visit was booked for 30/09/2025 (events 027-031). There were no work results afterwards (event 036), so the agency chased for completion and a PDF invoice (event 038). The contractor replied 'Attached invoice' (event 041), but the CRM lists no attachments. Lesson #3 says to forward the invoice to the landlord and move to close-out, and lesson #18 says the invoice note can count as proof of completion. I can't follow either yet because there is no invoice to check for amount, payee or property, and nothing that confirms completion. The contractor is the one who can fix this, so I asked them rather than escalating.

| Alternative considered | Why not |
|---|---|
| Forward the invoice to the landlord and move to close-out (lesson #3) | No invoice is visible, so I can't check it against the approved £90 + VAT or send it on. |
| Escalate to a human | A missing attachment is something the contractor can fix by resending. There's no conflict or dispute yet. |
| No action / return to auto mode | The invoice is missing and completion isn't confirmed, so the job would stall without a follow-up. |

**Checks performed before acting**

- Checked approval status: approval 58 is approved; the £90 + VAT hinge cost was approved by email (event 018)
- Checked attachments: none listed on the ticket; contractor profile fact 123 already notes the 07/10 invoice email arrived with no visible attachment
- Checked that the visit date (30/09/2025) has passed
- Classified event 041: intent invoice, autonomy auto
- Looked for duplicates: ticket 82 (R/PM046-1), same property and title, is on hold in provider_selection
- Checked open holds: none before I placed hold 267

**Assumptions**

- 'Jenkins' and 'Mercer' are both staff at Lantern Utilities
- 'Felix', who signed the landlord replies, is the landlord on record (Grace) or acts for them

## Actions taken

| # | Tool | Input (gist) | Result | Output (gist) |
|---|---|---|---|---|
| 1 | `get_ticket_context` | {"ticket_id":102} | ok | {"ok":true,"ticket":{"id":102,"case_ref":"R/PM046-2","property_id":60,"tenant_id":251,"landlord_id":252,"contractor_id"… |
| 2 | `classify_reply` | {"ticket_id":102,"text":"Morning\n\nAttached invoice\n\nThanks Mercer","sender_role":"contractor","context":"Agency asked if job done (book… | ok | {"autonomy":"auto","intent":"invoice","intent_probs":{"quote_or_estimate":0,"invoice":1,"completion_report":0,"scheduli… |
| 3 | `recall_lessons` | {"ticket_id":102,"situation_text":"Contractor emailed 'Attached invoice' after job booked for 30/09 but no attachment is visible in the CRM… | ok | {"ok":true,"count":5,"lessons":[{"id":3,"situation":"A contractor who completed an approved cleaning job emails to say … |
| 4 | `find_tickets` | {"property_address":"143 Willowmere Road"} | ok | {"matches":2,"tickets":[{"id":82,"case_ref":"R/PM046-1","title":"Bedroom Window Repair","category":null,"stage":"provid… |
| 5 | `send_message` | {"ticket_id":102,"to":"contractor","channel":"email","subject":"Invoice not received – Window Repair, Flat 23, 143 Willowmere Road (R/PM046… | ok | {"ok":true,"message_id":131,"guard":{"blocked":false,"reasons":[],"probs":{"claims_work_done_unverified":0.56,"promises… |
| 6 | `move_stage` | {"ticket_id":102,"to":"works","reason":"Visit was booked for 30/09/2025 (events 027-031) and the date has passed; contractor has now emaile… | ok | {"ok":true,"from":"scheduling","to":"works","status":"open"} |
| 7 | `place_hold` | {"ticket_id":102,"reason":"Waiting for Lantern Utilities to resend invoice as PDF (event 041 said 'attached' but no attachment visible) and… | ok | {"ok":true,"hold_id":267} |
| 8 | `add_profile_fact` | {"entity_type":"contact","entity_id":252,"key":"landlord_signs_as","value":"Landlord contact recorded as Grace; replies to approvals signed… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":144,"entity_type":"contact","entity_id":252,"key":"landlord_… |

Agent's own account of its actions (from the structured result):

- `get_ticket_context` - Loaded the ticket, its events, profiles and approvals -> No attachments; approval 58 approved; ticket at scheduling stage, no open holds
- `classify_reply` - Classified the contractor's email from event 041 -> intent=invoice, autonomy=auto, needs_human_response 0.21
- `recall_lessons` - Looked up past handling of invoices that arrive after a job -> Lessons #3 and #18 apply once a checkable invoice exists
- `find_tickets` - Checked for other tickets at this property -> Found ticket 82 (R/PM046-1), same title, on hold in provider_selection
- `send_message` - Asked the contractor to resend the invoice as a PDF and confirm the hinge replacement was completed -> Sent to outbox, message 131; guard did not block it
- `move_stage` - Moved the ticket from scheduling to works, since the visit date has passed and an invoice was mentioned -> Stage is now works
- `place_hold` - Put the ticket on hold waiting for the contractor to resend the invoice and confirm completion -> Hold 267, follow-up in 3 days
- `add_profile_fact` - Recorded that the landlord's replies are signed 'Felix' -> Fact 144 saved, no conflict

## Approvals

| Party | Status | Channel |
|---|---|---|
| Landlord (Grace / signed Felix) | granted: contractor visit (event 007) and hinge replacement at £90 + VAT (event 018) | email |

## Escalation & handover

- Escalation needed: **no**
- Reason: The contractor can fix the missing invoice by resending it
- Recommendation: If no PDF invoice has arrived by the follow-up date, chase once more. Escalate if there is still no reply, or if the invoice differs from £90 + VAT or Lantern Utilities.

## What could not be verified

- Whether the hinge replacement was actually done on 30/09/2025
- The invoice amount, payee and reference (no invoice visible)
- Whether 'Felix' and 'Grace' are the same landlord

## What failed

_No failures recorded._

## Risks & red flags

- Possible duplicate: ticket 82 (R/PM046-1), same property and title, is still on hold in provider_selection. It should be checked and closed if it is the same job, so it doesn't lead to a second dispatch or a double payment.
- The invoice email had no readable attachment, which happened earlier with this contractor too (fact 123)

## Final result / next follow-up

- Final status: Stage works, on hold waiting for the contractor (hold 267)
- Next follow-up: 2025-10-10 - If no PDF invoice or completion confirmation has arrived, chase Lantern Utilities. If one has, check it against £90 + VAT, forward it to the landlord, tell the tenant, and move the ticket to close-out.
- Confidence: 0.85

## Run metadata

- Case folder: `C:\Users\sahid\Documents\Projects\Hackathons\DwellyHack\dwelly-agent\data\practice\cases\PM046-2`
- Session id: wrun_01M4JZYF10KAD3WCM5PSPHMGH9
- Started: 2026-10-10T13:27:26.369Z  Finished: 2026-10-10T13:28:07.860Z  Duration: 41.5s
- Events recorded: 205
- Model(s): anthropic/claude-opus-5.5
- Tokens: in 129761 / out 4170; cost: not reported
