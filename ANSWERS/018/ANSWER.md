# Case 018 - Answer

## Decision

**escalate**

## Summary

The landlord is arranging the rat treatment and proofing himself, and the proofing has stalled. Pest control finished on 7 Sept, but the proofing contractor didn't turn up on 8 Sept, and two waiting periods have passed with no word from the landlord. I emailed the landlord asking for the contractor's name, a new date and the pest report. I texted the tenant an update and placed a 2-day hold. I also escalated to the human queue at normal priority, recommending a phone call to the landlord, because the deadlines have passed twice, the tenant sounds unhappy and there's a health risk.

## Judgement

- **Case type:** maintenance
- **Why this decision:** Two waiting periods have passed (ev 15, 18) with no landlord update, which meets the escalation rule. The tenant reports the contractor didn't attend (ev 17), and the classifier flags her message as a likely complaint. Rats getting into the kitchen is a health issue. The landlord hadn't been contacted in writing since 18 Aug, so I chased him myself as well as escalating.

| Alternative considered | Why not |
|---|---|
| Keep waiting without escalating | The deadlines have already passed twice and the tenant is unhappy |
| Instruct a Northbridge contractor | The landlord chose to arrange the works himself, and there's no approval or spend limit on record |
| Treat as an emergency | Pest treatment has been done, and this isn't one of the listed emergency types |

**Checks performed before acting**

- Approvals and holds: none on file
- No pest report or completion evidence visible
- Scope differs between accounts (under-sink openings in ev 10 vs wall work in ev 14)
- No spend limit on record

**Assumptions**

- The landlord is still responsible for arranging the proofing

## Actions taken

