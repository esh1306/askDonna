import { useState } from "react";
import { api, label } from "../api.ts";
import type { TicketRow } from "../api.ts";
import { Button, Modal } from "../components/index.ts";
import type { Notify } from "../components/index.ts";

/** Hidden demo affordance (Shift+I or ?demo=1): log an inbound message and let Donna react. */
export default function Demo({ open, onClose, tickets, current, onDone, toast }: { open: boolean; onClose: () => void; tickets: TicketRow[]; current: number | null; onDone: () => void; toast: Notify }) {
  const [tid, setTid] = useState<number | null>(null);
  const [from, setFrom] = useState("tenant");
  const [channel, setChannel] = useState("email");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const id = tid ?? current ?? tickets[0]?.id ?? null;

  async function send() {
    if (id == null) return;
    setBusy(true); setErr("");
    try {
      const out = await api(`/api/tickets/${id}/inbound`, { method: "POST", body: { from, channel, body } });
      toast("Donna finished: " + (out?.result?.decision ? label(out.result.decision) : "run complete"));
      setBody(""); onClose(); onDone();
    } catch (e) { setErr((e as Error).message); }
    setBusy(false);
  }
  return (
    <Modal open={open} onClose={onClose} title="Log an inbound message">
      <div className="form">
        <select className="input" value={id ?? ""} onChange={(e) => setTid(Number(e.target.value))}>
          {tickets.map((t) => <option key={t.id} value={t.id}>{t.case_ref} · {t.title.slice(0, 60)}</option>)}
        </select>
        <div className="row">
          <select className="input" value={from} onChange={(e) => setFrom(e.target.value)}><option value="tenant">From tenant</option><option value="landlord">From landlord</option><option value="contractor">From contractor</option></select>
          <select className="input" value={channel} onChange={(e) => setChannel(e.target.value)}><option value="email">Email</option><option value="sms">SMS</option><option value="call">Call</option></select>
        </div>
        <textarea className="input" rows={4} autoFocus placeholder="What did they say?" value={body} onChange={(e) => setBody(e.target.value)} />
        {err && <div className="err small">{err}</div>}
        <div className="row" style={{ justifyContent: "flex-end" }}>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={busy || !body.trim()} onClick={send}>{busy ? "Donna is reading…" : "Send to Donna"}</Button>
        </div>
      </div>
    </Modal>
  );
}
