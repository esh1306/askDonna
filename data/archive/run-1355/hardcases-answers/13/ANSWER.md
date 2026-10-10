# Case 13 - Answer

## Decision

**escalate**

## Summary

An 84-year-old tenant who lives alone with a heart condition has had no heating or hot water for over 3 days in cold weather, and now feels dizzy. The landlord hasn't replied to 3 emails and is away until 20 Oct. I treated this as emergency safety work, which landlord approval does not block. I texted the tenant with safety advice, texted the landlord's mobile, and escalated to ops at high priority for a welfare call and same-day engineer dispatch. I moved the stage to provider_selection, recorded profile facts, and set a 6-hour follow-up.

## Judgement

- **Case type:** safety_emergency
- **Why this decision:** Under emergency rules, a vulnerable tenant with no heating in cold weather is an emergency, and approval does not block safety work. Event 006's dizziness adds a possible medical risk. Classifiers: severity emergency 1.0, safety 0.94, reply needs a human 0.95. I couldn't assign a contractor because none is on the ticket or in the property history, so dispatch and the welfare call need a human. Two chases have passed with no landlord reply, which is also a reason to escalate.

| Alternative considered | Why not |
|---|---|
| Keep waiting for landlord approval | Landlord is away until 20 Oct; the tenant's health is at risk now. |
| Assign a contractor myself | No contractor is named in the records, and inventing one would break the rules. Ops must pick a Gas Safe engineer. |
| Request approval again by call | Approval isn't needed for emergency work, and a pending approval could look like a blocker. I texted the landlord's mobile instead and asked ops to call. |

**Checks performed before acting**

- Loaded full ticket context: no holds, approvals, contractor or property history
- Classified the tenant SMS (review, safety 0.87) and the intake (emergency, emergency_dispatch)
- Confirmed there is no pre-approved spend limit on the landlord's profile
- Landlord was emailed 3 times and sent an out-of-office (event 005)
- Outbound guard blocked the first landlord SMS; I rewrote it to remove the implied booking and resent it successfully

**Assumptions**

- The estimate of up to £200 (event 002) is still a reasonable figure for the emergency call-out
- The landlord's mobile in event 005 is current

## Actions taken

