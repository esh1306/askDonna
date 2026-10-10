import { defineTool } from "eve/tools";
import { z } from "zod";
import { moveStage } from "../../crm/repo.ts";
import { unwrap } from "../../crm/tool-util.ts";

export default defineTool({
  description:
    "Move a ticket to a new pipeline stage: intake → landlord_approval → provider_selection → scheduling → works → closeout → closed. " +
    "Any stage can go to paused (e.g. property not tenanted) or closed. Only move forward when the evidence supports it.",
  inputSchema: z.object({
    ticket_id: z.number().int(),
    to: z.enum(["intake", "landlord_approval", "provider_selection", "scheduling", "works", "closeout", "closed", "paused"]),
    reason: z.string().min(5).describe("The evidence for the move, citing events"),
  }),
  async execute({ ticket_id, to, reason }) {
    return unwrap(moveStage(ticket_id, to, reason));
  },
});
