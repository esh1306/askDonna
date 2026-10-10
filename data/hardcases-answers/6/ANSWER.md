# Case 6 - Answer

## Decision

**escalate**

## Summary

This is a life-safety emergency: at 23:41 the tenant reported a gas smell and the carbon monoxide alarm going off, with a toddler in the flat. I texted the tenant straight away telling them to get out, then escalated to the on-call team at high priority. After that I assigned the property's preferred gas engineer, Calder Heating, for emergency make-safe without the landlord's approval, under the emergency rule. The landlord, Ms Aziz, has been notified by a queued call asking her to approve. The emergency line and out-of-hours numbers still need a person to ring them.

## Judgement

- **Case type:** safety_emergency
- **Why this decision:** Event 001 is a gas and carbon monoxide emergency with a vulnerable child in the flat. The rules for emergencies require safety advice first, then a high-priority escalation, emergency dispatch and notifying the landlord, without waiting for approval. Approval was skipped because the landlord is usually unreachable overnight (event 002) and lives may be at risk.

| Alternative considered | Why not |
|---|---|
| Wait for landlord approval before dispatching | Life-safety risk; emergency work does not need approval, and she is usually unreachable overnight |
| Only escalate, without dispatching an engineer | Would delay the make-safe; the preferred engineer has an emergency line |

**Checks performed before acting**

- No existing approvals, holds or duplicate tickets
- Preferred gas engineer confirmed from event 002 and the property's profile
- Classification confirmed an emergency safety case
- Messages passed the outbound check

**Assumptions**

- The 0800 111 999 National Gas Emergency Service number is the standard UK public number, not taken from the case records
- Calder Heating is Gas Safe registered (not verified)

## Actions taken

