import { defineTool } from "eve/tools";
import { z } from "zod";
import { escalate } from "../../crm/repo.ts";
import { unwrap } from "../../crm/tool-util.ts";

export default defineTool({
  description:
    "Hand the ticket to a human in the operations queue. Use for conflicting information, disputed or mismatched invoices, costs above what the landlord approved, " +
    "complaints, legal/tenancy/deposit/arrears matters, safety risks, vulnerable tenants, repeated non-response, failed actions you can't recover, or when you are unsure. " +
    "Write the handover so a person can act in one minute without re-reading the case.",
  inputSchema: z.object({
    ticket_id: z.number().int(),
    reason: z.string().min(5).describe("Why a human is needed, in one line"),
    summary: z.string().min(20).describe("What has happened so far"),
    checked: z.string().describe("What you verified and how (events, attachments, profile facts)"),
    uncertain: z.string().describe("What is unknown, conflicting or unverified"),
    recommendation: z.string().describe("The next step you recommend, and who should take it"),
    priority: z.enum(["low", "normal", "high"]),
  }),
  async execute(input) {
    const { ticket_id, ...rest } = input;
    return unwrap(escalate(ticket_id, rest));
  },
});
