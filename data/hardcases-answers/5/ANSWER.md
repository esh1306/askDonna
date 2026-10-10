# Case 5 - Answer

## Decision

**escalate**

## Summary

The tenant's 'small thing' is a safety emergency. The bathroom light flickers and gives off a burning smell, and in March (event 004) a contractor found the same fitting scorched and the loft wiring brittle. That warning was closed as 'cosmetic' (event 005). I sent the tenant safety steps and emailed the landlord. I passed the case to the operations team at high priority to send an electrician urgently, and moved the ticket to provider selection. A hold is set to chase in 6 hours.

## Judgement

- **Case type:** safety_emergency
- **Why this decision:** A burning smell from a light fitting already seen scorched, with brittle wiring, is an electrical fire risk, which counts as an emergency under the rules. Safety advice and telling the landlord could happen straight away. Sending an electrician needs a person, because there is no electrician on record.

| Alternative considered | Why not |
|---|---|
| Treat it as routine, as the tenant asked | The March warning shows a real fire risk |
| Assign the contractor already on the ticket | He is the fan fitter and said himself that an electrician was needed |
| Ask the landlord for approval before anything is done | Approval does not block emergency safety work. Further repairs will still need approval. |

**Checks performed before acting**

- Read the full event history, including events 004 and 005
- Profiles: no spend limit, channel preference or vulnerability recorded
- No pending approvals or holds
- Classifier results for the report and the tenant's message

**Assumptions**

- The tenant can reach the consumer unit safely; the advice says 'only if safe'
- Email is acceptable for the landlord because no channel preference is recorded

## Actions taken

