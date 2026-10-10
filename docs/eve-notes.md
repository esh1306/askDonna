# eve cheat-sheet (eve ^0.76, docs at node_modules/eve/docs/)

## 1. Model config for Claude (direct Anthropic, NO AI Gateway)  (agent-config.md "Set the model")
Project uses direct provider (agent/agent.ts):
```ts
import { defineAgent } from "eve";
import { anthropic } from "eve/models/anthropic";
export default defineAgent({ model: anthropic(process.env.DONNA_MODEL ?? "claude-opus-5-5"), reasoning: "high" });
```
Doc quote: "Both helpers accept an optional native provider model ID and use `OPENAI_API_KEY` or `ANTHROPIC_API_KEY`. ... Deployments require their API key in the server environment." (`anthropic()` default = claude-sonnet-5.) Gateway strings ("anthropic/claude-opus-5.5", needs AI_GATEWAY_API_KEY) are NOT used.
`reasoning`: provider-default|none|minimal|low|medium|high|xhigh. `limits: { maxTokenCostUsdPerSession, maxInputTokensPerSession }` exist (default input cap 40M).

## 2. defineTool  (tools/overview.mdx)
```ts
// agent/tools/get_weather.ts  -> tool name = filename slug
import { defineTool } from "eve/tools";
import { z } from "zod";
export default defineTool({
  description: "Get weather.",
  inputSchema: z.object({ city: z.string().min(1) }),   // zod / Standard Schema / JSON Schema
  async execute({ city }, ctx) { return { city, tempF: 72 }; },
});
```
- Optional: `outputSchema`, `approval`, `endsTurn`, `deferred`, `label`.
- Throwing in `execute` => failed `action.result` (`result.isError`, `data.error`), error is given to the model; eve never auto-retries. Not idempotent-safe: an interrupted step may re-run the tool - use idempotency keys.
- Tools run in app runtime with full `process.env` (not sandbox).

## 3. Structured output  (guides/client/output-schema.mdx)
Per-turn, sent in the POST body as `outputSchema` (JSON Schema object; the TS client lowers zod to JSON Schema). Server validates; final payload arrives as event `result.completed` -> `data.result`. Works on session create and on follow-up turns (`session.send(msg,{outputSchema})`, also `respond`). Scope = that turn only. Not accepted on message-free create.
```bash
curl -X POST http://127.0.0.1:2000/eve/v1/session -H 'content-type: application/json' \
  -d '{"message":"...","outputSchema":{"type":"object","properties":{...},"required":[...]}}'
```
Note: `endsTurn` is ignored on structured-output turns.

