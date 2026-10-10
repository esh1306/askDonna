# Case 027 - Answer

## Decision

**wait**

## Summary

The Alderwick Property Works quote (NBL-027-Q1, £3,865.68) is over the approval threshold. The landlord has not answered: the email went out a few hours ago and the call reached only a recording, so nothing is approved yet. I moved the ticket to landlord approval and sent the landlord a formal approval request by email. It sets out what the quote covers and which checkout items it leaves out, including the taped boiler casing and the carpets. I also asked the contractor about VAT and the extractor fan listed twice, and set a 2-day follow-up.

## Judgement

- **Case type:** maintenance
- **Why this decision:** Event 15 says the quote is over the threshold and needs landlord approval, and nobody has approved it (events 16–17). The note in event 2 that approval is 'normally already in place', and the job email saying the works were agreed (event 4), are not an approval of this particular £3,865.68 quote. The landlord was only contacted the same day, so the right move is to log a proper approval request, point out what the quote leaves out, and wait with a follow-up date. No recalled lessons applied.

| Alternative considered | Why not |
|---|---|
| Assign Alderwick and move to scheduling | The landlord hasn't approved the cost, and it is over the threshold. |
| Escalate to a human | Nobody has missed a follow-up deadline yet. The questions about the quote can be put to the landlord and the contractor. The property is empty, so no one is at immediate risk. |
| Just wait without a new approval request | There was no approval record in the CRM to track. Event 14 also didn't mention the gaps in the quote or ask for a clear APPROVE/DECLINE. |

**Checks performed before acting**

- Read the quote: one total of £3,865.68, no VAT shown, no price per item, 'renew an extractor fan' appears twice, no validity date
- Read the checkout report and compared it with the quote. Not quoted: boiler casing, kitchen worktop and water ingress, kitchen flooring and laminate, curtain pole/curtains/bulbs, other rusting radiators, carpets
- Property and contractor match (46 Fernwick Lane, Alderwick/Iris Bell)
- No approvals, holds or lessons were on file
- Safety: smoke detector and boiler items noted. Property is empty, so no immediate occupant risk

**Assumptions**

- The landlord's preferred channel isn't recorded, so I used email, the channel already used in event 14
- The 'NBL' prefix on the quote reference is the agency's client code (Northbridge Lettings), not a mismatch

## Actions taken

