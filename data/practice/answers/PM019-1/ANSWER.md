# Case PM019-1 - Answer

## Decision

**wait**

## Summary

This is a routine garden request: removing rubbish and construction waste, levelling the ground and laying gravel. The landlord was asked on 17 Jan and hasn't replied, so the first 3-day follow-up was missed. I sent the landlord one reminder asking them to approve a contractor visit to quote, or to choose part of the work or decline. I updated the tenant, asked them to resend the photos we can't see, and set a 3-day hold. I'll escalate only if this second deadline also passes with no reply.

## Judgement

- **Case type:** maintenance
- **Why this decision:** Event 006 is the first missed follow-up. Approval 16 is still pending and nothing has come back from the landlord. Under the rules, I escalate only after no response at two follow-up deadlines, so the proportionate step is to chase once and set a hold. The classifier rated it a routine garden/external job (safety risk 0.23). Nothing suggests an emergency.

| Alternative considered | Why not |
|---|---|
| Escalate to a human now | Only one follow-up deadline has been missed, and the landlord can answer this themselves. |
| Assign a contractor to quote without approval | There is no approval and no pre-approved spend limit on record, and part of the request (levelling and gravel) may be an improvement for the landlord to decide on. |
| Request a new approval | Approval 16 is already pending, and only one can be pending per ticket. |

**Checks performed before acting**

- Approval 16 is pending with no amount and no response
- No holds were open
- No landlord contact details, preferred channel or spend limit on record
- No previous jobs at this property
- Attachments: none visible; the photos the tenant mentions are noted as unavailable
- Classifier: routine, garden_external, safety_risk 0.23

**Assumptions**

- The outbox will deliver email to the landlord and tenant even though there are no email addresses on their records
- Asking for a quote first is a sensible first step because there is no cost estimate

## Actions taken

| # | Tool | Input (gist) | Result | Output (gist) |
|---|---|---|---|---|
| 1 | `get_ticket_context` | {"ticket_id":39} | ok | {"ok":true,"ticket":{"id":39,"case_ref":"R/PM019-1","property_id":31,"tenant_id":99,"landlord_id":100,"contractor_id":n… |
| 2 | `classify_intake` | {"ticket_id":39} | ok | {"route":"request_landlord_approval","scope":"maintenance_repair","scope_probs":{"maintenance_repair":0.99,"maintenance… |
| 3 | `send_message` | {"ticket_id":39,"to":"landlord","channel":"email","subject":"Reminder: garden request – Flat 25, 185 Copperfield Walk (ref R/PM019-1)","bod… | ok | {"ok":true,"message_id":52,"guard":{"blocked":false,"reasons":[],"probs":{"claims_work_done_unverified":0.07,"promises_… |
| 4 | `send_message` | {"ticket_id":39,"to":"tenant","channel":"email","subject":"Update: garden request – Flat 25, 185 Copperfield Walk (ref R/PM019-1)","body":"… | ok | {"ok":true,"message_id":51,"guard":{"blocked":false,"reasons":[],"probs":{"claims_work_done_unverified":0.07,"promises_… |
| 5 | `place_hold` | {"ticket_id":39,"reason":"Chased landlord for decision on garden clearance/levelling/gravel (approval 16 pending since 17 Jan; first follow… | ok | {"ok":true,"hold_id":84} |

Agent's own account of its actions (from the structured result):

- `get_ticket_context` - Loaded the case -> Stage landlord_approval; approval 16 pending; no holds
- `classify_intake` - Classified the request -> Routine, garden_external; needs_landlord_approval 0.66; safety_risk 0.23
- `send_message` - Emailed the landlord a reminder asking them to APPROVE a contractor visit to quote, approve part of the work, or decline -> Sent, message 52
- `send_message` - Emailed the tenant an update with the 23 Jan update date, advice to keep clear of the waste, and a request to resend the photos -> Sent, message 51
- `place_hold` - Set a hold on the landlord for 3 days -> Hold 84

## Approvals

| Party | Status | Channel |
|---|---|---|
| Landlord (Jenkins) | requested (pending; reminder sent) | email |

## Escalation & handover

- Escalation needed: **no**
- Reason: Only the first follow-up deadline has been missed
- Recommendation: If the landlord hasn't replied by the 23 Jan follow-up, escalate to the human queue to contact the landlord by phone.

## What could not be verified

- The tenant's garden photos are not visible on our records
- How much construction waste there is, what it is, and where it came from
- Whether the levelling and gravel are a repair or an improvement
- The landlord's contact details and preferred channel

## What failed

_No failures recorded._

## Risks & red flags

- The construction waste could be a minor trip or cut hazard; the tenant has been told to keep clear
- The CRM has no contact details for the landlord, so emails may not reach them

## Final result / next follow-up

- Final status: landlord_approval, on hold waiting on the landlord (hold 84)
- Next follow-up: 2025-01-23 - Check for a landlord reply on approval 16. If there is none, escalate to a human for a phone chase (second missed deadline).
- Confidence: 0.8

## Run metadata

- Case folder: `C:\Users\sahid\Documents\Projects\Hackathons\DwellyHack\dwelly-agent\data\practice\cases\PM019-1`
- Session id: wrun_01M4JY9BV1SV9HVWWNPCREPT0J
- Started: 2026-10-10T12:58:26.446Z  Finished: 2026-10-10T12:58:59.625Z  Duration: 33.2s
- Events recorded: 174
- Model(s): anthropic/claude-opus-5.5
- Tokens: in 63178 / out 3134; cost: not reported