| # | Tool | Input (gist) | Result | Output (gist) |
|---|---|---|---|---|
| 1 | `get_ticket_context` | {"ticket_id":69} | ok | {"ok":true,"ticket":{"id":69,"case_ref":"R/6","property_id":58,"tenant_id":180,"landlord_id":181,"contractor_id":null,"… |
| 2 | `send_message` | {"ticket_id":69,"to":"tenant","channel":"sms","body":"Flat 2, 5 Linden Terrace (ref R/6): ACT NOW. 1) Get your toddler and everyone out of … | ok | {"ok":true,"message_id":26,"guard":{"blocked":false,"reasons":[],"probs":{"claims_work_done_unverified":0.05,"promises_… |
| 3 | `escalate_to_human` | {"ticket_id":69,"reason":"Gas smell + CO alarm activated with toddler in property at 23:41 — life-safety emergency, needs a person on the p… | ok | {"ok":true,"queue_id":14} |
| 4 | `assign_contractor` | {"ticket_id":69,"contractor_name":"Calder Heating","reason":"Emergency: gas smell + CO alarm with toddler in property (event 001). Calder H… | FAILED: Contractor not assigned: No landlord approval or standing authority is on record for this ticket. Request approval with… |  |
| 5 | `recall_lessons` | {"ticket_id":69,"situation_text":"Overnight gas smell and CO alarm with toddler in property; landlord non-responsive overnight; emergency g… | ok | {"ok":true,"count":5,"lessons":[{"id":8,"situation":"A checkout-clean request was auto-paused because the property is v… |
| 6 | `classify_intake` | {"ticket_id":69} | ok | {"route":"emergency_dispatch","scope":"emergency_safety","scope_probs":{"maintenance_repair":0,"maintenance_admin":0,"c… |
| 7 | `request_landlord_approval` | {"ticket_id":69,"summary":"EMERGENCY at Flat 2, 5 Linden Terrace: gas smell and CO alarm sounding at 23:41, toddler in the flat. Tenant tol… | ok | {"ok":true,"approval_id":38,"message_id":32,"landlord":"Landlord (R/6)","guard":{"blocked":false,"reasons":[],"probs":{… |
| 8 | `assign_contractor` | {"ticket_id":69,"contractor_name":"Calder Heating","reason":"Emergency safety work: gas smell + CO alarm with toddler in flat (event 001), … | ok | {"ok":true,"contractor_id":198,"stage":"scheduling"} |
| 9 | `send_message` | {"ticket_id":69,"to":"contractor","channel":"email","subject":"EMERGENCY gas call-out – Flat 2, 5 Linden Terrace, Harrowby, ZZ7 3ZZ – ref R… | ok | {"ok":true,"message_id":40,"guard":{"blocked":false,"reasons":[],"probs":{"claims_work_done_unverified":0.13,"promises_… |
| 10 | `add_profile_fact` | {"entity_type":"contact","entity_id":180,"key":"household_has_young_child","value":"yes – toddler in household (vulnerable occupant for saf… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":55,"entity_type":"contact","entity_id":180,"key":"household_… |
| 11 | `add_profile_fact` | {"entity_type":"contact","entity_id":181,"key":"overnight_responsiveness","value":"historically non-responsive overnight; out-of-hours numb… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":56,"entity_type":"contact","entity_id":181,"key":"overnight_… |
| 12 | `place_hold` | {"ticket_id":69,"reason":"Emergency gas/CO: waiting for Calder Heating ETA/make-safe confirmation and landlord response (approval 38); on-c… | ok | {"ok":true,"hold_id":253} |

Agent's own account of its actions (from the structured result):

- `get_ticket_context` - Loaded ticket, profiles and events -> Two events; no approvals, holds or property history; no phone or email on the contact records
- `send_message` - Urgent safety SMS to the tenant: get everyone out, no switches or flames, open windows and turn off the gas meter only if safe, call the National Gas Emergency Service on 0800 111 999, call 999 if anyone has symptoms, don't go back in until told it is safe -> Queued (message 26), passed the message check
- `escalate_to_human` - High-priority handover to the on-call team -> Queue item 14
- `assign_contractor` (FAILED) - First attempt to assign Calder Heating -> Refused: no approval on record
- `recall_lessons` - Looked for past lessons on similar cases -> No relevant emergency lessons
- `classify_intake` - Classified the report -> Emergency safety case, severity emergency, safety risk 0.98
- `request_landlord_approval` - Queued a voice call to the landlord's out-of-hours number explaining the emergency and asking her to approve emergency attendance and make-safe; any further repair to be quoted first -> Approval 38 pending
- `assign_contractor` - Assigned Calder Heating for emergency make-safe under the emergency exception -> Contractor 198 assigned; stage is now scheduling
- `send_message` - Emergency email to Calder Heating: address, ref R/6, attend and make safe, quote before any further repair, contact the tenant for access, send us an ETA -> Queued (message 40)
- `add_profile_fact` - Recorded on the tenant's profile that there is a toddler in the household -> Fact 55
- `add_profile_fact` - Recorded on the landlord's profile that she usually doesn't respond overnight -> Fact 56
- `place_hold` - Hold while waiting for the engineer's ETA and the landlord's response, with a 6-hour follow-up -> Hold 253

## Approvals

| Party | Status | Channel |
|---|---|---|
| Landlord Ms R. Aziz | requested (approval 38). Not needed before acting, as this is emergency safety work | call |

## Escalation & handover

- Escalation needed: **yes**
- Reason: Gas smell and CO alarm with a toddler in the flat overnight: a life-safety emergency
- Handover summary: The tenant has been texted evacuation advice and the gas emergency number. Calder Heating is assigned and has been emailed. A call to the landlord asking for approval is queued. The tenant has no phone number on the CRM contact record.
- Recommendation: Phone the tenant now to confirm everyone is out and that 0800 111 999 (or 999) has been called; if you can't reach them, call on their behalf. Ring Calder Heating's emergency line (number in event 002) to confirm they will attend. Phone Ms Aziz on her out-of-hours number. Consider emergency accommodation if the gas is capped.

## What could not be verified

- Whether the tenant has received the SMS and left the flat
- Whether anyone has carbon monoxide symptoms
- Whether the National Gas Emergency Service has attended
- Whether Calder Heating will attend overnight, and the cost
- Whether the landlord will respond

## What failed

- Tool `assign_contractor` failed: Contractor not assigned: No landlord approval or standing authority is on record for this ticket. Request approval with request_landlord_approval (or record the landlord's clear answer with record_approval_response) before assigning a contractor or moving the job into scheduling, works or close-out.
- Agent reported: The first assign_contractor call was refused for lack of approval. It worked after the case was classified as an emergency and a landlord approval request was opened

## Risks & red flags

- Possible carbon monoxide poisoning with a young child in the flat
- Messages only go out through the outbox, and there are no direct contact details, so a person needs to phone people now
- The landlord is unlikely to respond overnight
- Gas safety certificate status is not visible on the file

## Final result / next follow-up

- Final status: Stage is scheduling, with Calder Heating assigned. On hold (253) waiting for the engineer and landlord. High-priority on-call item 14 is open.
- Next follow-up: 2026-10-10 ~05:41 UTC (6h), or sooner when the on-call team responds - Confirm the tenant is safe, get Calder Heating's ETA or make-safe outcome and the landlord's response; then ask for the gas safety certificate and a repair quote
- Confidence: 0.85

## Run metadata

- Case folder: `data/hardcases/6`
- Session id: wrun_01M4K15ESBAHBJHGE98NE5B83D
- Started: 2026-10-10T13:48:43.943Z  Finished: 2026-10-10T13:49:50.934Z  Duration: 67.0s
- Events recorded: 511
- Model(s): anthropic/claude-opus-5.5
- Tokens: in 131601 / out 6386; cost: not reported
