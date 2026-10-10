# Case PM042-2 - Answer

## Decision

**request_info**

## Summary

Lantern Services has sent a £75.11 invoice (event 024), but nothing on file shows the work was done. The day before, on 27 Feb, the contractor (Harper) was still calling the tenant to arrange a visit (event 022). The invoice document isn't on the job either. So I haven't forwarded it to the landlord or moved the job to close-out. I've asked Lantern Services what happened at the visit and for the invoice PDF, asked the tenant whether the engineer has been, and put the job on hold with a follow-up in 2 days.

## Judgement

- **Case type:** maintenance
- **Why this decision:** The landlord approved an engineer visit with no cost cap (event 008, approval 55, no amount). An invoice can only go to the landlord once the work is confirmed. Here the records point the other way: the visit slot of 23/02 15:25 (event 017) is earlier than the scheduling calls that evening (events 015–016). On 26 Feb the system flagged that no work results had come back (event 020). On 27 Feb the contractor was still asking to schedule (event 022). Following lessons #19 and #32, I'm not assuming the work was done and am chasing the contractor for the outcome. Lesson #18 (treating the invoice note as the completion record) doesn't fit, because the invoice email describes no findings, fix or test. Lesson #3 (forward the invoice and close) assumes the job is complete, which isn't confirmed here.

