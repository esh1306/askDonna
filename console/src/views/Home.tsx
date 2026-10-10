import { useEffect, useRef, useState } from "react";
import { ago, api } from "../api.ts";
import type { TicketRow } from "../api.ts";
import { Button, DonnaMark, EmptyState, RichText } from "../components/index.ts";
import { reduced } from "../components/Toast.tsx";
import { steps } from "./Queue.tsx";
import "../home.css";

type Item = { id: string; ticket_id: number; ts: string; kind: string; text: string };
type Up = { id: number; ticket_id: number; waiting_on: string | null; follow_up_at: string; address: string | null; title: string; created_at?: string };
type Activity = { items: Item[]; upcoming: Up[]; today_count: number };

/** Counts 0 -> value on first paint, eases between values afterwards; `tick` increments whenever the value changes. */
function useCount(value: number) {
  const [shown, setShown] = useState(reduced() ? value : 0);
  const from = useRef(shown);
  const first = useRef(true);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!first.current) setTick((t) => t + 1);
    first.current = false;
    if (reduced()) { setShown(value); from.current = value; return; }
    const a = from.current, t0 = performance.now(), dur = 700;
    let raf = 0;
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / dur);
      const v = Math.round(a + (value - a) * (1 - Math.pow(1 - k, 3)));
      from.current = v; setShown(v);
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return { shown, tick };
}

function Tile({ tone, value, label, sub }: { tone: string; value: number; label: string; sub?: string }) {
  const { shown, tick } = useCount(value);
  return (
    <div className={`htile ${tone}`}>
      <b key={tick} className={tick ? "tick" : ""}>{shown}</b>
      <span>{label}</span>
      {sub && <i>{sub}</i>}
    </div>
  );
}

const rel = (ts: string) => { const m = Math.round((Date.now() - new Date(ts).getTime()) / 60000); return m < 1 ? "just now" : `${ago(ts)} ago`; };
const until = (ts: string) => {
  const m = Math.round((new Date(ts).getTime() - Date.now()) / 60000);
  if (m <= 0) return "now";
  if (m < 60) return `in ${m} min`;
  const d = new Date(ts), t = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  return new Date().toDateString() === d.toDateString() ? `at ${t}` : `${d.toLocaleDateString("en-GB", { weekday: "short" })} ${t}`;
};

const shortAddr = (a?: string | null, title?: string | null) =>
  !a || /^unknown/i.test(a) ? title ?? "Unknown property" : a.split(",").slice(0, /^flat/i.test(a) ? 2 : 1).join(",");
function stepType(i: Item): string {
  switch (i.kind) {
    case "place_hold": return "hold";
    case "queue_message": return /call/.test(i.text) ? "call" : /text/.test(i.text) ? "text" : "email";
    case "mark_message": return "email";
    case "request_approval": case "resolve_approval": return "approval";
    case "move_stage": return "stage";
    case "assign_contractor": return "assign";
    case "escalate": return "flag";
    default: return "note";
  }
}
const ICO: Record<string, string> = {
  hold: "M12 7v5l3 2M12 3a9 9 0 100 18 9 9 0 000-18z",
  email: "M4 6h16v12H4zM4 7l8 6 8-6",
  text: "M4 5h16v11H9l-4 3v-3H4z",
  call: "M6 4l3 1 1 4-2 1.5a10 10 0 005.5 5.5L15 14l4 1 1 3c-1 2-3 2-5 1.5A15 15 0 014.5 9C4 7 4 5 6 4z",
  approval: "M5 12.5l4.5 4.5L19 7",
  stage: "M5 12h14M13 6l6 6-6 6",
  assign: "M14 6a4 4 0 00-5 5l-5 5 2 2 5-5a4 4 0 005-5l-2.5 2.5-2-2z",
  flag: "M6 21V4M6 5h11l-2 4 2 4H6",
  note: "M5 5h14v14H5z",
};
const Ico = ({ t }: { t: string }) => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={ICO[t] ?? ICO.note} /></svg>
);

