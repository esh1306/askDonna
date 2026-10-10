# Case PM037-1 - Answer

## Decision

**escalate**

## Summary

The landlord's reply in event 007, "Please get the shower hose replaced.", tells us to arrange the repair. She doesn't need a reply. The records show no contractor I can assign: none on the ticket, none named by the landlord and no past jobs at the property. So I've passed contractor selection to the operations team. I also emailed the tenant to say the repair is being arranged, with safety advice, and set a follow-up for one day's time.

## Judgement

- **Case type:** maintenance
- **Why this decision:** In event 003 we asked the landlord whether she would arrange the repair herself or wanted us to do it. Her reply in event 007 asks us to get the hose replaced. That is a clear go-ahead for the agency to arrange it, and the reply classifier agreed (approve 0.94, unconditional 0.82). The normal next step is to assign a contractor, but I can't pick one without making it up: none is on the ticket, the landlord didn't name one and the property has no job history. A person needs to choose one.

| Alternative considered | Why not |
|---|---|
| Assign a contractor now | There is no contractor on record or named by the landlord. Picking one would mean inventing a name. |
| Reply to the landlord | Her message was a clear instruction and needs no response (event 006 asked us to check this). |
| Treat it as an emergency dispatch, as the intake classifier suggested | A leaking shower hose can be contained by not using the shower. The tenant got containment advice, including what to do if the shower is electric. |
| Ask the landlord for a cost cap first | A hose replacement is a small routine job. The team can check the cost with her if the quote turns out high. |

**Checks performed before acting**

- Loaded ticket context: no open holds, approvals, contractor, spend limit or property history
- Ran classify_reply on event 007: approve, autonomy 'auto'
- Ran classify_intake: plumbing; flagged as an emergency, which I judged too high
- Checked for conflicting information: the tenant says 'cable' and the landlord says 'hose'. Both describe the shower hose, so this is not a conflict

**Assumptions**

- 'Shower cable' in the tenant's report means the flexible shower hose, as the landlord calls it
- The landlord expects the agency to arrange the contractor

## Actions taken

| # | Tool | Input (gist) | Result | Output (gist) |
|---|---|---|---|---|
| 1 | `get_ticket_context` | {"ticket_id":71} | ok | {"ok":true,"ticket":{"id":71,"case_ref":"R/PM037-1","property_id":51,"tenant_id":178,"landlord_id":179,"contractor_id":… |
| 2 | `classify_reply` | {"ticket_id":71,"text":"Please get the shower hose replaced.","sender_role":"landlord","context":"Agency asked landlord (event 003) whether… | ok | {"autonomy":"auto","intent":"approve","intent_probs":{"approve":0.94,"decline":0.02,"conditional_approval":0,"question"… |
| 3 | `classify_intake` | {"ticket_id":71} | ok | {"route":"emergency_dispatch","scope":"maintenance_repair","scope_probs":{"maintenance_repair":1,"maintenance_admin":0,… |
| 4 | `add_profile_fact` | {"entity_type":"contact","entity_id":179,"key":"shower_hose_repair_instruction","value":"Landlord asked agency to organise shower hose repl… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":104,"entity_type":"contact","entity_id":179,"key":"shower_ho… |
| 5 | `send_message` | {"ticket_id":71,"to":"tenant","channel":"email","subject":"Shower hose repair – Flat 14, 44 Lantern Quay (Ref R/PM037-1)","body":"Dear Eliz… | ok | {"ok":true,"message_id":93,"guard":{"blocked":false,"reasons":[],"probs":{"claims_work_done_unverified":0.59,"promises_… |
| 6 | `escalate_to_human` | {"ticket_id":71,"reason":"Landlord approved shower hose replacement but no contractor is on record to assign","summary":"Tenant reported da… | ok | {"ok":true,"queue_id":33} |
| 7 | `place_hold` | {"ticket_id":71,"reason":"Awaiting agency contractor selection for landlord-approved shower hose replacement (human queue 33); update tenan… | ok | {"ok":true,"hold_id":169} |

Agent's own account of its actions (from the structured result):

- `classify_reply` - Classified the landlord's reply in event 007 -> approve 0.94, unconditional 0.82, auto
- `classify_intake` - Classified the repair -> plumbing; flagged as an emergency (I treated it as urgent but routine)
- `add_profile_fact` - Recorded on the landlord's profile that she asked the agency to organise the hose replacement (event 007) -> fact 104
- `send_message` - Emailed the tenant: landlord asked us to arrange the replacement, a contractor will be in touch, update within one working day; safety advice and a request for photos -> message 93 sent, not blocked by the outbound guard
- `escalate_to_human` - Passed contractor selection to the operations team -> queue item 33
- `place_hold` - Placed a hold waiting on the agency, with a follow-up in 1 day -> hold 169

## Approvals

| Party | Status | Channel |
|---|---|---|
| Landlord (Freya) | granted (instruction to replace the shower hose, no cost cap) | email |

## Escalation & handover

- Escalation needed: **yes**
- Reason: The landlord approved the hose replacement but there is no contractor on record to assign
- Handover summary: Landlord asked us to replace the leaking shower hose (event 007). The tenant has been updated. The records show no contractor, property history or spend limit.
- Recommendation: Choose a panel plumber, assign them on ticket 71 and send them the job details. Check the cost with the landlord if the quote is not a typical small amount.

## What could not be verified

- Whether the shower is electric
- Repair cost
- Whether the tenant has sent photos (none visible)
- Tenant's contact details and availability

## What failed

_No failures recorded._

## Risks & red flags

- Water leaking near the shower handle could pose an electrical risk if it is an electric shower. The tenant was told to switch it off at the isolator if so
- No landlord spend limit is recorded

## Final result / next follow-up

- Final status: provider_selection: on hold waiting on the agency for contractor selection (queue item 33)
- Next follow-up: 2024-03-28 (1 day) - Check a contractor has been assigned, then notify the contractor and the tenant
- Confidence: 0.8

## Run metadata

- Case folder: `C:\Users\sahid\Documents\Projects\Hackathons\DwellyHack\dwelly-agent\data\practice\cases\PM037-1`
- Session id: wrun_01M4JYEBDN98JFZXCKFRQYM1AK
- Started: 2026-10-10T13:01:09.857Z  Finished: 2026-10-10T13:01:54.328Z  Duration: 44.5s
- Events recorded: 282
- Model(s): anthropic/claude-opus-5.5
- Tokens: in 80739 / out 4361; cost: not reported
