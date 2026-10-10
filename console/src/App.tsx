import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { api, label, STAGES, when } from "./api.ts";
import type { Detail, TicketRow, Fact, Lesson } from "./api.ts";
import Lessons from "./Lessons.tsx";
import CallPanel from "./CallPanel.tsx";
import PhoneCall from "./PhoneCall.tsx";

type Filter = "all" | "human" | "approval" | "hold";

export default function App() {
  const [tab, setTab] = useState<"tickets" | "queue" | "lessons">("tickets");
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [queue, setQueue] = useState<any[]>([]);
  const [lessonCount, setLessonCount] = useState<number | null>(null);
  const [sel, setSel] = useState<number | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const [error, setError] = useState("");
  const [toast, setToastMsg] = useState<{ lead: string; lesson?: string } | null>(null);

  const showToast = useCallback((lead: string, lesson?: string) => {
    setToastMsg({ lead, lesson });
    setTimeout(() => setToastMsg(null), 6000);
  }, []);

  const loadList = useCallback(async () => {
    try {
      setTickets(await api("/api/tickets"));
      setQueue(await api("/api/queue"));
      api<any[]>("/api/lessons").then((r) => setLessonCount(r.length)).catch(() => {});
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);
  const loadDetail = useCallback(async (id: number | null) => {
    if (id == null) return setDetail(null);
    try {
      setDetail(await api(`/api/tickets/${id}`));
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);
  const refresh = useCallback(async () => {
    await loadList();
    await loadDetail(sel);
  }, [loadList, loadDetail, sel]);

  useEffect(() => { loadList(); }, [loadList]);
  useEffect(() => { loadDetail(sel); }, [sel, loadDetail]);

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
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || tab !== "tickets") return;
      if (e.key === "/") { e.preventDefault(); document.getElementById("ticket-search")?.focus(); }
      if (e.key === "j" || e.key === "k") {
        const i = shown.findIndex((t) => t.id === sel);
        const n = shown[Math.max(0, Math.min(shown.length - 1, i + (e.key === "j" ? 1 : -1)))];
        if (n) setSel(n.id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shown, sel, tab]);

  const count = (n: number | null | undefined) => (n ? <span className="n">{n}</span> : null);

  return (
    <div className="shell">
      <div className="top">
        <div className="brand"><i />Donna <span>operations</span></div>
        <div className="tracks">
          <button className={`track ${tab === "tickets" ? "on" : ""}`} onClick={() => setTab("tickets")}>Tickets{count(tickets.length)}</button>
          <button className={`track ${tab === "queue" ? "on" : ""}`} onClick={() => setTab("queue")}>Human queue{count(queue.length)}</button>
          <button className={`track ${tab === "lessons" ? "on" : ""}`} onClick={() => setTab("lessons")}>Lessons{count(lessonCount)}</button>
        </div>
        <button className="btn small" onClick={refresh}>Refresh</button>
      </div>
      {error && <div className="banner" onClick={() => setError("")}>{error}</div>}
      {tab === "lessons" ? (
        <Lessons onCount={setLessonCount} />
      ) : tab === "queue" ? (
        <QueueView queue={queue} onOpen={(id) => { setSel(id); setTab("tickets"); }} onResolved={refresh} toast={showToast} />
      ) : (
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
              {shown.map((t) => (
                <div key={t.id} className={`row-item ${sel === t.id ? "on" : ""}`} onClick={() => setSel(t.id)}>
                  <div className="num">{t.id}</div>
                  <div className="name">
                    <div className="t">{t.title}</div>
                    <div className="muted small">{t.address ?? "No address"}</div>
                    <div className="chips">
                      <span className="badge">{label(t.stage)}</span>
                      {t.status !== "open" && <span className="badge partial">{label(t.status)}</span>}
                      {t.pending_approvals > 0 && <span className="badge partial">Approval</span>}
                      {t.open_escalations > 0 && <span className="badge fail">Needs human</span>}
                      {t.queued_outbox > 0 && <span className="badge ran">{t.queued_outbox} queued</span>}
                    </div>
                  </div>
                </div>
              ))}
              {shown.length === 0 && <div className="empty">No tickets match.</div>}
            </div>
          </div>
          <div className="case-col">
            {detail ? <TicketView d={detail} onChange={refresh} toast={showToast} /> : <div className="empty" style={{ paddingTop: 120 }}>Select a ticket to see Donna's suggestion.<div className="small" style={{ marginTop: 6 }}><span className="kbd">j</span> <span className="kbd">k</span> to move, <span className="kbd">/</span> to search</div></div>}
          </div>
          <DonnaPanel d={detail} onChange={refresh} />
        </div>
      )}
      {toast && <div className="toast">{toast.lead}{toast.lesson ? <> Donna learned: <b>{toast.lesson}</b></> : null}</div>}
    </div>
  );
}

type Toast = (lead: string, lesson?: string) => void;

async function humanAction(ticketId: number, action: string, details: Record<string, unknown>, note: string | undefined, toast: Toast) {
  const out = await api<{ lesson: Lesson | null; learn_error?: string }>(`/api/tickets/${ticketId}/human-action`, { method: "POST", body: { action, details, note } });
  if (out.lesson) toast("Logged.", out.lesson.action);
  else toast(`Logged.${out.learn_error ? " Lesson not saved: " + out.learn_error : ""}`);
}

function QueueView({ queue, onOpen, onResolved, toast }: { queue: any[]; onOpen: (id: number) => void; onResolved: () => void; toast: Toast }) {
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [err, setErr] = useState("");
  return (
    <div className="page">
      <div className="page-inner" style={{ maxWidth: 860 }}>
        <div className="page-head"><div className="grow"><h1>Human queue</h1><p>Escalations Donna could not close on her own. Resolve with a note and she learns the decision.</p></div></div>
        {err && <div className="err small" style={{ marginBottom: 10 }}>{err}</div>}
        {queue.length === 0 && <div className="empty tablewrap">Nothing waiting for a human.</div>}
        {queue.map((h) => (
          <div className="queue-item" key={h.id}>
            <div className="msg-head">
              <span className="who">{h.title}</span>
              <span className="muted small">{h.address}</span>
              <span className={`badge ${h.priority === "urgent" || h.priority === "high" ? "fail" : "partial"}`}>{h.priority}</span>
              <span className="when">{h.case_ref} · {when(h.created_at)}</span>
            </div>
            <p style={{ margin: "6px 0" }}>{h.reason}</p>
            <dl className="facts">
              {([["Summary", h.summary], ["Checked", h.checked], ["Uncertain", h.uncertain], ["Recommendation", h.recommendation]] as const).map(([k, v]) =>
                v ? <Fragment key={k}><dt>{k}</dt><dd className="pre">{v}</dd></Fragment> : null,
              )}
            </dl>
            <div className="row" style={{ marginTop: 12 }}>
              <input className="input" placeholder="How was it resolved? Donna learns from this" value={notes[h.id] ?? ""} onChange={(e) => setNotes({ ...notes, [h.id]: e.target.value })} />
              <button className="btn" onClick={() => onOpen(h.ticket_id)}>Open ticket</button>
              <button className="btn primary" onClick={async () => {
                try {
                  await humanAction(h.ticket_id, "resolve_escalation", { queue_id: h.id, resolution: notes[h.id] ?? "" }, notes[h.id], toast);
                  onResolved();
                } catch (e) { setErr((e as Error).message); }
              }}>Resolve</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FactList({ facts }: { facts: Fact[] }) {
  const active = facts.filter((f) => f.status !== "superseded");
  if (!active.length) return <div className="muted small">No recorded facts</div>;
  return (
    <dl className="facts">
      {active.map((f) => (
        <Fragment key={f.id}><dt>{f.key}</dt><dd className={f.status === "conflict" ? "conflict" : ""}>{f.value}{f.status === "conflict" ? " (conflict)" : ""}</dd></Fragment>
      ))}
    </dl>
  );
}

function Card({ title, p, extra }: { title: string; p: any; extra?: string }) {
  if (!p) return <div className="brief"><h3>{title}</h3><div className="muted small">Not recorded</div></div>;
  return (
    <div className="brief">
      <h3>{title}</h3>
      <div><b>{p.name ?? p.address}</b></div>
      <div className="muted small">{[p.company, p.email, p.phone, extra].filter(Boolean).join(" · ")}</div>
      <FactList facts={p.facts ?? []} />
    </div>
  );
}

function Suggestion({ d, onChange, toast }: { d: Detail; onChange: () => void; toast: Toast }) {
  const id = d.ticket.id;
  const [s, setS] = useState<{ suggestion: string | null; lesson_ids: number[]; ts?: string } | null>(null);
  const [mode, setMode] = useState<"view" | "edit" | "reject">("view");
  const [text, setText] = useState("");
  const [done, setDone] = useState<{ verdict: string; lesson?: Lesson | null } | null>(null);
  const [busy, setBusy] = useState(false);
  const runKey = d.runs.length;
  useEffect(() => {
    setDone(null); setMode("view");
    api(`/api/tickets/${id}/suggestion`).then(setS).catch(() => setS(null));
  }, [id, runKey]);

  if (!s?.suggestion)
    return <div className="suggest none"><div className="suggest-head" style={{ color: "inherit" }}><i style={{ background: "var(--line-2)" }} />Donna suggests</div>No suggestion yet. Run Donna on this ticket to get a recommended next step.</div>;

  async function send(verdict: "accept" | "reject" | "edit", t?: string) {
    setBusy(true);
    try {
      const out = await api<{ lesson: Lesson | null }>(`/api/tickets/${id}/suggestion/feedback`, { method: "POST", body: { verdict, text: t, lesson_ids: s!.lesson_ids } });
      setDone({ verdict, lesson: out.lesson });
      setMode("view");
      if (out.lesson) toast("Logged.", out.lesson.action);
      else toast(verdict === "accept" ? "Logged. Donna will lean on those lessons more." : "Logged.");
      onChange();
    } catch (e) { toast((e as Error).message); }
    setBusy(false);
  }

  return (
    <div className="suggest">
      <div className="suggest-head"><i />Donna suggests{s.ts && <span className="muted" style={{ fontWeight: 400 }}>{when(s.ts)}</span>}</div>
      <div className="suggest-text pre">{s.suggestion}</div>
      {s.lesson_ids.length > 0 && <div className="small muted" style={{ marginTop: 6 }}>Based on lessons {s.lesson_ids.map((n) => `#${n}`).join(", ")}</div>}
      {mode !== "view" && (
        <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
          <textarea className="input" rows={3} autoFocus placeholder={mode === "edit" ? "What should Donna do instead?" : "Why is this wrong? (optional)"} value={text} onChange={(e) => setText(e.target.value)} />
          <div className="row">
            <button className="btn primary" disabled={busy || (mode === "edit" && !text.trim())} onClick={() => send(mode === "edit" ? "edit" : "reject", text)}>{mode === "edit" ? "Save correction" : "Reject"}</button>
            <button className="btn ghost" onClick={() => setMode("view")}>Cancel</button>
          </div>
        </div>
      )}
      {mode === "view" && !done && (
        <div className="suggest-foot">
          <button className="btn accent" disabled={busy} onClick={() => send("accept")}>Accept</button>
          <button className="btn" disabled={busy} onClick={() => { setText(s.suggestion ?? ""); setMode("edit"); }}>Edit</button>
          <button className="btn" disabled={busy} onClick={() => { setText(""); setMode("reject"); }}>Reject</button>
        </div>
      )}
      {done && (
        <div className="learned">
          {done.lesson ? <><b>Donna learned:</b> {done.lesson.action}</> : done.verdict === "accept" ? <>Accepted. <b>Lessons reinforced.</b></> : <>Feedback logged.</>}
        </div>
      )}
    </div>
  );
}

function HumanActions({ d, onChange, toast }: { d: Detail; onChange: () => void; toast: Toast }) {
  const id = d.ticket.id;
  const [tab, setTab] = useState<"contractor" | "message" | "stage" | "note">("contractor");
  const [f, setF] = useState<Record<string, string>>({ to: "tenant", channel: "email", stage: "" });
  const [busy, setBusy] = useState(false);
  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.value });
  const later = STAGES.slice(Math.max(0, STAGES.indexOf(d.ticket.stage as any) + 1));
  const stageTo = f.stage || later[0] || "";

  async function go(action: string, details: Record<string, unknown>, note?: string) {
    setBusy(true);
    try {
      await humanAction(id, action, details, note, toast);
      setF({ to: "tenant", channel: "email", stage: "" });
      onChange();
    } catch (e) { toast((e as Error).message); }
    setBusy(false);
  }
  const why = (
    <label>Why (Donna learns from this)<input className="input" value={f.note ?? ""} onChange={set("note")} placeholder="Optional, in your own words" /></label>
  );

  return (
    <div className="panel actions" style={{ marginTop: 18 }}>
      <h3>Take action</h3>
      <div className="tabs">
        {([["contractor", "Assign contractor"], ["message", "Send message"], ["stage", "Move stage"], ["note", "Add note"]] as const).map(([k, l]) => (
          <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>
      {tab === "contractor" && (
        <div className="form">
          <div className="row"><input className="input" placeholder="Contractor name" value={f.name ?? ""} onChange={set("name")} /><input className="input" placeholder="Company" value={f.company ?? ""} onChange={set("company")} /></div>
          {why}
          <div><button className="btn primary" disabled={busy || !(f.name ?? "").trim()} onClick={() => go("assign_contractor", { name: f.name, company: f.company }, f.note)}>Assign contractor</button></div>
        </div>
      )}
      {tab === "message" && (
        <div className="form">
          <div className="row">
            <select className="input" value={f.to} onChange={set("to")}><option value="tenant">To tenant</option><option value="landlord">To landlord</option><option value="contractor">To contractor</option></select>
            <select className="input" value={f.channel} onChange={set("channel")}><option value="email">Email</option><option value="sms">SMS</option></select>
          </div>
          <input className="input" placeholder="Subject" value={f.subject ?? ""} onChange={set("subject")} />
          <textarea className="input" rows={4} placeholder="Message" value={f.body ?? ""} onChange={set("body")} />
          {why}
          <div><button className="btn primary" disabled={busy || !(f.body ?? "").trim()} onClick={() => go("send_message", { to: f.to, channel: f.channel, subject: f.subject, body: f.body }, f.note)}>Queue message</button></div>
        </div>
      )}
      {tab === "stage" && (
        <div className="form">
          <select className="input" value={stageTo} onChange={set("stage")}>{later.map((s) => <option key={s} value={s}>{label(s)}</option>)}</select>
          <label>Reason<input className="input" value={f.reason ?? ""} onChange={set("reason")} placeholder="Why move it now" /></label>
          <div><button className="btn primary" disabled={busy || !stageTo} onClick={() => go("move_stage", { to: stageTo, reason: f.reason }, f.reason)}>Move stage</button></div>
        </div>
      )}
      {tab === "note" && (
        <div className="form">
          <textarea className="input" rows={3} placeholder="Add an internal note" value={f.text ?? ""} onChange={set("text")} />
          <div><button className="btn primary" disabled={busy || !(f.text ?? "").trim()} onClick={() => go("note", { text: f.text }, f.text)}>Add note</button></div>
        </div>
      )}
    </div>
  );
}

function TicketView({ d, onChange, toast }: { d: Detail; onChange: () => void; toast: Toast }) {
  const t = d.ticket;
  const idx = STAGES.indexOf(t.stage as any);
  const [showLog, setShowLog] = useState(false);
  return (
    <div className="case-inner">
      <h2 className="case-title">{t.title}</h2>
      <div className="meta">
        {([d.property?.address, t.case_ref, t.category && label(t.category), t.severity && `${label(t.severity)} severity`] as (string | null | undefined)[]).filter(Boolean).map((x, i) => (
          <Fragment key={i}>{i > 0 && <i className="dot" />}<span className={x === t.case_ref ? "mono" : ""}>{x}</span></Fragment>
        ))}
        <i className="dot" /><span className={`badge ${t.status === "open" ? "pass" : "partial"}`}>{label(t.status)}</span>
      </div>
      <div className="pipeline">
        {STAGES.map((s, i) => (
          <div key={s} className={`stage ${i === idx ? "now" : i < idx ? "past" : ""}`}>{label(s)}</div>
        ))}
        {t.stage === "paused" && <div className="stage now">Paused</div>}
      </div>
      {t.description && <p className="desc">{t.description}</p>}

      <Suggestion d={d} onChange={onChange} toast={toast} />
      <HumanActions d={d} onChange={onChange} toast={toast} />

      <div className="cards">
        <Card title="Property" p={d.property} extra={d.property?.notes ?? undefined} />
        <Card title="Tenant" p={d.tenant} />
        <Card title="Landlord" p={d.landlord} />
        <Card title="Contractor" p={d.contractor} />
      </div>

      {d.open_holds.length > 0 && (
        <>
          <div className="sec">Holds</div>
          {d.open_holds.map((h) => (
            <div className="msg" key={h.id}>{h.reason} <span className="muted small">waiting on {h.waiting_on ?? "n/a"}{h.follow_up_at ? `, follow up ${when(h.follow_up_at)}` : ""}</span></div>
          ))}
        </>
      )}

      {d.approvals.length > 0 && (
        <>
          <div className="sec">Approvals</div>
          {d.approvals.map((a) => (
            <div className="msg" key={a.id}>
              <div className="msg-head">
                <span className="who">{a.summary}</span>
                <span className={`badge ${a.status === "approved" ? "pass" : a.status === "pending" ? "partial" : "fail"}`}>{a.status}</span>
                <span className="chan">{a.channel}</span>
                {a.amount_gbp != null && <span className="mono muted">GBP {a.amount_gbp}</span>}
              </div>
              {a.response_text && <div className="pre small">{a.response_text}</div>}
            </div>
          ))}
        </>
      )}

      {d.outbox.length > 0 && (
        <>
          <div className="sec">Outbox</div>
          {d.outbox.map((o) => (
            <div className="msg" key={o.id}>
              <div className="msg-head">
                <span className="chan">{o.channel}</span>
                <span className="who">{o.to_label}</span>
                <span className={`badge ${o.status === "sent" ? "pass" : "partial"}`}>{o.status === "queued" && o.error ? "queued (not delivered)" : o.status}</span>
                {o.status === "queued" && (
                  <button className="btn small" style={{ marginLeft: "auto" }} onClick={async () => { await api(`/api/outbox/${o.id}/sent`, { method: "POST", body: {} }); onChange(); }}>Mark sent</button>
                )}
              </div>
              {o.subject && <div className="small"><b>{o.subject}</b></div>}
              <div className="pre small">{o.body}</div>
              {o.error && <div className={`small ${o.status === "sent" ? "muted" : "err"}`}>{o.status === "sent" ? "Delivery: " : ""}{o.error}</div>}
            </div>
          ))}
        </>
      )}

      <div className="sec">Timeline <span className="c">{d.events.length}</span>
        <button className="link toggle" onClick={() => setShowLog(!showLog)}>{showLog ? "Hide" : "Show"} action log ({d.action_log.length})</button>
      </div>
      {showLog && (
        <div className="msg small mono">
          {d.action_log.map((a) => (
            <div key={a.id}>{when(a.ts)} · {a.actor} · {a.action} · {a.ok ? "ok" : <span className="err">failed</span>}</div>
          ))}
        </div>
      )}
      {d.events.map((e) =>
        e.direction === "internal" ? (
          <div key={e.id} className={`quiet ${e.kind === "agent_action" ? "agent" : e.party === "human" ? "human" : ""}`}>
            <span>{when(e.ts)}</span><span className="qt pre">{e.kind === "agent_action" ? "Donna: " : e.party === "human" ? "Team: " : ""}{e.body}</span>
          </div>
        ) : (
          <div key={e.id} className={`msg ${e.direction}`}>
            <div className="msg-head">
              <span className="who">{e.direction === "in" ? `From ${e.party ?? "unknown"}` : `To ${e.party ?? "unknown"}`}</span>
              <span className="chan">{e.kind}</span>
              <span className="when">{when(e.ts)}</span>
            </div>
            <div className="pre">{e.body}</div>
          </div>
        ),
      )}
    </div>
  );
}

function DonnaPanel({ d, onChange }: { d: Detail | null; onChange: () => void }) {
  const [from, setFrom] = useState("tenant");
  const [channel, setChannel] = useState("email");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [fresh, setFresh] = useState<any>(null);
  useEffect(() => { setFresh(null); setErr(""); }, [d?.ticket.id]);
  if (!d) return <div className="rail muted small">Donna tools appear when a ticket is selected.</div>;

  const latest = fresh ?? (d.runs.length ? d.runs[d.runs.length - 1] : null);
  const result = latest?.result;
  const pending = d.approvals.find((a) => a.status === "pending");

  async function go(path: string, payload?: unknown) {
    setBusy(true);
    setErr("");
    try {
      const out = await api(`/api/tickets/${d!.ticket.id}/${path}`, { method: "POST", body: payload ?? {} });
      setFresh(out);
      if (payload) setBody("");
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
      onChange();
    }
  }

  return (
    <div className="rail">
      <div className="panel">
        <h3>Simulate inbound message</h3>
        <div className="row">
          <select className="input" value={from} onChange={(e) => setFrom(e.target.value)}>
            <option value="tenant">Tenant</option><option value="landlord">Landlord</option><option value="contractor">Contractor</option>
          </select>
          <select className="input" value={channel} onChange={(e) => setChannel(e.target.value)}>
            <option value="email">Email</option><option value="sms">SMS</option><option value="call">Call</option>
          </select>
        </div>
        <textarea className="input" rows={4} placeholder="Message text" value={body} onChange={(e) => setBody(e.target.value)} />
        <div className="row">
          <button className="btn primary" disabled={busy || !body.trim()} onClick={() => go("inbound", { from, channel, body })}>Send to Donna</button>
          <button className="btn" disabled={busy} onClick={() => go("run")}>Run Donna</button>
        </div>
        {busy && <div className="muted small">Donna is working, this can take a minute or two</div>}
        {err && <div className="err small">{err}</div>}
      </div>

      {pending && <PhoneCall approvalId={pending.id} ticketId={d.ticket.id} onChange={onChange} />}
      {!pending && <PhoneCall ticketId={d.ticket.id} onChange={onChange} />}

      {pending && (
        <CallPanel
          info={{
            approval_id: pending.id,
            landlord_name: d.landlord?.name ?? "the landlord",
            property_address: d.property?.address ?? "the property",
            job_summary: pending.summary ?? d.ticket.title,
            estimated_cost: pending.amount_gbp != null ? `${pending.amount_gbp} pounds` : "not confirmed",
            job_ref: d.ticket.case_ref,
            tenant_name: d.tenant?.name ?? "the tenant",
          }}
          onDone={onChange}
        />
      )}

      <div className="panel">
        <h3>Latest run {latest?.ts ? <span className="muted small">{when(latest.ts)}</span> : null}</h3>
        {!latest && <div className="muted small">No runs yet for this ticket.</div>}
        {latest?.error && <div className="err small">{latest.error}</div>}
        {result ? <ResultView r={result} /> : latest && !latest.error && <div className="pre small">{latest.finalText}</div>}
        {latest?.sessionId && (
          <div className="small muted">Session {latest.sessionId} · {"events" in latest ? latest.events?.length : latest.event_count} events
            {latest.file && <> · <a href={`#raw`} onClick={(e) => { e.preventDefault(); const w = window.open("", "_blank"); w?.document.write(`<pre>${JSON.stringify(latest.events, null, 2).replace(/</g, "&lt;")}</pre>`); }}>raw events</a></>}
          </div>
        )}
      </div>
    </div>
  );
}

function List({ title, items }: { title: string; items?: string[] }) {
  if (!items?.length) return null;
  return <div className="small"><b>{title}</b><ul>{items.map((x, i) => <li key={i}>{x}</li>)}</ul></div>;
}

function ResultView({ r }: { r: any }) {
  return (
    <div className="result">
      <div><span className={`badge ${r.decision === "escalate" ? "fail" : "pass"}`}>{label(r.decision)}</span> <span className="muted small">confidence {r.confidence}</span></div>
      <p className="small">{r.summary}</p>
      {r.actions_taken?.length > 0 && (
        <table className="tbl small">
          <thead><tr><th>Tool</th><th>What</th><th>Ok</th></tr></thead>
          <tbody>{r.actions_taken.map((a: any, i: number) => (
            <tr key={i}><td>{a.tool}</td><td>{a.description}<div className="muted">{a.result}</div></td><td>{a.ok ? "Yes" : <span className="err">No</span>}</td></tr>
          ))}</tbody>
        </table>
      )}
      {r.escalation?.needed && (
        <div className="box should small"><b>Escalated</b>{r.escalation.reason}<div>{r.escalation.handover_summary}</div><div><i>{r.escalation.recommendation}</i></div></div>
      )}
      <List title="Unverified" items={r.unverified} />
      <List title="Failures" items={r.failures} />
      <List title="Risks" items={r.risks_or_red_flags} />
      <div className="small muted">Final status: {r.final_status}{r.next_follow_up ? ` · Next: ${r.next_follow_up.what} (${r.next_follow_up.when})` : ""}</div>
    </div>
  );
}
