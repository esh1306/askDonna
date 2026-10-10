# Case 009 - Answer

## Decision

**escalate**

## Summary

The tenant says the bedroom window work, which the landlord arranged himself, is done, and the contractor will send a report. I've asked the landlord to confirm it's complete and send the report, and set a 3-day hold. The gas safety record the landlord forwarded is for a different property (8 Thistledown Mews), and the EICR he says he sent isn't visible on the file. I've asked him for the correct documents and passed the compliance gap to the human queue at normal priority.

## Judgement

- **Case type:** mixed
- **Why this decision:** Event 20: the tenant reports the work done, and the landlord's own contractor (Richard) is to send a report. The agency committed no spend and holds no approval, so we only need the landlord's confirmation and the report to close the window job. Event 19: the attached gas safety record is for 8 Thistledown Mews, not this property, and has no credentials or next-due date. Event 11: the EICR is not visible on the file. A compliance gap with an unknown certificate status needs agency judgement, so it went to the queue. The landlord was told directly as well.

| Alternative considered | Why not |
|---|---|
| Close the ticket now on the tenant's word | No report or landlord confirmation yet, and 'all jobs' is vague. A short hold to get confirmation costs little. |
| Move the stage to closeout | The agency has no approval or works on record, so the CRM would refuse the move. The landlord ran the job himself. |
| Treat the gas record as valid | It names another property and has no Gas Safe number or next-due date. |
| Message the tenant again | The tenant's message already answered our question. The next step sits with the landlord. |

**Checks performed before acting**

- Read forwarded-document.pdf: the property address doesn't match and engineer credentials are missing
- Searched for 'Richard' and 'electrical' in the event history
- No approvals, holds or property history on file
- Classified the tenant reply: confirms_fixed 0.99, autonomy review
- Recalled lessons: none found

**Assumptions**

- The landlord arranged and pays for the window contractor himself (events 14, 18, 20)

## Actions taken

