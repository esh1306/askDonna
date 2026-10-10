import fs from "node:fs";
import path from "node:path";
import { openDb } from "./db.ts";
import { all, one, run, logAction, getTicketContext } from "./repo.ts";

export type Lesson = {
  id: number;
  situation: string;
  trigger: string | null;
  stage: string | null;
  category: string | null;
  action: string;
  rationale: string;
  source: "dataset" | "human" | "feedback";
  source_ref: string | null;
  weight: number;
  uses: number;
  created_at: string;
};

const DDL = `
CREATE TABLE IF NOT EXISTS lessons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  situation TEXT NOT NULL,
  trigger TEXT,
  stage TEXT,
  category TEXT,
  action TEXT NOT NULL,
  rationale TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL,
  source_ref TEXT,
  weight REAL NOT NULL DEFAULT 1,
  uses INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_lessons_source ON lessons(source);
`;
const ready = new WeakSet<object>();
function ensure() {
  const db = openDb();
  if (!ready.has(db)) {
    db.exec(DDL);
    ready.add(db);
  }
}

export function addLesson(l: Omit<Lesson, "id" | "weight" | "uses" | "created_at"> & { weight?: number }): Lesson {
  ensure();
  const r = run(
    `INSERT INTO lessons (situation, trigger, stage, category, action, rationale, source, source_ref, weight, uses, created_at) VALUES (?,?,?,?,?,?,?,?,?,0,?)`,
    l.situation,
    l.trigger ?? null,
    l.stage ?? null,
    l.category ?? null,
    l.action,
    l.rationale ?? "",
    l.source,
    l.source_ref ?? null,
    l.weight ?? 1,
    new Date().toISOString(),
  );
  return one<Lesson>("SELECT * FROM lessons WHERE id=?", r.id)!;
}

export function listLessons(opts: { q?: string; source?: string; limit?: number } = {}): Lesson[] {
  ensure();
  const where: string[] = [];
  const params: (string | number)[] = [];
  if (opts.source) {
    where.push("source=?");
    params.push(opts.source);
  }
  if (opts.q?.trim()) {
    const like = `%${opts.q.trim().toLowerCase()}%`;
    where.push("(lower(situation) LIKE ? OR lower(action) LIKE ? OR lower(rationale) LIKE ? OR lower(coalesce(trigger,'')) LIKE ? OR lower(coalesce(category,'')) LIKE ?)");
    params.push(like, like, like, like, like);
  }
  params.push(opts.limit ?? 200);
  return all<Lesson>(`SELECT * FROM lessons ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY weight DESC, id DESC LIMIT ?`, ...params);
}

const STOP = new Set(
  "a an the and or but of to in on at for with by from is are was were be been it its this that these those as we i you he she they them their our your not no do does did has have had will would should can could may might if then so than into out up down over after before about there here which who whom what when where how all any some one two".split(" "),
);
export function words(s: string): Set<string> {
  return new Set(
    s
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length > 1 && !STOP.has(w)),
  );
}
export function jaccard(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const w of a) if (b.has(w)) inter++;
  return inter / (a.size + b.size - inter);
}

export function recallLessons(
  q: { text: string; stage?: string | null; trigger?: string | null; category?: string | null },
  k = 5,
): (Lesson & { score: number })[] {
  if (process.env.DONNA_LESSONS === "0") return [];
  ensure();
  const qw = words(q.text ?? "");
  const eq = (a: string | null | undefined, b: string | null | undefined) => !!a && !!b && a.toLowerCase() === b.toLowerCase();
  const scored = all<Lesson>("SELECT * FROM lessons").map((l) => {
    let s = 0;
    if (eq(l.stage, q.stage)) s += 2;
    if (eq(l.trigger, q.trigger)) s += 2;
    if (eq(l.category, q.category)) s += 1;
    s += jaccard(qw, words(`${l.situation} ${l.action}`)) * 5;
    s *= 0.5 + l.weight / (l.weight + 2);
    return { ...l, score: Math.round(s * 1000) / 1000 };
  });
  return scored
    .filter((l) => l.score > 0)
    .sort((a, b) => b.score - a.score || b.weight - a.weight || b.id - a.id)
    .slice(0, k);
}

export function voteLesson(id: number, delta: 1 | -1): Lesson | null {
  ensure();
  const l = one<Lesson>("SELECT * FROM lessons WHERE id=?", id);
  if (!l) return null;
  run("UPDATE lessons SET weight=? WHERE id=?", Math.max(0, l.weight + delta), id);
  return one<Lesson>("SELECT * FROM lessons WHERE id=?", id)!;
}

export function markUsed(ids: number[]): void {
  ensure();
  for (const id of ids) run("UPDATE lessons SET uses=uses+1 WHERE id=?", id);
}

