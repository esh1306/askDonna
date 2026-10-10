import { openDb, STAGES } from "./db.ts";
import type { Stage } from "./db.ts";

// ---------- row types ----------
export type Role = "tenant" | "landlord" | "contractor" | "agency";
export type Channel = "email" | "call" | "sms";
export type Actor = "agent" | "system" | "human";
export type TicketStatus = "open" | "on_hold" | "closed";

export type PropertyRow = { id: number; address: string; tenanted: number | null; notes: string | null };
export type ContactRow = {
  id: number;
  role: Role;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  preferred_channel: Channel | null;
};
export type FactRow = {
  id: number;
  entity_type: "property" | "contact";
  entity_id: number;
  key: string;
  value: string;
  source_ref: string | null;
  confidence: number | null;
  status: "active" | "superseded" | "conflict";
  created_at: string;
};
export type TicketRow = {
  id: number;
  case_ref: string;
  property_id: number | null;
  tenant_id: number | null;
  landlord_id: number | null;
  contractor_id: number | null;
  title: string;
  description: string | null;
  category: string | null;
  severity: string | null;
  stage: Stage;
  status: TicketStatus;
  priority: string | null;
  created_at: string;
  updated_at: string;
};
export type EventKind = "email" | "sms" | "call" | "note" | "update" | "hold" | "agent_action";
export type EventRow = {
  id: number;
  ticket_id: number;
  ts: string;
  kind: EventKind;
  direction: "in" | "out" | "internal";
  party: string | null;
  body: string | null;
  attachments_json: string | null;
  source_ref: string | null;
};
export type HoldRow = {
  id: number;
  ticket_id: number;
  reason: string | null;
  waiting_on: string | null;
  follow_up_at: string | null;
  created_at: string;
  released_at: string | null;
};
export type ApprovalRow = {
  id: number;
  ticket_id: number;
  landlord_id: number | null;
  summary: string | null;
  amount_gbp: number | null;
  channel: string | null;
  status: "pending" | "approved" | "rejected" | "expired";
  response_text: string | null;
  requested_at: string;
  resolved_at: string | null;
};
export type OutboxRow = {
  id: number;
  ticket_id: number;
  channel: Channel;
  to_contact_id: number | null;
  to_label: string | null;
  subject: string | null;
  body: string;
  status: "queued" | "sent" | "failed";
  error: string | null;
  created_at: string;
};
export type HumanQueueRow = {
  id: number;
  ticket_id: number;
  reason: string;
  summary: string | null;
  checked: string | null;
  uncertain: string | null;
  recommendation: string | null;
  priority: string | null;
  status: "open" | "resolved";
  created_at: string;
};
export type ActionLogRow = {
  id: number;
  ticket_id: number | null;
  actor: Actor;
  action: string;
  input_json: string | null;
  output_json: string | null;
  ok: number;
  ts: string;
};

export type Fail = { ok: false; error: string };
export type Ok<T = object> = { ok: true } & T;
export type Result<T = object> = Ok<T> | Fail;

// ---------- helpers ----------
type Param = string | number | null | undefined;
const norm = (p: Param[]) => p.map((v) => (v === undefined ? null : v));

export function all<T>(sql: string, ...params: Param[]): T[] {
  return openDb()
    .prepare(sql)
    .all(...norm(params)) as unknown as T[];
}
export function one<T>(sql: string, ...params: Param[]): T | undefined {
  return openDb()
    .prepare(sql)
    .get(...norm(params)) as unknown as T | undefined;
}
export function run(sql: string, ...params: Param[]): { id: number; changes: number } {
  const r = openDb()
    .prepare(sql)
    .run(...norm(params));
  return { id: Number(r.lastInsertRowid), changes: Number(r.changes) };
}
export const nowIso = () => new Date().toISOString();
const fail = (error: string): Fail => ({ ok: false, error });

export type Opts = { actor?: Actor; ts?: string };

