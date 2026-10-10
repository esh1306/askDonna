# Case PM044-2 - Answer

## Decision

**act**

## Summary

Cedar Homes reported on 11 Feb (event 019) that the window handle job was complete. The system flag about "3+ reminders" (event 020) is out of date, because it came after that completion email. Following lesson #4, I moved the ticket to close-out. The invoice they mentioned isn't visible in the CRM, so it can't be checked or forwarded yet. I asked Cedar Homes to resend it, asked the tenant to confirm the window now works, told the landlord where things stand, and set a 3-day hold.

## Judgement

- **Case type:** maintenance
- **Why this decision:** The landlord approved the job ('Please go ahead', event 012) and Cedar Homes reported it complete (event 019), so the job belongs in close-out, not scheduling. The reminders in events 017, 018 and 020 were automated and are stale. The invoice isn't visible and no amount was ever approved, so nothing can be forwarded for payment until it has been checked.

| Alternative considered | Why not |
|---|---|
| Escalate on the reminder flag | The contractor had already replied with completion, so there is nothing for a person to chase. |
| Close straight away as lesson #4 suggests (no chasing the contractor) | I departed from the lesson on one point. The invoice must be checked before payment and we can't see it, so one request to resend it is needed. We also still need the landlord to sign off. |
| Forward the invoice to the landlord | The invoice isn't visible and no amount is on record. |

**Checks performed before acting**

- Landlord approval in event 012 (no amount stated)
- Contractor on the ticket (Cedar Homes) matches the sender of the completion email (Noah Ellis, Cedar Homes)
- No attachments visible on the ticket
- Timing: the reminder in event 020 came after the completion email in event 019
- No open holds or approvals before this action
- Property history: there is another ticket for the same issue (R/PM044-1), which may be a duplicate

**Assumptions**

- The tenant names Harriet and Nora Quinn belong to the same tenancy (for example, joint tenants)

## Actions taken

| # | Tool | Input (gist) | Result | Output (gist) |
|---|---|---|---|---|
| 1 | `get_ticket_context` | {"ticket_id":100} | ok | {"ok":true,"ticket":{"id":100,"case_ref":"R/PM044-2","property_id":58,"tenant_id":247,"landlord_id":248,"contractor_id"… |
| 2 | `classify_reply` | {"ticket_id":100,"text":"Hi Grace\n\nThis is complete, invoice attached.\n\nThanks\n\nNoah Ellis\nCedar Homes\n\nThe reported invoice attac… | ok | {"autonomy":"review","intent":"invoice","intent_probs":{"quote_or_estimate":0,"invoice":0.5,"completion_report":0.5,"sc… |
| 3 | `recall_lessons` | {"ticket_id":100,"situation_text":"Contractor reported window handle job complete and said invoice attached, but the invoice attachment isn… | ok | {"ok":true,"count":5,"lessons":[{"id":4,"situation":"A contractor emails to say a job is complete and attaches a comple… |
| 4 | `move_stage` | {"ticket_id":100,"to":"closeout","reason":"Contractor Cedar Homes (Noah Ellis) reported the job complete on 11 Feb (event 019) after landlo… | ok | {"ok":true,"from":"scheduling","to":"closeout","status":"open"} |
| 5 | `send_message` | {"ticket_id":100,"to":"tenant","channel":"email","subject":"Window handle repair – Flat 21, 129 Juniper Mews (R/PM044-2)","body":"Hello,\n\… | ok | {"ok":true,"message_id":129,"guard":{"blocked":false,"reasons":[],"probs":{"claims_work_done_unverified":0.56,"promises… |
| 6 | `send_message` | {"ticket_id":100,"to":"contractor","channel":"email","subject":"Invoice not received – Flat 21, 129 Juniper Mews (R/PM044-2)","body":"Hi No… | ok | {"ok":true,"message_id":130,"guard":{"blocked":false,"reasons":[],"probs":{"claims_work_done_unverified":0.37,"promises… |
| 7 | `send_message` | {"ticket_id":100,"to":"landlord","channel":"email","subject":"Window handle repair – Flat 21, 129 Juniper Mews (R/PM044-2)","body":"Dear Pa… | ok | {"ok":true,"message_id":133,"guard":{"blocked":false,"reasons":[],"probs":{"claims_work_done_unverified":0.67,"promises… |
| 8 | `place_hold` | {"ticket_id":100,"reason":"Close-out: waiting for Cedar Homes to resend invoice (not visible, event 019) and tenant to confirm window handl… | ok | {"ok":true,"hold_id":266} |
| 9 | `add_profile_fact` | {"entity_type":"contact","entity_id":199,"key":"contact_person","value":"Noah Ellis (Cedar Homes)","source_ref":"event 019 (contractor emai… | ok | {"ok":true,"conflict":false,"unchanged":false,"fact":{"id":143,"entity_type":"contact","entity_id":199,"key":"contact_p… |

Agent's own account of its actions (from the structured result):

- `classify_reply` - Classified the contractor's completion email -> Invoice or completion report; 'review'; no amount mentioned
- `recall_lessons` - Looked up how similar contractor completion reports were handled -> Lesson #4 fits
- `move_stage` - Moved from scheduling to close-out -> Now in close-out
- `send_message` - Asked the tenant to confirm the window handle works -> Queued (message 129)
- `send_message` - Asked Cedar Homes to resend the invoice -> Queued (message 130)
- `send_message` - Told the landlord where things stand and that the invoice will come to them once checked -> Queued (message 133)
- `place_hold` - Hold while waiting for the invoice and the tenant's confirmation -> Hold 266, follow up in 3 days
- `add_profile_fact` - Recorded the contractor's contact person -> Fact 143 saved

## Approvals

| Party | Status | Channel |
|---|---|---|
| Landlord (Palmer) | granted (event 012, no amount stated) | email |

## Escalation & handover

- Escalation needed: **no**
- Reason: A normal close-out step; the reminder flag is out of date

## What could not be verified

- Completion is reported by the contractor only; the tenant hasn't confirmed it yet
- Invoice amount and payee (we can't see the invoice)
- Tenant phone number: 07700 900307 was given in events 015/017, but 07700 900251 in event 016
- Tenant name: Harriet (events 005/007) vs Nora Quinn on the record

## What failed

_No failures recorded._

## Risks & red flags

- No cost was ever agreed. If the invoice amount is high, the landlord needs to confirm it before payment
- Ticket R/PM044-1 on the same property is still open for the same issue (possible duplicate)

## Final result / next follow-up

- Final status: Close-out, on hold (hold 266) waiting for the contractor's invoice and the tenant's confirmation
- Next follow-up: In 3 days (hold 266) - Check the invoice against the approved job, contractor and property, then send it to the landlord for confirmation. If the tenant has confirmed the fix, close the ticket. If not, chase both.
- Confidence: 0.8

## Run metadata

- Case folder: `C:\Users\sahid\Documents\Projects\Hackathons\DwellyHack\dwelly-agent\data\practice\cases\PM044-2`
- Session id: wrun_01M4JZYBFEFN79BXZSDS04S009
- Started: 2026-10-10T13:27:22.729Z  Finished: 2026-10-10T13:28:04.569Z  Duration: 41.8s
- Events recorded: 272
- Model(s): anthropic/claude-opus-5.5
- Tokens: in 108699 / out 4423; cost: not reported
