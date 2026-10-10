import { useEffect, useRef, useState } from "react";
import { ago, api } from "../api.ts";
import type { TicketRow } from "../api.ts";
import { Button, DonnaMark, EmptyState, RichText } from "../components/index.ts";
import { reduced } from "../components/Toast.tsx";
import { steps } from "./Queue.tsx";

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

export default function Home({ tickets, queue, onOpen }: { tickets: TicketRow[]; queue: any[]; onOpen: (id: number) => void }) {
  const [act, setAct] = useState<Activity | null>(null);
  const [seen, setSeen] = useState<Set<string>>(new Set());
  useEffect(() => {
    let live = true;
    const load = () => api<Activity>("/api/activity?limit=30").then((a) => {
      if (!live) return;
      setAct((prev) => { if (prev) setSeen(new Set(prev.items.map((i) => i.id))); return a; });
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

  const items = act?.items.slice(0, 15) ?? [];
  const working = !!items[0] && Date.now() - new Date(items[0].ts).getTime() < 120000;
  const up = act?.upcoming ?? [];

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
            <h2 className="hh">What Donna is doing {working && <span className="work" aria-label="Donna is working"><i /><i /><i /></span>}</h2>
            <div className="feed">
              {items.length === 0 && <div className="small muted" style={{ padding: "8px 0" }}>{act ? "Quiet for now. I'll show my moves here as I make them." : "Checking in..."}</div>}
              {items.map((i, n) => (
                <button key={i.id} className={`fi ${seen.size > 0 && !seen.has(i.id) ? "new" : ""}`} onClick={() => onOpen(i.ticket_id)}>
                  <span className="fm"><DonnaMark size={18} />{n === 0 && working && <span className="nowdot" />}</span>
                  <span className="ft">{i.text}</span>
                  <span className="fw">{rel(i.ts)}</span>
                </button>
              ))}
            </div>
            {up.length > 0 && (
              <>
                <h2 className="hh sub">Up next</h2>
                <div className="upnext">
                  {up.map((u) => {
                    const end = new Date(u.follow_up_at).getTime();
                    const start = Math.min(new Date(u.created_at ?? 0).getTime() || end - 86400000, end - 60000);
                    const pct = Math.max(4, Math.min(100, ((Date.now() - start) / (end - start)) * 100));
                    const w = u.waiting_on ?? "";
                    const who = !w || /^(landlord|tenant|contractor)$/i.test(w) ? `the ${w.toLowerCase() || "other side"}` : w;
                    return (
                      <button key={u.id} className="up" onClick={() => onOpen(u.ticket_id)}>
                        <span className="ut">I'll chase {who} for {(u.address ?? u.title).split(",").slice(0, /^flat/i.test(u.address ?? "") ? 2 : 1).join(",")} <b>{until(u.follow_up_at)}</b></span>
                        <span className="bar"><span style={{ width: `${pct}%` }} /></span>
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
