import { parseNoul } from "./classify.ts";
import { callJev } from "./jev.ts";

export const GUARD = {
  BLOCK: 0.7,
  CREDENTIALS: 0.5,
  /** approval_record: conditional/ambiguous approval blocks at this level */
  APPROVAL_AMBIGUOUS: 0.5,
} as const;

export type GuardKind = "message" | "approval_record";
export type GuardInput = { kind: GuardKind; text: string; recipientRole: string; context: string };
export type GuardResult = { blocked: boolean; reasons: string[]; probs: Record<string, number> };

export const GUARD_FIX: Record<string, string> = {
  claims_work_done_unverified: "claims work is done/booked/paid/approved without evidence in the records: rewrite without claiming completion; say only what is confirmed",
  promises_specific_date_unconfirmed: "promises a specific date/time not confirmed in the records: ask for availability or say it is to be confirmed",
  contains_credentials_or_bank_details: "asks for or contains credentials, key-safe codes or bank details: remove them",
  commits_landlord_money: "agrees a cost on the landlord's behalf: ask for approval instead of committing",
  approval_is_conditional_or_ambiguous: "the landlord's words are conditional or ambiguous: clarify with the landlord instead of recording approval",
};

export function buildGuardQuestions(kind: GuardKind) {
  const q: Record<string, unknown> = {
    claims_work_done_unverified: {
      type: "noul",
      instructions:
        "Does the outbound message state or imply that work is completed, a visit is booked, a payment has been made, or something has been approved, WITHOUT supporting evidence in the provided ticket context (events, approvals)? " +
        "Answer no if the context clearly confirms it, or if the message only requests, proposes or asks.",
    },
    promises_specific_date_unconfirmed: {
      type: "noul",
      instructions:
        "Does the message promise a specific date or time for a visit or completion that is not confirmed in the provided context? Asking for availability or proposing options to be confirmed is no.",
    },
    contains_credentials_or_bank_details: {
      type: "noul",
      instructions:
        "Does the message contain, or ask the recipient to provide, passwords, key-safe or door codes, security codes, or bank account / card details?",
    },
    commits_landlord_money: {
      type: "noul",
      instructions:
        "Does the message agree to, accept or commit to a cost on the landlord's behalf (e.g. 'I have approved 450 pounds for you') rather than asking the landlord to approve it or merely forwarding a quote?",
    },
  };
  if (kind === "approval_record") {
    q.approval_is_conditional_or_ambiguous = {
      type: "noul",
      instructions:
        "The text is the landlord's reply that an agent wants to record as an approval. Is the reply conditional (caps, 'if', 'but'), a question, or otherwise ambiguous rather than a clear unconditional yes?",
    };
  }
  return q;
}

export function evaluateGuard(probs: Record<string, number>): GuardResult {
  const reasons: string[] = [];
  for (const [k, p] of Object.entries(probs)) {
    const th = k === "contains_credentials_or_bank_details" ? GUARD.CREDENTIALS : k === "approval_is_conditional_or_ambiguous" ? GUARD.APPROVAL_AMBIGUOUS : GUARD.BLOCK;
    if (p >= th) reasons.push(`${k} (p=${p.toFixed(2)}): ${GUARD_FIX[k] ?? k}`);
  }
  return { blocked: reasons.length > 0, reasons, probs };
}

/** Fails OPEN: if Jev is unavailable, returns blocked:false with a "guard unavailable" reason. */
export async function checkOutbound(input: GuardInput, opts: { apiKey?: string } = {}): Promise<GuardResult> {
  try {
    const questions = buildGuardQuestions(input.kind);
    const state = {
      kind: input.kind,
      recipient_role: input.recipientRole,
      outbound_text: input.text,
      ticket_context: input.context.slice(0, 6000),
    };
    const answers = await callJev(state, questions, opts);
    const probs: Record<string, number> = {};
    for (const k of Object.keys(questions)) probs[k] = parseNoul(answers[k], k);
    return evaluateGuard(probs);
  } catch (e) {
    return { blocked: false, reasons: [`guard unavailable: ${(e as Error).message}`], probs: {} };
  }
}