| # | Tool | Input (gist) | Result | Output (gist) |
|---|---|---|---|---|
| 1 | `get_ticket_context` | {"ticket_id":65} | ok | {"ok":true,"ticket":{"id":65,"case_ref":"R/13","property_id":65,"tenant_id":172,"landlord_id":173,"contractor_id":null,… |
| 2 | `classify_reply` | {"ticket_id":65,"text":"Still no heating. I am wearing my coat indoors and feel a bit dizzy. Don't want to bother anyone.","sender_role":"t… | ok | {"autonomy":"review","intent":"still_broken","intent_probs":{"confirms_fixed":0,"still_broken":1,"access_or_availabilit… |
| 3 | `classify_intake` | {"ticket_id":65,"estimate_gbp":200,"text":"84-year-old tenant living alone with heart condition and walking frame: heating and hot water st… | ok | {"route":"emergency_dispatch","scope":"maintenance_repair","scope_probs":{"maintenance_repair":0.66,"maintenance_admin"… |
| 4 | `send_message` | {"ticket_id":65,"to":"tenant","channel":"sms","body":"Mr Finch, this is Donna from the lettings agency about your heating at 6 Primrose Cou… | ok | {"ok":true,"message_id":20,"guard":{"blocked":false,"reasons":[],"probs":{"claims_work_done_unverified":0.47,"promises_… |
| 5 | `send_message` | {"ticket_id":65,"to":"landlord","channel":"sms","body":"Urgent, 6 Primrose Court, Oldacre (ref R/13): the heating and hot water have been o… | FAILED: Blocked by Jev outbound guard (message). claims_work_done_unverified (p=0.74): claims work is done/booked/paid/approved… |  |
| 6 | `send_message` | {"ticket_id":65,"to":"landlord","channel":"sms","body":"Urgent, 6 Primrose Court, Oldacre (ref R/13): the heating and hot water have been o… | ok | {"ok":true,"message_id":23,"guard":{"blocked":false,"reasons":[],"probs":{"claims_work_done_unverified":0.52,"promises_… |
| 7 | `escalate_to_human` | {"ticket_id":65,"reason":"Emergency: 84-year-old tenant with a heart condition has had no heating or hot water for over 3 days, now feels d… | ok | {"ok":true,"queue_id":12} |
| 8 | `move_stage` | {"ticket_id":65,"to":"provider_selection","reason":"Emergency heating failure for vulnerable 84yo tenant (events 001, 006). Landlord unreac… | ok | {"ok":true,"from":"intake","to":"provider_selection","status":"open"} |
| 9 | `add_profile_fact` | {"entity_type":"contact","entity_id":172,"key":"vulnerability","value":"Aged 84, lives alone, heart condition, uses walking frame; daughter… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":47,"entity_type":"contact","entity_id":172,"key":"vulnerabil… |
| 10 | `add_profile_fact` | {"entity_type":"contact","entity_id":173,"key":"email_unresponsive_away_until","value":"Out-of-office: away until 20 Oct 2026 with limited … | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":48,"entity_type":"contact","entity_id":173,"key":"email_unre… |
| 11 | `place_hold` | {"ticket_id":65,"reason":"Ops need to do an urgent welfare call and send an emergency heating engineer. Check that both have happened and l… | ok | {"ok":true,"hold_id":249} |

Agent's own account of its actions (from the structured result):

- `classify_reply` - Classified the tenant SMS from event 006 -> still_broken, review, safety 0.87, needs human 0.95
- `classify_intake` - Classified the overall issue -> heating_hot_water, emergency, emergency_dispatch, safety 0.94
- `send_message` - SMS to tenant: told him he's not a bother and the team will call; 999/111 advice for dizziness; gas emergency advice; tips for keeping warm -> sent, message_id 20
- `send_message` (FAILED) - First SMS to landlord -> blocked by guard (claims_work_done_unverified)
- `send_message` - Rewritten SMS to landlord: emergency repair notice, estimate up to £200, asked him to call back -> sent, message_id 23
- `escalate_to_human` - High-priority handover: welfare call, emergency Gas Safe dispatch, call landlord -> queue_id 12
- `move_stage` - intake → provider_selection (emergency work, approval not blocking) -> ok
- `add_profile_fact` - Tenant vulnerability fact -> fact 47
- `add_profile_fact` - Landlord away until 20 Oct and unresponsive to email; use mobile -> fact 48
- `place_hold` - Waiting on agency for welfare call and dispatch; follow up in 6 hours -> hold 249

## Approvals

| Party | Status | Channel |
|---|---|---|
| Landlord | not_needed (emergency safety work); requested 6 Oct and chased twice by email with no reply | email, then SMS notification |

## Escalation & handover

- Escalation needed: **yes**
- Reason: Vulnerable 84-year-old tenant has had no heating for 3+ days, now feels dizzy, and the landlord can't be reached
- Handover summary: 6 Primrose Court R/13: Mr Finch (84, heart condition, walking frame, lives alone) has had no heating or hot water since 6 Oct and is now dizzy. Landlord is away until 20 Oct and silent after 3 emails. Tenant and landlord have been texted. No contractor is on file.
- Recommendation: Phone the tenant now for a welfare check and push 999/111 if he is still dizzy. Send a Gas Safe engineer today as emergency work, within about £200. Supply temporary heaters if needed. Phone the landlord on 07700 900456. Consider a welfare referral and contacting his daughter.

## What could not be verified

- Cause of the dizziness (cold, his heart condition or CO)
- Whether a CO alarm is fitted
- Tenant's phone number and the daughter's contact details are not visible in the CRM
- Whether the landlord has seen the SMS

## What failed

- Tool `send_message` failed: Blocked by Jev outbound guard (message). claims_work_done_unverified (p=0.74): claims work is done/booked/paid/approved without evidence in the records: rewrite without claiming completion; say only what is confirmed. Rewrite the text to fix this and retry, or escalate_to_human if you cannot.
- Agent reported: First landlord SMS was blocked by the outbound guard; rewritten and resent successfully

## Risks & red flags

- Vulnerable elderly tenant with a heart condition, cold-related health risk, and dizziness reported
- Tenant under-reports ('don't want to bother anyone')
- No contractor dispatched in 3.5 days
- Landlord unreachable until 20 Oct

## Final result / next follow-up

- Final status: provider_selection; escalated high (queue 12); hold 249 waiting on agency
- Next follow-up: In 6 hours (hold 249) - Check that the welfare call happened and an emergency engineer was sent; log the landlord call outcome
- Confidence: 0.88

## Run metadata

- Case folder: `C:\Users\sahid\Documents\Projects\Hackathons\DwellyHack\dwelly-agent\data\hardcases\13`
- Session id: wrun_01M4JXHCY57CZRMV6612F212BF
- Started: 2026-10-10T12:45:21.144Z  Finished: 2026-10-10T12:46:19.514Z  Duration: 58.4s
- Events recorded: 463
- Model(s): anthropic/claude-opus-5.5
- Tokens: in 115820 / out 6115; cost: not reported