/** Append an action_log row. Also used directly for read-only actions. */
export function logAction(
  ticketId: number | null,
  actor: Actor,
  action: string,
  input: unknown,
  output: unknown,
  ok: boolean,
  ts: string = nowIso(),
): number {
  return run(
    `INSERT INTO action_log (ticket_id, actor, action, input_json, output_json, ok, ts) VALUES (?,?,?,?,?,?,?)`,
    ticketId,
    actor,
    action,
    JSON.stringify(input ?? null),
    JSON.stringify(output ?? null),
    ok ? 1 : 0,
    ts,
  ).id;
}

/** Run a mutating op, logging input/output to action_log. Business errors never throw. */
function logged<R extends Result<object>>(
  ticketId: number | null,
  action: string,
  input: unknown,
  opts: Opts | undefined,
  fn: () => R,
): R {
  let res: R;
  try {
    res = fn();
  } catch (e) {
    res = fail(e instanceof Error ? e.message : String(e)) as R;
  }
  logAction(ticketId, opts?.actor ?? "agent", action, input, res, res.ok, opts?.ts ?? nowIso());
  return res;
}

const getTicket = (id: number) => one<TicketRow>("SELECT * FROM tickets WHERE id=?", id);
const touch = (id: number, ts: string) => run("UPDATE tickets SET updated_at=? WHERE id=?", ts, id);

// ---------- events ----------
export type AddEventInput = {
  ts?: string;
  kind: EventKind;
  direction: "in" | "out" | "internal";
  party?: string | null;
  body?: string | null;
  attachments?: string[];
  source_ref?: string | null;
};

/** Insert an event without logging (used by importer). */
export function insertEvent(ticketId: number, e: AddEventInput): number {
  return run(
    `INSERT INTO ticket_events (ticket_id, ts, kind, direction, party, body, attachments_json, source_ref) VALUES (?,?,?,?,?,?,?,?)`,
    ticketId,
    e.ts ?? nowIso(),
    e.kind,
    e.direction,
    e.party ?? null,
    e.body ?? null,
    e.attachments?.length ? JSON.stringify(e.attachments) : null,
    e.source_ref ?? null,
  ).id;
}

export function addEvent(ticketId: number, e: AddEventInput, opts?: Opts): Result<{ event_id: number }> {
  return logged(ticketId, "add_event", e, opts, () => {
    if (!getTicket(ticketId)) return fail(`ticket ${ticketId} not found`);
    const id = insertEvent(ticketId, e);
    touch(ticketId, e.ts ?? nowIso());
    return { ok: true, event_id: id };
  });
}

export function searchEvents(ticketId: number, query: string, limit = 20): EventRow[] {
  const like = `%${query.replace(/[%_]/g, (m) => "\\" + m)}%`;
  return all<EventRow>(
    `SELECT * FROM ticket_events WHERE ticket_id=? AND (body LIKE ? ESCAPE '\\' OR party LIKE ? ESCAPE '\\') ORDER BY ts DESC, id DESC LIMIT ?`,
    ticketId,
    like,
    like,
    limit,
  ).reverse();
}

// ---------- contacts / facts ----------
export type ContactInput = {
  role: Role;
  name: string;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  preferred_channel?: Channel | null;
  /** always create a new row instead of matching an existing role+name+company */
  forceNew?: boolean;
};

export function upsertContact(c: ContactInput, opts?: Opts): Result<{ contact_id: number; created: boolean }> {
  return logged(null, "upsert_contact", c, opts, () => {
    const existing = c.forceNew
      ? undefined
      : one<ContactRow>(
          `SELECT * FROM contacts WHERE role=? AND name=? AND COALESCE(company,'')=COALESCE(?,'')`,
          c.role,
          c.name,
          c.company ?? null,
        );
    if (existing) {
      run(
        `UPDATE contacts SET email=COALESCE(?,email), phone=COALESCE(?,phone), preferred_channel=COALESCE(?,preferred_channel) WHERE id=?`,
        c.email ?? null,
        c.phone ?? null,
        c.preferred_channel ?? null,
        existing.id,
      );
      return { ok: true, contact_id: existing.id, created: false };
    }
    const r = run(
      `INSERT INTO contacts (role,name,company,email,phone,preferred_channel) VALUES (?,?,?,?,?,?)`,
      c.role,
      c.name,
      c.company ?? null,
      c.email ?? null,
      c.phone ?? null,
      c.preferred_channel ?? null,
    );
    return { ok: true, contact_id: r.id, created: true };
  });
}