## 4. Run headless / self-host  (reference/cli.md)
- Dev: `npx eve dev --no-ui [--port N]` -> default port **2000** (`$PORT` honored).
- Self-host (VPS): `npx eve build` then `PORT=3000 npx eve start --host 0.0.0.0` (default port 3000; `eve start` also runs cron schedules). Reverse proxy must forward BOTH `/eve/` and `/.well-known/workflow/`. Persist `.eve/.workflow-data` (local Workflow World state) across restarts.
- Health: `GET /eve/v1/health`; inspect: `GET /eve/v1/info`.
- Auth: eveChannel uses `httpBasic({username: DONNA_API_USER ?? "donna", password: DONNA_API_PASSWORD})` then `localDev()`. Runner sends `Authorization: Basic base64(user:pass)` when DONNA_API_PASSWORD is set (env or dwelly-agent/.env). Runner URL: `EVE_URL` (default http://127.0.0.1:2000; use :3000 for eve start).

## 5. HTTP session API  (concepts/sessions-runs-and-streaming.md)
| Op | Request |
|---|---|
| create + first turn | `POST /eve/v1/session {message, outputSchema?, clientContext?}` -> 202 `{sessionId}` + header `x-eve-session-id` |
| create parked | `POST /eve/v1/session` (no message) |
| stream (NDJSON) | `GET /eve/v1/session/<id>/stream[?startIndex=N]` (N absolute event count; negative = from tail) |
| follow-up | `POST /eve/v1/session/<id> {message}` or `{inputResponses:[{requestId,optionId}]}` (exactly one) |
| cancel | `POST /eve/v1/session/<id>/cancel` |
| compact/clear/reset | `POST .../compact | /clear | /reset {reason}` |
Immediate follow-up can return `409 session_not_ready` -> retry with backoff (client retries up to 20s). Response header `x-eve-stream-version` (client accepts v21-v26). Stream may end at lease boundaries - reconnect with `startIndex=<events seen>`; dedupe on `meta.id`.
Messages default to "steer" (a new message interrupts the running turn).

TS client (simple, typed; `eve/client`): `new Client({host})`, `client.sessions.create({message,outputSchema})` -> `{session,response}`, `await response.result()` -> `{message,status:"waiting"|"completed"|"failed",events,sessionId,data,inputRequests}`. We use raw fetch in runner/eve-client.ts to keep raw events byte-exact.

## 6. Events we use (every event: `{type, data, meta:{id,at}}`)
- `session.started`, `turn.started {turnId}`, `message.received {message, parts, turnId}`
- `step.started {stepIndex, modelId, turnId}`; `step.completed {finishReason, usage}`; `step.failed {code,message}`
- `reasoning.completed {reasoning, stepIndex}`; `message.completed {message, finishReason ("tool-calls" = narration), stepIndex}`
- `actions.requested {actions:[{callId, kind:"tool-call"|"workflow-tool-call"|"load-skill"|"subagent-call"|"remote-agent-call", toolName|name|subagentName, input}]}` (fires before execution)
- `action.result {result:{kind:"tool-result", callId, toolName, output, isError}, error?:{code,message}, status?}` (subagent: `kind:"subagent-result"`, `subagentName`; skill: `load-skill-result`)
- `result.completed {result}` (structured output), `input.requested {requests:[{requestId,prompt,options,action:{callId,toolName,input}}]}`, `input.resolved {resolutions:[{requestId,outcome,response}]}`
- `turn.waiting {on:"input"|"tasks"}`, `turn.completed`, `turn.failed {code,message,details}`, `turn.cancelled`, `session.waiting {usage}`, `session.failed`
- usage: `session.waiting|session.failed|turn.waiting data.usage` = running total (`inputTokens`, `outputTokens`, `costUsd?` absent w/o gateway cost). Exact usage field names on `step.completed` are only partially documented - runner reads them defensively.
- Terminal for a turn: `turn.completed | turn.failed | turn.cancelled`; then `session.waiting`.

## 7. Human-in-the-loop  (tools/human-in-the-loop.md)
```ts
import { always, once, never, auto } from "eve/tools/approval";
defineTool({ ..., approval: always() });          // omitted = never() => runs without approval!
approval: ({session, toolInput}) => toolInput?.amount > 1000 ? "user-approval" : "not-applicable"
```
Flow: `input.requested` -> `turn.waiting {on:"input"}` -> answer with `POST /session/<id> {inputResponses:[{requestId, optionId:"approve"}]}` -> `input.resolved`. A plain text message that is not an option cancels the approval. Sessions with no human (markdown schedules) FAIL on approval. Questions: built-in `ask_question` / `ctx.ask()`. Unattended runs: avoid approval-gated tools or answer programmatically.

## 8. Hooks  (guides/hooks.md)
```ts
// agent/hooks/audit.ts  (observe-only, fires after event is durable)
import { defineHook } from "eve/hooks";
export default defineHook({ events: { "*": async (event, ctx) => { /* event.meta.id, ctx.session.id */ },
                                      "action.result": async (event) => {} } });
```
`toolResultFrom(event.data.result, toolDef)` from `eve/tools` narrows typed results. A hook can persist every event keyed on `meta.id`. In-process stream read: `sessions.attach(id).stream({follow:false})` from `eve/server`.

## 9. Schedules  (schedules.mdx)
`agent/schedules/<name>.ts`: `defineSchedule({ cron: "0 9 * * 1-5", markdown: "prompt" })` (fire-and-forget, no channel, fails on approvals) or `run({to, waitUntil, appAuth})` handler. 5-field cron, UTC on Vercel. `eve dev` never fires crons; `eve start` does. Dispatch route exists for manual triggering in dev.

## Open uncertainties
- Exact `usage` field names inside `step.completed`; `result.completed` appears before `turn.completed` (per docs).
