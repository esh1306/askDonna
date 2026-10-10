# Case PM037-1 - Answer

## Decision

**escalate**

## Summary

The landlord, Freya, replied "Please get the shower hose replaced." That answers our question in event 003: she wants us to organise the repair. So the answer to event 006 is that one short reply to her was needed, and I've sent it. I couldn't put the ticket back into auto mode, because it is at provider selection with no contractor and I have no tool to pick or book one. I've passed it to ops to choose a contractor (normal priority) and put a 1-day follow-up on it. The tenant has been sent interim advice and asked whether it's the hose or an electric cable.

## Actions taken

| # | Tool | Input (gist) | Result | Output (gist) |
|---|---|---|---|---|
| 1 | `get_ticket_context` | {"ticket_id":17} | ok | {"ok":true,"ticket":{"id":17,"case_ref":"R/PM037-1","property_id":16,"tenant_id":38,"landlord_id":39,"contractor_id":nu… |
| 2 | `classify_intake` | {"ticket_id":17} | ok | {"route":"emergency_dispatch","category":"plumbing","category_probs":{"plumbing":1,"appliance":0,"doors_windows_locks":… |
| 3 | `add_profile_fact` | {"entity_type":"contact","entity_id":39,"key":"repair_arrangement_preference","value":"agency_to_organise (instructed agency to replace sho… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":34,"entity_type":"contact","entity_id":39,"key":"repair_arra… |
| 4 | `send_message` | {"ticket_id":17,"to":"landlord","channel":"email","subject":"Shower hose replacement – Flat 14, 44 Lantern Quay (R/PM037-1)","body":"Hi Fre… | ok | {"ok":true,"message_id":23} |
| 5 | `send_message` | {"ticket_id":17,"to":"tenant","channel":"email","subject":"Shower leak – Flat 14, 44 Lantern Quay (R/PM037-1)","body":"Hi Eliza,\n\nThanks … | ok | {"ok":true,"message_id":24} |
| 6 | `escalate_to_human` | {"ticket_id":17,"reason":"Landlord has told us to organise the job, but no contractor is assigned and I have no way to pick or book one. Th… | FAILED: database is locked |  |
| 7 | `escalate_to_human` | {"ticket_id":17,"reason":"Landlord has told us to organise the job, but no contractor is assigned and I have no way to pick or book one. Th… | ok | {"ok":true,"queue_id":6} |
| 8 | `place_hold` | {"ticket_id":17,"reason":"Waiting for ops to assign a contractor for the shower hose replacement, and for the tenant's photos to confirm ho… | ok | {"ok":true,"hold_id":45} |

Agent's own account of its actions (from the structured result):

- `get_ticket_context` - Loaded the ticket -> 7 events, no attachments, approvals, holds or facts
- `classify_intake` - Classified the report -> Plumbing; severity emergency 0.96, safety risk 0.69. I treated this as evidence only: a leaking hose can be contained, so I judged it routine to urgent unless it turns out to be an electric shower cable
- `add_profile_fact` - Recorded on the landlord's profile that she wants the agency to organise this repair (event 007) -> fact 34 saved
- `send_message` - Emailed the landlord: we'll organise the hose replacement, no price yet, and we'll ask again if the job grows -> message 23 queued
- `send_message` - Emailed the tenant: interim containment and electrical safety advice, plus a request for photos and to confirm hose or cable -> message 24 queued
- `escalate_to_human` (FAILED) - First try at the handover -> Error: database is locked
- `escalate_to_human` - Tried again: handover to ops to assign a contractor -> queue item 6
- `place_hold` - Hold waiting on ops (agency) for a contractor and on the tenant's photos -> hold 45, follow-up in 1 day

## Approvals

| Party | Status | Channel |
|---|---|---|
| Landlord (Freya) | granted: instruction by email to replace the shower hose (event 007); no cost agreed | email |

## Escalation & handover

- Escalation needed: **yes**
- Reason: Landlord has told us to organise the job, but no contractor is assigned and I can't pick or book one. Hose vs electric cable also needs checking.
- Handover summary: Landlord said by email (event 007) to replace the shower hose. I've acknowledged this to her and sent the tenant safety advice. There is no contractor, no quote and no photos yet.
- Recommendation: Assign a plumber for the hose replacement and move the ticket to scheduling. Switch to an electrician and urgent priority if it is an electric shower cable. Go back to the landlord if the quote is more than a routine hose replacement.

## What could not be verified

- Whether the fault is the flexible shower hose or an electric shower power cable
- Cost of the repair
- Whether the outbox messages will be delivered: no email or phone is on file for the tenant or landlord
- The tenant's name ("Eliza") comes only from our earlier email

## What failed

- Tool `escalate_to_human` failed: database is locked
- Agent reported: escalate_to_human failed the first time with 'database is locked'; it worked on the second try

## Risks & red flags

- The report says "cable" but the landlord says "hose": if it is an electric shower, a leak near the electrics is dangerous
- The classifier flagged the case as an emergency
- Water could get through to the flat below if the leak is not contained

## Final result / next follow-up

- Final status: provider_selection, on hold waiting on the agency (hold 45); ops queue item 6 open
- Next follow-up: In 1 day (hold 45) - Check a contractor has been assigned and whether the tenant has sent photos; move to scheduling once a contractor is confirmed
- Confidence: 0.78

## Run metadata

- Case folder: `C:\Users\sahid\Documents\Projects\Hackathons\DwellyHack\dwelly-agent\data\practice\cases\PM037-1`
- Session id: wrun_01M4JSYNBVG6CBZ6W4G5N5PCMT
- Started: 2026-10-10T11:42:41.432Z  Finished: 2026-10-10T11:43:44.501Z  Duration: 63.1s
- Events recorded: 434
- Model(s): anthropic/claude-opus-5.5
- Tokens: in 94528 / out 5457; cost: not reported
