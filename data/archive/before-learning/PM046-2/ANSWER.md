# Case PM046-2 - Answer

## Decision

**request_info**

## Summary

Lantern Utilities emailed to say an invoice was attached, but no attachment shows up on the ticket, so there's nothing to check against the approved £90 + VAT. I asked them to resend it as a PDF and confirm the hinge replacement was finished at the 30/09/2025 visit. I moved the ticket from scheduling to works and set a 2-day follow-up.

## Judgement

- **Case type:** maintenance_admin
- **Why this decision:** The landlord approved the attendance (event 007) and then the hinge replacement at £90 + VAT (events 015, 016, 018). The visit was confirmed for 30/09/2025 (events 027–031). In event 041 the contractor says 'Attached invoice', but get_ticket_context lists no attachments, so the invoice can't be read or checked. Only the contractor can fix that, so asking them and setting a hold is the right next step. The classifier rated the email routine (auto, intent invoice).

| Alternative considered | Why not |
|---|---|
| Escalate to a human | Nothing is in dispute or in conflict. It's a missing attachment, and the contractor can sort it out. |
| Move to closeout or tell the landlord and tenant the work is done | Neither the contractor nor the tenant has confirmed the work is finished, and the invoice hasn't been seen. |
| No action | The ticket would stall with no invoice to process and no hold set. |

**Checks performed before acting**

- Approval status: approval 43 is approved. Hinge cost of £90 + VAT approved by email (event 018).
- Attachments: none listed on ticket 83.
- Searched the case for 'invoice': only events 038 and 041.
- Landlord name: replies are signed 'Felix' but Grace is the landlord on record. Most likely a partner or co-owner, and it doesn't change the approval.
- Contractor staff sign as Jenkins and Mercer; both are Lantern Utilities. Normal.
- Ticket 82 (R/PM046-1) has the same property and the same description, and its events copy ticket 83's early events. It looks like a duplicate.
- No open holds before this action.

**Assumptions**

- Sending an invoice suggests the contractor attended on 30/09. This isn't confirmed, so the ticket went to works, not closeout.

## Actions taken

