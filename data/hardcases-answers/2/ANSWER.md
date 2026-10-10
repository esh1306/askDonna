# Case 2 - Answer

## Decision

**escalate**

## Summary

The landlord approved a plumber up to £150 and asked for Brightwell Plumbing. But our booking email to Brightwell bounced and our message to the tenant never sent, so nobody has acted for 3 days while the leak gets worse. I assigned Brightwell, which moved the ticket to scheduling. I emailed the tenant an apology with steps to isolate the tap, and told the landlord about the bounce. I escalated at high priority so someone can reach Brightwell on a verified contact today.

## Judgement

- **Case type:** maintenance
- **Why this decision:** Event 004 is a clear approval up to £150 that names Brightwell, so assigning them is correct. Events 006 and 008 show nothing actually reached Brightwell or the tenant. I can't contact Brightwell myself: the only address on record bounced and there's no phone number. A person needs to phone them, and the growing leak (classifier: emergency 0.86, dissatisfied 0.94) justifies high priority.

| Alternative considered | Why not |
|---|---|
| Send the booking to the contractor through send_message | The only contractor address on record bounced with 'user unknown', so it would probably fail again. A human needs to find a verified contact. |
| Ask the landlord for approval again | Approval up to £150 is already clear in event 004. |
| Use a different plumber straight away | The landlord named Brightwell. Switching needs the landlord's agreement, and I've put that in the handover in case Brightwell can't come promptly. |
| Just wait | The leak is getting worse and the tenant has gone 3 days without any contact. |

**Checks performed before acting**

- Read all 9 events in the context
- No approval record in CRM, but event 004 approval confirmed
- Contractor record has no phone number or valid email
- Bounced domain is spelt 'brightwel' (possible typo)
- Tenant reply classified: review, complaint/safety signals
- Intake classified: emergency/urgent plumbing
- Guard blocked my first landlord email; rewrote it without claims and sent

**Assumptions**

- Tenant availability Mon–Fri 9–5 (taken from event 005) still holds
- Brightwell's correct domain is probably spelt with two Ls; not verified

## Actions taken

