# Case PM011-2 - Answer

## Decision

**wait**

## Summary

I've left this routine dishwasher job in scheduling and put it on hold for 2 days while we wait for the contractor. The landlord approved attendance (event 9) and Oakfield Homes was assigned (events 11–13). The two call logs after that were a contractor phoning the tenant (event 14) and a system note about a call that didn't connect (event 15). Neither needs a reply from us. The only odd thing is that the caller gave the name "Cedar Maintenance", not Oakfield Homes. I sent Oakfield one email asking them to confirm that call was made for them and to tell us the visit date once agreed.

## Judgement

- **Case type:** maintenance
- **Why this decision:** Event 9 is a clear landlord approval ('Yes please go ahead'), approval 9 is recorded as approved, and the contractor has been assigned and notified, so the next step is for the contractor to agree a visit with the tenant. Event 14 shows that is under way: a contractor phoned the tenant to arrange it. classify_reply rated it routine scheduling (autonomy auto, needs_human_response 0.2). Event 15 is just a system note about a call that couldn't connect. Nothing here needs a reply from us. The only loose end is the caller's company name, and Oakfield can confirm that, so I asked them in one message and set a hold to chase.

| Alternative considered | Why not |
|---|---|
| Escalate the contractor name mismatch to a human | Different trading names for the same contractor are normal. No money, payee or scope is involved yet, and Oakfield can answer it directly. |
| Message the tenant | She has already been told Oakfield will be in touch (event 12), and the contractor is already trying to reach her. Another message wouldn't move the job on. |
| No action at all | The name mismatch should be cleared up before anyone attends, and the job needs a follow-up date so it doesn't go quiet. |

**Checks performed before acting**

- Landlord approval: approval 9 is approved, and event 9 is an unconditional 'go ahead' with no cost cap
- Contractor assigned and notified: events 11 and 13
- Tenant notified: event 12
- Caller name checked against the contractor on record: 'Cedar Maintenance' and 'Alder Maintenance' don't match Oakfield Homes
- Safety: routine appliance fault, safety_concern 0.02
- Property history: earlier ticket R/PM011-1 (ticket 20) for the same dishwasher is still open at landlord_approval
- No open holds or human-queue items before this action

**Assumptions**

- The calls in events 14 and 15 came from Oakfield Homes or someone acting for them, using a different trading name or phone system

## Actions taken

| # | Tool | Input (gist) | Result | Output (gist) |
|---|---|---|---|---|
| 1 | `get_ticket_context` | {"ticket_id":21} | ok | {"ok":true,"ticket":{"id":21,"case_ref":"R/PM011-2","property_id":16,"tenant_id":53,"landlord_id":54,"contractor_id":55… |
| 2 | `classify_reply` | {"ticket_id":21,"text":"The call is from Ashford at Cedar Maintenance regarding a dishwasher issue. The caller requests Amelia Nolan to cal… | ok | {"autonomy":"auto","intent":"scheduling","intent_probs":{"quote_or_estimate":0,"invoice":0,"completion_report":0,"sched… |
| 3 | `send_message` | {"ticket_id":21,"to":"contractor","channel":"email","subject":"R/PM011-2 – Dishwasher repair, Flat 12, 78 Copperfield Walk, Kingshaven, ZZ3… | ok | {"ok":true,"message_id":25,"guard":{"blocked":false,"reasons":[],"probs":{"claims_work_done_unverified":0.21,"promises_… |
| 4 | `place_hold` | {"ticket_id":21,"reason":"Waiting for Oakfield Homes to confirm the caller \"Ashford at Cedar Maintenance\" (event 14) was acting for them,… | ok | {"ok":true,"hold_id":50} |

Agent's own account of its actions (from the structured result):

- `get_ticket_context` - Loaded the ticket, its approvals, events and the property's history -> Stage is scheduling, approval 9 is approved, Oakfield Homes is assigned, no open holds
- `classify_reply` - Classified the contractor call in event 14 -> Scheduling intent, autonomy auto, needs_human_response 0.2
- `send_message` - Emailed Oakfield Homes asking them to confirm the 'Cedar Maintenance' call was made for them and to tell us the visit date once agreed; reminded them about the pets and to send a quote before doing any work that needs one -> Sent (message 25), passed the outbound guard
- `place_hold` - Put the ticket on hold waiting for the contractor to confirm the caller and the visit date -> Hold 50, follow-up in 2 days

## Approvals

| Party | Status | Channel |
|---|---|---|
| Turner (landlord) | granted | email |

## Escalation & handover

- Escalation needed: **no**
- Reason: Routine scheduling. The contractor can resolve the name mismatch.
- Recommendation: If Oakfield says the 'Cedar Maintenance' caller was not acting for them, warn the tenant and escalate. Also consider closing or merging the duplicate ticket R/PM011-1.

## What could not be verified

- Whether 'Ashford at Cedar Maintenance' (event 14) and 'Alder Maintenance' (event 15) are Oakfield Homes or act for it
- Visit date: not yet arranged as far as the records show
- Whether the tenant has returned the call

## What failed

_No failures recorded._

## Risks & red flags

- The caller's company names (Cedar Maintenance, Alder Maintenance) don't match the assigned contractor, Oakfield Homes
- Ticket R/PM011-1 (ticket 20) for the same dishwasher is still open at landlord_approval, which risks the work or the approval request being duplicated

## Final result / next follow-up

- Final status: scheduling, on hold waiting for the contractor (hold 50)
- Next follow-up: In 2 days (about 2026-12-08) - Chase Oakfield Homes to confirm the caller's identity and the agreed visit date
- Confidence: 0.8

## Run metadata

- Case folder: `C:\Users\sahid\Documents\Projects\Hackathons\DwellyHack\dwelly-agent\data\practice\cases\PM011-2`
- Session id: wrun_01M4JY783RPP3YSN4GQ1AKPSTD
- Started: 2026-10-10T12:57:17.111Z  Finished: 2026-10-10T12:57:51.819Z  Duration: 34.7s
- Events recorded: 143
- Model(s): anthropic/claude-opus-5.5
- Tokens: in 76731 / out 3600; cost: not reported