| # | Tool | Input (gist) | Result | Output (gist) |
|---|---|---|---|---|
| 1 | `get_ticket_context` | {"ticket_id":101} | ok | {"ok":true,"ticket":{"id":101,"case_ref":"R/027","property_id":95,"tenant_id":274,"landlord_id":275,"contractor_id":276… |
| 2 | `read_attachment` | {"ticket_id":101,"name":"move-out-works-quotation.pdf"} | ok | {"ok":true,"name":"move-out-works-quotation.pdf","text":"# Transcription\n\n**Header (top right):** Alderwick Property … |
| 3 | `read_attachment` | {"ticket_id":101,"name":"checkout-report.pdf"} | ok | {"ok":true,"name":"checkout-report.pdf","text":"# Transcription\n\n**Header (page 1):** CHECKOUT REPORT \| Checkout Repo… |
| 4 | `recall_lessons` | {"ticket_id":101,"situation_text":"Move-out works quote £3,865.68 received from contractor, forwarded to landlord by email, landlord call u… | ok | {"ok":true,"count":0,"lessons":[]} |
| 5 | `move_stage` | {"ticket_id":101,"to":"landlord_approval","reason":"Quote NBL-027-Q1 (£3,865.68) received from Alderwick Property Works (event 13) and forw… | ok | {"ok":true,"from":"intake","to":"landlord_approval","status":"open"} |
| 6 | `request_landlord_approval` | {"ticket_id":101,"summary":"Move-out works at vacant 46 Fernwick Lane per Alderwick Property Works quotation NBL-027-Q1 dated 15 Sep 2025, … | ok | {"ok":true,"approval_id":41,"message_id":88,"landlord":"Landlord (R/027)","guard":{"blocked":false,"reasons":[],"probs"… |
| 7 | `send_message` | {"ticket_id":101,"to":"contractor","channel":"email","subject":"46 Fernwick Lane — quotation NBL-027-Q1 queries (ref R/027)","body":"Hi Iri… | ok | {"ok":true,"message_id":91,"guard":{"blocked":false,"reasons":[],"probs":{"claims_work_done_unverified":0.04,"promises_… |
| 8 | `place_hold` | {"ticket_id":101,"reason":"Awaiting landlord APPROVE/DECLINE on Alderwick quote NBL-027-Q1 £3,865.68 (approval 41); contractor asked to cla… | ok | {"ok":true,"hold_id":283} |
| 9 | `add_profile_fact` | {"entity_type":"property","entity_id":95,"key":"occupancy_status","value":"vacant (between tenancies, being prepared for re-let); keys held… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":144,"entity_type":"property","entity_id":95,"key":"occupancy… |
| 10 | `add_profile_fact` | {"entity_type":"property","entity_id":95,"key":"boiler_casing_needs_gas_safe_inspection","value":"Checkout report: boiler casing apparently… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":145,"entity_type":"property","entity_id":95,"key":"boiler_ca… |

Agent's own account of its actions (from the structured result):

- `move_stage` - Moved the ticket from intake to landlord approval -> Done: now at landlord approval
- `request_landlord_approval` - Emailed the landlord to APPROVE or DECLINE quote NBL-027-Q1 at £3,865.68, listing what it includes, what it leaves out, and offering separate quotes for the boiler inspection, carpets and other items -> Approval request 41 created; message 88 sent
- `send_message` - Asked the contractor whether the price includes VAT, which rooms the two extractor fans are in, and for a rough cost split. Told her the quote isn't approved yet, so not to book -> Message 91 sent
- `place_hold` - Put the ticket on hold waiting for the landlord, follow-up in 2 days -> Hold 283 placed
- `add_profile_fact` - Recorded that the property is vacant and keys are at the office -> Fact 144 saved
- `add_profile_fact` - Recorded that the boiler casing needs a Gas Safe inspection and isn't in the quote -> Fact 145 saved

## Approvals

| Party | Status | Channel |
|---|---|---|
| Owen Vale (landlord) | requested | email |

## Escalation & handover

- Escalation needed: **no**
- Reason: Routine wait for the landlord's approval; no follow-up deadline has passed yet
- Recommendation: If the landlord hasn't replied by the follow-up date, phone them through request_landlord_approval with channel 'call'. Escalate if they still don't respond after that.

## What could not be verified

- Whether the £3,865.68 includes VAT
- Whether the quote means two separate extractor fans, and in which rooms
- The state of the boiler and whether there is a current gas safety certificate
- The cause of the water damage and water ingress
- The landlord's preferred contact channel

## What failed

_No failures recorded._

## Risks & red flags

- The taped boiler casing needs a Gas Safe engineer to inspect it before anyone moves in. It isn't in the quote, and I can't see a gas safety certificate on file
- The top-floor smoke detector isn't working; it must work before a new tenancy starts
- Water damage in five rooms plus water getting in at the worktop could share one cause. The quote stain-blocks the ceilings but doesn't look for the source
- The quote has a single total with no item prices and no validity date

## Final result / next follow-up

- Final status: At landlord approval, on hold waiting for the landlord (approval 41, hold 283)
- Next follow-up: 2025-09-17 - Chase the landlord for APPROVE or DECLINE, by phone if no email reply. Check whether the contractor has answered about VAT and the fans.
- Confidence: 0.82

## Run metadata

- Case folder: `027`
- Session id: wrun_01M4K7CV0XCZHS53JW3SD008QP
- Started: 2026-10-10T15:37:37.474Z  Finished: 2026-10-10T15:38:37.353Z  Duration: 59.9s
- Events recorded: 351
- Model(s): anthropic/claude-opus-5.5
- Tokens: in 138796 / out 5308; cost: not reported