| # | Tool | Input (gist) | Result | Output (gist) |
|---|---|---|---|---|
| 1 | `get_ticket_context` | {"ticket_id":83} | ok | {"ok":true,"ticket":{"id":83,"case_ref":"R/009","property_id":77,"tenant_id":222,"landlord_id":223,"contractor_id":null… |
| 2 | `read_attachment` | {"ticket_id":83,"name":"forwarded-document.pdf"} | ok | {"ok":true,"name":"forwarded-document.pdf","text":"# Transcription\n\n**Document type:** Single-page document, \"Landlo… |
| 3 | `classify_reply` | {"ticket_id":83,"text":"All jobs was done. I did not notify the agency because Richard, the contractor, said he would send a report.","send… | ok | {"autonomy":"review","intent":"confirms_fixed","intent_probs":{"confirms_fixed":0.99,"still_broken":0,"access_or_availa… |
| 4 | `recall_lessons` | {"ticket_id":83,"situation_text":"Landlord arranged his own contractor for a bedroom window repair; tenant now reports all jobs done and co… | ok | {"ok":true,"count":0,"lessons":[]} |
| 5 | `search_case` | {"ticket_id":83,"query":"Richard"} | ok | {"query":"Richard","matches":1,"events":[{"id":1945,"ticket_id":83,"ts":"2025-09-10T18:20:00Z","kind":"email","directio… |
| 6 | `search_case` | {"ticket_id":83,"query":"electrical"} | ok | {"query":"electrical","matches":1,"events":[{"id":1936,"ticket_id":83,"ts":"2025-08-19T10:30:00Z","kind":"email","direc… |
| 7 | `send_message` | {"ticket_id":83,"to":"landlord","channel":"email","subject":"24 Bramblewick Lane, Alderfen – bedroom window (ref R/009) and gas safety reco… | ok | {"ok":true,"message_id":61,"guard":{"blocked":false,"reasons":[],"probs":{"claims_work_done_unverified":0.26,"promises_… |
| 8 | `place_hold` | {"ticket_id":83,"reason":"Waiting for landlord to confirm window repair complete and send contractor (Richard) report, plus the correct gas… | ok | {"ok":true,"hold_id":265} |
| 9 | `add_profile_fact` | {"entity_type":"contact","entity_id":222,"key":"contact_preference_no_unknown_calls","value":"Will not return calls from unfamiliar numbers… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":86,"entity_type":"contact","entity_id":222,"key":"contact_pr… |
| 10 | `add_profile_fact` | {"entity_type":"contact","entity_id":223,"key":"arranges_own_contractors","value":"Prefers to inspect himself and arrange his own contracto… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":87,"entity_type":"contact","entity_id":223,"key":"arranges_o… |
| 11 | `add_profile_fact` | {"entity_type":"property","entity_id":77,"key":"gas_safety_record_status","value":"No valid gas safety record on file. The record forwarded… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":88,"entity_type":"property","entity_id":77,"key":"gas_safety… |
| 12 | `escalate_to_human` | {"ticket_id":83,"reason":"The gas safety record the landlord forwarded is for a different property, so there is no valid gas certificate fo… | ok | {"ok":true,"queue_id":29} |

Agent's own account of its actions (from the structured result):

- `read_attachment` - Read the forwarded gas safety record -> Ref NBL-009-GSR-25, for 8 Thistledown Mews, Vellumby. No Gas Safe number, no expiry date, no signature.
- `classify_reply` - Classified the tenant's 10 September message -> confirms_fixed 0.99, review
- `send_message` - Emailed the landlord: confirm the window is complete and send Richard's report; flagged that the gas record is for the wrong property and asked for the correct record and the EICR -> Queued as message 61
- `place_hold` - Hold while waiting for the landlord -> Hold 265, follow up in 3 days
- `add_profile_fact` - Tenant contact preference (no unknown calls), landlord arranges his own contractors, property gas record status -> Facts 86, 87, 88 recorded
- `escalate_to_human` - Compliance gap: gas record is for the wrong property, EICR not visible -> Queue item 29

## Approvals

| Party | Status | Channel |
|---|---|---|
| Dorian Pike (Landlord) | not_needed | n/a – the landlord arranged the work himself |

## Escalation & handover

- Escalation needed: **yes**
- Reason: No valid gas safety record for this property on file; the forwarded one is for 8 Thistledown Mews, and the EICR is not visible.
- Handover summary: Window repair reported done by the tenant; landlord asked to confirm and send the report (hold 265, 3 days). The gas record forwarded in event 19 names another property and has no credentials. The EICR from event 11 is not on file.
- Recommendation: Compliance team to check the CP12 and EICR status for 24 Bramblewick Lane and chase the landlord or book a Gas Safe engineer if needed. Close the window job once the landlord confirms.

## What could not be verified

- Window repair completion: only the tenant has said so, and no report is visible yet
- Identity and details of the contractor 'Richard'
- Whether the property has gas appliances, and its current CP12 and EICR status
- What 'all jobs' covers

## What failed

_No failures recorded._

## Risks & red flags

- The gas safety record is for a different address (8 Thistledown Mews)
- The gas record has no Gas Safe registration, expiry date or signature
- The engineer's surname on the record (Voss) matches the tenant's; noted as fact only
- The EICR mentioned in event 11 is not visible on file

## Final result / next follow-up

- Final status: Stage intake; on hold waiting for the landlord (hold 265); compliance item in the human queue (29)
- Next follow-up: 2025-09-13 - Chase the landlord for window completion confirmation or Richard's report, plus the correct CP12 and the EICR
- Confidence: 0.8

## Run metadata

- Case folder: `009`
- Session id: wrun_01M4K773Q6CEE7AHCNKGXNZ5D6
- Started: 2026-10-10T15:34:29.789Z  Finished: 2026-10-10T15:35:39.957Z  Duration: 70.2s
- Events recorded: 452
- Model(s): anthropic/claude-opus-5.5
- Tokens: in 159126 / out 5954; cost: not reported
