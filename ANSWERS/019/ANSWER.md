# Case 019 - Answer

## Decision

**escalate**

## Summary

I haven't paid or forwarded the Alder & Finch invoice for £174, and I've escalated the case at high priority (queue 35). We asked the contractor for a quotation only and told him in writing not to start, but he did the work anyway. Nobody knows how he got into the empty property. The invoice is one lump sum with no breakdown, and some items go beyond the original repairs. I've asked the contractor for the details we need, told the landlord the invoice is on hold, and set a 2-day follow-up.

## Judgement

- **Case type:** maintenance_admin
- **Why this decision:** The landlord approved the remedial works with no cost stated (ev 005), but the agency asked Alder & Finch for a quote only and said no work until written authority (ev 007/008). The contractor says he did the work anyway on 9 Sep (ev 013). Invoice NBL-019-INV-11 is a single £174 line with no itemised breakdown, VAT, work date or payment terms. It also includes replacements that weren't authorised: a floorboard plus carpet reinstatement, and a new Venetian blind. The property is vacant and the agency held the keys, so how he got in is a security question. The rules say an invoice that doesn't match an approved quote gets escalated, not paid. Jev also flagged the invoice for review (needs a human response: 0.84).

| Alternative considered | Why not |
|---|---|
| Forward the invoice to the landlord for payment and move to close-out | No price or scope was ever agreed, the work went ahead against our written instruction, and nothing proves it was done. |
| Just wait for the contractor | How he got into the empty property and whether the work was unauthorised both need a staff decision. The landlord also needs to know the invoice is on hold. |
| Reject the invoice outright | The landlord did approve the works in general, so whether to accept the invoice is a decision for agency staff and the landlord. |

**Checks performed before acting**

- Read the invoice: correct property and contractor, £174 lump sum, no itemised breakdown, VAT or work date
- Checked approvals: no amount approved and no approval record in the CRM
- Compared the invoiced scope with the inspection items: the floorboard and blind were replaced, not repaired
- Checked access: tenant gone, agency holds the keys, no access arrangement on file
- Looked for completion evidence: none visible
- Lessons: none found

**Assumptions**

- The landlord's general approval did not authorise any price without a quote, since the agency made the quote a condition (ev 007/008)

## Actions taken

