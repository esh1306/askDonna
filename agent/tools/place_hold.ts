import { defineTool } from "eve/tools";
import { z } from "zod";
import { placeHold } from "../../crm/repo.ts";
import { daysFromNow, unwrap } from "../../crm/tool-util.ts";

export default defineTool({
  description:
    "Put a ticket on hold while waiting for someone, with a follow-up date so it never goes silent. " +
    "Use when the next step depends on a reply from the landlord, tenant or contractor.",
  inputSchema: z.object({
    ticket_id: z.number().int(),
    reason: z.string().min(3),
    waiting_on: z.enum(["landlord", "tenant", "contractor", "agency", "other"]),
    follow_up_in_days: z.number().min(0.25).max(30).describe("When to chase if nothing arrives"),
  }),
  async execute({ ticket_id, reason, waiting_on, follow_up_in_days }) {
    return unwrap(placeHold(ticket_id, reason, waiting_on, daysFromNow(follow_up_in_days)));
  },
});
