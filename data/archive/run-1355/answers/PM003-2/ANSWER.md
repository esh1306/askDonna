# Case PM003-2 - Answer

## Decision

**escalate**

## Summary

The contractor says the invoice for the checkout clean, rubbish removal and carpet clean went straight to Theo. I can't see that invoice in the CRM, and I can't see the approved estimate either, so there's nothing to check it against. I also can't see any landlord approval, confirmation that the work is finished, or a decision on whether the tenant's deposit pays. I've passed it to the operations queue at normal priority so Theo can upload both documents and check them before anything is paid.

## Actions taken

| # | Tool | Input (gist) | Result | Output (gist) |
|---|---|---|---|---|
| 1 | `get_ticket_context` | {"ticket_id":27} | ok | {"ok":true,"ticket":{"id":27,"case_ref":"R/PM003-2","property_id":3,"tenant_id":61,"landlord_id":62,"contractor_id":63,… |
| 2 | `classify_reply` | {"ticket_id":27,"text":"hi invoice sent to Theo x","sender_role":"contractor","context":"Checkout clean + rubbish removal + carpet clean; e… | ok | {"autonomy":"auto","intent":"invoice","intent_probs":{"quote_or_estimate":0,"invoice":1,"completion_report":0,"scheduli… |
| 3 | `read_attachment` | {"ticket_id":27,"name":"attachment-01-checkout-inspection-report.pdf"} | ok | {"ok":true,"name":"attachment-01-checkout-inspection-report.pdf","text":"# Transcription: Northbridge Lettings, Checkou… |
| 4 | `search_case` | {"ticket_id":27,"query":"estimate"} | ok | {"query":"estimate","matches":3,"events":[{"id":295,"ticket_id":27,"ts":"2025-07-22T15:49:57Z","kind":"note","direction… |
| 5 | `find_tickets` | {"property_address":"Flat 30, 30 Harbour View"} | ok | {"matches":2,"tickets":[{"id":25,"case_ref":"R/PM003-1","title":"Checkout Cleaning Estimate and Invoice","category":nul… |
| 6 | `escalate_to_human` | {"ticket_id":27,"reason":"Contractor says invoice was sent straight to Theo, but neither the invoice nor the approved estimate is in the CR… | ok | {"ok":true,"queue_id":11} |

Agent's own account of its actions (from the structured result):

- `get_ticket_context` - Loaded the full case -> 17 events; no approvals, holds or profile facts; one attachment
- `classify_reply` - Classified the contractor's email in event 17 -> Intent: invoice; autonomy: auto; no amount mentioned
- `read_attachment` - Read the checkout inspection report -> Northbridge Lettings report for Flat 30, with an appointment date of 16 March 2026
- `search_case` - Searched the case for 'estimate' -> No estimate document or amount visible
- `find_tickets` - Looked for other tickets on the property -> Ticket 25 (R/PM003-1) has the same title and is on hold
- `escalate_to_human` - Handed over for the invoice and estimate to be checked and the deposit question decided -> queue_id 11

## Approvals

| Party | Status | Channel |
|---|---|---|
| Agency (Theo Quinn) | granted (internal estimate approval, ev 10) | email/CRM note |
| Landlord | not visible in records | n/a |

## Escalation & handover

- Escalation needed: **yes**
- Reason: The invoice was sent to Theo outside the CRM, and the estimate, the landlord's approval and confirmation that the work is finished aren't visible, so the invoice can't be checked.
- Handover summary: Job NBL-003-2766 is a checkout clean, rubbish removal and carpet clean. The agency approved the estimate on 22 Jul (ev 9–10). The contractor says the invoice went to Theo (ev 17). Neither document is in the CRM, and the cost may need to be recharged to the tenant's deposit.
- Recommendation: Theo: upload the estimate and invoice and check they match. Confirm landlord authority and decide on any deposit recharge. Confirm the work is finished and move the job to closeout. Check the report date, and check whether ticket 25 is a duplicate. Don't pay until all this is done.

## What could not be verified

- Estimate amount and contents
- Invoice amount and payee
- That the works have been finished
- That the landlord approved the spend
- Whether the tenant's deposit pays
- The checkout report date of 16 March 2026, which doesn't match this July 2025 job

## What failed

- Agent reported: The first search_case call was rejected because the query '£' was too short (it must be at least 2 characters); I didn't retry it

## Risks & red flags

- The invoice was sent outside the CRM, so there's no record of it on the ticket
- The estimate was approved by the agency with no landlord approval on record
- The cost may be a deposit deduction
- Ticket 25 may be a duplicate, which risks paying the same invoice twice
- The checkout report date doesn't match the job

## Final result / next follow-up

- Final status: Stage: scheduling. In the human queue (item 11) for the invoice and estimate to be checked.
- Next follow-up: When the operations queue responds or the documents are uploaded - Check the invoice against the estimate, then move the job to closeout
- Confidence: 0.8

## Run metadata

- Case folder: `C:\Users\sahid\Documents\Projects\Hackathons\DwellyHack\dwelly-agent\data\practice\cases\PM003-2`
- Session id: wrun_01M4JW6PPKBJ64CHGP98PQM11Q
- Started: 2026-10-10T12:22:02.002Z  Finished: 2026-10-10T12:22:53.852Z  Duration: 51.9s
- Events recorded: 235
- Model(s): anthropic/claude-opus-5.5
- Tokens: in 81450 / out 3587; cost: not reported
