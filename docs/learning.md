# Learning from humans

Donna improves by learning how the team's human operators actually handle maintenance tickets. This is a loop of four steps: mine, capture, recall, vote.

## The loop

1. **Mined from the dataset.** `scripts/mine-lessons.ts` takes every decision point in `data/practice/decision-points.json` (the moment the agent would act, plus the events the human did next). It sends the last ~8 events before the cutoff and the human's next events to Claude Sonnet, which writes one generalised lesson: situation, trigger, stage, category, action, rationale, with no names, addresses or amounts. Near-duplicates (Jaccard >= 0.6 on situation plus action) are merged and the survivor's weight goes up. Results are stored in the `lessons` table (source `dataset`).
2. **Captured from live humans.** When an employee acts in the console (assigns a contractor, resolves an escalation, approves, sends a message, or rejects/edits a suggestion), `learnFromHumanAction` snapshots the ticket, asks Claude to explain the action as a reusable lesson, and stores it (source `human` or `feedback`). The action is also written to `action_log` with actor `human`.
3. **Recalled by the agent.** Before deciding, Donna calls the `recall_lessons` tool. Scoring is deterministic: stage match +2, trigger match +2, category match +1, plus keyword overlap (Jaccard x 5), all multiplied by (0.5 + weight/(weight+2)). The top 5 with score > 0 come back with ids; Donna follows a lesson when it fits, cites its id, and says when it deviates. Set `DONNA_LESSONS=0` to switch recall off (for before/after comparisons).
4. **Voted.** Employees accept (+1) or reject (-1) a lesson in the console; weight never drops below 0, so bad lessons fade and good ones rise.

A companion tool, `find_contractors`, ranks contractors by history at the property, jobs in the same category, and trade-name match, so Donna can pick one when approval arrives without a named provider.

## Mined lessons (001-035)

Total after dedupe: **54** (file: `data/lessons/lessons-001-035.json`).

| Trigger | Lessons |
|---|---|
| landlord_reply | 18 |
| no_response | 8 |
| tenant_reply | 8 |
| contractor_reply | 6 |
| contractor_completion | 4 |
| quote_received | 3 |
| extraction_failed | 3 |
| invoice_received | 2 |
| reminders | 2 |

## Ten example lessons

1. **no_response** / works / plumbing (weight 1, PM002 event 15)
   - Situation: A confirmed repair visit has passed (a second attempt after an earlier failed fix) and the system has flagged that no work results or completion update have been received from the contractor.
   - Action: Review the case thread to see whether the contractor has sent any message that still needs a reply from the agency. If nothing is outstanding, return the request to auto mode so the standard chasers for completion or results continue, and do not escalate or re-book manually.
   - Why: A missing work result often just means the contractor's update has not arrived yet, so the first step is to confirm whether the ball is in the agency's court before intervening, and otherwise let automation resume the follow-up.
2. **landlord_reply** / scheduling / gardening (weight 1, PM001 event 23)
   - Situation: A landlord who is arranging communal garden works through their own contractor confirms they have received quotes and agree to proceed, but no start date has been given yet.
   - Action: Acknowledge the landlord's approval and ask them to pass on the contractor's start date as soon as they have it. Put the job on hold with the reason 'Waiting for Landlord' and a note that the start date is pending. Send a short update to the tenants who reported the issue, telling them a contractor has been instructed and that you will confirm the start date once you have it.
   - Why: The landlord is managing the contractor, so the agency cannot schedule the works until the date comes back. Holding the job and keeping the reporting tenants informed avoids chasing too early and stops tenants wondering whether anything is happening.
3. **invoice_received** / closeout / cleaning (weight 1, PM003 event 18)
   - Situation: A contractor who completed an approved cleaning job emails to say their invoice has been sent to the agency's operator, while the request is on hold waiting for the provider and the system is prompting the operator to check whether a reply is needed or to return the request to auto mode.
   - Action: When the contractor confirms the invoice has been sent, no reply to them is needed. Move the task to the result/completed state, mark the request as completed for final checks, and forward the invoice to the landlord with a short covering note. Record that landlord confirmation is needed, then close the request once the final checks are done.
   - Why: A contractor's invoice notification is an informational closing message rather than a question, so the right response is to progress closeout and pass the invoice to the landlord instead of replying or leaving the request on hold.
4. **contractor_completion** / closeout / plumbing (weight 1, PM002 event 35)
   - Situation: A contractor emails to say a job is complete and attaches a completion photo and invoice, but the attachments are unavailable or unreadable, and the system has flagged the case to check whether a reply to the provider is needed or to return it to auto mode.
   - Action: Treat the contractor's completion email as no further reply needed to the provider. Move the task to the result stage, mark the request completed and start the final checks. If the completion photo or invoice could not be opened or isn't required, record a reason for skipping the document upload. Then flag the case for landlord confirmation before closing, and return the request to auto mode rather than chasing the contractor.
   - Why: A clear completion confirmation from the contractor does not need a response, and the remaining closeout step is landlord sign-off, which automation can continue once the request is back in auto mode.
