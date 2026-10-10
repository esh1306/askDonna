import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "./api.ts";
import type { Detail, TicketRow } from "./api.ts";
import { Button, DonnaMark, EntityHost, useToaster } from "./components/index.ts";
import Home from "./views/Home.tsx";
import Lessons from "./views/Lessons.tsx";
import Queue from "./views/Queue.tsx";
import Tickets from "./views/Tickets.tsx";
import Demo from "./views/Demo.tsx";
import DonnaHub from "./views/Donna.tsx";
import AutoCall from "./AutoCall.tsx";

export default function App() {
  const [tab, setTab] = useState<"home" | "tickets" | "queue" | "lessons">(() => (new URLSearchParams(location.search).get("view") === "lessons" ? "lessons" : "home"));
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [queue, setQueue] = useState<any[]>([]);
  const [lessonCount, setLessonCount] = useState<number | null>(null);
  const [bump, setBump] = useState(0);
  const [sel, setSel] = useState<number | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError] = useState("");
  const [collapsed, setCollapsed] = useState(() => { try { return localStorage.getItem("donna.sidebar") === "1"; } catch { return false; } });
  const [armed, setArmed] = useState<number | null>(null);
  const toggleSide = useCallback(() => setCollapsed((c) => { try { localStorage.setItem("donna.sidebar", c ? "0" : "1"); } catch {} return !c; }), []);
  const [demo, setDemo] = useState(() => new URLSearchParams(location.search).get("demo") === "1");
  const lessonsTab = useRef<HTMLButtonElement>(null);

  const onLearned = useCallback(() => { setBump((b) => b + 1); setLessonCount((c) => (c ?? 0) + 1); }, []);
  const { notify, node: toastNode } = useToaster(lessonsTab, onLearned);

  const loadList = useCallback(async () => {
    try {
      setTickets(await api("/api/tickets"));
      setQueue(await api("/api/queue"));
      api<any[]>("/api/lessons").then((r) => setLessonCount(r.length)).catch(() => {});
    } catch (e) { setError((e as Error).message); }
  }, []);
  const loadDetail = useCallback(async (id: number | null) => {
    if (id == null) return setDetail(null);
    try { setDetail(await api(`/api/tickets/${id}`)); } catch (e) { setError((e as Error).message); }
  }, []);
  const refresh = useCallback(async () => { await loadList(); await loadDetail(sel); }, [loadList, loadDetail, sel]);

  useEffect(() => { loadList(); const t = setInterval(loadList, 15000); return () => clearInterval(t); }, [loadList]);
  useEffect(() => { loadDetail(sel); }, [sel, loadDetail]);

  // Hidden demo shortcut: Shift+I logs an inbound message.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "[" && !e.metaKey && !e.ctrlKey) { e.preventDefault(); toggleSide(); }
      if (e.shiftKey && e.key === "I") { e.preventDefault(); setDemo(true); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleSide]);

  const openTicket = useCallback((id: number) => { setSel(id); setTab("tickets"); }, []);
  const count = (n: number | null | undefined, k?: number) => (n ? <span key={k} className={`n ${k ? "bump" : ""}`}>{n}</span> : null);

  return (
    <EntityHost tickets={tickets} openTicket={openTicket}>
      <div className="shell">
        <div className="top">
          <button className={`icon-btn side-toggle ${collapsed ? "" : "on"}`} onClick={toggleSide} title="Toggle ticket list  ( [ )" aria-label="Toggle ticket list" aria-pressed={!collapsed}>
            <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true"><rect x="3" y="4" width="14" height="12" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.6" /><path d="M8 4.5v11" stroke="currentColor" strokeWidth="1.6" /><rect x="3.8" y="5" width="3.6" height="10" rx="1.5" fill="currentColor" opacity={collapsed ? 0 : 0.28} /></svg>
          </button>
          <div className="brand"><DonnaMark size={24} />Donna <span>operations</span></div>
          <div className="tracks">
            <button className={`track ${tab === "home" ? "on" : ""}`} onClick={() => setTab("home")}>Home</button>
            <button className={`track ${tab === "tickets" ? "on" : ""}`} onClick={() => setTab("tickets")}>Donna's work{count(tickets.length)}</button>
            <button className={`track ${tab === "queue" ? "on" : ""}`} onClick={() => setTab("queue")}>Needs you{queue.length > 0 && <span className="n alert">{queue.length}</span>}</button>
          </div>
          <Button size="sm" onClick={refresh}>Refresh</Button>
        </div>
        {error && <div className="banner" onClick={() => setError("")}>{error}</div>}
        {tab === "home" ? (
          <Home tickets={tickets} queue={queue} onOpen={openTicket} />
        ) : tab === "lessons" ? (
          <Lessons onCount={setLessonCount} />
        ) : tab === "queue" ? (
          <Queue queue={queue} onOpen={openTicket} onResolved={refresh} toast={notify} />
        ) : (
          <Tickets tickets={tickets} sel={sel} setSel={setSel} detail={detail} collapsed={collapsed} onChange={refresh} toast={notify} />
        )}
        {toastNode}
        <Demo open={demo} onClose={() => setDemo(false)} tickets={tickets} current={sel} onDone={() => { setArmed(sel); refresh(); }} toast={notify} />
        <DonnaHub d={tab === "tickets" || (sel != null && tab !== "home") ? detail : null} onChange={refresh} toast={notify} onRan={(id) => setArmed(id)} />
        <AutoCall d={detail} armed={armed} disarm={() => setArmed(null)} onChange={refresh} />
      </div>
    </EntityHost>
  );
}
