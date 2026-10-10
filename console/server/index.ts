import http from "node:http";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { addEvent, all, one, getTicketContext, resolveApproval, markMessage, run } from "../../crm/repo.ts";
import type { ApprovalRow, HumanQueueRow } from "../../crm/repo.ts";
import { runTurn, loadEnvFile } from "../../runner/eve-client.ts";
import { resultJsonSchema } from "../../runner/output-schema.ts";

loadEnvFile();
const PORT = Number(process.env.CONSOLE_PORT ?? 5180);
const RUNS_DIR = resolve(process.cwd(), "data/console-runs");

class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function send(res: http.ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
}
async function readBody(req: http.IncomingMessage): Promise<any> {
  const chunks: Buffer[] = [];
  for await (const c of req) chunks.push(c as Buffer);
  const s = Buffer.concat(chunks).toString("utf8");
  if (!s) return {};
  try {
    return JSON.parse(s);
  } catch {
    throw new HttpError(400, "invalid JSON body");
  }
}

function listTickets() {
  return all(
    `SELECT t.id, t.case_ref, t.title, t.category, t.severity, t.stage, t.status, t.priority, t.updated_at,
       p.address,
       (SELECT COUNT(*) FROM approvals a WHERE a.ticket_id=t.id AND a.status='pending') AS pending_approvals,
       (SELECT COUNT(*) FROM human_queue h WHERE h.ticket_id=t.id AND h.status='open') AS open_escalations,
       (SELECT COUNT(*) FROM outbox o WHERE o.ticket_id=t.id AND o.status='queued') AS queued_outbox
     FROM tickets t LEFT JOIN properties p ON p.id=t.property_id ORDER BY t.id`,
  );
}

function listRuns(ticketId: number) {
  if (!existsSync(RUNS_DIR)) return [];
  return readdirSync(RUNS_DIR)
    .filter((f) => f.startsWith(`${ticketId}-`))
    .sort()
    .map((f) => ({ file: f, ...JSON.parse(readFileSync(resolve(RUNS_DIR, f), "utf8")) }));
}

function ticketDetail(id: number) {
  const ctx = getTicketContext(id, { events: 100000 });
  if (!ctx.ok) throw new HttpError(404, ctx.error);
  return {
    ...ctx,
    outbox: all("SELECT * FROM outbox WHERE ticket_id=? ORDER BY id", id),
    action_log: all("SELECT * FROM action_log WHERE ticket_id=? ORDER BY id", id),
    runs: listRuns(id),
  };
}

async function runDonna(ticketId: number, message: string) {
  let outcome;
  try {
    outcome = await runTurn(message, { outputSchema: resultJsonSchema });
  } catch (e) {
    throw new HttpError(
      503,
      `Could not reach the Donna agent at ${process.env.EVE_URL ?? "http://127.0.0.1:2000"} (is eve running?): ${(e as Error).message}`,
    );
  }
  if (outcome.error && outcome.events.length === 0)
    throw new HttpError(503, `Could not reach the Donna agent at ${process.env.EVE_URL ?? "http://127.0.0.1:2000"} (is eve running?): ${outcome.error}`);
  mkdirSync(RUNS_DIR, { recursive: true });
  const ts = new Date().toISOString();
  const rec = {
    ticket_id: ticketId,
    ts,
    message,
    sessionId: outcome.sessionId,
    result: outcome.result,
    finalText: outcome.finalText,
    error: outcome.error,
    events: outcome.events,
  };
  writeFileSync(resolve(RUNS_DIR, `${ticketId}-${ts.replace(/[:.]/g, "-")}.json`), JSON.stringify(rec, null, 2));
  return {
    ts,
    sessionId: outcome.sessionId,
    result: outcome.result,
    finalText: outcome.finalText,
    error: outcome.error,
    event_count: outcome.events.length,
  };
}

const needTicket = (id: number) => {
  if (!one("SELECT id FROM tickets WHERE id=?", id)) throw new HttpError(404, `ticket ${id} not found`);
};

