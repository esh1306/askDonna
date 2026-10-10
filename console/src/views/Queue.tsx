import { useContext, useState } from "react";
import { ago } from "../api.ts";
import { ActionButton, Button, Card, Check, EmptyState, EntityChip, Pill, Reveal, RichText, Chev } from "../components/index.ts";
import type { Notify } from "../components/index.ts";
import { EntityCtx } from "../components/RichText.tsx";
import { isImage, niceName, useTicketInfo } from "../info.ts";
import { reduced } from "../components/Toast.tsx";

const clip = (s: string, n: number) => (s.length > n ? s.slice(0, n).replace(/\s+\S*$/, "") + "…" : s);
/** Up to `max` leading sentences, kept under `n` characters. */
function lead(text: string, max = 2, n = 230) {
  const ss = text.replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z0-9(])/);
  let out = "";
  for (const s of ss.slice(0, max)) { if (out && (out + " " + s).length > n) break; out += (out ? " " : "") + s; }
  return clip(out || text, n);
}
export function steps(rec: string | null): string[] {
  if (!rec) return [];
  const parts = rec.split(/(?:^|\s)\(?\d{1,2}[).]\s+/).map((s) => s.trim()).filter((s) => s.length > 18);
  const list = parts.length >= 2 ? parts : rec.split(/(?<=[.!?])\s+(?=[A-Z])/).map((s) => s.trim()).filter(Boolean);
  return list.slice(0, 3).map((s) => lead(s, 2, 190));
}
function plainTitle(h: any): string {
  if (/rehearsal|organiser|undeliverable|^team-written/i.test(h.title)) {
    const r = String(h.reason).replace(/^[A-Za-z ]+:\s*/, "");
    return clip(r[0].toUpperCase() + r.slice(1).split(/[.;]/)[0], 80);
  }
  return h.title;
}

function QueueCard({ h, phase, onOpen, onResolved, toast }: { h: any; phase?: "done" | "gone"; onOpen: (id: number) => void; onResolved: (id: number) => void; toast: Notify }) {
  const env = useContext(EntityCtx);
  const info = useTicketInfo(h.ticket_id);
  const [more, setMore] = useState(false);
  const notes = ([["Summary", h.summary], ["Checked", h.checked], ["Uncertain", h.uncertain], ["Full recommendation", h.recommendation]] as const).filter(([, v]) => v);
  const all = [h.reason, h.summary, h.checked, h.recommendation].filter(Boolean).join("\n");
  const firstRef = all.match(/\b[A-Z]{2,5}-\d{3,}\b|\b[A-Z]{1,5}-\d{1,3}(?:-\d{2,})+\b/)?.[0];
  const docs = info.files;
  const best = (firstRef && docs.find((f) => f.name.toLowerCase().includes(firstRef.toLowerCase()) || f.content?.toLowerCase().includes(firstRef.toLowerCase()))) || docs.find((f) => /invoice|quote|estimate/i.test(f.name)) || docs[0];
  const todo = steps(h.recommendation);
  const urgent = h.priority === "urgent" || h.priority === "high";
  const money = /invoice|quote|contractor|job|payment|approval/i.test(h.reason + " " + h.title);

  return (
    <div className={`collapse ${phase === "gone" ? "gone" : ""}`}><div>
      <Card className={`dcard ${phase === "done" ? "resolved" : ""} ${urgent ? "urgent" : ""}`} data-learn-src>
        {phase === "done" && <div className="stamp"><Check size={28} /><span>Resolved</span></div>}
        <div className="dc-head">
          <h3 className="dc-title">{plainTitle(h)}</h3>
          <Pill tone={urgent ? "bad" : "warn"}>{h.priority === "normal" ? "Normal" : h.priority[0].toUpperCase() + h.priority.slice(1)}</Pill>
        </div>
        <div className="dc-meta muted small">{h.address ?? "No address"}<span className="dot">·</span>waiting {ago(h.created_at)}</div>

        <div className="dc-block">
          <div className="s-k">What is wrong</div>
          <p className="dc-p"><RichText text={lead(h.reason, 2, 240)} ticketId={h.ticket_id} notes={all} /></p>
        </div>
        {todo.length > 0 && (
          <div className="dc-block">
            <div className="s-k">What needs your judgement</div>
            <ol className="dc-steps">{todo.map((s, i) => <li key={i}><RichText text={s} ticketId={h.ticket_id} notes={all} /></li>)}</ol>
          </div>
        )}
        {docs.length > 0 && (
          <div className="dc-docs">
            {docs.slice(0, 4).map((f) => <EntityChip key={f.name} kind="file" icon={isImage(f.name) ? "image" : "file"} label={niceName(f.name)} title={f.name} onClick={() => env.openFile({ ticketId: h.ticket_id, file: f, hl: firstRef, notes: all })} />)}
          </div>
        )}

        <button className="link" onClick={() => setMore(!more)}><Chev open={more} /> Donna's notes</button>
        <Reveal open={more}>
          <dl className="facts notes">{notes.map(([k, v]) => <div key={k} style={{ display: "contents" }}><dt>{k}</dt><dd className="pre"><RichText text={String(v)} ticketId={h.ticket_id} notes={all} /></dd></div>)}</dl>
        </Reveal>

        <div className="row dc-act">
          <Button icon="open" onClick={() => onOpen(h.ticket_id)}>Open case</Button>
          {best && <Button icon={isImage(best.name) ? "image" : "file"} onClick={() => env.openFile({ ticketId: h.ticket_id, file: best, hl: firstRef, notes: all })}>View document</Button>}
          <ActionButton kind="message" ticketId={h.ticket_id} toast={toast} onDone={() => {}} />
          {money && <ActionButton kind="assign" ticketId={h.ticket_id} toast={toast} onDone={() => {}} />}
          <span className="grow" />
          <ActionButton kind="resolve" variant="primary" ticketId={h.ticket_id} queueId={h.id} toast={toast} onDone={() => onResolved(h.id)} />
        </div>
      </Card>
    </div></div>
  );
}

export default function Queue({ queue, onOpen, onResolved, toast }: { queue: any[]; onOpen: (id: number) => void; onResolved: () => void; toast: Notify }) {
  const [phase, setPhase] = useState<Record<number, "done" | "gone">>({});
  const left = queue.filter((h) => phase[h.id] !== "gone").length;
  const resolved = (id: number) => {
    setPhase((s) => ({ ...s, [id]: "done" }));
    setTimeout(() => setPhase((s) => ({ ...s, [id]: "gone" })), reduced() ? 100 : 900);
    setTimeout(onResolved, reduced() ? 200 : 1500);
  };
  return (
    <div className="page">
      <div className="page-inner" style={{ maxWidth: 820 }}>
        <div className="page-head"><div className="grow"><h1>Needs your judgement</h1><p>Things Donna could not close on her own. Decide, and she will remember how you did it.</p></div>{left > 0 && <Pill tone="accent">{left} waiting</Pill>}</div>
        {left === 0 && <EmptyState card title="Nothing needs you right now." hint="Donna will flag anything she cannot close." />}
        {queue.map((h) => <QueueCard key={h.id} h={h} phase={phase[h.id]} onOpen={onOpen} onResolved={resolved} toast={toast} />)}
      </div>
    </div>
  );
}
