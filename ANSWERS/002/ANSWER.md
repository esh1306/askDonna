# Case 002 - Answer

## Decision

**escalate**

## Summary

I escalated this to the ops queue as high priority (item 22). The last signed gas safety record on file is dated 16 Oct 2024, so its 12-month cycle ended on 16 Oct 2025. Flintmere checked the boiler and cooker on 9 Oct and recorded them as satisfactory, but has paused the signed record over an unexplained "installation detail" query and given no date. I asked Flintmere for the details of that query, a date for the signed record and a price for a boiler lockout diagnostic, and told them not to book or do any work. I told the landlord what is outstanding without committing any spend, and updated the tenant with gas-smell safety advice. A hold is set to chase Flintmere in 2 days.

## Judgement

- **Case type:** mixed
- **Why this decision:** Event 2: the latest signed record is dated 16 Oct 2024, so a renewed record is due by 16 Oct 2025. The 9 Oct check is satisfactory in the job app (events 9, 15, 19), but the signed record is paused (event 19) with no date (event 24). The portal PDF says 'Customer document: Processing' and has no certificate number or Gas Safe ID, so it does not count as the certificate. A certificate that may have lapsed and an unexplained installation query are compliance risks, which the rules say to escalate. The lockouts recur (events 3, 17, 22), but there is no gas smell and the boiler restarts each time, so this is routine to urgent, not an emergency. The landlord explicitly withheld approval for a diagnostic and asked what is outstanding (events 5, 16, 23). So I asked for a price only and kept her informed.

| Alternative considered | Why not |
|---|---|
| Book a lockout diagnostic for after 21 Oct | The landlord explicitly has not approved any extra charges (event 23), the cost is unknown, and it is not an emergency. |
| Request formal landlord approval for the diagnostic now | There is no price yet, and the landlord asked first to know what is outstanding. Asking for a price first is proportionate. |
| Send the portal screenshot to the tenant as the gas safety record | It is not a signed record: the document shows as Processing and has no certificate number or engineer Gas Safe details. |
| Wait without escalating | The 12-month cycle has passed with no signed record and the contractor has given no date. The rules say to escalate a lapsed or unresolved certificate. |

**Checks performed before acting**

- Read all 24 events and the portal attachment
- Compared the last record date (16 Oct 2024) with the 12-month cycle
- Checked approvals: none on record; landlord has declined extra spend for now
- Safety check: no gas smell reported each time, boiler restarts after reset
- Checked holds and queue: none were open before this turn
- Classified the landlord's reply (review, decline/question) and the intake (heating, routine, safety_risk 0.56)

**Assumptions**

- The 16 Oct 2024 record was a landlord gas safety record (CP12) with a 12-month validity
- Flintmere is a Gas Safe registered firm (registration not visible)

## Actions taken

