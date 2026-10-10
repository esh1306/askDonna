import type { TicketContext } from "../crm/repo.ts";

/** Compact ticket evidence (recent events + approvals) for the outbound guard, <= maxChars. */
export function guardContext(ctx: TicketContext, maxChars = 5800): string {
  const head = `ticket ${ctx.ticket.case_ref}: ${ctx.ticket.title} | stage=${ctx.ticket.stage} status=${ctx.ticket.status}`;
  const approvals = ctx.approvals.length
    ? ctx.approvals.map((a) => `approval#${a.id} ${a.status} amount=${a.amount_gbp ?? "n/a"} ${a.summary ?? ""} ${a.response_text ? `response: ${a.response_text}` : ""}`).join("\n")
    : "no approvals recorded";
  const lines = ctx.events.map((e) => `[${e.ts.slice(0, 16)}] ${e.kind}/${e.direction}/${e.party ?? ""}: ${(e.body ?? "").replace(/\s+/g, " ").slice(0, 400)}`);
  const budget = maxChars - head.length - approvals.length - 40;
  // keep the most recent events that fit
  const kept: string[] = [];
  let used = 0;
  for (let i = lines.length - 1; i >= 0; i--) {
    if (used + lines[i].length + 1 > budget) break;
    kept.unshift(lines[i]);
    used += lines[i].length + 1;
  }
  return `${head}\nAPPROVALS:\n${approvals}\nRECENT EVENTS (oldest first):\n${kept.join("\n") || "none"}`.slice(0, maxChars);
}

export function guardFailure(kind: string, reasons: string[]): Error {
  return new Error(
    `Blocked by Jev outbound guard (${kind}). ${reasons.join(" | ")}. Rewrite the text to fix this and retry, or escalate_to_human if you cannot.`,
  );
}
