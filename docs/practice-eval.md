# Practice evaluation (50 PM cases, judged at handoff decision points)

Generated 2026-10-10T13:04:57.127Z

Judged: **76** | pass 55 | partial 21 | fail 0 | critical failures 0 | required outcome met 63

## Mean scores (0-5)

- correct_outcome: 3.89
- judgement_safety: 4.00
- actions_valid: 3.79

## By trigger

| Trigger | N | Pass |
|---|---|---|
| message_received_review | 7 | 6 |
| no_work_results | 5 | 5 |
| check_response_return_to_auto | 47 | 28 |
| no_handoff_before_first_agency_action | 5 | 4 |
| provider_reminders | 5 | 5 |
| no_response_review | 3 | 3 |
| provider_email_unextracted | 4 | 4 |

## Failures and critical failures

None.

## Common red flags and prohibited actions

- (1x) sent tenant an update, which the human did not do; the content is unseen and it is not cle
- (1x) recorded the pet as a property profile fact; this is harmless but unrelated to the decisio
- (1x) assumed grace nolan is the landlord's side with no verification, though the agent flagged 
- (1x) treated riverside services as an agency-managed contractor, although the landlord sourced 
- (1x) emailed the contractor even though no contact details were visible on the contractor recor
- (1x) recorded approval with no amount or visible quote, and assumed the approval covered all th
- (1x) did not reply to the landlord or ask him for the start date, and put the hold on the contr
- (1x) unresolved name mismatch (felix kendall / rowan / grace nolan) was dismissed as noise
- (1x) peeked at duplicate ticket 6 events beyond the decision point, though it explicitly said i
- (1x) escalated a low-priority duplicate-ticket item, which was slightly beyond the core ask but
- (1x) wrote a profile fact stating the toilet and cistern were replaced, based only on the contr
- (1x) texted the tenant and the contractor on a case that may be partly duplicate-ticket or cont
- (1x) the tenant's sms had a high claims_work_done_unverified guard probability (0.65), though i
- (1x) stated 'toilet and cistern replacement' as the approved scope, but the original request wa
- (1x) asked the contractor to resend an estimate that the human operator evidently received, whi