| # | Tool | Input (gist) | Result | Output (gist) |
|---|---|---|---|---|
| 1 | `get_ticket_context` | {"ticket_id":92} | ok | {"ok":true,"ticket":{"id":92,"case_ref":"R/018","property_id":86,"tenant_id":248,"landlord_id":249,"contractor_id":null… |
| 2 | `recall_lessons` | {"ticket_id":92,"situation_text":"Landlord arranging pest control/proofing works directly; two waiting periods expired without landlord upd… | ok | {"ok":true,"count":0,"lessons":[]} |
| 3 | `classify_reply` | {"ticket_id":92,"text":"Nobody has attended this morning to fill the openings, despite contractors being expected. I'm at work; phone is mo… | ok | {"autonomy":"review","intent":"complaint","intent_probs":{"confirms_fixed":0,"still_broken":0.04,"access_or_availabilit… |
| 4 | `classify_intake` | {"ticket_id":92} | ok | {"route":"request_landlord_approval","scope":"maintenance_repair","scope_probs":{"maintenance_repair":1,"maintenance_ad… |
| 5 | `send_message` | {"ticket_id":92,"to":"landlord","channel":"email","subject":"Rat activity – proofing works update needed – 14 Mosswold Crescent (ref R/018)… | ok | {"ok":true,"message_id":71,"guard":{"blocked":false,"reasons":[],"probs":{"claims_work_done_unverified":0.07,"promises_… |
| 6 | `send_message` | {"ticket_id":92,"to":"tenant","channel":"sms","body":"Hi Elise, Northbridge Lettings here about the rats at 14 Mosswold Crescent (ref R/018… | ok | {"ok":true,"message_id":70,"guard":{"blocked":false,"reasons":[],"probs":{"claims_work_done_unverified":0.1,"promises_s… |
| 7 | `place_hold` | {"ticket_id":92,"reason":"Waiting on landlord to name the proofing contractor and give a rearranged date (chased 11 Sept, message 71). Tena… | ok | {"ok":true,"hold_id":274} |
| 8 | `escalate_to_human` | {"ticket_id":92,"reason":"Landlord-arranged rat proofing has stalled: two waiting periods have passed with no landlord update, the contract… | ok | {"ok":true,"queue_id":33} |
| 9 | `add_profile_fact` | {"entity_type":"contact","entity_id":248,"key":"preferred_channel","value":"call (at work in the daytime; phone easier than email)","source… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":114,"entity_type":"contact","entity_id":248,"key":"preferred… |
| 10 | `add_profile_fact` | {"entity_type":"property","entity_id":86,"key":"has_pets","value":"yes - small dog (consider when baiting)","source_ref":"event 001 (tenant… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":115,"entity_type":"property","entity_id":86,"key":"has_pets"… |
| 11 | `add_profile_fact` | {"entity_type":"property","entity_id":86,"key":"pest_history","value":"Rat activity Dec 2024 (traps inside/outside, kitchen kickboard repla… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":116,"entity_type":"property","entity_id":86,"key":"pest_hist… |
| 12 | `add_profile_fact` | {"entity_type":"contact","entity_id":249,"key":"arranges_own_pest_contractor","value":"true - landlord arranges pest control and proofing d… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":117,"entity_type":"contact","entity_id":249,"key":"arranges_… |
| 13 | `add_profile_fact` | {"entity_type":"contact","entity_id":249,"key":"preferred_channel","value":"call (asked for an urgent call back instead of replying in writ… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":118,"entity_type":"contact","entity_id":249,"key":"preferred… |

Agent's own account of its actions (from the structured result):

- `get_ticket_context` - Loaded the ticket, profiles and the 19 events -> No attachments, approvals, holds or facts on file
- `recall_lessons` - Looked for team lessons on stalled landlord-arranged works -> No lessons found
- `classify_reply` - Classified the tenant's latest update (ev 17) -> Review: likely complaint 0.95, dissatisfied 0.86
- `classify_intake` - Classified the original report -> Urgent, safety risk 0.67
- `send_message` - Emailed the landlord asking for the proofing contractor's name, a new date and the pest report, or whether he wants Northbridge to arrange it -> Message 71 queued; guard passed
- `send_message` - Texted the tenant: landlord chased, update by 15 Sept, plus safe containment advice -> Message 70 queued; guard passed
- `place_hold` - Hold while waiting for the landlord's reply -> Hold 274, follow up in 2 days
- `escalate_to_human` - Handed over at normal priority because the works have stalled and the deadlines passed twice -> Queue item 33
- `add_profile_fact` - Recorded: tenant prefers calls, dog at the property, pest history, landlord arranges his own pest contractor, landlord prefers calls -> Facts 114-118 recorded; no conflicts

## Approvals

| Party | Status | Channel |
|---|---|---|
| Gareth Vale (Landlord) | not_needed - landlord arranging works directly | call (ev 6) / email (ev 7) |

## Escalation & handover

- Escalation needed: **yes**
- Reason: Landlord-arranged proofing has stalled: no landlord update after two waiting periods, the contractor didn't attend, and the tenant is unhappy about rats indoors
- Handover summary: Pest treatment finished 7 Sept. The proofing visit expected on 8 Sept didn't happen. The waiting periods expired 8 and 11 Sept with no landlord update. I chased the landlord by email today (msg 71) and texted the tenant (msg 70). Hold 274 runs to 13 Sept.
- Recommendation: Property manager to phone the landlord on the number he gave in ev 4. Get a firm proofing date and contractor, or his approval for Northbridge to instruct one. Phone the tenant with the outcome by 15 Sept.

## What could not be verified

- Who the landlord's proofing contractor is, and any new appointment date
- What the proofing covers (under-sink openings or wall)
- Whether rats are still getting in after treatment
- The December 2024 record the landlord described (not on file)

## What failed

_No failures recorded._

## Risks & red flags

- Rats getting into the kitchen: health risk while openings stay unsealed
- The tenant is unhappy, and this could become a formal complaint
- Ticket stage is still 'intake' and lags behind events; it can't move to 'works' without an approval on record
- Dog at the property: bait safety

## Final result / next follow-up

- Final status: Intake stage, on hold waiting for the landlord (hold 274), escalated to the human queue (item 33)
- Next follow-up: 2025-09-13 - Chase the landlord for the proofing contractor and date. Phone the tenant with an update by 15 Sept.
- Confidence: 0.8

## Run metadata

- Case folder: `018`
- Session id: wrun_01M4K79HAYWK86HBFTH566ANKY
- Started: 2026-10-10T15:35:49.262Z  Finished: 2026-10-10T15:36:50.869Z  Duration: 61.6s
- Events recorded: 446
- Model(s): anthropic/claude-opus-5.5
- Tokens: in 134942 / out 6173; cost: not reported
