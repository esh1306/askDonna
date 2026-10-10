import { defineTool } from "eve/tools";
import { z } from "zod";
import { getTicketContext, insertEvent, linkContact, logAction, moveStage, run, upsertContact } from "../../crm/repo.ts";
import { unwrap } from "../../crm/tool-util.ts";
import { spendGate } from "../../crm/gates.ts";

export default defineTool({
  description:
    "Assign a maintenance provider (contractor) to the ticket once the work is approved or within the landlord's authority, and move it to scheduling. " +
    "Prefer the contractor the landlord named, then one already on the ticket or used before at this property. " +
    "After assigning, notify the contractor (job details, address, reference, tenant availability) and the tenant (who will be in touch) with send_message.",
  inputSchema: z.object({
    ticket_id: z.number().int(),
    contractor_name: z.string().min(2).describe("Person or company, as named in the records"),
    company: z.string().optional(),
    reason: z.string().min(5).describe("Why this provider and why now (e.g. 'landlord approved in event 12 and asked for Imogen')"),
  }),
  async execute({ ticket_id, contractor_name, company, reason }) {
    const gate = spendGate(ticket_id);
    if (!gate.ok) throw new Error(`Contractor not assigned: ${gate.reason}`);
    const ctx = unwrap(getTicketContext(ticket_id, { events: 1 }));
    const contact = unwrap(upsertContact({ role: "contractor", name: contractor_name, company: company ?? null }));
    if (ctx.ticket.property_id) linkContact(ctx.ticket.property_id, contact.contact_id, "contractor");
    run("UPDATE tickets SET contractor_id=?, updated_at=? WHERE id=?", contact.contact_id, new Date().toISOString(), ticket_id);
    insertEvent(ticket_id, { kind: "agent_action", direction: "internal", body: `Maintenance provider assigned: ${contractor_name}${company ? ` (${company})` : ""}. ${reason}` });
    logAction(ticket_id, "agent", "assign_contractor", { contractor_name, company, reason }, { contact_id: contact.contact_id }, true);
    const order = ["intake", "landlord_approval", "provider_selection", "scheduling"];
    const stage =
      order.indexOf(ctx.ticket.stage) >= 0 && order.indexOf(ctx.ticket.stage) < order.indexOf("scheduling")
        ? unwrap(moveStage(ticket_id, "scheduling", `Provider assigned: ${contractor_name}`)).to
        : ctx.ticket.stage;
    return { ok: true, contractor_id: contact.contact_id, stage };
  },
});