| # | Tool | Input (gist) | Result | Output (gist) |
|---|---|---|---|---|
| 1 | `get_ticket_context` | {"ticket_id":83} | ok | {"ok":true,"ticket":{"id":83,"case_ref":"R/PM046-2","property_id":60,"tenant_id":204,"landlord_id":205,"contractor_id":… |
| 2 | `classify_reply` | {"ticket_id":83,"text":"Morning\n\nAttached invoice\n\nThanks Mercer","sender_role":"contractor","context":"Reply to agency chase (event 03… | ok | {"autonomy":"auto","intent":"invoice","intent_probs":{"quote_or_estimate":0,"invoice":1,"completion_report":0,"scheduli… |
| 3 | `search_case` | {"ticket_id":83,"query":"invoice"} | ok | {"query":"invoice","matches":2,"events":[{"id":1232,"ticket_id":83,"ts":"2025-10-07T10:41:42Z","kind":"email","directio… |
| 4 | `get_ticket_context` | {"ticket_id":82,"events":10} | ok | {"ok":true,"ticket":{"id":82,"case_ref":"R/PM046-1","property_id":60,"tenant_id":202,"landlord_id":203,"contractor_id":… |
| 5 | `send_message` | {"ticket_id":83,"to":"contractor","channel":"email","subject":"Invoice not received – Flat 23, 143 Willowmere Road, Alderwick, ZZ2 6ZZ (Ref… | ok | {"ok":true,"message_id":110,"guard":{"blocked":false,"reasons":[],"probs":{"claims_work_done_unverified":0.6,"promises_… |
| 6 | `add_profile_fact` | {"entity_type":"contact","entity_id":205,"key":"approved_hinge_replacement_gbp","value":"Approved bedroom window hinge replacement at £90 +… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":122,"entity_type":"contact","entity_id":205,"key":"approved_… |
| 7 | `add_profile_fact` | {"entity_type":"contact","entity_id":206,"key":"invoice_format_note","value":"Agency requested invoices in PDF (other formats not supported… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":123,"entity_type":"contact","entity_id":206,"key":"invoice_f… |
| 8 | `move_stage` | {"ticket_id":83,"to":"works","reason":"Visit was confirmed for 30/09/2025 (events 027–031) and that date has passed. Contractor has now ema… | ok | {"ok":true,"from":"scheduling","to":"works","status":"open"} |
| 9 | `place_hold` | {"ticket_id":83,"reason":"Waiting for Lantern Utilities to resend the invoice as a PDF (no attachment visible on event 041) and confirm the… | ok | {"ok":true,"hold_id":204} |

Agent's own account of its actions (from the structured result):

- `classify_reply` - Classified the contractor's invoice email (event 041) -> Intent: invoice. Autonomy: auto. Needs a human response: 0.39.
- `search_case` - Searched the case for invoice references -> Only the chase (event 038) and the reply (event 041) mention it. No attachment.
- `get_ticket_context` - Checked ticket 82, the related ticket for this property -> Same request as ticket 83, at landlord_approval stage. Looks like a duplicate.
- `send_message` - Emailed the contractor: no attachment came through, please resend the invoice as a PDF, confirm the work was completed, and note the approved £90 + VAT -> Queued (message 110). The guard didn't block it.
- `add_profile_fact` - Recorded on the landlord's profile that they approved the hinge at £90 + VAT and that the reply was signed Felix -> Saved as fact 122
- `add_profile_fact` - Recorded on the contractor's profile the PDF invoice request and the missing attachment -> Saved as fact 123
- `move_stage` - Moved the ticket from scheduling to works, because the visit date has passed and the contractor is invoicing -> Done
- `place_hold` - Set a hold waiting on the contractor's PDF invoice and completion confirmation -> Hold 204, follow-up in 2 days

## Approvals

| Party | Status | Channel |
|---|---|---|
| Landlord (Grace; replies signed Felix) | granted: attendance (event 007) and hinge replacement at £90 + VAT (event 018) | email |

## Escalation & handover

- Escalation needed: **no**
- Reason: Not needed. The missing invoice attachment can be sorted out with the contractor.
- Recommendation: When the PDF invoice arrives, check it against £90 + VAT (£108 total), Lantern Utilities and Flat 23, 143 Willowmere Road. If it matches and completion is confirmed, move to closeout. If it doesn't match, escalate. Ops should also review ticket 82 (R/PM046-1) as a likely duplicate.

## What could not be verified

- Whether the hinge replacement was actually completed on 30/09/2025
- Invoice amount, payee and details: the attachment isn't visible
- How Felix is connected to Grace, the landlord on record

## What failed

- Agent reported: The invoice the contractor says they attached (event 041) isn't visible in the CRM

## Risks & red flags

- Ticket 82 (R/PM046-1) looks like a duplicate of this job and is still open at landlord_approval stage. Ops may want to close or merge it to avoid double work or double payment.
- Event 012 says there was a property photo attachment, but it isn't available.

## Final result / next follow-up

- Final status: Works stage. On hold (hold 204) waiting for the contractor to resend the invoice as a PDF and confirm completion.
- Next follow-up: In 2 days (around 09/10/2025) - If nothing has arrived, chase Lantern Utilities for the PDF invoice and completion confirmation. Once received, check the invoice against the approved £90 + VAT.
- Confidence: 0.85

## Run metadata

- Case folder: `C:\Users\sahid\Documents\Projects\Hackathons\DwellyHack\dwelly-agent\data\practice\cases\PM046-2`
- Session id: wrun_01M4JYG5JEYQ0WYF36DGFDTV9G
- Started: 2026-10-10T13:02:09.396Z  Finished: 2026-10-10T13:02:58.077Z  Duration: 48.7s
- Events recorded: 249
- Model(s): anthropic/claude-opus-5.5
- Tokens: in 127847 / out 4642; cost: not reported
