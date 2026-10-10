import fs from "node:fs";
import path from "node:path";
import { CASES_DIR, loadCase, loadCaseDir } from "./cases.ts";
import type { CaseDetail, CaseEvent } from "./case-types.ts";
import { openDb, resetDb } from "./db.ts";
import type { Stage } from "./db.ts";
import { addFact, insertEvent, linkContact, logAction, one, all, run, upsertContact, upsertProperty } from "./repo.ts";
import type { EventKind, Role, TicketRow } from "./repo.ts";

export type ImportOpts = { cutoff?: number; track?: string; id?: string };
export type ImportResult = {
  ok: true;
  ticket_id: number;
  case_ref: string;
  stage: Stage;
  status: string;
  events: number;
  facts: number;
  conflicts: number;
};

const TRACK_ABBR: Record<string, string> = { "Property Management": "PM" };
const abbr = (track: string) =>
  TRACK_ABBR[track] ?? (track.split(/\s+/).map((w) => w[0]?.toUpperCase() ?? "").join("") || "CASE");

// ---------- classification of event parties ----------
type PartyRole = "tenant" | "landlord" | "contractor" | "agency";

function partyRole(s: string): PartyRole {
  const l = s.toLowerCase();
  if (/tenant/.test(l) && !/not tenanted/.test(l)) return "tenant";
  if (/landlord/.test(l)) return "landlord";
  if (/contractor|maintenance provider|provider/.test(l)) return "contractor";
  if (/agency|northbridge|system|staff|internal|unspecified|not specified|^\s*$/.test(l)) return "agency";
  return "contractor"; // a named company, e.g. "Juniper Surveying"
}
const isGenericParty = (s: string) => /tenant|landlord|contractor|maintenance provider|agency|northbridge|system|staff|internal|unspecified|not specified|^\s*$/i.test(s);

const KIND: Record<string, EventKind> = { email: "email", sms: "sms", call: "call", note: "note", update: "update", hold: "hold" };

const toIso = (ts: string) => ts.replace(" UTC", "Z").replace(" ", "T");
const ref = (prefix: string, n: number) => `${prefix}#event-${String(n).padStart(3, "0")}`;

// ---------- stage inference ----------
const STAGE_RULES: [RegExp, Stage][] = [
  [/NOT TENANTED|Paused automatically/i, "paused"],
  [/request is now closed/i, "closed"],
  [
    /Task has been moved to Result|final checks|Keys return confirmed|completed without payment|check the key return|Need confirmation from landlord/i,
    "closeout",
  ],
  [/Work results isset|Visit date selected/i, "works"],
  [/Maintenance provider assigned/i, "scheduling"],
  [/Please approve selection of provider|Landlord approval confirmed|Quote was approved by landlord/i, "provider_selection"],
  [/complete landlord approval step first/i, "landlord_approval"],
];
export function stageFromPhrase(body: string): Stage | null {
  for (const [re, st] of STAGE_RULES) if (re.test(body)) return st;
  return null;
}
const PROMPT_ONLY =
  /^Please check if we need to provide a response|^Waiting for (landlord|tenant)|response after \d+ days|reminders have been sent|No work results|Priority cannot be|Message received from|Email received from provider/i;

function isActivity(e: CaseEvent): boolean {
  const k = e.channel.toLowerCase();
  if (k === "email" || k === "sms" || k === "call") return true;
  if (k === "update") return stageFromPhrase(e.body) !== null || (/Manually updated/i.test(e.body) && !PROMPT_ONLY.test(e.body));
  return false;
}

// ---------- extraction ----------
const GREETING =
  /^(?:Dear|Hi|Hello|Good (?:morning|afternoon|evening))\s+((?:Mr|Mrs|Ms|Miss|Dr)\.?\s+)?([A-Z][A-Za-z'’-]+(?:\s+[A-Z][A-Za-z'’-]+)?)\s*,/m;
