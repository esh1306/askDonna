# Case PM003-2 - Answer

## Decision

**escalate**

## Summary

The contractor has invoiced £125 for the checkout clean at Flat 30, 30 Harbour View (job NBL-003-2766), but the invoice can't be cleared yet. We can't check it against the approved estimate because the estimate amount isn't visible anywhere in the records. There's also no landlord approval on file, and the outgoing tenant may be the one paying (the checkout report mentions deposit deductions for cleaning). Ticket 11 looks like a duplicate of the same job, so there's a risk of paying twice. I moved the ticket to closeout, asked the contractor to resend the estimate, set a 2-day follow-up and handed the payment decision to a person.

## Judgement

- **Case type:** maintenance_admin
- **Why this decision:** The work was approved by the agency (event 009 'Please proceed', event 010 'Estimate approved'). The contractor then invoiced (event 017; attachment-02 for £125, payee Bennett Ingram, branding Keystone Maintenance). The address, job reference and scope on the invoice all match the request. But no estimate amount is visible: the attachment on event 007 didn't come through. No landlord approval or spend limit is recorded either. My rules say I can't approve or forward an invoice I can't match to an approved quote, so a person has to decide. The contractor can resend the estimate, so I asked them for it at the same time.

| Alternative considered | Why not |
|---|---|
| Approve the invoice and close the ticket | There's no visible estimate amount or landlord approval to check £125 against. The payer (landlord or deposit) and the payee/trading-name link aren't confirmed, and the duplicate ticket 11 creates a risk of paying twice. |
| Ask the landlord for approval now | The work has already been done on the agency's instruction. The landlord has no contact details on file, and it isn't clear whether the landlord or the outgoing tenant's deposit should pay. That's for the agency to decide. |
| No action (thank-you or invoice notification only) | An invoice has arrived and needs reviewing. Leaving it would stall close-out. |
| High-priority escalation | There's no safety risk and no sign of fraud, such as a request to change bank details. Normal priority is enough. |

**Checks performed before acting**

- Read the invoice: address, job ref NBL-003-2766 and scope match. Total £125, not itemised, no VAT, bank details left out
- Searched the case for 'estimate': no amount recorded
- Approvals on ticket: none. Landlord profile: no spend limit, no contact details
- Payee Bennett Ingram vs branding Keystone Maintenance vs contractor signature 'Bennett': probably the same person, recorded as a profile fact
- Duplicate check: ticket 11 has the same property, job ID and opening events
- Checkout report: appointment date 16 March 2026 doesn't fit a July 2025 job
- classify_reply on event 017: intent invoice, autonomy auto

**Assumptions**

- 'Bennett' in event 007 is Bennett Ingram, the payee on the invoice
- Theo Quinn's 'Please proceed' was the agency accepting the contractor's estimate

## Actions taken

