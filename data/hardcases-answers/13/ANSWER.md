# Case 13 - Answer

## Decision

**escalate**

## Summary

I've treated this as an emergency and escalated it to the team as high priority. Mr Finch is 84, has a heart condition and lives alone. He has had no heating or hot water since 6 October, overnight temperatures are around 3C, and he now says he feels dizzy. The landlord hasn't answered three emails and is away until 20 October. Once the case was escalated, I booked Calder Heating to attend urgently without landlord approval. I sent Mr Finch safety advice, including to call NHS 111 now and 999 if he gets worse, and queued a phone call to the landlord's mobile to explain and ask approval for up to £200.

## Judgement

- **Case type:** safety_emergency
- **Why this decision:** Event 001: Mr Finch is 84, lives alone and has a heart condition. His heating and hot water stopped on 6 October and overnight temperatures are around 3C. Events 002–005: the landlord got three emails with no reply and is away until 20 October. Event 006: the tenant now feels dizzy. This fits the emergency rule for no heating for a vulnerable tenant in cold weather. The classifiers agreed: severity emergency 1.0, safety risk 0.93, safety concern in the tenant's SMS 0.9. Approval can't block emergency safety work, so I escalated as high priority first and then booked the engineer. I recorded the reason in the escalation and in the assignment.

