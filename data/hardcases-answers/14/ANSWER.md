# Case 14 - Answer

## Decision

**escalate**

## Summary

The job is finished and one invoice matches the approval: TS-0881, Thermo-Serve Ltd, £210. The second invoice, TS-0882 for £324, doesn't match. It's payable to H&S Domestic Services, a third party not on record, and adds 2 hours of extra labour that nobody approved. It's for the same job and comes from the same invoice series and email, so it could be a duplicate or an attempted fraud. I escalated it so a person can check it with the contractor before anything is paid, and I moved the ticket to close-out. I haven't contacted the landlord or contractor; the handover leaves that to the human reviewer.

## Judgement

- **Case type:** maintenance_admin
- **Why this decision:** Per the rules, an invoice that doesn't match the approved quote or the contractor of record is never forwarded or approved for payment. TS-0882 differs on payee, amount and scope. TS-0881 matches fully. No contact details are recorded, and checking the payee needs a human using a trusted phone number.

| Alternative considered | Why not |
|---|---|
| Approve both invoices to the landlord | That would double-bill the job and could pay a fraudster. |
| Email the landlord directly myself | No landlord contact details are on record, and how to word a possible-fraud warning is best left to a human. |
| Email the contractor asking about TS-0882 | The email account may be compromised, so checking needs a separate trusted channel. |

**Checks performed before acting**

- Compared both invoices with the approval: amount, payee, scope, job reference
- Checked the stage against the evidence that the work is complete
- Checked for events, attachments and existing approvals (none visible)

**Assumptions**

- Office notes on the approval and completion are accurate

## Actions taken

| # | Tool | Input (gist) | Result | Output (gist) |
|---|---|---|---|---|
| 1 | `get_ticket_context` | {"ticket_id":68} | ok | {"ok":true,"ticket":{"id":68,"case_ref":"R/14","property_id":66,"tenant_id":178,"landlord_id":179,"contractor_id":null,… |
| 2 | `add_profile_fact` | {"entity_type":"contact","entity_id":179,"key":"pays_contractor_directly","value":"true - landlord pays invoices herself after agency check… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":49,"entity_type":"contact","entity_id":179,"key":"pays_contr… |
| 3 | `add_profile_fact` | {"entity_type":"property","entity_id":66,"key":"job_hc_14_310_invoice_discrepancy","value":"Two invoices received 2026-10-06 for HC-14-310:… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":50,"entity_type":"property","entity_id":66,"key":"job_hc_14_… |
| 4 | `escalate_to_human` | {"ticket_id":68,"reason":"Invoice TS-0882 doesn't match the approved quote, the contractor of record or the payee, and may be a duplicate o… | ok | {"ok":true,"queue_id":13} |
| 5 | `move_stage` | {"ticket_id":68,"to":"closeout","reason":"Work completed 2026-09-25 and the tenant confirmed hot water is restored (office notes). The job … | ok | {"ok":true,"from":"intake","to":"closeout","status":"open"} |

Agent's own account of its actions (from the structured result):

- `get_ticket_context` - Loaded ticket 68 -> No events, no attachments; property fact 46 records the £210 approval to Thermo-Serve Ltd
- `add_profile_fact` - Recorded on the landlord's profile that she pays contractors directly after the agency checks the invoice -> fact 49
- `add_profile_fact` - Recorded the invoice mismatch on the property -> fact 50
- `escalate_to_human` - Handed over the TS-0882 mismatch (payee, amount, scope) -> queue_id 13
- `move_stage` - Moved the ticket from intake to close-out because the work is complete and only the invoice check remains -> intake -> closeout

## Approvals

| Party | Status | Channel |
|---|---|---|
| Landlord Ms Ferrer | granted (prior, 2026-09-22, £210 to Thermo-Serve Ltd only) | recorded in office notes |

## Escalation & handover

- Escalation needed: **yes**
- Reason: Invoice TS-0882 has a different payee, a higher amount and extra work nobody approved compared with the approved quote; it may be a duplicate or fraud.
- Handover summary: TS-0881 (Thermo-Serve, £210) matches the approval. TS-0882 (payee H&S Domestic Services, £324 including 2 hours of extra labour) doesn't, but has the same job reference, number series, date and sending email.
- Recommendation: Tell the landlord TS-0881 can be paid and ask her not to pay TS-0882. Check TS-0882 with Thermo-Serve by phone on a number already held on file, not one from the email. Any extra labour needs evidence and retrospective approval from the landlord before payment.

## What could not be verified

- Whether Thermo-Serve issued TS-0882
- Who H&S Domestic Services is and how they relate to Thermo-Serve
- Whether the 2 hours of extra labour happened
- Whether the Thermo-Serve email account has been compromised

## What failed

_No failures recorded._

## Risks & red flags

- Payee on TS-0882 differs from the contractor of record, a possible invoice-redirection fraud
- Possible double billing of the same job (£210 + £324)
- Extra labour was charged without any approval

## Final result / next follow-up

- Final status: closeout, open; escalated to the human queue (item 13); no invoice cleared to pay except that TS-0881 is noted as matching
- Next follow-up: When the human reviewer completes the check with Thermo-Serve - Confirm the landlord has been told which invoice is valid, then close the ticket
- Confidence: 0.9

## Run metadata

- Case folder: `C:\Users\sahid\Documents\Projects\Hackathons\DwellyHack\dwelly-agent\data\hardcases\14`
- Session id: wrun_01M4JXMH0476XQKSQN14HNKVPG
- Started: 2026-10-10T12:47:03.522Z  Finished: 2026-10-10T12:47:42.085Z  Duration: 38.6s
- Events recorded: 279
- Model(s): anthropic/claude-opus-5.5
- Tokens: in 73983 / out 3894; cost: not reported
