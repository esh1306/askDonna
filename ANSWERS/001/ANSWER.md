# Case 001 - Answer

## Decision

**request_info**

## Summary

I haven't asked the landlord to approve anything yet, because the Hearthline pricing can't be put to him as it stands. The quote PDF shows a different property's address, and the itemised breakdown (£1,270 + £1,170 = £2,440) doesn't match the quoted subtotal of £2,370. The breakdown also adds a "10% Northbridge commission" and a 50% deposit. I've asked the contractor for one corrected quote, explained the mix-up to the landlord, sent the tenant an update with safety advice and passed the commission question to the team.

## Judgement

- **Case type:** maintenance
- **Why this decision:** The landlord's reply (event 023) is a question, not an approval (classifier: question 1.0, unconditional approval 0.01). The quote PDF names 8 Wrenfold Mews, Brindlewick instead of this property. The breakdown in event 021 adds up to £2,440 against the PDF's £2,370 subtotal, and it brings in a commission and a deposit that aren't on the quote. Asking for approval on an amount that doesn't reconcile would be unsafe. The contractor can fix these problems, so I asked him. Whether an agency commission should be added is for the agency to decide, so I passed that to the team.

| Alternative considered | Why not |
|---|---|
| Ask the landlord to approve £2,844 now | The amount is disputed by the contractor's own breakdown, the quote shows the wrong address, and the extra commission and deposit are unclear. |
| Just wait | The landlord asked a direct question and the leak is getting worse, so the job needed to keep moving. |
| Treat the leak as an emergency and send someone without approval | The tenant reports no water outside the bathroom and no electrical danger. It's an urgent repair, not an emergency. |

**Checks performed before acting**

- Approval status: none recorded; the landlord authorised the inspection and quote only (event 005)
- Quote PDF read: address mismatch; VAT arithmetic is correct internally
- Breakdown checked against the quote: £2,440 vs £2,370; commission and deposit not on the quote
- Classified the landlord's reply
- Checked for past team lessons: none found
- Safety: water ingress is contained to the bathroom wall as far as reported

**Assumptions**

- The 'couple of quotes' the landlord means are the PDF quote and the later breakdown
- The wrong address on the PDF is probably a template error, but this isn't confirmed

## Actions taken

