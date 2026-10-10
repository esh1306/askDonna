# Case 014 - Answer

## Decision

**escalate**

## Summary

I treated this as an emergency: Leah Venn has a mobility impairment, the heating has failed and her living room was down to 10°C. I escalated it as high priority (queue 30), assigned Brackenridge Heat Services under the landlord's confirmed £250 urgent-repair authority, and asked them to hold the 15 Jan 09:00–11:00 diagnostic slot. The slot is not confirmed yet. I also told Leah and the landlord where things stand. A duty manager needs to act tonight on interim heating or transport, because no spending authority covers it.

## Judgement

- **Case type:** safety_emergency
- **Why this decision:** No heating for a tenant with a mobility impairment at 10°C in January (events 3, 18) counts as an emergency under policy. The landlord explicitly confirmed that the standing authority covers the £168 diagnostic (event 14), so booking the earliest slot (event 19) is within authority. Interim heater or transport spending has no authority (events 7, 17), so that needs a human tonight.

| Alternative considered | Why not |
|---|---|
| Request a fresh landlord approval before booking | Approval is already on record (event 14), the landlord is travelling, and the slot had to be booked within minutes |
| Take the 17 Jan slot | Leah can't guarantee access because of a hospital appointment, and it is too late for a vulnerable tenant |
| Arrange a heater or transport myself | Not covered by any spending authority. That spend needs a human decision and landlord consent |

**Checks performed before acting**

- £168 diagnostic against the £250 incident limit
- Landlord's clarification in event 14 against his earlier quote-first email in event 10
- Tenant availability: 15 Jan possible, 17 Jan not
- Access and confidentiality restrictions (events 3, 4, 13)
- No gas smell or leak reported (event 3)

**Assumptions**

- The engineer is Gas Safe registered (Brackenridge is the heating contractor on the job)
- Messages reach recipients through the outbox despite missing contact details

## Actions taken