export default function Home({ tickets, queue, onOpen }: { tickets: TicketRow[]; queue: any[]; onOpen: (id: number) => void }) {
  const [act, setAct] = useState<Activity | null>(null);
  useEffect(() => {
    let live = true;
    const load = () => api<Activity>("/api/activity?limit=30").then((a) => {
      if (!live) return;
      setAct(a);
    }).catch(() => {});
    load();
    const t = setInterval(load, 15000);
    return () => { live = false; clearInterval(t); };
  }, []);

  const live = tickets.filter((t) => t.status !== "closed");
  const closed = tickets.length - live.length;
  const needs = live.filter((t) => t.open_escalations > 0).length;
  const waiting = live.filter((t) => !t.open_escalations && (t.status === "on_hold" || t.pending_approvals > 0)).length;
  const inMotion = live.length - needs - waiting;
  const handled = inMotion + closed;
  const today = act?.today_count ?? 0;
  const mins = today * 6;

  // Keep rows that just left the queue on screen long enough to check off and collapse.
  const [rows, setRows] = useState<{ h: any; gone?: boolean }[]>([]);
  useEffect(() => {
    setRows((prev) => {
      const cur = new Map(queue.map((h) => [h.id, h]));
      const kept = prev.map((r) => (cur.has(r.h.id) ? { h: cur.get(r.h.id) } : { ...r, gone: true }));
      const have = new Set(prev.map((r) => r.h.id));
      return [...kept, ...queue.filter((h) => !have.has(h.id)).map((h) => ({ h }))].sort((a, b) => b.h.id - a.h.id);
    });
  }, [queue]);
  const anyGone = rows.some((r) => r.gone);
  useEffect(() => {
    if (!anyGone) return;
    const t = setTimeout(() => setRows((r) => r.filter((x) => !x.gone)), reduced() ? 100 : 1500);
    return () => clearTimeout(t);
  }, [anyGone]);
  const top = rows.slice(0, 5);

  const items = act?.items ?? [];
  const working = !!items[0] && Date.now() - new Date(items[0].ts).getTime() < 120000;
  const up = [...(act?.upcoming ?? [])].sort((a, b) => a.follow_up_at.localeCompare(b.follow_up_at));
  const byId = new Map(tickets.map((t) => [t.id, t]));
  const midnight = new Date(); midnight.setHours(0, 0, 0, 0);
  const tal = { email: 0, call: 0, approval: 0, hold: 0 };
  for (const i of items) {
    if (new Date(i.ts) < midnight) continue;
    const t = stepType(i);
    if (t === "email" || t === "text") tal.email++; else if (t === "call") tal.call++; else if (t === "approval") tal.approval++; else if (t === "hold") tal.hold++;
  }
  const cases = (() => {
    const g = new Map<number, Item[]>();
    for (const i of items) { if (!g.has(i.ticket_id)) g.set(i.ticket_id, []); g.get(i.ticket_id)!.push(i); }
    return [...g.entries()].slice(0, 6).map(([id, list]) => {
      const t = byId.get(id);
      const prop = shortAddr(t?.address, t?.title);
      const chrono = [...list].reverse();
      const steps: { t: string; n: number; tip: string }[] = [];
      for (const i of chrono) {
        const ty = stepType(i), last = steps[steps.length - 1];
        if (last && last.t === ty) last.n++; else steps.push({ t: ty, n: 1, tip: i.text.replace(/^I /, "").replace(/^./, (c) => c.toUpperCase()) });
      }
      const mv = list.find((i) => i.kind === "move_stage");
      const move = mv ? (/to (.+)$/.exec(mv.text)?.[1] ?? "").replace(/^./, (c) => c.toUpperCase()) : "";
      const head = list[0];
      const uv = up.find((u) => u.ticket_id === id);
      let last = head.text;
      for (const x of [` at ${prop}`, ` on ${prop}`, ` at ${t?.address ?? "\u0000"}`]) last = last.replace(x, "");
      if (head.kind === "place_hold") {
        const m = /until (.+?) replies/.exec(head.text);
        last = `Waiting on ${m ? m[1] : "a reply"}${uv ? ` \u00b7 I'll chase at ${new Date(uv.follow_up_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}` : ""}`;
      }
      const fresh = list.some((i) => Date.now() - new Date(i.ts).getTime() < 600000 && i.kind === "move_stage");
      return { id, prop, title: t?.title ?? "Case", steps, move, last, ts: head.ts, fresh };
    });
  })();

  return (
    <div className="page">
      <div className="page-inner home">
        <div className="page-head"><div className="grow"><h1><DonnaMark size={30} />Good to see you.</h1><p>Here is where things stand, and what I am doing about it.</p></div></div>
        <div className="htiles">
          <Tile tone="good" value={handled} label="Handled by Donna" sub={`${closed} closed, ${inMotion} in motion`} />
          <Tile tone="warn" value={waiting} label="Waiting on others" sub="Donna will chase" />
          <Tile tone={needs ? "bad" : ""} value={needs} label="Needs your judgement" sub={needs ? "Pick one below" : "All clear"} />
          <Tile tone="accent" value={today} label="Actions Donna took today" sub="Since midnight" />
        </div>
        <div className="hvalue">
          <span><b>≈ {mins < 60 ? `${mins} min` : `${(mins / 60).toFixed(1)} hours`}</b> of admin saved today <em>(estimate, 6 min per action)</em></span>
          <span className="sep" />
          <span><b>{closed}</b> {closed === 1 ? "case" : "cases"} resolved without you</span>
        </div>

        <div className="hcols">
          <section className="hcol">
            <h2 className="hh">What you should do</h2>
            {top.length === 0 && <EmptyState card title="Nothing needs you right now." hint="Donna will flag anything she cannot close." />}
            <div className="hlist">
              {top.map(({ h, gone }) => {
                const all = [h.reason, h.summary, h.checked, h.recommendation].filter(Boolean).join("\n");
                const todo = steps(h.recommendation)[0];
                const urgent = h.priority === "urgent" || h.priority === "high";
                return (
                  <div key={h.id} className={`hcollapse ${gone ? "gone" : ""}`}><div>
                    <div className={`drow ${gone ? "done" : ""}`}>
                      <span className={`pdot ${urgent ? "bad" : ""}`} title={`${h.priority} priority`} />
                      <div className="grow">
                        <div className="dt">{h.title}</div>
                        <div className="dm">{h.address ?? "No address"} · waiting {ago(h.created_at)}</div>
                        {todo && <div className="dd"><RichText text={todo} ticketId={h.ticket_id} notes={all} /></div>}
                      </div>
                      {gone
                        ? <span className="dcheck"><svg width="22" height="22" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
                        : <Button size="sm" onClick={() => onOpen(h.ticket_id)}>Review</Button>}
                    </div>
                  </div></div>
                );
              })}
            </div>
            {queue.length > 5 && <div className="small muted" style={{ marginTop: 8 }}>{queue.length - 5} more in Needs you.</div>}
          </section>

          <section className="hcol">
            <h2 className="hh">What Donna is doing</h2>
            <div className={`agent ${working ? "on" : ""}`}>
              <span className="wave" aria-hidden><i /><i /><i /><i /><i /></span>
              <b>{working ? "Donna is working" : `Donna is watching ${live.length} cases`}</b>
              <span className="tallies">
                {([["emails", tal.email], ["calls", tal.call], ["approvals", tal.approval], ["holds", tal.hold]] as const).map(([l, n]) => <span key={l}><em>{n}</em> {l}</span>)}
              </span>
            </div>
            {cases.length === 0 && <div className="small muted" style={{ padding: "8px 0" }}>{act ? "Quiet for now. I'll show my moves here as I make them." : "Checking in..."}</div>}
            <div className="cases">
              {cases.map((c) => (
                <button key={c.id} className={`ccard ${c.fresh ? "fresh" : ""}`} onClick={() => onOpen(c.id)}>
                  <div className="ch"><span className="cp">{c.prop}</span><span className="cw">{c.fresh ? "Just now" : rel(c.ts)}</span></div>
                  <div className="cti">{c.title}</div>
                  <div className="chain">
                    {c.steps.map((st, k) => (
                      <span key={k} className="stp" data-t={st.t} title={`${st.tip}${st.n > 1 ? ` x${st.n}` : ""}`}>
                        <Ico t={st.t} />{st.n > 1 && <sub>x{st.n}</sub>}
                      </span>
                    ))}
                    {c.move && <span className="trans" key={c.move}><i className="arr">{"\u2192"}</i><span className="np">{c.move}</span></span>}
                  </div>
                  <div className="clast">{c.last}</div>
                </button>
              ))}
            </div>
            {up.length > 0 && (
              <>
                <h2 className="hh sub">Up next</h2>
                <div className="tl">
                  {up.map((u) => {
                    const end = new Date(u.follow_up_at).getTime();
                    const start = Math.min(new Date(u.created_at ?? 0).getTime() || end - 86400000, end - 60000);
                    const pct = Math.max(4, Math.min(100, ((Date.now() - start) / (end - start)) * 100));
                    const w = (u.waiting_on ?? "").toLowerCase();
                    const who = !w ? "the other side" : /^(agency|team|staff)$/.test(w) ? "the team" : /^(landlord|tenant|contractor)$/.test(w) ? `the ${w}` : u.waiting_on!;
                    const d = new Date(end), sameDay = new Date().toDateString() === d.toDateString();
                    const hm = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
                    return (
                      <button key={u.id} className="tr" onClick={() => onOpen(u.ticket_id)}>
                        <span className="tt">{hm}{!sameDay && <small>{d.toLocaleDateString("en-GB", { weekday: "short" })}</small>}</span>
                        <span className="td" />
                        <span className="tb"><span className="tx">Chase {who} {"\u00b7"} {/^unknown/i.test(u.address ?? "unknown") ? u.title : shortAddr(u.address, u.title)}</span><span className="bar"><span style={{ width: `${pct}%` }} /></span></span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
