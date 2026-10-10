# Case PM044-2 - Answer

## Decision

**escalate**

## Summary

Cedar Homes says the window handle job is finished, so the alert about chasing the contractor is out of date. I moved the ticket to closeout and asked Cedar Homes to resend the invoice, because the attachment never arrived. I also asked the tenant to confirm the repair and set a 3-day hold. I passed it to a human at normal priority because the invoice can't be checked, the landlord's approval gave no amount, and the tenant's name and phone number don't match across the records.

## Actions taken

| # | Tool | Input (gist) | Result | Output (gist) |
|---|---|---|---|---|
| 1 | `get_ticket_context` | {"ticket_id":19} | ok | {"ok":true,"ticket":{"id":19,"case_ref":"R/PM044-2","property_id":18,"tenant_id":42,"landlord_id":43,"contractor_id":44… |
| 2 | `move_stage` | {"ticket_id":19,"to":"closeout","reason":"Contractor Cedar Homes (Noah Ellis) reported the job complete on 2025-02-11 (event 019), after la… | ok | {"ok":true,"from":"scheduling","to":"closeout","status":"open"} |
| 3 | `send_message` | {"ticket_id":19,"to":"contractor","channel":"email","subject":"Flat 21, 129 Juniper Mews – R/PM044-2 – invoice not received","body":"Hi Noa… | ok | {"ok":true,"message_id":25} |
| 4 | `send_message` | {"ticket_id":19,"to":"tenant","channel":"email","subject":"Flat 21, 129 Juniper Mews – R/PM044-2 – window handle","body":"Hello,\n\nJob ref… | ok | {"ok":true,"message_id":26} |
| 5 | `add_profile_fact` | {"entity_type":"contact","entity_id":43,"key":"approved_window_handle_repair_r_pm044_2","value":"Landlord (signed 'Palmer') replied 'Please… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":35,"entity_type":"contact","entity_id":43,"key":"approved_wi… |
| 6 | `add_profile_fact` | {"entity_type":"contact","entity_id":42,"key":"phone_number_conflict","value":"Two numbers given to contractor for tenant Nora Quinn: 07700… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":36,"entity_type":"contact","entity_id":42,"key":"phone_numbe… |
| 7 | `add_profile_fact` | {"entity_type":"property","entity_id":18,"key":"window_top_of_stairs_handle","value":"Handle came off window at top of staircase (also has … | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":37,"entity_type":"property","entity_id":18,"key":"window_top… |
| 8 | `place_hold` | {"ticket_id":19,"reason":"Waiting for Cedar Homes to resend the invoice (the attachment from event 019 never arrived) and for the tenant to… | ok | {"ok":true,"hold_id":46} |
| 9 | `escalate_to_human` | {"ticket_id":19,"reason":"Completion claimed but invoice is missing, the approved amount is unknown, and the tenant's name and phone number… | ok | {"ok":true,"queue_id":7} |

Agent's own account of its actions (from the structured result):

- `get_ticket_context` - Loaded the case -> 20 events, no holds, approvals or attachments
- `move_stage` - Moved from scheduling to closeout because the contractor says the work is complete -> Now in closeout
- `send_message` - Emailed the contractor asking them to resend the missing invoice with full details -> message_id 25
- `send_message` - Emailed the tenant asking them to confirm the window now opens and closes -> message_id 26
- `add_profile_fact` - Recorded the landlord's go-ahead (no amount given) -> fact 35
- `add_profile_fact` - Recorded that the tenant's name and phone numbers conflict -> fact 36
- `add_profile_fact` - Recorded the window repair history on the property -> fact 37
- `place_hold` - Hold while waiting for the invoice and the tenant's confirmation -> hold 46, follow up in 3 days
- `escalate_to_human` - Handover for invoice checks and the tenant identity/phone conflict -> queue_id 7

## Approvals

| Party | Status | Channel |
|---|---|---|
| Landlord (Palmer) | granted (email event 012, no amount) | email |

## Escalation & handover

- Escalation needed: **yes**
- Reason: The invoice is missing and the approved amount is unknown, and the tenant's name and phone number conflict in the records
- Handover summary: Cedar Homes says the window handle job is complete, but the invoice never arrived and I've asked them to resend it. I've asked the tenant to confirm the repair. Records show the tenant as both Nora Quinn and 'Harriet', with two phone numbers (07700 900307 and 07700 900251). The tenant also mentioned a broken latch.
- Recommendation: Check the tenancy record for the tenant's name and phone number. Check the invoice against the contractor, the property and the scope of work, and get the landlord to confirm if the cost is more than a minor repair. Close the ticket once the tenant confirms.

## What could not be verified

- The work being complete (contractor says so; tenant hasn't confirmed)
- The invoice amount and contents
- Whether the tenant is Nora Quinn or Harriet, and which phone number is correct
- Whether the broken latch was also fixed

## What failed

_No failures recorded._

## Risks & red flags

- Invoice claimed but not received
- Landlord's approval gave no amount and there was no quote
- Tenant's name and phone number conflict in the records
- The event 020 alert was raised after the contractor had already replied

## Final result / next follow-up

- Final status: closeout; on hold (hold 46) waiting for the contractor's invoice and the tenant's confirmation; with the human team (queue 7)
- Next follow-up: In 3 days (about 2025-02-15) - Chase Cedar Homes for the invoice and the tenant for confirmation, check the invoice, then close
- Confidence: 0.8

## Run metadata

- Case folder: `C:\Users\sahid\Documents\Projects\Hackathons\DwellyHack\dwelly-agent\data\practice\cases\PM044-2`
- Session id: wrun_01M4JSZ7YNA4QZC6PX1RK9ZHZR
- Started: 2026-10-10T11:43:00.387Z  Finished: 2026-10-10T11:43:42.569Z  Duration: 42.2s
- Events recorded: 376
- Model(s): anthropic/claude-opus-5.5
- Tokens: in 66485 / out 4724; cost: not reported
