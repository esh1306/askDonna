// Real delivery: emails via Resend, phone calls via ElevenLabs Agents over Twilio.
// SAFETY: everything goes ONLY to DEMO_EMAIL_TO / DEMO_PHONE_TO.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { addEvent, all, one, getTicketContext, markMessage, resolveApproval, run } from "../../crm/repo.ts";
import type { ApprovalRow, OutboxRow } from "../../crm/repo.ts";
import { checkConsent as jevConsent } from "../../intake/consent.ts";

export type CallRec = {
  outbox_id: number | null;
  approval_id: number;
  ticket_id: number;
  conversation_id: string;
  call_sid?: string | null;
  status: "initiated" | "in-progress" | "processing" | "done" | "failed";
  started_at: string;
  decision?: string | null;
  max_amount_gbp?: number | null;
  conditions?: string | null;
  outcome?: string;
  finished?: boolean; // result handled
};

const CALLS_FILE = () => resolve(process.cwd(), "data/calls.json");
export function loadCalls(): CallRec[] {
  try {
    return existsSync(CALLS_FILE()) ? JSON.parse(readFileSync(CALLS_FILE(), "utf8")) : [];
  } catch {
    return [];
  }
}
function saveCalls(c: CallRec[]) {
  mkdirSync(resolve(process.cwd(), "data"), { recursive: true });
  writeFileSync(CALLS_FILE(), JSON.stringify(c, null, 2));
}

const log = (...a: unknown[]) => console.log("[outbox]", ...a);
const missing = (names: string[]) => names.filter((n) => !process.env[n]);

/** Hook: wire a consent classifier (e.g. Jev) here. null = no opinion. */
/** Jev consent check on the call transcript (intake/consent.ts): a clear, unconditional approval? Null if Jev is unavailable. */
export async function checkConsent(transcriptText: string): Promise<{ ok: boolean; p: number } | null> {
  return jevConsent(transcriptText).catch(() => null);
}

let triggerDonna: (ticketId: number, message: string) => Promise<unknown> = async () => undefined;
export function setDonnaTrigger(fn: typeof triggerDonna) {
  triggerDonna = fn;
}

function setError(id: number, msg: string) {
  run("UPDATE outbox SET error=? WHERE id=?", msg, id);
}

async function sendEmail(row: OutboxRow): Promise<{ ok: boolean; note: string }> {
  const m = missing(["RESEND_API_KEY", "DEMO_EMAIL_TO"]);
  if (m.length) return { ok: false, note: `Email not configured: set ${m.join(", ")} in .env` };
  const t = one<{ case_ref: string }>("SELECT case_ref FROM tickets WHERE id=?", row.ticket_id);
  const label = row.to_label ?? "recipient";
  const footer = `\n\n--\nDonna demo: this message was addressed to ${label} for ticket ${t?.case_ref ?? row.ticket_id} and redirected to the demo inbox.`;
  log(`email #${row.id} -> ${process.env.DEMO_EMAIL_TO} (for ${label})`);
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({
      from: process.env.RESEND_FROM || "Donna <onboarding@resend.dev>",
      to: [process.env.DEMO_EMAIL_TO],
      subject: `[Donna demo → ${label}] ${row.subject ?? "(no subject)"}`,
      text: row.body + footer,
    }),
  });
  const j: any = await r.json().catch(() => ({}));
  if (!r.ok) return { ok: false, note: `Resend ${r.status}: ${j.message ?? JSON.stringify(j)}` };
  return { ok: true, note: `Resend id ${j.id}` };
}

