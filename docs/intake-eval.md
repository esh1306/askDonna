# Intake classification eval (Jev)

Run: 2026-10-10T11:38:20.442Z  |  cases: 50  |  model: jev-latest  |  mean latency: 273ms (p95 400ms)

Labels come from `data/intake-labels.json` (derived from case outcomes/history, not from the classifier input). Input text is only the initial request (+ first pre-dispatch tenant message).

## Category

Accuracy: **94.0%** (47/50)

Confusion matrix (rows = label, columns = predicted):

| label \ pred | plumbing | appliance | doors_windows_locks | garden_external | cleaning_checkout_works | electrical_lighting | inspection_admin |
|---|---|---|---|---|---|---|---|
| plumbing | 11 | 0 | 0 | 0 | 0 | 0 | 0 |
| appliance | 0 | 13 | 0 | 0 | 0 | 0 | 0 |
| doors_windows_locks | 0 | 0 | 12 | 0 | 0 | 0 | 0 |
| garden_external | 1 | 0 | 1 | 4 | 0 | 0 | 0 |
| cleaning_checkout_works | 0 | 0 | 0 | 0 | 5 | 0 | 0 |
| electrical_lighting | 0 | 0 | 0 | 0 | 1 | 0 | 0 |
| inspection_admin | 0 | 0 | 0 | 0 | 0 | 0 | 2 |

## needs_landlord_approval

n=50, base rate 64.0%, accuracy@0.5 **68.0%**, precision 66.7%, recall 100.0%, Brier 0.224 (always-base-rate baseline 0.230)

TP 32 / FP 16 / TN 2 / FN 0

| bucket | n | mean predicted | fraction true |
|---|---|---|---|
| 0.0-0.2 | 2 | 0.14 | 0.00 |
| 0.2-0.4 | 0 | - | - |
| 0.4-0.6 | 1 | 0.54 | 0.00 |
| 0.6-0.8 | 23 | 0.77 | 0.65 |
| 0.8-1.0 | 24 | 0.84 | 0.71 |

## likely_self_fixable (label: resolved_without_contractor)

n=50, base rate 24.0%, accuracy@0.5 **74.0%**, precision 42.9%, recall 25.0%, Brier 0.162 (always-base-rate baseline 0.182)

TP 3 / FP 4 / TN 34 / FN 9

| bucket | n | mean predicted | fraction true |
|---|---|---|---|
| 0.0-0.2 | 20 | 0.10 | 0.15 |
| 0.2-0.4 | 16 | 0.28 | 0.19 |
| 0.4-0.6 | 10 | 0.45 | 0.30 |
| 0.6-0.8 | 4 | 0.70 | 0.75 |
| 0.8-1.0 | 0 | - | - |

## Unlabelled questions (mean predicted probability)

safety_risk: 0.307, needs_more_info: 0.163. No ground truth exists for these in the cases; Dwelly rated every case with an intake note ROUTINE.

## Severity vs Dwelly's own intake classification

Cases with a Dwelly severity: 12. Agreement: **58.3%**. Predicted severity distribution (all cases): {"routine":26,"urgent":18,"emergency":6}

## Routes

{"request_landlord_approval":42,"standard":2,"emergency_dispatch":5,"ask_for_info":1}

## Worst misses

| case | question | label | predicted | confidence in label | note |
|---|---|---|---|---|---|
| 030 | severity | routine | urgent | 0.08 | Plumbing request: slow-filling toilet and bathroom tap |
| 006 | needs_landlord_approval | false | p=0.91 | 0.09 | Check-Out Works: Carpet Replacement and Repainting |
| 014 | severity | routine | urgent | 0.13 | Front Door Repair Request |
| 026 | severity | routine | urgent | 0.13 | Oven Repair Request |
| 050 | severity | routine | emergency | 0.13 | Bedroom Window Repair |
| 038 | self_fixable | true | p=0.15 | 0.15 | Washing Machine Replacement Request |
| 028 | self_fixable | true | p=0.17 | 0.17 | Loose Water Pipe in the Back Garden |
| 045 | self_fixable | true | p=0.17 | 0.17 | Kitchen Window and Patio Door Window Repair |
| 013 | needs_landlord_approval | false | p=0.83 | 0.17 | Integrated Dishwasher Repair Request |
| 015 | needs_landlord_approval | false | p=0.83 | 0.17 | Front Door Repair Request |
| 022 | needs_landlord_approval | false | p=0.83 | 0.17 | Front Door Lock Repair Request |
| 023 | needs_landlord_approval | false | p=0.83 | 0.17 | Balcony Door Lock Repair |
| 041 | needs_landlord_approval | false | p=0.82 | 0.18 | Washing Machine Repair Request |
| 043 | needs_landlord_approval | false | p=0.81 | 0.19 | Washing Machine Repair Request |
| 041 | self_fixable | true | p=0.20 | 0.20 | Washing Machine Repair Request |
