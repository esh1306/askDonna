import { defineTool } from "eve/tools";
import { z } from "zod";
import { moveStage } from "../../crm/repo.ts";
import { SPEND_STAGES, spendGate } from "../../crm/gates.ts";
import { unwrap } from "../../crm/tool-util.ts";

export default defineTool({
  description:
    "Move a ticket to a new pipeline stage: intake → landlord_approval → provider_selection → scheduling → works → closeout → closed. " +
    "Any stage can go to paused (e.g. property not tenanted) or closed. Only move forward when the evidence supports it. " +
    "Moving into scheduling, works or closeout requires a landlord approval or standing authority on record (or an emergency already escalated to a human); otherwise the move is refused.",
  inputSchema: z.object({
    ticket_id: z.number().int(),
    to: z.enum(["intake", "landlord_approval", "provider_selection", "scheduling", "works", "closeout", "closed", "paused"]),
    reason: z.string().min(5).describe("The evidence for the move, citing events"),
  }),
  async execute({ ticket_id, to, reason }) {
    if (SPEND_STAGES.has(to)) {
      const gate = spendGate(ticket_id);
      if (!gate.ok) throw new Error(`Move to '${to}' refused: ${gate.reason}`);
      return { ...unwrap(moveStage(ticket_id, to, `${reason} [gate: ${gate.basis}]`)), gate: gate.basis };
    }
    return unwrap(moveStage(ticket_id, to, reason));
  },
});
