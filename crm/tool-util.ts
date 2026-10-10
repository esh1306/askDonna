/** CRM functions return {ok:false,error} for business errors; tools throw so the failure shows up in the run log. */
export function unwrap<T extends { ok: boolean }>(r: T): Extract<T, { ok: true }> {
  if (!r.ok) throw new Error((r as unknown as { error: string }).error);
  return r as Extract<T, { ok: true }>;
}

export const daysFromNow = (days: number) => new Date(Date.now() + days * 864e5).toISOString();
