import { z } from "zod";

export const DECISIONS = ["act", "wait", "request_info", "escalate", "no_action"] as const;

export const resultSchema = z.object({
  case_id: z.string().describe("Identifier of the case being processed"),
  decision: z.enum(DECISIONS).describe("Overall decision for this case"),
  summary: z.string().describe("2-4 sentence summary of what was decided and why"),
  situation: z.string().describe("Your understanding of the situation as received"),
  actions_taken: z
    .array(
      z.object({
        tool: z.string(),
        description: z.string().describe("What was done and why"),
        result: z.string().describe("What came back"),
        ok: z.boolean(),
      }),
    )
    .describe("Every action actually performed through tools; never list things not done"),
  approvals: z
    .array(
      z.object({
        party: z.string().describe("Who approval was sought from / granted by"),
        status: z.string().describe("e.g. requested, granted, declined, not_needed"),
        channel: z.string().describe("How (email, SMS, portal, ...)"),
      }),
    )
    .describe("Approvals requested or received"),
  escalation: z.object({
    needed: z.boolean(),
    reason: z.string(),
    handover_summary: z.string(),
    recommendation: z.string(),
  }),
  unverified: z.array(z.string()).describe("Facts or claims that could not be verified"),
  failures: z.array(z.string()).describe("Anything that failed (tools, lookups, sends)"),
  risks_or_red_flags: z.array(z.string()),
  final_status: z.string().describe("Status the case is left in"),
  next_follow_up: z
    .object({ when: z.string(), what: z.string() })
    .nullable()
    .describe("Next scheduled follow-up, or null if none"),
  confidence: z.number().min(0).max(1),
});

export type CaseResult = z.infer<typeof resultSchema>;

/** JSON Schema (draft 2020-12) to pass as `outputSchema` in the eve request body. */
export const resultJsonSchema = z.toJSONSchema(resultSchema) as Record<string, unknown>;