const STOP = new Set(["Tenant", "Landlord", "All", "Team", "Sir", "Madam", "There", "Contractor", "Provider", "Everyone", "Attached", "Please", "Thank", "Thanks"]);

function greetingName(body: string): string | null {
  const m = body.match(GREETING);
  if (!m) return null;
  const name = ((m[1] ?? "") + m[2]).trim();
  return STOP.has(m[2]) ? null : name;
}

type Intake = { category?: string; severity?: string; pets?: string; petsDetail?: string; access?: "yes" | "no" };
function parseIntake(body: string): Intake | null {
  if (!body.includes("[AI Intake Classification]")) return null;
  const out: Intake = {};
  const issue = body.match(/^Issue:\s*\n\s+(.+)$/m)?.[1]?.trim();
  if (issue) out.category = issue.split(/\s+·\s+/)[0].trim();
  const sev = body.match(/Severity:\s*([A-Za-z]+)/)?.[1];
  if (sev) out.severity = sev.toUpperCase();
  const qa = [...body.matchAll(/^\s*Q:\s*(.+)\n\s*A:\s*(.*)$/gm)];
  for (const [, q, a] of qa) {
    const ans = a.trim();
    const negative = /^(no|none|nope|n\/a|nothing|not that i know)\b/i.test(ans);
    if (/\bpets?\b/i.test(q)) {
      out.pets = ans ? (negative ? "no" : "yes") : undefined;
      if (out.pets === "yes" && ans.split(/\s+/).length > 1) out.petsDetail = ans.slice(0, 120);
    } else if (/access considerations|entry codes|alarms/i.test(q)) {
      out.access = ans ? (negative ? "no" : "yes") : undefined; // never store the codes themselves
    }
  }
  return out;
}

const PAYS_DIRECT =
  /\b(?:LL|landlord)\s+pays\s+(?:the\s+)?(?:contractor|provider)?\s*directly|invoice\s+(?:the\s+)?landlord\s+directly|(?:pay|pays)\s+(?:the\s+)?(?:contractor|provider)\s+directly/i;

// ---------- importer ----------
function deleteExisting(caseRef: string) {
  const old = one<TicketRow>("SELECT * FROM tickets WHERE case_ref=?", caseRef);
  if (!old) return;
  for (const t of ["ticket_events", "holds", "approvals", "outbox", "human_queue", "action_log"])
    run(`DELETE FROM ${t} WHERE ticket_id=?`, old.id);
  run("DELETE FROM profile_facts WHERE source_ref LIKE ?", `${caseRef}#%`);
  for (const cid of [old.tenant_id, old.landlord_id]) {
    if (cid == null) continue;
    run("DELETE FROM profile_facts WHERE entity_type='contact' AND entity_id=?", cid);
    run("DELETE FROM property_contacts WHERE contact_id=?", cid);
    run("DELETE FROM contacts WHERE id=?", cid);
  }
  run("DELETE FROM tickets WHERE id=?", old.id);
}

