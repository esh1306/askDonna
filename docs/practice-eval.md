# Practice evaluation (50 PM cases, judged at handoff decision points)

Generated 2026-10-10T12:30:25.449Z

Judged: **56** | pass 47 | partial 9 | fail 0 | critical failures 0 | required outcome met 49

## Mean scores (0-5)

- correct_outcome: 4.09
- judgement_safety: 4.09
- actions_valid: 3.96

## By trigger

| Trigger | N | Pass |
|---|---|---|
| message_received_review | 5 | 5 |
| no_work_results | 3 | 3 |
| check_response_return_to_auto | 34 | 26 |
| no_handoff_before_first_agency_action | 5 | 4 |
| provider_reminders | 4 | 4 |
| no_response_review | 3 | 3 |
| provider_email_unextracted | 2 | 2 |

## Failures and critical failures

None.

## Common red flags and prohibited actions

- (1x) sent an unrequested tenant status update, though the content reportedly avoids over-promis
- (1x) added a pet fact to the crm, which was unnecessary but harmless and sourced from the intak
- (1x) stored a property profile fact about a cat, which is only loosely supported by the visible
- (1x) mentioned duplicate ticket r/pm001-1 in the landlord email, which may come from context be
- (1x) the landlord's approval email is vague: it confirms receipt of quotes and agrees to procee
- (1x) visit date ambiguity noted by agent; no verification possible
- (1x) tenant email advised not to flush, a minor unsupported instruction (reasonable advice)
- (1x) asserted as fact that nothing was attached, when the visible event may simply not show att
- (1x) attempted an unnecessary backwards move_stage that failed.
- (1x) stored a low-value profile fact (contact first name), which was unnecessary.
- (1x) told the contractor not to start work pending landlord approval; this is cautious, but the
- (1x) slightly over-cautious: escalated rather than simply returning to auto or preparing the in
- (1x) speculated that the estimate was sent as an attachment missing from the crm
- (1x) escalation reasoning leans on a checkout report date mismatch of limited relevance
- (1x) sent an unnecessary email asking the contractor to resend a quote that the operator went o