5. **contractor_reply** / landlord_approval / cleaning (weight 1, PM003 event 8)
   - Situation: A checkout-clean estimate was requested from a contractor and the job was placed on hold waiting for the provider; the contractor then replied by email with the estimate and asked to be told if the attachment had not come through.
   - Action: When a contractor replies after a hold for provider response, open the email and confirm the estimate attachment is present and matches the requested scope (clean, removal of dumped items, carpet clean). If it is, reply to the contractor confirming receipt and telling them to proceed, record the estimate as approved, and keep the job on hold with a 'hold for works' note until the works are completed instead of returning it to auto mode.
   - Why: Answering the contractor promptly with clear confirmation avoids delay, and holding the job for works stops automation from chasing or progressing it before the clean is done.
6. **landlord_reply** / landlord_approval / gardening (weight 1, PM001 event 8)
   - Situation: A tenant reports overgrown communal garden and hedges, and the landlord replies that they have already arranged a site visit with their own contractor and are waiting on quotes for related works, so the agency does not need to source a provider.
   - Action: Do not proceed to provider selection or dispatch. Place the job on hold with the reason 'Waiting for Landlord' and note the expected follow-up date. Check for any duplicate or overlapping requests for the same works. Then chase the landlord for the contractor's quote, asking them to share it once received so approval can be progressed.
   - Why: When the landlord is already handling the works through their own contractor, the agency sourcing separately would duplicate effort and cut across the landlord's arrangements, so the correct step is to pause and follow up until the quote arrives.
7. **contractor_reply** / provider_selection / cleaning (weight 1, PM005 event 7)
   - Situation: A contractor has been asked to quote for an end-of-tenancy clean after the tenant vacated, and replies asking for the check-out report to be attached to the request so they can scope the work.
   - Action: When a contractor quoting a check-out clean asks for the check-out report, locate the report on the property record and email it to that contractor on the same job thread, referencing the job ID, without escalating or pausing for a human handoff. Keep the job on hold awaiting their estimate.
   - Why: The check-out report defines the cleaning scope and condition, so supplying it promptly is a routine information request that unblocks an accurate quote.
8. **quote_received** / landlord_approval / cleaning (weight 1, PM004 event 10)
   - Situation: A checkout-clean request was auto-paused because the property is vacant (not tenanted), a contractor was asked to quote against the checkout report, and the contractor then replied confirming the quote has been sent.
   - Action: When the contractor confirms their quote has been sent after a vacant-property pause, review the quote against the checkout report scope and forward it to the landlord for approval, stating that the clean is chargeable to the outgoing tenant and asking whether the contractor may proceed. Then put the job on hold as 'Waiting for Landlord' rather than returning it to auto mode, and do not send a further reply to the contractor.
   - Why: A vacant-property pause needs manual handling, and the quote must have landlord sign-off before the contractor is instructed, so the job should wait on the landlord instead of resuming automatic processing.
9. **quote_received** / landlord_approval / any category (weight 1, PM006 event 13)
   - Situation: After several reminders to a contractor about booking a check-out works visit, the contractor replies with an itemised quote for the work but no appointment details, and the request had been put on hold for a quote.
   - Action: Treat the contractor's reply as the awaited quote rather than a scheduling confirmation. Forward the itemised quote to the landlord, listing each line item and its price, and ask explicitly for approval to instruct the contractor so the property can be made ready for remarketing. Keep the request on hold until the landlord replies, and do not instruct the contractor or return the job to auto mode before approval is received.
   - Why: Quote-based works need landlord sign-off before the contractor proceeds, and a contractor reply that contains a quote means the chasing for an appointment has been superseded by the approval step.
10. **reminders** / provider_selection / general maintenance (weight 1, PM006 event 9)
   - Situation: A quote-required check-out works job (carpet replacement and repainting after the tenant vacated) has been assigned to a provider, who has ignored several automated reminders to book the tenant visit and has not confirmed an appointment.
   - Action: When the system flags that several reminders have gone unanswered, check the job's communication history for any reply from the provider, such as a quote or an appointment already arranged outside the thread. If the provider is engaged and a quote is expected, put the job on hold for the quote rather than sending more automated chasers. Check whether a response to the provider is needed. If none is needed, return the job to auto mode. If the provider has still not engaged, contact them directly or reassign the job.
   - Why: Repeated automated reminders add noise when the provider is already working on a quote, so a human check separates a silent provider from one who is just slow to confirm, and the job can be held or returned to automation accordingly.
