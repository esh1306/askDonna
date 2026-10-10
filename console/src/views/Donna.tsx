import { useCallback, useEffect, useRef, useState } from "react";
import { api, label, when } from "../api.ts";
import type { Detail } from "../api.ts";
import { Card, Chev, DonnaMark, Pill, Reveal, Button } from "../components/index.ts";
import type { Notify } from "../components/index.ts";

function List({ title, items }: { title: string; items?: string[] }) {
  if (!items?.length) return null;
  return <div className="small"><b>{title}</b><ul>{items.map((x, i) => <li key={i}>{x}</li>)}</ul></div>;
}

function ResultView({ r }: { r: any }) {
  return (
    <div className="result">
      {r.summary && <p className="small" style={{ margin: 0 }}>{r.summary}</p>}
      {r.actions_taken?.length > 0 && (
        <table className="tbl small">
          <thead><tr><th>Tool</th><th>What</th><th>Ok</th></tr></thead>
          <tbody>{r.actions_taken.map((a: any, i: number) => (
            <tr key={i}><td>{a.tool}</td><td>{a.description}<div className="muted">{a.result}</div></td><td>{a.ok ? "Yes" : <span className="err">No</span>}</td></tr>
          ))}</tbody>
        </table>
      )}
      {r.escalation?.needed && (
        <div className="box should small"><b>Escalated</b>{r.escalation.reason}<div>{r.escalation.handover_summary}</div><div><i>{r.escalation.recommendation}</i></div></div>
      )}
      <List title="Unverified" items={r.unverified} />
      <List title="Failures" items={r.failures} />
      <List title="Risks" items={r.risks_or_red_flags} />
      <div className="small muted">Final status: {r.final_status}{r.next_follow_up ? ` · Next: ${r.next_follow_up.what} (${r.next_follow_up.when})` : ""}</div>
    </div>
  );
}


type Turn = { q: string; a: string };
const histKey = (id: number) => `donna.hist.${id}`;
const loadHist = (id: number): Turn[] => { try { return JSON.parse(localStorage.getItem(histKey(id)) || "[]"); } catch { return []; } };
const saveHist = (id: number, h: Turn[]) => { try { localStorage.setItem(histKey(id), JSON.stringify(h.slice(-5))); } catch {} };
const short = (t: string, n = 40) => (t.length > n ? t.slice(0, n - 1) + "…" : t);

