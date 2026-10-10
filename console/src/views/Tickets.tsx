import { useEffect, useMemo, useState } from "react";
import { label } from "../api.ts";
import type { Detail, TicketRow } from "../api.ts";
import { DonnaMark, Kbd, Pill } from "../components/index.ts";
import type { Notify } from "../components/index.ts";
import Ticket from "./Ticket.tsx";
import DonnaPanel from "./Donna.tsx";

type Filter = "all" | "human" | "approval" | "hold";

export default function Tickets({ tickets, sel, setSel, detail, railOpen, onChange, toast }: {
  tickets: TicketRow[]; sel: number | null; setSel: (id: number) => void; detail: Detail | null; railOpen: boolean; onChange: () => void; toast: Notify;
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

  return (
    <div className="body">
      <div className="list-col">
        <div className="list-tools">
          <input id="ticket-search" className="input" placeholder="Search tickets   ( / )" value={q} onChange={(e) => setQ(e.target.value)} />
          <div className="seg">
            {([["all", "All"], ["human", "Human"], ["approval", "Approval"], ["hold", "On hold"]] as const).map(([k, l]) => (
              <button key={k} className={filter === k ? "on" : ""} onClick={() => setFilter(k)}>{l}</button>
            ))}
          </div>
        </div>
        <div className="list">
          {shown.map((t) => {
            const flag: [any, string] | null = t.open_escalations > 0 ? ["bad", "Needs human"] : t.pending_approvals > 0 ? ["warn", "Approval"] : t.status !== "open" ? ["warn", label(t.status)] : t.queued_outbox > 0 ? ["accent", `${t.queued_outbox} queued`] : null;
            return (
              <div key={t.id} className={`row-item ${sel === t.id ? "on" : ""}`} onClick={() => setSel(t.id)}>
                <div className="t">{t.title}</div>
                <div className="a">{t.address ?? "No address"}</div>
                <div className="chips">
                  <Pill>{label(t.stage)}</Pill>
                  {flag && <Pill tone={flag[0]}>{flag[1]}</Pill>}
                </div>
              </div>
            );
          })}
          {shown.length === 0 && <div className="empty">No tickets match.</div>}
        </div>
      </div>
      <div className="case-col">
        {detail ? <Ticket key={detail.ticket.id} d={detail} onChange={onChange} toast={toast} /> : (
          <div className="empty big"><DonnaMark size={40} /><div className="eh">Pick a ticket and Donna will tell you what to do next.</div><div className="small" style={{ marginTop: 6 }}><Kbd>j</Kbd> <Kbd>k</Kbd> to move, <Kbd>/</Kbd> to search</div></div>
        )}
      </div>
      {railOpen && <DonnaPanel d={detail} onChange={onChange} toast={toast} />}
    </div>
  );
}
