// Usage: node practice/decision-points.ts
import fs from "node:fs";
import { loadCase } from "../crm/cases.ts";
import type { CaseEvent } from "../crm/case-types.ts";
import { DP_FILE, PRACTICE_DIR, type DecisionPoint } from "./common.ts";

const TRIGGERS: [string, RegExp][] = [
  ["check_response_return_to_auto", /Please check if we need to provide a response/i],
  ["message_received_review", /(Message|Email) received from (landlord|tenant)\b.*(review|proceed)/is],
  ["provider_email_unextracted", /expected data could not be extracted/i],
  ["no_response_review", /No landlord\/tenant response after/i],
  ["no_work_results", /No work results; we need to check/i],
  ["provider_reminders", /\d+\+? reminders have been sent to provider/i],
];
const INBOUND = /^(tenant|landlord|contractor|maintenance provider|juniper surveying|cedar homes)/i;
const isInbound = (e: CaseEvent) => INBOUND.test(e.from.trim()) || (!/agency|northbridge|system/i.test(e.from) && e.from.trim() !== "");
const isAgencyOutbound = (e: CaseEvent) =>
  /^(email|sms|call)$/i.test(e.channel.trim()) && /agency|northbridge|system/i.test(e.from);

function triggerOf(e: CaseEvent): string | null {
  if (!/update/i.test(e.channel)) return null;
  for (const [name, re] of TRIGGERS) if (re.test(e.body)) return name;
  return null;
}

const out: DecisionPoint[] = [];
const dist: Record<string, number> = {};
let noHandoff = 0;
for (let k = 1; k <= 50; k++) {
  const id = String(k).padStart(3, "0");
  const c = loadCase("Property Management", id);
  if (!c) continue;
  const h = c.history;
  const outcome = c.sections["Outcome"] ?? "";
  const hits: { idx: number; trigger: string }[] = [];
  h.forEach((e, i) => {
    const t = triggerOf(e);
    if (t) hits.push({ idx: i, trigger: t });
  });
  let picks: { cutoff: number; trigger: string }[] = [];
  // The handoff Update is usually logged just BEFORE the inbound message it refers to: include it.
  const withInbound = (idx: number) => {
    let c = idx + 1;
    while (c < h.length && isInbound(h[c]!) && c <= idx + 3) c++;
    return c;
  };
  if (hits.length) {
    picks.push({ cutoff: withInbound(hits[0]!.idx), trigger: hits[0]!.trigger });
    // a later one, at least 3 events after the first
    const later = [...hits].reverse().find((x) => x.idx > hits[0]!.idx + 2);
    if (later) picks.push({ cutoff: withInbound(later.idx), trigger: later.trigger });
  } else {
    noHandoff++;
    const firstIn = h.findIndex((e, i) => i > 0 && isInbound(e));
    const start = firstIn < 0 ? 0 : firstIn;
    const ob = h.findIndex((e, i) => i > start && isAgencyOutbound(e));
    picks.push({ cutoff: ob > 0 ? ob : Math.max(1, Math.floor(h.length / 2)), trigger: "no_handoff_before_first_agency_action" });
  }
  picks.forEach((p, j) => {
    let end = h.length;
    for (let i = p.cutoff; i < h.length; i++) {
      if (isInbound(h[i]!)) {
        end = i;
        break;
      }
    }
    const ref = h.slice(p.cutoff, end).map((e) => ({ n: e.n, timestamp: e.timestamp, channel: e.channel, from: e.from, to: e.to, body: e.body.slice(0, 1500) }));
    out.push({ id: `PM${id}-${j + 1}`, case: id, cutoff: p.cutoff, trigger: p.trigger, reference_events: ref, outcome });
    dist[p.trigger] = (dist[p.trigger] ?? 0) + 1;
  });
}
fs.mkdirSync(PRACTICE_DIR, { recursive: true });
fs.writeFileSync(DP_FILE, JSON.stringify(out, null, 2));
console.log(`Wrote ${out.length} decision points for ${new Set(out.map((d) => d.case)).size} cases (${noHandoff} cases without a handoff) -> ${DP_FILE}`);
for (const [k, v] of Object.entries(dist).sort((a, b) => b[1] - a[1])) console.log(`  ${String(v).padStart(3)}  ${k}`);
console.log(`  empty reference: ${out.filter((d) => !d.reference_events.length).length}`);
