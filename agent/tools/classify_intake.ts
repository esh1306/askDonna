import { defineTool } from "eve/tools";
import { z } from "zod";
import { classifyIntake, decideRoute } from "../../intake/classify.ts";
import { getTicketContext, run } from "../../crm/repo.ts";
import { unwrap } from "../../crm/tool-util.ts";

export default defineTool({
  description:
    "Classify a maintenance request with Jev, a calibrated classifier: category, severity (routine/urgent/emergency), and probabilities that it " +
    "needs landlord approval, is safely self-fixable by the tenant, is a safety risk, or needs more information. Returns a suggested route. " +
    "Use it at intake or when a new problem is reported. Treat the probabilities as evidence, not as the decision.",
  inputSchema: z.object({
    ticket_id: z.number().int(),
    text: z.string().optional().describe("The report to classify; defaults to the ticket's description"),
  }),
  async execute({ ticket_id, text }) {
    const ctx = unwrap(getTicketContext(ticket_id, { events: 1 }));
    const request = text ?? ctx.ticket.description ?? ctx.ticket.title;
    const r = await classifyIntake({ request, property: ctx.property?.address, reporter_role: "tenant" });
    const route = decideRoute(r);
    if (!ctx.ticket.category) run("UPDATE tickets SET category=? WHERE id=?", r.category, ticket_id);
    if (!ctx.ticket.severity) run("UPDATE tickets SET severity=? WHERE id=?", r.severity, ticket_id);
    const { raw: _raw, ...answers } = r;
    return { route, ...answers };
  },
});