export function upsertProperty(address: string, tenanted?: boolean | null, notes?: string | null): number {
  const ex = one<PropertyRow>("SELECT * FROM properties WHERE address=?", address);
  if (ex) {
    if (tenanted !== undefined && tenanted !== null) run("UPDATE properties SET tenanted=? WHERE id=?", tenanted ? 1 : 0, ex.id);
    return ex.id;
  }
  return run(
    "INSERT INTO properties (address, tenanted, notes) VALUES (?,?,?)",
    address,
    tenanted === undefined || tenanted === null ? null : tenanted ? 1 : 0,
    notes ?? null,
  ).id;
}

export function linkContact(
  propertyId: number,
  contactId: number,
  role: string,
  opts?: Opts,
): Result<{ linked: boolean }> {
  return logged(null, "link_contact", { propertyId, contactId, role }, opts, () => {
    if (!one("SELECT 1 AS x FROM properties WHERE id=?", propertyId)) return fail(`property ${propertyId} not found`);
    if (!one("SELECT 1 AS x FROM contacts WHERE id=?", contactId)) return fail(`contact ${contactId} not found`);
    const r = run("INSERT OR IGNORE INTO property_contacts (property_id, contact_id, role) VALUES (?,?,?)", propertyId, contactId, role);
    return { ok: true, linked: r.changes > 0 };
  });
}

export type Entity = { type: "property" | "contact"; id: number };
export type AddFactResult =
  | Ok<{ conflict: false; unchanged: boolean; fact: FactRow }>
  | Ok<{ conflict: true; existing: FactRow; fact: FactRow }>
  | Fail;

export function addFact(
  entity: Entity,
  key: string,
  value: string,
  source_ref: string | null,
  confidence = 0.8,
  opts?: Opts,
): AddFactResult {
  return logged(null, "add_fact", { entity, key, value, source_ref, confidence }, opts, () => {
    const live = all<FactRow>(
      `SELECT * FROM profile_facts WHERE entity_type=? AND entity_id=? AND key=? AND status IN ('active','conflict') ORDER BY id`,
      entity.type,
      entity.id,
      key,
    );
    const same = live.find((f) => f.value === value);
    if (same) return { ok: true, conflict: false, unchanged: true, fact: same } as Ok<{ conflict: false; unchanged: boolean; fact: FactRow }>;
    const ts = opts?.ts ?? nowIso();
    if (live.length) {
      run(`UPDATE profile_facts SET status='conflict' WHERE entity_type=? AND entity_id=? AND key=? AND status='active'`, entity.type, entity.id, key);
      const id = run(
        `INSERT INTO profile_facts (entity_type,entity_id,key,value,source_ref,confidence,status,created_at) VALUES (?,?,?,?,?,?,'conflict',?)`,
        entity.type,
        entity.id,
        key,
        value,
        source_ref,
        confidence,
        ts,
      ).id;
      return {
        ok: true,
        conflict: true,
        existing: one<FactRow>("SELECT * FROM profile_facts WHERE id=?", live[0].id)!,
        fact: one<FactRow>("SELECT * FROM profile_facts WHERE id=?", id)!,
      } as Ok<{ conflict: true; existing: FactRow; fact: FactRow }>;
    }
    const id = run(
      `INSERT INTO profile_facts (entity_type,entity_id,key,value,source_ref,confidence,status,created_at) VALUES (?,?,?,?,?,?,'active',?)`,
      entity.type,
      entity.id,
      key,
      value,
      source_ref,
      confidence,
      ts,
    ).id;
    return { ok: true, conflict: false, unchanged: false, fact: one<FactRow>("SELECT * FROM profile_facts WHERE id=?", id)! } as Ok<{
      conflict: false;
      unchanged: boolean;
      fact: FactRow;
    }>;
  }) as AddFactResult;
}

