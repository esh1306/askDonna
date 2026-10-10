# Case 013 - Answer

## Decision

**request_info**

## Summary

Clearfirth Glazing has sent invoice NBL-013-INV-09, but it shows no amount, and nothing on file confirms a visit or the fitting. The last update (event 021) was that the glass was delayed. I'm holding the invoice rather than forwarding it. I asked the contractor for the amount with a VAT breakdown and the fitting date, asked the tenant whether the pane was fitted and the problem has stopped, and told the landlord. The ticket is on hold with a 3-day follow-up.

## Judgement

- **Case type:** maintenance
- **Why this decision:** An invoice can't be forwarded without an amount to check against the approved £180. The records also don't show that the work was done: event 021 says the glass hadn't arrived, and event 022 moved the case to awaiting post-visit documents without any visit evidence. The contractor (amount, date) and tenant (whether it was fitted) can answer both questions, so I asked them instead of escalating.

| Alternative considered | Why not |
|---|---|
| Forward the invoice to the landlord for payment | There is no amount to compare with the £180 cap and no evidence the work was done. |
| Escalate to a human now | This is resolvable by asking the contractor and tenant. It isn't a real conflict yet. |
| Close the ticket | Completion isn't verified, and the tenant's damp and cold concern hasn't been confirmed resolved. |

**Checks performed before acting**

- Invoice property matches 8 Brackenmere Walk
- Invoice issuer Clearfirth Glazing matches the contractor on the job
- Invoice amount is blank, so it can't be checked against £180
- Searched the case for completion evidence and found none
- Approval condition: £150 + VAT = £180 total meets the landlord's condition (events 009–012)
- Not a safety emergency: the sash opens and locks

**Assumptions**

- The landlord's approval in event 010 covers the £180 total quote that the agency recorded in event 012
- The 'NBL-013' prefix on the invoice relates to this job

## Actions taken