export async function placeCall(row: OutboxRow | null, approval: ApprovalRow): Promise<{ ok: boolean; note: string; conversation_id?: string }> {
  const m = missing(["ELEVENLABS_API_KEY", "ELEVENLABS_AGENT_ID", "ELEVENLABS_PHONE_NUMBER_ID", "DEMO_PHONE_TO"]);
  if (m.length) return { ok: false, note: `Phone calls not configured: set ${m.join(", ")} in .env (see scripts/setup-phone.ts)` };
  const live = loadCalls().find((c) => c.approval_id === approval.id && !c.finished);
  if (live) return { ok: true, note: `call already in progress (${live.conversation_id})`, conversation_id: live.conversation_id };
  const ctx = getTicketContext(approval.ticket_id);
  if (!ctx.ok) return { ok: false, note: ctx.error };
  const talking = row?.body ?? one<OutboxRow>("SELECT * FROM outbox WHERE ticket_id=? AND channel='call' ORDER BY id DESC", approval.ticket_id)?.body;
  const summary = [approval.summary, talking].filter(Boolean).join(". Talking points: ");
  const vars = {
    landlord_name: ctx.landlord?.name ?? "the landlord",
    agency_name: "Northbridge Lettings",
    property_address: ctx.property?.address ?? "the property",
    job_summary: summary || ctx.ticket.title,
    estimated_cost: approval.amount_gbp != null ? `GBP ${approval.amount_gbp}` : "not confirmed yet",
    job_ref: ctx.ticket.case_ref,
    tenant_name: ctx.tenant?.name ?? "the tenant",
  };
  log(`call approval #${approval.id} ticket ${approval.ticket_id} -> ${process.env.DEMO_PHONE_TO} (for ${vars.landlord_name})`);
  const r = await fetch("https://api.elevenlabs.io/v1/convai/twilio/outbound-call", {
    method: "POST",
    headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY!, "content-type": "application/json" },
    body: JSON.stringify({
      agent_id: process.env.ELEVENLABS_AGENT_ID,
      agent_phone_number_id: process.env.ELEVENLABS_PHONE_NUMBER_ID,
      to_number: process.env.DEMO_PHONE_TO,
      conversation_initiation_client_data: { dynamic_variables: vars },
    }),
  });
  const j: any = await r.json().catch(() => ({}));
  if (!r.ok || j.success === false || !j.conversation_id)
    return { ok: false, note: `ElevenLabs outbound call failed (${r.status}): ${JSON.stringify(j.detail ?? j.message ?? j)}` };
  const calls = loadCalls();
  calls.push({
    outbox_id: row?.id ?? null,
    approval_id: approval.id,
    ticket_id: approval.ticket_id,
    conversation_id: j.conversation_id,
    call_sid: j.callSid ?? null,
    status: "initiated",
    started_at: new Date().toISOString(),
  });
  saveCalls(calls);
  return { ok: true, note: `conversation ${j.conversation_id}`, conversation_id: j.conversation_id };
}

let processing = false;
export async function processOutbox(): Promise<{ processed: number; results: string[]; message?: string }> {
  if (processing) return { processed: 0, results: [], message: "already running" };
  processing = true;
  const results: string[] = [];
  try {
    const rows = all<OutboxRow>("SELECT * FROM outbox WHERE status='queued' ORDER BY id");
    for (const row of rows) {
      try {
        if (row.channel === "email") {
          const r = await sendEmail(row);
          if (r.ok) markMessage(row.id, "sent", r.note);
          else if (/not configured/.test(r.note)) setError(row.id, r.note);
          else markMessage(row.id, "failed", r.note);
          results.push(`email #${row.id}: ${r.ok ? "sent" : r.note}`);
        } else if (row.channel === "sms") {
          markMessage(row.id, "sent", "SMS delivery not configured (logged only)");
          results.push(`sms #${row.id}: logged only`);
        } else if (row.channel === "call") {
          if (process.env.PHONE_AUTO_CALL === "0") continue;
          const approval = one<ApprovalRow>("SELECT * FROM approvals WHERE ticket_id=? AND status='pending' ORDER BY id DESC", row.ticket_id);
          if (!approval) continue; // calls only for pending approvals
          const r = await placeCall(row, approval);
          if (r.ok) markMessage(row.id, "sent", r.note);
          else if (/not configured/.test(r.note)) setError(row.id, r.note);
          else markMessage(row.id, "failed", r.note);
          results.push(`call #${row.id}: ${r.note}`);
        }
      } catch (e) {
        setError(row.id, `delivery error: ${(e as Error).message}`);
        results.push(`#${row.id}: ${(e as Error).message}`);
      }
    }
  } finally {
    processing = false;
  }
  const cfg = [...missing(["RESEND_API_KEY", "DEMO_EMAIL_TO"]), ...missing(["ELEVENLABS_PHONE_NUMBER_ID", "DEMO_PHONE_TO"])];
  return { processed: results.length, results, message: cfg.length ? `Not configured (rows stay queued): ${cfg.join(", ")}` : undefined };
}

