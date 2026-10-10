# Case 025 - Answer

## Decision

**request_info**

## Summary

The corrected invoice NBL-025-INV-15 now has the right postcode, but it shows no price, VAT, total or work date. No quote was ever received and the landlord approved no amount. I can't send the invoice for payment yet, so I've asked the contractor for a priced invoice and their findings. I've asked the tenant whether the plumber attended, whether the drip has stopped and whether the water is still cloudy. I've told the landlord the invoice is on hold until we have an amount. A hold is set with a 3-day follow-up. I also escalated at low priority because the landlord's approval isn't recorded in the CRM, which blocks the stage move. The new drawer repair and the boiler query in the handover need someone to pick them up.

## Judgement

- **Case type:** maintenance
- **Why this decision:** The corrected invoice (event 022 and the attachment) shows no amount. The landlord's approval in event 003 had no cost attached, and no quote was ever received. So there is nothing to check against an approval and nothing to send for payment. The contractor and tenant can fill these gaps, so I asked them rather than escalating the invoice itself.

| Alternative considered | Why not |
|---|---|
| Forward the invoice to the landlord for payment and move to close-out | There's no amount and no confirmed completion. The CRM also refused the stage move. |
| Escalate the invoice as disputed | Nothing is disputed. The amount is just missing, and the contractor can supply it. |
| Request landlord approval now | The cost is unknown. It's better to ask once we have a priced invoice. |

**Checks performed before acting**

- Invoice property and postcode match the record
- Invoice contractor matches the contractor on the job
- Invoice amount: none shown
- Searched for a quote: none received
- CRM approval status: none recorded
- Completion confirmation: none on file

**Assumptions**

- The landlord's email in event 003 approved the attendance but not any specific cost

## Actions taken