| # | Tool | Input (gist) | Result | Output (gist) |
|---|---|---|---|---|
| 1 | `get_ticket_context` | {"ticket_id":3} | ok | {"ok":true,"ticket":{"id":3,"case_ref":"R/2","property_id":3,"tenant_id":5,"landlord_id":6,"contractor_id":7,"title":"C… |
| 2 | `classify_reply` | {"ticket_id":3,"text":"Nobody has contacted me. The puddle is getting bigger, is anyone coming?","sender_role":"tenant","context":"Landlord… | ok | {"autonomy":"review","intent":"question","intent_probs":{"confirms_fixed":0,"still_broken":0.07,"access_or_availability… |
| 3 | `classify_intake` | {"ticket_id":3,"estimate_gbp":150,"text":"Bathroom basin tap dripping for over a week; puddle under the sink is getting bigger (tenant chas… | ok | {"route":"emergency_dispatch","scope":"maintenance_repair","scope_probs":{"maintenance_repair":1,"maintenance_admin":0,… |
| 4 | `assign_contractor` | {"ticket_id":3,"contractor_name":"Brightwell Plumbing","company":"Brightwell Plumbing","reason":"Landlord approved up to £150 and named Bri… | ok | {"ok":true,"contractor_id":32,"stage":"scheduling"} |
| 5 | `add_profile_fact` | {"entity_type":"contact","entity_id":5,"key":"availability","value":"Mon-Fri 9-5","source_ref":"event 005 (booking request)","confidence":0… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":3,"entity_type":"contact","entity_id":5,"key":"availability"… |
| 6 | `add_profile_fact` | {"entity_type":"contact","entity_id":7,"key":"email_bounced_address","value":"bookings@brightwel-plumbing.example bounced (550 5.1.1 user u… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":7,"entity_type":"contact","entity_id":7,"key":"email_bounced… |
| 7 | `add_profile_fact` | {"entity_type":"contact","entity_id":6,"key":"preferred_contractor_plumbing","value":"Brightwell Plumbing (approved plumber visit up to £15… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":8,"entity_type":"contact","entity_id":6,"key":"preferred_con… |
| 8 | `send_message` | {"ticket_id":3,"to":"tenant","channel":"email","subject":"Dripping basin tap – 3 Kestrel Close (ref R/2)","body":"Hello,\n\nI'm sorry nobod… | ok | {"ok":true,"message_id":12,"guard":{"blocked":false,"reasons":[],"probs":{"claims_work_done_unverified":0.44,"promises_… |
| 9 | `send_message` | {"ticket_id":3,"to":"landlord","channel":"email","subject":"Update: basin tap leak – 3 Kestrel Close (ref R/2)","body":"Hello,\n\nA quick u… | FAILED: Blocked by Jev outbound guard (message). claims_work_done_unverified (p=0.71): claims work is done/booked/paid/approved… |  |
| 10 | `escalate_to_human` | {"ticket_id":3,"reason":"Landlord-approved contractor can't be reached: booking email bounced and there's no valid contact on record. Tenan… | ok | {"ok":true,"queue_id":5} |
| 11 | `place_hold` | {"ticket_id":3,"reason":"Waiting for ops to reach Brightwell Plumbing on a verified contact and book the visit. Tenant has been promised an… | ok | {"ok":true,"hold_id":27} |
| 12 | `send_message` | {"ticket_id":3,"to":"landlord","channel":"email","subject":"Update: basin tap leak – 3 Kestrel Close (ref R/2)","body":"Hello,\n\nHere's an… | ok | {"ok":true,"message_id":16,"guard":{"blocked":false,"reasons":[],"probs":{"claims_work_done_unverified":0.17,"promises_… |

Agent's own account of its actions (from the structured result):

- `classify_reply` - Classified the tenant's chase (event 009) -> review; dissatisfied 0.94, safety 0.68
- `classify_intake` - Re-classified severity using the latest report -> emergency 0.86, plumbing
- `assign_contractor` - Assigned Brightwell Plumbing, as the landlord named in event 004 -> Stage moved to scheduling
- `add_profile_fact` (FAILED) - First attempt to record the bounced contractor address -> Rejected: wrong entity_type
- `add_profile_fact` - Recorded the bounced Brightwell address, the tenant's availability and the landlord's preferred plumber -> Saved
- `send_message` - Emailed the tenant an apology, steps to isolate the tap safely, and an update promised by 5 Oct -> Queued (msg 12)
- `send_message` (FAILED) - First landlord update -> Blocked by guard (claims_work_done_unverified)
- `send_message` - Rewrote and sent the landlord update about the bounce, asking for Brightwell's contact details -> Queued (msg 16)
- `escalate_to_human` - High-priority handover so a person can phone Brightwell on a verified contact -> Queue id 5
- `place_hold` - Hold waiting on the agency, follow up in 1 day -> Hold 27

## Approvals

| Party | Status | Channel |
|---|---|---|
| Landlord | granted (event 004, up to £150, Brightwell) | email |

## Escalation & handover

- Escalation needed: **yes**
- Reason: We can't reach the landlord's chosen contractor (the email bounced and there's no other contact), and the tenant reports the leak is getting worse.
- Handover summary: Approved up to £150 for Brightwell. The booking bounced and the tenant was never notified. I've assigned Brightwell, given the tenant containment advice and updated the landlord. Brightwell still has not been reached.
- Recommendation: Phone Brightwell today on a verified number with the job details, and fix the email address on record. If they can't attend within 24–48 hours, ask the landlord about another plumber. Check that the tenant email was delivered.

## What could not be verified

- Correct contact details for Brightwell Plumbing
- Whether the tenant has isolated the tap, or whether there is any damage
- Whether the tenant email (msg 12) and landlord email (msg 16) were delivered

## What failed

- Tool `send_message` failed: Blocked by Jev outbound guard (message). claims_work_done_unverified (p=0.71): claims work is done/booked/paid/approved without evidence in the records: rewrite without claiming completion; say only what is confirmed. Rewrite the text to fix this and retry, or escalate_to_human if you cannot.
- Agent reported: Original contractor booking email bounced (event 006)
- Agent reported: Original tenant notification failed (event 008)
- Agent reported: First add_profile_fact failed because of the wrong entity_type; retried and succeeded
- Agent reported: First landlord email blocked by the guard; rewritten and sent

## Risks & red flags

- The leak is getting worse: possible damage to the floor or ceiling
- The tenant was told nothing for 3 days, so a complaint is likely
- Sending to the wrong address could happen again unless the contractor record is corrected

## Final result / next follow-up

- Final status: scheduling, on hold waiting on the agency, escalated (high)
- Next follow-up: 2026-10-05 - Confirm Brightwell has been reached and a visit is being arranged; update the tenant as promised
- Confidence: 0.85

## Run metadata

- Case folder: `C:\Users\sahid\Documents\Projects\Hackathons\DwellyHack\dwelly-agent\data\hardcases\2`
- Session id: wrun_01M4JY5GHRE98Z52BSCT88J4JT
- Started: 2026-10-10T12:56:19.982Z  Finished: 2026-10-10T12:57:27.026Z  Duration: 67.0s
- Events recorded: 542
- Model(s): anthropic/claude-opus-5.5
- Tokens: in 124271 / out 6671; cost: not reported
