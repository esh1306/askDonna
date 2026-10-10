// Delivery allowlist: Donna may only email or phone destinations listed in ALLOWED_EMAILS / ALLOWED_PHONES.
// Every real send (outbox email, approval call, on-call email/phone) passes through here. An empty allowlist
// blocks everything, so a misconfigured deployment can never contact a real tenant, landlord or contractor.

const list = (v: string | undefined) =>
  (v ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

/** UK-friendly E.164 normalisation: "+44 07733 011980" -> "+447733011980", "07733011980" -> "+447733011980". */
export function normalisePhone(p: string): string {
  let s = p.replace(/[^\d+]/g, "");
  if (s.startsWith("00")) s = "+" + s.slice(2);
  if (s.startsWith("+440")) s = "+44" + s.slice(4);
  if (s.startsWith("0")) s = "+44" + s.slice(1);
  return s;
}

const normEmail = (e: string) => e.trim().toLowerCase();

export function allowedEmails(): string[] {
  return list(process.env.ALLOWED_EMAILS).map(normEmail);
}
export function allowedPhones(): string[] {
  return list(process.env.ALLOWED_PHONES).map(normalisePhone);
}

export type Allowed = { ok: true; to: string } | { ok: false; reason: string };

export function checkEmail(to: string | undefined): Allowed {
  if (!to) return { ok: false, reason: "no destination email configured" };
  const allow = allowedEmails();
  if (!allow.length) return { ok: false, reason: "ALLOWED_EMAILS is empty: refusing to send any email" };
  const n = normEmail(to);
  return allow.includes(n) ? { ok: true, to: n } : { ok: false, reason: `blocked: ${n} is not on the email allowlist` };
}

export function checkPhone(to: string | undefined): Allowed {
  if (!to) return { ok: false, reason: "no destination phone configured" };
  const allow = allowedPhones();
  if (!allow.length) return { ok: false, reason: "ALLOWED_PHONES is empty: refusing to place any call" };
  const n = normalisePhone(to);
  return allow.includes(n) ? { ok: true, to: n } : { ok: false, reason: `blocked: ${n} is not on the phone allowlist` };
}
