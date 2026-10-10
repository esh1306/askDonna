# Case PM010-1 - Answer

## Decision

**request_info**

## Summary

This is a routine admin task: every 3 months the tenant has to send a photo of the solar panel readings for the landlord. The tenant's latest email (17 Jan, event 012) only had their signature in it and no photo is visible. I emailed the tenant to say no photo came through and asked them to send it again. I put the ticket on hold for 7 days so it gets chased. No escalation or landlord approval is needed.

## Judgement

- **Case type:** maintenance_admin
- **Why this decision:** The tenant agreed by phone on 13 Jan (event 008) to send the photo. The agency chased by email on 17 Jan (event 010). Three minutes later the tenant replied (event 012), but the reply only contains a signature and the ticket has no attachments. The photo most likely failed to attach. The tenant is the only person who can fix this, so the right step is to ask them to resend it and hold the ticket.

| Alternative considered | Why not |
|---|---|
| no_action (treat the reply as noise) | The tenant probably thinks the photo was sent. If we stay silent, the task would stall with nobody chasing it. |
| escalate_to_human | There is no conflict, safety issue or cost decision, and the tenant can sort this out. The classifier's 'review' flag is covered by a direct reply to the tenant. |
| Move the stage forward | This is a recurring admin task with no repair or contractor, so moving it through repair stages wouldn't make sense. |

**Checks performed before acting**

- Loaded the ticket context: no attachments, no open holds before this action, no approvals, no profile facts
- Ran classify_reply on event 012: intent 'other' 0.98, autonomy 'review', safety concern 0.01
- Checked the ticket for any attachment from the tenant: none visible
- Checked for duplicates and for any cost or approval involved: none

**Assumptions**

- Miles Fletcher, who signed event 012, is the tenant
- The empty reply was meant to include the photo

## Actions taken

| # | Tool | Input (gist) | Result | Output (gist) |
|---|---|---|---|---|
| 1 | `get_ticket_context` | {"ticket_id":19} | ok | {"ok":true,"ticket":{"id":19,"case_ref":"R/PM010-1","property_id":15,"tenant_id":49,"landlord_id":50,"contractor_id":nu… |
| 2 | `classify_reply` | {"ticket_id":19,"text":"Thanks & Regards, Miles Fletcher, 07700 900978","sender_role":"tenant","context":"Agency asked tenant (emails 11 Ja… | ok | {"autonomy":"review","intent":"other","intent_probs":{"confirms_fixed":0,"still_broken":0,"access_or_availability":0.01… |
| 3 | `send_message` | {"ticket_id":19,"to":"tenant","channel":"email","subject":"Solar panel readings photo – Flat 10, 180 Alder Lane (ref R/PM010-1)","body":"De… | ok | {"ok":true,"message_id":23,"guard":{"blocked":false,"reasons":[],"probs":{"claims_work_done_unverified":0.06,"promises_… |
| 4 | `place_hold` | {"ticket_id":19,"reason":"Awaiting tenant's solar panel readings photo; tenant's 17 Jan reply (event 012) contained only a signature, no vi… | ok | {"ok":true,"hold_id":49} |
| 5 | `add_profile_fact` | {"entity_type":"property","entity_id":15,"key":"solar_panel_readings_requirement","value":"Landlord requires solar panel readings with phot… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":23,"entity_type":"property","entity_id":15,"key":"solar_pane… |
| 6 | `add_profile_fact` | {"entity_type":"contact","entity_id":49,"key":"phone","value":"07700 900978 (from email signature, Miles Fletcher)","source_ref":"event 012… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":24,"entity_type":"contact","entity_id":49,"key":"phone","val… |

Agent's own account of its actions (from the structured result):

- `get_ticket_context` - Loaded the full case context -> 12 events, no attachments, no holds, no approvals
- `classify_reply` - Classified the tenant's reply in event 012 -> intent other (0.98), autonomy review, no safety concern
- `send_message` - Emailed the tenant to say no photo is visible and asked them to resend a clear photo of the meter reading. The email says we will follow up on 24 Jan. -> Message 23 placed in the outbox. Guard did not block it.
- `place_hold` - Hold waiting on the tenant for the photo, with a 7-day follow-up -> hold_id 49
- `add_profile_fact` - Recorded on the property that solar readings with a photo are needed every 3 months -> fact 23
- `add_profile_fact` - Recorded the tenant's phone number from their email signature -> fact 24

## Approvals

| Party | Status | Channel |
|---|---|---|
| Landlord | not_needed | n/a |

## Escalation & handover

- Escalation needed: **no**
- Reason: Routine admin task the tenant can resolve

## What could not be verified

- Whether the tenant actually tried to attach a photo: none is visible in the records
- Event 008 describes the person on the call as 'the caller from Oakfield Compliance' even though the call was logged as going to the tenant. This is likely a logging mistake and doesn't affect the next step.
- The tenant's name and phone number come only from an email signature

## What failed

_No failures recorded._

## Risks & red flags

- The original note said the next reading was due mid-June, but the agency started asking in January. Someone should confirm the actual reading schedule before the next cycle.

## Final result / next follow-up

- Final status: Open, on hold waiting for the tenant to resend the solar readings photo (hold 49)
- Next follow-up: 2025-01-24 - If no photo has arrived, chase the tenant, by phone if email still doesn't work. Once it arrives, forward the reading to the landlord.
- Confidence: 0.85

## Run metadata

- Case folder: `C:\Users\sahid\Documents\Projects\Hackathons\DwellyHack\dwelly-agent\data\practice\cases\PM010-1`
- Session id: wrun_01M4JY72KD9Z3GP2VSGSY8BW1M
- Started: 2026-10-10T12:57:11.473Z  Finished: 2026-10-10T12:57:43.642Z  Duration: 32.2s
- Events recorded: 165
- Model(s): anthropic/claude-opus-5.5
- Tokens: in 62608 / out 3388; cost: not reported
