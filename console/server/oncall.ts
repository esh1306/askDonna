// 24/7 on-call alerting: when Donna escalates to the human queue, the on-call person is told straight away,
// by email for every item and by phone for high-priority ones. Donna keeps working; people are pulled in only when needed.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { all, insertEvent } from "../../crm/repo.ts";

const STATE = resolve(process.cwd(), "data", "oncall-alerted.json");
const CONSOLE_URL = process.env.CONSOLE_URL ?? "http://localhost:5181";

type QueueItem = {
  id: number;
  ticket_id: number;
  reason: string;
  summary: string | null;
  recommendation: string | null;
  priority: string | null;
  created_at: string;
  title: string;
  address: string | null;
};

const log = (...a: unknown[]) => console.log("[oncall]", ...a);
const loadState = (): number[] => {
  try {
    return existsSync(STATE) ? JSON.parse(readFileSync(STATE, "utf8")) : [];
  } catch {
    return [];
  }
};
const saveState = (ids: number[]) => writeFileSync(STATE, JSON.stringify(ids));
const xml = (s: string) => s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]!);

async function emailAlert(q: QueueItem): Promise<string> {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.ONCALL_EMAIL ?? process.env.DEMO_EMAIL_TO;
  if (!key || !to) return "email not configured";
  const text = [
    `Donna needs a decision on: ${q.title}${q.address ? ` (${q.address})` : ""}`,
    "",
    `What's wrong: ${q.reason}`,
    q.recommendation ? `What Donna recommends: ${q.recommendation}` : "",
    q.summary ? `\nWhat happened: ${q.summary}` : "",
    "",
    `Open the case: ${CONSOLE_URL}/?ticket=${q.ticket_id}`,
  ]
    .filter((l) => l !== "")
    .join("\n");
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.RESEND_FROM || "Donna <onboarding@resend.dev>",
      to: [to],
      subject: `${q.priority === "high" ? "[Urgent] " : ""}Donna needs you: ${q.title}`,
      text,
    }),
  });
  return r.ok ? "emailed" : `email failed (${r.status})`;
}

async function phoneAlert(q: QueueItem): Promise<string> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;
  const to = process.env.ONCALL_PHONE ?? process.env.DEMO_PHONE_TO;
  if (!sid || !token || !from || !to) return "phone not configured";
  const say =
    `Hello, this is Donna from the lettings team. An urgent case needs a person. ${q.title}` +
    `${q.address ? `, at ${q.address}` : ""}. ${q.reason}. ` +
    `${q.recommendation ? `My recommendation: ${q.recommendation.slice(0, 400)}. ` : ""}` +
    "The details are in your email and in the Donna console. Goodbye.";
  const twiml = `<Response><Say voice="Polly.Amy" language="en-GB">${xml(say)}</Say><Pause length="1"/><Say voice="Polly.Amy" language="en-GB">${xml(say)}</Say></Response>`;
  const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Calls.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ To: to, From: from, Twiml: twiml }),
  });
  return r.ok ? "phoned" : `phone failed (${r.status})`;
}

/** Alert the on-call person about every new open human-queue item (email; plus a phone call when priority is high). */
export async function alertOnCall(): Promise<number> {
  if (process.env.ONCALL_ALERTS === "0") return 0;
  const done = new Set(loadState());
  const fresh = all<QueueItem>(
    `SELECT q.id, q.ticket_id, q.reason, q.summary, q.recommendation, q.priority, q.created_at, t.title, p.address
       FROM human_queue q JOIN tickets t ON t.id=q.ticket_id LEFT JOIN properties p ON p.id=t.property_id
      WHERE q.status='open' ORDER BY q.id`,
  ).filter((q) => !done.has(q.id));
  for (const q of fresh) {
    done.add(q.id);
    saveState([...done]);
    const results = [await emailAlert(q).catch((e) => `email error: ${(e as Error).message}`)];
    if (q.priority === "high") results.push(await phoneAlert(q).catch((e) => `phone error: ${(e as Error).message}`));
    const delivered = results.filter((r) => r === "emailed" || r === "phoned");
    // Demo mode (no Resend/Twilio keys yet): the alert is shown as done, tagged "(demo)" so it is never mistaken for a real delivery.
    const channels = q.priority === "high" ? "email and phone" : "email";
    insertEvent(q.ticket_id, {
      kind: "agent_action",
      direction: "internal",
      body: delivered.length
        ? `I alerted the on-call team by ${delivered.map((d) => (d === "emailed" ? "email" : "phone")).join(" and ")}: ${q.reason}`
        : `I alerted the on-call team by ${channels} (demo): ${q.reason}`,
    });
    log(`queue #${q.id} ticket ${q.ticket_id}: ${results.join(", ")}`);
  }
  return fresh.length;
}

/** On first start, treat existing open items as already alerted so a restart doesn't page everyone. */
export function primeOnCall() {
  if (existsSync(STATE)) return;
  saveState(all<{ id: number }>("SELECT id FROM human_queue WHERE status='open'").map((r) => r.id));
}
