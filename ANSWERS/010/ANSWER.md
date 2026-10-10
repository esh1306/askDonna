# Case 010 - Answer

## Decision

**wait**

## Summary

I've left this case waiting on the landlord's decision about the full-kitchen figures. I also asked the contractor for the cupboards-and-doors-only estimate the landlord wanted, which had never been requested. I moved the CRM stage forward to landlord approval, sent the tenant an update with advice on the sharp edges, and recorded the property and landlord facts. A person needs to settle the 15% commission, cap and VAT question with the contractor before the landlord's total can be confirmed, so I've escalated that at normal priority.

## Judgement

- **Case type:** mixed
- **Why this decision:** The next decision belongs to the landlord, who received the figures on 24 Sep (event 025). Nothing is overdue, so waiting with a hold is right. Asking for formal approval now would be premature: the second estimate is missing and the total payable is uncertain because of the commission and VAT issue (events 022–023). That issue is an agency commercial matter, so it goes to a person. The missing second estimate was a gap in the earlier process (event 018 asked only for the full kitchen), and the contractor can fix it, so I asked him directly. The tenant had heard nothing since 9 Sep, has reported injuries, and her offered dates have passed, so she needed an update with safety advice.

| Alternative considered | Why not |
|---|---|
| Request formal landlord approval of the full-kitchen quote now | The total payable can't be confirmed while the commission and VAT basis is open, the alternative estimate the landlord asked for is missing, and the landlord already has the figures. |
| Move to scheduling under the existing laminate approval | The contractor says that scope isn't workable, and no approval is on record in the CRM. |
| Treat as an emergency because of the cuts | This is a sharp-edge hazard the tenant can reduce with tape and by avoiding the edges. It isn't an immediate emergency. I flagged an interim fix for the person to consider. |

**Checks performed before acting**

- Approval status: no approval on record for replacement work, only laminate repair (events 006, 026)
- Quote total: 4850+3800+230+380 = £9,260 net, plus VAT
- Searched 'cupboards': the second estimate was never asked of the contractor
- Scope mismatch: the landlord says the appliances are good, but the full-kitchen quote includes an oven, hob and extractor
- No open holds, approvals or attachments in the CRM
- No lessons on file for this situation

**Assumptions**

- The contractor has no record of the landlord's second-estimate request because event 018 didn't mention it
- The landlord is back from being away (back by 14 Sep, per event 015)

## Actions taken

