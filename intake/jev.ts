import { JEV_MODEL, JEV_URL, getApiKey } from "./classify.ts";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Generic Jev call: returns the `answers` object. Retries on 429/5xx/network. */
export async function callJev(
  state: Record<string, unknown>,
  questions: Record<string, unknown>,
  opts: { retries?: number; apiKey?: string } = {},
): Promise<Record<string, unknown>> {
  const key = opts.apiKey ?? getApiKey();
  const body = JSON.stringify({ state, model: JEV_MODEL, questions });
  const retries = opts.retries ?? 2;
  for (let attempt = 0; ; attempt++) {
    let res: Response | undefined;
    try {
      res = await fetch(JEV_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body,
        signal: AbortSignal.timeout(20000),
      });
    } catch (e) {
      if (attempt >= retries) throw e;
    }
    if (res?.ok) {
      const json = (await res.json()) as { answers?: Record<string, unknown> };
      if (!json || typeof json.answers !== "object" || !json.answers) throw new Error(`Unexpected Jev response: ${JSON.stringify(json)?.slice(0, 300)}`);
      return json.answers;
    }
    if (res && res.status !== 429 && res.status < 500) throw new Error(`Jev HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
    if (attempt >= retries) throw new Error(`Jev failed after ${attempt + 1} attempts (HTTP ${res?.status ?? "network"})`);
    const ra = Number(res?.headers.get("retry-after"));
    await sleep(ra > 0 ? ra * 1000 : 500 * 2 ** attempt + Math.random() * 250);
  }
}
