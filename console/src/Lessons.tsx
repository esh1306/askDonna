import { useCallback, useEffect, useState } from "react";
import { api } from "./api.ts";
import type { Lesson } from "./api.ts";

export default function Lessons({ onCount }: { onCount: (n: number) => void }) {
  const [rows, setRows] = useState<Lesson[]>([]);
  const [q, setQ] = useState("");
  const [source, setSource] = useState("");
  const [err, setErr] = useState("");

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
            <h1>Lessons</h1>
            <p>What Donna has learned from your team. Upvote what works, downvote what does not; weight decides what she recalls first.</p>
          </div>
          <input className="input" style={{ width: 260 }} placeholder="Search lessons" value={q} onChange={(e) => setQ(e.target.value)} />
          <div className="seg" style={{ width: 260 }}>
            {([["", "All"], ["dataset", "Dataset"], ["human", "Human"], ["feedback", "Feedback"]] as const).map(([k, l]) => (
              <button key={k} className={source === k ? "on" : ""} onClick={() => setSource(k)}>{l}</button>
            ))}
          </div>
        </div>
        {err && <div className="err small" style={{ marginBottom: 10 }}>{err}</div>}
        <div className="tablewrap">
          <table className="lessons">
            <thead>
              <tr><th style={{ width: 34 }}>#</th><th style={{ width: "24%" }}>Situation</th><th style={{ width: "26%" }}>Action</th><th>Rationale</th><th>Source</th><th className="num">Weight</th><th className="num">Uses</th><th /></tr>
            </thead>
            <tbody>
              {rows.map((l) => (
                <tr key={l.id}>
                  <td className="mono muted">{l.id}</td>
                  <td>
                    <div className="clamp" title={l.situation}>{l.situation}</div>
                    <div className="chiprow" style={{ marginTop: 4 }}>
                      {[l.stage, l.trigger, l.category].filter(Boolean).map((x) => <span className="chan" key={x}>{x}</span>)}
                    </div>
                  </td>
                  <td className="act"><div className="clamp" title={l.action}>{l.action}</div></td>
                  <td className="muted"><div className="clamp" title={l.rationale}>{l.rationale}</div></td>
                  <td>
                    <span className={`src ${l.source}`}>{l.source}</span>
                    {l.source_ref && <div className="mono muted" style={{ marginTop: 3 }}>{l.source_ref}</div>}
                  </td>
                  <td className="num">{l.weight}</td>
                  <td className="num">{l.uses}</td>
                  <td>
                    <span className="vote">
                      <button aria-label="Upvote" onClick={() => vote(l.id, 1)}>▲</button>
                      <button aria-label="Downvote" onClick={() => vote(l.id, -1)}>▼</button>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && !err && <div className="empty">No lessons match. Human actions on tickets create new ones.</div>}
        </div>
      </div>
    </div>
  );
}
