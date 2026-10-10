# Case 14 - Answer

## Decision

**escalate**

## Summary

I escalated this to a human at high priority and stopped payment on both invoices. There are two invoices for job HC-14-310. TS-0881 is from Thermo-Serve Ltd for £210, which matches the approved quote. TS-0882 is made out to a different payee, H&S Domestic Services, for £324. That is £114 over the approval and adds 2 hours of labour nobody approved. I've asked Thermo-Serve which invoice is valid, told the landlord to hold payment, and set a 3-day follow-up.

## Judgement

- **Case type:** maintenance_admin
- **Why this decision:** I can't send TS-0882 to the landlord for payment: the payee, the amount and the scope all differ from the approval in the office notes. TS-0881 matches, but it arrived in the same email, so it could be a duplicate. It's safer to confirm which one is valid before the landlord pays anything.

| Alternative considered | Why not |
|---|---|
| Send TS-0881 to the landlord now for payment | If TS-0882 is meant to replace it, or the mailbox has been compromised, she could pay the wrong invoice or pay twice. Confirming first costs little. |
| Ask the landlord to approve the extra £114 | We don't yet know whether that charge is genuine or who H&S Domestic Services is. |

**Checks performed before acting**

- Checked the amounts on each invoice against the approved £210
- Checked each payee against the contractor on record
- Checked the work on each invoice against the approved scope
- Checked the property and the job reference
- Checked who pays the contractor (the landlord does)

**Assumptions**

- The office notes are accurate about the approval and about the job being finished

## Actions taken

