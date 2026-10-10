# Case PM042-2 - Answer

## Decision

**request_info**

## Summary

Lantern Services has sent an invoice for £75.11 (event 024). Nothing on file shows the visit happened. The last contractor note (event 022, 27 Feb) is a request for a callback to schedule the visit, event 020 says there were no work results, and the invoice document can't be seen. I have not passed the invoice on or approved it. Instead I asked the contractor for the visit date, what was found and done, and a copy of the invoice. The ticket is on hold until they reply, with a follow-up in 2 days.

## Actions taken

| # | Tool | Input (gist) | Result | Output (gist) |
|---|---|---|---|---|
| 1 | `get_ticket_context` | {"ticket_id":42} | ok | {"ok":true,"ticket":{"id":42,"case_ref":"R/PM042-2","property_id":1,"tenant_id":98,"landlord_id":99,"contractor_id":100… |
| 2 | `classify_reply` | {"ticket_id":42,"text":"The email provides details about an invoice from Lantern Services for GBP 75.11, due by July 22, 2026, and offers o… | ok | {"autonomy":"auto","intent":"invoice","intent_probs":{"quote_or_estimate":0,"invoice":0.99,"completion_report":0,"sched… |
| 3 | `search_case` | {"ticket_id":42,"query":"invoice"} | ok | {"query":"invoice","matches":2,"events":[{"id":503,"ticket_id":42,"ts":"2024-02-27T01:17:34Z","kind":"hold","direction"… |
| 4 | `find_tickets` | {"property_address":"Flat 20, 120 Alder Lane"} | ok | {"matches":2,"tickets":[{"id":2,"case_ref":"R/PM042-1","title":"Washing Machine Repair Request","category":"Heating & H… |
| 5 | `send_message` | {"ticket_id":42,"to":"contractor","channel":"email","subject":"Invoice query – Washing Machine Repair, Flat 20, 120 Alder Lane, Cedarford Z… | ok | {"ok":true,"message_id":53,"guard":{"blocked":false,"reasons":[],"probs":{"claims_work_done_unverified":0.16,"promises_… |
| 6 | `place_hold` | {"ticket_id":42,"reason":"Invoice £75.11 received (event 024) but no visit/completion report; event 022 shows contractor still asking to sc… | ok | {"ok":true,"hold_id":109} |
| 7 | `add_profile_fact` | {"entity_type":"contact","entity_id":100,"key":"company_name","value":"Lantern Services (engineer referred to as Harper in call notes)","so… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":65,"entity_type":"contact","entity_id":100,"key":"company_na… |

Agent's own account of its actions (from the structured result):

- `get_ticket_context` - Loaded ticket, profiles, events, approvals -> Stage works; approval 22 approved with no amount; no attachments visible; no open holds
- `classify_reply` - Classified the contractor's invoice email (event 024) -> intent invoice 0.99, autonomy auto, needs_human_response 0.36
- `search_case` - Searched the case for 'invoice' -> Only event 021 (hold) and event 024; no invoice document or work report
- `find_tickets` - Checked for other tickets at the same property -> Found R/PM042-1 (ticket 2), same washing machine issue, on hold at provider_selection
- `send_message` - Emailed Lantern Services asking for the attendance date, findings and work done, and a copy of the invoice; asked them not to do further chargeable work without approval -> Sent (message 53); outbound guard did not block it
- `place_hold` - Put the ticket on hold waiting for the contractor to clarify the invoice and visit -> hold_id 109, follow-up in 2 days
- `add_profile_fact` - Recorded the contractor's company name and the engineer name seen in call notes -> fact 65 created

## Approvals

| Party | Status | Channel |
|---|---|---|
| Landlord (Mercer) | granted (to arrange an engineer; no amount set) | email |

## Escalation & handover

- Escalation needed: **no**
- Reason: The contractor can resolve the gap between the invoice and the missing proof of the visit. Escalate if they don't reply or if the invoice doesn't match.
- Recommendation: At follow-up: if the contractor confirms the visit and the invoice matches this property and the inspection, pass it on for payment. If more repair costs are proposed, ask the landlord for approval. If the contractor doesn't reply or the details conflict, escalate to a human.

## What could not be verified

- Whether the engineer has visited the property at all
- Whether the washing machine is fixed
- What the £75.11 invoice covers; the invoice document is not visible and the July 2026 due date looks unusual
- The real appointment date (23/02 3:25pm vs Tuesday 1pm)
- Washing machine make (tenant said 'Harbour Surveying')

## What failed

_No failures recorded._

## Risks & red flags

- Invoice received with no record of attendance; a scheduling callback was requested the day before
- No cost limit was approved by the landlord
- Possible duplicate ticket R/PM042-1 (ticket 2) for the same fault, left on hold; a human should check and close it if it is a duplicate
- The appointment confirmation in events 018/019 gave a time that had already passed and said 'Pets: multiple tenants', a data quality issue

## Final result / next follow-up

- Final status: works – on hold waiting for the contractor (hold 109)
- Next follow-up: 2024-03-01 - Chase Lantern Services for the visit date, report and invoice copy. If there's still no reply, escalate to a human.
- Confidence: 0.78

## Run metadata

- Case folder: `C:\Users\sahid\Documents\Projects\Hackathons\DwellyHack\dwelly-agent\data\practice\cases\PM042-2`
- Session id: wrun_01M4JWB30WRFFQ67AJV586PX9W
- Started: 2026-10-10T12:24:25.726Z  Finished: 2026-10-10T12:25:06.106Z  Duration: 40.4s
- Events recorded: 221
- Model(s): anthropic/claude-opus-5.5
- Tokens: in 103893 / out 3854; cost: not reported