| # | Tool | Input (gist) | Result | Output (gist) |
|---|---|---|---|---|
| 1 | `get_ticket_context` | {"ticket_id":84} | ok | {"ok":true,"ticket":{"id":84,"case_ref":"R/010","property_id":78,"tenant_id":224,"landlord_id":225,"contractor_id":226,… |
| 2 | `recall_lessons` | {"ticket_id":84,"situation_text":"Contractor sent full-kitchen quote (plus VAT, commission basis unsettled); forwarded to landlord, awaitin… | ok | {"ok":true,"count":0,"lessons":[]} |
| 3 | `search_case` | {"ticket_id":84,"query":"cupboards"} | ok | {"query":"cupboards","matches":6,"events":[{"id":1952,"ticket_id":84,"ts":"2025-09-09T16:49:18Z","kind":"update","direc… |
| 4 | `move_stage` | {"ticket_id":84,"to":"landlord_approval","reason":"CRM stage lagged the evidence. Full-kitchen figures forwarded to landlord (event 025); l… | ok | {"ok":true,"from":"intake","to":"landlord_approval","status":"open"} |
| 5 | `send_message` | {"ticket_id":84,"to":"contractor","channel":"email","subject":"R/010 – 42 Brackenveil Row – second estimate needed (cupboards and doors onl… | ok | {"ok":true,"message_id":58,"guard":{"blocked":false,"reasons":[],"probs":{"claims_work_done_unverified":0.17,"promises_… |
| 6 | `send_message` | {"ticket_id":84,"to":"tenant","channel":"email","subject":"R/010 – 42 Brackenveil Row – kitchen cabinets update","body":"Dear Elowen,\n\nAn… | ok | {"ok":true,"message_id":57,"guard":{"blocked":false,"reasons":[],"probs":{"claims_work_done_unverified":0.1,"promises_s… |
| 7 | `place_hold` | {"ticket_id":84,"reason":"Waiting on landlord's decision on the full-kitchen figures (event 025), and on the contractor's cupboards-and-doo… | ok | {"ok":true,"hold_id":266} |
| 8 | `escalate_to_human` | {"ticket_id":84,"reason":"Commission/VAT basis behind the contractor's quote is unsettled (agency commercial matter). Expanded scope is a l… | ok | {"ok":true,"queue_id":28} |
| 9 | `add_profile_fact` | {"entity_type":"property","entity_id":78,"key":"has_pets","value":"yes – two dogs; must be secured and access arranged in advance before an… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":89,"entity_type":"property","entity_id":78,"key":"has_pets",… |
| 10 | `add_profile_fact` | {"entity_type":"property","entity_id":78,"key":"kitchen_appliances_worktops_flooring_condition","value":"good condition per landlord (Sep 2… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":90,"entity_type":"property","entity_id":78,"key":"kitchen_ap… |
| 11 | `add_profile_fact` | {"entity_type":"contact","entity_id":225,"key":"contact_when_away","value":"direct enquiries to landlord's office when landlord is away","s… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":91,"entity_type":"contact","entity_id":225,"key":"contact_wh… |

Agent's own account of its actions (from the structured result):

- `recall_lessons` - Checked for past lessons on this situation -> No lessons found
- `search_case` - Checked whether the cupboards-and-doors-only estimate had been requested -> Never asked of the contractor; event 018 covered the full kitchen only
- `move_stage` - Moved the stage forward from intake to match the evidence -> intake → landlord_approval
- `send_message` - Asked the contractor for an itemised cupboards-and-doors-only estimate, keeping appliances, worktops and flooring; made clear nothing is approved -> Queued (message 58)
- `send_message` - Updated the tenant: status, no visit booked, safety advice on the sharp edges, next update by 29 Sep -> Queued (message 57)
- `place_hold` - Hold waiting on the landlord's decision and the contractor's second estimate -> Hold 266, follow-up in 5 days
- `escalate_to_human` - Commission/cap/VAT basis unsettled; large scope change; injuries reported -> Queue item 28 (normal priority)
- `add_profile_fact` - Property: two dogs, access to be arranged in advance -> Recorded (fact 89)
- `add_profile_fact` - Property: landlord says appliances, worktops and flooring are in good condition -> Recorded (fact 90)
- `add_profile_fact` - Landlord: when away, direct enquiries to the landlord's office -> Recorded (fact 91)

## Approvals

| Party | Status | Channel |
|---|---|---|
| Soren Pike (Landlord) | granted earlier for the laminate-repair scope only (event 006); no decision yet on full kitchen or cupboards-and-doors replacement | email |

## Escalation & handover

- Escalation needed: **yes**
- Reason: The commission, cap and VAT basis behind the quote is unsettled, which is an agency commercial matter. The scope change is large, and the tenant has reported injuries.
- Handover summary: Full-kitchen figures of £9,260 plus VAT are with the landlord. The contractor raised a 15% commission question (old or revised basis, cap, VAT), and Nia told him to 'use the previous arrangement' without defining it. I have now requested the cupboards-only estimate. The full-kitchen quote includes appliances the landlord says are fine.
- Recommendation: Confirm the commission basis, any cap and the VAT treatment with Alderline in writing, and work out the landlord's total payable. Point out the appliance overlap to the landlord. Consider an interim fix for the sharp edges under the existing laminate approval.

## What could not be verified

- The contractor's view that the laminate can't be repaired; no site visit has been recorded
- Whether the quoted figures include or exclude agency commission
- The electrical work cost (£380 is an estimate)
- The extent of the tenant's injuries

## What failed

_No failures recorded._

## Risks & red flags

- The tenant has reported cuts from sharp edges, and the job has stalled for 3 weeks
- The commission and VAT terms are unsettled and could change the total the landlord pays
- The full-kitchen quote replaces appliances the landlord says are in good condition
- The contractor has been slow to respond (events 020–021)

## Final result / next follow-up

- Final status: Stage landlord_approval, on hold (hold 266) waiting on the landlord's decision and the contractor's second estimate; commission question escalated (queue item 28)
- Next follow-up: 2025-09-29 - Chase the landlord for a decision and the contractor for the cupboards-and-doors-only estimate; update the tenant
- Confidence: 0.8

## Run metadata

- Case folder: `010`
- Session id: wrun_01M4K775NKFMKYB2YXYNR664AS
- Started: 2026-10-10T15:34:31.771Z  Finished: 2026-10-10T15:35:38.332Z  Duration: 66.6s
- Events recorded: 468
- Model(s): anthropic/claude-opus-5.5
- Tokens: in 126107 / out 6583; cost: not reported
