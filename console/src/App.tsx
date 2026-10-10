import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { api, label, STAGES } from "./api.ts";
import type { Detail, TicketRow, Fact } from "./api.ts";
import CallPanel from "./CallPanel.tsx";
import PhoneCall from "./PhoneCall.tsx";

type Filter = "all" | "human" | "approval" | "hold";
const when = (ts: string) => new Date(ts).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export default function App() {
  const [tab, setTab] = useState<"tickets" | "queue">("tickets");
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [queue, setQueue] = useState<any[]>([]);
  const [sel, setSel] = useState<number | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const [error, setError] = useState("");

  const loadList = useCallback(async () => {
    try {
      setTickets(await api("/api/tickets"));
      setQueue(await api("/api/queue"));
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

  return (
    <div className="shell">
      <div className="top">
        <div className="brand">Donna console</div>
        <div className="tracks">
          <button className={`track ${tab === "tickets" ? "on" : ""}`} onClick={() => setTab("tickets")}>Tickets</button>
          <button className={`track ${tab === "queue" ? "on" : ""}`} onClick={() => setTab("queue")}>
            Human queue{queue.length ? ` (${queue.length})` : ""}
          </button>
        </div>
        <button className="btn small" onClick={refresh}>Refresh</button>
      </div>
      {error && <div className="banner err" onClick={() => setError("")}>{error}</div>}
      {tab === "queue" ? (
        <QueueView queue={queue} onOpen={(id) => { setSel(id); setTab("tickets"); }} onResolved={refresh} />
      ) : (
        <div className="body">
          <div className="list-col">
            <div className="list-tools">
              <input className="input" placeholder="Search tickets" value={q} onChange={(e) => setQ(e.target.value)} />
              <div className="seg">
                {([["all", "All"], ["human", "Needs human"], ["approval", "Approval"], ["hold", "On hold"]] as const).map(([k, l]) => (
                  <button key={k} className={filter === k ? "on" : ""} onClick={() => setFilter(k)}>{l}</button>
                ))}
              </div>
              <div className="muted small">{shown.length} of {tickets.length} tickets</div>
            </div>
            <div className="list">
              {shown.map((t) => (
                <div key={t.id} className={`row-item ${sel === t.id ? "on" : ""}`} onClick={() => setSel(t.id)}>
                  <div className="num">{t.id}</div>
                  <div className="name">
                    <div>{t.title}</div>
                    <div className="muted small">{t.address ?? "No address"}</div>
                    <div className="chips">
                      <span className="badge ran">{label(t.stage)}</span>
                      {t.status !== "open" && <span className="badge partial">{label(t.status)}</span>}
                      {t.pending_approvals > 0 && <span className="badge partial">Approval</span>}
                      {t.open_escalations > 0 && <span className="badge fail">Human</span>}
                      {t.queued_outbox > 0 && <span className="badge pass">{t.queued_outbox} queued</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="case-col">
            {detail ? <TicketView d={detail} /> : <div className="case-inner muted">Select a ticket.</div>}
          </div>
          <DonnaPanel d={detail} onChange={refresh} />
        </div>
      )}
    </div>
  );
}

function QueueView({ queue, onOpen, onResolved }: { queue: any[]; onOpen: (id: number) => void; onResolved: () => void }) {
  return (
    <div className="case-col">
      <div className="case-inner">
        <h2 className="case-title">Human queue</h2>
        {queue.length === 0 && <p className="muted">Nothing waiting for a human.</p>}
        {queue.map((h) => (
          <div className="brief" key={h.id}>
            <div className="msg-head">
              <span className="who">{h.title}</span>
              <span className="muted small">{h.case_ref} · {h.address}</span>
              <span className={`badge ${h.priority === "urgent" || h.priority === "high" ? "fail" : "partial"}`}>{h.priority}</span>
              <span className="when">{when(h.created_at)}</span>
            </div>
            <p><b>Reason.</b> {h.reason}</p>
            <dl className="facts">
              {([["Summary", h.summary], ["Checked", h.checked], ["Uncertain", h.uncertain], ["Recommendation", h.recommendation]] as const).map(([k, v]) =>
                v ? <Fragment key={k}><dt>{k}</dt><dd className="pre">{v}</dd></Fragment> : null,
              )}
            </dl>
            <div className="row">
              <button className="btn small" onClick={() => onOpen(h.ticket_id)}>Open ticket</button>
              <button className="btn small primary" onClick={async () => { await api(`/api/queue/${h.id}/resolve`, { method: "POST", body: {} }); onResolved(); }}>Resolve</button>
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

function TicketView({ d }: { d: Detail }) {
  const t = d.ticket;
  const idx = STAGES.indexOf(t.stage as any);
  const [showLog, setShowLog] = useState(false);
  return (
    <div className="case-inner wide">
      <h2 className="case-title">{t.title}</h2>
      <div className="muted">{d.property?.address ?? "No address"} · {t.case_ref} · {label(t.category)} · {label(t.severity)} · {label(t.status)}</div>
      <div className="pipeline">
        {STAGES.map((s, i) => (
          <div key={s} className={`stage ${i === idx ? "now" : i < idx ? "past" : ""}`}>{label(s)}</div>
        ))}
        {t.stage === "paused" && <div className="stage now">Paused</div>}
      </div>
      {t.description && <p className="pre desc">{t.description}</p>}

      <div className="cards">
        <Card title="Property" p={d.property} extra={d.property?.notes ?? undefined} />
        <Card title="Tenant" p={d.tenant} />
        <Card title="Landlord" p={d.landlord} />
        <Card title="Contractor" p={d.contractor} />
      </div>

      {d.open_holds.length > 0 && (
        <>
          <div className="hint">Holds</div>
          {d.open_holds.map((h) => (
            <div className="msg static" key={h.id}>{h.reason} <span className="muted small">waiting on {h.waiting_on ?? "n/a"}{h.follow_up_at ? `, follow up ${when(h.follow_up_at)}` : ""}</span></div>
          ))}
        </>
      )}

      {d.approvals.length > 0 && (
        <>
          <div className="hint">Approvals</div>
          {d.approvals.map((a) => (
            <div className="msg static" key={a.id}>
              <div className="msg-head">
                <span className="who">{a.summary}</span>
                <span className={`badge ${a.status === "approved" ? "pass" : a.status === "pending" ? "partial" : "fail"}`}>{a.status}</span>
                <span className="chan">{a.channel}</span>
                {a.amount_gbp != null && <span className="muted small">GBP {a.amount_gbp}</span>}
              </div>
              {a.response_text && <div className="pre small">{a.response_text}</div>}
            </div>
          ))}
        </>
      )}

      {d.outbox.length > 0 && (
        <>
          <div className="hint">Outbox</div>
          {d.outbox.map((o) => (
            <div className="msg static" key={o.id}>
              <div className="msg-head">
                <span className={`chan ${o.channel}`}>{o.channel}</span>
                <span className="who">{o.to_label}</span>
                <span className={`badge ${o.status === "sent" ? "pass" : "partial"}`}>{o.status === "queued" && o.error ? "queued (not delivered)" : o.status}</span>
                {o.status === "queued" && (
                  <button className="btn small" onClick={async () => { await api(`/api/outbox/${o.id}/sent`, { method: "POST", body: {} }); location.reload(); }}>Mark sent</button>
                )}
              </div>
              {o.subject && <div className="small"><b>{o.subject}</b></div>}
              <div className="pre small">{o.body}</div>
              {o.error && <div className={`small ${o.status === "sent" ? "muted" : "err"}`}>{o.status === "sent" ? "Delivery: " : ""}{o.error}</div>}
            </div>
          ))}
        </>
      )}

      <div className="hint">Timeline <span className="muted small">({d.events.length} events)</span>
        <button className="link toggle" onClick={() => setShowLog(!showLog)}>{showLog ? "Hide" : "Show"} action log ({d.action_log.length})</button>
      </div>
      {showLog && (
        <div className="msg static small">
          {d.action_log.map((a) => (
            <div key={a.id}>{when(a.ts)} · {a.actor} · {a.action} · {a.ok ? "ok" : <span className="err">failed</span>}</div>
          ))}
        </div>
      )}
      {d.events.map((e) =>
        e.direction === "internal" ? (
          <div key={e.id} className={`quiet ${e.kind === "agent_action" ? "agent" : ""}`}>
            <span>{when(e.ts)}</span><span className="qt pre">{e.kind === "agent_action" ? "Donna: " : ""}{e.body}</span>
          </div>
        ) : (
          <div key={e.id} className={`msg static ${e.direction}`}>
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
  if (!d) return <div className="test-col muted">Donna</div>;

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
    <div className="test-col">
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
