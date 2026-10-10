import { parseNoul } from "./classify.ts";
import { callJev } from "./jev.ts";

export const CONSENT_THRESHOLD = 0.7;

/** Is this transcript a clear, unconditional landlord approval of the proposed work/cost? */
export async function checkConsent(transcriptText: string, opts: { apiKey?: string } = {}): Promise<{ ok: boolean; p: number }> {
  const answers = await callJev(
    { transcript: transcriptText.slice(0, 8000) },
    {
      clear_unconditional_approval: {
        type: "noul",
        instructions:
          "This is a transcript of a conversation between a lettings agency and a landlord. Did the landlord give a clear, unconditional approval of the proposed work and cost? " +
          "Answer no if they declined, hesitated, set a cap or condition, asked unanswered questions, or never clearly agreed.",
      },
    },
    opts,
  );
  const p = parseNoul(answers.clear_unconditional_approval, "clear_unconditional_approval");
  return { ok: p >= CONSENT_THRESHOLD, p };
}
