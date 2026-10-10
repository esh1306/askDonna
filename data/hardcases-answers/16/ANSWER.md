# Case 16 - Answer

## Decision

**escalate**

## Summary

I treated this as an electrical safety emergency. The EICR is unsatisfactory, with a C2 for a scorched, loose neutral connection in the consumer unit, and the tenant has since reported an odd smell from the fuse box cupboard. Two young children live there. I escalated it to a human as high priority, then booked Sparkwell (the electrician who did the EICR) to come back urgently and make the consumer unit safe, without landlord approval. I emailed the landlord asking her to approve the roughly £620 replacement, gave the tenant safety advice, and put a 12-hour hold on the case for follow-up.

## Judgement

- **Case type:** safety_emergency
- **Why this decision:** Event 001 records scorching and heat damage at the neutral bar, and event 002 adds a smell from the cupboard. With young children in the home, that counts as electrical danger under the emergency rules. Event 003 shows no spend limit, so the £620 replacement needs Mrs Whitcombe's approval, while the make-safe visit can go ahead as emergency work once escalated as high priority. No past lessons applied.

| Alternative considered | Why not |
|---|---|
| Just ask the landlord for approval and wait | A smell plus a scorched neutral is a live risk to a family with children, so waiting isn't safe |
| Approve the full £620 replacement as emergency work | The emergency only covers making the unit safe; the permanent replacement can wait a short time for the landlord's decision |
| Tell the tenant to keep the power off | I'm not an electrician and the sockets work normally; I gave conditional advice instead and left the decision to the electrician |

**Checks performed before acting**

- Approval status (none) and spend limit (none recorded)
- Attachments (none; EICR PDF not on file)
- Contractor accreditation (NICEIC, per event 001)
- Safety signals: scorching, smell, children
- Duplicates and history (no other tickets for this property)

**Assumptions**

- Sparkwell Electrical is the contractor on this ticket (they sent the EICR)
- The tenant's name is Mr Leo Brandt, as given in the case description

## Actions taken

