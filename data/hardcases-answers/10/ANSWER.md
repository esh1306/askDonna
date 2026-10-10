# Case 10 - Answer

## Decision

**escalate**

## Summary

This is a neighbour complaint, not a repair. The tenant reports noise, suspected drug dealing and strangers in the stairwell, all linked to Flat 12. I sent the tenant an acknowledgement with safe advice (police on 999/101, Crimestoppers, the council's noise team, keeping a log) and said they'd hear from us within 2 working days. I handed the case to the property management team (normal priority) and placed a 2-day hold.

## Judgement

- **Case type:** out_of_scope
- **Why this decision:** Event 442 describes noise, suspected crime and antisocial behaviour by a neighbour. Our maintenance tools can't fix any of that, and the intake note (event 443) also found no repair issue. classify_reply suggested review: it rated the message as a complaint, with a 0.93 chance it needs a human response and 0.56 for a safety concern. Under the rules for cases that aren't maintenance jobs, I acknowledged the tenant, gave safety advice and handed over to a human.

| Alternative considered | Why not |
|---|---|
| Assign a contractor / move through repair stages | There's nothing to repair. |
| No action | The tenant is distressed and waiting for an answer, and there's a possible safety concern. |
| High priority escalation | There's no immediate danger in the report, and the tenant now has the 999 advice. |
| Contact the landlord directly | There are no contact details on the record. Whether to involve the landlord depends on who manages Flat 12, which the team needs to decide. |

**Checks performed before acting**

- Loaded the ticket context: no history, profile facts, attachments or contact details
- Searched find_tickets for other cases at 40 Crown Parade: only this one
- Classified the tenant's message with classify_reply
- The outbound message passed the guard

**Assumptions**

- UK police and council reporting routes apply

## Actions taken

| # | Tool | Input (gist) | Result | Output (gist) |
|---|---|---|---|---|
| 1 | `get_ticket_context` | {"ticket_id":34} | ok | {"ok":true,"ticket":{"id":34,"case_ref":"R/10","property_id":26,"tenant_id":87,"landlord_id":88,"contractor_id":null,"t… |
| 2 | `classify_reply` | {"ticket_id":34,"text":"The people in Flat 12 have loud parties until 4am most weekends and I think they are dealing drugs. Strangers in th… | ok | {"autonomy":"review","intent":"complaint","intent_probs":{"confirms_fixed":0,"still_broken":0,"access_or_availability":… |
| 3 | `find_tickets` | {"property_address":"40 Crown Parade"} | ok | {"matches":1,"tickets":[{"id":34,"case_ref":"R/10","title":"Neighbour noise and antisocial behaviour complaint","catego… |
| 4 | `send_message` | {"ticket_id":34,"to":"tenant","channel":"email","subject":"Your report about Flat 12 – Flat 11, 40 Crown Parade (ref R/10)","body":"Dear te… | ok | {"ok":true,"message_id":46,"guard":{"blocked":false,"reasons":[],"probs":{"claims_work_done_unverified":0.11,"promises_… |
| 5 | `escalate_to_human` | {"ticket_id":34,"reason":"Out of scope: neighbour noise/antisocial behaviour and suspected drug dealing complaint, not a repair","summary":… | ok | {"ok":true,"queue_id":16} |
| 6 | `place_hold` | {"ticket_id":34,"reason":"Waiting on the agency's property management team to deal with the neighbour ASB/noise complaint (human queue 16).… | ok | {"ok":true,"hold_id":83} |

Agent's own account of its actions (from the structured result):

- `get_ticket_context` - Loaded the case -> 2 events, no facts or history
- `classify_reply` - Classified the tenant's email -> complaint, review, needs_human 0.93, safety 0.56
- `find_tickets` - Checked for related tickets at 40 Crown Parade -> Only ticket 34
- `send_message` - Acknowledged the tenant and gave safety and reporting advice -> message 46 queued, guard passed
- `escalate_to_human` - Handed the ASB complaint to property management -> queue item 16
- `place_hold` - Hold waiting on the agency, 2-day follow-up -> hold 83

## Approvals

| Party | Status | Channel |
|---|---|---|
| Landlord (R/10) | not_needed | n/a |

## Escalation & handover

- Escalation needed: **yes**
- Reason: A neighbour antisocial-behaviour and suspected drug-dealing complaint is outside maintenance scope.
- Handover summary: The tenant at Flat 11 reports late-night parties, suspected drug dealing and strangers in the stairwell, all linked to Flat 12. They have been acknowledged and given police and council advice, and were told to expect contact within 2 working days. We don't know whether the agency manages Flat 12 or the block.
- Recommendation: Call the tenant. Check whether we manage Flat 12 or the block. If we do, start the ASB/tenancy-breach process. If not, refer to the freeholder/managing agent and the council. Then close this maintenance ticket or move it to the tenancy queue.

## What could not be verified

- Drug dealing allegation
- Whether the agency manages Flat 12 or the communal areas
- Whether the tenant has already reported this to the police or council
- Tenant contact details and any vulnerability

## What failed

_No failures recorded._

## Risks & red flags

- Possible criminal activity in the communal stairwell
- Tenant wellbeing: weeks of sleep deprivation
- There are no contact details on record, so the message may not be delivered

## Final result / next follow-up

- Final status: Open, at intake stage; escalated to the human queue (item 16) and on hold waiting on the agency (hold 83)
- Next follow-up: 2026-10-10 - Check whether property management has contacted the tenant about the ASB complaint
- Confidence: 0.88

## Run metadata

- Case folder: `C:\Users\sahid\Documents\Projects\Hackathons\DwellyHack\dwelly-agent\data\hardcases\10`
- Session id: wrun_01M4JY8ZHGVNS79AHNTSEBXWFQ
- Started: 2026-10-10T12:58:13.887Z  Finished: 2026-10-10T12:58:53.884Z  Duration: 40.0s
- Events recorded: 254
- Model(s): anthropic/claude-opus-5.5
- Tokens: in 101709 / out 3873; cost: not reported
