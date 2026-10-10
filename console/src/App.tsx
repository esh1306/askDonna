import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "./api.ts";
import type { Detail, TicketRow } from "./api.ts";
import { Button, DonnaMark, EntityHost, useToaster } from "./components/index.ts";
import Lessons from "./views/Lessons.tsx";
import Queue from "./views/Queue.tsx";
import Tickets from "./views/Tickets.tsx";
import Demo from "./views/Demo.tsx";

export default function App() {
  const [tab, setTab] = useState<"tickets" | "queue" | "lessons">("tickets");
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [queue, setQueue] = useState<any[]>([]);
  const [lessonCount, setLessonCount] = useState<number | null>(null);
  const [bump, setBump] = useState(0);
  const [sel, setSel] = useState<number | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError] = useState("");
  const [railOpen, setRailOpen] = useState(() => window.innerWidth >= 1280);
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

  useEffect(() => { loadList(); }, [loadList]);
  useEffect(() => { loadDetail(sel); }, [sel, loadDetail]);

  // Hidden demo shortcut: Shift+I logs an inbound message.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.shiftKey && e.key === "I") { e.preventDefault(); setDemo(true); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const openTicket = useCallback((id: number) => { setSel(id); setTab("tickets"); }, []);
  const count = (n: number | null | undefined, k?: number) => (n ? <span key={k} className={`n ${k ? "bump" : ""}`}>{n}</span> : null);

  return (
    <EntityHost tickets={tickets} openTicket={openTicket}>
      <div className="shell">
        <div className="top">
          <div className="brand"><DonnaMark size={24} />Donna <span>operations</span></div>
          <div className="tracks">
            <button className={`track ${tab === "tickets" ? "on" : ""}`} onClick={() => setTab("tickets")}>Tickets{count(tickets.length)}</button>
            <button className={`track ${tab === "queue" ? "on" : ""}`} onClick={() => setTab("queue")}>Human queue{queue.length > 0 && <span className="n alert">{queue.length}</span>}</button>
            <button ref={lessonsTab} className={`track ${tab === "lessons" ? "on" : ""}`} onClick={() => setTab("lessons")}>Lessons{count(lessonCount, bump)}</button>
          </div>
          {tab === "tickets" && <Button size="sm" variant="ghost" onClick={() => setRailOpen(!railOpen)} title="Toggle Donna panel">{railOpen ? "Hide Donna" : "Show Donna"}</Button>}
          <Button size="sm" onClick={refresh}>Refresh</Button>
        </div>
        {error && <div className="banner" onClick={() => setError("")}>{error}</div>}
        {tab === "lessons" ? (
          <Lessons onCount={setLessonCount} />
        ) : tab === "queue" ? (
          <Queue queue={queue} onOpen={openTicket} onResolved={refresh} toast={notify} />
        ) : (
          <Tickets tickets={tickets} sel={sel} setSel={setSel} detail={detail} railOpen={railOpen} onChange={refresh} toast={notify} />
        )}
        {toastNode}
        <Demo open={demo} onClose={() => setDemo(false)} tickets={tickets} current={sel} onDone={refresh} toast={notify} />
      </div>
    </EntityHost>
  );
}