| # | Tool | Input (gist) | Result | Output (gist) |
|---|---|---|---|---|
| 1 | `get_ticket_context` | {"ticket_id":75} | ok | {"ok":true,"ticket":{"id":75,"case_ref":"R/001","property_id":69,"tenant_id":199,"landlord_id":200,"contractor_id":201,… |
| 2 | `read_attachment` | {"ticket_id":75,"name":"bathroom-works-quotation.pdf"} | ok | {"ok":true,"name":"bathroom-works-quotation.pdf","text":"# Transcription\n\n**Document type:** Contractor quotation (PD… |
| 3 | `recall_lessons` | {"ticket_id":75,"situation_text":"Landlord asks which quote we mean; quote PDF shows a different property address and contractor's breakdow… | ok | {"ok":true,"count":0,"lessons":[]} |
| 4 | `classify_reply` | {"ticket_id":75,"text":"Which quote do you mean? There are a couple. (Asked for clarification before confirming whether to proceed.)","send… | ok | {"autonomy":"review","intent":"question","intent_probs":{"approve":0,"decline":0,"conditional_approval":0,"question":1,… |
| 5 | `send_message` | {"ticket_id":75,"to":"contractor","channel":"email","subject":"Revised quote needed – 4 Thistlewick Rise, Larkcombe ZZ1 1ZZ (ref R/001, you… | ok | {"ok":true,"message_id":47,"guard":{"blocked":false,"reasons":[],"probs":{"claims_work_done_unverified":0.11,"promises_… |
| 6 | `send_message` | {"ticket_id":75,"to":"landlord","channel":"email","subject":"Bathroom leak quote – 4 Thistlewick Rise, Larkcombe ZZ1 1ZZ (ref R/001)","body… | ok | {"ok":true,"message_id":46,"guard":{"blocked":false,"reasons":[],"probs":{"claims_work_done_unverified":0.09,"promises_… |
| 7 | `send_message` | {"ticket_id":75,"to":"tenant","channel":"email","subject":"Update on shower leak – 4 Thistlewick Rise (ref R/001)","body":"Dear Ms Quill,\n… | ok | {"ok":true,"message_id":45,"guard":{"blocked":false,"reasons":[],"probs":{"claims_work_done_unverified":0.07,"promises_… |
| 8 | `move_stage` | {"ticket_id":75,"to":"landlord_approval","reason":"Inspection done and quote received (event 016); landlord authorised inspection/quote onl… | ok | {"ok":true,"from":"intake","to":"landlord_approval","status":"open"} |
| 9 | `place_hold` | {"ticket_id":75,"reason":"Awaiting reissued, reconciled Hearthline quote (correct address 4 Thistlewick Rise, itemised total, no commission… | ok | {"ok":true,"hold_id":259} |
| 10 | `add_profile_fact` | {"entity_type":"property","entity_id":69,"key":"access_office_keys_authorised","value":"Tenant authorised contractor entry using office key… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":69,"entity_type":"property","entity_id":69,"key":"access_off… |
| 11 | `add_profile_fact` | {"entity_type":"contact","entity_id":200,"key":"requires_itemised_quote_before_approval","value":"true","source_ref":"events 004, 018 (land… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":70,"entity_type":"contact","entity_id":200,"key":"requires_i… |
| 12 | `escalate_to_human` | {"ticket_id":75,"reason":"Contractor breakdown adds a '10% Northbridge commission' not on the quote; agency must decide how commission/fees… | ok | {"ok":true,"queue_id":24} |

Agent's own account of its actions (from the structured result):

- `get_ticket_context` - Loaded the ticket -> Stage intake, no approvals or holds
- `read_attachment` - Read the Hearthline quotation -> £2,370 + £474 VAT = £2,844; property shown as 8 Wrenfold Mews; no itemisation
- `recall_lessons` - Checked for past team lessons on similar cases -> None found
- `classify_reply` - Classified the landlord's question -> Question; needs review
- `send_message` - Asked the contractor for one reissued, itemised quote with the correct address, no commission line and clear deposit terms -> Queued (id 47)
- `send_message` - Explained the two pricing versions to the landlord and asked him not to approve either yet -> Queued (id 46)
- `send_message` - Sent the tenant a progress update with containment advice and an update date of 25 Sept -> Queued (id 45)
- `move_stage` - Moved the ticket from intake to landlord_approval -> Moved
- `place_hold` - Hold while waiting for the corrected quote -> Hold 259, follow up in 2 days
- `add_profile_fact` - Recorded that the tenant authorised entry with office keys (property) and that the landlord wants an itemised quote before approving (landlord) -> Both recorded, no conflicts
- `escalate_to_human` - Passed the commission and quote discrepancies to the team -> Queue item 24

## Approvals

| Party | Status | Channel |
|---|---|---|
| Orin Vale (landlord) | inspection and quote approved; repair not yet requested, waiting for the corrected quote | email |

## Escalation & handover

- Escalation needed: **yes**
- Reason: The contractor's breakdown adds a 10% Northbridge commission and a deposit, and it doesn't match the quoted subtotal. How commission is handled and disclosed is an agency decision.
- Handover summary: Leak at 4 Thistlewick Rise. Hearthline quoted £2,844 including VAT, but the PDF shows the wrong address and the breakdown comes to £2,440 before VAT, not £2,370. The breakdown also adds a 10% commission and a 50% deposit. I've asked Hearthline for a corrected quote and told the landlord not to approve yet. Hold 259 is set for 2 days.
- Recommendation: The property manager should settle the commission question with Hearthline and make sure any fee is disclosed to the landlord. When the corrected quote arrives, it should go to the landlord for APPROVE or DECLINE.

## What could not be verified

- Whether the agency and Hearthline have agreed a 10% commission
- How the 50% deposit would be calculated
- Why the quote shows 8 Wrenfold Mews
- Which two quotes the landlord means
- The tenant's current whereabouts and whether she can give access

## What failed

_No failures recorded._

## Risks & red flags

- The leak has gone on for about 3 weeks and the wall damage is getting worse
- The quote shows another property's address
- The breakdown doesn't match the quoted subtotal
- An agency commission appears in the contractor's pricing

## Final result / next follow-up

- Final status: landlord_approval, on hold waiting for the contractor's corrected quote; also with the team (queue item 24)
- Next follow-up: 2025-09-25 - Chase Hearthline for the corrected quote. When it arrives, ask the landlord to approve it by email, or by phone if he still can't be reached, and update the tenant.
- Confidence: 0.82

## Run metadata

- Case folder: `001`
- Session id: wrun_01M4K74TFZ6DSGBGMSXJJVB110
- Started: 2026-10-10T15:33:14.571Z  Finished: 2026-10-10T15:34:31.761Z  Duration: 77.2s
- Events recorded: 546
- Model(s): anthropic/claude-opus-5.5
- Tokens: in 150119 / out 7054; cost: not reported