/** Resolve a conflict: the winning fact becomes active, the rest superseded. */
export function resolveConflict(entity: Entity, key: string, winnerFactId: number, opts?: Opts): Result<{ fact: FactRow }> {
  return logged(null, "resolve_conflict", { entity, key, winnerFactId }, opts, () => {
    const w = one<FactRow>("SELECT * FROM profile_facts WHERE id=? AND entity_type=? AND entity_id=? AND key=?", winnerFactId, entity.type, entity.id, key);
    if (!w) return fail("winner fact not found for that entity/key");
    run(`UPDATE profile_facts SET status='superseded' WHERE entity_type=? AND entity_id=? AND key=? AND status IN ('active','conflict')`, entity.type, entity.id, key);
    run(`UPDATE profile_facts SET status='active' WHERE id=?`, winnerFactId);
    return { ok: true, fact: one<FactRow>("SELECT * FROM profile_facts WHERE id=?", winnerFactId)! };
  });
}

export const getFacts = (entity: Entity): FactRow[] =>
  all<FactRow>(
    `SELECT * FROM profile_facts WHERE entity_type=? AND entity_id=? AND status IN ('active','conflict') ORDER BY key, id`,
    entity.type,
    entity.id,
  );

// ---------- stage ----------
export function stageTransitionError(from: Stage, to: Stage): string | null {
  if (from === to) return `ticket is already in stage '${to}'`;
  if (from === "closed") return `ticket is closed; cannot move to '${to}'`;
  if (to === "paused" || to === "closed") return null;
  if (from === "paused") return null;
  const order = STAGES.slice(0, 6) as readonly string[];
  if (order.indexOf(to) < order.indexOf(from)) return `cannot move backwards from '${from}' to '${to}'`;
  return null;
}

const openHolds = (ticketId: number) =>
  all<HoldRow>("SELECT * FROM holds WHERE ticket_id=? AND released_at IS NULL ORDER BY id", ticketId);

export function moveStage(
  ticketId: number,
  to: Stage,
  reason: string,
  opts?: Opts,
): Result<{ from: Stage; to: Stage; status: TicketStatus }> {
  return logged(ticketId, "move_stage", { to, reason }, opts, () => {
    const t = getTicket(ticketId);
    if (!t) return fail(`ticket ${ticketId} not found`);
    if (!(STAGES as readonly string[]).includes(to)) return fail(`unknown stage '${to}'`);
    const err = stageTransitionError(t.stage, to);
    if (err) return fail(err);
    const status: TicketStatus = to === "closed" ? "closed" : to === "paused" || openHolds(ticketId).length ? "on_hold" : "open";
    const ts = opts?.ts ?? nowIso();
    run("UPDATE tickets SET stage=?, status=?, updated_at=? WHERE id=?", to, status, ts, ticketId);
    insertEvent(ticketId, {
      ts,
      kind: "agent_action",
      direction: "internal",
      body: `Stage ${t.stage} -> ${to}: ${reason}`,
    });
    return { ok: true, from: t.stage, to, status };
  });
}

// ---------- holds ----------
export function placeHold(
  ticketId: number,
  reason: string,
  waitingOn: string | null,
  followUpAt: string | null,
  opts?: Opts,
): Result<{ hold_id: number }> {
  return logged(ticketId, "place_hold", { reason, waitingOn, followUpAt }, opts, () => {
    const t = getTicket(ticketId);
    if (!t) return fail(`ticket ${ticketId} not found`);
    if (t.status === "closed") return fail("ticket is closed");
    const ts = opts?.ts ?? nowIso();
    const id = run(
      "INSERT INTO holds (ticket_id, reason, waiting_on, follow_up_at, created_at) VALUES (?,?,?,?,?)",
      ticketId,
      reason,
      waitingOn,
      followUpAt,
      ts,
    ).id;
    run("UPDATE tickets SET status='on_hold', updated_at=? WHERE id=?", ts, ticketId);
    insertEvent(ticketId, {
      ts,
      kind: "hold",
      direction: "internal",
      body: `On hold: ${reason}${waitingOn ? ` (waiting on ${waitingOn})` : ""}${followUpAt ? `; follow up ${followUpAt}` : ""}`,
    });
    return { ok: true, hold_id: id };
  });
}

