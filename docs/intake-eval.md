# Intake classification eval (Jev)

Run: 2026-10-10T12:24:42.802Z  |  cases: 50  |  model: jev-latest  |  mean latency: 221ms (p95 274ms)

Labels come from `data/intake-labels.json` (derived from case outcomes/history, not from the classifier input). Input text is only the initial request (+ first pre-dispatch tenant message).

## Category

Accuracy: **98.0%** (49/50)

Confusion matrix (rows = label, columns = predicted):

| label \ pred | plumbing | appliance | doors_windows_locks | garden_external | cleaning_checkout_works | electrical_lighting | inspection_admin |
|---|---|---|---|---|---|---|---|
| plumbing | 11 | 0 | 0 | 0 | 0 | 0 | 0 |
| appliance | 0 | 13 | 0 | 0 | 0 | 0 | 0 |
| doors_windows_locks | 0 | 0 | 12 | 0 | 0 | 0 | 0 |
| garden_external | 0 | 0 | 0 | 5 | 0 | 0 | 1 |
| cleaning_checkout_works | 0 | 0 | 0 | 0 | 5 | 0 | 0 |
| electrical_lighting | 0 | 0 | 0 | 0 | 0 | 1 | 0 |
| inspection_admin | 0 | 0 | 0 | 0 | 0 | 0 | 2 |

## Split results (tune = cases 001-035, held-out = 036-050, all = 50)

| question | metric | tune | held-out | all |
|---|---|---|---|---|
| category | accuracy | 97.1% (34/35) | 100.0% (15/15) | 98.0% (49/50) |
| needs_landlord_approval | accuracy@0.5 | 65.7% | 73.3% | 68.0% |
| needs_landlord_approval | precision@0.5 | 63.6% | 73.3% | 66.7% |
| needs_landlord_approval | recall@0.5 | 100.0% | 100.0% | 100.0% |
| needs_landlord_approval | Brier (base-rate baseline) | 0.217 (0.240) | 0.199 (0.196) | 0.211 (0.230) |
| likely_self_fixable | accuracy@0.5 | 85.7% | 80.0% | 84.0% |
| likely_self_fixable | precision@0.5 | 60.0% | 100.0% | 75.0% |
| likely_self_fixable | recall@0.5 | 50.0% | 50.0% | 50.0% |
| likely_self_fixable | Brier (base-rate baseline) | 0.115 (0.142) | 0.143 (0.240) | 0.123 (0.182) |

Accuracy by decision threshold (tune / held-out / all):

| question | 0.3 | 0.4 | 0.5 | 0.6 | 0.7 | 0.8 | 0.9 |
|---|---|---|---|---|---|---|---|
| needs_landlord_approval | 65.7% / 73.3% / 68.0% | 65.7% / 73.3% / 68.0% | 65.7% / 73.3% / 68.0% | 65.7% / 73.3% / 68.0% | 40.0% / 26.7% / 36.0% | 40.0% / 26.7% / 36.0% | 40.0% / 26.7% / 36.0% |
| likely_self_fixable | 77.1% / 86.7% / 80.0% | 82.9% / 86.7% / 84.0% | 85.7% / 80.0% / 84.0% | 91.4% / 80.0% / 88.0% | 85.7% / 73.3% / 82.0% | 85.7% / 73.3% / 82.0% | 85.7% / 66.7% / 80.0% |

## needs_landlord_approval

n=50, base rate 64.0%, accuracy@0.5 **68.0%**, precision 66.7%, recall 100.0%, Brier 0.211 (always-base-rate baseline 0.230)

TP 32 / FP 16 / TN 2 / FN 0

| bucket | n | mean predicted | fraction true |
|---|---|---|---|
| 0.0-0.2 | 2 | 0.10 | 0.00 |
| 0.2-0.4 | 0 | - | - |
| 0.4-0.6 | 0 | - | - |
| 0.6-0.8 | 48 | 0.66 | 0.67 |
| 0.8-1.0 | 0 | - | - |

## likely_self_fixable (label: resolved_without_contractor)

n=50, base rate 24.0%, accuracy@0.5 **84.0%**, precision 75.0%, recall 50.0%, Brier 0.123 (always-base-rate baseline 0.182)

TP 6 / FP 2 / TN 36 / FN 6

| bucket | n | mean predicted | fraction true |
|---|---|---|---|
| 0.0-0.2 | 31 | 0.11 | 0.13 |
| 0.2-0.4 | 9 | 0.27 | 0.11 |
| 0.4-0.6 | 4 | 0.52 | 0.25 |
| 0.6-0.8 | 3 | 0.61 | 1.00 |
| 0.8-1.0 | 3 | 0.88 | 1.00 |

