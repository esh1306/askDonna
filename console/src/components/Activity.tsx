import { useMemo, useState } from "react";
import { label, nm } from "../api.ts";
import type { Detail } from "../api.ts";
import { Chev, DonnaMark, EntityChip, Icon, Reveal, RichText } from "./index.ts";

type Ev = Detail["events"][number];
type Chip = { k: "stage" | "money" | "chn" | "muted" | "prio" | "date"; text: string; to?: string };
export type Activity = { type: string; icon: string; title: string; chips: Chip[]; detail: string; preview?: string; donna: boolean; person?: string };
type Ctx = { landlord?: string | null; priority?: string | null };

const stage = (s: string) => label(s.trim().replace(/-/g, "_")).replace(/_/g, " ");
const shortDate = (s: string) => { const d = new Date(s); return isNaN(+d) ? s : d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }); };
const cap = (s: string) => s.replace(/^./, (c) => c.toUpperCase());

/** Remove internal ids and trailing duplicate amounts from displayed text. */
export function scrub(t: string): string {
  return t
    .replace(/\s*\((?:approval|events?|hold_id|hold|queue|ticket)s?\s*#?\s*[\d, #and]+\)/gi, "")
    .replace(/\s*\b(?:event|hold_id|queue|approval)s?\s*#?\s*\d+(?:\s*,\s*\d+)*/gi, "")
    .replace(/\s*\((?:£|GBP\s*)\s*[\d.,]+\)\s*$/i, "")
    .replace(/\s*\((?:ref\s+)?(?:PM|R|P|T|C)\/\d+\)/gi, "")
    .replace(/\(\s*[,;]\s*/g, "(") // "(approval 36, voice call)" -> "(voice call)"
    .replace(/\s*\(\s*\)/g, "")
    .replace(/(£\s?[\d.,]+)([.\s]*)\(?\s*\1\s*\)?/g, "$1$2") // "£85. (£85)" -> "£85."
    .replace(/[ \t]{2,}/g, " ").replace(/\s+([.,;:])/g, "$1").replace(/\.{2,}/g, ".").trim();
}
const firstClause = (t: string, max = 9) => {
  const c = scrub(t).split(/[;:,]|\s[-–—]\s|\.\s/)[0].trim();
  const w = c.split(/\s+/);
  return w.length > max ? w.slice(0, max).join(" ") + "…" : c;
};
const preview = (body: string) => {
  const lines = body.split("\n").map((l) => l.trim()).filter((l) => l && !/^(address|job id|subject|ref|case)\s*:/i.test(l) && !/^(hi|hello|dear|hey)\b[^.!?]{0,40}[,!]?$/i.test(l));
  const t = scrub(lines.join(" ").replace(/^(hi|hello|dear)\s+[\w ]{1,30},\s*/i, ""));
  return t.length > 80 ? t.slice(0, 79).trimEnd() + "…" : t;
};
const partyName = (p: string | null) => {
  const raw = (p ?? "").replace(/\s*\(.*?\)/g, "").trim();
  return !raw ? "them" : /^(landlord|tenant|contractor)$/i.test(raw) ? `the ${raw.toLowerCase()}` : raw;
};

export function parseActivity(e: Ev, ctx: Ctx = {}): Activity {
  const body = (e.body ?? "").replace(/^Donna[:,]?\s+/, "").trim();
  const out = e.direction === "out";
  const donna = e.kind === "agent_action" || out;
  const mk = (type: string, icon: string, title: string, chips: Chip[], detail: string, extra: Partial<Activity> = {}): Activity => ({ type, icon, title, chips, detail: scrub(detail) || scrub(body), donna, ...extra });
  let m: RegExpMatchArray | null;
  if ((m = body.match(/^(?:I\s+)?escalated to (?:the )?human queue\s*:\s*([\s\S]+)/i))) {
    const chips: Chip[] = ctx.priority ? [{ k: "prio", text: cap(ctx.priority) }] : [];
    return mk("flag", "flag", "Flagged for you", chips, m[1], { preview: firstClause(m[1]) });
  }
  if ((m = body.match(/^stage\s+([\w-]+)\s*(?:->|→|to)\s*([\w-]+)\s*:?\s*([\s\S]*)/i))) {
    return mk("stage", "stage", `Moved to ${stage(m[2]).toLowerCase()}`, [{ k: "stage", text: stage(m[1]), to: stage(m[2]) }], m[3]);
  }
  if ((m = body.match(/^landlord approval requested(?: via (\w+))?\s*:\s*([\s\S]+)/i))) {
    const ch = (m[1] ?? "email").toLowerCase();
    const amt = m[2].match(/\((?:£|GBP\s*)\s*([\d.,]+)\)\s*$/i)?.[1] ?? m[2].match(/(?:£|GBP\s*)\s*([\d.,]+)/i)?.[1];
    const chips: Chip[] = [];
    if (amt) chips.push({ k: "money", text: `£${amt.replace(/[.,]$/, "")}` });
    chips.push({ k: "chn", text: `by ${ch}` });
    return mk("approval", ch === "call" ? "phone" : "mail", `Asked ${nm(ctx.landlord)} to approve`, chips, m[2]);
  }
  if ((m = body.match(/^landlord approval (approved|rejected|declined|expired)\s*:?\s*([\s\S]*)/i))) {
    const ok = /approved/i.test(m[1]);
    return mk("decision", ok ? "check" : "x", ok ? "Landlord approved" : /expired/i.test(m[1]) ? "Approval expired" : "Landlord declined", [], m[2]);
  }
  if ((m = body.match(/^on hold\s*:\s*([\s\S]*?)(?:\s*\(waiting on ([^)]+)\))?\s*(?:;\s*follow[- ]?up\s+(\S+))?\s*$/i))) {
    const chips: Chip[] = m[3] ? [{ k: "date", text: `chases ${shortDate(m[3])}` }] : [];
    return mk("hold", "clock", m[2] ? `Waiting on ${m[2]}` : "Waiting", chips, m[1]);
  }
  if (/^hold released/i.test(body)) return mk("hold", "check", "Stopped waiting", [], body.replace(/^hold released\s*:?\s*/i, ""));
  if ((m = body.match(/^maintenance provider assigned\s*:\s*([^.(,;]+)/i))) {
    const name = m[1].trim();
    return mk("assign", "wrench", "Assigned", [], body.replace(/^[^:]*:\s*/, ""), { person: name });
  }
  if ((m = body.match(/^(?:I\s+)?alerted the on-call team(?: by ([\w, /&+-]+?))?(\s*\(demo\))?\s*:\s*([\s\S]+)/i))) {
    const chips: Chip[] = (m[1] ?? "").split(/,|\band\b|&|\//).map((s) => s.trim()).filter(Boolean).map((t) => ({ k: "chn" as const, text: t }));
    if (m[2] || /\(demo\)/i.test(body)) chips.push({ k: "muted", text: "demo" });
    return mk("alert", "bell", "Alerted on-call team", chips, m[3]);
  }
  const ch = e.kind === "sms" ? "sms" : e.kind === "call" ? "call" : e.kind === "email" ? "mail" : null;
  if (ch && out) {
    const verb = ch === "sms" ? "Texted" : ch === "call" ? "Called" : "Emailed";
    return mk("out", ch === "call" ? "phone" : ch, `${verb} ${partyName(e.party)}`, [], body, { preview: preview(body) });
  }
  if (e.direction === "in") {
    const who = cap(partyName(e.party));
    return mk("in", ch === "call" ? "phone" : ch ?? "mail", `${who} ${ch === "call" ? "called" : "replied"}`, [], body, { preview: preview(body) });
  }
  if (out) return mk("out", "mail", `Messaged ${partyName(e.party)}`, [], body, { preview: preview(body) });
  return mk("other", "dot", firstClause(body, 10) || "Update", [], body);
}

const day = (ts: string) => {
  const d = new Date(ts), n = new Date();
  const k = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((k(n) - k(d)) / 864e5);
  return diff === 0 ? "Today" : diff === 1 ? "Yesterday" : d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
};
const hhmm = (ts: string) => new Date(ts).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

function Row({ e, a, ticketId }: { e: Ev; a: Activity; ticketId: number }) {
  const [o, setO] = useState(false);
  const hasMore = !!a.detail && a.detail !== a.preview;
  return (
    <li className={`act ${a.donna ? "donna" : ""} ${o ? "open" : ""}`}>
      <button type="button" className="act-row" onClick={() => hasMore && setO(!o)} aria-expanded={o}>
        <span className="act-ic">{a.type === "other" && a.donna ? <DonnaMark size={14} /> : <Icon name={a.icon} size={14} />}</span>
        <span className="act-main">
          <span className="act-t">{a.title}</span>
          {a.person && <span onClick={(ev) => ev.stopPropagation()}><EntityChip kind="person" label={a.person} /></span>}
          {a.chips.map((c, i) => c.k === "stage"
            ? <span key={i} className="achip stage">{c.text}<i>→</i><b>{c.to}</b></span>
            : <span key={i} className={`achip ${c.k}`}>{c.text}</span>)}
          {a.preview && !o && <span className="act-p">{a.preview}</span>}
        </span>
        <time className="act-time">{hhmm(e.ts)}</time>
        <span className="act-chev">{hasMore ? <Chev open={o} /> : null}</span>
      </button>
      <Reveal open={o}><div className="act-detail pre"><RichText text={a.detail} ticketId={ticketId} /></div></Reveal>
    </li>
  );
}

export function ActivityList({ events, d, limit = 6, groupSystem = false, empty }: { events: Ev[]; d: Detail; limit?: number; groupSystem?: boolean; empty?: string }) {
  const [all, setAll] = useState(false);
  const [sys, setSys] = useState<Record<number, boolean>>({});
  const ctx = { landlord: d.landlord?.name, priority: d.ticket.severity };
  type Item = { k: "ev"; e: Ev; a: Activity } | { k: "sys"; es: Ev[]; id: number };
  const items = useMemo(() => {
    const out: Item[] = [];
    [...events].sort((x, y) => +new Date(y.ts) - +new Date(x.ts) || y.id - x.id).forEach((e) => {
      const isSys = groupSystem && e.direction === "internal" && e.kind !== "agent_action" && e.party !== "human";
      const last = out[out.length - 1];
      if (isSys) { if (last?.k === "sys") last.es.push(e); else out.push({ k: "sys", es: [e], id: e.id }); }
      else out.push({ k: "ev", e, a: parseActivity(e, ctx) });
    });
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, d.landlord?.name, d.ticket.severity, groupSystem]);
  if (!items.length) return <div className="muted small">{empty ?? "Nothing yet."}</div>;
  const vis = all ? items : items.slice(0, limit);
  let lastDay = "";
  return (
    <>
      <ol className="acts">
        {vis.map((it) => {
          const ts = it.k === "ev" ? it.e.ts : it.es[0].ts;
          const dl = day(ts); const head = dl !== lastDay; lastDay = dl;
          return (
            <li key={`${it.k}${it.k === "ev" ? it.e.id : it.id}`} className="act-wrap">
              {head && <div className="act-day">{dl}</div>}
              {it.k === "ev" ? <ol className="acts-in"><Row e={it.e} a={it.a} ticketId={d.ticket.id} /></ol> : (
                <div className="act-sys">
                  <button className="link" onClick={() => setSys({ ...sys, [it.id]: !sys[it.id] })}><Chev open={!!sys[it.id]} /> {it.es.length} system note{it.es.length > 1 ? "s" : ""}</button>
                  <Reveal open={!!sys[it.id]}>{it.es.map((e) => <div key={e.id} className="quiet"><span>{hhmm(e.ts)}</span><span className="pre">{scrub(e.body ?? "")}</span></div>)}</Reveal>
                </div>
              )}
            </li>
          );
        })}
      </ol>
      {items.length > limit && <button className="link act-more" onClick={() => setAll(!all)}>{all ? "Show fewer" : `Show all ${items.length}`}</button>}
    </>
  );
}
