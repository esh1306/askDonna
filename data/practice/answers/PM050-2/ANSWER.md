# Case PM050-2 - Answer

## Decision

**escalate**

## Summary

On 3 July an invoice email came in under the name Cedar Solutions. The contractor on this job is Stonebridge Works, and the visit isn't until 8 July 2024. I can't see the invoice itself, so the amount is unknown. I've passed the invoice check to the operations team so nothing gets paid, asked Stonebridge Works to explain the name and send the invoice, told the landlord, and set a 2-day follow-up.

## Judgement

- **Case type:** maintenance_admin
- **Why this decision:** The landlord approved a contractor visit (ev 9), then replied 'Yes please proceed' (ev 21) to a quote of £35+VAT for a handle or £90+VAT for a lock. Stonebridge Works (Miles) booked 8 July (ev 26, 28-30). The invoice email (ev 32) is under a different company name, arrived before the booked visit, and has no visible document or amount. The payee can't be matched to the contractor, so the rules say don't pay and escalate. The classifier also said 'review' (needs_human_response 0.84).

| Alternative considered | Why not |
|---|---|
| Treat Cedar Solutions as a trading name and process the invoice | No amount or document is visible, the payee doesn't match, and the invoice arrived before the visit. Paying would risk the landlord's money on an invoice we can't check. |
| No action and wait for the 8 July visit | An invoice asking for prompt payment is sitting unprocessed, and someone needs to check it so it isn't paid by mistake. |
| Move the stage to works/closeout | Nothing shows the work has been done. The visit is still booked for 8 July. |

**Checks performed before acting**

- Confirmed approval 49 is recorded as approved, plus the second 'proceed' in ev 21 for the £35/£90 + VAT options
- Contractor on record is Stonebridge Works (Miles). 'Cedar' appears only in ev 32
- No attachments on the ticket, so no invoice document, amount or bank details visible
- Checked the invoice date (3 Jul) against the booked visit (8 Jul 10:00-16:00)
- Spotted mismatched tenant details: ev 24 gave the contractor Eliza Langley / 07700 900931, but the tenant on record is Harriet Turner
- Found duplicate ticket 89 (R/PM050-1) with the same job ID NBL-050-2635

**Assumptions**

- Harriet Turner is the correct tenant, based on the ticket record and system emails (ev 13, 29, 30)
- Ev 32 is a system summary of the contractor's email, not the original wording

## Actions taken