| # | Tool | Input (gist) | Result | Output (gist) |
|---|---|---|---|---|
| 1 | `get_ticket_context` | {"ticket_id":87} | ok | {"ok":true,"ticket":{"id":87,"case_ref":"R/013","property_id":81,"tenant_id":234,"landlord_id":235,"contractor_id":236,… |
| 2 | `read_attachment` | {"ticket_id":87,"name":"glazing-invoice.pdf"} | ok | {"ok":true,"name":"glazing-invoice.pdf","text":"# Transcription\n\n**Header (top of page):** BILLING DOCUMENT \| Clearfi… |
| 3 | `recall_lessons` | {"ticket_id":87,"situation_text":"Contractor invoice uploaded with no amount; no appointment or completion confirmed in records; glass was … | ok | {"ok":true,"count":0,"lessons":[]} |
| 4 | `search_case` | {"ticket_id":87,"query":"fitted"} | ok | {"query":"fitted","matches":0,"events":[]} |
| 5 | `move_stage` | {"ticket_id":87,"to":"works","reason":"Landlord approved Clearfirth Glazing on condition £180 was the total (event 010); quote was £150 + V… | FAILED: Move to 'works' refused: No landlord approval or standing authority is on record for this ticket. Request approval with… |  |
| 6 | `send_message` | {"ticket_id":87,"to":"contractor","channel":"email","subject":"8 Brackenmere Walk, Vellumbrook ZZ1 1ZZ – ref R/013 – invoice NBL-013-INV-09… | ok | {"ok":true,"message_id":65,"guard":{"blocked":false,"reasons":[],"probs":{"claims_work_done_unverified":0.27,"promises_… |
| 7 | `send_message` | {"ticket_id":87,"to":"tenant","channel":"email","subject":"8 Brackenmere Walk – kitchen glazing – ref R/013","body":"Hello Elowen,\n\nThis … | ok | {"ok":true,"message_id":66,"guard":{"blocked":false,"reasons":[],"probs":{"claims_work_done_unverified":0.05,"promises_… |
| 8 | `place_hold` | {"ticket_id":87,"reason":"Invoice NBL-013-INV-09 has no amount and there's no record of a visit or completion. Asked Clearfirth Glazing for… | ok | {"ok":true,"hold_id":269} |
| 9 | `add_profile_fact` | {"entity_type":"contact","entity_id":235,"key":"approval_r013_glazing_cap_gbp","value":"180 total incl VAT (conditional: \"happy to use the… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":99,"entity_type":"contact","entity_id":235,"key":"approval_r… |
| 10 | `add_profile_fact` | {"entity_type":"property","entity_id":81,"key":"has_pets","value":"yes","source_ref":"event 001 (tenant email)"} | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":100,"entity_type":"property","entity_id":81,"key":"has_pets"… |
| 11 | `add_profile_fact` | {"entity_type":"contact","entity_id":234,"key":"wants_to_be_present_for_visits","value":"true","source_ref":"event 014 (tenant email)"} | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":101,"entity_type":"contact","entity_id":234,"key":"wants_to_… |
| 12 | `add_profile_fact` | {"entity_type":"contact","entity_id":236,"key":"reliability_note","value":"R/013: slow to respond, gave no delivery or attendance estimate … | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":102,"entity_type":"contact","entity_id":236,"key":"reliabili… |
| 13 | `send_message` | {"ticket_id":87,"to":"landlord","channel":"email","subject":"8 Brackenmere Walk – kitchen glazing – ref R/013 – invoice update","body":"Dea… | ok | {"ok":true,"message_id":67,"guard":{"blocked":false,"reasons":[],"probs":{"claims_work_done_unverified":0.04,"promises_… |

Agent's own account of its actions (from the structured result):

- `get_ticket_context` - Loaded the ticket context -> Stage is intake. The CRM has no approval record, no holds and no profile facts.
- `read_attachment` - Read glazing-invoice.pdf -> Ref NBL-013-INV-09, dated 10 Sep 2025, correct property, 'Supply and fit 1 pane of glass to the kitchen glazing'. Amount blank; no VAT, work date or billed-to party.
- `recall_lessons` - Looked for team lessons on invoice problems -> No lessons found
- `search_case` - Searched the case for 'fitted' to find any completion evidence -> 0 matches
- `move_stage` (FAILED) - Tried to move the stage forward to works to reflect the approved, ordered job -> Refused: the CRM has no structured landlord approval on record
- `send_message` - Emailed the contractor asking for the invoice amount with a net/VAT breakdown and the fitting date -> Queued (message 65)
- `send_message` - Emailed the tenant asking whether the pane has been fitted and the misting, water and cold have stopped -> Queued (message 66)
- `send_message` - Emailed the landlord that the invoice is on hold pending the amount and completion confirmation -> Queued (message 67)
- `place_hold` - Put the ticket on hold waiting for the contractor and tenant answers -> Hold 269, follow-up in 3 days
- `add_profile_fact` - Recorded on the landlord's profile his conditional approval: £180 total -> Fact 99
- `add_profile_fact` - Recorded that there are pets at the property -> Fact 100
- `add_profile_fact` - Recorded that the tenant wants to be present for visits -> Fact 101
- `add_profile_fact` - Recorded a reliability note on the contractor -> Fact 102

## Approvals

| Party | Status | Channel |
|---|---|---|
| Orren Vale (Landlord) | granted (conditional on £180 total), from events 010/012; not recorded as a structured CRM approval | email |

## Escalation & handover

- Escalation needed: **no**
- Reason: The contractor and tenant can answer what is missing (amount and completion). Nothing on the invoice conflicts with the approval yet.
- Recommendation: Escalate if the contractor's amount is above £180, the tenant says the work hasn't been done, or there's still no reply after a second follow-up.

## What could not be verified

- Whether the glass was fitted, and when
- The invoice amount and VAT
- Whether the landlord replied separately to the confirmation request in event 011 (only the agency note in event 012 is visible)
- Whether the misting, water and cold problem is resolved, and whether there's wider damp

## What failed

- Tool `move_stage` failed: Move to 'works' refused: No landlord approval or standing authority is on record for this ticket. Request approval with request_landlord_approval (or record the landlord's clear answer with record_approval_response) before assigning a contractor or moving the job into scheduling, works or close-out.
- Agent reported: move_stage to works was refused because the CRM has no structured approval record. The stage stays at intake, behind the real position.

## Risks & red flags

- The invoice was issued with no amount and no visit on record
- The stage was moved to awaiting post-visit documents without any evidence of a visit (event 022)
- The tenant's damp and cold concern was never assessed (event 005)
- The CRM stage is behind the case because the approval isn't recorded in structured form

## Final result / next follow-up

- Final status: On hold (hold 269) waiting for the contractor's invoice amount and fitting date and the tenant's confirmation. The stage is still intake.
- Next follow-up: In 3 days (hold 269) - Chase Clearfirth for the amount and fitting date and check the tenant's reply. If the amount is £180 or less and the work is confirmed, forward the invoice to the landlord and move to close-out. Otherwise escalate.
- Confidence: 0.8

## Run metadata

- Case folder: `013`
- Session id: wrun_01M4K78C4STD1Q8DH8QS2QFPQK
- Started: 2026-10-10T15:35:11.140Z  Finished: 2026-10-10T15:36:11.109Z  Duration: 60.0s
- Events recorded: 367
- Model(s): anthropic/claude-opus-5.5
- Tokens: in 169663 / out 5884; cost: not reported
