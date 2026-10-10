import { useEffect, useMemo, useState } from "react";
import { label } from "../api.ts";
import type { Detail, TicketRow } from "../api.ts";
import { DonnaMark, Kbd, Pill } from "../components/index.ts";
import type { Notify } from "../components/index.ts";
import Ticket from "./Ticket.tsx";

type Filter = "all" | "human" | "approval" | "hold";

export default function Tickets({ tickets, sel, setSel, detail, collapsed, onChange, toast }: {
  tickets: TicketRow[]; sel: number | null; setSel: (id: number) => void; detail: Detail | null; collapsed: boolean; onChange: () => void; toast: Notify;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    return tickets.filter((t) => {
      if (filter === "human" && !t.open_escalations) return false;
      if (filter === "approval" && !t.pending_approvals) return false;
      if (filter === "hold" && t.status !== "on_hold") return false;
      return !s || `${t.title} ${t.address} ${t.case_ref} ${t.category}`.toLowerCase().includes(s);
    });
  }, [tickets, filter, q]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || e.metaKey || e.ctrlKey) return;
      if (e.key === "/") { e.preventDefault(); document.getElementById("ticket-search")?.focus(); }
      if (e.key === "j" || e.key === "k") {
        const i = shown.findIndex((t) => t.id === sel);
        const n = shown[Math.max(0, Math.min(shown.length - 1, i + (e.key === "j" ? 1 : -1)))];
        if (n) setSel(n.id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shown, sel, setSel]);

  const live = tickets.filter((t) => t.status !== "closed");
  const needs = live.filter((t) => t.open_escalations > 0).length;
  const waiting = live.filter((t) => !t.open_escalations && (t.status === "on_hold" || t.pending_approvals > 0)).length;
  const handled = live.length - needs - waiting;
  const needsList = shown.filter((t) => t.open_escalations > 0);
  const restList = shown.filter((t) => !t.open_escalations);
  const card = (t: TicketRow) => {
    const flag: [any, string] | null = t.open_escalations > 0 ? ["bad", "Needs your judgement"] : t.pending_approvals > 0 ? ["warn", "Donna asked the landlord"] : t.status === "on_hold" ? ["warn", "Donna will chase"] : t.status !== "open" ? ["good", label(t.status)] : t.queued_outbox > 0 ? ["accent", "Donna is sending"] : null;
    return (
      <div key={t.id} className={`row-item ${sel === t.id ? "on" : ""} ${t.open_escalations ? "" : "calm"}`} onClick={() => setSel(t.id)}>
        <div className="t">{t.title}</div>
        <div className="a">{t.address ?? "No address"}</div>
        <div className="chips">
          <Pill>{label(t.stage)}</Pill>
          {flag && <Pill tone={flag[0]}>{flag[1]}</Pill>}
        </div>
      </div>
    );
  };
  return (
    <>
    <div className="today">
      <div className="today-t"><DonnaMark size={20} /><b>Today with Donna</b></div>
      <div className="stat good"><b>{handled}</b><span>Handled by Donna</span></div>
      <div className="stat warn"><b>{waiting}</b><span>Waiting on others, Donna will chase</span></div>
      <div className={`stat ${needs ? "bad" : ""}`}><b>{needs}</b><span>Needs your judgement</span></div>
    </div>
    <div className="body">
      <div className={`list-col ${collapsed ? "collapsed" : ""}`} aria-hidden={collapsed}>
        <div className="list-tools">
          <input id="ticket-search" className="input" placeholder="Search tickets   ( / )" value={q} onChange={(e) => setQ(e.target.value)} />
          <div className="seg">
            {([["all", "All"], ["human", "Needs me"], ["approval", "Asked"], ["hold", "Waiting"]] as const).map(([k, l]) => (
              <button key={k} className={filter === k ? "on" : ""} onClick={() => setFilter(k)}>{l}</button>
            ))}
          </div>
        </div>
        <div className="list">
          {needsList.length > 0 && <div className="grp">Needs your judgement</div>}
          {needsList.map(card)}
          {restList.length > 0 && <div className="grp">Donna is handling</div>}
          {restList.map(card)}
          {shown.length === 0 && <div className="empty">No tickets match.</div>}
        </div>
      </div>
      <div className="case-col">
        {detail ? <Ticket key={detail.ticket.id} d={detail} onChange={onChange} toast={toast} /> : (
          <div className="empty big"><DonnaMark size={40} /><div className="eh">Pick a ticket to see what Donna did and what she does next.</div><div className="small" style={{ marginTop: 6 }}><Kbd>j</Kbd> <Kbd>k</Kbd> to move, <Kbd>/</Kbd> to search</div></div>
        )}
      </div>
    </div>
    </>
  );
}
