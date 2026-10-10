import { defineTool } from "eve/tools";
import { z } from "zod";
import { resolveApproval } from "../../crm/repo.ts";
import { unwrap } from "../../crm/tool-util.ts";

export default defineTool({
  description:
    "Record the landlord's answer to a pending approval, from their email reply or call. Only use 'approved' or 'rejected' when the landlord " +
    "clearly said so; if the reply is ambiguous, conditional or asks a question, do not resolve it: reply to the landlord or escalate instead.",
  inputSchema: z.object({
    approval_id: z.number().int(),
    decision: z.enum(["approved", "rejected", "expired"]),
    landlord_words: z.string().describe("The landlord's actual words, quoted, with the event they came from"),
  }),
  async execute({ approval_id, decision, landlord_words }) {
    return unwrap(resolveApproval(approval_id, decision, landlord_words));
  },
});
