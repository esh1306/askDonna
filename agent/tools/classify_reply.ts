import { defineTool } from "eve/tools";
import { z } from "zod";
import { classifyReply, decideAutonomy } from "../../intake/reply.ts";
import { getTicketContext } from "../../crm/repo.ts";
import { unwrap } from "../../crm/tool-util.ts";

export default defineTool({
  description:
    "Classify an inbound message from a landlord, tenant or contractor with Jev, a calibrated classifier: intent, and probabilities that it needs a considered human reply, " +
    "is an unconditional approval (landlord), mentions an amount, raises a safety concern or shows dissatisfaction. Returns a suggested autonomy ('auto' or 'review'). " +
    "Call it on each new inbound message. Treat the output as calibrated evidence, not the decision: 'review' means a person should check whether a reply is needed before you act automatically.",
  inputSchema: z.object({
    ticket_id: z.number().int().optional().describe("If given, pending approvals on the ticket are added as context"),
    text: z.string().min(1).describe("The inbound message text"),
    sender_role: z.enum(["landlord", "tenant", "contractor"]),
    context: z.string().optional().describe("Short context, e.g. the pending approval summary and amount"),
  }),
  async execute({ ticket_id, text, sender_role, context }) {
    let ctxText = context ?? "";
    if (ticket_id != null) {
      const ctx = unwrap(getTicketContext(ticket_id, { events: 1 }));
      const pending = ctx.approvals.filter((a) => a.status === "pending");
      if (pending.length) ctxText += ` Pending approval: ${pending.map((a) => `${a.summary ?? ""} (GBP ${a.amount_gbp ?? "unknown"})`).join("; ")}.`;
      ctxText += ` Ticket: ${ctx.ticket.title}.`;
    }
    const r = await classifyReply({ text, role: sender_role, context: ctxText.trim() });
    return { autonomy: decideAutonomy(r), ...r };
  },
});
