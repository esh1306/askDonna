import { defineTool } from "eve/tools";
import { z } from "zod";
import { getTicketContext } from "../../crm/repo.ts";
import { listAttachments } from "../../crm/attachments.ts";
import { unwrap } from "../../crm/tool-util.ts";

export default defineTool({
  description:
    "Load everything the CRM knows about a ticket: the ticket and its stage, the property and its history of other jobs, " +
    "tenant/landlord/contractor profiles with their recorded facts (and any conflicting facts), recent events, open holds, " +
    "approvals, open human-queue items and the attachment names. Always call this first.",
  inputSchema: z.object({
    ticket_id: z.number().int().describe("CRM ticket id"),
    events: z.number().int().min(5).max(200).optional().describe("How many recent events to include (default 60)"),
  }),
  async execute({ ticket_id, events }) {
    const ctx = unwrap(getTicketContext(ticket_id, { events: events ?? 60 }));
    return { ...ctx, attachments: listAttachments(ticket_id) };
  },
});
