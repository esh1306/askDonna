import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Minimal raw-fetch client for a running eve server (docs/concepts/sessions-runs-and-streaming.md).
// Raw fetch (not eve/client) so the recorded events are exactly what the server emitted.

export interface EveEvent {
  type: string;
  data?: Record<string, any>;
  meta?: { id?: string; at?: string };
  [k: string]: unknown;
}

export interface RunTurnOptions {
  outputSchema?: Record<string, unknown>;
  baseUrl?: string;
  /** Overall timeout for the turn in ms (default 20 min). */
  timeoutMs?: number;
  signal?: AbortSignal;
  headers?: Record<string, string>;
  /** Called for every event as it arrives. */
  onEvent?: (e: EveEvent) => void;
}

export interface TurnOutcome {
  sessionId?: string;
  events: EveEvent[];
  result?: any;
  finalText?: string;
  /** Plain description of what went wrong; undefined if the turn completed. */
  error?: string;
}

const TERMINAL = new Set(["turn.completed", "turn.failed", "turn.cancelled", "session.failed", "session.completed"]);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Tiny .env loader (no dotenv). Real env vars win. Looks in cwd and project root. */
export function loadEnvFile(): void {
  const root = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
  for (const f of [resolve(process.cwd(), ".env"), resolve(root, ".env")]) {
    if (!existsSync(f)) continue;
    for (const line of readFileSync(f, "utf8").split(/\r?\n/)) {
      if (line.trim().startsWith("#")) continue;
      const m = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/.exec(line);
      if (!m) continue;
      let v = m[2]!;
      if (v.length >= 2 && (v[0] === '"' || v[0] === "'") && v.at(-1) === v[0]) v = v.slice(1, -1);
      if (process.env[m[1]!] === undefined) process.env[m[1]!] = v;
    }
  }
}

/** Basic auth header for the self-hosted agent (DONNA_API_USER default "donna" / DONNA_API_PASSWORD). */
export function authHeaders(): Record<string, string> {
  loadEnvFile();
  const pw = process.env.DONNA_API_PASSWORD;
  if (!pw) return {};
  const user = process.env.DONNA_API_USER ?? "donna";
  return { authorization: "Basic " + Buffer.from(`${user}:${pw}`).toString("base64") };
}

export function defaultBaseUrl(): string {
  loadEnvFile();
  return (process.env.EVE_URL ?? "http://127.0.0.1:2000").replace(/\/+$/, "");
}

export async function runTurn(message: string, opts: RunTurnOptions = {}): Promise<TurnOutcome> {
  const base = (opts.baseUrl ?? defaultBaseUrl()).replace(/\/+$/, "");
  const events: EveEvent[] = [];
  const out: TurnOutcome = { events };
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(new Error("turn timeout")), opts.timeoutMs ?? 20 * 60_000);
  opts.signal?.addEventListener("abort", () => ctl.abort(opts.signal?.reason));
  const headers = { "content-type": "application/json", ...authHeaders(), ...(opts.headers ?? {}) };

  try {
    const body: Record<string, unknown> = { message };
    if (opts.outputSchema) body.outputSchema = opts.outputSchema;
    const res = await fetch(`${base}/eve/v1/session`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: ctl.signal,
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`create session failed: HTTP ${res.status} ${text.slice(0, 500)}`);
    let sessionId = res.headers.get("x-eve-session-id") ?? undefined;
    try {
      sessionId = JSON.parse(text).sessionId ?? sessionId;
    } catch {
      /* header fallback */
    }
    if (!sessionId) throw new Error(`create session returned no sessionId: ${text.slice(0, 300)}`);
    out.sessionId = sessionId;

    // Stream with reconnects (the server may end the response at lease boundaries).
    const seen = new Set<string>();
    let done = false;
    let reconnects = 0;
    while (!done) {
      let sres: Response;
      try {
        sres = await fetch(`${base}/eve/v1/session/${sessionId}/stream?startIndex=${events.length}`, {
          headers,
          signal: ctl.signal,
        });
      } catch (e) {
        if (ctl.signal.aborted) throw e;
        if (++reconnects > 8) throw e;
        await sleep(500 * reconnects);
        continue;
      }
      if (sres.status === 409 || sres.status === 404) {
        // session_not_ready: back off and retry
        if (++reconnects > 40) throw new Error(`stream failed: HTTP ${sres.status}`);
        await sleep(Math.min(1000, 150 * reconnects));
        continue;
      }
      if (!sres.ok || !sres.body) throw new Error(`stream failed: HTTP ${sres.status} ${(await sres.text()).slice(0, 300)}`);

      const reader = sres.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      const handleLine = (line: string) => {
        if (!line.trim()) return;
        let ev: EveEvent;
        try {
          ev = JSON.parse(line);
        } catch {
          return; // heartbeat / partial garbage
        }
        if (!ev || typeof ev.type !== "string") return;
        const id = ev.meta?.id;
        if (id) {
          if (seen.has(id)) return;
          seen.add(id);
        }
        events.push(ev);
        opts.onEvent?.(ev);
        if (TERMINAL.has(ev.type)) done = true;
        if (ev.type === "input.requested") {
          out.error = "Run paused waiting for human input (input.requested); unattended runner did not answer.";
          done = true;
        }
      };
      while (!done) {
        const { value, done: rd } = await reader.read();
        if (rd) break;
        buf += dec.decode(value, { stream: true });
        let i: number;
        while ((i = buf.indexOf("\n")) >= 0) {
          handleLine(buf.slice(0, i));
          buf = buf.slice(i + 1);
        }
      }
      if (buf.trim() && !done) handleLine(buf);
      try {
        await reader.cancel();
      } catch {
        /* ignore */
      }
      if (!done && ++reconnects > 40) throw new Error("stream ended before turn completed (too many reconnects)");
    }
  } catch (e) {
    out.error = `${(e as Error).message ?? e}`;
  } finally {
    clearTimeout(timer);
  }

  summarize(out);
  return out;
}

/** Fill result/finalText/error from the recorded events. */
export function summarize(out: TurnOutcome): void {
  const { events } = out;
  for (const ev of events) {
    if (ev.type === "result.completed") out.result = ev.data?.result;
  }
  const texts = events.filter((e) => e.type === "message.completed" && e.data?.finishReason !== "tool-calls");
  out.finalText = (texts.at(-1) ?? events.filter((e) => e.type === "message.completed").at(-1))?.data?.message;
  if (!out.error) {
    const failed = events.find((e) => e.type === "turn.failed" || e.type === "session.failed");
    if (failed) {
      const d = failed.data ?? {};
      out.error = `${failed.type}: ${d.code ? `[${d.code}] ` : ""}${d.message ?? "no message"}`;
    } else if (events.some((e) => e.type === "turn.cancelled")) {
      out.error = "turn.cancelled";
    } else if (!events.some((e) => e.type === "turn.completed")) {
      out.error = "stream ended without turn.completed";
    }
  }
}