## Unlabelled questions (mean predicted probability)

safety_risk: 0.312, needs_more_info: 0.163. No ground truth exists for these in the cases; Dwelly rated every case with an intake note ROUTINE.

## Severity vs Dwelly's own intake classification

Cases with a Dwelly severity: 12. Agreement: **100.0%**. Predicted severity distribution (all cases): {"routine":45,"urgent":1,"emergency":4}

## Routes

{"request_landlord_approval":40,"standard":2,"self_fix_first":3,"emergency_dispatch":4,"ask_for_info":1}

## Worst misses

| case | question | label | predicted | confidence in label | note |
|---|---|---|---|---|---|
| 035 | self_fixable | true | p=0.10 | 0.10 | Shower Repair Request |
| 028 | self_fixable | true | p=0.11 | 0.11 | Loose Water Pipe in the Back Garden |
| 041 | self_fixable | true | p=0.12 | 0.12 | Washing Machine Repair Request |
| 014 | self_fixable | true | p=0.17 | 0.17 | Front Door Repair Request |
| 009 | category | garden_external | inspection_admin | 0.22 | Front garden maintenance follow-up |
| 047 | self_fixable | true | p=0.29 | 0.29 | Bedroom Window Repair Request |
| 006 | needs_landlord_approval | false | p=0.68 | 0.32 | Check-Out Works: Carpet Replacement and Repainting |
| 022 | needs_landlord_approval | false | p=0.67 | 0.33 | Front Door Lock Repair Request |
| 003 | needs_landlord_approval | false | p=0.66 | 0.34 | Checkout Cleaning Estimate and Invoice |
| 015 | needs_landlord_approval | false | p=0.66 | 0.34 | Front Door Repair Request |
| 005 | needs_landlord_approval | false | p=0.66 | 0.34 | Check-Out Cleaning |
| 013 | needs_landlord_approval | false | p=0.66 | 0.34 | Integrated Dishwasher Repair Request |
| 023 | needs_landlord_approval | false | p=0.66 | 0.34 | Balcony Door Lock Repair |
| 029 | needs_landlord_approval | false | p=0.66 | 0.34 | Cracked basin repair request |
| 041 | needs_landlord_approval | false | p=0.66 | 0.34 | Washing Machine Repair Request |

## Iterations

Method: prompt/threshold choices were made looking at cases 001-035 (tune); 036-050 are the held-out set. Honest caveat: I did read the per-case outputs of all 50 when diagnosing misses, so held-out is only lightly independent, and Jev output varies a little between runs (same prompt, run 1 vs the numbers originally in this doc: approval accuracy 68% vs 70%). With 15 held-out cases one case is 6.7 points, treat differences under about 10 points as noise. Five full eval runs were used.

Headline (before = run 1, original prompts, re-run with the split report; after = run 5, final):

| question | metric | before: held-out / all | after: held-out / all |
|---|---|---|---|
| category | accuracy | 93.3% / 94.0% | 100% / 98.0% |
| needs_landlord_approval | accuracy@0.5 | 73.3% / 70.0% | 73.3% / 68.0% |
| needs_landlord_approval | Brier (base-rate baseline) | 0.194 (0.196) / 0.225 (0.230) | 0.199 (0.196) / 0.211 (0.230) |
| needs_landlord_approval | ranking AUC (all 50) | 0.615 | about 0.76 |
| likely_self_fixable | accuracy@0.5 | 53.3% / 74.0% | 80.0% / 84.0% |
| likely_self_fixable | precision / recall (all) | 33% / 17% held-out; 43% / 25% all | 100% / 50% held-out; 75% / 50% all |
| severity vs Dwelly ROUTINE (12 cases, all in tune + a few held-out) | agreement | 58.3% | 100% (predicted: 45 routine, 1 urgent, 4 emergency) |
| reply autonomy (guard eval, 10 cases) | accuracy | 9/10 | 10/10 |

