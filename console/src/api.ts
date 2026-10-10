export async function api<T = any>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const res = await fetch(path, {
    method: init?.method ?? "GET",
    headers: init?.body ? { "content-type": "application/json" } : undefined,
    body: init?.body ? JSON.stringify(init.body) : undefined,
  });
  const text = await res.text();
  let json: any = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { error: text };
  }
  if (!res.ok) throw new Error(json.error ?? `Request failed (${res.status})`);
  return json as T;
}

export const STAGES = ["intake", "landlord_approval", "provider_selection", "scheduling", "works", "closeout", "closed"] as const;
export const label = (s: string | null | undefined) => (s ? s.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase()) : "");

export type TicketRow = {
  id: number; case_ref: string; title: string; category: string | null; severity: string | null;
  stage: string; status: string; address: string | null;
  pending_approvals: number; open_escalations: number; queued_outbox: number;
};
export type Fact = { id: number; key: string; value: string; status: string; source_ref: string | null };
export type Party = { id: number; name: string; role?: string; company?: string | null; email?: string | null; phone?: string | null; facts: Fact[] } | null;
export type Approval = { id: number; summary: string | null; amount_gbp: number | null; channel: string | null; status: string; response_text: string | null; requested_at: string };
export type Detail = {
  ticket: { id: number; case_ref: string; title: string; description: string | null; stage: string; status: string; category: string | null; severity: string | null };
  property: (Party & { address: string; notes: string | null }) | null;
  tenant: Party; landlord: Party; contractor: Party;
  events: { id: number; ts: string; kind: string; direction: string; party: string | null; body: string | null }[];
  open_holds: { id: number; reason: string | null; waiting_on: string | null; follow_up_at: string | null }[];
  approvals: Approval[];
  outbox: { id: number; channel: string; to_label: string | null; subject: string | null; body: string; status: string; error?: string | null }[];
  action_log: { id: number; actor: string; action: string; ok: number; ts: string }[];
  runs: { file: string; ts: string; result?: any; error?: string; events?: any[]; sessionId?: string; message: string }[];
};

export type Lesson = {
  id: number; situation: string; trigger: string | null; stage: string | null; category: string | null;
  action: string; rationale: string; source: "dataset" | "human" | "feedback"; source_ref: string | null;
  weight: number; uses: number; created_at: string;
};
export const when = (ts: string) => new Date(ts).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export async function humanAction(ticketId: number, action: string, details: Record<string, unknown>, note: string | undefined, toast: (lead: string, lesson?: string) => void) {
  const out = await api<{ lesson: Lesson | null; learn_error?: string }>(`/api/tickets/${ticketId}/human-action`, { method: "POST", body: { action, details, note } });
  if (out.lesson) toast("Logged.", out.lesson.action);
  else toast(`Logged.${out.learn_error ? " Lesson not saved: " + out.learn_error : ""}`);
}

export const ago = (ts: string) => {
  const m = Math.max(0, Math.round((Date.now() - new Date(ts).getTime()) / 60000));
  if (m < 60) return `${m || 1} min`;
  const h = Math.round(m / 60);
  return h < 48 ? `${h} h` : `${Math.round(h / 24)} days`;
};