| # | Tool | Input (gist) | Result | Output (gist) |
|---|---|---|---|---|
| 1 | `get_ticket_context` | {"ticket_id":74} | ok | {"ok":true,"ticket":{"id":74,"case_ref":"R/14","property_id":66,"tenant_id":193,"landlord_id":195,"contractor_id":196,"… |
| 2 | `recall_lessons` | {"ticket_id":74,"situation_text":"Two invoices for same job: one matches approved £210 from contractor of record; second from different pay… | ok | {"ok":true,"count":5,"lessons":[{"id":3,"situation":"A contractor who completed an approved cleaning job emails to say … |
| 3 | `classify_reply` | {"ticket_id":74,"text":"Invoice attached, please pay. [Two invoices: TS-0881 Thermo-Serve Ltd £210 total; TS-0882 payee H&S Domestic Servic… | ok | {"autonomy":"review","intent":"invoice","intent_probs":{"quote_or_estimate":0,"invoice":1,"completion_report":0,"schedu… |
| 4 | `escalate_to_human` | {"ticket_id":74,"reason":"Second invoice for job HC-14-310 names a different payee (H&S Domestic Services) and is £114 above the approved £… | ok | {"ok":true,"queue_id":17} |
| 5 | `send_message` | {"ticket_id":74,"to":"contractor","channel":"email","subject":"Invoices TS-0881 / TS-0882 – job HC-14-310, 19 Coppice Road, Ludlow Heath ZZ… | ok | {"ok":true,"message_id":33,"guard":{"blocked":false,"reasons":[],"probs":{"claims_work_done_unverified":0.63,"promises_… |
| 6 | `send_message` | {"ticket_id":74,"to":"landlord","channel":"email","subject":"Please hold payment – invoices for job HC-14-310, 19 Coppice Road, Ludlow Heat… | FAILED: Blocked by Jev outbound guard (message). claims_work_done_unverified (p=0.85): claims work is done/booked/paid/approved… |  |
| 7 | `add_profile_fact` | {"entity_type":"contact","entity_id":195,"key":"pays_contractor_directly","value":"true – landlord pays invoices herself after agency check… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":54,"entity_type":"contact","entity_id":195,"key":"pays_contr… |
| 8 | `place_hold` | {"ticket_id":74,"reason":"Awaiting Thermo-Serve Ltd confirmation of which invoice (TS-0881 £210 vs TS-0882 £324, payee H&S Domestic Service… | ok | {"ok":true,"hold_id":252} |
| 9 | `send_message` | {"ticket_id":74,"to":"landlord","channel":"email","subject":"Please hold payment – invoices for job HC-14-310, 19 Coppice Road, Ludlow Heat… | ok | {"ok":true,"message_id":36,"guard":{"blocked":false,"reasons":[],"probs":{"claims_work_done_unverified":0.22,"promises_… |

Agent's own account of its actions (from the structured result):

- `get_ticket_context` - Loaded the ticket, the property facts and the contact profiles -> No events and no approval record in the CRM. Earlier facts 46 and 50 record the £210 approval and the invoice discrepancy. Nothing was open in the human queue.
- `recall_lessons` - Looked for lessons on handling invoices -> Lessons #3 and #18 say to forward an invoice to the landlord, but they assume the invoice matches. I didn't follow them because TS-0882 does not match.
- `classify_reply` - Classified the contractor's invoice email -> Intent: invoice. Flagged for review (needs_human_response 0.92).
- `escalate_to_human` - Escalated the mismatched invoice at high priority -> Queue item 17
- `send_message` - Emailed Thermo-Serve asking which invoice is valid and who H&S Domestic Services is -> Sent (message 33)
- `send_message` (FAILED) - First email to the landlord asking her to hold payment -> Blocked by the outbound guard for claiming work was done or approved without evidence
- `send_message` - Rewrote the landlord email and sent it again: hold payment, what doesn't match, update expected within 3 working days -> Sent (message 36)
- `add_profile_fact` - Recorded that the landlord pays contractors directly -> Fact 54
- `place_hold` - Placed a hold while we wait for the contractor's answer -> Hold 252, follow-up in 3 days

## Approvals

| Party | Status | Channel |
|---|---|---|
| Ms Ferrer (landlord) | granted per office notes (Thermo-Serve Ltd, £210). The CRM has no approval record. The extra £114 is not approved. | unknown (office note) |

## Escalation & handover

- Escalation needed: **yes**
- Reason: Invoice TS-0882 is made out to H&S Domestic Services, not Thermo-Serve, and is £114 over the approved £210. The landlord pays these herself.
- Handover summary: Job HC-14-310 at 19 Coppice Road is finished. We have two invoices for it: TS-0881 from Thermo-Serve for £210, which matches the approval, and TS-0882 to H&S Domestic Services for £324, which includes 2 hours of extra labour. I've asked Thermo-Serve which is valid and told the landlord to hold payment.
- Recommendation: Phone Thermo-Serve on the number already on file, not one from the invoice email, to confirm which invoice is genuine. If they confirm TS-0881 only, send it to the landlord for payment and move the job to close-out. Any extra charge would need the landlord's separate approval.

## What could not be verified

- Who H&S Domestic Services is and how they relate to Thermo-Serve
- Whether TS-0882 replaces TS-0881 or is charged on top of it
- Whether the 2 hours of extra labour on TS-0882 was actually done
- How the landlord gave her approval (there is no approval record in the CRM)

## What failed

- Tool `send_message` failed: Blocked by Jev outbound guard (message). claims_work_done_unverified (p=0.85): claims work is done/booked/paid/approved without evidence in the records: rewrite without claiming completion; say only what is confirmed. Rewrite the text to fix this and retry, or escalate_to_human if you cannot.
- Agent reported: The first landlord email was blocked by the outbound guard. I rewrote it and the second version was sent.

## Risks & red flags

- The payee on TS-0882 is not the contractor on record. A change of payee on an invoice from the usual email address can be a sign of payment diversion.
- Both invoices use the same job reference, so the job could be billed twice.

## Final result / next follow-up

- Final status: The ticket is still at intake and on hold waiting for the contractor (hold 252). Human queue item 17 is open. Both invoices are on hold, not cleared for payment.
- Next follow-up: in 3 days - Chase Thermo-Serve if they haven't replied, then update the landlord
- Confidence: 0.85

## Run metadata

- Case folder: `data/hardcases/14`
- Session id: wrun_01M4K15ESY4HW9S392BETB9TEP
- Started: 2026-10-10T13:48:43.943Z  Finished: 2026-10-10T13:49:43.566Z  Duration: 59.6s
- Events recorded: 514
- Model(s): anthropic/claude-opus-5.5
- Tokens: in 131264 / out 6236; cost: not reported
