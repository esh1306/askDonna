# Case 021 - Answer

## Decision

**request_info**

## Summary

The landlord says his plumber fixed the no-hot-water / no-boiler-power fault on 14 May. He only knows this from a text from the plumber, and the tenant hasn't confirmed it. She also mentioned a letterbox fault on 13 May, which still has no details. I sent the tenant one SMS asking her to confirm whether hot water is back and to describe the letterbox fault. I also placed a hold with a follow-up on 19 May. I'm not closing the ticket until the tenant confirms the repair.

## Judgement

- **Case type:** maintenance
- **Why this decision:** The only evidence that the fault is fixed is the landlord passing on a text from his plumber (event 018). Before that, the tenant said three times that nothing had been done (events 012, 017). The tenant is the person who can confirm the repair, so closing now would rest on hearsay. The letterbox fault from event 017 was never followed up, so I combined both questions into one message. I used SMS because her email from 15 May got no reply.

| Alternative considered | Why not |
|---|---|
| Close the ticket on the landlord's word | The landlord's report is second-hand, with no work report, and the tenant hasn't confirmed. |
| Send the agency's own contractor now | The landlord says it's fixed. Sending someone before the tenant confirms the fault is still there could waste the landlord's money. |
| Escalate to a human | The tenant can answer this herself. She has only been chased once since the landlord's update, about 1.3 days ago. |
| Do nothing | There was no hold, and the letterbox report had gone unanswered. Leaving it would let the case go silent. |

**Checks performed before acting**

- Approval status: none on file. Landlord-managed route, so no agency spend
- Tenant's statements vs the landlord's claim: they conflict, and the landlord's is second-hand
- Open holds: there were none
- Attachments: none visible (no plumber report or invoice)
- Letterbox: no details or assessment recorded

**Assumptions**

- SMS should reach the tenant. Contact details aren't in the CRM, so the team routes outbox messages
- I've treated the letterbox as a separate minor job, pending details

## Actions taken

| # | Tool | Input (gist) | Result | Output (gist) |
|---|---|---|---|---|
| 1 | `get_ticket_context` | {"ticket_id":95} | ok | {"ok":true,"ticket":{"id":95,"case_ref":"R/021","property_id":89,"tenant_id":257,"landlord_id":258,"contractor_id":null… |
| 2 | `recall_lessons` | {"ticket_id":95,"situation_text":"Landlord-managed repair: landlord says his plumber fixed no-hot-water/boiler-no-power issue (second-hand,… | ok | {"ok":true,"count":0,"lessons":[]} |
| 3 | `send_message` | {"ticket_id":95,"to":"tenant","channel":"sms","body":"Hello, this is Northbridge Lettings about your repair ref NBL-021 at 17 Wrenfold Quay… | ok | {"ok":true,"message_id":77,"guard":{"blocked":false,"reasons":[],"probs":{"claims_work_done_unverified":0.34,"promises_… |
| 4 | `place_hold` | {"ticket_id":95,"reason":"Waiting on tenant to confirm hot water/boiler power restored after landlord's plumber reportedly attended 14 May … | ok | {"ok":true,"hold_id":276} |
| 5 | `add_profile_fact` | {"entity_type":"contact","entity_id":258,"key":"uses_own_contractors","value":"Landlord chose to arrange repairs via his own contractors/pl… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":122,"entity_type":"contact","entity_id":258,"key":"uses_own_… |
| 6 | `add_profile_fact` | {"entity_type":"contact","entity_id":257,"key":"access_arrangements_contact","value":"Tenant asks to be contacted about access arrangements… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":123,"entity_type":"contact","entity_id":257,"key":"access_ar… |
| 7 | `add_profile_fact` | {"entity_type":"property","entity_id":89,"key":"has_pets","value":"yes - small birds kept at the property","source_ref":"event 001 (tenant … | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":124,"entity_type":"property","entity_id":89,"key":"has_pets"… |

Agent's own account of its actions (from the structured result):

- `get_ticket_context` - Loaded the ticket, profiles and the 21 events -> Stage intake, no holds, approvals or attachments, empty profiles
- `recall_lessons` - Looked for past lessons on unconfirmed landlord-reported fixes -> No lessons found
- `send_message` - SMS to the tenant (her email from 15 May got no reply). Asked whether the boiler, shower and taps work now, and asked for letterbox details and a photo. Said we will follow up on 19 May. -> Queued, message 77, guard passed
- `place_hold` - Hold waiting on the tenant's confirmation and letterbox details -> Hold 276, follow-up in 2.5 days
- `add_profile_fact` - Landlord: uses his own contractors, and agreed the agency may send its own if his doesn't come -> Fact 122 recorded
- `add_profile_fact` - Tenant: wants to be contacted herself about access; the household member at home doesn't speak English -> Fact 123 recorded
- `add_profile_fact` - Property: small birds kept there -> Fact 124 recorded

## Approvals

| Party | Status | Channel |
|---|---|---|
| Ravi Sethi (landlord) | not_needed | call |

## Escalation & handover

- Escalation needed: **no**
- Reason: The tenant can answer the open question. Nothing is in dispute and nothing needs agency judgement yet.
- Recommendation: At follow-up: if the tenant says hot water still isn't working, or doesn't reply, tell the landlord and use his offer from event 015 for the agency to send a Gas Safe engineer (or an electrician, if it's a power fault) quickly. Escalate if hot water has now been out for more than 2 weeks. If she confirms it's fixed, close the hot-water job and open the letterbox job separately.

## What could not be verified

- That the landlord's plumber attended on 14 May and fixed the fault (from a text, relayed by the landlord)
- The cause of the boiler power loss and whether any electrical or gas checks were done
- What the letterbox fault is

## What failed

_No failures recorded._

## Risks & red flags

- The tenant may have been without hot water for 8+ days (6 to 14 May), or longer if it isn't fixed
- The landlord's contractor didn't attend several times when promised
- There is no record of the repair or the checks done on a boiler that lost power
- The household member at home doesn't speak English, so access needs to be arranged through the tenant

## Final result / next follow-up

- Final status: Open, stage intake, on hold (276) waiting for the tenant's reply
- Next follow-up: 2025-05-19 - Check the tenant's reply. If hot water is back, close the hot-water job and scope the letterbox fault. If not, or if she hasn't replied, tell the landlord and arrange the agency's contractor as he offered in event 015, escalating if needed.
- Confidence: 0.78

## Run metadata

- Case folder: `021`
- Session id: wrun_01M4K7B5D34EZ87HQQ13RYHETN
- Started: 2026-10-10T15:36:42.572Z  Finished: 2026-10-10T15:37:25.179Z  Duration: 42.6s
- Events recorded: 186
- Model(s): anthropic/claude-opus-5.5
- Tokens: in 86558 / out 4127; cost: not reported