| # | Tool | Input (gist) | Result | Output (gist) |
|---|---|---|---|---|
| 1 | `get_ticket_context` | {"ticket_id":91} | ok | {"ok":true,"ticket":{"id":91,"case_ref":"R/PM003-2","property_id":7,"tenant_id":224,"landlord_id":225,"contractor_id":2… |
| 2 | `read_attachment` | {"ticket_id":91,"name":"attachment-02-cleaning-invoice.pdf"} | ok | {"ok":true,"name":"attachment-02-cleaning-invoice.pdf","text":"# Transcription\n\n## Page 1\n\n**Northbridge Lettings**… |
| 3 | `read_attachment` | {"ticket_id":91,"name":"attachment-01-checkout-inspection-report.pdf"} | ok | {"ok":true,"name":"attachment-01-checkout-inspection-report.pdf","text":"# Transcription: Northbridge Lettings, Checkou… |
| 4 | `search_case` | {"ticket_id":91,"query":"estimate"} | ok | {"query":"estimate","matches":3,"events":[{"id":1373,"ticket_id":91,"ts":"2025-07-22T15:49:57Z","kind":"note","directio… |
| 5 | `find_tickets` | {"property_address":"30 Harbour View"} | ok | {"matches":2,"tickets":[{"id":11,"case_ref":"R/PM003-1","title":"Checkout Cleaning Estimate and Invoice","category":nul… |
| 6 | `classify_reply` | {"ticket_id":91,"text":"hi invoice sent to Theo x","sender_role":"contractor","context":"Checkout clean + dumped items removal + carpet cle… | ok | {"autonomy":"auto","intent":"invoice","intent_probs":{"quote_or_estimate":0,"invoice":1,"completion_report":0,"scheduli… |
| 7 | `get_ticket_context` | {"ticket_id":11,"events":20} | ok | {"ok":true,"ticket":{"id":11,"case_ref":"R/PM003-1","property_id":7,"tenant_id":25,"landlord_id":26,"contractor_id":27,… |
| 8 | `move_stage` | {"ticket_id":91,"to":"closeout","reason":"Agency told contractor to proceed (event 009, 'Estimate approved' note event 010); contractor has… | ok | {"ok":true,"from":"scheduling","to":"closeout","status":"open"} |
| 9 | `send_message` | {"ticket_id":91,"to":"contractor","channel":"email","subject":"Flat 30, 30 Harbour View – Job NBL-003-2766 – invoice received","body":"Hi B… | ok | {"ok":true,"message_id":123,"guard":{"blocked":false,"reasons":[],"probs":{"claims_work_done_unverified":0.41,"promises… |
| 10 | `escalate_to_human` | {"ticket_id":91,"reason":"Invoice (£125) needs agency sign-off: approved estimate amount not visible, no landlord approval recorded, payee … | ok | {"ok":true,"queue_id":43} |
| 11 | `place_hold` | {"ticket_id":91,"reason":"Waiting for contractor to resend the 22 July estimate (not visible) so the £125 invoice can be matched; agency re… | ok | {"ok":true,"hold_id":236} |
| 12 | `add_profile_fact` | {"entity_type":"contact","entity_id":226,"key":"invoice_trading_name_and_payee","value":"Invoices under branding 'Keystone Maintenance'; pa… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":135,"entity_type":"contact","entity_id":226,"key":"invoice_t… |

Agent's own account of its actions (from the structured result):

- `get_ticket_context` - Loaded ticket 91 context -> 17 events, no approvals, no open holds, possible duplicate ticket 11
- `read_attachment` - Read the cleaning invoice -> £125, dated 23/07/2025, payee Bennett Ingram, branding Keystone Maintenance, not itemised
- `read_attachment` - Read the checkout inspection report -> Appointment date 16 March 2026 (doesn't fit). Mentions possible deposit deductions for cleaning
- `search_case` - Searched the case for the estimate amount -> No amount recorded
- `find_tickets / get_ticket_context` - Checked other tickets at the property -> Ticket 11 (R/PM003-1) looks like a duplicate of the same job NBL-003-2766
- `classify_reply` - Classified the contractor's message in event 017 -> intent invoice, autonomy auto
- `move_stage` - Moved the ticket from scheduling to closeout because an invoice has been received -> closeout
- `send_message` - Emailed the contractor to confirm the invoice arrived and ask for the estimate and any photos -> Queued (message 123), guard passed
- `escalate_to_human` - Handed invoice sign-off to a person (estimate, payer, payee, duplicate) -> queue_id 43
- `place_hold` - Put the ticket on hold, waiting on the contractor for the estimate -> hold 236, follow-up in 2 days
- `add_profile_fact` - Recorded the contractor's trading name and payee -> fact 135

## Approvals

| Party | Status | Channel |
|---|---|---|
| Agency (Theo Quinn) | granted (estimate approved, events 009/010; amount not visible) | email |
| Landlord | not recorded | none |

## Escalation & handover

- Escalation needed: **yes**
- Reason: The £125 invoice can't be matched to an approved estimate amount. There's no landlord approval on file, the payer (landlord or deposit) is unclear, the payee is an individual, and a duplicate ticket exists.
- Handover summary: Job NBL-003-2766: the checkout clean was approved by Theo (events 009/010) and the contractor has invoiced £125 (payee Bennett Ingram, Keystone Maintenance). The estimate amount isn't visible. Ticket 11 is a duplicate. I've asked the contractor for the estimate.
- Recommendation: Theo to confirm the estimate amount and who pays (landlord, or a deposit claim against the outgoing tenant), and check the payee using the known contact details. Merge or close ticket 11, then approve payment and close.

## What could not be verified

- Estimate amount approved by the agency
- That the work was actually finished (only the contractor's invoice says so)
- Who Bennett Ingram is in relation to Keystone Maintenance
- Whether the landlord authorised the spend
- Who pays: landlord or tenant's deposit

## What failed

_No failures recorded._

## Risks & red flags

- Duplicate ticket 11 for the same job: risk of paying twice
- Invoice isn't itemised and has no VAT details
- Payee is an individual while the invoice is branded as a company
- The checkout report date (March 2026) doesn't fit the job dates
- No landlord approval recorded for spend the agency has already approved

## Final result / next follow-up

- Final status: closeout – on hold (waiting on contractor for the estimate); invoice review in the human queue (43)
- Next follow-up: In 2 days (hold 236) - Chase the contractor for the estimate copy if it hasn't arrived, and check the human queue for the invoice and payer decision
- Confidence: 0.8

## Run metadata

- Case folder: `C:\Users\sahid\Documents\Projects\Hackathons\DwellyHack\dwelly-agent\data\practice\cases\PM003-2`
- Session id: wrun_01M4JYXPQQ1XR2FG9B400ZNFG9
- Started: 2026-10-10T13:09:32.861Z  Finished: 2026-10-10T13:10:50.948Z  Duration: 78.1s
- Events recorded: 424
- Model(s): anthropic/claude-opus-5.5
- Tokens: in 127097 / out 6327; cost: not reported