| # | Tool | Input (gist) | Result | Output (gist) |
|---|---|---|---|---|
| 1 | `get_ticket_context` | {"ticket_id":90} | ok | {"ok":true,"ticket":{"id":90,"case_ref":"R/PM050-2","property_id":64,"tenant_id":221,"landlord_id":222,"contractor_id":… |
| 2 | `classify_reply` | {"ticket_id":90,"text":"Cedar Solutions sent an invoice and requested prompt payment, along with a suggestion to leave a review on social m… | ok | {"autonomy":"review","intent":"invoice","intent_probs":{"quote_or_estimate":0,"invoice":1,"completion_report":0,"schedu… |
| 3 | `search_case` | {"ticket_id":90,"query":"Cedar"} | ok | {"query":"Cedar","matches":1,"events":[{"id":1359,"ticket_id":90,"ts":"2024-07-03T22:17:46Z","kind":"email","direction"… |
| 4 | `get_ticket_context` | {"ticket_id":89,"events":10} | ok | {"ok":true,"ticket":{"id":89,"case_ref":"R/PM050-1","property_id":64,"tenant_id":219,"landlord_id":220,"contractor_id":… |
| 5 | `escalate_to_human` | {"ticket_id":90,"reason":"Invoice received under a different company name (Cedar Solutions) from the contractor on record (Stonebridge Work… | ok | {"ok":true,"queue_id":40} |
| 6 | `send_message` | {"ticket_id":90,"to":"contractor","channel":"email","subject":"Job NBL-050-2635 – Flat 3, 171 Willowmere Road – invoice query","body":"Hi M… | ok | {"ok":true,"message_id":117,"guard":{"blocked":false,"reasons":[],"probs":{"claims_work_done_unverified":0.22,"promises… |
| 7 | `send_message` | {"ticket_id":90,"to":"landlord","channel":"email","subject":"Job NBL-050-2635 – Flat 3, 171 Willowmere Road – invoice being checked","body"… | ok | {"ok":true,"message_id":119,"guard":{"blocked":false,"reasons":[],"probs":{"claims_work_done_unverified":0.19,"promises… |
| 8 | `place_hold` | {"ticket_id":90,"reason":"Awaiting Stonebridge Works to confirm Cedar Solutions name, send invoice copy and confirm whether work done; visi… | ok | {"ok":true,"hold_id":217} |
| 9 | `add_profile_fact` | {"entity_type":"contact","entity_id":223,"key":"invoice_name_mismatch","value":"Invoice for job NBL-050-2635 arrived under the name 'Cedar … | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":128,"entity_type":"contact","entity_id":223,"key":"invoice_n… |
| 10 | `add_profile_fact` | {"entity_type":"property","entity_id":64,"key":"has_pets","value":"no","source_ref":"event 002 (tenant intake Q&A)","confidence":0.9} | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":129,"entity_type":"property","entity_id":64,"key":"has_pets"… |

Agent's own account of its actions (from the structured result):

- `classify_reply` - Classified the invoice email from ev 32 -> intent invoice, autonomy review, needs_human_response 0.84
- `search_case` - Searched the case for 'Cedar' -> Appears only in ev 32
- `get_ticket_context` - Checked the related ticket 89 for the same property -> Duplicate of the same job NBL-050-2635, still at landlord_approval
- `escalate_to_human` - Handed over the invoice mismatch, the tenant-details mismatch and the duplicate ticket -> queue_id 40, priority normal
- `send_message` - Emailed Stonebridge Works asking them to confirm the Cedar Solutions name, send the invoice and say whether the work is done, and to use Harriet Turner's contact details -> message 117 sent, guard passed
- `send_message` - Emailed the landlord that the invoice is being checked and nothing will be paid until it matches what he approved -> message 119 sent, guard passed
- `place_hold` - Hold waiting on the contractor's reply -> hold 217, follow-up in 2 days
- `add_profile_fact` - Recorded the invoice name mismatch on the contractor's profile -> fact 128
- `add_profile_fact` - Recorded no pets at the property -> fact 129

## Approvals

| Party | Status | Channel |
|---|---|---|
| Landlord Nolan | granted (attendance ev 9; proceed with handle £35+VAT / lock £90+VAT ev 21) | email |

## Escalation & handover

- Escalation needed: **yes**
- Reason: An invoice from Cedar Solutions, which doesn't match the contractor on record, arrived before the booked visit with no amount visible
- Handover summary: Job NBL-050-2635, Flat 3, 171 Willowmere Road. Landlord approved a handle at £35+VAT or a lock at £90+VAT. Stonebridge Works is booked for 8 July. On 3 July an invoice email came in under the name Cedar Solutions with no document visible. Separately, ev 24 sent the contractor another tenant's name and number (Eliza Langley), and ticket 89 is a duplicate of this job.
- Recommendation: Don't pay the invoice until it has the right payee and an amount within £42 or £108 inc VAT, and shows the work was done. Stonebridge's reply is chased in 2 days. Review the possible wrong-tenant data sharing in ev 24 and close duplicate ticket 89.

## What could not be verified

- Whether Cedar Solutions is linked to Stonebridge Works
- The invoice amount and what work it covers
- Whether any work has been done
- Whether the tenant details in ev 24 (Eliza Langley) were simply a mistake

## What failed

_No failures recorded._

## Risks & red flags

- The invoice payee (Cedar Solutions) is different from the contractor on record (Stonebridge Works)
- The invoice arrived 5 days before the booked visit
- Another tenant's name and phone number may have been shared with the contractor (ev 24)
- Duplicate open ticket 89 for the same job could cause double processing

## Final result / next follow-up

- Final status: scheduling – on hold waiting on the contractor (hold 217), human queue item 40 open, invoice not to be paid
- Next follow-up: In 2 days (hold 217) - Chase Stonebridge Works for the invoice copy, the company-name confirmation and work status. Check that the 8 July visit goes ahead.
- Confidence: 0.8

## Run metadata

- Case folder: `C:\Users\sahid\Documents\Projects\Hackathons\DwellyHack\dwelly-agent\data\practice\cases\PM050-2`
- Session id: wrun_01M4JYHKWPP10XTQSZSA89WDWZ
- Started: 2026-10-10T13:02:56.839Z  Finished: 2026-10-10T13:03:54.389Z  Duration: 57.5s
- Events recorded: 445
- Model(s): anthropic/claude-opus-5.5
- Tokens: in 129600 / out 6090; cost: not reported