| # | Tool | Input (gist) | Result | Output (gist) |
|---|---|---|---|---|
| 1 | `get_ticket_context` | {"ticket_id":88} | ok | {"ok":true,"ticket":{"id":88,"case_ref":"R/014","property_id":82,"tenant_id":237,"landlord_id":238,"contractor_id":239,… |
| 2 | `classify_reply` | {"ticket_id":88,"text":"Cancellation appointment for 15 January, 09:00–11:00, available and can be held only if booked by 17:30. Same £168 … | ok | {"autonomy":"review","intent":"scheduling","intent_probs":{"quote_or_estimate":0,"invoice":0,"completion_report":0,"sch… |
| 3 | `recall_lessons` | {"ticket_id":88,"situation_text":"No heating, vulnerable tenant at 10°C indoors. Landlord standing £250 urgent authority covers £168 diagno… | ok | {"ok":true,"count":0,"lessons":[]} |
| 4 | `classify_intake` | {"ticket_id":88,"estimate_gbp":168,"text":"Heating failed, boiler display blank, hot water OK, no gas smell. Tenant has mobility impairment… | ok | {"route":"emergency_dispatch","scope":"maintenance_repair","scope_probs":{"maintenance_repair":0.94,"maintenance_admin"… |
| 5 | `escalate_to_human` | {"ticket_id":88,"reason":"Vulnerable tenant with no heating at 10°C; repair booked under landlord's urgent authority, but interim heating/t… | ok | {"ok":true,"queue_id":30} |
| 6 | `assign_contractor` | {"ticket_id":88,"contractor_name":"Daniel Hart","company":"Brackenridge Heat Services","reason":"Contractor already on the ticket. The land… | ok | {"ok":true,"contractor_id":250,"stage":"scheduling"} |
| 7 | `add_profile_fact` | {"entity_type":"contact","entity_id":238,"key":"urgent_repair_authority_gbp","value":"250 per urgent repair incident, including diagnostic,… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":104,"entity_type":"contact","entity_id":238,"key":"urgent_re… |
| 8 | `add_profile_fact` | {"entity_type":"contact","entity_id":237,"key":"access_requirements","value":"Needs extra time to answer the door. Attendees must call dire… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":105,"entity_type":"contact","entity_id":237,"key":"access_re… |
| 9 | `add_profile_fact` | {"entity_type":"contact","entity_id":237,"key":"vulnerability","value":"mobility impairment (agency-internal only; do not share with contra… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":103,"entity_type":"contact","entity_id":237,"key":"vulnerabi… |
| 10 | `send_message` | {"ticket_id":88,"to":"contractor","channel":"email","subject":"BOOK: 15 Jan 09:00–11:00 diagnostic, 7 Mallowmere Walk (R/014)","body":"Dear… | FAILED: Blocked by Jev outbound guard (message). commits_landlord_money (p=0.80): agrees a cost on the landlord's behalf: ask f… |  |
| 11 | `send_message` | {"ticket_id":88,"to":"tenant","channel":"sms","body":"Hi Leah, this is Northbridge Lettings about your heating at 7 Mallowmere Walk (ref R/… | FAILED: Blocked by Jev outbound guard (message). promises_specific_date_unconfirmed (p=0.75): promises a specific date/time not… |  |
| 12 | `send_message` | {"ticket_id":88,"to":"landlord","channel":"email","subject":"Heating failure at 7 Mallowmere Walk (R/014): diagnostic requested under your … | ok | {"ok":true,"message_id":69,"guard":{"blocked":false,"reasons":[],"probs":{"claims_work_done_unverified":0.29,"promises_… |
| 13 | `send_message` | {"ticket_id":88,"to":"contractor","channel":"email","subject":"Booking request: 15 Jan cancellation slot for diagnostic, 7 Mallowmere Walk … | FAILED: Blocked by Jev outbound guard (message). claims_work_done_unverified (p=0.73): claims work is done/booked/paid/approved… |  |
| 14 | `send_message` | {"ticket_id":88,"to":"tenant","channel":"sms","body":"Hi Leah, this is Northbridge Lettings about your heating at 7 Mallowmere Walk (ref R/… | ok | {"ok":true,"message_id":72,"guard":{"blocked":false,"reasons":[],"probs":{"claims_work_done_unverified":0.1,"promises_s… |
| 15 | `send_message` | {"ticket_id":88,"to":"contractor","channel":"email","subject":"Request: hold 15 Jan cancellation slot, 7 Mallowmere Walk (R/014)","body":"D… | ok | {"ok":true,"message_id":74,"guard":{"blocked":false,"reasons":[],"probs":{"claims_work_done_unverified":0.11,"promises_… |
| 16 | `place_hold` | {"ticket_id":88,"reason":"Waiting for Brackenridge to confirm the 15 Jan 09:00–11:00 diagnostic slot. If it's confirmed, tell Leah. If it's… | ok | {"ok":true,"hold_id":273} |

Agent's own account of its actions (from the structured result):

- `classify_reply` - Classified the contractor's slot offer -> Scheduling; review suggested (needs a human response p=0.84)
- `recall_lessons` - Looked for team lessons on similar cases -> No lessons found
- `classify_intake` - Classified the heating report -> Heating/hot water, severity emergency, safety risk p=0.81
- `escalate_to_human` - High-priority handover: vulnerable tenant at 10°C and no authority for interim heating or transport -> Queue item 30
- `assign_contractor` - Assigned Daniel Hart (Brackenridge Heat Services) under the landlord's urgent authority -> Assigned; stage moved to scheduling
- `add_profile_fact` - Landlord's urgent-repair authority: £250 per incident, excluding heaters, transport and accommodation -> Fact 104
- `add_profile_fact` - Tenant's access requirements -> Fact 105
- `add_profile_fact` - Tenant vulnerability: mobility impairment, internal only -> Fact 103
- `send_message` - Landlord email: diagnostic under his authority, booking awaiting confirmation, consent needed for interim costs -> Sent (message 69)
- `send_message` (FAILED) - Contractor email (first draft) -> Blocked by the guard: it committed the landlord's money
- `send_message` (FAILED) - Tenant SMS (first draft) -> Blocked by the guard: it promised an unconfirmed date
- `send_message` - Tenant SMS rewritten: slot requested but not yet confirmed, call-ahead arrangement, keep the heater off, duty manager will contact her tonight, 111/999 -> Sent (message 72)
- `send_message` (FAILED) - Contractor email (second draft) -> Blocked by the guard: it implied the booking was already approved
- `send_message` - Contractor email rewritten: hold the 15 Jan slot, fault details, access protocol, diagnosis only with a quote before further work -> Sent (message 74)
- `place_hold` - Waiting for the contractor to confirm the booking -> Hold 273, follow-up in 0.5 days

## Approvals

| Party | Status | Channel |
|---|---|---|
| Owen Pike (landlord) | granted (standing £250 urgent-repair authority, confirmed for the £168 diagnostic in event 14) | email |
| Owen Pike (landlord) | not yet requested; the duty manager will raise consent for interim heater or transport costs | email/call |

## Escalation & handover

- Escalation needed: **yes**
- Reason: Vulnerable tenant at 10°C with no safe heating, and no spending authority for an interim heater, transport or accommodation. The contractor booking is also time-critical.
- Handover summary: Brackenridge was assigned under the landlord's £250 urgent authority, and we asked them to hold the 15 Jan 09:00–11:00 diagnostic slot (£168). Their confirmation is pending, and the 17:30 cut-off may have been missed. Leah has a mobility impairment, no safe heater, and an unconfirmed option to stay at her niece's (step-free access not known). Access: a direct call with at least 30 minutes' notice, then a call from outside. The niece cannot give access, the agency holds no key, and no medical details go to contractors.
- Recommendation: Duty manager tonight: phone Daniel Hart to secure the slot; phone Leah to check on her welfare; arrange or fund a safe heater delivery or accessible transport and get the landlord's consent by phone; refer any repair cost above the £250 total to the landlord.

## What could not be verified

- Whether the 15 Jan slot was secured before the 17:30 cut-off
- Whether the niece's home is step-free
- Repair cost after diagnosis
- Whether the landlord will agree to interim heating or transport costs

## What failed

- Tool `send_message` failed: Blocked by Jev outbound guard (message). commits_landlord_money (p=0.80): agrees a cost on the landlord's behalf: ask for approval instead of committing. Rewrite the text to fix this and retry, or escalate_to_human if you cannot.
- Tool `send_message` failed: Blocked by Jev outbound guard (message). promises_specific_date_unconfirmed (p=0.75): promises a specific date/time not confirmed in the records: ask for availability or say it is to be confirmed. Rewrite the text to fix this and retry, or escalate_to_human if you cannot.
- Tool `send_message` failed: Blocked by Jev outbound guard (message). claims_work_done_unverified (p=0.73): claims work is done/booked/paid/approved without evidence in the records: rewrite without claiming completion; say only what is confirmed. Rewrite the text to fix this and retry, or escalate_to_human if you cannot.
- Agent reported: Three outbound drafts were blocked by the guard (two to the contractor, one to the tenant). All were rewritten and sent successfully.

## Risks & red flags

- Vulnerable tenant at 10°C and the temperature is falling
- Unsafe heater in the property
- The 17:30 booking cut-off may have been missed
- Leah can't attend on 17 Jan (hospital appointment), so the fallback slot doesn't work
- Repair costs may go over the £250 limit while the landlord is travelling

## Final result / next follow-up

- Final status: scheduling; high-priority escalation open (queue 30); hold 273 waiting for contractor confirmation
- Next follow-up: 2025-01-15 morning (hold 273, 0.5 days) - Confirm the Brackenridge booking and tell Leah. If the slot is lost, rebook urgently. Check the duty manager has dealt with interim heating.
- Confidence: 0.8

## Run metadata

- Case folder: `014`
- Session id: wrun_01M4K78X8XA7E7XKJ2YXBXZ9KR
- Started: 2026-10-10T15:35:28.669Z  Finished: 2026-10-10T15:36:47.280Z  Duration: 78.6s
- Events recorded: 724
- Model(s): anthropic/claude-opus-5.5
- Tokens: in 230238 / out 8924; cost: not reported
