# Case 14 - Answer

## Decision

**escalate**

## Summary

Two invoices came in for job HC-14-310. TS-0881 (Thermo-Serve Ltd, £210) matches the approved quote and the contractor. TS-0882 (H&S Domestic Services, £324, includes extra labour) has a different payee from the contractor of record, is £114 over the approval and covers work nobody approved. That pattern could be duplicate billing or an attempt to redirect payment. Neither invoice has been passed to the landlord. The case has gone to a human (high priority) to check with Thermo-Serve by phone first.

## Judgement

- **Case type:** maintenance_admin
- **Why this decision:** The rules say never to forward or approve an invoice that doesn't match the approved quote or the contractor on the job. TS-0882 doesn't match on payee, amount or scope. Both invoices arrived together from one email address, with the same job ref and consecutive numbers, so even TS-0881 can't safely be marked as checked until Thermo-Serve confirms which invoice is theirs. A possible payment diversion needs agency judgement.

| Alternative considered | Why not |
|---|---|
| Forward TS-0881 to the landlord as checked and reject TS-0882 | Both came in one email with consecutive numbers, which suggests a compromised mailbox or a billing error. We should confirm with the contractor before the landlord pays anything. Also, no contact details are on file. |
| Ask the landlord to approve the extra £114 | The payee isn't the contractor of record and there's no evidence the extra labour happened. It must be verified first. |
| Email Thermo-Serve to ask | The email channel itself may be compromised, so a phone call to the number on file is safer. There's also no contractor on the ticket and no contact details. |

**Checks performed before acting**

- Loaded ticket 66: no events, approvals, contacts or attachments
- Checked both invoices against the approval in the office notes (Thermo-Serve, £210, thermostat and element)
- Checked payee against contractor of record
- Looked for any approved variation or extra labour: none
- Safety: hot water restored and no complaint from the tenant

**Assumptions**

- The office notes in the case description accurately record the landlord's approval and that the work was completed

## Actions taken

| # | Tool | Input (gist) | Result | Output (gist) |
|---|---|---|---|---|
| 1 | `get_ticket_context` | {"ticket_id":66} | ok | {"ok":true,"ticket":{"id":66,"case_ref":"R/14","property_id":66,"tenant_id":174,"landlord_id":175,"contractor_id":null,… |
| 2 | `add_profile_fact` | {"entity_type":"contact","entity_id":175,"key":"pays_contractor_directly","value":"true - landlord pays invoices herself after agency check… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":45,"entity_type":"contact","entity_id":175,"key":"pays_contr… |
| 3 | `add_profile_fact` | {"entity_type":"property","entity_id":66,"key":"job_hc_14_310_approval","value":"Landlord approved Thermo-Serve Ltd to replace immersion th… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":46,"entity_type":"property","entity_id":66,"key":"job_hc_14_… |
| 4 | `escalate_to_human` | {"ticket_id":66,"reason":"Two invoices for job HC-14-310; one has a different payee and exceeds the approved £210 quote – possible duplicat… | ok | {"ok":true,"queue_id":11} |

Agent's own account of its actions (from the structured result):

- `get_ticket_context` - Loaded the case -> Nothing on file beyond the description: no events, contacts or approvals
- `add_profile_fact` - Recorded on the landlord's profile that she pays contractors directly after the agency checks invoices -> fact 45
- `add_profile_fact` - Recorded the HC-14-310 approval (£210, Thermo-Serve) on the property -> fact 46
- `escalate_to_human` - Raised the invoice mismatch and possible payment diversion with ops, high priority -> queue_id 11

## Approvals

| Party | Status | Channel |
|---|---|---|
| Landlord Ms Ferrer | granted (historical, per office notes): Thermo-Serve, £210. The extra £114 has not been approved | not recorded |

## Escalation & handover

- Escalation needed: **yes**
- Reason: Invoice payee and amount don't match the approved quote or contractor of record; possible fraud or duplicate billing
- Handover summary: HC-14-310: £210 approved for Thermo-Serve. Invoices received: TS-0881 Thermo-Serve £210 (matches) and TS-0882 H&S Domestic Services £324 including 2h extra labour (doesn't match). Both came from the Thermo-Serve email address. Nothing has been sent to the landlord.
- Recommendation: Phone Thermo-Serve on the number already on file. If only TS-0881 is theirs, forward £210 to Ms Ferrer as checked and void TS-0882. Any extra labour needs separate landlord approval and must be payable to the contractor of record. If they don't recognise TS-0882, warn the landlord and the contractor about possible email compromise.

## What could not be verified

- Who issued TS-0882 and whether H&S Domestic Services has any connection to Thermo-Serve
- Whether 2h of extra labour was actually done
- Contact details for the landlord, tenant and contractor (not visible in the CRM)
- The original invoice email and PDFs (not visible as attachments)

## What failed

_No failures recorded._

## Risks & red flags

- Payee differs from the contractor of record: possible payment diversion
- £114 above the approved amount for work nobody approved
- Two consecutive invoices for one job from the same email: risk of duplicate payment

## Final result / next follow-up

- Final status: Escalated to the human queue (item 11). Stage stays at intake and no invoice has been forwarded for payment.
- Next follow-up: When ops reply on queue item 11 - Once Thermo-Serve confirms which invoice is theirs, forward the verified invoice to the landlord and close out
- Confidence: 0.88

## Run metadata

- Case folder: `C:\Users\sahid\Documents\Projects\Hackathons\DwellyHack\dwelly-agent\data\hardcases\14`
- Session id: wrun_01M4JXHNTGXBY5W2W7K5MYAARM
- Started: 2026-10-10T12:45:30.251Z  Finished: 2026-10-10T12:46:05.908Z  Duration: 35.7s
- Events recorded: 228
- Model(s): anthropic/claude-opus-5.5
- Tokens: in 42348 / out 3855; cost: not reported
