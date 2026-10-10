import { defineTool } from "eve/tools";
import { z } from "zod";
import { classifyIntake, decideRoute } from "../../intake/classify.ts";
import { getTicketContext, run } from "../../crm/repo.ts";
import { approvalFromProfile, buildHistory, buildProfile } from "../../intake/profile.ts";
import { unwrap } from "../../crm/tool-util.ts";

export default defineTool({
  description:
    "Classify a maintenance request with Jev, a calibrated classifier: category, severity (routine/urgent/emergency), and probabilities that it " +
    "needs landlord approval, is safely self-fixable by the tenant, is a safety risk, or needs more information. Returns a suggested route. " +
    "Use it at intake or when a new problem is reported. Treat the probabilities as evidence, not as the decision.",
  inputSchema: z.object({
    ticket_id: z.number().int(),
    estimate_gbp: z.number().optional().describe("Known quote/estimate for the job in GBP; lets the landlord's recorded spend limits decide approval"),
    text: z.string().optional().describe("The report to classify; defaults to the ticket's description"),
  }),
  async execute({ ticket_id, text, estimate_gbp }) {
    const ctx = unwrap(getTicketContext(ticket_id, { events: 1 }));
    const request = text ?? ctx.ticket.description ?? ctx.ticket.title;
    const profile = buildProfile(ctx);
    const history = buildHistory(ctx.history_for_property);
    const r = await classifyIntake({ request, property: ctx.property?.address, reporter_role: "tenant", profile: profile || undefined, history });
    const rule = approvalFromProfile(ctx.landlord?.facts, estimate_gbp, r.category);
    const approval_source = rule.decided ? "profile_rule" : "jev";
    const needs_landlord_approval = rule.decided ? (rule.needs ? 1 : 0) : r.needs_landlord_approval;
    const route = decideRoute({ ...r, needs_landlord_approval });
    if (!ctx.ticket.category) run("UPDATE tickets SET category=? WHERE id=?", r.category, ticket_id);
    // "emergency" unlocks emergency handling, so only persist it when Jev is confident; otherwise store the next level down.
    const confidentEmergency = (r.severity_probs?.emergency ?? 0) >= 0.6 || r.safety_risk >= 0.75;
    const storedSeverity = r.severity === "emergency" && !confidentEmergency ? "urgent" : r.severity;
    if (!ctx.ticket.severity) run("UPDATE tickets SET severity=? WHERE id=?", storedSeverity, ticket_id);
    const { raw: _raw, ...answers } = r;
    return {
      route,
      ...answers,
      needs_landlord_approval,
      needs_landlord_approval_jev: r.needs_landlord_approval,
      approval_source,
      approval_rule: rule,
      profile_used: Boolean(profile),
    };
  },
});
