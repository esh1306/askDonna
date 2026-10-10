# Donna: an AI-native maintenance operations agent for lettings

Built for the Dwelly London AI Hackathon 2026 (Property Management track).

## 1. What we built

Donna runs residential maintenance requests end to end on a small AI-native CRM:

- **A CRM that remembers.** Every property, tenant, landlord and contractor has a profile of facts (preferred channel, pets, pre-approved spend limit, "pays contractor directly", past repairs), each with the event it came from. Conflicting facts are kept side by side and flagged, never overwritten.
- **An agent that acts, not chats.** Donna is triggered by events (a tenant report, a landlord reply, a contractor email, an escalation) and works through 13 CRM tools: read the ticket and profiles, read attachments (PDF invoices, reports, photos), classify the request, move the pipeline stage, place holds with follow-up dates, request landlord approval by email or voice call, record the landlord's answer, message tenants/landlords/contractors, and hand over to a human queue.
- **A calibrated intake layer.** Jev (TypeSafe AI) classifies each request: category, severity, and calibrated probabilities that it needs landlord approval, is safely self-fixable, is a safety risk, or needs more information.
- **Calibrated autonomy with Jev, at four points.** Intake classification; a reply classifier that decides whether each inbound message can be handled automatically or needs a person (the exact "check if we need to respond, else return to auto mode" handoff Dwelly's system sends to a human every time); an outbound guard that blocks messages claiming unverified completion, unconfirmed dates, credentials or cost commitments; and a consent check before a call transcript counts as landlord approval. Thresholds live in one config each, so an operator can dial autonomy up or down. See `docs/jev-layers.md` and `docs/jev-guards-eval.md` (guard 12/12, reply intent 10/10 on hand-labelled sets).
- **Real phone calls and email.** Approval requests can be delivered as real phone calls (ElevenLabs Agents over Twilio) and real emails (Resend) by the console's outbox worker; after the call, ElevenLabs extracts the decision, Jev checks consent, the CRM is updated and Donna continues. In demo mode every call and email goes only to the team's verified number and inbox.
- **Voice approvals in the browser.** An ElevenLabs voice agent calls the landlord from the operations console, explains the job and the cost, and records approve / reject / "only up to £X" straight into the CRM, after which Donna continues the workflow.
- **A Reality Test runner.** Unseen case folders are imported into the CRM and processed unattended. `ANSWER.md` and `REASONING.md` are rendered only from the recorded eve event stream plus the CRM before/after diff, never written by hand.

## 2. The operational problem

Dwelly's own case logs show maintenance stalling at human handoffs. In the 50 public cases, every inbound reply stops the automation with "Please check if we need to provide a response… If not, please return this request to auto mode" (53 times), cases sit on 236 holds (4.7 per case), contractor emails fail data extraction, and cases run from days to 136 days. A third of requests never needed a contractor at all. See `research/` in the parent workspace notes and `docs/` for the analysis.

Donna takes those handoff decisions itself (reply, advance, hold with a follow-up date, request approval) and escalates only the ones that genuinely need a person, with a handover a human can act on in a minute.

## 3. Architecture

```
case folder / inbound message
        │
        ▼
 runner (runner/)  ──import──►  CRM (crm/, SQLite)  ◄──tools──  Donna (agent/, eve + Claude)
        │                          ▲                                 │
        │                          │                                 ├─ classify_intake ─► Jev (intake/)
        ▼                          │                                 ├─ read_attachment ─► Claude (PDF/vision)
 eve event stream ──► ANSWER.md / REASONING.md / events.ndjson       └─ request_landlord_approval
                                   ▲                                          │
 console (console/) ── voice call (ElevenLabs) ── record_approval ────────────┘
```

| Folder | What it is |
|---|---|
| `agent/` | The eve agent: `agent.ts` (Claude via the Anthropic API), `instructions.md` (judgement rules), `tools/` (13 CRM tools), `channels/eve.ts` (HTTP Basic auth) |
| `crm/` | SQLite schema, typed repository, case importer, attachment reader |
| `intake/` | Jev classifier, ground-truth labels from the public cases, accuracy eval |
| `runner/` | Reality Test runner and the ANSWER/REASONING renderer |
| `practice/` | Practice evaluation on the public cases with a Claude judge |
| `console/` | Operations console: tickets, profiles, human queue, inbound simulator, browser voice calls |
| `scripts/` | ElevenLabs voice agent setup |

## 4. How to run

Prerequisites: Node 24, npm. Copy `.env.example` to `.env` and fill in the keys.

```bash
npm ci
node crm/import.ts --all --reset          # load the 50 public Property Management cases into the CRM
npx eve dev --no-ui                       # agent API on http://127.0.0.1:2000 (dev)
# or, self-hosted:  npx eve build && PORT=3000 npx eve start --host 0.0.0.0

# Reality Test: process every case folder unattended
node runner/reality.ts --cases <reality-test-folder> --out ANSWERS --concurrency 3
```

Console and voice: see `console/README.md`. Practice evaluation: see `practice/README.md`. Intake accuracy: `node intake/eval.ts`.

Self-hosting notes: forward both `/eve/` and `/.well-known/workflow/` through the reverse proxy, persist `.eve/.workflow-data` and `data/crm.db`, and set `DONNA_API_PASSWORD`.

## 5. Models, APIs and services

| Service | Used for |
|---|---|
| Anthropic Claude (`claude-opus-5-5`, direct API) | Donna's reasoning and tool use; attachment transcription (`claude-sonnet-5-5`); practice-eval judge |
| Jev by TypeSafe AI (`jev-latest`) | Calibrated intake classification |
| ElevenLabs Agents | Browser voice calls for landlord approval |
| eve (Vercel, open source) | Agent framework: tools, durable sessions, event stream, traces |
| Node `node:sqlite` | CRM storage |

## 6. Key assumptions

- Reality Test cases arrive in the same folder format as the public cases (`index.md`, `history.md`, `attachments/`).
- Outbound email/SMS are written to the CRM outbox for delivery; we do not send real messages to real people.
- A landlord's pre-approved limit, when recorded in their profile, allows Donna to proceed without asking.
- Emergency safety work may proceed before approval, with the landlord notified and a human escalation.

## Measured results

| Evaluation | Result | Details |
|---|---|---|
| Practice eval: Donna at Dwelly's real handoff points on the public cases, scored by a Claude judge | **18/20 pass, 2 partial, 0 fail, 0 critical failures**; mean correct-outcome 4.2/5, judgement & safety 4.1/5 | `docs/practice-eval.md`, every run's `ANSWER.md`/`REASONING.md`/events in `data/practice/` |
| Jev intake classifier on all 50 public cases | **94% category accuracy**, ~250 ms per request | `docs/intake-eval.md` |

Fixes the evaluation drove: a Jev score-parsing bug that inflated "emergency" severity, a SQLite lock under concurrent runs, attachment leakage from the future in the practice harness, and over-escalation of routine cases (now a "be proportionate" rule in `agent/instructions.md`).

## 7. Known limitations

- **Practice sample size.** 20 of 76 decision points were judged, to conserve API credits; the judge is itself an LLM, and the recorded human action is one acceptable answer, not the only one.
- **Remaining partials are over-caution.** Donna sometimes holds or escalates where the human operator proceeded (e.g. a landlord deferring a door repair with a reported safety concern). We chose to keep the safety bias.
- **Synthetic contacts.** Case contacts have no real addresses or numbers, so in demo mode every email and phone call is redirected to the team's own inbox and verified phone; the intended recipient is shown in the message.
- **Inbound email** is simulated in the console; real inbound needs a verified domain and a webhook.
- **Profiles start sparse.** The deterministic importer only extracts facts it can parse reliably (names from greetings, intake Q&A, "pays directly"); richer profiles build up as Donna records facts during work.
- **Attachments** are transcribed by Claude on demand; very large PDFs or poor photos may lose detail, which Donna reports as unverified.
- **Single agency, single node.** SQLite and eve's local workflow store suit one VPS; a multi-agency deployment would move to Postgres and a hosted workflow world.

## 8. What we would build next

- Real channels end to end: inbound email and SMS webhooks, WhatsApp, and tenant-initiated voice calls into the same CRM context.
- Contractor marketplace signals in profiles (response time, invoice accuracy, no-shows) feeding provider selection automatically.
- Scheduled follow-ups via eve schedules so every hold is chased on its date without a trigger.
- A larger, human-labelled evaluation set built from Dwelly's real handoffs, tracked per release, with the autonomy thresholds tuned per agency.
- Landlord pre-approval limits and preferences captured at onboarding, so most routine jobs never need an approval round-trip.
