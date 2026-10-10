# Case 15 - Answer

## Decision

**escalate**

## Summary

The gas safety certificate (CP12) at 22 Alder Way runs out in 9 days (19 Oct 2026). Nothing is booked, and the landlord hasn't answered two emails. I've queued a phone call asking him to approve the check (approval 36, about £85), emailed the tenant with an update and gas-smell safety advice, and moved the ticket to landlord_approval. I've also escalated it to a person at high priority, because a legal certificate is close to running out with no booking. The tenant also says she has never been sent a gas certificate. I put a 2-day hold on the ticket and recorded the key facts.

## Judgement

- **Case type:** maintenance_admin
- **Why this decision:** The diary alert (event 004) says the CP12 expires 19 Oct with no booking. The landlord didn't reply to the 22 Sep and 2 Oct emails (events 001, 002). The compliance rules say to escalate when a certificate expires within 14 days with no booking, or when a landlord hasn't answered a compliance request after a follow-up. Both apply. Before escalating I tried a different channel: a phone call to the landlord on the number on file. The tenant's claim that she has never had a certificate (event 003) suggests a possible earlier breach, which needs agency judgement. I followed lesson #28 (a stalled approval goes to a person for a direct chase). I didn't follow lessons #15/#23 (keep waiting) because this is a legal deadline, not a routine repair.

| Alternative considered | Why not |
|---|---|
| Book a Gas Safe engineer now without approval | There is no pre-approved spend limit or standing authority on record. This isn't an emergency either: no gas smell or fault was reported. Whether the agency can book statutory checks without approval depends on the management agreement, so a person should decide that. |
| Send a third email and wait | Two emails have already gone unanswered and only 9 days are left. Another email alone isn't enough. |
| Escalate only, with no contact | The tenant asked a direct question and was waiting for an answer. A phone call to the landlord is a reasonable next step the system can take. |

**Checks performed before acting**

- Ticket context: no holds, no approvals, no contractor, no property history, no attachments
- No certificate document on file; the expiry date comes only from the diary alert
- No landlord reply after events 001 and 002
- Safety: tenant reported no gas smell or fault
- Two outbound-guard rejections fixed: removed wording that suggested work was done, and removed a specific date

**Assumptions**

- The landlord phone number in event 004 is correct
- The £85 estimate from event 001 is still current

## Actions taken

