import { useEffect, useMemo, useState } from "react";
import { api, label, nm, STAGES, when } from "../api.ts";
import type { Detail, Fact, Lesson } from "../api.ts";
import { ActionButton, Avatar, Button, Card, Check, Chev, DonnaMark, DonnaVoice, Pill, Popover, Reveal, RichText, Section, Stepper } from "../components/index.ts";
import type { Notify } from "../components/index.ts";
import { reduced } from "../components/Toast.tsx";

function Header({ d, onChange, toast }: { d: Detail; onChange: () => void; toast: Notify }) {
  const t = d.ticket;
  const [orig, setOrig] = useState(false);
  const pend = d.approvals.filter((a) => a.status === "pending");
  const [take, setTake] = useState(false);
  const esc: any[] = (d as any).open_human_queue ?? [];
  const hold = d.open_holds[0];
  const who = (n: string | null | undefined) => (n && n !== "null" ? n : "the other side");
  // The badge stays a short label; the escalation's reason is a short headline next to it (full text on hover).
  const escReason: string = String(esc[0]?.reason ?? "").trim();
  const escHeadline = escReason.split(/[:;.!?]|,\s| — | - /)[0].trim().split(/\s+/).slice(0, 8).join(" ");
  const auto: [string, string] = esc.length
    ? ["bad", "Needs your judgement"]
    : pend.length
      ? ["warn", `Donna is waiting on ${nm(d.landlord?.name)}${hold?.follow_up_at ? ` · chases ${when(hold.follow_up_at)}` : ""}`]
      : hold
        ? ["warn", `Donna is waiting on ${who(hold.waiting_on)}${hold.follow_up_at ? ` · chases ${when(hold.follow_up_at)}` : ""}`]
        : ["good", "Autonomous"];
  return (
    <Card className="phead">
      <div className="ph-top">
        <div className="grow">
          <h2 className="case-title">{t.title}</h2>
          <div className="ph-addr">{d.property?.address ?? "No address"} <span className="faint mono">{t.case_ref}</span></div>
        </div>
        <div className="ph-flags">
          <Pill tone={t.status === "open" ? "good" : "warn"}>{label(t.status)}</Pill>
        </div>
      </div>
      <div className="autonomy">
        <Pill tone={auto[0] as any}>{auto[1]}</Pill>
        {esc.length > 0 && escHeadline && (
          <span className="autonomy-why" title={escReason}>{escHeadline}{escHeadline.length < escReason.length ? "…" : ""}</span>
        )}
      </div>
      <Stepper steps={STAGES} current={t.stage} extra={t.stage === "paused" ? "paused" : undefined} />
      <div className="takeover"><button className="link" onClick={() => setTake(!take)}><Chev open={take} /> Take over</button>{take && <span className="muted small">Routine steps are Donna's job. Use these only if you want to step in.</span>}</div>
      {take && <div className="actionbar" data-learn-src>
        <ActionButton kind="note" ticketId={t.id} toast={toast} onDone={onChange} />
        <ActionButton kind="assign" ticketId={t.id} toast={toast} onDone={onChange} />
        <ActionButton kind="message" ticketId={t.id} toast={toast} onDone={onChange} />
        <ActionButton kind="stage" ticketId={t.id} stage={t.stage} toast={toast} onDone={onChange} />
        {t.description && <><span className="grow" /><button className="link" onClick={() => setOrig(!orig)}><Chev open={orig} /> Original request</button></>}
      </div>}
      {!take && t.description && <div className="actionbar"><button className="link" onClick={() => setOrig(!orig)}><Chev open={orig} /> Original request</button></div>}
      {t.description && <Reveal open={orig}><pre className="orig">{t.description}</pre></Reveal>}
    </Card>
  );
}

function Suggestion({ d, onChange, toast }: { d: Detail; onChange: () => void; toast: Notify }) {
  const id = d.ticket.id;
  const [s, setS] = useState<{ suggestion: string | null; lesson_ids: number[]; ts?: string } | null>(null);
  const [mode, setMode] = useState<"view" | "edit" | "reject">("view");
  const [text, setText] = useState("");
  const [done, setDone] = useState<{ verdict: string; lesson?: Lesson | null } | null>(null);
  const [busy, setBusy] = useState(false);
  const [long, setLong] = useState(false);
  const runKey = d.runs.length;
  useEffect(() => {
    setDone(null); setMode("view");
    api(`/api/tickets/${id}/suggestion`).then(setS).catch(() => setS(null));
  }, [id, runKey]);

  if (!s?.suggestion)
    return (
      <section className="suggest none">
        <DonnaVoice><span className="muted"> suggests</span></DonnaVoice>
        <div className="muted" style={{ marginTop: 6 }}>Nothing yet. Open Donna (press .) and ask her to take the next step.</div>
      </section>
    );

  async function send(verdict: "accept" | "reject" | "edit", t?: string) {
    setBusy(true);
    try {
      const out = await api<{ lesson: Lesson | null }>(`/api/tickets/${id}/suggestion/feedback`, { method: "POST", body: { verdict, text: t, lesson_ids: s!.lesson_ids } });
      setDone({ verdict, lesson: out.lesson });
      setMode("view");
      if (out.lesson) toast("Logged.", out.lesson.action);
      else toast(verdict === "accept" ? "Noted. I will lean on those lessons more." : "Logged.");
      setTimeout(onChange, reduced() ? 0 : 1400);
    } catch (e) { toast((e as Error).message); }
    setBusy(false);
  }

  const tall = s.suggestion.length > 260;
  return (
    <section className={`suggest ${done ? "confirmed" : ""}`} data-learn-src>
      <div className="suggest-head">
        <DonnaVoice size={22}><span className="muted"> suggests</span></DonnaVoice>
        {s.ts && <span className="when">{when(s.ts)}</span>}
      </div>
      {done ? (
        <div className="done-line">
          <Check size={22} />
          <div>
            <b>{done.verdict === "accept" ? "Accepted" : done.verdict === "edit" ? "Correction saved" : "Rejected"}</b>
            <div className="muted small">{done.lesson ? <>Donna learned: {done.lesson.action}</> : "Lessons reinforced."}</div>
          </div>
        </div>
      ) : (
        <>
          <div className={`suggest-text pre ${tall && !long ? "clamp" : ""}`}><RichText text={s.suggestion} ticketId={id} /></div>
          {tall && <button className="link" onClick={() => setLong(!long)}>{long ? "Show less" : "Show full suggestion"}</button>}
          <Reveal open={mode !== "view"}>
            <div className="fbform">
              <textarea className="input" rows={3} placeholder={mode === "edit" ? "What should Donna do instead?" : "Why is this wrong? (optional)"} value={text} onChange={(e) => setText(e.target.value)} />
              <div className="row">
                <Button variant="primary" disabled={busy || (mode === "edit" && !text.trim())} onClick={() => send(mode === "edit" ? "edit" : "reject", text)}>{mode === "edit" ? "Save correction" : "Reject suggestion"}</Button>
                <Button variant="ghost" onClick={() => setMode("view")}>Cancel</Button>
              </div>
            </div>
          </Reveal>
          {mode === "view" && (
            <div className="suggest-foot">
              <Button variant="accent" size="lg" icon="check" disabled={busy} onClick={() => send("accept")}>Accept</Button>
              <Button disabled={busy} onClick={() => { setText(s.suggestion ?? ""); setMode("edit"); }}>Edit</Button>
              <Button variant="ghost" disabled={busy} onClick={() => { setText(""); setMode("reject"); }}>Reject</Button>
              {s.lesson_ids.length > 0 && <span className="small muted" style={{ marginLeft: "auto" }}>Based on {s.lesson_ids.length} lesson{s.lesson_ids.length > 1 ? "s" : ""}</span>}
            </div>
          )}
        </>
      )}
    </section>
  );
}

function NeedsYou({ d, onChange, toast }: { d: Detail; onChange: () => void; toast: Notify }) {
  const id = d.ticket.id;
  const esc: any[] = (d as any).open_human_queue ?? [];
  const pend = d.approvals.filter((a) => a.status === "pending");
  const queued = d.outbox.filter((o) => o.status === "queued");
  const n = pend.length + d.open_holds.length + esc.length + queued.length;
  if (!n)
    return <Section title="Needs your judgement"><div className="allclear"><Check size={18} /> Donna has this covered. Nothing needs a person.</div></Section>;
  return (
    <Section title={esc.length ? "Needs your judgement" : "Donna is on it"} count={n}>
      <Card className="list-card">
        {esc.map((h) => (
          <div key={`e${h.id}`} className="need">
            <Pill tone="bad">Needs a person</Pill>
            <div className="need-t"><RichText text={h.reason ?? ""} ticketId={id} /></div>
            <ActionButton kind="resolve" size="sm" ticketId={id} queueId={h.id} toast={toast} onDone={onChange} />
          </div>
        ))}
        {pend.map((a) => (
          <div key={`a${a.id}`} className="need">
            <Pill tone="warn">Approval</Pill>
            <div className="need-t"><RichText text={a.summary ?? "Landlord approval needed"} ticketId={id} />{a.amount_gbp != null && <> <span className="ent money">£{a.amount_gbp}</span></>}</div>
            <span className={`dstatus ${a.channel === "call" || d.outbox.some((o) => o.channel === "call" && o.status === "queued") ? "calling" : ""}`}>
              {a.channel === "call" || d.outbox.some((o) => o.channel === "call" && o.status === "queued") ? <><i className="ldot" />Donna is calling {nm(d.landlord?.name)}…</> : <>Donna asked {nm(d.landlord?.name)} and is waiting</>}
            </span>
          </div>
        ))}
        {d.open_holds.map((h) => (
          <div key={`h${h.id}`} className="need">
            <Pill tone="warn">On hold</Pill>
            <div className="need-t"><RichText text={h.reason ?? "Waiting"} ticketId={id} /><span className="muted small">{h.waiting_on ? ` · waiting on ${h.waiting_on}` : ""}{h.follow_up_at ? `, Donna will chase on ${when(h.follow_up_at)}` : ""}</span></div>
          </div>
        ))}
        {queued.map((o) => (
          <div key={`o${o.id}`} className="need">
            <Pill tone="accent">{o.error ? "Not delivered" : "Donna is sending"}</Pill>
            <div className="need-t" title={o.body}>{o.channel === "sms" ? "Text" : o.channel === "call" ? "Call" : "Email"} to {o.to_label}{o.subject ? `: ${o.subject}` : ""}</div>
            <Button size="sm" onClick={async () => { await api(`/api/outbox/${o.id}/sent`, { method: "POST", body: {} }); onChange(); }}>Mark sent</Button>
          </div>
        ))}
      </Card>
    </Section>
  );
}

const first = (b: string) => b.replace(/^Donna[:,]?\s+/, "I ");
function DonnaWork({ d }: { d: Detail }) {
  const did = d.events.filter((e) => e.kind === "agent_action" || e.direction === "out").slice(-6).reverse();
  const next: string[] = [
    ...d.approvals.filter((a) => a.status === "pending").map((a) => `I'm waiting on ${nm(d.landlord?.name)} to approve${a.amount_gbp != null ? ` £${a.amount_gbp}` : ""}.`),
    ...d.open_holds.map((h) => `I'll chase ${h.waiting_on ?? "them"}${h.follow_up_at ? ` on ${when(h.follow_up_at)}` : ""}${h.reason ? `: ${h.reason}` : ""}`),
    ...d.outbox.filter((o) => o.status === "queued").map((o) => `I'm ${o.channel === "call" ? "calling" : "sending a message to"} ${o.to_label ?? "them"}.`),
  ];
  return (
    <>
      <Section title="What I'm doing next">
        {next.length ? <ul className="dnext">{next.map((n, i) => <li key={i}><DonnaMark size={16} /><span>{n}</span></li>)}</ul> : <div className="muted small">Nothing queued. I'll pick this up again when something changes.</div>}
      </Section>
      <Section title="What I did" count={did.length}>
        <ol className="tline">
          {did.map((e) => (
            <li key={e.id} className="tl-ev donna">
              <span className="dotm"><DonnaMark size={18} /></span>
              <div className="tl-body">
                <div className="tl-h"><b>{e.direction === "out" ? `I messaged ${e.party ?? "them"}` : "I acted"}</b><span className="when">{when(e.ts)}</span></div>
                <div className="tl-t pre clamp2"><RichText text={first(e.body ?? "")} ticketId={d.ticket.id} /></div>
              </div>
            </li>
          ))}
        </ol>
        {!did.length && <div className="muted small">I haven't acted on this one yet.</div>}
      </Section>
    </>
  );
}

function Timeline({ d }: { d: Detail }) {
  const [all, setAll] = useState(false);
  const [sys, setSys] = useState<Record<number, boolean>>({});
  const [exp, setExp] = useState<Record<number, boolean>>({});
  type Item = { kind: "ev"; e: Detail["events"][number] } | { kind: "sys"; es: Detail["events"]; key: number };
  const items = useMemo(() => {
    const out: Item[] = [];
    [...d.events].reverse().forEach((e) => {
      const isSys = e.direction === "internal" && e.kind !== "agent_action" && e.party !== "human";
      const last = out[out.length - 1];
      if (isSys) { if (last?.kind === "sys") last.es.push(e); else out.push({ kind: "sys", es: [e], key: e.id }); }
      else out.push({ kind: "ev", e });
    });
    return out;
  }, [d.events]);
  const vis = all ? items : items.slice(0, 5);
  return (
    <Section title="Full history" count={d.events.length}>
      <ol className="tline">
        {vis.map((it) => {
          if (it.kind === "sys") {
            const o = !!sys[it.key];
            return (
              <li key={`s${it.key}`} className="tl-sys">
                <button className="link" onClick={() => setSys({ ...sys, [it.key]: !o })}><Chev open={o} /> {it.es.length} system note{it.es.length > 1 ? "s" : ""}</button>
                <Reveal open={o}>{it.es.map((e) => <div key={e.id} className="quiet"><span>{when(e.ts)}</span><span className="pre">{e.body}</span></div>)}</Reveal>
              </li>
            );
          }
          const e = it.e;
          const donna = e.kind === "agent_action" || e.direction === "out";
          const team = e.party === "human" && e.direction === "internal";
          const who = e.kind === "agent_action" ? "Donna" : e.direction === "out" ? `Donna to ${e.party ?? "unknown"}` : team ? "Team" : label(e.party ?? "unknown");
          const long = (e.body ?? "").length > 140 || (e.body ?? "").includes("\n");
          const o = !!exp[e.id];
          return (
            <li key={e.id} className={`tl-ev ${donna ? "donna" : team ? "team" : "in"}`} onClick={() => long && setExp({ ...exp, [e.id]: !o })} style={{ cursor: long ? "pointer" : "default" }}>
              <span className="dotm">{donna ? <DonnaMark size={18} /> : <i className={team ? "t" : ""} />}</span>
              <div className="tl-body">
                <div className="tl-h"><b>{who}</b>{e.kind !== "agent_action" && <span className="chan">{e.kind}</span>}<span className="when">{when(e.ts)}</span></div>
                <div className={`tl-t pre ${long && !o ? "clamp2" : ""}`}><RichText text={e.body ?? ""} ticketId={d.ticket.id} /></div>
              </div>
            </li>
          );
        })}
      </ol>
      {items.length > 5 && <button className="link" onClick={() => setAll(!all)}>{all ? "Show fewer" : `Show ${items.length - 5} earlier`}</button>}
      {items.length === 0 && <div className="muted small">Nothing has happened on this ticket yet.</div>}
    </Section>
  );
}

function FactList({ facts }: { facts: Fact[] }) {
  const active = facts.filter((f) => f.status !== "superseded");
  if (!active.length) return <div className="muted small">No recorded facts</div>;
  return (
    <dl className="facts">
      {active.map((f) => (
        <div key={f.id} style={{ display: "contents" }}><dt>{f.key.replace(/_/g, " ")}</dt><dd className={f.status === "conflict" ? "conflict" : ""}>{f.value}{f.status === "conflict" ? " (conflict)" : ""}</dd></div>
      ))}
    </dl>
  );
}

function People({ d }: { d: Detail }) {
  const [open, setOpen] = useState<string | null>(null);
  const items = ([["Property", d.property], ["Tenant", d.tenant], ["Landlord", d.landlord], ["Contractor", d.contractor]] as const).filter(([, p]) => p);
  if (!items.length) return null;
  const cur = items.find(([k]) => k === open)?.[1] as any;
  return (
    <Section title="People and property">
      <div className="chipset">
        {items.map(([k, p]: any) => {
          const nf = (p.facts ?? []).filter((f: Fact) => f.status !== "superseded").length;
          return (
            <button key={k} className={`pchip ${open === k ? "on" : ""}`} onClick={() => setOpen(open === k ? null : k)} title={`${nf} recorded facts`}>
              <Avatar name={k} />
              <span className="pc-t"><span className="pc-k">{k}</span><span className="pc-n">{p.name ?? p.address}</span></span>
              {nf > 0 && <span className="pc-c">{nf}</span>}
            </button>
          );
        })}
      </div>
      <Reveal open={!!cur}>
        {cur && (
          <div className="pdetail">
            <div className="muted small">{[cur.company, cur.email, cur.phone, cur.notes].filter(Boolean).join(" · ") || "No contact details"}</div>
            <FactList facts={cur.facts ?? []} />
          </div>
        )}
      </Reveal>
    </Section>
  );
}

export default function Ticket({ d, onChange, toast }: { d: Detail; onChange: () => void; toast: Notify }) {
  return (
    <div className="case-inner">
      <Header d={d} onChange={onChange} toast={toast} />
      <Suggestion d={d} onChange={onChange} toast={toast} />
      <NeedsYou d={d} onChange={onChange} toast={toast} />
      <DonnaWork d={d} />
      <Timeline d={d} />
      <People d={d} />
    </div>
  );
}