/** Floating Donna: context-aware (open case, or "Today"). */
export default function DonnaHub({ d, queue, onOpen, onChange, toast, onRan }: { d: Detail | null; queue: any[]; onOpen: (id: number) => void; onChange: () => void; toast: Notify; onRan: (ticketId: number) => void }) {
  const [open, setOpen] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [err, setErr] = useState("");
  const [fresh, setFresh] = useState<{ id: number; run: any } | null>(null);
  const [why, setWhy] = useState(false);
  const [text, setText] = useState("");
  const [hist, setHist] = useState<Turn[]>([]);
  const [, force] = useState(0);
  const seen = useRef(new Map<number, string>());
  const id = d?.ticket.id ?? null;
  const busy = busyId != null && busyId === id;
  const idRef = useRef(id); idRef.current = id;
  useEffect(() => { setErr(""); setWhy(false); setText(""); setHist(id != null ? loadHist(id) : []); setFresh((f) => (f && f.id === id ? f : null)); }, [id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return setOpen(false);
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === ".") { e.preventDefault(); setOpen(true); setTimeout(() => document.getElementById("ask-donna")?.focus(), 60); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const latest = (fresh && fresh.id === id ? fresh.run : null) ?? (d && d.runs.length ? d.runs[d.runs.length - 1] : null);
  const result = latest?.result;
  if (id != null && !seen.current.has(id)) seen.current.set(id, latest?.ts ?? "");
  const unseen = id != null && !!latest?.ts && seen.current.get(id) !== latest.ts;
  useEffect(() => { if (open && id != null && latest?.ts) { seen.current.set(id, latest.ts); force((n) => n + 1); } }, [open, id, latest?.ts]);

  const go = useCallback(async (tid: number, path: string, body: any, q?: string) => {
    setBusyId(tid); setErr("");
    try {
      const out: any = await api(path, { method: "POST", body });
      if (idRef.current === tid) setFresh({ id: tid, run: out });
      const line = out?.result?.summary || (out?.result?.decision ? label(out.result.decision) : "Run complete");
      if (q) { const h = [...loadHist(tid), { q, a: short(line, 140) }].slice(-5); saveHist(tid, h); if (idRef.current === tid) setHist(h); }
      toast("Donna finished: " + (out?.result?.decision ? label(out.result.decision) : "run complete"));
      onRan(tid);
    } catch (e) { if (idRef.current === tid) setErr((e as Error).message); }
    setBusyId(null);
    onChange();
  }, [onChange, onRan, toast]);
  const ask = (t: string) => { const v = t.trim(); if (!v || busyId != null || id == null) return; setText(""); go(id, `/api/tickets/${id}/ask`, { text: v }, v); };

  const top = queue.slice(0, 3);
  const sugs: string[] = [];
  if (d) {
    if (d.approvals.some((a) => a.status === "pending")) sugs.push("Call the landlord now");
    const hold = d.open_holds[0];
    if (hold) sugs.push(`Chase ${hold.waiting_on || "them"} now`);
    if (queue.some((q) => q.ticket_id === d.ticket.id)) sugs.push("Summarise what I need to decide");
    sugs.push("What happened here?");
  }
  const working = busyId != null;
  const pulse = (busy || unseen) && !open;

  return (
    <div className="hub">
      {open && (
        <div className="hub-panel" role="dialog" aria-label="Donna">
          <div className={`hub-head ${busy ? "working" : ""}`}>
            <DonnaMark size={30} className={busy ? "pulse" : ""} />
            <div className="grow"><b>Donna</b><div className="muted small">{busy ? "Working…" : working ? "Busy on another case" : "Ready"}</div></div>
            <button className="icon-btn" onClick={() => setOpen(false)} title="Close (Esc)" aria-label="Close">×</button>
          </div>
          <div className="hub-ctx"><span className="mono">{d ? "This case" : "Today"}</span>{d ? <b>{short(d.ticket.title, 44)}</b> : <b>{queue.length} need{queue.length === 1 ? "s" : ""} your judgement</b>}</div>
          {busy && <div className="shimmer" role="status" aria-label="Donna is working"><i /><span className="small muted">This can take up to a minute. You can keep browsing.</span></div>}
          {err && <div className="err small">{err}</div>}
          <div className="hub-body">
            {d ? (
              <>
                {hist.length > 0 && <div className="hub-thread">{hist.map((t, i) => <div key={i}><div className="me small">{t.q}</div><div className="her small">{t.a}</div></div>)}</div>}
                <div className="small muted" style={{ marginBottom: 6 }}>Latest decision {latest?.ts && <span className="when">{when(latest.ts)}</span>}</div>
                {!latest && <div className="muted small">No runs yet. Ask Donna below, or <button className="link" disabled={working} onClick={() => go(d.ticket.id, `/api/tickets/${d.ticket.id}/run`, {})}>let her review the ticket</button>.</div>}
                {latest?.error && <div className="err small">{latest.error}</div>}
                {result ? (
                  <>
                    <div className="decision">
                      <Pill tone={result.decision === "escalate" ? "bad" : "good"}>{label(result.decision)}</Pill>
                      <span className="run-line small">{result.summary}</span>
                    </div>
                    <button className="link" style={{ marginTop: 6 }} onClick={() => setWhy(!why)}><Chev open={why} /> Why?</button>
                    <Reveal open={why}><div className="hub-why"><ResultView r={result} /></div></Reveal>
                  </>
                ) : latest && !latest.error && <div className="pre small clamp2">{latest.finalText}</div>}
              </>
            ) : (
              <>
                <div className="small muted" style={{ marginBottom: 6 }}>Needs your judgement</div>
                {top.length === 0 && <div className="muted small">Nothing needs you right now.</div>}
                {top.map((q) => <button key={q.id} className="hub-open" onClick={() => onOpen(q.ticket_id)}><span className="mono">Open</span> {short(q.title, 60)}</button>)}
              </>
            )}
          </div>
          <div className="hub-ask">
            <div className="chips-row">
              {d ? sugs.map((s) => <button key={s} className="sug" disabled={working} onClick={() => ask(s)}>{s}</button>)
                : top.map((q) => <button key={q.id} className="sug" onClick={() => onOpen(q.ticket_id)}>{short(q.title, 28)}</button>)}
            </div>
            <form onSubmit={(e) => { e.preventDefault(); ask(text); }}>
              <input id="ask-donna" className="input" placeholder={d ? "Ask Donna…" : "Open a case to ask Donna to act on it"} value={text} disabled={working || !d} onChange={(e) => setText(e.target.value)} autoComplete="off" />
              <Button variant="accent" type="submit" disabled={working || !d || !text.trim()}>Send</Button>
            </form>
          </div>
        </div>
      )}
      <button className={`hub-fab ${open ? "open" : ""}`} onClick={() => { setOpen(!open); setTimeout(() => document.getElementById("ask-donna")?.focus(), 60); }} title="Donna  ( . )" aria-label="Open Donna">
        <DonnaMark size={34} className={busy ? "pulse" : ""} />
        {pulse && <span className="hub-dot" />}
      </button>
    </div>
  );
}
