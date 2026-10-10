import { defineTool } from "eve/tools";
import { z } from "zod";
import { getTicketContext, queueMessage, requestApproval } from "../../crm/repo.ts";
import { unwrap } from "../../crm/tool-util.ts";

export default defineTool({
  description:
    "Ask the landlord to approve work or a cost. Creates a pending approval in the CRM and contacts the landlord on their preferred channel: " +
    "'email' sends a message asking them to reply APPROVE or DECLINE; 'call' queues a voice call (the voice agent explains the job and records their decision). " +
    "Only one approval can be pending per ticket. Skip this when the landlord's profile has a pre-approved limit that covers the job, or for emergency safety work.",
  inputSchema: z.object({
    ticket_id: z.number().int(),
    summary: z.string().min(10).describe("The problem and the proposed fix, in one or two sentences"),
    amount_gbp: z.number().nonnegative().optional().describe("Quoted or estimated cost, only if known from the records"),
    channel: z.enum(["email", "call"]),
    message: z.string().min(20).describe("For email: the full email to the landlord. For call: the talking points for the voice agent."),
  }),
  async execute({ ticket_id, summary, amount_gbp, channel, message }) {
    const ctx = unwrap(getTicketContext(ticket_id, { events: 1 }));
    if (!ctx.landlord) throw new Error(`no landlord is recorded on ticket ${ticket_id}`);
    const approval = unwrap(requestApproval(ticket_id, summary, amount_gbp ?? null, channel));
    const subject = `Approval needed: ${ctx.ticket.title} (${ctx.ticket.case_ref})`;
    const msg = unwrap(queueMessage(ticket_id, channel, ctx.landlord.id, channel === "email" ? subject : "Voice call: approval", message));
    return { ...approval, message_id: msg.message_id, landlord: ctx.landlord.name };
  },
});
