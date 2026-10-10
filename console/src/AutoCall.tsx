import { useEffect, useRef, useState } from "react";
import { useConversation } from "@elevenlabs/react";
import { api, nm } from "./api.ts";
import type { Detail } from "./api.ts";
import { Button, DonnaMark } from "./components/index.ts";

const KEY = "donna.autocalls";
const loadStarted = (): number[] => { try { return JSON.parse(localStorage.getItem(KEY) ?? "[]"); } catch { return []; } };
const markStarted = (id: number) => { try { localStorage.setItem(KEY, JSON.stringify([...loadStarted(), id].slice(-200))); } catch {} };

type Info = { approval_id: number; landlord_name: string; property_address: string; job_summary: string; estimated_cost: string; job_ref: string; tenant_name: string };

/** Starts the browser voice session automatically after a Donna run queues a call; presenter plays the landlord. */
export default function AutoCall({ d, armed, disarm, onChange }: { d: Detail | null; armed: number | null; disarm: () => void; onChange: () => void }) {
  const started = useRef(new Set<number>(loadStarted()));
  const [info, setInfo] = useState<Info | null>(null);
  const [phase, setPhase] = useState<"idle" | "queued" | "mic" | "live" | "done">("idle");
  const [line, setLine] = useState("");
  const [err, setErr] = useState("");
  const [outcome, setOutcome] = useState("");
  const transcript = useRef<string[]>([]);
  const infoRef = useRef<Info | null>(null);
  infoRef.current = info;

  const conversation: any = useConversation({
    clientTools: {
      record_approval: async (p: any) => {
        const cur = infoRef.current;
        try {
          await api("/api/voice/approval", { method: "POST", body: { ...p, approval_id: cur?.approval_id, transcript: transcript.current.join("\n") } });
          setOutcome(`Recorded: ${p.decision}`);
          onChange();
          return "Recorded";
        } catch (e) {
          setErr((e as Error).message);
          return "Failed to record, please note the decision verbally";
        }
      },
    },
    onMessage: (m: any) => {
      const who = m.role === "agent" || m.source === "ai" ? "Donna" : "Landlord";
      transcript.current.push(`${who}: ${m.message}`);
      setLine(`${who}: ${m.message}`);
    },
    onError: (e: any) => setErr(typeof e === "string" ? e : e?.message ?? "Voice error"),
    onDisconnect: () => { setPhase((p) => (p === "live" ? "done" : p)); onChange(); },
  } as any);

  async function begin(i: Info) {
    setErr(""); setLine(""); setOutcome(""); transcript.current = [];
    let token = "";
    try {
      token = (await api<{ token: string }>("/api/voice/token")).token;
    } catch (e) {
      const msg = (e as Error).message;
      if (/not configured|503/i.test(msg)) { setPhase("queued"); return; }
      setErr(msg); setPhase("queued"); return;
    }
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch { setPhase("mic"); return; }
    try {
      setPhase("live");
      await conversation.startSession({
        conversationToken: token, connectionType: "webrtc",
        dynamicVariables: { landlord_name: i.landlord_name, agency_name: "Northbridge Lettings", property_address: i.property_address, job_summary: i.job_summary, estimated_cost: i.estimated_cost, job_ref: i.job_ref, tenant_name: i.tenant_name },
      });
    } catch (e) { setErr((e as Error).message); setPhase("mic"); }
  }

  useEffect(() => {
    if (!d || armed !== d.ticket.id) return;
    const a = d.approvals.find((x) => x.status === "pending" && (x.channel === "call" || false)) ??
      (d.outbox.some((o) => o.channel === "call" && o.status === "queued") ? d.approvals.find((x) => x.status === "pending") : undefined);
    if (!a) return;
    disarm();
    if (started.current.has(a.id)) return;
    started.current.add(a.id); markStarted(a.id);
    const i: Info = {
      approval_id: a.id, landlord_name: nm(d.landlord?.name), property_address: d.property?.address ?? "the property",
      job_summary: a.summary ?? d.ticket.title, estimated_cost: a.amount_gbp != null ? `${a.amount_gbp} pounds` : "not confirmed",
      job_ref: d.ticket.case_ref, tenant_name: d.tenant?.name ?? "the tenant",
    };
    setInfo(i); setPhase("idle");
    begin(i);
  }, [d, armed]);

  if (!info || phase === "idle") return null;
  const live = phase === "live";
  return (
    <div className="callcard" role="status">
      <div className="cc-head">
        <DonnaMark size={26} className={live ? "pulse" : ""} />
        <div className="grow">
          <b>{phase === "done" ? "Call finished" : phase === "queued" ? "Call queued" : live ? `Donna is on a call with ${info.landlord_name}` : `Donna is calling ${info.landlord_name}…`}</b>
          <div className="muted small">{phase === "queued" ? "Will dial when phone is configured." : live ? (conversation.isSpeaking ? "Donna is speaking" : "Listening") : phase === "done" ? outcome || "Ended" : ""}</div>
        </div>
        {live && <Button size="sm" variant="danger" onClick={() => conversation.endSession()}>End call</Button>}
        {(phase === "queued" || phase === "done") && <button className="icon-btn" aria-label="Dismiss" onClick={() => setInfo(null)}>×</button>}
      </div>
      {phase === "mic" && <Button variant="accent" onClick={() => begin(info)}>Allow microphone to let Donna call</Button>}
      {live && line && <div className="cc-line small">{line}</div>}
      {outcome && phase !== "done" && <div className="good small">{outcome}</div>}
      {err && <div className="err small">{err}</div>}
    </div>
  );
}
