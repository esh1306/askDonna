# Practice evaluation harness

Replays the 50 Property Management cases at their human-handoff decision points, runs Donna, and has a Claude judge score it.
Run everything from the project root (`dwelly-agent/`). Outputs go to `data/practice/` and `docs/practice-eval.md`.

1. Decision points (76 across 50 cases): `node practice/decision-points.ts`
2. Start eve against the SEPARATE practice DB. Tools read CRM_DB, so the server and the run must use the same file:
   `CRM_DB=data/practice/practice.db <your usual eve start command>` (PowerShell: `$env:CRM_DB="data/practice/practice.db"; ...`)
   Set `EVE_URL` if it is not http://127.0.0.1:2000. `run.ts` imports the tickets into the same file automatically.
3. Run the agent: `node practice/run.ts --limit 5 --concurrency 3`
   Also `--ids PM001-1,PM010-2` or `--ids 001`; `--dry-run` uses the runner fixture and needs no server.
   Answers: `data/practice/answers/<id>/{ANSWER.md,REASONING.md,events.ndjson,run.json}`. The agent sees only events up to the cutoff.
4. Judge (needs `ANTHROPIC_API_KEY` in env or `.env`; model `claude-opus-5-5`, override with `--model`):
   `node practice/judge.ts [--ids ...] [--limit N]` -> `data/practice/judge/<id>.json`
5. Report: `node practice/report.ts` -> `docs/practice-eval.md`, `data/practice/report.json`

Typecheck: `npx tsc --noEmit -p practice/tsconfig.json`
The judge sees the reference (what the operator did next plus the outcome) as an example only; wait or escalate can pass.
Re-running an id imports a fresh ticket; delete `data/practice/practice.db` to start clean.
