# Case 14 - Answer

## Decision

**escalate**

## Summary

Two invoices arrived for the same completed job, HC-14-310. TS-0881 (Thermo-Serve Ltd, £210) matches the landlord's approval. TS-0882 is made out to a different payee (H&S Domestic Services), is £324 (£114 over the approved £210) and adds extra labour that was never approved. I asked the landlord to hold payment on both, escalated to ops to check with Thermo-Serve directly, and placed a 3-day hold. My message to Thermo-Serve could not be sent because no contractor is recorded on the ticket.

## Judgement

- **Case type:** maintenance_admin
- **Why this decision:** The rules say never to pass on an invoice that doesn't match the approved quote or the contractor of record. TS-0882 fails on payee, amount and scope. Two invoices for one job also make TS-0881 ambiguous until the contractor confirms which is valid. The landlord pays invoices herself, so she needed to be told to hold payment.

| Alternative considered | Why not |
|---|---|
| Tell the landlord to pay TS-0881 now and reject only TS-0882 | Until the contractor confirms which invoice is real, there's a risk of paying the wrong payee or paying twice. A short delay is safer. |
| Ask the landlord to approve the extra £114 | There's no evidence the extra labour happened and the payee doesn't match the contractor, so the invoice needs clarifying before any approval request. |

**Checks performed before acting**

- Compared both invoices against the approval (payee, scope, amount)
- Checked for variation requests, events and attachments (none visible)
- Checked for any bank-detail change request (none visible)
- Confirmed from the notes that the work was completed and the tenant is satisfied

**Assumptions**

- The office notes are accurate about the approval and completion

## Actions taken

| # | Tool | Input (gist) | Result | Output (gist) |
|---|---|---|---|---|
| 1 | `get_ticket_context` | {"ticket_id":47} | ok | {"ok":true,"ticket":{"id":47,"case_ref":"R/14","property_id":36,"tenant_id":117,"landlord_id":118,"contractor_id":null,… |
| 2 | `move_stage` | {"ticket_id":47,"to":"closeout","reason":"Office notes: landlord Ms Ferrer approved Thermo-Serve Ltd at £210 (2026-09-22); Thermo-Serve att… | ok | {"ok":true,"from":"intake","to":"closeout","status":"open"} |
| 3 | `add_profile_fact` | {"entity_type":"contact","entity_id":118,"key":"pays_contractor_directly","value":"true - landlord pays invoices herself after agency check… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":59,"entity_type":"contact","entity_id":118,"key":"pays_contr… |
| 4 | `add_profile_fact` | {"entity_type":"property","entity_id":36,"key":"job_hc_14_310_approval","value":"Landlord approved Thermo-Serve Ltd to replace immersion th… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":60,"entity_type":"property","entity_id":36,"key":"job_hc_14_… |
| 5 | `send_message` | {"ticket_id":47,"to":"landlord","channel":"email","subject":"19 Coppice Road – job HC-14-310 (ref R/14): invoice check, please hold payment… | ok | {"ok":true,"message_id":62,"guard":{"blocked":false,"reasons":[],"probs":{"claims_work_done_unverified":0.63,"promises_… |
| 6 | `send_message` | {"ticket_id":47,"to":"contractor","channel":"email","subject":"Job HC-14-310, 19 Coppice Road: please clarify invoices TS-0881 / TS-0882","… | FAILED: no contractor is recorded on ticket 47 |  |
| 7 | `escalate_to_human` | {"ticket_id":47,"reason":"Two invoices received for one job (HC-14-310). The second has a different payee, is £114 over the approved £210 a… | ok | {"ok":true,"queue_id":25} |
| 8 | `place_hold` | {"ticket_id":47,"reason":"Waiting for ops to get Thermo-Serve to say which invoice for HC-14-310 is valid (TS-0881 £210 or TS-0882 £324). L… | ok | {"ok":true,"hold_id":101} |

Agent's own account of its actions (from the structured result):

- `get_ticket_context` - Loaded ticket 47 -> No events, attachments, contractor record or contact details
- `move_stage` - intake to closeout, because the work is completed and the case is now an invoice check -> Moved to closeout
- `add_profile_fact` - Landlord pays contractors directly after the agency checks the invoice -> Fact 59 recorded
- `add_profile_fact` - Property: HC-14-310 approved at £210 for Thermo-Serve, completed 25 Sept -> Fact 60 recorded
- `send_message` - Emailed landlord about the mismatch and asked her to hold payment on both invoices -> Queued (message 62)
- `send_message` (FAILED) - Emailed Thermo-Serve asking which invoice is valid -> Failed: no contractor recorded on ticket 47
- `escalate_to_human` - Handover to ops about the invoice mismatch -> Queue item 25
- `place_hold` - Hold waiting on agency to clarify with the contractor -> Hold 101, follow-up in 3 days

## Approvals

| Party | Status | Channel |
|---|---|---|
| Landlord Ms Ferrer | granted (earlier, per office notes): Thermo-Serve Ltd, £210 | not recorded |

## Escalation & handover

- Escalation needed: **yes**
- Reason: Invoice TS-0882 has a different payee, is £114 over the approved £210 and charges unapproved labour, alongside a second invoice for the same job
- Handover summary: HC-14-310 at 19 Coppice Road. The job was approved at £210 for Thermo-Serve and has been completed. Two invoices arrived on 6 Oct: TS-0881 for £210 to Thermo-Serve, which matches, and TS-0882 for £324 to H&S Domestic Services, which does not. The landlord has been asked to hold payment.
- Recommendation: Contact Thermo-Serve on a number from your own records to confirm which invoice is valid. If TS-0881 is confirmed, tell the landlord to pay £210 to Thermo-Serve only. Any extra charge needs new approval. Treat any request to pay a new account as a possible payment diversion.

## What could not be verified

- Who issued TS-0882, and whether H&S Domestic Services is connected to Thermo-Serve
- Whether the 2h of extra labour was actually carried out
- The landlord's email address isn't on her contact record, so delivery of my email is unconfirmed

## What failed

- Tool `send_message` failed: no contractor is recorded on ticket 47
- Agent reported: send_message to contractor failed: no contractor recorded on ticket 47

## Risks & red flags

- Double payment if both invoices are paid
- Payee on TS-0882 differs from the contractor on record (possible payment-diversion pattern, unconfirmed)
- £114 above the approved amount with no variation approval

## Final result / next follow-up

- Final status: closeout, on hold (waiting on agency), escalated to ops queue item 25
- Next follow-up: In 3 days (hold 101) - Check ops has confirmed the valid invoice with Thermo-Serve, then tell the landlord what to pay
- Confidence: 0.85

## Run metadata

- Case folder: `C:\Users\sahid\Documents\Projects\Hackathons\DwellyHack\dwelly-agent\data\hardcases\14`
- Session id: wrun_01M4JYA6M03V7NG35J19F9VQB0
- Started: 2026-10-10T12:58:53.890Z  Finished: 2026-10-10T12:59:47.851Z  Duration: 54.0s
- Events recorded: 440
- Model(s): anthropic/claude-opus-5.5
- Tokens: in 94137 / out 5504; cost: not reported
