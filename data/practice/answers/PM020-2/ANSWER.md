# Case PM020-2 - Answer

## Decision

**escalate**

## Summary

The routine inspection is finished: the report was sent to the landlord saying no issues were found. The landlord then replied with two new points. A dog flap was fitted without his approval, and he wants the spare front door key back after a lock change. Both are tenancy-terms and access questions that need agency judgement, so I sent the case to the human queue at normal priority. I also emailed the landlord to say we've received it, recorded the facts on the property and set a 2-day follow-up.

## Judgement

- **Case type:** out_of_scope
- **Why this decision:** Event 020 raises a tenant alteration made without consent (dog flap) and a key/lock-change access question. Neither is a repair: they turn on the tenancy agreement, may need the tenant asked to put things right, and involve security and access. classify_reply returned 'review' with needs_human_response 0.79. The inspection itself is done (events 017-018), so there is nothing to move through repair stages.

| Alternative considered | Why not |
|---|---|
| no_action / return to auto mode | The landlord asked a direct question and is unhappy about an alteration he didn't approve. Leaving it unanswered would stall the case. |
| Open a repair job to remove the dog flap | Nobody has decided yet on reinstatement versus retrospective consent, or on who pays. The landlord hasn't approved any work, and this depends on the tenancy terms. |
| Message the tenant directly about the key and the dog flap | Raising a possible tenancy breach with the tenant needs a property manager's judgement and wording. Left to the human handling the escalation. |
| Close the inspection ticket | There is an open landlord query on it. Closing would hide it. |

**Checks performed before acting**

- Loaded the full ticket context: no profile facts, approvals or holds before this turn
- Read the inspection report attachment: the transcription shows only boilerplate, with no mention of a dog flap or lock change. The summary says no issues
- Classified the landlord reply: review, question intent, safety_concern 0.2, dissatisfied 0.19
- Name check: report addressed to Oliver Bennett, reply from Felix Clarke. Noted as unconfirmed, not treated as a conflict
- Date check: inspection booked for 15/02, report dated 16/02. A small slip, noted
- Found sibling ticket R/PM020-1 (inspection) open at the same property

**Assumptions**

- Felix Clarke is linked to the landlord account (co-owner, partner or representative)
- The lock change was done by or for the tenant. The landlord's email text is only a summary, so this isn't clear

## Actions taken