| Alternative considered | Why not |
|---|---|
| Forward the invoice to the landlord and move to close-out (lesson #3) | Nothing confirms the work was done, the invoice document isn't on the job, and event 022 suggests the visit may not have happened yet. |
| Escalate to a human | The contractor and tenant can settle this between them. The amount is small and the attendance was approved. Escalate only if the replies conflict or don't come. |
| Do nothing / return to auto mode (lesson #1) | An invoice is waiting with no completion record, so someone has to chase actively. |

**Checks performed before acting**

- Approval 55 status: approved by email, no amount, for an engineer to attend
- Invoice amount £75.11 against approval: no approved figure to compare with; plausible for an attendance
- Payee Lantern Services matches the contractor assigned in events 012/013
- Attachments: none visible, invoice PDF not on the job
- Completion evidence: none; event 022 shows the contractor still trying to schedule on 27 Feb
- Dates: visit date in event 017 is earlier than the scheduling calls; invoice due date 22 July 2026 looks unusual
- Duplicate: property has another open ticket R/PM042-1 for the same washing machine, at landlord_approval
- classify_reply: invoice 0.99, autonomy auto, needs_human_response 0.28

**Assumptions**

- 'Harper' in event 022 is the Lantern Services engineer
- The 'Tuesday 1pm' in event 016 is the actual planned visit (27 Feb), not the 23/02 slot in event 017

## Actions taken

| # | Tool | Input (gist) | Result | Output (gist) |
|---|---|---|---|---|
| 1 | `get_ticket_context` | {"ticket_id":98} | ok | {"ok":true,"ticket":{"id":98,"case_ref":"R/PM042-2","property_id":56,"tenant_id":242,"landlord_id":243,"contractor_id":… |
| 2 | `classify_reply` | {"ticket_id":98,"text":"The email provides details about an invoice from Lantern Services for GBP 75.11, due by July 22, 2026, and offers o… | ok | {"autonomy":"auto","intent":"invoice","intent_probs":{"quote_or_estimate":0,"invoice":0.99,"completion_report":0,"sched… |
| 3 | `recall_lessons` | {"ticket_id":98,"situation_text":"Contractor sent invoice £75.11 with no completion report; the day before, contractor still calling tenant… | ok | {"ok":true,"count":5,"lessons":[{"id":32,"situation":"A confirmed repair visit has taken place, but the agency has rece… |
| 4 | `send_message` | {"ticket_id":98,"to":"contractor","channel":"email","subject":"Washing machine repair – Flat 20, 120 Alder Lane, Cedarford ZZ9 0ZZ – Ref R/… | ok | {"ok":true,"message_id":127,"guard":{"blocked":false,"reasons":[],"probs":{"claims_work_done_unverified":0.14,"promises… |
| 5 | `send_message` | {"ticket_id":98,"to":"tenant","channel":"email","subject":"Washing machine repair – Flat 20, 120 Alder Lane – Ref R/PM042-2 (NBL-042)","bod… | ok | {"ok":true,"message_id":126,"guard":{"blocked":false,"reasons":[],"probs":{"claims_work_done_unverified":0.23,"promises… |
| 6 | `place_hold` | {"ticket_id":98,"reason":"Invoice £75.11 received (event 024) but no completion report and contractor was still seeking to schedule visit o… | ok | {"ok":true,"hold_id":248} |
| 7 | `add_profile_fact` | {"entity_type":"contact","entity_id":244,"key":"invoiced_before_completion_report","value":"Sent invoice GBP 75.11 on R/PM042-2 without a c… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":141,"entity_type":"contact","entity_id":244,"key":"invoiced_… |

Agent's own account of its actions (from the structured result):

- `get_ticket_context` - Loaded the ticket, profiles, events and approvals -> Approval 55 approved (no amount); no attachments; no open holds; duplicate ticket R/PM042-1 open
- `classify_reply` - Classified the contractor's invoice email (event 024) -> intent invoice 0.99, autonomy auto
- `recall_lessons` - Looked up how the team handled invoices that arrive without completion reports -> Lessons #19 and #32 followed (chase the contractor for the outcome); #3 and #18 not applicable
- `send_message` - Emailed Lantern Services asking for the attendance date, findings and work done, whether more work is needed, and the invoice PDF with the job reference -> Queued, message 127; guard passed
- `send_message` - Emailed the tenant asking whether the engineer has visited and the machine now heats; said we'll update by 1 March -> Queued, message 126; guard passed
- `place_hold` - Put the job on hold waiting on the contractor, follow-up in 2 days -> hold_id 248
- `add_profile_fact` - Recorded that the contractor invoiced before any completion report -> fact 141 saved

## Approvals

| Party | Status | Channel |
|---|---|---|
| Mercer (landlord) | granted (attendance, no amount specified) – event 008 | email |

## Escalation & handover

- Escalation needed: **no**
- Reason: The contractor and tenant can resolve this; no disputed amount yet
- Recommendation: Escalate if the contractor and tenant give conflicting accounts, if the invoice turns out to be for unperformed work, or if there's no reply by the follow-up.

## What could not be verified

- Whether Lantern Services attended or did any work
- Invoice contents, line items and payee details (document not visible)
- The 22 July 2026 due date
- The actual visit date (event 017's 23/02 15:25 vs Tuesday 1pm in event 016)

## What failed

_No failures recorded._

## Risks & red flags

- Invoice arrived without a completion report, a day after the contractor was still trying to schedule the visit
- Unusual invoice due date (July 2026)
- Duplicate open ticket R/PM042-1 for the same issue at landlord_approval; it could send the landlord a second approval request or lead to a duplicate booking and should be reviewed and closed as a duplicate
- Event 018 told the contractor 'Pets: multiple tenants', but the property facts record no pets

## Final result / next follow-up

- Final status: works – on hold (hold 248) waiting on contractor's completion details and invoice PDF
- Next follow-up: 2024-03-01 - Check for replies from Lantern Services and the tenant. If the work is confirmed and the invoice matches, forward it to the landlord and move to close-out. If not, chase again or escalate.
- Confidence: 0.8

## Run metadata

- Case folder: `C:\Users\sahid\Documents\Projects\Hackathons\DwellyHack\dwelly-agent\data\practice\cases\PM042-2`
- Session id: wrun_01M4JZX7D4SW1PF4EF17ZNZ3YM
- Started: 2026-10-10T13:26:45.614Z  Finished: 2026-10-10T13:27:39.637Z  Duration: 54.0s
- Events recorded: 283
- Model(s): anthropic/claude-opus-5.5
- Tokens: in 122065 / out 5072; cost: not reported