| Alternative considered | Why not |
|---|---|
| Keep waiting for the landlord and chase again (lessons #15 and #23) | Those lessons are for routine jobs. Here a vulnerable tenant with a heart condition is in a cold home and has symptoms, so waiting until 20 October risks his health. |
| Only escalate, without booking an engineer | That leaves him without heat until a person picks it up. The rules say to book urgent attendance and escalate at the same time. |
| Send another email to the landlord | Email isn't reaching them because of the out-of-office. I queued a call to the mobile number on file instead. |

**Checks performed before acting**

- Approvals: none on record, no pre-approved limit and no standing authority
- Contractor: none on the ticket and no jobs at this property before; found heating contractors to choose from
- Safety: elderly tenant with a heart condition, dizziness, about 3C overnight, no heating or hot water
- Landlord contactability: out-of-office until 20 October; mobile number in event 005 with no call recorded
- Classified the tenant SMS and the request
- Checked team lessons: #15 and #23 apply to routine jobs only, so I didn't follow them

**Assumptions**

- The £200 estimate from event 002 is a reasonable cap for emergency attendance
- The landlord mobile in event 005 is current
- Calder Heating can do boiler work (chosen because its name matches heating; no history at this property)

## Actions taken

| # | Tool | Input (gist) | Result | Output (gist) |
|---|---|---|---|---|
| 1 | `get_ticket_context` | {"ticket_id":71} | ok | {"ok":true,"ticket":{"id":71,"case_ref":"R/13","property_id":65,"tenant_id":184,"landlord_id":185,"contractor_id":null,… |
| 2 | `recall_lessons` | {"ticket_id":71,"situation_text":"Elderly vulnerable tenant (84, heart condition) with no heating or hot water in cold weather, now feels d… | ok | {"ok":true,"count":5,"lessons":[{"id":23,"situation":"A minor maintenance request (a sticking, creaking door with misal… |
| 3 | `classify_reply` | {"ticket_id":71,"text":"Still no heating. I am wearing my coat indoors and feel a bit dizzy. Don't want to bother anyone.","sender_role":"t… | ok | {"autonomy":"review","intent":"still_broken","intent_probs":{"confirms_fixed":0,"still_broken":1,"access_or_availabilit… |
| 4 | `classify_intake` | {"ticket_id":71,"estimate_gbp":200,"text":"No heating or hot water since 6 Oct, boiler display blank. Tenant 84, lives alone, heart conditi… | ok | {"route":"emergency_dispatch","scope":"maintenance_repair","scope_probs":{"maintenance_repair":0.72,"maintenance_admin"… |
| 5 | `escalate_to_human` | {"ticket_id":71,"reason":"Emergency: 84-year-old tenant with heart condition, no heating/hot water for 3+ days in cold weather, now reports… | ok | {"ok":true,"queue_id":16} |
| 6 | `find_contractors` | {"ticket_id":71,"trade":"gas engineer","text":"Emergency boiler fault, no heating or hot water, boiler display blank, vulnerable elderly te… | ok | {"ok":true,"category":"heating_hot_water","contractors":[{"contact_id":162,"name":"Calder Heating","company":"Calder He… |
| 7 | `assign_contractor` | {"ticket_id":71,"contractor_name":"Calder Heating","company":"Calder Heating","reason":"Emergency (escalated high, queue 16): vulnerable 84… | ok | {"ok":true,"contractor_id":162,"stage":"scheduling"} |
| 8 | `send_message` | {"ticket_id":71,"to":"contractor","channel":"email","subject":"EMERGENCY attendance – no heating/hot water – 6 Primrose Court, Oldacre ZZ2 … | ok | {"ok":true,"message_id":37,"guard":{"blocked":false,"reasons":[],"probs":{"claims_work_done_unverified":0.05,"promises_… |
| 9 | `send_message` | {"ticket_id":71,"to":"tenant","channel":"sms","body":"Mr Finch, this is Donna from the lettings agency about your heating at 6 Primrose Cou… | ok | {"ok":true,"message_id":38,"guard":{"blocked":false,"reasons":[],"probs":{"claims_work_done_unverified":0.25,"promises_… |
| 10 | `request_landlord_approval` | {"ticket_id":71,"summary":"Emergency boiler repair at 6 Primrose Court (R/13). Elderly tenant has had no heating or hot water since 6 Oct a… | ok | {"ok":true,"approval_id":39,"message_id":39,"landlord":"Landlord (R/13)","guard":{"blocked":false,"reasons":[],"probs":… |
| 11 | `add_profile_fact` | {"entity_type":"contact","entity_id":184,"key":"vulnerability","value":"Aged 84, lives alone, heart condition, uses a walking frame; daught… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":64,"entity_type":"contact","entity_id":184,"key":"vulnerabil… |
| 12 | `add_profile_fact` | {"entity_type":"contact","entity_id":185,"key":"email_unresponsive_away_until","value":"Out-of-office: away until 20 Oct 2026, limited emai… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":65,"entity_type":"contact","entity_id":185,"key":"email_unre… |
| 13 | `place_hold` | {"ticket_id":71,"reason":"Emergency dispatch: waiting for Calder Heating to confirm an arrival time today. If there's no reply, switch to H… | ok | {"ok":true,"hold_id":256} |

Agent's own account of its actions (from the structured result):

- `get_ticket_context` - Loaded the ticket -> Stage was intake; no approvals, holds, contractor or property history
- `recall_lessons` - Checked how the team handled similar cases -> Lessons #15 and #23 are for routine jobs; I didn't follow them because this is an emergency
- `classify_reply` - Classified the tenant SMS from event 006 -> Still broken; safety concern 0.9; needs a person to check (review)
- `classify_intake` - Classified the job -> Heating and hot water; severity emergency; route emergency_dispatch
- `escalate_to_human` - Escalated to the team as high priority: emergency, vulnerable tenant, landlord can't be reached -> Queue item 16
- `find_contractors` - Searched for a gas or heating engineer -> Calder Heating and Harlow Heating
- `assign_contractor` - Assigned Calder Heating for emergency work without landlord approval (reason recorded) -> Ticket moved to scheduling
- `send_message` - Emailed Calder Heating: emergency job details, tenant's needs, £200 limit and a request for their arrival time -> Message 37 queued
- `send_message` - Texted Mr Finch: engineer requested, NHS 111 and 999 advice, how to keep warm, colleague will ring -> Message 38 queued
- `request_landlord_approval` - Queued a phone call to the landlord's mobile explaining the emergency work and asking approval up to £200 -> Approval 39 pending
- `add_profile_fact` - Recorded Mr Finch's vulnerability on his profile -> Fact 64
- `add_profile_fact` - Recorded that the landlord is away until 20 October and not answering email -> Fact 65
- `place_hold` - Put the ticket on hold while waiting for Calder Heating's arrival time, with a 6-hour follow-up -> Hold 256

## Approvals

| Party | Status | Channel |
|---|---|---|
| Landlord (R/13) | requested (approval 39 pending, emergency work proceeding without it) | call |

## Escalation & handover

- Escalation needed: **yes**
- Reason: Emergency: vulnerable 84-year-old with a heart condition, no heating or hot water in cold weather, now dizzy; landlord can't be reached
- Handover summary: Queue item 16. Calder Heating has been asked to attend urgently, the tenant has been sent safety and NHS 111/999 advice, and a call to the landlord is queued (approval 39). Still needed: a welfare call to the tenant, confirmation the engineer is attending today, and a backup engineer if Calder can't come.
- Recommendation: Phone Mr Finch now; call 999 if he is getting worse. Make sure an engineer attends today; use Harlow Heating if Calder can't. Phone the landlord on 07700 900456. Consider a welfare check, contacting his next of kin, and temporary heaters.

## What could not be verified

- Mr Finch's current health
- Whether Calder Heating can attend today
- Cause of the fault and the final cost
- Whether the landlord's mobile number is current
- How the engineer will get in

## What failed

_No failures recorded._

## Risks & red flags

- Dizziness in an 84-year-old with a heart condition, in a cold home
- He is reluctant to ask for help, so he may not report it if he gets worse
- There is no visible record of anyone checking on him, or of help with heating, since 6 October
- The landlord hasn't approved yet; the work is going ahead without approval on emergency grounds

## Final result / next follow-up

- Final status: scheduling – emergency engineer requested, on hold waiting for Calder Heating's arrival time; escalated as high priority (queue item 16)
- Next follow-up: Within 6 hours (hold 256) - Confirm Calder Heating's arrival time and tell Mr Finch. If Calder hasn't replied, use Harlow Heating. Check on the landlord call (approval 39).
- Confidence: 0.85

## Run metadata

- Case folder: `data/hardcases/13`
- Session id: wrun_01M4K15ERNFE7V4HEDZK1H5VD1
- Started: 2026-10-10T13:48:43.943Z  Finished: 2026-10-10T13:49:57.383Z  Duration: 73.4s
- Events recorded: 503
- Model(s): anthropic/claude-opus-5.5
- Tokens: in 160612 / out 6907; cost: not reported
