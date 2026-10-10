# Practice evaluation (50 PM cases, judged at handoff decision points)

Generated 2026-10-10T12:25:48.558Z

Judged: **40** | pass 31 | partial 9 | fail 0 | critical failures 0 | required outcome met 32

## Mean scores (0-5)

- correct_outcome: 3.98
- judgement_safety: 4.10
- actions_valid: 3.95

## By trigger

| Trigger | N | Pass |
|---|---|---|
| message_received_review | 5 | 5 |
| check_response_return_to_auto | 24 | 16 |
| no_handoff_before_first_agency_action | 4 | 3 |
| provider_reminders | 3 | 3 |
| no_work_results | 2 | 2 |
| provider_email_unextracted | 2 | 2 |

## Failures and critical failures

None.

## Common red flags and prohibited actions

- (1x) sent an unrequested tenant status update, though the content reportedly avoids over-promis
- (1x) added a pet fact to the crm, which was unnecessary but harmless and sourced from the intak
- (1x) stored a property profile fact about a cat, which is only loosely supported by the visible
- (1x) mentioned duplicate ticket r/pm001-1 in the landlord email, which may come from context be
- (1x) the landlord's approval email is vague: it confirms receipt of quotes and agrees to procee
- (1x) asserted as fact that nothing was attached, when the visible event may simply not show att
- (1x) attempted an unnecessary backwards move_stage that failed.
- (1x) stored a low-value profile fact (contact first name), which was unnecessary.
- (1x) told the contractor not to start work pending landlord approval; this is cautious, but the
- (1x) slightly over-cautious: escalated rather than simply returning to auto or preparing the in
- (1x) speculated that the estimate was sent as an attachment missing from the crm
- (1x) escalation reasoning leans on a checkout report date mismatch of limited relevance
- (1x) told the contractor the report was coming although the agent could not confirm a check-out
- (1x) told contractor access would go via the agency without evidence the agency holds keys (sma
- (1x) speculated that tenant-contact instruction caused the silence, though it was framed as 'pr