1. Run 1, baseline. Original prompts; added split reporting, threshold sweep and iteration-preserving doc generation to `eval.ts`.
2. Run 2, rewrote four instructions at once (confounded, but budget-limited). Category: outdoor items by location (garden pipe, shed door are garden_external); severity: nearly everything routine, listed what is NOT urgent (stiff door, hard lock, appliance not working); self-fixable: reframed as "closes without a paid contractor" (sticking doors, blocked drains, reset/filter, heat/settling, tenant-owned replacement, landlord handling). Effects: severity agreement 58% to 100% and emergency calls 6 to 4, self-fixable accuracy 74% to 86%, category 96%. Approval got WORSE (52% accuracy, Brier 0.316, AUC 0.564) because I had told it that small single-fitting repairs are within the agent's own authority: that is not a pattern in the data (windows and doors 046-050 all had the approval step; locks 022/023 did not). Rule discarded.
3. Run 3, approval question restored to "default yes for repairs/garden/check-out, no for admin, tenant-only and emergencies; do not guess pre-authorisation". Also tried a separate `needs_quote_first` question as a better-posed predictor of the approval step: AUC 0.59, accuracy 42%, so it was dropped (not in the final code). Approval AUC 0.76 (the admin cases are the only reliably low ones), but raw probabilities all sat at 0.78-0.92.
4. Run 4, added `calibrateApproval` (config comment in `classify.ts`): raw < 0.5 halved, otherwise 0.40 + 0.3 x raw, so repairs get about 0.63-0.68 (base rate 64%) and admin about 0.1. Brier on all 50 0.225 to 0.211 (baseline 0.230). Accuracy cannot move: every repair is still above 0.5 and every admin task below. Also clarified category: a door/window of the dwelling opening onto the garden stays doors_windows_locks (my first outdoor rule had broken case 016).
5. Run 5, final. Reply autonomy (`reply.ts`, `AUTONOMY`): confident decline/approve (intent prob >= 0.9) uses a needs_human_response limit of 0.85 instead of 0.5; the question, safety, dissatisfied and REVIEW_INTENTS checks still apply. Fixes the "No, I will arrange my own contractor" miss (0.72 needs_human) while the dissatisfied-approve, conditional and question cases still go to review. Guard eval re-run: guard 12/12, intent 10/10, autonomy 10/10 (hand-written, 10 cases, not statistically strong). Unit test added.

Threshold choices (all in `THRESHOLDS`, unchanged): LANDLORD_APPROVAL 0.5 (sweep is flat from 0.3 to 0.6 and falls off a cliff above, since calibrated values top out near 0.68); SELF_FIXABLE 0.6 (best tune accuracy, 91.4% at 0.6 vs 85.7% at 0.5; held-out slightly lower, 73% vs 80%, within noise).

### What could not be improved, and why

- needs_landlord_approval accuracy stays at about the 64% base-rate level plus the admin cases (68-70%). The label is "an approval step appears in the history". Near-identical requests differ: window not closing (046, 050: approval) vs window handle fell off (044: none); front door lock hard to turn (022: none) vs key snapped on back door (021: approval); check-out cleaning quotes 003/005/006 none vs 004/008 approval. The deciding factor is each landlord's standing authority and the agency's own judgement, not in the request text. Honest conclusion: Jev can only say "admin, no" and "a repair, probably, about 65%". Use the number as a prior, and let `request_landlord_approval` check the landlord's standing instructions in the CRM rather than the classifier.
- likely_self_fixable: improved, but the label is partly landlord-fixed (028, 035, 041, 045, 047) and tenant-replaced items (038, 040). I put some of those patterns in the prompt (tenant replacing an appliance, landlord handling it), which is label-informed, so the improvement is likely optimistic; recall is only 50% and precision on 15 held-out cases rests on very few positives. Treat self_fix_first as a suggestion, not a gate.
- severity: only 12 Dwelly ROUTINE labels exist, so 100% agreement says "does not over-call", not that urgent/emergency are correct. Remaining 4 emergency calls (021 snapped back-door key, 031 and 033 leaks, 037 leaking shower hose) are plausible but unverified.
- category: the one remaining miss flips between runs (007 spotlights plus ceiling water damage from a check-out report, or 009 front garden follow-up read as check-out). 007 is arguably ambiguous: the labelling rule picked electrical_lighting. Not changed.

### Labels I think may be wrong (not edited)

- 003, 005, 006 (agency check-out cleaning/works quotes) are labelled needs_landlord_approval=false, but 006's history says "the landlord approved the quotation" and 003 notes the invoice went to the landlord. The label comes from the absence of the literal "complete landlord approval step" text, so these look like label-derivation misses rather than genuine no-approval cases.
- 043 (washing machine): the history shows the landlord instructing the repair if simple/cheap and later being informed, i.e. landlord authorisation existed without the literal step marker. 013 and 044 also show "need confirmation from landlord" notes. I did not check every negative's full history.
