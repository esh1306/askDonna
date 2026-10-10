import { defineTool } from "eve/tools";
import { z } from "zod";
import { getTicketContext, queueMessage } from "../../crm/repo.ts";
import { unwrap } from "../../crm/tool-util.ts";

export default defineTool({
  description:
    "Send a message to the tenant, landlord or contractor on this ticket by email or SMS. It is placed in the CRM outbox for delivery. " +
    "Include the property address and job reference. Never state that work is done, booked, approved or paid unless the records confirm it.",
  inputSchema: z.object({
    ticket_id: z.number().int(),
    to: z.enum(["tenant", "landlord", "contractor"]),
    channel: z.enum(["email", "sms"]),
    subject: z.string().optional(),
    body: z.string().min(10),
  }),
  async execute({ ticket_id, to, channel, subject, body }) {
    const ctx = unwrap(getTicketContext(ticket_id, { events: 1 }));
    const contact = ctx[to];
    if (!contact) throw new Error(`no ${to} is recorded on ticket ${ticket_id}`);
    return unwrap(queueMessage(ticket_id, channel, contact.id, subject ?? null, body));
  },
});