| # | Tool | Input (gist) | Result | Output (gist) |
|---|---|---|---|---|
| 1 | `get_ticket_context` | {"ticket_id":99} | ok | {"ok":true,"ticket":{"id":99,"case_ref":"R/025","property_id":93,"tenant_id":268,"landlord_id":269,"contractor_id":270,… |
| 2 | `read_attachment` | {"ticket_id":99,"name":"corrected-plumbing-invoice.pdf"} | ok | {"ok":true,"name":"corrected-plumbing-invoice.pdf","text":"## Transcription\n\n**Header label (top left):** BILLING DOC… |
| 3 | `recall_lessons` | {"ticket_id":99,"situation_text":"Corrected contractor invoice for tap replacement has the right postcode but shows no amount, no work date… | ok | {"ok":true,"count":0,"lessons":[]} |
| 4 | `search_case` | {"ticket_id":99,"query":"quote"} | ok | {"query":"quote","matches":2,"events":[{"id":2354,"ticket_id":99,"ts":"2025-08-05T09:30:38Z","kind":"email","direction"… |
| 5 | `classify_reply` | {"ticket_id":99,"text":"Corrected invoice NBL-025-INV-15, 15 Sept 2025, 18 Thistlewick Row, Fenmere, ZZ1 1ZZ. Work invoiced: supply and ins… | ok | {"autonomy":"review","intent":"invoice","intent_probs":{"quote_or_estimate":0,"invoice":1,"completion_report":0,"schedu… |
| 6 | `move_stage` | {"ticket_id":99,"to":"works","reason":"Landlord approved proceeding with plumbing works by email (event 003); Bracken & Vale Plumbing was b… | FAILED: Move to 'works' refused: No landlord approval or standing authority is on record for this ticket. Request approval with… |  |
| 7 | `send_message` | {"ticket_id":99,"to":"contractor","channel":"email","subject":"R/025 – 18 Thistlewick Row, Fenmere, ZZ1 1ZZ – invoice NBL-025-INV-15","body… | ok | {"ok":true,"message_id":85,"guard":{"blocked":false,"reasons":[],"probs":{"claims_work_done_unverified":0.34,"promises_… |
| 8 | `send_message` | {"ticket_id":99,"to":"tenant","channel":"email","subject":"R/025 – kitchen tap, 18 Thistlewick Row","body":"Dear Nia,\n\nBracken & Vale Plu… | FAILED: Blocked by Jev outbound guard (message). claims_work_done_unverified (p=0.83): claims work is done/booked/paid/approved… |  |
| 9 | `send_message` | {"ticket_id":99,"to":"landlord","channel":"email","subject":"R/025 – kitchen tap, 18 Thistlewick Row – invoice update","body":"Dear Mr Bell… | FAILED: Blocked by Jev outbound guard (message). claims_work_done_unverified (p=0.86): claims work is done/booked/paid/approved… |  |
| 10 | `send_message` | {"ticket_id":99,"to":"tenant","channel":"email","subject":"R/025 – kitchen tap, 18 Thistlewick Row","body":"Dear Nia,\n\nPlease could you l… | ok | {"ok":true,"message_id":86,"guard":{"blocked":false,"reasons":[],"probs":{"claims_work_done_unverified":0.08,"promises_… |
| 11 | `send_message` | {"ticket_id":99,"to":"landlord","channel":"email","subject":"R/025 – kitchen tap, 18 Thistlewick Row – invoice query","body":"Dear Mr Bell,… | FAILED: Blocked by Jev outbound guard (message). claims_work_done_unverified (p=0.78): claims work is done/booked/paid/approved… |  |
| 12 | `send_message` | {"ticket_id":99,"to":"landlord","channel":"email","subject":"R/025 – kitchen tap, 18 Thistlewick Row – invoice query","body":"Dear Mr Bell,… | ok | {"ok":true,"message_id":89,"guard":{"blocked":false,"reasons":[],"probs":{"claims_work_done_unverified":0.18,"promises_… |
| 13 | `place_hold` | {"ticket_id":99,"reason":"Waiting on Bracken & Vale for a priced invoice (NBL-025-INV-15 shows no amount), the attendance date and their fi… | ok | {"ok":true,"hold_id":281} |
| 14 | `add_profile_fact` | {"entity_type":"contact","entity_id":269,"key":"preferred_channel","value":"email","source_ref":"event 003 (landlord email)"} | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":138,"entity_type":"contact","entity_id":269,"key":"preferred… |
| 15 | `add_profile_fact` | {"entity_type":"property","entity_id":93,"key":"access_agency_spare_key","value":"Agency holds a spare key. The tenant has authorised contr… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":139,"entity_type":"property","entity_id":93,"key":"access_ag… |
| 16 | `add_profile_fact` | {"entity_type":"contact","entity_id":270,"key":"scheduling_notes","value":"Slow to respond: about 5 weeks to offer a slot. Asks for booking… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":140,"entity_type":"contact","entity_id":270,"key":"schedulin… |
| 17 | `escalate_to_human` | {"ticket_id":99,"reason":"CRM housekeeping: the landlord's approval isn't recorded so the stage can't move. Also a new drawer repair and a … | ok | {"ok":true,"queue_id":42} |

Agent's own account of its actions (from the structured result):

- `get_ticket_context` - Loaded the ticket -> Stage is intake. No approvals, holds or facts on record.
- `read_attachment` - Read the corrected invoice -> Ref NBL-025-INV-15, right postcode, covers supplying and installing a mono sink tap. No amounts, work date or payee details.
- `recall_lessons` - Looked for lessons on similar invoice situations -> None found
- `search_case` - Searched for 'quote' -> Only the agency's requests for a quote (events 004 and 005). No quote received.
- `classify_reply` - Classified the corrected invoice -> Invoice, review suggested, mentions_amount 0.03
- `move_stage` (FAILED) - Tried to move the stage to works -> Refused: no landlord approval on record in the CRM
- `send_message` - Emailed the contractor asking for a priced invoice, the attendance date and findings on the cloudy water -> Sent (message 85)
- `send_message` - Emailed the tenant asking about the tap and cloudy water, and acknowledged the drawer report -> Blocked by the guard on the first try. The rewrite was sent (message 86).
- `send_message` - Updated the landlord that the invoice is on hold pending an amount -> Blocked by the guard twice. The third version was sent (message 89).
- `place_hold` - Placed a hold waiting on the contractor's priced invoice and the tenant's confirmation -> Hold 281, follow-up in 3 days
- `add_profile_fact` - Recorded the landlord's preferred channel (email), the spare-key access arrangement, and the contractor's scheduling notes -> Facts 138, 139 and 140 recorded
- `escalate_to_human` - Low-priority handover: approval missing from the CRM, drawer repair and boiler query -> Queue item 42

## Approvals

| Party | Status | Channel |
|---|---|---|
| Orin Bell (Landlord) | granted per event 003 (no amount), but not recorded in the CRM | email |

## Escalation & handover

- Escalation needed: **yes**
- Reason: The landlord's approval isn't recorded in the CRM, which blocks stage moves. The new drawer repair and the boiler query are outside this job.
- Handover summary: Corrected invoice NBL-025-INV-15 has no amount. The contractor and tenant have been asked to fill the gaps and the landlord has been told. Hold 281 has a 3-day follow-up.
- Recommendation: Log the event 003 approval. When the priced invoice arrives, send the amount to the landlord to confirm. Open a separate ticket for the drawer. Check the boiler work with the relevant engineer.

## What could not be verified

- Whether the tap was actually replaced and the drip fixed (no completion report from the contractor or the tenant)
- The cost of the work
- The date of the work
- The cause of the cloudy water
- Boiler work mentioned in event 021

## What failed

- Tool `move_stage` failed: Move to 'works' refused: No landlord approval or standing authority is on record for this ticket. Request approval with request_landlord_approval (or record the landlord's clear answer with record_approval_response) before assigning a contractor or moving the job into scheduling, works or close-out.
- Tool `send_message` failed: Blocked by Jev outbound guard (message). claims_work_done_unverified (p=0.83): claims work is done/booked/paid/approved without evidence in the records: rewrite without claiming completion; say only what is confirmed. Rewrite the text to fix this and retry, or escalate_to_human if you cannot.
- Tool `send_message` failed: Blocked by Jev outbound guard (message). claims_work_done_unverified (p=0.86): claims work is done/booked/paid/approved without evidence in the records: rewrite without claiming completion; say only what is confirmed. Rewrite the text to fix this and retry, or escalate_to_human if you cannot.
- Tool `send_message` failed: Blocked by Jev outbound guard (message). claims_work_done_unverified (p=0.78): claims work is done/booked/paid/approved without evidence in the records: rewrite without claiming completion; say only what is confirmed. Rewrite the text to fix this and retry, or escalate_to_human if you cannot.
- Agent reported: move_stage to works was refused: no approval on record in the CRM
- Agent reported: The guard blocked one tenant draft and two landlord drafts. The rewrites were sent.

## Risks & red flags

- The invoice has no amount, payee details or work date
- A full tap replacement was invoiced but the landlord never approved a cost or saw a quote
- The cloudy water was never assessed
- The contractor was confused about the address once and the first invoice had the wrong postcode
- The invoice prefix 'NBL' doesn't obviously match the contractor's name
- The drawer repair is unaddressed and has been waiting since 5 Sept

## Final result / next follow-up

- Final status: On hold at intake (stage move blocked by the CRM), waiting on the contractor's priced invoice and the tenant's confirmation. Low-priority human queue item 42 is open.
- Next follow-up: 2025-09-18 - Chase Bracken & Vale for a priced invoice and the tenant for confirmation. Then send the amount to the landlord to confirm.
- Confidence: 0.75

## Run metadata

- Case folder: `025`
- Session id: wrun_01M4K7C7AT81B4CR8FKKPRGAM5
- Started: 2026-10-10T15:37:17.306Z  Finished: 2026-10-10T15:38:46.564Z  Duration: 89.3s
- Events recorded: 676
- Model(s): anthropic/claude-opus-5.5
- Tokens: in 228101 / out 8702; cost: not reported
