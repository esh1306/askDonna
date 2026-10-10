import { useCallback, useEffect, useState } from "react";
import { api } from "../api.ts";
import type { Lesson } from "../api.ts";
import { Card, Chev, EmptyState, Pill } from "../components/index.ts";
import { DonnaMark } from "../Brand.tsx";


export default function Lessons({ onCount }: { onCount: (n: number) => void }) {
  const [rows, setRows] = useState<Lesson[]>([]);
  const [q, setQ] = useState("");
  const [source, setSource] = useState("");
  const [err, setErr] = useState("");
  const [open, setOpen] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const qs = new URLSearchParams();
      if (q.trim()) qs.set("q", q.trim());
      if (source) qs.set("source", source);
      const r = await api<Lesson[]>(`/api/lessons?${qs}`);
      setRows(r);
      setErr("");
      if (!q.trim() && !source) onCount(r.length);
    } catch (e) {
      setErr((e as Error).message);
    }
  }, [q, source, onCount]);
  useEffect(() => {
    const t = setTimeout(load, 180);
    return () => clearTimeout(t);
  }, [load]);

  async function vote(id: number, delta: 1 | -1) {
    try {
      const l = await api<Lesson>(`/api/lessons/${id}/vote`, { method: "POST", body: { delta } });
      setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...l } : r)));
    } catch (e) {
      setErr((e as Error).message);
    }
  }

  return (
    <div className="page">
      <div className="page-inner">
        <div className="page-head">
          <div className="grow">
            <h1><DonnaMark size={28} /> Lessons</h1>
            <p>What I have learned from your team. Upvote what works, downvote what does not; weight decides what I recall first.</p>
          </div>
          <input className="input" style={{ width: 240 }} placeholder="Search lessons" value={q} onChange={(e) => setQ(e.target.value)} />
          <div className="seg" style={{ width: 260 }}>
            {([["", "All"], ["dataset", "Dataset"], ["human", "Human"], ["feedback", "Feedback"]] as const).map(([k, l]) => (
              <button key={k} className={source === k ? "on" : ""} onClick={() => setSource(k)}>{l}</button>
            ))}
          </div>
        </div>
        {err && <div className="err small" style={{ marginBottom: 10 }}>{err}</div>}
        <Card className="list-card lessons">
          {rows.map((l) => {
            const o = open === l.id;
            const fresh = Date.now() - new Date(l.created_at).getTime() < 120000;
            return (
              <div key={l.id} className={`lrow ${o ? "open" : ""} ${fresh ? "fresh" : ""}`}>
                <div className="lmain" onClick={() => setOpen(o ? null : l.id)}>
                  <Chev open={o} />
                  <div className="ltext">
                    <div className="l-sit" title={l.situation}>{l.situation}</div>
                    <div className="l-act" title={l.action}><span className="arrow">then</span> {l.action}</div>
                  </div>
                  <span className={`src ${l.source}`}>{l.source}</span>
                  <span className="wt" title="Weight">{l.weight}</span>
                  <span className="vote" onClick={(e) => e.stopPropagation()}>
                    <button aria-label="Upvote" onClick={() => vote(l.id, 1)}>▲</button>
                    <button aria-label="Downvote" onClick={() => vote(l.id, -1)}>▼</button>
                  </span>
                </div>
                <div className={`reveal ${o ? "open" : ""}`}><div><div className="reveal-in">
                  <div className="l-more">
                    <div><span className="s-k">Rationale</span>{l.rationale}</div>
                    <div className="chiprow">
                      {[l.stage, l.trigger, l.category].filter(Boolean).map((x) => <span className="chan" key={x}>{x}</span>)}
                      <span className="muted small">#{l.id} · used {l.uses}×{l.source_ref ? ` · ${l.source_ref}` : ""}</span>
                    </div>
                  </div>
                </div></div></div>
              </div>
            );
          })}
          {rows.length === 0 && !err && <EmptyState title="Nothing learned here yet." hint="Every action you take on a ticket teaches me something." />}
        </Card>
      </div>
    </div>
  );
}