export function releaseHold(holdId: number, opts?: Opts): Result<{ status: TicketStatus }> {
  return logged(null, "release_hold", { holdId }, opts, () => {
    const h = one<HoldRow>("SELECT * FROM holds WHERE id=?", holdId);
    if (!h) return fail(`hold ${holdId} not found`);
    if (h.released_at) return fail(`hold ${holdId} already released`);
    const ts = opts?.ts ?? nowIso();
    run("UPDATE holds SET released_at=? WHERE id=?", ts, holdId);
    const t = getTicket(h.ticket_id)!;
    let status = t.status;
    if (t.status === "on_hold" && t.stage !== "paused" && openHolds(h.ticket_id).length === 0) status = "open";
    run("UPDATE tickets SET status=?, updated_at=? WHERE id=?", status, ts, h.ticket_id);
    insertEvent(h.ticket_id, { ts, kind: "agent_action", direction: "internal", body: `Hold released: ${h.reason ?? ""}` });
    return { ok: true, status };
  });
}

export function dueFollowUps(now: string = nowIso()): (HoldRow & { case_ref: string; title: string })[] {
  return all(
    `SELECT h.*, t.case_ref, t.title FROM holds h JOIN tickets t ON t.id=h.ticket_id
     WHERE h.released_at IS NULL AND h.follow_up_at IS NOT NULL AND h.follow_up_at <= ? ORDER BY h.follow_up_at`,
    now,
  );
}

// ---------- approvals ----------
export function requestApproval(
  ticketId: number,
  summary: string,
  amountGbp: number | null,
  channel: Channel = "email",
  opts?: Opts,
): Result<{ approval_id: number }> {
  return logged(ticketId, "request_approval", { summary, amountGbp, channel }, opts, () => {
    const t = getTicket(ticketId);
    if (!t) return fail(`ticket ${ticketId} not found`);
    const pending = one<ApprovalRow>("SELECT * FROM approvals WHERE ticket_id=? AND status='pending'", ticketId);
    if (pending) return fail(`approval ${pending.id} is already pending for this ticket`);
    const ts = opts?.ts ?? nowIso();
    const id = run(
      "INSERT INTO approvals (ticket_id, landlord_id, summary, amount_gbp, channel, status, requested_at) VALUES (?,?,?,?,?,'pending',?)",
      ticketId,
      t.landlord_id,
      summary,
      amountGbp,
      channel,
      ts,
    ).id;
    insertEvent(ticketId, {
      ts,
      kind: "agent_action",
      direction: "internal",
      body: `Landlord approval requested via ${channel}: ${summary}${amountGbp != null ? ` (GBP ${amountGbp})` : ""}`,
    });
    touch(ticketId, ts);
    return { ok: true, approval_id: id };
  });
}

export function resolveApproval(
  approvalId: number,
  status: "approved" | "rejected" | "expired",
  responseText: string | null,
  opts?: Opts,
): Result<{ approval: ApprovalRow }> {
  return logged(null, "resolve_approval", { approvalId, status, responseText }, opts, () => {
    const a = one<ApprovalRow>("SELECT * FROM approvals WHERE id=?", approvalId);
    if (!a) return fail(`approval ${approvalId} not found`);
    if (a.status !== "pending") return fail(`approval ${approvalId} already ${a.status}`);
    if (!["approved", "rejected", "expired"].includes(status)) return fail(`invalid status '${status}'`);
    const ts = opts?.ts ?? nowIso();
    run("UPDATE approvals SET status=?, response_text=?, resolved_at=? WHERE id=?", status, responseText, ts, approvalId);
    insertEvent(a.ticket_id, {
      ts,
      kind: "agent_action",
      direction: "internal",
      body: `Landlord approval ${status}${responseText ? `: ${responseText}` : ""}`,
    });
    touch(a.ticket_id, ts);
    return { ok: true, approval: one<ApprovalRow>("SELECT * FROM approvals WHERE id=?", approvalId)! };
  });
}