| # | Tool | Input (gist) | Result | Output (gist) |
|---|---|---|---|---|
| 1 | `get_ticket_context` | {"ticket_id":42} | ok | {"ok":true,"ticket":{"id":42,"case_ref":"R/PM020-2","property_id":32,"tenant_id":105,"landlord_id":106,"contractor_id":… |
| 2 | `read_attachment` | {"ticket_id":42,"name":"attachment-01-property-inspection-report.pdf"} | ok | {"ok":true,"name":"attachment-01-property-inspection-report.pdf","text":"# Transcription\n\n## Page 1\n\n**Northbridge … |
| 3 | `classify_reply` | {"ticket_id":42,"text":"Felix Clarke addresses a dog flap installation that was not approved and inquires about the retrieval of a spare fr… | ok | {"autonomy":"review","intent":"question","intent_probs":{"approve":0.01,"decline":0.02,"conditional_approval":0,"questi… |
| 4 | `send_message` | {"ticket_id":42,"to":"landlord","channel":"email","subject":"Flat 12, 162 Beacon Close – dog flap and spare key (ref R/PM020-2)","body":"De… | ok | {"ok":true,"message_id":65,"guard":{"blocked":false,"reasons":[],"probs":{"claims_work_done_unverified":0.22,"promises_… |
| 5 | `escalate_to_human` | {"ticket_id":42,"reason":"Landlord reports an unapproved alteration (dog flap) and asks about the spare key after a lock change. These are … | ok | {"ok":true,"queue_id":24} |
| 6 | `add_profile_fact` | {"entity_type":"property","entity_id":32,"key":"has_pets","value":"yes - tenant has a dog","source_ref":"event 006 (tenant email) and event… | ok | {"ok":true,"conflict":true,"existing":{"id":55,"entity_type":"property","entity_id":32,"key":"has_pets","value":"yes - … |
| 7 | `add_profile_fact` | {"entity_type":"property","entity_id":32,"key":"access_lock_changed_spare_key_query","value":"Landlord reports the front door lock was chan… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":64,"entity_type":"property","entity_id":32,"key":"access_loc… |
| 8 | `add_profile_fact` | {"entity_type":"property","entity_id":32,"key":"unapproved_alteration_dog_flap","value":"Landlord reports a dog flap was installed without … | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":65,"entity_type":"property","entity_id":32,"key":"unapproved… |
| 9 | `place_hold` | {"ticket_id":42,"reason":"Waiting for the property management team to look into the dog flap and spare key points and reply to the landlord… | ok | {"ok":true,"hold_id":95} |

Agent's own account of its actions (from the structured result):

- `get_ticket_context` - Loaded ticket 42 context -> 20 events, no facts, holds or approvals; sibling ticket R/PM020-1 open
- `read_attachment` - Read the inspection report -> Boilerplate only; no defects, dog flap or lock change visible
- `classify_reply` - Classified the landlord email (event 020) -> review; question; needs_human_response 0.79
- `send_message` - Emailed the landlord to confirm we've received both points and that the team will reply within 2 working days -> message_id 65, guard passed
- `escalate_to_human` - Handed over the dog flap and spare key questions -> queue_id 24
- `add_profile_fact` - has_pets = dog -> Recorded; flagged as a conflict with existing fact 55 (same meaning, different wording)
- `add_profile_fact` - Lock change / spare key access question -> Recorded (fact 64)
- `add_profile_fact` - Dog flap reported as fitted without approval -> Recorded (fact 65)
- `place_hold` - Hold on the agency, follow up in 2 days -> hold_id 95

## Approvals

| Party | Status | Channel |
|---|---|---|
| Landlord | not_needed | n/a |

## Escalation & handover

- Escalation needed: **yes**
- Reason: Possible tenancy breach (dog flap fitted without approval) and a key/access question after a lock change. Both need agency judgement.
- Handover summary: The inspection is done and the report said no issues. The landlord, signing as Felix Clarke though the report went to Oliver Bennett, says a dog flap was fitted without his approval and wants the spare front door key back after a lock change. The landlord has been told to expect a reply within 2 working days.
- Recommendation: Property manager to check the report photos and the tenancy clauses, contact the tenant about the dog flap and the key, check whether the management key still works, then reply to the landlord with options. Also confirm Felix Clarke's link to the landlord account.

## What could not be verified

- Whether a dog flap was actually fitted, and by whom
- Who changed the locks and when; who holds the keys now
- Whether the agency's management key still works
- How Felix Clarke is linked to landlord Oliver Bennett
- The landlord's full email text (only a summary is visible)
- Why the inspection reported no issues

## What failed

_No failures recorded._

## Risks & red flags

- The inspection said 'no issues' even though the landlord reports an alteration made without his approval, so the inspection may have missed it
- The agency may not have access (management key) after the lock change
- The landlord may be unhappy (dissatisfied 0.19)
- Name mismatch between the report addressee and the person who replied

## Final result / next follow-up

- Final status: Stage intake (inspection done); escalated (queue 24); on hold waiting on the agency (hold 95)
- Next follow-up: 2024-02-20 (2 days) - Check that the property manager has replied to the landlord about the dog flap and spare key; chase if not
- Confidence: 0.85

## Run metadata

- Case folder: `C:\Users\sahid\Documents\Projects\Hackathons\DwellyHack\dwelly-agent\data\practice\cases\PM020-2`
- Session id: wrun_01M4JY9QTT8W2EHD9T79AHZ92J
- Started: 2026-10-10T12:58:38.738Z  Finished: 2026-10-10T12:59:47.066Z  Duration: 68.3s
- Events recorded: 334
- Model(s): anthropic/claude-opus-5.5
- Tokens: in 75647 / out 5096; cost: not reported