async function handle(req: http.IncomingMessage, res: http.ServerResponse) {
  const p = new URL(req.url ?? "/", "http://x").pathname;
  const m = req.method ?? "GET";
  let g: RegExpExecArray | null;

  if (m === "GET" && p === "/api/tickets") return send(res, 200, listTickets());
  if (m === "GET" && (g = /^\/api\/tickets\/(\d+)$/.exec(p))) return send(res, 200, ticketDetail(Number(g[1])));

  if (m === "GET" && p === "/api/queue") {
    return send(
      res,
      200,
      all(
        `SELECT h.*, t.title, t.case_ref, pr.address FROM human_queue h JOIN tickets t ON t.id=h.ticket_id
         LEFT JOIN properties pr ON pr.id=t.property_id WHERE h.status='open' ORDER BY h.id DESC`,
      ),
    );
  }
  if (m === "POST" && (g = /^\/api\/queue\/(\d+)\/resolve$/.exec(p))) {
    const id = Number(g[1]);
    const row = one<HumanQueueRow>("SELECT * FROM human_queue WHERE id=?", id);
    if (!row) throw new HttpError(404, "queue item not found");
    run("UPDATE human_queue SET status='resolved' WHERE id=?", id);
    addEvent(row.ticket_id, { kind: "note", direction: "internal", party: "human", body: `Human resolved escalation: ${row.reason}` });
    return send(res, 200, { ok: true });
  }

  if (m === "GET" && p === "/api/outbox") {
    return send(
      res,
      200,
      all(`SELECT o.*, t.title, t.case_ref FROM outbox o JOIN tickets t ON t.id=o.ticket_id ORDER BY (o.status='queued') DESC, o.id DESC`),
    );
  }
  if (m === "POST" && (g = /^\/api\/outbox\/(\d+)\/sent$/.exec(p))) {
    const r = markMessage(Number(g[1]), "sent");
    return send(res, r.ok ? 200 : 400, r);
  }

  if (m === "POST" && (g = /^\/api\/tickets\/(\d+)\/inbound$/.exec(p))) {
    const id = Number(g[1]);
    needTicket(id);
    const b = await readBody(req);
    if (!["tenant", "landlord", "contractor"].includes(b.from)) throw new HttpError(400, "from must be tenant, landlord or contractor");
    if (!["email", "sms", "call"].includes(b.channel)) throw new HttpError(400, "channel must be email, sms or call");
    if (!String(b.body ?? "").trim()) throw new HttpError(400, "body is required");
    addEvent(id, { kind: b.channel, direction: "in", party: b.from, body: b.body });
    const out = await runDonna(
      id,
      `New inbound ${b.channel} from ${b.from} on CRM ticket ${id}: ${b.body}. Load the ticket context, decide and act, then return the structured result.`,
    );
    return send(res, 200, out);
  }
  if (m === "POST" && (g = /^\/api\/tickets\/(\d+)\/run$/.exec(p))) {
    const id = Number(g[1]);
    needTicket(id);
    return send(res, 200, await runDonna(id, `Review CRM ticket ${id} and take the next step.`));
  }

  if (m === "GET" && p === "/api/voice/token") {
    const key = process.env.ELEVENLABS_API_KEY;
    const agent = process.env.ELEVENLABS_AGENT_ID;
    if (!key || !agent)
      throw new HttpError(
        503,
        "Voice is not configured: set ELEVENLABS_API_KEY and ELEVENLABS_AGENT_ID in .env (run node scripts/setup-elevenlabs.ts to create the agent).",
      );
    const r = await fetch(`https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${encodeURIComponent(agent)}`, {
      headers: { "xi-api-key": key },
    });
    const j: any = await r.json().catch(() => ({}));
    if (!r.ok || !j.token) throw new HttpError(502, `ElevenLabs token request failed (${r.status}): ${JSON.stringify(j)}`);
    return send(res, 200, { token: j.token });
  }
  if (m === "POST" && p === "/api/voice/approval") {
    const b = await readBody(req);
    const approval = one<ApprovalRow>("SELECT * FROM approvals WHERE id=?", Number(b.approval_id));
    if (!approval) throw new HttpError(404, "approval not found");
    if (!["approve", "reject", "need_more_info"].includes(b.decision))
      throw new HttpError(400, "decision must be approve, reject or need_more_info");
    const words = [
      `Decision: ${b.decision}`,
      b.max_amount_gbp != null ? `Max amount: GBP ${b.max_amount_gbp}` : "",
      b.conditions ? `Conditions: ${b.conditions}` : "",
      b.notes ? `Notes: ${b.notes}` : "",
    ]
      .filter(Boolean)
      .join(". ");
    if (b.decision !== "need_more_info") {
      const r = resolveApproval(approval.id, b.decision === "approve" ? "approved" : "rejected", words);
      if (!r.ok) throw new HttpError(409, r.error);
    }
    addEvent(approval.ticket_id, {
      kind: "call",
      direction: "in",
      party: "landlord",
      body: `Voice call with landlord. ${words}${b.transcript ? `\n\nTranscript:\n${b.transcript}` : ""}`,
    });
    const out = await runDonna(
      approval.ticket_id,
      `A voice call with the landlord just finished on CRM ticket ${approval.ticket_id} (approval ${approval.id}): ${words}. Load the ticket context, continue the workflow, then return the structured result.`,
    ).catch((e) => ({ error: (e as Error).message }));
    return send(res, 200, { ok: true, recorded: b.decision, run: out });
  }

  throw new HttpError(404, "not found");
}

http
  .createServer((req, res) => {
    handle(req, res).catch((e) => {
      if (e instanceof HttpError) return send(res, e.status, { error: e.message });
      console.error(e);
      send(res, 500, { error: String(e?.message ?? e) });
    });
  })
  .listen(PORT, () => console.log(`Donna console API on http://127.0.0.1:${PORT} (cwd ${process.cwd()})`));