function importLoaded(c: CaseDetail, prefix: string, cutoff?: number): ImportResult {
  openDb();
  const events = cutoff === undefined ? c.history : c.history.slice(0, Math.max(0, cutoff));
  const caseRef = `${prefix}/${c.id}`;
  deleteExisting(caseRef);

  // NOTE: deliberately never reads c.sections["Outcome"|"Overview"] or c.details["Status"].
  const firstTs = events[0] ? toIso(events[0].timestamp) : new Date().toISOString();
  const lastTs = events.length ? toIso(events[events.length - 1].timestamp) : firstTs;

  // property
  const addrFromEvent = events.map((e) => e.body.match(/^Address:\s*(.+)$/m)?.[1]?.trim()).find(Boolean);
  const address = c.details["Property"]?.trim() || addrFromEvent || `Unknown address (${caseRef})`;
  const propertyId = upsertProperty(address);

  // intake
  let intake: Intake = {};
  for (const e of events) {
    const i = parseIntake(e.body);
    if (i) intake = { ...intake, ...i };
  }

  // contacts
  let tenantName: string | null = null;
  let landlordName: string | null = null;
  let contractorName: string | null = null;
  let sawContractor = false;
  for (const e of events) {
    const fr = partyRole(e.from);
    const to = partyRole(e.to);
    if (fr === "contractor" || to === "contractor") sawContractor = true;
    const isMsg = /email|sms/i.test(e.channel);
    if (isMsg && fr === "agency") {
      const g = greetingName(e.body);
      if (g && to === "tenant" && !tenantName) tenantName = g;
      if (g && to === "landlord" && !landlordName) landlordName = g;
    }
    if (!contractorName) {
      const m = e.body.match(/maintenance provider ([A-Z][^.\n]*?) will be attending/i);
      if (m && !/^(will|is)$/i.test(m[1])) contractorName = m[1].trim();
      else if (to === "contractor" && !isGenericParty(e.to)) contractorName = e.to.trim();
      else if (fr === "contractor" && !isGenericParty(e.from)) contractorName = e.from.trim();
    }
  }
  const mk = (role: Role, name: string | null, force: boolean, company?: string) => {
    const r = upsertContact({ role, name: name ?? `${role[0].toUpperCase()}${role.slice(1)} (${caseRef})`, company, forceNew: force }, { actor: "system", ts: firstTs });
    if (!r.ok) throw new Error(r.error);
    return r.contact_id;
  };
  const tenantId = mk("tenant", tenantName, true);
  const landlordId = mk("landlord", landlordName, true);
  const contractorId = contractorName
    ? mk("contractor", contractorName, false, contractorName)
    : sawContractor
      ? mk("contractor", null, true)
      : null;
  for (const [cid, role] of [
    [tenantId, "tenant"],
    [landlordId, "landlord"],
    [contractorId, "contractor"],
  ] as const)
    if (cid != null) linkContact(propertyId, cid, role, { actor: "system", ts: firstTs });

  // events + stage + holds + approvals
  const description =
    c.sections["Initial request"]?.trim() ||
    events.find((e) => e.body.startsWith("Request description:"))?.body.replace(/^Request description:\s*/, "") ||
    c.title;
  const severity = intake.severity ?? null;
  const priority = severity === "EMERGENCY" ? "urgent" : severity === "URGENT" ? "high" : "normal";

  const tid = run(
    `INSERT INTO tickets (case_ref, property_id, tenant_id, landlord_id, contractor_id, title, description, category, severity, stage, status, priority, created_at, updated_at)
     VALUES (?,?,?,?,?,?,?,?,?, 'intake', 'open', ?, ?, ?)`,
    caseRef,
    propertyId,
    tenantId,
    landlordId,
    contractorId,
    c.title,
    description,
    intake.category ?? null,
    severity,
    priority,
    firstTs,
    lastTs,
  ).id;

  let stage: Stage = "intake";
  let facts = 0;
  let conflicts = 0;
  const fact = (type: "property" | "contact", id: number, key: string, value: string, src: string, conf: number, ts: string) => {
    const r = addFact({ type, id }, key, value, src, conf, { actor: "system", ts });
    if (r.ok) {
      if (!r.conflict && r.unchanged) return;
      facts++;
      if (r.conflict) conflicts++;
    }
  };

  const holdIdsOpen: number[] = [];
  let lastLandlordInbound = "";
  let pendingApproval: number | null = null;

  for (const e of events) {
    const ts = toIso(e.timestamp);
    const src = ref(caseRef, e.n);
    const fr = partyRole(e.from);
    const to = partyRole(e.to);
    const kind = KIND[e.channel.toLowerCase()] ?? "note";
    const other = fr !== "agency" ? e.from : e.to;
    const direction = fr === "agency" ? (to === "agency" ? "internal" : "out") : to === "agency" || /unspecified|not specified/i.test(e.to) ? "in" : "internal";
    insertEvent(tid, {
      ts,
      kind,
      direction: kind === "note" || kind === "update" || kind === "hold" ? "internal" : direction,
      party: kind === "note" || kind === "update" || kind === "hold" ? null : isGenericParty(other) || /^\s*$/.test(other) ? other.trim() : other.trim(),
      body: e.body,
      attachments: e.attachments,
      source_ref: src,
    });

    // activity releases open holds
    if (holdIdsOpen.length && isActivity(e)) {
      for (const h of holdIdsOpen) run("UPDATE holds SET released_at=? WHERE id=?", ts, h);
      holdIdsOpen.length = 0;
    }

    if (kind === "hold") {
      const m = e.body.match(/Put on hold(?: by ([^.]+?))?\.\s*Reason:\s*([^\n]*?)(?:\.\s*Comment:\s*([\s\S]*))?$/);
      const reasonRaw = m?.[2]?.trim() ?? e.body.trim();
      const comment = m?.[3]?.trim();
      const waitingOn = reasonRaw.replace(/^Waiting for\s+/i, "").replace(/\.$/, "");
      const id = run(
        "INSERT INTO holds (ticket_id, reason, waiting_on, follow_up_at, created_at) VALUES (?,?,?,?,?)",
        tid,
        comment ? `${reasonRaw}: ${comment}` : reasonRaw,
        waitingOn,
        null,
        ts,
      ).id;
      holdIdsOpen.push(id);
    }

    if (kind === "update" || kind === "note") {
      const st = kind === "update" || /NOT TENANTED/i.test(e.body) ? stageFromPhrase(e.body) : null;
      if (st) stage = st;
      if (/NOT TENANTED/i.test(e.body)) {
        run("UPDATE properties SET tenanted=0 WHERE id=?", propertyId);
        fact("property", propertyId, "tenanted", "false", src, 0.9, ts);
      }
      if (kind === "update" && /complete landlord approval step first/i.test(e.body) && pendingApproval === null) {
        pendingApproval = run(
          "INSERT INTO approvals (ticket_id, landlord_id, summary, channel, status, requested_at) VALUES (?,?,?,?, 'pending', ?)",
          tid,
          landlordId,
          `Landlord approval to proceed: ${c.title}`,
          "email",
          ts,
        ).id;
      }
      if (kind === "update" && /Landlord approval confirmed|Quote was approved by landlord/i.test(e.body)) {
        if (pendingApproval === null)
          pendingApproval = run(
            "INSERT INTO approvals (ticket_id, landlord_id, summary, channel, status, requested_at) VALUES (?,?,?,?, 'pending', ?)",
            tid,
            landlordId,
            /Quote/i.test(e.body) ? `Quote approval: ${c.title}` : `Landlord approval: ${c.title}`,
            "email",
            ts,
          ).id;
        run("UPDATE approvals SET status='approved', response_text=?, resolved_at=? WHERE id=?", lastLandlordInbound.slice(0, 500) || e.body, ts, pendingApproval);
        pendingApproval = null;
      }
    }

    if (fr === "landlord" && kind === "email") lastLandlordInbound = e.body;

    const intakeHere = parseIntake(e.body);
    if (intakeHere) {
      if (intakeHere.category) {
        /* category/severity live on the ticket */
      }
      if (intakeHere.pets) fact("property", propertyId, "has_pets", intakeHere.pets, src, 0.9, ts);
      if (intakeHere.petsDetail) fact("property", propertyId, "pets_detail", intakeHere.petsDetail, src, 0.8, ts);
      if (intakeHere.access) fact("property", propertyId, "has_access_considerations", intakeHere.access, src, 0.9, ts);
    }
    if (PAYS_DIRECT.test(e.body)) fact("contact", landlordId, "pays_contractor_directly", "true", src, 0.7, ts);
  }

  const status = stage === "closed" ? "closed" : stage === "paused" || holdIdsOpen.length ? "on_hold" : "open";
  run("UPDATE tickets SET stage=?, status=? WHERE id=?", stage, status, tid);
  logAction(tid, "system", "import_case", { case_ref: caseRef, cutoff: cutoff ?? null }, { events: events.length, stage, status, facts, conflicts }, true, lastTs);
  return { ok: true, ticket_id: tid, case_ref: caseRef, stage, status, events: events.length, facts, conflicts };
}