function transcriptText(j: any): string {
  return (j.transcript ?? [])
    .filter((t: any) => t.message)
    .map((t: any) => `${t.role === "agent" ? "Donna" : "Landlord"}: ${t.message}`)
    .join("\n");
}

async function finishCall(c: CallRec, j: any) {
  const dc = j.analysis?.data_collection_results ?? {};
  const val = (k: string) => dc[k]?.value ?? null;
  const decision = String(val("decision") ?? "").toLowerCase() || null;
  const maxAmt = val("max_amount_gbp") != null && val("max_amount_gbp") !== "" ? Number(val("max_amount_gbp")) : null;
  const conditions = val("conditions") ? String(val("conditions")).trim() : null;
  const text = transcriptText(j);
  const landlordWords = (j.transcript ?? []).filter((t: any) => t.role === "user" && t.message).map((t: any) => t.message).join(" ");
  const approval = one<ApprovalRow>("SELECT * FROM approvals WHERE id=?", c.approval_id);
  let outcome = `decision=${decision ?? "unclear"}${maxAmt != null ? `, max GBP ${maxAmt}` : ""}${conditions ? `, conditions: ${conditions}` : ""}`;
  const noConditions = !conditions || /^(none|no|n\/a|-)\.?$/i.test(conditions);
  const capOk = maxAmt == null || Number.isNaN(maxAmt) || approval?.amount_gbp == null || maxAmt >= approval.amount_gbp;
  if (j.status === "failed" || !text) {
    outcome = "call failed or not answered";
  } else if (approval?.status === "pending") {
    if (decision === "approve" && noConditions && capOk) {
      const consent = await checkConsent(text).catch(() => null);
      if (consent && !consent.ok) outcome += ` (consent check failed p=${consent.p}; approval left pending)`;
      else {
        const r = resolveApproval(approval.id, "approved", `Phone call: "${landlordWords.slice(0, 500)}" (${outcome})`);
        outcome += r.ok ? " -> approval APPROVED" : ` (${r.error})`;
      }
    } else if (decision === "reject") {
      const r = resolveApproval(approval.id, "rejected", `Phone call: "${landlordWords.slice(0, 500)}" (${outcome})`);
      outcome += r.ok ? " -> approval REJECTED" : ` (${r.error})`;
    } else outcome += " -> approval left pending (needs human/Donna follow-up)";
  }
  c.decision = decision;
  c.max_amount_gbp = maxAmt;
  c.conditions = conditions;
  c.outcome = outcome;
  c.finished = true;
  addEvent(c.ticket_id, { kind: "call", direction: "in", party: "landlord", body: `Phone call with landlord (approval ${c.approval_id}). Outcome: ${outcome}\n\nTranscript:\n${text || "(none)"}` });
  triggerDonna(
    c.ticket_id,
    `A phone call with the landlord about approval ${c.approval_id} just ended. Outcome: ${outcome}. Transcript: ${text.slice(0, 3000)}. Load the ticket, decide and act, then return the structured result.`,
  ).catch((e) => log("donna trigger failed:", (e as Error).message));
}

let polling = false;
export async function pollCalls(): Promise<CallRec[]> {
  if (polling || !process.env.ELEVENLABS_API_KEY) return loadCalls();
  polling = true;
  try {
    const calls = loadCalls();
    for (const c of calls.filter((x) => !x.finished)) {
      try {
        const r = await fetch(`https://api.elevenlabs.io/v1/convai/conversations/${encodeURIComponent(c.conversation_id)}`, {
          headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY! },
        });
        if (!r.ok) {
          log(`poll ${c.conversation_id}: ${r.status}`);
          continue;
        }
        const j: any = await r.json();
        c.status = j.status ?? c.status;
        if (c.status === "done" || c.status === "failed") {
          log(`call ${c.conversation_id} ${c.status}`);
          await finishCall(c, j);
        }
      } catch (e) {
        log(`poll error ${c.conversation_id}: ${(e as Error).message}`);
      }
    }
    saveCalls(calls);
    return calls;
  } finally {
    polling = false;
  }
}

export function startWorker(intervalMs = 10000) {
  if (process.env.OUTBOX_WORKER === "0") return log("worker disabled (OUTBOX_WORKER=0)");
  log(`worker on, every ${intervalMs / 1000}s`);
  setInterval(() => {
    processOutbox().catch((e) => log("process error", e.message));
    pollCalls().catch((e) => log("poll error", e.message));
  }, intervalMs);
}