| # | Tool | Input (gist) | Result | Output (gist) |
|---|---|---|---|---|
| 1 | `get_ticket_context` | {"ticket_id":76} | ok | {"ok":true,"ticket":{"id":76,"case_ref":"R/002","property_id":70,"tenant_id":202,"landlord_id":203,"contractor_id":204,… |
| 2 | `read_attachment` | {"ticket_id":76,"name":"gas-portal-record.pdf"} | ok | {"ok":true,"name":"gas-portal-record.pdf","text":"# Transcription\n\n**Document type:** Portal record export (screensho… |
| 3 | `recall_lessons` | {"ticket_id":76,"situation_text":"Annual gas check done 9 Oct with satisfactory job-app entry, but contractor has paused the signed gas saf… | ok | {"ok":true,"count":0,"lessons":[]} |
| 4 | `classify_reply` | {"ticket_id":76,"text":"I have not approved a separate diagnostic or further charge. Please let me know what is still outstanding from Flin… | ok | {"autonomy":"review","intent":"decline","intent_probs":{"approve":0,"decline":0.64,"conditional_approval":0.01,"questio… |
| 5 | `classify_intake` | {"ticket_id":76,"text":"Boiler intermittently locks out during heating (4+ times since late Sept), restarts after tenant reset, currently h… | ok | {"route":"request_landlord_approval","scope":"maintenance_repair","scope_probs":{"maintenance_repair":0.72,"maintenance… |
| 6 | `escalate_to_human` | {"ticket_id":76,"reason":"Gas safety compliance gap: last signed record on file dated 16 Oct 2024 (12-month cycle passed 16 Oct 2025); 9 Oc… | ok | {"ok":true,"queue_id":22} |
| 7 | `send_message` | {"ticket_id":76,"to":"contractor","channel":"email","subject":"8 Brindlewick Row, Vellum Quay – job NBL-48217 (our ref R/002): signed gas s… | ok | {"ok":true,"message_id":53,"guard":{"blocked":false,"reasons":[],"probs":{"claims_work_done_unverified":0.2,"promises_s… |
| 8 | `send_message` | {"ticket_id":76,"to":"landlord","channel":"email","subject":"8 Brindlewick Row – what is outstanding from Flintmere (ref R/002)","body":"De… | ok | {"ok":true,"message_id":51,"guard":{"blocked":false,"reasons":[],"probs":{"claims_work_done_unverified":0.17,"promises_… |
| 9 | `send_message` | {"ticket_id":76,"to":"tenant","channel":"email","subject":"8 Brindlewick Row – gas paperwork and boiler (ref R/002)","body":"Dear Iona,\n\n… | ok | {"ok":true,"message_id":52,"guard":{"blocked":false,"reasons":[],"probs":{"claims_work_done_unverified":0.1,"promises_s… |
| 10 | `place_hold` | {"ticket_id":76,"reason":"Waiting for Flintmere: signed gas safety record date, details of the installation query, and a lockout diagnostic… | ok | {"ok":true,"hold_id":262} |
| 11 | `add_profile_fact` | {"entity_type":"property","entity_id":70,"key":"gas_safety_last_signed_record_date","value":"2024-10-16 (latest signed record in tenancy fi… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":77,"entity_type":"property","entity_id":70,"key":"gas_safety… |
| 12 | `add_profile_fact` | {"entity_type":"contact","entity_id":203,"key":"pre_approved_limit_gbp","value":"0 – no extra repair or diagnostic charges without explicit… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":78,"entity_type":"contact","entity_id":203,"key":"pre_approv… |
| 13 | `add_profile_fact` | {"entity_type":"property","entity_id":70,"key":"gas_appliances","value":"boiler; cooker","source_ref":"event 19; gas-portal-record.pdf","co… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":79,"entity_type":"property","entity_id":70,"key":"gas_applia… |

Agent's own account of its actions (from the structured result):

- `get_ticket_context` - Loaded the case -> 24 events; no holds, approvals or history
- `read_attachment` - Read gas-portal-record.pdf -> Portal summary for job NBL-48217, outcome satisfactory, customer document 'Processing'; no certificate number or Gas Safe ID
- `recall_lessons` - Looked for similar past cases -> No lessons
- `classify_reply` - Classified the landlord's email (event 23) -> review; decline 0.64 / question 0.35
- `classify_intake` - Classified the lockout and paperwork request -> heating, routine, needs landlord approval 0.65
- `escalate_to_human` - High-priority handover on the gas record gap and installation query -> Queue item 22
- `send_message` - Contractor: asked about the query, the signed record date and a diagnostic price; told them not to book -> Message 53 queued
- `send_message` - Landlord: summary of what is outstanding, no spend committed -> Message 51 queued
- `send_message` - Tenant: update, safety advice, next update by 21 Oct -> Message 52 queued
- `place_hold` - Waiting on Flintmere, follow-up in 2 days -> Hold 262
- `add_profile_fact` - Recorded gas record date, landlord spend stance and gas appliances -> Facts 77, 78, 79 saved

## Approvals

| Party | Status | Channel |
|---|---|---|
| Nessa Wold (Landlord) | not_granted – diagnostic/extra spend explicitly not approved (event 23); price being obtained first | email |

## Escalation & handover

- Escalation needed: **yes**
- Reason: The gas record cycle (16 Oct 2024) has passed with no signed record; Flintmere has an unexplained installation-detail query and no issue date; boiler lockouts recur.
- Handover summary: Check done 9 Oct and recorded satisfactory (boiler, cooker), but the signed record is paused by Flintmere's quality desk with no date. The portal PDF is only a summary. Tenant reports repeated lockouts, no gas smell, access available after 21 Oct. The landlord has approved no extra spend. Contractor asked for details and a price; landlord and tenant updated.
- Recommendation: Phone Flintmere's office today. Get the query details, a date for issuing the record and confirmation that the appliances are safe. Treat it as a safety issue if the installation query suggests danger. Make sure the tenant gets a copy by 6 Nov. Put the diagnostic price to the landlord for approval and book for after 21 Oct.

## What could not be verified

- Whether a valid signed gas safety record exists for after 16 Oct 2025
- What Flintmere's installation-detail query is
- Flintmere and engineer Gas Safe registration
- Cause of the lockouts and the cost of a diagnostic
- Whether the 16 Oct 2024 record was a CP12

## What failed

_No failures recorded._

## Risks & red flags

- Gas safety record may have lapsed (12 months since 16 Oct 2024)
- Unexplained appliance installation query could point to a defect
- Recurring boiler lockouts could lead to loss of heating as weather gets colder
- Tenant has not received a gas record copy; it is due within 28 days of the check (6 Nov)

## Final result / next follow-up

- Final status: Open, stage intake; escalated high (queue 22); hold 262 waiting on Flintmere
- Next follow-up: 2025-10-20 - Chase Flintmere for the signed record date, details of the query and the diagnostic price. Put the price to the landlord for approval, and update the tenant by 21 Oct.
- Confidence: 0.82

## Run metadata

- Case folder: `002`
- Session id: wrun_01M4K74THDF9VTCPBP1VVFPQTG
- Started: 2026-10-10T15:33:14.572Z  Finished: 2026-10-10T15:34:39.621Z  Duration: 85.0s
- Events recorded: 590
- Model(s): anthropic/claude-opus-5.5
- Tokens: in 176460 / out 7731; cost: not reported
