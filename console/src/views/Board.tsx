import { useEffect, useMemo, useState } from "react";
import { ago, label } from "../api.ts";
import type { Detail, TicketRow } from "../api.ts";
import { DonnaMark, Kbd } from "../components/index.ts";
import type { Notify } from "../components/index.ts";
import Ticket from "./Ticket.tsx";
import "../board.css";

type Filter = "all" | "needs" | "waiting" | "auto";
const COLS: [string, string][] = [
  ["intake", "Intake"], ["landlord_approval", "Landlord approval"], ["provider_selection", "Provider selection"],
  ["scheduling", "Scheduling"], ["works", "Works"], ["closeout", "Close-out"], ["closed", "Closed"],
];

const kind = (t: TicketRow): "needs" | "waiting" | "auto" => (t.open_escalations > 0 ? "needs" : t.pending_approvals > 0 || t.status === "on_hold" ? "waiting" : "auto");
const chip = (t: TicketRow): [string, string] => (t.open_escalations > 0 ? ["bad", "Needs your judgement"] : t.pending_approvals > 0 ? ["warn", "Donna asked landlord"] : t.status === "on_hold" ? ["warn", "Donna will chase"] : ["good", "Autonomous"]);

export default function Board({ tickets, sel, setSel, detail, onChange, toast }: {
  tickets: TicketRow[]; sel: number | null; setSel: (id: number | null) => void; detail: Detail | null; onChange: () => void; toast: Notify;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const [showClosed, setShowClosed] = useState(false);
  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    return tickets.filter((t) => (filter === "all" || kind(t) === filter) && (!s || `${t.title} ${t.address} ${t.case_ref} ${t.category}`.toLowerCase().includes(s)));
  }, [tickets, filter, q]);
  const colOf = (t: TicketRow) => (t.status === "closed" ? "closed" : t.stage === "paused" ? "intake" : t.stage);
  const order = useMemo(() => COLS.flatMap(([k]) => (k === "closed" && !showClosed ? [] : shown.filter((t) => colOf(t) === k))), [shown, showClosed]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (e.key === "Escape" && sel != null) { setSel(null); return; }
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || e.metaKey || e.ctrlKey) return;
      if (e.key === "/") { e.preventDefault(); document.getElementById("ticket-search")?.focus(); }
      if ((e.key === "j" || e.key === "k") && sel != null) {
        const i = order.findIndex((t) => t.id === sel);
        const n = order[Math.max(0, Math.min(order.length - 1, i + (e.key === "j" ? 1 : -1)))];
        if (n) setSel(n.id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [order, sel, setSel]);

  const live = tickets.filter((t) => t.status !== "closed");
  const cnt = (f: Filter) => (f === "all" ? live.length : live.filter((t) => kind(t) === f).length);
  const idx = order.findIndex((t) => t.id === sel);
  const step = (d: number) => { const n = order[idx + d]; if (n) setSel(n.id); };

  return (
    <div className="board-wrap">
      <div className="board-tools">
        <input id="ticket-search" className="input" placeholder="Search tickets   ( / )" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="seg">
          {([["all", "All"], ["needs", "Needs me"], ["waiting", "Waiting"], ["auto", "Autonomous"]] as const).map(([k, l]) => (
            <button key={k} className={filter === k ? "on" : ""} onClick={() => setFilter(k)}>{l} <span className="faint">{cnt(k)}</span></button>
          ))}
        </div>
      </div>
      <div className="board">
        {COLS.map(([k, name]) => {
          const items = shown.filter((t) => colOf(t) === k);
          if (k === "closed" && !showClosed) return (
            <button key={k} className="bcol bcol-closed" onClick={() => setShowClosed(true)} title="Show closed tickets">
              <span className="bcol-n">{items.length}</span><span className="bcol-v">{name}</span>
            </button>
          );
          return (
            <div key={k} className="bcol">
              <div className="bcol-h"><span>{name}</span><span className="bcol-n">{items.length}</span>{k === "closed" && <button className="link" onClick={() => setShowClosed(false)}>Collapse</button>}</div>
              <div className="bcol-b">
                {items.map((t) => {
                  const c = chip(t);
                  return (
                    <div key={t.id} className={`bcard ${kind(t)} ${sel === t.id ? "on" : ""}`} onClick={() => setSel(t.id)} tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter") setSel(t.id); }}>
                      <div className="bt clamp2">{t.title}</div>
                      <div className="ba">{t.address ?? "No address"}</div>
                      <div className="bf"><span className={`bchip ${c[0]}`}>{c[1]}</span>{t.updated_at && <span className="bago">{ago(t.updated_at.includes("T") ? t.updated_at : t.updated_at.replace(" ", "T") + "Z")}</span>}</div>
                    </div>
                  );
                })}
                {items.length === 0 && <div className="bempty">None</div>}
              </div>
            </div>
          );
        })}
      </div>
      {sel != null && (
        <>
          <div className="tdrawer-scrim" onClick={() => setSel(null)} />
          <aside className="tdrawer" role="dialog" aria-label="Ticket">
            <div className="tdrawer-bar">
              <button className="btn small" onClick={() => step(-1)} disabled={idx <= 0}>Prev <Kbd>k</Kbd></button>
              <button className="btn small" onClick={() => step(1)} disabled={idx < 0 || idx >= order.length - 1}>Next <Kbd>j</Kbd></button>
              <div className="grow" />
              <button className="btn small" onClick={() => setSel(null)}>Close <Kbd>Esc</Kbd></button>
            </div>
            <div className="tdrawer-body">
              {detail ? <Ticket key={detail.ticket.id} d={detail} onChange={onChange} toast={toast} /> : <div className="empty big"><DonnaMark size={40} /><div className="eh">Loading…</div></div>}
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
