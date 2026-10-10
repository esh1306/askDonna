# Donna operations console

Vite + React frontend and a small Node API over the shared CRM (`data/crm.db`) and the running eve agent.

## Run
From `dwelly-agent/`:
1. `node crm/import.ts --all --reset` (loads the 50 real cases)
2. Start the agent: `npm run dev` (eve, default http://127.0.0.1:2000)
3. `cd console && npm i && npm run dev`, then open http://localhost:5181
   - API on :5180 (started with cwd = project root so it shares `data/crm.db`); Vite on :5181 proxies `/api`.
   - `npm run build` type-checks and builds the frontend.

## Env (read from `dwelly-agent/.env`)
- `DONNA_API_USER` / `DONNA_API_PASSWORD`, `EVE_URL`: how the console talks to the agent.
- `ELEVENLABS_API_KEY`, `ELEVENLABS_AGENT_ID`: browser voice calls. Without them `/api/voice/token` returns 503.
- `CONSOLE_PORT` (default 5180), `CRM_DB` (optional).

## Voice agent setup
`node scripts/setup-elevenlabs.ts` creates the agent (or updates it if `ELEVENLABS_AGENT_ID` is set), saves the config to `docs/elevenlabs-agent.json` and prints the id to put in `.env`.

## Demo flow
1. Pick a ticket, send a tenant message ("Simulate inbound message") or press Run Donna.
2. Donna triages, moves the stage and asks the landlord for approval (email or call). A pending approval shows a Call landlord button.
3. Click Call landlord, allow the microphone and play the landlord: approve with a cap. The decision is recorded, Donna runs again and continues (provider, scheduling).
4. Queued outbox messages show on the ticket; Mark sent logs them to the timeline. Escalations land in the Human queue tab.

Each Donna run is saved to `data/console-runs/<ticket>-<ts>.json` (raw events included).
