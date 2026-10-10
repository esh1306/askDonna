# Case PM042-2 - Answer

## Decision

**request_info**

## Summary

Lantern Services has sent a £75.11 invoice, but nothing on file shows the engineer visited or fixed the washing machine. The day before, the contractor (Harper) phoned asking for a callback to schedule his visit. I haven't passed the invoice on. Instead I asked the contractor for a job report and an itemised invoice copy, and asked the tenant whether the visit happened and the machine now heats. The case is on hold with a 3-day follow-up.

## Judgement

- **Case type:** maintenance
- **Why this decision:** The landlord approved the engineer visit with no cost limit (event 008, approval 39). An invoice is now in (event 024), but there's no report of the visit or the outcome. Event 022 (27/02) suggests the visit hadn't happened yet: Harper asked for a callback to schedule it. The visit dates on file also disagree (event 016 says Tuesday 1pm, events 017–019 say 23/02 at 3:25pm). Paying for unconfirmed work would break the rule against acting on invoices that don't match the job. The contractor and tenant can both clear this up, so I asked them rather than escalating.

| Alternative considered | Why not |
|---|---|
| Forward the invoice to the landlord or pass it for payment | Nothing confirms the work was done, event 022 suggests no visit yet, and the invoice document isn't visible. |
| Escalate to a human now | The contractor and tenant can answer this directly. Escalate if they don't reply or the answers don't match. |
| Do nothing and keep waiting on the invoice hold | The invoice has arrived but can't be checked. Without these questions the job would stall. |

**Checks performed before acting**

- Approval 39: approved, no amount (event 008)
- Invoice: only an email summary in event 024. No attachment on the ticket, so the amount, payee and address on the invoice can't be checked
- Completion: no work report. Event 020 says 'no work results'; event 022 shows the contractor still trying to schedule
- Visit dates: event 016 (Tuesday 1pm) doesn't match events 017–019 (23/02 3:25pm, recorded after that time had passed)
- Invoice due date of 22 July 2026 looks unusual
- Property history: ticket 76 (R/PM042-1) has the same washing machine fault and is still open at landlord approval, so it may be a duplicate
- classify_reply: invoice intent 0.99, autonomy auto

**Assumptions**

- 'Harper' in event 022 is the Lantern Services engineer
- £75.11 is the call-out/repair charge for this job

## Actions taken

| # | Tool | Input (gist) | Result | Output (gist) |
|---|---|---|---|---|
| 1 | `get_ticket_context` | {"ticket_id":77} | ok | {"ok":true,"ticket":{"id":77,"case_ref":"R/PM042-2","property_id":56,"tenant_id":190,"landlord_id":191,"contractor_id":… |
| 2 | `classify_reply` | {"ticket_id":77,"text":"The email provides details about an invoice from Lantern Services for GBP 75.11, due by July 22, 2026, and offers o… | ok | {"autonomy":"auto","intent":"invoice","intent_probs":{"quote_or_estimate":0,"invoice":0.99,"completion_report":0,"sched… |
| 3 | `search_case` | {"ticket_id":77,"query":"invoice"} | ok | {"query":"invoice","matches":2,"events":[{"id":1125,"ticket_id":77,"ts":"2024-02-27T01:17:34Z","kind":"hold","direction… |
| 4 | `send_message` | {"ticket_id":77,"to":"contractor","channel":"email","subject":"Flat 20, 120 Alder Lane – washing machine repair (ref NBL-042 / R/PM042-2) –… | ok | {"ok":true,"message_id":101,"guard":{"blocked":false,"reasons":[],"probs":{"claims_work_done_unverified":0.24,"promises… |
| 5 | `send_message` | {"ticket_id":77,"to":"tenant","channel":"email","subject":"Flat 20, 120 Alder Lane – washing machine (ref NBL-042)","body":"Dear Noah,\n\nW… | ok | {"ok":true,"message_id":102,"guard":{"blocked":false,"reasons":[],"probs":{"claims_work_done_unverified":0.12,"promises… |
| 6 | `place_hold` | {"ticket_id":77,"reason":"Invoice £75.11 received (event 024) but no confirmation of attendance/completion; event 022 shows contractor stil… | ok | {"ok":true,"hold_id":187} |
| 7 | `add_profile_fact` | {"entity_type":"contact","entity_id":192,"key":"invoice_received_without_job_report","value":"Lantern Services invoiced £75.11 on R/PM042-2… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":113,"entity_type":"contact","entity_id":192,"key":"invoice_r… |

Agent's own account of its actions (from the structured result):

- `get_ticket_context` - Loaded the ticket context -> Stage: works. Approval 39 approved with no amount. No open holds. No attachments. Related ticket 76 still open
- `classify_reply` - Classified the contractor's invoice email -> Invoice intent 0.99, autonomy auto, needs human response 0.41
- `search_case` - Searched the case for 'invoice' -> Only events 021 (hold waiting on invoice) and 024 (invoice email)
- `send_message` - Emailed the contractor asking for the visit date, findings and work done, and an itemised invoice PDF; asked them to contact the tenant if the visit hasn't happened -> Sent, message 101
- `send_message` - Emailed the tenant asking whether the engineer has visited and the machine now heats; said we'll follow up within 3 working days -> Sent, message 102
- `place_hold` - Put the ticket on hold waiting on the contractor, follow-up in 3 days -> Hold 187
- `add_profile_fact` - Noted on the contractor's profile that they invoiced without a job report -> Fact 113

## Approvals

| Party | Status | Channel |
|---|---|---|
| Landlord (Mercer) | granted (no cost limit given) | email |

## Escalation & handover

- Escalation needed: **no**
- Reason: The contractor and tenant can resolve this. Escalate if they don't reply by the follow-up date or if their answers conflict.
- Recommendation: At the follow-up: if the contractor confirms attendance and the repair, the tenant agrees, and the invoice copy matches (Lantern Services, this property, £75.11), move to closeout and send the invoice to the landlord. Otherwise escalate the invoice/work mismatch. Separately, check whether ticket 76 is a duplicate.

## What could not be verified

- Whether the engineer has visited and whether the repair was done
- What the invoice contains: the document isn't visible, only an email summary
- The actual visit date: event 016 and events 017–019 disagree
- The invoice due date of 22 July 2026

## What failed

_No failures recorded._

## Risks & red flags

- Invoice arrived with no evidence the work was done, and a scheduling call the day before suggests no visit yet
- Invoice due date (22 July 2026) looks unusual
- Earlier messages to the contractor and tenant included a phone number with an 'enter this code' instruction. No codes were recorded here
- Ticket 76 may be a duplicate and is still open at landlord approval

## Final result / next follow-up

- Final status: Works stage, on hold (hold 187) waiting on the contractor's job report and invoice copy, and the tenant's confirmation
- Next follow-up: In 3 days (hold 187) - Chase Lantern Services for the job report and invoice PDF, and the tenant for confirmation. Close out or escalate depending on what comes back.
- Confidence: 0.78

## Run metadata

- Case folder: `C:\Users\sahid\Documents\Projects\Hackathons\DwellyHack\dwelly-agent\data\practice\cases\PM042-2`
- Session id: wrun_01M4JYF8EHM86DA1TZQ07VNYT3
- Started: 2026-10-10T13:01:39.583Z  Finished: 2026-10-10T13:02:22.435Z  Duration: 42.9s
- Events recorded: 255
- Model(s): anthropic/claude-opus-5.5
- Tokens: in 112822 / out 4521; cost: not reported
