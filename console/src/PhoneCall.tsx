import { useEffect, useState } from "react";
import { api } from "./api.ts";

type Call = { approval_id: number; ticket_id: number; conversation_id: string; status: string; decision?: string | null; max_amount_gbp?: number | null; conditions?: string | null; outcome?: string; finished?: boolean };

export default function PhoneCall({ ticketId, approvalId, onChange }: { ticketId: number; approvalId?: number; onChange: () => void }) {
  const [calls, setCalls] = useState<Call[]>([]);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    let prev = "";
    const load = async () => {
      try {
        const c = (await api<Call[]>("/api/calls")).filter((x) => x.ticket_id === ticketId);
        if (!alive) return;
        setCalls(c);
        const sig = c.map((x) => x.status + x.finished).join();
        if (prev && sig !== prev) onChange();
        prev = sig;
      } catch {}
    };
    load();
    const t = setInterval(load, 5000);
    return () => { alive = false; clearInterval(t); };
  }, [ticketId]);

  async function dial() {
    setErr(""); setBusy(true);
    try { await api(`/api/approvals/${approvalId}/phone-call`, { method: "POST", body: {} }); } catch (e) { setErr((e as Error).message); }
    setBusy(false);
  }
  const label = (c: Call) =>
    c.finished ? `done: ${c.outcome ?? c.decision ?? "no result"}` : c.status === "initiated" ? "ringing" : c.status === "in-progress" ? "in progress" : c.status;

  if (!approvalId && !calls.length) return null;
  return (
    <div className="panel secondary">
      <h3>Real phone call</h3>
      {approvalId != null && (
        <button className="btn" disabled={busy} onClick={dial}>Place real phone call</button>
      )}
      {err && <div className="err small">{err}</div>}
      {calls.map((c) => (
        <div className="small" key={c.conversation_id}>Call for approval {c.approval_id}: {label(c)}</div>
      ))}
    </div>
  );
}
