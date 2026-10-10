# Case PM005-1 - Answer

## Decision

**escalate**

## Summary

The cleaner (Ava) needs the check-out report before she can price the clean. I can't send attachments, and the only report on file is dated 25 Feb 2025, which doesn't fit this Nov 2024 job. I emailed Ava to say the report is being checked and will be sent. I've escalated to the agency to confirm the right report and send it, and placed a hold to follow up in 2 days.

## Judgement

- **Case type:** maintenance
- **Why this decision:** Ava's request (event 006) can only be met by sending a file, and I have no tool to attach one. The report on file is dated 25 Feb 2025, after the ticket was created, so it may be the wrong document or contain a typo. Sending it unchecked could mean she prices the wrong scope.

| Alternative considered | Why not |
|---|---|
| Summarise the report's cleaning items in an email to Ava | The transcription stops after page 1, so there are no room-by-room items to summarise, and the date problem is unresolved. |
| No action | Ava is waiting on us and the job would stall. |
| Ask the landlord for approval now | There's no estimate yet, so nothing to approve. |

**Checks performed before acting**

- Loaded the ticket context: not tenanted, no approvals, no holds, no landlord spend limit
- Read the check-out report: dated 25 Feb 2025, transcription stops after page 1
- Classified Ava's email: a question, flagged for review

**Assumptions**

- The contractor 'Ava' in event 004 is the contractor on the ticket

## Actions taken

| # | Tool | Input (gist) | Result | Output (gist) |
|---|---|---|---|---|
| 1 | `get_ticket_context` | {"ticket_id":92} | ok | {"ok":true,"ticket":{"id":92,"case_ref":"R/PM005-1","property_id":9,"tenant_id":227,"landlord_id":228,"contractor_id":2… |
| 2 | `read_attachment` | {"ticket_id":92,"name":"attachment-01-check-out-inspection-report.pdf"} | ok | {"ok":true,"name":"attachment-01-check-out-inspection-report.pdf","text":"# Transcription: Northbridge Lettings, Check-… |
| 3 | `classify_reply` | {"ticket_id":92,"text":"Hi Please can you attach checkout to the requests please? xx","sender_role":"contractor","context":"Contractor aske… | ok | {"autonomy":"review","intent":"question","intent_probs":{"quote_or_estimate":0,"invoice":0,"completion_report":0.37,"sc… |
| 4 | `send_message` | {"ticket_id":92,"to":"contractor","channel":"email","subject":"Re: Job NBL-005-0163 / R/PM005-1 – Flat 10, 160 Alder Lane – check-out repor… | ok | {"ok":true,"message_id":121,"guard":{"blocked":false,"reasons":[],"probs":{"claims_work_done_unverified":0.18,"promises… |
| 5 | `escalate_to_human` | {"ticket_id":92,"reason":"Contractor needs the check-out report attached; the only report on file is dated 25 Feb 2025, which doesn't fit t… | ok | {"ok":true,"queue_id":42} |
| 6 | `place_hold` | {"ticket_id":92,"reason":"Agency to confirm the correct check-out report and send it to contractor Ava. Her estimate will follow.","waiting… | ok | {"ok":true,"hold_id":234} |

Agent's own account of its actions (from the structured result):

- `read_attachment` - Read the check-out report -> Northbridge Lettings report for this property, dated 25 Feb 2025; only page 1 visible
- `classify_reply` - Classified Ava's request -> Question; flagged for review
- `send_message` - Emailed Ava that the report is being checked and will be sent, and repeated the estimate scope -> Message 121 sent; guard passed
- `escalate_to_human` - Asked the agency to confirm the correct report and send it to Ava -> Queue item 42
- `place_hold` - Hold waiting on the agency -> Hold 234, follow up in 2 days

## Approvals

| Party | Status | Channel |
|---|---|---|
| Landlord | not yet requested (no estimate) | n/a |

## Escalation & handover

- Escalation needed: **yes**
- Reason: The report needs to be attached and sent, and its date doesn't fit this job
- Handover summary: Ava asked for the check-out report (event 006). The report on file is dated 25 Feb 2025, but the job was opened on 2 Nov 2024. I've told Ava the report will follow.
- Recommendation: Confirm the correct report, email it to Ava under job NBL-005-0163, then ask the landlord to approve her estimate when it arrives.

## What could not be verified

- Whether the 25 Feb 2025 report is for this check-out
- Pages 2–4 of the report
- The landlord's spend limit and preferred channel
- What the event 005 hold was for

## What failed

- Agent reported: The report transcription stops after page 1

## Risks & red flags

- The report date doesn't fit this job (25 Feb 2025 report vs 2 Nov 2024 job), so it may be the wrong document
- The ticket is at 'scheduling', but no estimate or approval exists

## Final result / next follow-up

- Final status: On hold, waiting on the agency to send the correct report to Ava; escalated as queue item 42
- Next follow-up: In 2 days (hold 234) - Check the report has been sent to Ava and chase her estimate
- Confidence: 0.8

## Run metadata

- Case folder: `C:\Users\sahid\Documents\Projects\Hackathons\DwellyHack\dwelly-agent\data\practice\cases\PM005-1`
- Session id: wrun_01M4JYXPRSBZZXM4ACJ1QARRB7
- Started: 2026-10-10T13:09:32.861Z  Finished: 2026-10-10T13:10:25.445Z  Duration: 52.6s
- Events recorded: 225
- Model(s): anthropic/claude-opus-5.5
- Tokens: in 78434 / out 3565; cost: not reported
