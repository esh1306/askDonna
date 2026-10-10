# Case 10 - Answer

## Decision

**escalate**

## Summary

This is a neighbour noise and antisocial-behaviour complaint (suspected drug dealing, strangers in the stairwell), not a repair. I acknowledged the tenant, signposted police/council routes and asked them to report any communal security defects, then escalated to the human queue for the property/tenancy team to take forward.

## Judgement

- **Case type:** out_of_scope
- **Why this decision:** Event 001 describes neighbour behaviour from Flat 12, with no repair defect; event 002 system note agrees. classify_reply rated it a complaint needing a human response (0.94) with possible safety concern (0.58). Antisocial-behaviour matters need agency judgement and may involve police and other parties, so it can't go through the repair pipeline.

| Alternative considered | Why not |
|---|---|
| Assign a contractor / move through repair stages | There's no repair to fix. A contractor can't stop noise or criminal activity. |
| Treat as emergency, high priority | No immediate danger or insecure property was reported. The tenant was told to use 999 if in danger. Normal priority with a prompt call-back is proportionate. |
| No action | The tenant is waiting and distressed, and suspected crime needs signposting and human follow-up. |

**Checks performed before acting**

- Loaded ticket context: 2 events, no attachments, no profile facts, no holds or approvals
- Searched other tickets at 40 Crown Parade: none
- classify_reply on tenant email
- Outbound guard passed on tenant email

**Assumptions**

- The tenant's email address on the ticket is reachable (no contact details are visible in the profile)
- It isn't known whether the agency manages Flat 12 or the communal areas

## Actions taken

| # | Tool | Input (gist) | Result | Output (gist) |
|---|---|---|---|---|
| 1 | `get_ticket_context` | {"ticket_id":62} | ok | {"ok":true,"ticket":{"id":62,"case_ref":"R/10","property_id":62,"tenant_id":165,"landlord_id":166,"contractor_id":null,… |
| 2 | `classify_reply` | {"ticket_id":62,"text":"The people in Flat 12 have loud parties until 4am most weekends and I think they are dealing drugs. Strangers in th… | ok | {"autonomy":"review","intent":"complaint","intent_probs":{"confirms_fixed":0,"still_broken":0,"access_or_availability":… |
| 3 | `find_tickets` | {"property_address":"40 Crown Parade"} | ok | {"matches":1,"tickets":[{"id":62,"case_ref":"R/10","title":"Neighbour noise and antisocial behaviour complaint","catego… |
| 4 | `send_message` | {"ticket_id":62,"to":"tenant","channel":"email","subject":"Your report about Flat 12 – Flat 11, 40 Crown Parade (ref R/10)","body":"Dear Te… | ok | {"ok":true,"message_id":17,"guard":{"blocked":false,"reasons":[],"probs":{"claims_work_done_unverified":0.17,"promises_… |
| 5 | `escalate_to_human` | {"ticket_id":62,"reason":"Out of scope for maintenance: neighbour noise / antisocial behaviour complaint with suspected drug dealing and st… | ok | {"ok":true,"queue_id":9} |

Agent's own account of its actions (from the structured result):

- `get_ticket_context` - Loaded the case -> 2 events, no history or facts
- `classify_reply` - Classified the tenant email -> complaint; needs_human_response 0.94; safety 0.58; review
- `find_tickets` - Checked for related tickets at 40 Crown Parade -> Only this ticket
- `send_message` - Emailed the tenant: acknowledged the report, said it has been passed to the team, signposted 999/101/Crimestoppers and the council noise team, suggested keeping a diary, and asked them to report any communal security defects -> Message 17 queued; guard passed
- `escalate_to_human` - Handed the antisocial-behaviour complaint to the human queue -> queue_id 9

## Approvals

| Party | Status | Channel |
|---|---|---|
| Landlord (R/10) | not_needed | n/a |

## Escalation & handover

- Escalation needed: **yes**
- Reason: Out-of-scope neighbour noise and antisocial-behaviour complaint with suspected drug dealing
- Handover summary: Flat 11 tenant reports Flat 12 parties until 4am most weekends, suspected drug dealing and strangers in the stairwell. Tenant is sleep-deprived. Tenant has been acknowledged and signposted to police/council. No repair is involved.
- Recommendation: Tenancy/property manager to call the tenant within 1-2 working days, check their wellbeing and whether the communal entry is secure, then raise the issue with Flat 12's tenant/landlord if we manage it, or with the block managing agent/freeholder if not. Inform the Flat 11 landlord as appropriate.

## What could not be verified

- Suspected drug dealing (tenant's belief only)
- Whether the agency manages Flat 12 or the communal areas
- Whether the communal entrance is secure
- Tenant contact details and vulnerability

## What failed

_No failures recorded._

## Risks & red flags

- Possible criminal activity and strangers in the communal stairwell (security risk)
- Tenant wellbeing: weeks without proper sleep
- Risk of the complaint escalating if there's no prompt human follow-up

## Final result / next follow-up

- Final status: Open in intake, escalated to the human queue (item 9); not moved through repair stages
- Next follow-up: Within 1-2 working days - Human team to call the tenant and decide on action with Flat 12 / the block management
- Confidence: 0.88

## Run metadata

- Case folder: `C:\Users\sahid\Documents\Projects\Hackathons\DwellyHack\dwelly-agent\data\hardcases\10`
- Session id: wrun_01M4JXGNG95MBMH8QY77GMGZDD
- Started: 2026-10-10T12:44:57.145Z  Finished: 2026-10-10T12:45:35.180Z  Duration: 38.0s
- Events recorded: 229
- Model(s): anthropic/claude-opus-5.5
- Tokens: in 70361 / out 3543; cost: not reported
