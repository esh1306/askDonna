import { useRef, useState } from "react";
import { useConversation } from "@elevenlabs/react";
import { api } from "./api.ts";

export type CallInfo = {
  approval_id: number;
  landlord_name: string;
  property_address: string;
  job_summary: string;
  estimated_cost: string;
  job_ref: string;
  tenant_name: string;
};

export default function CallPanel({ info, onDone }: { info: CallInfo; onDone: () => void }) {
  const [lines, setLines] = useState<{ who: string; text: string }[]>([]);
  const [err, setErr] = useState("");
  const [recorded, setRecorded] = useState("");
  const transcript = useRef<string[]>([]);

  const conversation = useConversation({
    clientTools: {
      record_approval: async (p: any) => {
        try {
          const r = await api("/api/voice/approval", {
            method: "POST",
            body: { ...p, approval_id: info.approval_id, transcript: transcript.current.join("\n") },
          });
          setRecorded(`Recorded: ${p.decision}`);
          onDone();
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
      setLines((l) => [...l, { who, text: m.message }]);
    },
    onError: (e: any) => setErr(typeof e === "string" ? e : e?.message ?? "Voice error"),
    onDisconnect: () => onDone(),
  } as any);

  const status: string = (conversation as any).status;
  const live = status === "connected" || status === "connecting";

  async function start() {
    setErr("");
    setLines([]);
    transcript.current = [];
    setRecorded("");
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      const { token } = await api<{ token: string }>("/api/voice/token");
      await (conversation as any).startSession({
        conversationToken: token,
        connectionType: "webrtc",
        dynamicVariables: {
          landlord_name: info.landlord_name,
          agency_name: "Northbridge Lettings",
          property_address: info.property_address,
          job_summary: info.job_summary,
          estimated_cost: info.estimated_cost,
          job_ref: info.job_ref,
          tenant_name: info.tenant_name,
        },
      });
    } catch (e) {
      setErr((e as Error).message);
    }
  }

  return (
    <div className="panel call secondary">
      <h3>Browser call, landlord (approval {info.approval_id})</h3>
      <div className="muted small">
        Calling as {info.landlord_name}. Your browser will ask for microphone access; you play the landlord.
      </div>
      <div className="row">
        {!live ? (
          <button className="btn" onClick={start}>Start browser call</button>
        ) : (
          <button className="btn danger" onClick={() => (conversation as any).endSession()}>End call</button>
        )}
        <span className={`badge ${status === "connected" ? "pass" : "ran"}`}>{status ?? "disconnected"}</span>
        {(conversation as any).isSpeaking && live && <span className="muted small">Donna is speaking</span>}
      </div>
      {err && <div className="err small">{err}</div>}
      {recorded && <div className="good small">{recorded}</div>}
      {lines.length > 0 && (
        <div className="transcript">
          {lines.map((l, i) => (
            <div key={i} className={l.who === "Donna" ? "tl donna" : "tl"}>
              <b>{l.who}</b> {l.text}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
