import { parseChoice, parseNoul } from "./classify.ts";
import { callJev } from "./jev.ts";

export type ReplyRole = "landlord" | "tenant" | "contractor";

export const INTENTS = {
  landlord: {
    approve: "The landlord clearly agrees to the proposed work or cost.",
    decline: "The landlord refuses the work/cost or says they will arrange it themselves.",
    conditional_approval: "The landlord agrees but adds a condition, cap, or change (e.g. 'yes but max 150 pounds', 'only if...').",
    question: "The landlord asks a question or requests information before deciding.",
    other: "Anything else (unrelated, out of office, acknowledgement without a decision).",
  },
  contractor: {
    quote_or_estimate: "The contractor provides a price quote or estimate.",
    invoice: "The contractor sends or refers to an invoice or asks for payment.",
    completion_report: "The contractor reports the job is finished or describes work done.",
    scheduling: "The contractor proposes, confirms or changes a visit date/time.",
    cannot_attend: "The contractor cannot attend or declines the job.",
    question: "The contractor asks a question or needs more information.",
    other: "Anything else.",
  },
  tenant: {
    confirms_fixed: "The tenant says the problem is resolved.",
    still_broken: "The tenant says the problem persists or has returned.",
    access_or_availability: "The tenant gives access arrangements or availability.",
    new_issue: "The tenant reports a different, new problem.",
    complaint: "The tenant complains about service, delay or conduct.",
    question: "The tenant asks a question or wants an update.",
    other: "Anything else.",
  },
} as const;

export const AUTONOMY = {
  NEEDS_HUMAN_RESPONSE: 0.5,
  SAFETY_CONCERN: 0.5,
  DISSATISFIED: 0.6,
  /** intents that always go to a human */
  REVIEW_INTENTS: ["question", "complaint", "conditional_approval"] as readonly string[],
} as const;

export type ReplyInput = { text: string; role: ReplyRole; context?: string };
export type ReplyResult = {
  intent: string;
  intent_probs: Record<string, number>;
  needs_human_response: number;
  is_unconditional_approval: number | null;
  mentions_amount: number;
  safety_concern: number;
  dissatisfied: number;
};

export function buildReplyQuestions(role: ReplyRole) {
  const q: Record<string, unknown> = {
    intent: {
      type: "choice",
      instructions:
        `You read an inbound message to a UK residential lettings agency's maintenance desk, sent by a ${role}. ` +
        "Choose the single intent that best describes the message, using the context provided. A reply that agrees but attaches ANY condition, cap or amendment is a conditional approval, not a plain approval.",
      criteria: INTENTS[role],
    },
    needs_human_response: {
      type: "noul",
      instructions:
        "Would an agency staff member need to write a considered, personal reply to this message, rather than routine automated handling (recording a decision, acknowledging, scheduling)? " +
        "Answer yes for questions, negotiation, conditions, complaints, disputes, or anything unusual. Answer no for clear simple answers that only need recording.",
    },
    mentions_amount: { type: "noul", instructions: "Does the message mention a specific money amount or price limit?" },
    safety_concern: {
      type: "noul",
      instructions: "Does the message mention a risk to safety or serious damage (gas, electrics, flooding, fire, injury, insecure property)?",
    },
    dissatisfied: {
      type: "noul",
      instructions: "Does the sender sound annoyed, frustrated or dissatisfied with the agency, the delay or the service?",
    },
  };
  if (role === "landlord") {
    q.is_unconditional_approval = {
      type: "noul",
      instructions:
        "Is this a clear yes to the proposed work/cost with NO conditions, caps, caveats or open questions? 'Yes go ahead' or 'approved' is yes. 'Yes but max 150 pounds' or 'ok if cheaper' is no.",
    };
  }
  return q;
}

export function parseReply(answers: Record<string, unknown>, role: ReplyRole): ReplyResult {
  const keys = Object.keys(INTENTS[role]);
  const c = parseChoice(answers.intent, keys, "intent");
  return {
    intent: c.value,
    intent_probs: c.probs,
    needs_human_response: parseNoul(answers.needs_human_response, "needs_human_response"),
    is_unconditional_approval: role === "landlord" ? parseNoul(answers.is_unconditional_approval, "is_unconditional_approval") : null,
    mentions_amount: parseNoul(answers.mentions_amount, "mentions_amount"),
    safety_concern: parseNoul(answers.safety_concern, "safety_concern"),
    dissatisfied: parseNoul(answers.dissatisfied, "dissatisfied"),
  };
}

export async function classifyReply(input: ReplyInput, opts: { apiKey?: string } = {}): Promise<ReplyResult> {
  const state = { sender_role: input.role, context: input.context ?? "", message: input.text };
  return parseReply(await callJev(state, buildReplyQuestions(input.role), opts), input.role);
}

export function decideAutonomy(
  r: Pick<ReplyResult, "intent" | "needs_human_response" | "safety_concern" | "dissatisfied">,
): "auto" | "review" {
  const A = AUTONOMY;
  if (r.needs_human_response >= A.NEEDS_HUMAN_RESPONSE) return "review";
  if (r.safety_concern >= A.SAFETY_CONCERN) return "review";
  if (r.dissatisfied >= A.DISSATISFIED) return "review";
  if (A.REVIEW_INTENTS.includes(r.intent)) return "review";
  return "auto";
}
