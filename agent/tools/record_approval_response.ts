import { defineTool } from "eve/tools";
import { z } from "zod";
import { getTicketContext, one, resolveApproval, type ApprovalRow } from "../../crm/repo.ts";
import { unwrap } from "../../crm/tool-util.ts";
import { checkOutbound } from "../../intake/guard.ts";
import { guardContext, guardFailure } from "../../intake/guard-context.ts";

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
    let guard: Awaited<ReturnType<typeof checkOutbound>> | undefined;
    if (decision === "approved") {
      const ap = one<ApprovalRow>("SELECT * FROM approvals WHERE id=?", approval_id);
      const ctx = ap ? getTicketContext(ap.ticket_id, { events: 15 }) : undefined;
      const context = ctx && ctx.ok ? guardContext(ctx) : "";
      guard = await checkOutbound({ kind: "approval_record", text: landlord_words, recipientRole: "landlord", context });
      if (guard.probs.approval_is_conditional_or_ambiguous >= 0.5) {
        throw new Error(
          `Not recorded: the landlord's words look conditional or ambiguous (p=${guard.probs.approval_is_conditional_or_ambiguous.toFixed(2)}). ` +
            "Ask the landlord to clarify (or escalate_to_human) instead of recording approval.",
        );
      }
    }
    return { ...unwrap(resolveApproval(approval_id, decision, landlord_words)), guard };
  },
});
