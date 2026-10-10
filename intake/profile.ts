/** Deterministic landlord-profile rules + compact context builders for the intake layer. Pure functions: no network, no CRM import. */

export type FactLike = { key: string; value: string };

export type ApprovalDecision = { decided: true; needs: boolean; reason: string } | { decided: false };

const num = (v: string): number | null => {
  const m = v.replace(/,/g, "").match(/\d+(?:\.\d+)?/);
  return m ? Number(m[0]) : null;
};
const isTrue = (v: string) => /^\s*(true|yes|y)\b/i.test(v);
const get = (facts: FactLike[], key: string) => facts.filter((f) => f.key === key).map((f) => f.value);

/**
 * Decide landlord approval from recorded landlord facts, before asking Jev.
 * - an estimate above the lowest recorded cap (pre_approved_limit_gbp / call_before_spend_above_gbp) -> approval needed.
 * - `pays_contractor_directly` = true (if the value names job types, `jobType` must match) -> no approval step.
 * - an estimate within a recorded cap -> no approval step.
 * Otherwise (no facts, or a limit but no estimate) undecided: Jev answers.
 */
export function approvalFromProfile(facts: FactLike[] | undefined, estimate?: number | null, jobType?: string): ApprovalDecision {
  if (!facts?.length) return { decided: false };
  const est = typeof estimate === "number" && Number.isFinite(estimate) && estimate >= 0 ? estimate : null;
  const caps = [
    ...get(facts, "pre_approved_limit_gbp").map((v) => ({ key: "pre_approved_limit_gbp", v: num(v) })),
    ...get(facts, "call_before_spend_above_gbp").map((v) => ({ key: "call_before_spend_above_gbp", v: num(v) })),
  ].filter((c): c is { key: string; v: number } => c.v !== null);

  if (est !== null && caps.length) {
    const low = caps.reduce((a, b) => (b.v < a.v ? b : a));
    if (est > low.v) return { decided: true, needs: true, reason: `estimate £${est} exceeds recorded ${low.key} £${low.v}` };
  }
  for (const v of get(facts, "pays_contractor_directly")) {
    if (!isTrue(v)) continue;
    const rest = v.replace(/^\s*(true|yes|y)\b[\s:,;-]*/i, "").trim();
    const generic = !rest || /^\(?\s*(all|any|always)/i.test(rest);
    const typed = !!jobType && !!rest && rest.toLowerCase().includes(jobType.toLowerCase().split("_")[0]);
    if (generic || typed) return { decided: true, needs: false, reason: `landlord pays contractor directly${generic ? "" : ` (${rest})`}` };
  }
  if (est !== null && caps.length) {
    const high = caps.reduce((a, b) => (b.v > a.v ? b : a));
    return { decided: true, needs: false, reason: `estimate £${est} within recorded ${high.key} £${high.v}` };
  }
  return { decided: false };
}

const clip = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + "…" : s);
const factStr = (f: FactLike[] | undefined) => (f ?? []).map((x) => `${x.key}=${clip(x.value, 120)}`).join("; ");

/** Compact profile text (<= max chars): landlord, tenant and property facts. Empty string when nothing is recorded. */
export function buildProfile(
  c: { landlord?: { facts: FactLike[] } | null; tenant?: { facts: FactLike[] } | null; property?: { facts: FactLike[] } | null },
  max = 1200,
): string {
  const parts: string[] = [];
  const l = factStr(c.landlord?.facts);
  const t = factStr(c.tenant?.facts);
  const p = factStr(c.property?.facts);
  if (l) parts.push(`Landlord facts: ${l}`);
  if (t) parts.push(`Tenant facts: ${t}`);
  if (p) parts.push(`Property facts: ${p}`);
  return clip(parts.join("\n"), max);
}

/** Short list of prior jobs at the property (<= n entries, <= 120 chars each). */
export function buildHistory(h: { title: string; category?: string | null; status?: string | null }[] | undefined, n = 5): string[] {
  return (h ?? []).slice(-n).map((x) => clip(`${x.title}${x.category ? ` [${x.category}]` : ""}${x.status ? ` (${x.status})` : ""}`, 120));
}