export function importCase(track: string, id: string, opts: { cutoff?: number } = {}) {
  const c = loadCase(track, id);
  if (!c) return { ok: false as const, error: `case ${track}/${id} not found` };
  return importLoaded(c, abbr(track), opts.cutoff);
}

/** Import an arbitrary case folder (index.md + history.md [+ attachments/]). */
export function importCaseDir(absPath: string, opts: ImportOpts = {}) {
  const dir = path.resolve(absPath);
  const track = opts.track ?? path.basename(path.dirname(dir));
  const id = opts.id ?? path.basename(dir);
  const c = loadCaseDir(dir, track, id);
  if (!c) return { ok: false as const, error: `no index.md in ${dir}` };
  return importLoaded(c, abbr(track), opts.cutoff);
}

export function importAll(track = "Property Management", opts: { cutoff?: number } = {}) {
  const base = path.join(CASES_DIR, track);
  const ids = fs
    .readdirSync(base, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
  return ids.map((id) => importCase(track, id, opts));
}

export function summary() {
  const q = <T>(sql: string) => all<T>(sql);
  return {
    tickets_by_stage: q<{ stage: string; n: number }>("SELECT stage, COUNT(*) n FROM tickets GROUP BY stage ORDER BY n DESC"),
    tickets_by_status: q<{ status: string; n: number }>("SELECT status, COUNT(*) n FROM tickets GROUP BY status"),
    contacts_by_role: q<{ role: string; n: number }>("SELECT role, COUNT(*) n FROM contacts GROUP BY role"),
    properties: one<{ n: number }>("SELECT COUNT(*) n FROM properties")!.n,
    events: one<{ n: number }>("SELECT COUNT(*) n FROM ticket_events")!.n,
    holds: one<{ n: number }>("SELECT COUNT(*) n FROM holds")!.n,
    open_holds: one<{ n: number }>("SELECT COUNT(*) n FROM holds WHERE released_at IS NULL")!.n,
    approvals: q<{ status: string; n: number }>("SELECT status, COUNT(*) n FROM approvals GROUP BY status"),
    facts: one<{ n: number }>("SELECT COUNT(*) n FROM profile_facts")!.n,
    fact_conflicts: one<{ n: number }>("SELECT COUNT(*) n FROM profile_facts WHERE status='conflict'")!.n,
  };
}

// ---------- CLI ----------
if (import.meta.main) {
  const args = process.argv.slice(2);
  const flag = (n: string) => args.indexOf(n);
  const val = (n: string) => (flag(n) >= 0 ? args[flag(n) + 1] : undefined);
  const cutoff = val("--cutoff") !== undefined ? Number(val("--cutoff")) : undefined;
  if (flag("--reset") >= 0) resetDb();
  else openDb();
  if (flag("--all") >= 0) {
    const res = importAll(val("--track") ?? "Property Management", { cutoff });
    const bad = res.filter((r) => !r.ok);
    console.log(`imported ${res.length - bad.length} tickets (${bad.length} failed)`);
    console.log(JSON.stringify(summary(), null, 2));
  } else if (val("--case")) {
    const r = importCase(val("--track") ?? "Property Management", val("--case")!, { cutoff });
    console.log(JSON.stringify(r, null, 2));
  } else if (val("--dir")) {
    console.log(JSON.stringify(importCaseDir(val("--dir")!, { cutoff }), null, 2));
  } else {
    console.log("usage: node crm/import.ts --all [--reset] [--cutoff N] | --case 042 [--cutoff N] | --dir <path>");
  }
}
