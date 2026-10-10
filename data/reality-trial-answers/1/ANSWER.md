# Case 1 - Answer

## Decision

**escalate**

## Summary

I've escalated this to a person at high priority. It's an emergency: no heating or hot water in January for a household with a 3-month-old baby who now has a cough. The landlord's 'go ahead' only covers up to £300 and says to use Brightwell Gas. That clashes with Ashgrove Heating's £480 quote, and Ashgrove can't come until Thursday. I sent the tenant safety advice and told them nobody is booked yet. I emailed the landlord to confirm we have her conditions, and the team now needs to phone the tenant, Brightwell Gas and the landlord. Nothing is booked and no money has been committed.

## Actions taken

| # | Tool | Input (gist) | Result | Output (gist) |
|---|---|---|---|---|
| 1 | `get_ticket_context` | {"ticket_id":51} | ok | {"ok":true,"ticket":{"id":51,"case_ref":"R/1","property_id":51,"tenant_id":136,"landlord_id":137,"contractor_id":138,"t… |
| 2 | `classify_reply` | {"ticket_id":51,"text":"Go ahead but don't spend more than £300 without calling me first. Use Brightwell Gas, they did it last time, not wh… | ok | {"autonomy":"review","intent":"conditional_approval","intent_probs":{"approve":0,"decline":0,"conditional_approval":1,"… |
| 3 | `classify_reply` | {"ticket_id":51,"text":"Has anyone been booked? The baby has a cough now and we have no way to heat bottles properly. Please call me on the… | ok | {"autonomy":"review","intent":"question","intent_probs":{"confirms_fixed":0,"still_broken":0.10101010101010102,"access_… |
| 4 | `classify_intake` | {"ticket_id":51,"text":"Boiler stopped completely, no heating and no hot water since last night, display shows F28. Tenant has a 3 month ol… | ok | {"route":"emergency_dispatch","category":"heating_hot_water","category_probs":{"plumbing":0,"appliance":0,"doors_window… |
| 5 | `send_message` | {"ticket_id":51,"to":"tenant","channel":"sms","body":"Northbridge Lettings re Flat 4, 18 Orchard Rise (job NBL-T1-551 / R/1): we're treatin… | ok | {"ok":true,"message_id":2,"guard":{"blocked":false,"reasons":[],"probs":{"claims_work_done_unverified":0.23,"promises_s… |
| 6 | `add_profile_fact` | {"entity_type":"contact","entity_id":136,"key":"vulnerable_household","value":"yes - 3 month old baby in household; baby has a cough (repor… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":18,"entity_type":"contact","entity_id":136,"key":"vulnerable… |
| 7 | `add_profile_fact` | {"entity_type":"contact","entity_id":136,"key":"preferred_channel","value":"call","source_ref":"event 007 (tenant email: 'Please call me on… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":19,"entity_type":"contact","entity_id":136,"key":"preferred_… |
| 8 | `add_profile_fact` | {"entity_type":"contact","entity_id":137,"key":"call_before_spend_above_gbp","value":"300 (landlord asks to be called before spending more … | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":20,"entity_type":"contact","entity_id":137,"key":"call_befor… |
| 9 | `add_profile_fact` | {"entity_type":"contact","entity_id":137,"key":"preferred_contractor_heating","value":"Brightwell Gas (did previous boiler work); landlord … | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":21,"entity_type":"contact","entity_id":137,"key":"preferred_… |
| 10 | `send_message` | {"ticket_id":51,"to":"landlord","channel":"email","subject":"Flat 4, 18 Orchard Rise – boiler F28, emergency (ref R/1 / NBL-T1-551)","body"… | ok | {"ok":true,"message_id":3,"guard":{"blocked":false,"reasons":[],"probs":{"claims_work_done_unverified":0.08,"promises_s… |
| 11 | `escalate_to_human` | {"ticket_id":51,"reason":"Emergency: no heating or hot water in January with a 3-month-old baby (now coughing). Landlord's approval is cond… | ok | {"ok":true,"queue_id":2} |
| 12 | `place_hold` | {"ticket_id":51,"reason":"Agency ops need to phone the tenant, Brightwell Gas and the landlord to arrange emergency attendance within the l… | ok | {"ok":true,"hold_id":238} |

Agent's own account of its actions (from the structured result):

- `get_ticket_context` - Loaded ticket 51 -> 8 events; no attachments, approvals, holds or contact details
- `classify_intake` - Classified the boiler report -> Emergency, heating/hot water, safety_risk 0.69
- `classify_reply` - Checked the landlord's reply (event 006) -> Conditional approval, not an unconditional approval (0.02); flagged for review
- `classify_reply` - Checked the tenant's reply (event 007) -> A question; safety concern 0.56, dissatisfied 0.81; flagged for review
- `send_message` - SMS to tenant: emergency status, nobody booked yet, a call coming today, safety and containment advice -> Queued (message 2); outbound guard passed
- `send_message` - Email to landlord: we have her conditions, nothing booked or spent, a call coming today, asked for Brightwell's contact details -> Queued (message 3); outbound guard passed
- `add_profile_fact` - Recorded: tenant is a vulnerable household; tenant prefers calls; landlord wants a call before spend over £300; landlord prefers Brightwell Gas -> 4 facts saved, no conflicts
- `escalate_to_human` - High-priority handover to the operations team -> queue_id 2
- `place_hold` - Hold waiting on agency phone calls, follow-up in 6 hours -> hold_id 238

## Approvals

| Party | Status | Channel |
|---|---|---|
| Landlord (Priya) | conditional: up to £300, Brightwell Gas only; not recorded as approved for the £480 quote | email |

## Escalation & handover

- Escalation needed: **yes**
- Reason: Emergency with a vulnerable tenant. The landlord's approval is conditional and doesn't cover the £480 quote, and she wants a different contractor. The tenant asked for a phone call, which I can't make.
- Handover summary: Boiler F28 at Flat 4, 18 Orchard Rise; no heating or hot water since 11 Jan night; 3-month-old baby with a cough. Ashgrove quoted £480 (no attachment), earliest Thursday 15th. Landlord: up to £300, use Brightwell Gas, call before spending more. Tenant and landlord have both been messaged. Nothing is booked.
- Recommendation: Call the tenant now. Get Brightwell Gas booked as an emergency and get their price. Call Priya to agree the cost if it's over £300, or an alternative contractor if Brightwell can't come quickly. Stand down Ashgrove.

## What could not be verified

- The £480 Ashgrove quote (attachment not received)
- Brightwell Gas's contact details, availability and price
- Phone numbers and emails for the tenant, landlord and contractor (none in the CRM)
- Whether the landlord will accept emergency spend over £300

## What failed

- Agent reported: Earlier SMS to the contractor (event 003) failed: number unreachable. This was before I picked up the case.

## Risks & red flags

- Vulnerable infant in a cold property with a cough
- The landlord's spend cap and choice of contractor conflict with the current quote
- Ashgrove's earliest visit, three days away, is too slow for an emergency
- There are no contact numbers in the CRM to call anyone

## Final result / next follow-up

- Final status: Stage still 'scheduling'; on hold waiting for the agency, with a high-priority item in the human queue
- Next follow-up: 2026-01-12 ~17:30 UTC (6 hours) - Check the team has called the tenant and landlord and booked emergency attendance with Brightwell Gas
- Confidence: 0.85

## Run metadata

- Case folder: `C:\Users\sahid\Documents\Projects\Hackathons\DwellyHack\dwelly-agent\data\reality-trial\1`
- Session id: wrun_01M4JTSHG4NYW8BP61891G5KCR
- Started: 2026-10-10T11:57:22.219Z  Finished: 2026-10-10T11:58:19.156Z  Duration: 56.9s
- Events recorded: 478
- Model(s): anthropic/claude-opus-5.5
- Tokens: in 90608 / out 5677; cost: not reported
