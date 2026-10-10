# Case 2 - Answer

## Decision

**escalate**

## Summary

The landlord approved a plumber visit up to £150 and asked for Brightwell Plumbing (event 004), but the booking email bounced (event 006) and the tenant update failed to send (event 008). I assigned Brightwell, emailed the tenant to say sorry and how to stop the water, and escalated at high priority so a person can phone Brightwell and fix the email address on file. The visit is still not booked.

## Judgement

- **Case type:** maintenance
- **Why this decision:** The approval is clear and names a contractor (event 004), so assigning Brightwell is the normal next step. But the only Brightwell address on file bounced (event 006, probably misspelt 'brightwel'), so I have no working way to reach them. A person needs to phone them. The tenant is unhappy and there is some water risk (classify_reply: dissatisfied 0.94, safety 0.67), so they needed a reply and safe advice now.

| Alternative considered | Why not |
|---|---|
| Message the contractor through the CRM | The only address on file bounced, so the message would fail again. |
| Treat as an emergency and send any plumber | A basin tap drip can be stopped at the isolation valve, so it is not water that can't be contained. The landlord also named a contractor. |
| Ask the landlord for approval again | Approval is already given up to £150. |

**Checks performed before acting**

- Read all 9 events
- Approval scope: up to £150, Brightwell Plumbing (event 004)
- Delivery failures in events 006 and 008
- CRM has no other contractor email or phone
- No existing holds, approvals or human-queue items
- Classified the tenant's reply

**Assumptions**

- The bounced address is a typo for Brightwell's real address
- The tenant's availability of Mon-Fri 9-5 (from event 005) is still correct

## Actions taken

| # | Tool | Input (gist) | Result | Output (gist) |
|---|---|---|---|---|
| 1 | `get_ticket_context` | {"ticket_id":55} | ok | {"ok":true,"ticket":{"id":55,"case_ref":"R/2","property_id":55,"tenant_id":145,"landlord_id":146,"contractor_id":147,"t… |
| 2 | `classify_reply` | {"ticket_id":55,"text":"Nobody has contacted me. The puddle is getting bigger, is anyone coming?","sender_role":"tenant","context":"Landlor… | ok | {"autonomy":"review","intent":"question","intent_probs":{"confirms_fixed":0,"still_broken":0.09,"access_or_availability… |
| 3 | `search_case` | {"ticket_id":55,"query":"brightwell"} | ok | {"query":"brightwell","matches":3,"events":[{"id":1528,"ticket_id":55,"ts":"2026-10-01T15:20:00Z","kind":"email","direc… |
| 4 | `assign_contractor` | {"ticket_id":55,"contractor_name":"Brightwell Plumbing","company":"Brightwell Plumbing","reason":"Landlord approved plumber visit up to £15… | ok | {"ok":true,"contractor_id":153,"stage":"scheduling"} |
| 5 | `send_message` | {"ticket_id":55,"to":"tenant","channel":"email","subject":"Bathroom tap leak – 3 Kestrel Close, Wexley, ZZ5 1ZZ (ref R/2)","body":"Hello,\n… | ok | {"ok":true,"message_id":6,"guard":{"blocked":false,"reasons":[],"probs":{"claims_work_done_unverified":0.6,"promises_sp… |
| 6 | `add_profile_fact` | {"entity_type":"contact","entity_id":146,"key":"preferred_contractor_plumbing","value":"Brightwell Plumbing (approved basin tap repair up t… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":27,"entity_type":"contact","entity_id":146,"key":"preferred_… |
| 7 | `add_profile_fact` | {"entity_type":"contact","entity_id":147,"key":"email_bookings_invalid","value":"bookings@brightwel-plumbing.example bounced 550 5.1.1 user… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":28,"entity_type":"contact","entity_id":147,"key":"email_book… |
| 8 | `add_profile_fact` | {"entity_type":"contact","entity_id":145,"key":"availability","value":"Mon-Fri 9-5","source_ref":"event 005 (booking request)","confidence"… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":29,"entity_type":"contact","entity_id":145,"key":"availabili… |
| 9 | `escalate_to_human` | {"ticket_id":55,"reason":"Approved job stalled 3 days: contractor booking bounced and no valid Brightwell contact on file; tenant reports w… | ok | {"ok":true,"queue_id":3} |
| 10 | `place_hold` | {"ticket_id":55,"reason":"Waiting for ops to reach Brightwell Plumbing with a valid contact and book the visit; chase if no booking confirm… | ok | {"ok":true,"hold_id":241} |

Agent's own account of its actions (from the structured result):

- `get_ticket_context` - Loaded the ticket -> 9 events, no holds or approvals, contractor record has only the bounced address
- `classify_reply` - Classified the tenant's chaser (event 009) -> review; dissatisfied 0.94, safety 0.67
- `search_case` - Searched for any other Brightwell contact details -> None found
- `assign_contractor` - Assigned Brightwell Plumbing as the landlord asked -> Stage moved to scheduling
- `send_message` - Emailed the tenant: apology, explanation of what went wrong, containment advice (isolation valve or stopcock), when to call -> Queued in the outbox (message 6), guard passed
- `add_profile_fact` - Recorded: the landlord prefers Brightwell; the Brightwell booking address is invalid; tenant available Mon-Fri 9-5 -> Facts 27, 28 and 29 saved
- `escalate_to_human` - High-priority handover: phone Brightwell and fix their email address on file -> Queue item 3
- `place_hold` - Hold waiting on the agency, follow up in 1 day -> Hold 241

## Approvals

| Party | Status | Channel |
|---|---|---|
| Landlord | granted (up to £150, Brightwell Plumbing, event 004) | email |

## Escalation & handover

- Escalation needed: **yes**
- Reason: The approved job has stalled: we have no working contact for the contractor and the leak is getting worse.
- Handover summary: The booking email to Brightwell bounced (event 006) and the tenant update failed (event 008). Brightwell is now assigned and the tenant has been emailed containment advice. Someone needs to phone Brightwell.
- Recommendation: Phone Brightwell today and send the booking again: 3 Kestrel Close, basin tap leak, tenant available Mon-Fri 9-5, approved up to £150. Correct their email address in the CRM and check the tenant email was delivered. If Brightwell can't come soon, ask the landlord for another plumber.

## What could not be verified

- Brightwell's correct email address or phone number
- Whether the tenant email (message 6) is actually delivered; there is no tenant email or phone stored in the CRM
- Whether the tenant has managed to stop the leak

## What failed

- Agent reported: Earlier failures (before my turn): the contractor booking bounced (event 006) and the tenant update was not sent (event 008)
- Agent reported: I did not message the contractor because there is no working address on file

## Risks & red flags

- The leak is getting worse and may cause water damage
- The tenant is unhappy after 3 days with no contact
- An outbound message may fail again

## Final result / next follow-up

- Final status: scheduling; on hold waiting on the agency; escalated (high priority)
- Next follow-up: 2026-10-05 - Check that Brightwell has been reached and the visit booked, and that the tenant got the email
- Confidence: 0.85

## Run metadata

- Case folder: `C:\Users\sahid\Documents\Projects\Hackathons\DwellyHack\dwelly-agent\data\hardcases\2`
- Session id: wrun_01M4JXE91E29VQQH2NMDGHFFY3
- Started: 2026-10-10T12:43:38.667Z  Finished: 2026-10-10T12:44:35.987Z  Duration: 57.3s
- Events recorded: 357
- Model(s): anthropic/claude-opus-5.5
- Tokens: in 135074 / out 5061; cost: not reported