// ---------- outbox ----------
export function queueMessage(
  ticketId: number,
  channel: Channel,
  to: number | string,
  subject: string | null,
  body: string,
  opts?: Opts,
): Result<{ message_id: number }> {
  return logged(ticketId, "queue_message", { channel, to, subject, body }, opts, () => {
    if (!getTicket(ticketId)) return fail(`ticket ${ticketId} not found`);
    if (!body?.trim()) return fail("message body is empty");
    let contactId: number | null = null;
    let label: string | null = null;
    if (typeof to === "number") {
      const c = one<ContactRow>("SELECT * FROM contacts WHERE id=?", to);
      if (!c) return fail(`contact ${to} not found`);
      contactId = c.id;
      label = `${c.name} (${c.role})`;
    } else label = to;
    const id = run(
      "INSERT INTO outbox (ticket_id, channel, to_contact_id, to_label, subject, body, status, created_at) VALUES (?,?,?,?,?,?, 'queued', ?)",
      ticketId,
      channel,
      contactId,
      label,
      subject,
      body,
      opts?.ts ?? nowIso(),
    ).id;
    return { ok: true, message_id: id };
  });
}

export function markMessage(
  id: number,
  status: "queued" | "sent" | "failed",
  error?: string | null,
  opts?: Opts,
): Result<{ message: OutboxRow }> {
  return logged(null, "mark_message", { id, status, error }, opts, () => {
    const m = one<OutboxRow>("SELECT * FROM outbox WHERE id=?", id);
    if (!m) return fail(`message ${id} not found`);
    run("UPDATE outbox SET status=?, error=? WHERE id=?", status, error ?? null, id);
    if (status === "sent" && m.status !== "sent") {
      insertEvent(m.ticket_id, {
        ts: opts?.ts,
        kind: m.channel === "call" ? "call" : m.channel,
        direction: "out",
        party: m.to_label,
        body: (m.subject ? `Subject: ${m.subject}\n\n` : "") + m.body,
      });
    }
    return { ok: true, message: one<OutboxRow>("SELECT * FROM outbox WHERE id=?", id)! };
  });
}

// ---------- escalation ----------
export type EscalateInput = {
  reason: string;
  summary?: string;
  checked?: string;
  uncertain?: string;
  recommendation?: string;
  priority?: string;
};

export function escalate(ticketId: number, e: EscalateInput, opts?: Opts): Result<{ queue_id: number }> {
  return logged(ticketId, "escalate", e, opts, () => {
    if (!getTicket(ticketId)) return fail(`ticket ${ticketId} not found`);
    // Don't stack duplicate escalations: an open item with the same reason is updated instead.
    const dup = one<HumanQueueRow>("SELECT * FROM human_queue WHERE ticket_id=? AND status='open' AND reason=?", ticketId, e.reason);
    if (dup) {
      run(
        "UPDATE human_queue SET summary=COALESCE(?,summary), checked=COALESCE(?,checked), uncertain=COALESCE(?,uncertain), recommendation=COALESCE(?,recommendation), priority=COALESCE(?,priority) WHERE id=?",
        e.summary ?? null,
        e.checked ?? null,
        e.uncertain ?? null,
        e.recommendation ?? null,
        e.priority ?? null,
        dup.id,
      );
      return { ok: true, queue_id: dup.id };
    }
    const ts = opts?.ts ?? nowIso();
    const id = run(
      `INSERT INTO human_queue (ticket_id, reason, summary, checked, uncertain, recommendation, priority, status, created_at)
       VALUES (?,?,?,?,?,?,?, 'open', ?)`,
      ticketId,
      e.reason,
      e.summary ?? null,
      e.checked ?? null,
      e.uncertain ?? null,
      e.recommendation ?? null,
      e.priority ?? "normal",
      ts,
    ).id;
    insertEvent(ticketId, { ts, kind: "agent_action", direction: "internal", body: `Escalated to human queue: ${e.reason}` });
    touch(ticketId, ts);
    return { ok: true, queue_id: id };
  });
}

// ---------- reads ----------
export type TicketContext = {
  ok: true;
  ticket: TicketRow;
  property: (PropertyRow & { facts: FactRow[] }) | null;
  tenant: (ContactRow & { facts: FactRow[] }) | null;
  landlord: (ContactRow & { facts: FactRow[] }) | null;
  contractor: (ContactRow & { facts: FactRow[] }) | null;
  events: EventRow[];
  total_events: number;
  open_holds: HoldRow[];
  approvals: ApprovalRow[];
  open_human_queue: HumanQueueRow[];
  history_for_property: { id: number; case_ref: string; title: string; category: string | null; stage: Stage; status: TicketStatus }[];
};