| # | Tool | Input (gist) | Result | Output (gist) |
|---|---|---|---|---|
| 1 | `get_ticket_context` | {"ticket_id":14} | ok | {"ok":true,"ticket":{"id":14,"case_ref":"R/5","property_id":11,"tenant_id":36,"landlord_id":37,"contractor_id":38,"titl… |
| 2 | `classify_intake` | {"ticket_id":14,"text":"Bathroom ceiling light flickers and gives a faint burning/plastic smell after being on a while. In March a contract… | ok | {"route":"emergency_dispatch","scope":"emergency_safety","scope_probs":{"maintenance_repair":0.1,"maintenance_admin":0,… |
| 3 | `classify_reply` | {"ticket_id":14,"text":"Hi, thank you for sorting everything this year. Just a small thing - the bathroom light flickers sometimes and ther… | ok | {"autonomy":"review","intent":"new_issue","intent_probs":{"confirms_fixed":0,"still_broken":0.01,"access_or_availabilit… |
| 4 | `send_message` | {"ticket_id":14,"to":"tenant","channel":"sms","body":"9 Heron Walk, Ashbourne Green (ref R/5): thank you for telling us about the bathroom … | FAILED: Blocked by Jev outbound guard (message). claims_work_done_unverified (p=0.84): claims work is done/booked/paid/approved… |  |
| 5 | `send_message` | {"ticket_id":14,"to":"landlord","channel":"email","subject":"Urgent electrical safety issue – 9 Heron Walk, Ashbourne Green (ref R/5)","bod… | FAILED: Blocked by Jev outbound guard (message). claims_work_done_unverified (p=0.76): claims work is done/booked/paid/approved… |  |
| 6 | `send_message` | {"ticket_id":14,"to":"tenant","channel":"sms","body":"9 Heron Walk, Ashbourne Green (ref R/5): thank you for telling us about the bathroom … | ok | {"ok":true,"message_id":21,"guard":{"blocked":false,"reasons":[],"probs":{"claims_work_done_unverified":0.54,"promises_… |
| 7 | `send_message` | {"ticket_id":14,"to":"landlord","channel":"email","subject":"Urgent electrical safety issue – 9 Heron Walk, Ashbourne Green (ref R/5)","bod… | ok | {"ok":true,"message_id":22,"guard":{"blocked":false,"reasons":[],"probs":{"claims_work_done_unverified":0.22,"promises_… |
| 8 | `escalate_to_human` | {"ticket_id":14,"reason":"Electrical safety emergency: bathroom light flickering with burning smell, previously flagged scorched fitting/br… | ok | {"ok":true,"queue_id":9} |
| 9 | `add_profile_fact` | {"entity_type":"property","entity_id":11,"key":"electrical_risk_bathroom_light_loft_wiring","value":"Bathroom ceiling light fitting scorche… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":29,"entity_type":"property","entity_id":11,"key":"electrical… |
| 10 | `move_stage` | {"ticket_id":14,"to":"provider_selection","reason":"Emergency electrical safety work (event 034 + prior contractor warning event 004); make… | ok | {"ok":true,"from":"intake","to":"provider_selection","status":"open"} |
| 11 | `place_hold` | {"ticket_id":14,"reason":"Waiting for ops to dispatch an urgent electrician (queue 9) and for the landlord to say if they have a preferred … | ok | {"ok":true,"hold_id":58} |

Agent's own account of its actions (from the structured result):

- `get_ticket_context` - Loaded the ticket, profiles and 34 events -> No profile facts, holds, approvals or electrician on record
- `classify_intake` - Classified the new report together with the March warning -> Emergency, electrical/lighting, safety risk 0.94, route: emergency dispatch
- `classify_reply` - Classified the tenant's message -> New issue, safety concern 0.9, flagged for review
- `send_message` (FAILED) - First tenant SMS and landlord email -> Both blocked by the outbound guard for claiming unverified work; rewritten
- `send_message` - Tenant SMS: stop using the light, switch off the lighting breaker if safe, don't touch the fitting, call 999 if smoke or sparks; an urgent electrician is being sought -> Sent (message 21)
- `send_message` - Landlord email: emergency explained with the March warning; making it safe will go ahead without approval; any further work will be quoted for approval; asked for a preferred electrician -> Sent (message 22)
- `escalate_to_human` - High-priority handover asking ops to send an electrician urgently -> Queue item 9
- `add_profile_fact` - Recorded the electrical risk on the property -> Fact 29
- `move_stage` - Moved intake to provider_selection (emergency make-safe work) -> Done
- `place_hold` - Waiting on the agency to send an electrician and the landlord to name a preferred one -> Hold 58, follow-up in 0.25 days

## Approvals

| Party | Status | Channel |
|---|---|---|
| Landlord | not_needed | email |

## Escalation & handover

- Escalation needed: **yes**
- Reason: Electrical fire risk; urgent electrician needed and none on record
- Handover summary: 9 Heron Walk (R/5): flickering bathroom light with a burning smell (event 034). The same fitting was found scorched and the loft wiring brittle in March (event 004), but the warning was closed as cosmetic (event 005). Tenant has safety advice (message 21) and the landlord has been told (message 22).
- Recommendation: Send a qualified electrician today to make it safe and inspect the fitting and loft wiring (consider an EICR). Phone the tenant to confirm the light is isolated. Assign the electrician on the ticket and get the landlord to approve the quote for remedial work. Review why the March warning was closed.

## What could not be verified

- Whether the tenant has switched off the lighting circuit
- Whether anyone vulnerable lives at the property
- Cost of the work
- Whether the landlord has a preferred electrician
- Contact details for the parties (none in the profiles)

## What failed

- Tool `send_message` failed: Blocked by Jev outbound guard (message). claims_work_done_unverified (p=0.84): claims work is done/booked/paid/approved without evidence in the records: rewrite without claiming completion; say only what is confirmed. Rewrite the text to fix this and retry, or escalate_to_human if you cannot.
- Tool `send_message` failed: Blocked by Jev outbound guard (message). claims_work_done_unverified (p=0.76): claims work is done/booked/paid/approved without evidence in the records: rewrite without claiming completion; say only what is confirmed. Rewrite the text to fix this and retry, or escalate_to_human if you cannot.
- Agent reported: First tenant and landlord messages were blocked by the outbound guard; both were rewritten and sent

## Risks & red flags

- Possible electrical fire in the bathroom light and loft wiring
- The March contractor warning was closed as cosmetic and never acted on
- The tenant underplayed the risk

## Final result / next follow-up

- Final status: provider_selection, escalated high (queue 9), hold 58
- Next follow-up: Within 6 hours (0.25 days) - Confirm an electrician has been sent and the tenant has been told who is coming and when; check for a reply from the landlord
- Confidence: 0.9

## Run metadata

- Case folder: `C:\Users\sahid\Documents\Projects\Hackathons\DwellyHack\dwelly-agent\data\hardcases\5`
- Session id: wrun_01M4JY6MYSFT3AEYW82JAA5730
- Started: 2026-10-10T12:56:57.503Z  Finished: 2026-10-10T12:58:13.879Z  Duration: 76.4s
- Events recorded: 567
- Model(s): anthropic/claude-opus-5.5
- Tokens: in 156321 / out 6391; cost: not reported
