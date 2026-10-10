# Case PM005-1 - Answer

## Decision

**escalate**

## Summary

The contractor (Ava) asked for the check-out report so she can quote for the check-out clean at the vacant flat. No report is visible on the ticket and I can't attach files, so I've asked the agency team to send it. I emailed Ava to say it's being arranged and set a 2-day follow-up. No money has been committed. The landlord will need to approve the estimate when it comes in.

## Judgement

- **Case type:** maintenance
- **Why this decision:** Event 006 is a contractor question that only the agency can answer, because only the agency can supply the check-out report. No attachment is visible on the ticket. The job is at the estimate stage (event 004), so no approval or assignment decision is due yet.

| Alternative considered | Why not |
|---|---|
| No action | Without the report the contractor can't quote, so the job would stall. |
| Ask the landlord for approval now | There is no estimate yet, so there is nothing to approve. |
| Move the stage | Stages only move forward. The stage is already 'scheduling', which is ahead of where the case really is. I flagged this to the human instead. |

**Checks performed before acting**

- Ticket context: no attachments, approvals, holds or property history
- Classified the contractor reply: a question, flagged for review
- Property is vacant (event 002)
- Landlord profile has no spend limit

**Assumptions**

- 'Checkout' means the check-out inspection report from the end of the tenancy

## Actions taken

| # | Tool | Input (gist) | Result | Output (gist) |
|---|---|---|---|---|
| 1 | `get_ticket_context` | {"ticket_id":12} | ok | {"ok":true,"ticket":{"id":12,"case_ref":"R/PM005-1","property_id":9,"tenant_id":28,"landlord_id":29,"contractor_id":30,… |
| 2 | `classify_reply` | {"ticket_id":12,"text":"Hi Please can you attach checkout to the requests please? xx","sender_role":"contractor","context":"Contractor aske… | ok | {"autonomy":"review","intent":"question","intent_probs":{"quote_or_estimate":0.01,"invoice":0,"completion_report":0.01,… |
| 3 | `send_message` | {"ticket_id":12,"to":"contractor","channel":"email","subject":"Re: Job NBL-005-0163 / R/PM005-1 – Flat 10, 160 Alder Lane, Westmarsh, ZZ8 9… | ok | {"ok":true,"message_id":3,"guard":{"blocked":false,"reasons":[],"probs":{"claims_work_done_unverified":0.18,"promises_s… |
| 4 | `escalate_to_human` | {"ticket_id":12,"reason":"Contractor needs the check-out report to quote, and no report is visible on the ticket. Only the agency can suppl… | ok | {"ok":true,"queue_id":1} |
| 5 | `place_hold` | {"ticket_id":12,"reason":"Waiting for the agency to send the check-out report to the contractor (event 006). Contractor's estimate to follo… | ok | {"ok":true,"hold_id":16} |

Agent's own account of its actions (from the structured result):

- `classify_reply` - Classified the contractor's email (event 006) -> Question; autonomy: review; needs human response 0.36
- `send_message` - Emailed the contractor to say the report is being arranged and asked for her estimate once she has it -> Queued (message_id 3); guard passed
- `escalate_to_human` - Asked the agency team to find the check-out report and send it to the contractor -> queue_id 1
- `place_hold` - Hold waiting on the agency, follow-up in 2 days -> hold_id 16

## Approvals

| Party | Status | Channel |
|---|---|---|
| Landlord | not_yet_needed (waiting for the estimate) | n/a |

## Escalation & handover

- Escalation needed: **yes**
- Reason: Contractor needs the check-out report, which isn't visible on the ticket and only the agency can supply.
- Handover summary: Vacant Flat 10, 160 Alder Lane. Ava (job NBL-005-0163) asked for the check-out report before she can quote for the clean, appliances, freezer defrost and bedroom two carpet. No estimate or approval yet.
- Recommendation: Find the report, email it to Ava and add it to the ticket. Send her estimate to the landlord for approval before any work goes ahead.

## What could not be verified

- Whether a check-out report exists
- The landlord's spend limit and contact details
- What the event 005 hold was for (no text recorded)

## What failed

_No failures recorded._

## Risks & red flags

- The ticket stage 'scheduling' is ahead of reality: the job is still waiting for an estimate
- The property is vacant, so delays add to void time

## Final result / next follow-up

- Final status: Stage: scheduling. On hold waiting on the agency (hold 16) and escalated (queue 1).
- Next follow-up: In 2 days (about 11 Nov 2024) - Check the report has been sent to Ava and chase her estimate
- Confidence: 0.85

## Run metadata

- Case folder: `C:\Users\sahid\Documents\Projects\Hackathons\DwellyHack\dwelly-agent\data\practice\cases\PM005-1`
- Session id: wrun_01M4JY5GSC7WVFQZFPV4JMXKBC
- Started: 2026-10-10T12:56:20.109Z  Finished: 2026-10-10T12:56:58.647Z  Duration: 38.5s
- Events recorded: 177
- Model(s): anthropic/claude-opus-5.5
- Tokens: in 60128 / out 3073; cost: not reported