function withFacts(id: number | null): (ContactRow & { facts: FactRow[] }) | null {
  if (id == null) return null;
  const c = one<ContactRow>("SELECT * FROM contacts WHERE id=?", id);
  return c ? { ...c, facts: getFacts({ type: "contact", id }) } : null;
}

export function getTicketContext(ticketId: number, opts: { events?: number } = {}): TicketContext | Fail {
  const t = getTicket(ticketId);
  if (!t) return fail(`ticket ${ticketId} not found`);
  const n = opts.events ?? 40;
  const prop = t.property_id != null ? one<PropertyRow>("SELECT * FROM properties WHERE id=?", t.property_id) : undefined;
  return {
    ok: true,
    ticket: t,
    property: prop ? { ...prop, facts: getFacts({ type: "property", id: prop.id }) } : null,
    tenant: withFacts(t.tenant_id),
    landlord: withFacts(t.landlord_id),
    contractor: withFacts(t.contractor_id),
    events: all<EventRow>("SELECT * FROM ticket_events WHERE ticket_id=? ORDER BY ts DESC, id DESC LIMIT ?", ticketId, n).reverse(),
    total_events: one<{ c: number }>("SELECT COUNT(*) AS c FROM ticket_events WHERE ticket_id=?", ticketId)!.c,
    open_holds: openHolds(ticketId),
    approvals: all<ApprovalRow>("SELECT * FROM approvals WHERE ticket_id=? ORDER BY id", ticketId),
    open_human_queue: all<HumanQueueRow>("SELECT * FROM human_queue WHERE ticket_id=? AND status='open' ORDER BY id", ticketId),
    history_for_property:
      t.property_id == null
        ? []
        : all(
            "SELECT id, case_ref, title, category, stage, status FROM tickets WHERE property_id=? AND id<>? ORDER BY created_at",
            t.property_id,
            ticketId,
          ),
  };
}

export type TicketHit = Pick<TicketRow, "id" | "case_ref" | "title" | "category" | "stage" | "status"> & { address: string | null };

export function findTickets(q: { propertyAddress?: string; contactName?: string; text?: string }, limit = 25): TicketHit[] {
  const where: string[] = [];
  const params: Param[] = [];
  const like = (s: string) => `%${s.replace(/[%_]/g, (m) => "\\" + m)}%`;
  if (q.propertyAddress) {
    where.push("p.address LIKE ? ESCAPE '\\'");
    params.push(like(q.propertyAddress));
  }
  if (q.contactName) {
    where.push(
      "(t.tenant_id IN (SELECT id FROM contacts WHERE name LIKE ? ESCAPE '\\' OR company LIKE ? ESCAPE '\\') OR t.landlord_id IN (SELECT id FROM contacts WHERE name LIKE ? ESCAPE '\\' OR company LIKE ? ESCAPE '\\') OR t.contractor_id IN (SELECT id FROM contacts WHERE name LIKE ? ESCAPE '\\' OR company LIKE ? ESCAPE '\\'))",
    );
    const l = like(q.contactName);
    params.push(l, l, l, l, l, l);
  }
  if (q.text) {
    where.push(
      "(t.title LIKE ? ESCAPE '\\' OR t.description LIKE ? ESCAPE '\\' OR t.category LIKE ? ESCAPE '\\' OR t.id IN (SELECT ticket_id FROM ticket_events WHERE body LIKE ? ESCAPE '\\'))",
    );
    const l = like(q.text);
    params.push(l, l, l, l);
  }
  params.push(limit);
  return all<TicketHit>(
    `SELECT t.id, t.case_ref, t.title, t.category, t.stage, t.status, p.address
     FROM tickets t LEFT JOIN properties p ON p.id=t.property_id
     ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY t.id LIMIT ?`,
    ...params,
  );
}

export function getTicketByCaseRef(caseRef: string): TicketRow | undefined {
  return one<TicketRow>("SELECT * FROM tickets WHERE case_ref=?", caseRef);
}
