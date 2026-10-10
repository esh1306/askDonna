import { defineTool } from "eve/tools";
import { z } from "zod";
import { getTicketContext } from "../../crm/repo.ts";
import { markUsed, recallLessons } from "../../crm/lessons.ts";
import { unwrap } from "../../crm/tool-util.ts";

export default defineTool({
  description:
    "Recall how the team handled similar situations before (lessons learned from human operators). Call this before deciding; follow a lesson when it fits, cite its id in your reasoning, and say when you deviate.",
  inputSchema: z.object({
    ticket_id: z.number().int(),
    situation_text: z.string().min(3).describe("One or two sentences on the current situation (what just happened, what is being decided)"),
    trigger: z
      .string()
      .optional()
      .describe("landlord_reply, tenant_reply, contractor_reply, contractor_completion, invoice_received, quote_received, no_response, reminders, extraction_failed or new_request"),
  }),
  async execute({ ticket_id, situation_text, trigger }) {
    const ctx = unwrap(getTicketContext(ticket_id, { events: 1 }));
    const hits = recallLessons({ text: situation_text, stage: ctx.ticket.stage, category: ctx.ticket.category, trigger: trigger ?? null });
    markUsed(hits.map((h) => h.id));
    return {
      ok: true,
      count: hits.length,
      lessons: hits.map((h) => ({ id: h.id, situation: h.situation, action: h.action, rationale: h.rationale, source: h.source, weight: h.weight, score: h.score })),
    };
  },
});
