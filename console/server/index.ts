import http from "node:http";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { addEvent, all, one, getTicketContext, resolveApproval, markMessage, run, upsertContact, insertEvent, moveStage, queueMessage, linkContact } from "../../crm/repo.ts";
import type { ApprovalRow, HumanQueueRow } from "../../crm/repo.ts";
import { runTurn, loadEnvFile } from "../../runner/eve-client.ts";
import { resultJsonSchema } from "../../runner/output-schema.ts";
import { processOutbox, pollCalls, placeCall, loadCalls, setDonnaTrigger, startWorker } from "./outbox-worker.ts";

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

async function lessonsMod(): Promise<any> {
  try {
    return await import("../../crm/lessons.ts");
  } catch (e) {
    throw new HttpError(503, `Lessons module not available: ${(e as Error).message}`);
  }
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | { ok: false; error: string }> {
  return Promise.race([p, new Promise<{ ok: false; error: string }>((r) => setTimeout(() => r({ ok: false, error: "learning timed out" }), ms))]);
}

async function learn(input: any): Promise<any> {
  try {
    const L = await lessonsMod();
    return await withTimeout(L.learnFromHumanAction(input), 8000);
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

function suggestionFor(ticketId: number) {
  const runs = listRuns(ticketId).filter((r: any) => r.result);
  const last: any = runs[runs.length - 1];
  if (!last) return { suggestion: null, lesson_ids: [] as number[] };
  const r = last.result;
  let text: string | null = null;
  let kind = "";
  if (r.escalation?.needed && r.escalation.recommendation) { text = r.escalation.recommendation; kind = "escalation"; }
  else if (r.next_follow_up?.what) { text = `${r.next_follow_up.what}${r.next_follow_up.when ? ` (${r.next_follow_up.when})` : ""}`; kind = "follow_up"; }
  else if (r.planned_actions?.length) { const a = r.planned_actions[0]; text = typeof a === "string" ? a : a.description ?? JSON.stringify(a); kind = "planned"; }
  else if (r.summary) { text = r.summary; kind = "summary"; }
  const blob = JSON.stringify([last.events ?? [], r]);
  const ids = new Set<number>();
  for (const m of blob.matchAll(/lessons?[\s_#:\\"]*#?(\d+)/gi)) ids.add(Number(m[1]));
  return { suggestion: text, kind, ts: last.ts, lesson_ids: [...ids], decision: r.decision };
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

  if (m === "POST" && p === "/api/outbox/process") {
    const r = await processOutbox();
    await pollCalls();
    return send(res, 200, r);
  }
  if (m === "GET" && p === "/api/calls") return send(res, 200, loadCalls());
  if (m === "POST" && (g = /^\/api\/approvals\/(\d+)\/phone-call$/.exec(p))) {
    const approval = one<ApprovalRow>("SELECT * FROM approvals WHERE id=?", Number(g[1]));
    if (!approval) throw new HttpError(404, "approval not found");
    if (approval.status !== "pending") throw new HttpError(409, `approval is ${approval.status}`);
    const r = await placeCall(null, approval);
    if (!r.ok) throw new HttpError(/not configured/.test(r.note) ? 503 : 502, r.note);
    return send(res, 200, r);
  }

  if (m === "GET" && p === "/api/lessons") {
    const u = new URL(req.url ?? "/", "http://x");
    const L = await lessonsMod();
    return send(res, 200, L.listLessons({ q: u.searchParams.get("q") || undefined, source: u.searchParams.get("source") || undefined, limit: 500 }));
  }
  if (m === "POST" && (g = /^\/api\/lessons\/(\d+)\/vote$/.exec(p))) {
    const b = await readBody(req);
    if (b.delta !== 1 && b.delta !== -1) throw new HttpError(400, "delta must be 1 or -1");
    const L = await lessonsMod();
    const l = L.voteLesson(Number(g[1]), b.delta);
    if (!l) throw new HttpError(404, "lesson not found");
    return send(res, 200, l);
  }

  if (m === "GET" && (g = /^\/api\/tickets\/(\d+)\/suggestion$/.exec(p))) {
    needTicket(Number(g[1]));
    return send(res, 200, suggestionFor(Number(g[1])));
  }
  if (m === "POST" && (g = /^\/api\/tickets\/(\d+)\/suggestion\/feedback$/.exec(p))) {
    const id = Number(g[1]);
    needTicket(id);
    const b = await readBody(req);
    if (!["accept", "reject", "edit"].includes(b.verdict)) throw new HttpError(400, "verdict must be accept, reject or edit");
    const sug = suggestionFor(id);
    const ids: number[] = Array.isArray(b.lesson_ids) ? b.lesson_ids.map(Number) : sug.lesson_ids ?? [];
    const L = await lessonsMod().catch(() => null);
    const vote = (d: 1 | -1) => { if (L) for (const i of ids) try { L.voteLesson(i, d); } catch {} };
    if (b.verdict === "accept") {
      vote(1);
      insertEvent(id, { kind: "note", direction: "internal", party: "human", body: `Human accepted Donna's suggestion: ${sug.suggestion}` });
      try {
        run("INSERT INTO action_log (ticket_id, actor, action, args, ok, result, ts) VALUES (?,?,?,?,1,?,?)", id, "human", "accept_suggestion", JSON.stringify({ suggestion: sug.suggestion }), "accepted", new Date().toISOString());
      } catch {}
      return send(res, 200, { ok: true, voted: ids.length, lesson: null });
    }
    vote(-1);
    const out = await learn({
      ticketId: id,
      action: b.verdict === "reject" ? "reject_suggestion" : "edit_suggestion",
      details: { suggestion: sug.suggestion, text: b.text ?? "" },
      note: b.text ?? "",
      source: "feedback",
    });
    return send(res, 200, { ok: true, voted: ids.length, lesson: out.ok ? out.lesson : null, learn_error: out.ok ? undefined : out.error });
  }

  if (m === "POST" && (g = /^\/api\/tickets\/(\d+)\/human-action$/.exec(p))) {
    const id = Number(g[1]);
    needTicket(id);
    const b = await readBody(req);
    const d = b.details ?? {};
    const ticket = one<any>("SELECT * FROM tickets WHERE id=?", id);
    const now = new Date().toISOString();
    switch (b.action) {
      case "assign_contractor": {
        if (!String(d.name ?? "").trim()) throw new HttpError(400, "contractor name is required");
        const c = upsertContact({ role: "contractor", name: String(d.name).trim(), company: d.company || null }, { actor: "human" });
        if (!c.ok) throw new HttpError(400, c.error);
        run("UPDATE tickets SET contractor_id=?, updated_at=? WHERE id=?", c.contact_id, now, id);
        if (ticket.property_id) linkContact(ticket.property_id, c.contact_id, "contractor", { actor: "human" });
        insertEvent(id, { kind: "note", direction: "internal", party: "human", body: `Human assigned contractor ${d.name}${d.company ? ` (${d.company})` : ""}${b.note ? `. ${b.note}` : ""}` });
        if (["intake", "landlord_approval", "provider_selection"].includes(ticket.stage)) moveStage(id, "scheduling", "Contractor assigned by human", { actor: "human" });
        break;
      }
      case "resolve_escalation": {
        const row = one<HumanQueueRow>("SELECT * FROM human_queue WHERE id=?", Number(d.queue_id));
        if (!row) throw new HttpError(404, "queue item not found");
        run("UPDATE human_queue SET status='resolved' WHERE id=?", row.id);
        insertEvent(id, { kind: "note", direction: "internal", party: "human", body: `Human resolved escalation (${row.reason}): ${d.resolution ?? ""}` });
        break;
      }
      case "send_message": {
        const role = String(d.to ?? "tenant");
        const col = ({ tenant: "tenant_id", landlord: "landlord_id", contractor: "contractor_id" } as Record<string, string>)[role];
        const to = col && ticket[col] ? Number(ticket[col]) : role;
        const r = queueMessage(id, d.channel ?? "email", to, d.subject || null, String(d.body ?? ""), { actor: "human" });
        if (!r.ok) throw new HttpError(400, r.error);
        break;
      }
      case "move_stage": {
        const r = moveStage(id, d.to, String(d.reason || "Moved by human"), { actor: "human" });
        if (!r.ok) throw new HttpError(400, r.error);
        break;
      }
      case "note": {
        if (!String(d.text ?? "").trim()) throw new HttpError(400, "note text is required");
        addEvent(id, { kind: "note", direction: "internal", party: "human", body: d.text }, { actor: "human" });
        break;
      }
      default:
        throw new HttpError(400, "unknown action");
    }
    const out = await learn({ ticketId: id, action: b.action, details: d, note: b.note || d.resolution || d.reason || d.text || "" });
    return send(res, 200, { ok: true, lesson: out.ok ? out.lesson : null, learn_error: out.ok ? undefined : out.error });
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

setDonnaTrigger((ticketId, message) => runDonna(ticketId, message));
startWorker();