// ---------- Claude ----------
function apiKey(): string | undefined {
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY;
  try {
    const txt = fs.readFileSync(path.resolve(process.cwd(), ".env"), "utf8");
    for (const line of txt.split(/\r?\n/)) {
      const m = line.match(/^\s*ANTHROPIC_API_KEY\s*=\s*(.*)\s*$/);
      if (m) return m[1].replace(/^["']|["']$/g, "").trim() || undefined;
    }
  } catch {}
  return undefined;
}

export async function askClaude(system: string, user: string, maxTokens = 600): Promise<string> {
  const key = apiKey();
  if (!key) throw new Error("ANTHROPIC_API_KEY not set");
  let lastErr = "";
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-5-5", max_tokens: maxTokens, system, messages: [{ role: "user", content: user }] }),
      });
      if (res.ok) {
        const j = (await res.json()) as { content?: { type: string; text?: string }[] };
        return (j.content ?? []).map((c) => c.text ?? "").join("");
      }
      lastErr = `Anthropic ${res.status}: ${(await res.text()).slice(0, 200)}`;
      if (res.status < 429 && res.status !== 408) break;
    } catch (e) {
      lastErr = e instanceof Error ? e.message : String(e);
    }
    await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
  }
  throw new Error(lastErr);
}

export type LessonDraft = { situation: string; trigger: string | null; stage: string | null; category: string | null; action: string; rationale: string };

export function parseLessonJson(text: string): LessonDraft | null {
  const a = text.indexOf("{");
  const b = text.lastIndexOf("}");
  if (a < 0 || b <= a) return null;
  try {
    const j = JSON.parse(text.slice(a, b + 1)) as Record<string, unknown>;
    const s = (v: unknown) => (typeof v === "string" && v.trim() && v.trim().toLowerCase() !== "null" ? v.trim() : null);
    const situation = s(j.situation);
    const action = s(j.action);
    if (!situation || !action) return null;
    return { situation, action, rationale: s(j.rationale) ?? "", trigger: s(j.trigger), stage: s(j.stage), category: s(j.category) };
  } catch {
    return null;
  }
}

export const LESSON_SYSTEM =
  "You distil how a UK lettings agency's human property-maintenance operator handled a situation into ONE reusable, generalised lesson for an AI ops agent. " +
  "Strictly no names, addresses, amounts, dates or reference numbers. Reply with STRICT JSON only, no prose: " +
  '{"situation": "...", "trigger": "...", "stage": "...", "category": "...", "action": "...", "rationale": "..."}. ' +
  "situation = the generalised circumstances in one sentence; action = imperative instruction of what to do (and with whom); rationale = why, one sentence. " +
  "stage is one of intake, landlord_approval, provider_selection, scheduling, works, closeout, closed, paused (or null); category is the job category such as plumbing, electrical, heating, appliance, gardening, roofing (or null).";

export async function learnFromHumanAction(input: {
  ticketId: number;
  action: string;
  details: Record<string, unknown>;
  note?: string;
  source?: "human" | "feedback";
}): Promise<{ ok: true; lesson: Lesson } | { ok: false; error: string }> {
  try {
    ensure();
    const ctx = getTicketContext(input.ticketId, { events: 10 });
    if (!ctx.ok) return { ok: false, error: ctx.error };
    const snap = {
      stage: ctx.ticket.stage,
      category: ctx.ticket.category,
      status: ctx.ticket.status,
      recent_events: ctx.events.slice(-10).map((e) => ({ kind: e.kind, direction: e.direction, party: e.party, body: (e.body ?? "").slice(0, 400) })),
      approvals: ctx.approvals.map((a) => ({ status: a.status, summary: a.summary, response: a.response_text })),
      holds: ctx.open_holds.map((h) => ({ reason: h.reason, waiting_on: h.waiting_on })),
    };
    const prompt =
      `Ticket snapshot:\n${JSON.stringify(snap, null, 1)}\n\nThe human operator just did: ${input.action}\nDetails: ${JSON.stringify(input.details).slice(0, 1500)}\n` +
      (input.note ? `Operator's own words: ${input.note}\n` : "") +
      (input.source === "feedback" ? "This was feedback on a suggestion by the AI agent (rejected/edited): capture what the agent should do instead.\n" : "") +
      `Trigger vocabulary: landlord_reply, tenant_reply, contractor_reply, contractor_completion, invoice_received, quote_received, no_response, reminders, extraction_failed, new_request. Write the lesson JSON.`;
    const draft = parseLessonJson(await askClaude(LESSON_SYSTEM, prompt, 600));
    if (!draft) return { ok: false, error: "could not parse a lesson from the model reply" };
    const lesson = addLesson({
      ...draft,
      stage: draft.stage ?? ctx.ticket.stage,
      category: draft.category ?? ctx.ticket.category,
      source: input.source ?? "human",
      source_ref: `console ticket ${input.ticketId} ${input.action}`,
    });
    logAction(input.ticketId, "human", input.action, input.details, { lesson_id: lesson.id }, true);
    return { ok: true, lesson };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
