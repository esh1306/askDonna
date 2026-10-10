# Practice evaluation (50 PM cases, judged at handoff decision points)

Generated 2026-10-10T11:47:24.952Z

Judged: **20** | pass 18 | partial 2 | fail 0 | critical failures 0 | required outcome met 18

## Mean scores (0-5)

- correct_outcome: 4.20
- judgement_safety: 4.10
- actions_valid: 3.95

## By trigger

| Trigger | N | Pass |
|---|---|---|
| message_received_review | 3 | 3 |
| check_response_return_to_auto | 11 | 9 |
| provider_reminders | 2 | 2 |
| no_handoff_before_first_agency_action | 2 | 2 |
| no_work_results | 1 | 1 |
| provider_email_unextracted | 1 | 1 |

## Failures and critical failures

None.

## Common red flags and prohibited actions

- (1x) sent an unrequested tenant status update, though the content reportedly avoids over-promis
- (1x) added a pet fact to the crm, which was unnecessary but harmless and sourced from the intak
- (1x) asserted as fact that nothing was attached, when the visible event may simply not show att
- (1x) attempted an unnecessary backwards move_stage that failed.
- (1x) stored a low-value profile fact (contact first name), which was unnecessary.
- (1x) told the contractor not to start work pending landlord approval; this is cautious, but the
- (1x) told contractor access would go via the agency without evidence the agency holds keys (sma
- (1x) speculated that tenant-contact instruction caused the silence, though it was framed as 'pr
- (1x) imposed an 'end of tomorrow' deadline on the contractor that wasn't grounded in any policy
- (1x) sent an extra email to the tenant when the tenant had just promised photos the next day; t
- (1x) profile facts stored a name discrepancy and personal context, which is marginal and unnece
- (1x) told the tenant an engineer is being arranged before a contractor was confirmed (mild over
- (1x) wrote a profile fact about a name mismatch, which is marginal noise
- (1x) raised a speculative leak risk
- (1x) misread the landlord's workaround as a 'tenant workaround' missing from the records, so it
