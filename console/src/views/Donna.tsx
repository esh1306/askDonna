import { useEffect, useState } from "react";
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

/** Right rail: just Donna. Status, Run, and her latest decision in one line. */
export default function DonnaPanel({ d, onChange, toast }: { d: Detail | null; onChange: () => void; toast: Notify }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [fresh, setFresh] = useState<any>(null);
  const [why, setWhy] = useState(false);
  useEffect(() => { setFresh(null); setErr(""); setWhy(false); }, [d?.ticket.id]);
  if (!d) return <aside className="rail"><div className="rail-head"><DonnaMark size={26} /><div><b>Donna</b><div className="muted small">Select a ticket to work with her.</div></div></div></aside>;

  const latest = fresh ?? (d.runs.length ? d.runs[d.runs.length - 1] : null);
  const result = latest?.result;

  async function run() {
    setBusy(true);
    setErr("");
    try {
      const out = await api(`/api/tickets/${d!.ticket.id}/run`, { method: "POST", body: {} });
      setFresh(out);
      toast("Donna finished: " + (out?.result?.decision ? label(out.result.decision) : "run complete"));
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
      onChange();
    }
  }

  return (
    <aside className="rail">
      <div className={`rail-head ${busy ? "working" : ""}`}>
        <DonnaMark size={30} className={busy ? "pulse" : ""} />
        <div className="grow"><b>Donna</b><div className="muted small">{busy ? "Working on it…" : "Ready"}</div></div>
        <Button variant="primary" disabled={busy} onClick={run}>Run Donna</Button>
      </div>
      {busy && <div className="shimmer" role="status" aria-label="Donna is working"><i /><span className="small muted">This can take up to a minute. You can keep browsing.</span></div>}
      {err && <div className="err small">{err}</div>}
      <Card className="rpanel">
        <div className="small muted" style={{ marginBottom: 6 }}>Latest decision {latest?.ts && <span className="when">{when(latest.ts)}</span>}</div>
        {!latest && <div className="muted small">No runs yet.</div>}
        {latest?.error && <div className="err small">{latest.error}</div>}
        {result ? (
          <>
            <div className="decision">
              <Pill tone={result.decision === "escalate" ? "bad" : "good"}>{label(result.decision)}</Pill>
              <span className="run-line small">{result.summary}</span>
            </div>
            <button className="link" style={{ marginTop: 8 }} onClick={() => setWhy(!why)}><Chev open={why} /> Why?</button>
            <Reveal open={why}><ResultView r={result} /></Reveal>
          </>
        ) : latest && !latest.error && <div className="pre small clamp2">{latest.finalText}</div>}
      </Card>
    </aside>
  );
}
