import { useEffect, useRef, useState } from "react";
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

const SUGGEST = ["Call the landlord for approval", "Chase the contractor", "Summarise this case"];

/** Floating Donna: launcher bottom-right, compact panel with latest decision and an "Ask Donna" box. */
export default function DonnaHub({ d, onChange, toast, onRan }: { d: Detail | null; onChange: () => void; toast: Notify; onRan: (ticketId: number) => void }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [fresh, setFresh] = useState<any>(null);
  const [why, setWhy] = useState(false);
  const [text, setText] = useState("");
  const [, force] = useState(0);
  const seen = useRef(new Map<number, string>());
  const id = d?.ticket.id ?? null;
  useEffect(() => { setFresh(null); setErr(""); setWhy(false); setText(""); }, [id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return setOpen(false);
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "." && id != null) { e.preventDefault(); setOpen(true); setTimeout(() => document.getElementById("ask-donna")?.focus(), 60); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [id]);

  const latest = fresh ?? (d && d.runs.length ? d.runs[d.runs.length - 1] : null);
  const result = latest?.result;
  if (id != null && !seen.current.has(id)) seen.current.set(id, latest?.ts ?? "");
  const unseen = id != null && !!latest?.ts && seen.current.get(id) !== latest.ts;
  useEffect(() => { if (open && id != null && latest?.ts) { seen.current.set(id, latest.ts); force((n) => n + 1); } }, [open, id, latest?.ts]);

  if (!d || id == null) return null;

  async function go(path: string, body: any) {
    setBusy(true); setErr("");
    try {
      const out = await api(path, { method: "POST", body });
      setFresh(out);
      toast("Donna finished: " + (out?.result?.decision ? label(out.result.decision) : "run complete"));
      onRan(id!);
    } catch (e) { setErr((e as Error).message); }
    setBusy(false);
    onChange();
  }
  const ask = (t: string) => { const v = t.trim(); if (!v || busy) return; setText(""); go(`/api/tickets/${id}/ask`, { text: v }); };

  return (
    <div className="hub">
      {open && (
        <div className="hub-panel" role="dialog" aria-label="Donna">
          <div className={`hub-head ${busy ? "working" : ""}`}>
            <DonnaMark size={30} className={busy ? "pulse" : ""} />
            <div className="grow"><b>Donna</b><div className="muted small">{busy ? "Working…" : "Ready"} <span className="faint">· {d.ticket.case_ref}</span></div></div>
            <button className="icon-btn" onClick={() => setOpen(false)} title="Close (Esc)" aria-label="Close">×</button>
          </div>
          {busy && <div className="shimmer" role="status" aria-label="Donna is working"><i /><span className="small muted">This can take up to a minute. You can keep browsing.</span></div>}
          {err && <div className="err small">{err}</div>}
          <div className="hub-body">
            <div className="small muted" style={{ marginBottom: 6 }}>Latest decision {latest?.ts && <span className="when">{when(latest.ts)}</span>}</div>
            {!latest && <div className="muted small">No runs yet. Ask Donna below, or <button className="link" disabled={busy} onClick={() => go(`/api/tickets/${id}/run`, {})}>let her review the ticket</button>.</div>}
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
          </div>
          <div className="hub-ask">
            <div className="chips-row">{SUGGEST.map((s) => <button key={s} className="sug" disabled={busy} onClick={() => ask(s)}>{s}</button>)}</div>
            <form onSubmit={(e) => { e.preventDefault(); ask(text); }}>
              <input id="ask-donna" className="input" placeholder="Ask Donna…" value={text} disabled={busy} onChange={(e) => setText(e.target.value)} autoComplete="off" />
              <Button variant="accent" type="submit" disabled={busy || !text.trim()}>Send</Button>
            </form>
          </div>
        </div>
      )}
      <button className={`hub-fab ${open ? "open" : ""}`} onClick={() => { setOpen(!open); setTimeout(() => document.getElementById("ask-donna")?.focus(), 60); }} title="Donna  ( . )" aria-label="Open Donna">
        <DonnaMark size={34} className={busy ? "pulse" : ""} />
        {(busy || unseen) && !open && <span className="hub-dot" />}
      </button>
    </div>
  );
}