| # | Tool | Input (gist) | Result | Output (gist) |
|---|---|---|---|---|
| 1 | `get_ticket_context` | {"ticket_id":93} | ok | {"ok":true,"ticket":{"id":93,"case_ref":"R/019","property_id":87,"tenant_id":251,"landlord_id":252,"contractor_id":253,… |
| 2 | `read_attachment` | {"ticket_id":93,"name":"remedial-works-invoice.pdf"} | ok | {"ok":true,"name":"remedial-works-invoice.pdf","text":"## Transcription\n\n**Header label:** BILLING DOCUMENT\n**Header… |
| 3 | `recall_lessons` | {"ticket_id":93,"situation_text":"Contractor asked for quote only did the work without written authority and sent a £174 lump-sum invoice; … | ok | {"ok":true,"count":0,"lessons":[]} |
| 4 | `classify_reply` | {"ticket_id":93,"text":"Forwarded invoice NBL-019-INV-11 from Alder & Finch Repairs, £174.00 lump sum for remedial works at 18 Brindle Row … | ok | {"autonomy":"review","intent":"invoice","intent_probs":{"quote_or_estimate":0,"invoice":1,"completion_report":0,"schedu… |
| 5 | `escalate_to_human` | {"ticket_id":93,"reason":"Invoice for £174 covers work done without the written authority we required; access to the vacant property, scope… | ok | {"ok":true,"queue_id":35} |
| 6 | `send_message` | {"ticket_id":93,"to":"contractor","channel":"email","subject":"18 Brindle Row, Larkspur Vale – ref R/019 – invoice NBL-019-INV-11","body":"… | ok | {"ok":true,"message_id":76,"guard":{"blocked":false,"reasons":[],"probs":{"claims_work_done_unverified":0.09,"promises_… |
| 7 | `send_message` | {"ticket_id":93,"to":"landlord","channel":"email","subject":"18 Brindle Row – ref R/019 – remedial works invoice on hold","body":"Dear Mr M… | ok | {"ok":true,"message_id":75,"guard":{"blocked":false,"reasons":[],"probs":{"claims_work_done_unverified":0.18,"promises_… |
| 8 | `place_hold` | {"ticket_id":93,"reason":"Waiting for Alder & Finch to send visit date, how they got in, photos and itemised breakdown for invoice NBL-019-… | ok | {"ok":true,"hold_id":275} |
| 9 | `add_profile_fact` | {"entity_type":"property","entity_id":87,"key":"occupancy_status","value":"vacant since 27 Aug 2025 (former tenant returned keys); agency h… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":119,"entity_type":"property","entity_id":87,"key":"occupancy… |
| 10 | `add_profile_fact` | {"entity_type":"contact","entity_id":253,"key":"reliability_note","value":"R/019: asked for a quote only, but carried out the works without… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":120,"entity_type":"contact","entity_id":253,"key":"reliabili… |
| 11 | `add_profile_fact` | {"entity_type":"contact","entity_id":251,"key":"tenancy_status","value":"former tenant; vacated and returned keys on 27 Aug 2025; cannot pr… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":121,"entity_type":"contact","entity_id":251,"key":"tenancy_s… |

Agent's own account of its actions (from the structured result):

- `get_ticket_context` - Loaded the case -> Stage: intake. No approvals, holds or profile facts on record
- `read_attachment` - Read the invoice -> NBL-019-INV-11, £174.00 lump sum, not itemised
- `recall_lessons` - Looked for similar past cases -> None found
- `classify_reply` - Classified the contractor's invoice email -> Invoice; flagged for review (needs a human response: 0.84)
- `escalate_to_human` - Escalated: work done without authority, unknown access, unverified invoice -> Queue 35, high priority
- `send_message` - Emailed the contractor asking for the visit date, how he got in, photos, an itemised breakdown and why items were replaced -> Message 76 sent
- `send_message` - Emailed the landlord that the invoice is on hold and why -> Message 75 sent
- `place_hold` - Hold while we wait for the contractor's details -> Hold 275, follow-up in 2 days
- `add_profile_fact` - Recorded the property as vacant, the tenant's status and a reliability note on the contractor -> Facts 119-121 saved

## Approvals

| Party | Status | Channel |
|---|---|---|
| Ivo Marlow (landlord) | granted in general terms with no amount (ev 005); not granted for the £174 invoice | email |

## Escalation & handover

- Escalation needed: **yes**
- Reason: Contractor did the work without authority, access to the empty property is unexplained, and the invoice can't be checked against any agreed quote
- Handover summary: The landlord approved the works in general. We asked Alder & Finch for a quote only, but they did the work and invoiced a £174 lump sum. We don't know how they got in, there is no proof of completion, and the floorboard and blind were replaced without authorisation.
- Recommendation: Confirm the property is secure and check the key log. Get the work verified. Decide with the landlord whether to accept the invoice. Check whether any costs can be recovered from the former tenant's deposit.

## What could not be verified

- Whether the work was done, and to what standard
- The contractor's claimed work date of 9 Sep
- How the contractor got in
- Whether £174 includes VAT or is reasonable

## What failed

_No failures recorded._

## Risks & red flags

- Unexplained entry to an empty property
- Work done against a written instruction to quote only
- Invoice not itemised, with unauthorised replacements
- Earlier email to the landlord (ev 009) wrongly said a time was being agreed with the tenant, who had already left

## Final result / next follow-up

- Final status: Stage: intake. On hold waiting for the contractor (hold 275). Escalated to queue 35. Invoice not paid.
- Next follow-up: In 2 days (hold 275) - Chase Alder & Finch for the visit date, how they got in, photos and an itemised breakdown; check the human queue outcome
- Confidence: 0.85

## Run metadata

- Case folder: `019`
- Session id: wrun_01M4K7A6P0T6YWKCM6417E8ND8
- Started: 2026-10-10T15:36:11.116Z  Finished: 2026-10-10T15:37:17.297Z  Duration: 66.2s
- Events recorded: 476
- Model(s): anthropic/claude-opus-5.5
- Tokens: in 112761 / out 6015; cost: not reported
