import { z } from "zod";

export const DECISIONS = ["act", "wait", "request_info", "escalate", "no_action"] as const;

export const resultSchema = z.object({
  case_id: z.string().describe("Identifier of the case being processed"),
  decision: z.enum(DECISIONS).describe("Overall decision for this case"),
  summary: z.string().describe("2-4 sentence summary of what was decided and why"),
  case_type: z
    .enum(["maintenance", "maintenance_admin", "out_of_scope", "mixed", "safety_emergency"])
    .describe("What kind of case this is; out_of_scope means not a maintenance job (rent, deposit, legal, neighbour, other)"),
  judgement: z
    .object({
      why_this_decision: z.string().describe("The key evidence and reasoning behind the decision, citing events"),
      alternatives_considered: z
        .array(z.object({ option: z.string(), why_not: z.string() }))
        .describe("Other reasonable options (e.g. proceed, wait, escalate, do nothing) and why they were rejected"),
      checks_performed: z
        .array(z.string())
        .describe("Checks done before acting: e.g. approval status, amounts vs quote, payee, dates, safety, conflicting facts, duplicates"),
      assumptions: z.array(z.string()).describe("Assumptions made where information was missing"),
    })
    .describe("Make the judgement auditable for a reviewer"),
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