| # | Tool | Input (gist) | Result | Output (gist) |
|---|---|---|---|---|
| 1 | `get_ticket_context` | {"ticket_id":73} | ok | {"ok":true,"ticket":{"id":73,"case_ref":"R/16","property_id":68,"tenant_id":188,"landlord_id":191,"contractor_id":190,"… |
| 2 | `recall_lessons` | {"ticket_id":73,"situation_text":"EICR unsatisfactory with C2 findings incl scorched neutral in consumer unit, tenant with young children r… | ok | {"ok":true,"count":5,"lessons":[{"id":16,"situation":"A provider has been assigned after landlord approval and has made… |
| 3 | `classify_intake` | {"ticket_id":73,"estimate_gbp":620,"text":"EICR unsatisfactory: C2 no RCD on sockets, C2 scorched and loose neutral connection in consumer … | ok | {"route":"emergency_dispatch","scope":"emergency_safety","scope_probs":{"maintenance_repair":0.03,"maintenance_admin":0… |
| 4 | `classify_reply` | {"ticket_id":73,"text":"The electrician said something about the fuse box. Is it safe? Sockets work as normal but the fuse box cupboard sme… | ok | {"autonomy":"review","intent":"question","intent_probs":{"confirms_fixed":0,"still_broken":0,"access_or_availability":0… |
| 5 | `escalate_to_human` | {"ticket_id":73,"reason":"Unsatisfactory EICR with C2 scorched/loose neutral in consumer unit plus tenant-reported odd smell; household wit… | ok | {"ok":true,"queue_id":15} |
| 6 | `assign_contractor` | {"ticket_id":73,"contractor_name":"Sparkwell Electrical","company":"Sparkwell Electrical","reason":"NICEIC electrician who carried out the … | ok | {"ok":true,"contractor_id":197,"stage":"scheduling"} |
| 7 | `request_landlord_approval` | {"ticket_id":73,"summary":"Unsatisfactory EICR with two C2 findings (no RCD on sockets; scorched/loose neutral in consumer unit). Proposed … | ok | {"ok":true,"approval_id":37,"message_id":30,"landlord":"Mrs Whitcombe","guard":{"blocked":false,"reasons":[],"probs":{"… |
| 8 | `send_message` | {"ticket_id":73,"to":"contractor","channel":"email","subject":"URGENT – 8 Kestrel Lane, ZZ3 8ZZ (R/16) – make-safe visit requested","body":… | ok | {"ok":true,"message_id":34,"guard":{"blocked":false,"reasons":[],"probs":{"claims_work_done_unverified":0.11,"promises_… |
| 9 | `send_message` | {"ticket_id":73,"to":"tenant","channel":"email","subject":"Fuse box at 8 Kestrel Lane (R/16) – safety advice","body":"Dear Mr Brandt,\n\nTh… | ok | {"ok":true,"message_id":35,"guard":{"blocked":false,"reasons":[],"probs":{"claims_work_done_unverified":0.32,"promises_… |
| 10 | `place_hold` | {"ticket_id":73,"reason":"Waiting for Sparkwell to confirm urgent make-safe visit and send EICR PDF + written quote; landlord approval 37 (… | ok | {"ok":true,"hold_id":255} |
| 11 | `add_profile_fact` | {"entity_type":"property","entity_id":68,"key":"eicr_status","value":"Unsatisfactory (reported 2026-10-09 by Sparkwell Electrical): C2 no R… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":61,"entity_type":"property","entity_id":68,"key":"eicr_statu… |
| 12 | `add_profile_fact` | {"entity_type":"contact","entity_id":188,"key":"household_vulnerability","value":"Two young children in household","source_ref":"ticket des… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":62,"entity_type":"contact","entity_id":188,"key":"household_… |
| 13 | `add_profile_fact` | {"entity_type":"contact","entity_id":188,"key":"availability","value":"In most days after 3pm","source_ref":"event 002 (tenant email)","con… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":63,"entity_type":"contact","entity_id":188,"key":"availabili… |

Agent's own account of its actions (from the structured result):

- `get_ticket_context` - Loaded the case -> 3 events, no attachments, no profile facts, no approvals or holds
- `recall_lessons` - Looked for past team decisions on similar cases -> None relevant (all were about scheduling or close-out)
- `classify_intake` - Classified the report -> Emergency, compliance, safety risk 0.96, route emergency_dispatch
- `classify_reply` - Classified the tenant's question -> Needs review; safety concern 0.96
- `escalate_to_human` - High-priority handover: electrical danger in a household with children -> Queue item 15
- `assign_contractor` - Booked Sparkwell Electrical for an urgent make-safe visit (emergency safety work) -> Assigned; ticket moved to scheduling
- `request_landlord_approval` - Emailed Mrs Whitcombe for approval of the consumer unit replacement up to about £620 -> Approval 37 pending
- `send_message` - Asked Sparkwell to attend urgently to make the unit safe, not to start the replacement yet, and to send the EICR PDF and written quote -> Sent (message 34)
- `send_message` - Gave the tenant safety advice and told him the next steps, with an update by tomorrow afternoon -> Sent (message 35)
- `place_hold` - Hold while Sparkwell confirms the visit and sends the documents -> Hold 255, follow up in 0.5 days
- `add_profile_fact` - Recorded the EICR status on the property, plus the household's vulnerability and the tenant's availability -> Facts 61, 62, 63

## Approvals

| Party | Status | Channel |
|---|---|---|
| Mrs Whitcombe (landlord) | requested | email |
| Mrs Whitcombe (landlord) | not_needed (emergency make-safe visit only) | n/a |

## Escalation & handover

- Escalation needed: **yes**
- Reason: Electrical danger: C2 scorched neutral plus a smell report, in a household with young children; no landlord approval or spend limit
- Handover summary: Unsatisfactory EICR with two C2s. Tenant reports a smell from the fuse box cupboard. Sparkwell has been asked to make it safe urgently. Approval for the ~£620 replacement has been requested by email. The EICR PDF isn't on file.
- Recommendation: Phone Sparkwell today to confirm the urgent visit. Phone Mrs Whitcombe for approval, since we have no preferred channel or contact details for her. Get the EICR PDF and the written quote.

## What could not be verified

- The EICR document itself: its date, engineer and certificate details aren't visible
- The £620 is approximate; there is no written quote
- Contact details and preferred channel for the landlord, tenant and contractor
- Whether Sparkwell can attend urgently

## What failed

_No failures recorded._

## Risks & red flags

- Heat damage plus a smell suggests a possible fire risk
- No RCD protection on the sockets in a home with young children
- No contact details on file, so messages rely on the team routing them
- The Jev guard gave the landlord email a 0.51 chance of an unverified 'work done' claim, but did not block it. The email says only that we have asked Sparkwell to attend, not that the work is done

## Final result / next follow-up

- Final status: scheduling; on hold waiting for Sparkwell (hold 255); landlord approval 37 pending; human queue item 15 open (high)
- Next follow-up: 2026-10-10 (12 hours after the hold was placed) - Check that Sparkwell has confirmed the make-safe visit and sent the EICR PDF and quote; check the landlord's reply to approval 37; update the tenant by tomorrow afternoon as promised
- Confidence: 0.82

## Run metadata

- Case folder: `data/hardcases/16`
- Session id: wrun_01M4K15ER8FZKBC9CMTYK20VQX
- Started: 2026-10-10T13:48:43.943Z  Finished: 2026-10-10T13:49:53.914Z  Duration: 70.0s
- Events recorded: 545
- Model(s): anthropic/claude-opus-5.5
- Tokens: in 139853 / out 6983; cost: not reported
