import { all, one } from "./repo.ts";

/** Stages that commit the landlord's money or claim work is under way. */
export const SPEND_STAGES = new Set(["scheduling", "works", "closeout"]);

const NO_SPEND_CATEGORIES = new Set(["inspection_admin", "compliance"]);

export type GateResult = { ok: true; basis: string } | { ok: false; reason: string };

/**
 * Hard gate before Donna commits spend (assigning a contractor, moving to scheduling/works/closeout).
 * The model's judgement is not enough on its own: one of these must be on record.
 */
export function spendGate(ticketId: number): GateResult {
  const t = one<{ landlord_id: number | null; severity: string | null; category: string | null }>(
    "SELECT landlord_id, severity, category FROM tickets WHERE id=?",
    ticketId,
  );
  if (!t) return { ok: false, reason: `ticket ${ticketId} not found` };

  const approved = one<{ id: number }>("SELECT id FROM approvals WHERE ticket_id=? AND status='approved' ORDER BY id DESC LIMIT 1", ticketId);
  if (approved) return { ok: true, basis: `landlord approval #${approved.id} is approved` };

  if (t.landlord_id) {
    const facts = all<{ key: string; value: string }>(
      "SELECT key, value FROM profile_facts WHERE entity_type='contact' AND entity_id=? AND status='active'",
      t.landlord_id,
    );
    const standing = facts.find(
      (f) => (f.key === "pays_contractor_directly" && /^(true|yes)/i.test(f.value)) || f.key === "pre_approved_limit_gbp",
    );
    if (standing) return { ok: true, basis: `landlord standing authority on record (${standing.key}=${standing.value})` };
  }

  if (t.category && NO_SPEND_CATEGORIES.has(t.category)) return { ok: true, basis: `${t.category} work does not need landlord spend approval` };

  if (t.severity === "emergency") {
    const escalated = one<{ id: number }>(
      "SELECT id FROM human_queue WHERE ticket_id=? AND priority='high' ORDER BY id DESC LIMIT 1",
      ticketId,
    );
    if (escalated) return { ok: true, basis: `emergency, escalated to a human at high priority (queue #${escalated.id})` };
    return {
      ok: false,
      reason:
        "Emergency work without landlord approval is only allowed once the emergency has been escalated to a human at high priority (escalate_to_human with priority 'high'), so a person is accountable for the spend.",
    };
  }

  return {
    ok: false,
    reason:
      "No landlord approval or standing authority is on record for this ticket. Request approval with request_landlord_approval (or record the landlord's clear answer with record_approval_response) before assigning a contractor or moving the job into scheduling, works or close-out.",
  };
}
