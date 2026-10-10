import { useState } from "react";
import { humanAction, label, STAGES } from "../api.ts";
import { Button } from "./Button.tsx";
import { Popover } from "./Popover.tsx";
import type { Notify } from "./Toast.tsx";

export type ActionKind = "note" | "assign" | "message" | "stage" | "resolve";
const META: Record<ActionKind, { text: string; icon: string }> = {
  note: { text: "Add note", icon: "note" },
  assign: { text: "Assign", icon: "user" },
  message: { text: "Message", icon: "mail" },
  stage: { text: "Move stage", icon: "stage" },
  resolve: { text: "Resolve", icon: "check" },
};

/** A trigger button that opens a small form popover for one human action. Learns from the optional "why". */
export function ActionButton({ kind, ticketId, stage, queueId, onDone, toast, variant = "secondary", size = "md", text }: {
  kind: ActionKind; ticketId: number; stage?: string; queueId?: number; onDone: (kind: ActionKind) => void; toast: Notify;
  variant?: "primary" | "secondary" | "ghost" | "accent"; size?: "sm" | "md"; text?: string;
}) {
  const m = META[kind];
  return (
    <Popover width={kind === "message" ? 360 : 330} trigger={({ toggle, open }) => (
      <Button data-learn-src variant={open ? "primary" : variant} size={size} icon={m.icon} onClick={toggle}>{text ?? m.text}</Button>
    )}>
      {(close) => <ActionForm kind={kind} ticketId={ticketId} stage={stage} queueId={queueId} toast={toast} onDone={() => { close(); onDone(kind); }} />}
    </Popover>
  );
}

function ActionForm({ kind, ticketId, stage, queueId, toast, onDone }: { kind: ActionKind; ticketId: number; stage?: string; queueId?: number; toast: Notify; onDone: () => void }) {
  const [f, setF] = useState<Record<string, string>>({ to: "tenant", channel: "email" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.value });
  const later = STAGES.slice(Math.max(0, STAGES.indexOf((stage ?? "") as any) + 1));
  const stageTo = f.stage || later[0] || "";
  const why = <label>Why? Donna learns from this<input className="input" value={f.note ?? ""} onChange={set("note")} placeholder="Optional, in your own words" /></label>;

  const spec: Record<ActionKind, { ok: boolean; go: () => Promise<void>; cta: string }> = {
    note: { ok: !!(f.text ?? "").trim(), cta: "Add note", go: () => humanAction(ticketId, "note", { text: f.text }, f.text, toast) },
    assign: { ok: !!(f.name ?? "").trim(), cta: "Assign contractor", go: () => humanAction(ticketId, "assign_contractor", { name: f.name, company: f.company }, f.note, toast) },
    message: { ok: !!(f.body ?? "").trim(), cta: "Queue message", go: () => humanAction(ticketId, "send_message", { to: f.to, channel: f.channel, subject: f.subject, body: f.body }, f.note, toast) },
    stage: { ok: !!stageTo, cta: "Move stage", go: () => humanAction(ticketId, "move_stage", { to: stageTo, reason: f.reason }, f.reason, toast) },
    resolve: { ok: true, cta: "Resolve", go: () => humanAction(ticketId, "resolve_escalation", { queue_id: queueId, resolution: f.note ?? "" }, f.note, toast) },
  };
  const s = spec[kind];

  return (
    <div className="form pop-form" onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && s.ok && !busy) e.currentTarget.querySelector<HTMLButtonElement>("button.primary")?.click(); }}>
      {kind === "note" && <textarea className="input" rows={3} autoFocus placeholder="Add an internal note" value={f.text ?? ""} onChange={set("text")} />}
      {kind === "assign" && <><input className="input" autoFocus placeholder="Contractor name" value={f.name ?? ""} onChange={set("name")} /><input className="input" placeholder="Company (optional)" value={f.company ?? ""} onChange={set("company")} />{why}</>}
      {kind === "message" && (
        <>
          <div className="row">
            <select className="input" value={f.to} onChange={set("to")}><option value="tenant">To tenant</option><option value="landlord">To landlord</option><option value="contractor">To contractor</option></select>
            <select className="input" value={f.channel} onChange={set("channel")}><option value="email">Email</option><option value="sms">SMS</option></select>
          </div>
          <input className="input" placeholder="Subject" value={f.subject ?? ""} onChange={set("subject")} />
          <textarea className="input" rows={4} autoFocus placeholder="Message" value={f.body ?? ""} onChange={set("body")} />
          {why}
        </>
      )}
      {kind === "stage" && (
        <>
          <select className="input" value={stageTo} onChange={set("stage")}>{later.map((x) => <option key={x} value={x}>{label(x)}</option>)}</select>
          <input className="input" placeholder="Reason (optional)" value={f.reason ?? ""} onChange={set("reason")} />
        </>
      )}
      {kind === "resolve" && <label>How did you resolve it? Donna learns from this<textarea className="input" rows={3} autoFocus value={f.note ?? ""} onChange={set("note")} placeholder="Optional, in your own words" /></label>}
      {err && <div className="err small">{err}</div>}
      <div className="row" style={{ justifyContent: "flex-end" }}>
        <Button variant="primary" size="sm" disabled={busy || !s.ok} onClick={async () => {
          setBusy(true); setErr("");
          try { await s.go(); onDone(); } catch (e) { setErr((e as Error).message); setBusy(false); }
        }}>{s.cta}</Button>
      </div>
    </div>
  );
}
