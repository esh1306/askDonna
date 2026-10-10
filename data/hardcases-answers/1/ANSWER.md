# Case 1 - Answer

## Decision

**request_info**

## Summary

The tenant reported an urgent heating fault: her boiler keeps losing pressure and the radiators are cold. She asked us to send someone to Flat 6, but the CRM says she is the tenant of Flat 4, and Flat 6 is let to J. Okafor. Because the address decides which landlord we ask and whose home the engineer enters, I emailed her to confirm her flat and whether the shared-cupboard boiler heats only her flat. The email also gave her safe interim advice. The ticket is on hold with a 12-hour follow-up because the job is urgent.

## Judgement

- **Case type:** maintenance
- **Why this decision:** Event 001 asks for attendance at Flat 6. Event 002 shows the sender is the tenant of Flat 4 and that Flat 6 belongs to another tenant. Event 004 adds that the boiler is in a shared landing cupboard on the 2nd floor. So we don't know which property, which landlord or which tenancy this is. The tenant can answer that quickly, so I asked her rather than escalating. It isn't an emergency: there's no gas smell, no uncontained leak and no known vulnerability, so we can't send anyone to a flat that may not be hers before it's confirmed.

| Alternative considered | Why not |
|---|---|
| Ask the Flat 4 landlord for approval now | If the boiler serves Flat 6 or is shared plant, we would be asking the wrong landlord or freeholder. |
| Escalate to a human now | A quick question to the tenant can settle the address. I'll escalate if she doesn't reply or if it turns out to be a communal or Flat 6 boiler. |
| Treat as an emergency and send an engineer | There's no gas smell, uncontrolled leak or known vulnerable occupant, and the address is unclear. |

**Checks performed before acting**

- Tenancy in the CRM lookup (event 002) compared with the flat named in the report (event 001)
- No open approvals, holds or contractor on the ticket
- Landlord profile: no recorded spend limit and no preferred channel
- No other jobs on record for this property
- Intake classifier: urgent heating; reply classifier: needs review

**Assumptions**

- The Thursday she asked about is 1 October 2026; this is not confirmed with her
- She is probably the Flat 4 tenant and the Flat 6 mention is probably a mistake or refers to where the cupboard is; this is not verified

## Actions taken

| # | Tool | Input (gist) | Result | Output (gist) |
|---|---|---|---|---|
| 1 | `get_ticket_context` | {"ticket_id":53} | ok | {"ok":true,"ticket":{"id":53,"case_ref":"R/1","property_id":53,"tenant_id":141,"landlord_id":142,"contractor_id":null,"… |
| 2 | `classify_reply` | {"ticket_id":53,"text":"Sorry, I should say - the boiler is in the shared utility cupboard on our landing. I do live on the 2nd floor. Plea… | ok | {"autonomy":"review","intent":"access_or_availability","intent_probs":{"confirms_fixed":0,"still_broken":0,"access_or_a… |
| 3 | `classify_intake` | {"ticket_id":53,"text":"Boiler keeps losing pressure and radiators are cold. Tenant (CRM: Flat 4) asked for attendance at Flat 6; boiler is… | ok | {"route":"request_landlord_approval","scope":"maintenance_repair","scope_probs":{"maintenance_repair":1,"maintenance_ad… |
| 4 | `send_message` | {"ticket_id":53,"to":"tenant","channel":"email","subject":"Boiler losing pressure – 18 Orchard Court (ref R/1)","body":"Dear Mrs Haddad,\n\… | ok | {"ok":true,"message_id":5,"guard":{"blocked":false,"reasons":[],"probs":{"claims_work_done_unverified":0.1,"promises_sp… |
| 5 | `place_hold` | {"ticket_id":53,"reason":"Waiting for tenant to confirm which flat (CRM says Flat 4, report says Flat 6) and whether the shared-cupboard bo… | ok | {"ok":true,"hold_id":240} |
| 6 | `add_profile_fact` | {"entity_type":"property","entity_id":53,"key":"boiler_location","value":"Shared utility cupboard on 2nd-floor landing (tenant report; unco… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":25,"entity_type":"property","entity_id":53,"key":"boiler_loc… |
| 7 | `add_profile_fact` | {"entity_type":"contact","entity_id":141,"key":"availability_note","value":"Asked whether she can be home Thursday afternoon for the boiler… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":26,"entity_type":"contact","entity_id":141,"key":"availabili… |

Agent's own account of its actions (from the structured result):

- `get_ticket_context` - Loaded the case -> 4 events; no holds, approvals or contractor
- `classify_reply` - Classified the tenant's 09:40 email (event 004) -> Access/availability message; flagged for review
- `classify_intake` - Classified the reported fault -> Heating; urgent; landlord approval likely needed
- `send_message` - Emailed the tenant to confirm her flat and whether the boiler serves other flats, with safe interim advice -> Sent (message 5); passed the outbound guard
- `place_hold` - Put the ticket on hold until the tenant confirms -> Hold 240, follow-up in 0.5 days
- `add_profile_fact` - Recorded where the boiler is (as reported by the tenant) -> Fact 25
- `add_profile_fact` - Recorded the tenant's Thursday-afternoon availability -> Fact 26

## Approvals

| Party | Status | Channel |
|---|---|---|
| Landlord (R/1) | not yet requested – waiting for the tenant to confirm the address | none |

## Escalation & handover

- Escalation needed: **no**
- Reason: The tenant can confirm the address herself
- Recommendation: If she doesn't reply by the follow-up, or the boiler turns out to serve Flat 6 or the whole building, hand it to a human.

## What could not be verified

- Which flat the tenant actually lives in and which flat the boiler serves
- Whether the boiler is communal plant (it may be the freeholder's responsibility)
- Who the landlord is and how they prefer to be contacted
- Whether anyone in the household is vulnerable

## What failed

_No failures recorded._

## Risks & red flags

- Flat 6 is let to a different tenant (J. Okafor), so sending an engineer there could mean entering another tenant's home
- A shared-cupboard boiler may be communal, so the cost could belong to a different party
- Urgent heating fault with cold weather forecast; delay matters

## Final result / next follow-up

- Final status: intake, on hold waiting for the tenant (hold 240)
- Next follow-up: 2026-09-28 about 21:40 UTC (in 12 hours) - Chase the tenant for the address. Once confirmed, ask the right landlord for approval, mentioning her Thursday-afternoon availability; otherwise escalate.
- Confidence: 0.8

## Run metadata

- Case folder: `C:\Users\sahid\Documents\Projects\Hackathons\DwellyHack\dwelly-agent\data\hardcases\1`
- Session id: wrun_01M4JXE912DF7X071FANS45KJD
- Started: 2026-10-10T12:43:38.666Z  Finished: 2026-10-10T12:44:24.230Z  Duration: 45.6s
- Events recorded: 252
- Model(s): anthropic/claude-opus-5.5
- Tokens: in 75987 / out 4373; cost: not reported