| # | Tool | Input (gist) | Result | Output (gist) |
|---|---|---|---|---|
| 1 | `get_ticket_context` | {"ticket_id":72} | ok | {"ok":true,"ticket":{"id":72,"case_ref":"R/15","property_id":67,"tenant_id":186,"landlord_id":192,"contractor_id":null,… |
| 2 | `recall_lessons` | {"ticket_id":72,"situation_text":"Gas safety certificate expires in 9 days, landlord unresponsive to two email approval requests; tenant sa… | ok | {"ok":true,"count":5,"lessons":[{"id":15,"situation":"A routine appliance repair request is waiting on landlord approva… |
| 3 | `request_landlord_approval` | {"ticket_id":72,"summary":"Annual gas safety check (CP12) at 22 Alder Way expires 19 October 2026; approval needed to book a Gas Safe regis… | ok | {"ok":true,"approval_id":36,"message_id":28,"landlord":"Mr Dunmore","guard":{"blocked":false,"reasons":[],"probs":{"cla… |
| 4 | `send_message` | {"ticket_id":72,"to":"tenant","channel":"email","subject":"Gas safety check – 22 Alder Way (ref R/15)","body":"Dear Ms Shah,\n\nThank you f… | FAILED: Blocked by Jev outbound guard (message). claims_work_done_unverified (p=0.79): claims work is done/booked/paid/approved… |  |
| 5 | `send_message` | {"ticket_id":72,"to":"tenant","channel":"email","subject":"Gas safety check – 22 Alder Way (ref R/15)","body":"Dear Ms Shah,\n\nThank you f… | FAILED: Blocked by Jev outbound guard (message). promises_specific_date_unconfirmed (p=0.73): promises a specific date/time not… |  |
| 6 | `send_message` | {"ticket_id":72,"to":"tenant","channel":"email","subject":"Gas safety check – 22 Alder Way (ref R/15)","body":"Dear Ms Shah,\n\nThank you f… | ok | {"ok":true,"message_id":31,"guard":{"blocked":false,"reasons":[],"probs":{"claims_work_done_unverified":0.04,"promises_… |
| 7 | `move_stage` | {"ticket_id":72,"to":"landlord_approval","reason":"Approval for CP12 gas safety check (est. £85) requested from landlord by call (approval … | ok | {"ok":true,"from":"intake","to":"landlord_approval","status":"open"} |
| 8 | `escalate_to_human` | {"ticket_id":72,"reason":"CP12 at a tenanted property expires in 9 days (19 Oct 2026), no booking, landlord silent after two email requests… | ok | {"ok":true,"queue_id":18} |
| 9 | `place_hold` | {"ticket_id":72,"reason":"Waiting for landlord decision on CP12 gas safety check (approval 36, voice call). Certificate expires 19 Oct 2026… | ok | {"ok":true,"hold_id":254} |
| 10 | `add_profile_fact` | {"entity_type":"property","entity_id":67,"key":"gas_safety_expiry","value":"2026-10-19 (from compliance diary; certificate document not on … | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":57,"entity_type":"property","entity_id":67,"key":"gas_safety… |
| 11 | `add_profile_fact` | {"entity_type":"contact","entity_id":192,"key":"email_responsiveness","value":"no reply to two compliance approval emails (22 Sep, 2 Oct 20… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":58,"entity_type":"contact","entity_id":192,"key":"email_resp… |
| 12 | `add_profile_fact` | {"entity_type":"contact","entity_id":186,"key":"access_availability","value":"home most afternoons","source_ref":"event 003 (tenant email)"… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":59,"entity_type":"contact","entity_id":186,"key":"access_ava… |
| 13 | `add_profile_fact` | {"entity_type":"contact","entity_id":186,"key":"gas_certificate_received","value":"tenant says she has never been sent a gas certificate in… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":60,"entity_type":"contact","entity_id":186,"key":"gas_certif… |

Agent's own account of its actions (from the structured result):

- `request_landlord_approval` - Queued a phone call to Mr Dunmore asking him to approve the CP12 gas safety check (est. £85) -> approval_id 36 created, call queued
- `send_message` - Emailed the tenant: acknowledged her question, said an engineer is being arranged with the landlord, noted her afternoon availability, said we're looking into past certificates, and gave gas-smell safety advice -> Sent on the 3rd attempt (message 31) after 2 guard rejections were fixed
- `move_stage` - Moved the ticket from intake to landlord_approval -> ok
- `escalate_to_human` - High-priority handover: certificate expires within 14 days, no booking, landlord not responding, possible earlier certificate gap -> queue_id 18
- `place_hold` - Hold while waiting for the landlord's decision, follow-up in 2 days -> hold_id 254
- `add_profile_fact` - Recorded gas_safety_expiry, the landlord's lack of email replies, the tenant's afternoon availability, and her claim about never receiving a certificate -> facts 57-60 recorded, no conflicts

## Approvals

| Party | Status | Channel |
|---|---|---|
| Mr Dunmore (landlord) | requested | call |

## Escalation & handover

- Escalation needed: **yes**
- Reason: The CP12 expires in 9 days with no booking, the landlord hasn't responded to two requests, and the tenant says she has never been given a gas certificate.
- Handover summary: 22 Alder Way R/15: the CP12 expires 19 Oct. The landlord ignored emails on 22 Sep and 2 Oct. A phone call for approval is now queued (approval 36, £85). The tenant has been updated; she is home afternoons and says she was never given a certificate. Hold 254 is set for 12 Oct.
- Recommendation: If there's no decision by 13 Oct, the property manager should phone the landlord directly and send written notice. Check the management agreement for authority to book statutory gas checks, and book a Gas Safe engineer before 19 Oct if allowed. Find earlier CP12s and send copies to the tenant, or review a possible breach if none exist.

## What could not be verified

- The CP12 expiry date of 19 Oct 2026 (no certificate document on file)
- Whether earlier gas safety certificates were issued or given to the tenant
- Whether the landlord's phone number is correct
- Whether the £85 estimate is current

## What failed

- Tool `send_message` failed: Blocked by Jev outbound guard (message). claims_work_done_unverified (p=0.79): claims work is done/booked/paid/approved without evidence in the records: rewrite without claiming completion; say only what is confirmed. Rewrite the text to fix this and retry, or escalate_to_human if you cannot.
- Tool `send_message` failed: Blocked by Jev outbound guard (message). promises_specific_date_unconfirmed (p=0.73): promises a specific date/time not confirmed in the records: ask for availability or say it is to be confirmed. Rewrite the text to fix this and retry, or escalate_to_human if you cannot.
- Agent reported: The first two tenant messages were blocked by the outbound guard (wording suggested work was done; a specific date was promised). Fixed and sent.

## Risks & red flags

- A legal gas safety certificate for a tenanted property may run out on 19 Oct 2026
- The tenant reports never receiving a gas certificate in two years, which suggests a possible earlier breach
- The landlord isn't responding

## Final result / next follow-up

- Final status: landlord_approval stage, on hold waiting for landlord (hold 254), escalated high (queue 18)
- Next follow-up: 2026-10-12 - Check the outcome of the landlord call (approval 36). If approved, find and assign a Gas Safe engineer and offer the tenant afternoon slots. If there's still no answer, the property manager phones the landlord directly before the 19 Oct expiry.
- Confidence: 0.82

## Run metadata

- Case folder: `data/hardcases/15`
- Session id: wrun_01M4K15ERXHBAPTRXKYVMPKR62
- Started: 2026-10-10T13:48:43.943Z  Finished: 2026-10-10T13:49:51.335Z  Duration: 67.4s
- Events recorded: 545
- Model(s): anthropic/claude-opus-5.5
- Tokens: in 116508 / out 6859; cost: not reported
