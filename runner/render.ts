// Pure renderers: ANSWER.md and REASONING.md are derived ONLY from the recorded event stream,
// the structured result the agent produced, and the CRM diff passed in. Nothing is invented.
import type { EveEvent } from "./eve-client.ts";

export interface RenderCtx {
  caseNumber: string;
  caseDir: string;
  inputText: string;
  events: EveEvent[];
  result?: any;
  crmBefore?: unknown;
  crmAfter?: unknown;
  startedAt: string | Date;
  finishedAt: string | Date;
  error?: string;
  sessionId?: string;
}

export interface ActionRow {
  callId: string;
  tool: string;
  input: unknown;
  output?: unknown;
  settled: boolean;
  ok: boolean;
  errorText?: string;
}

const iso = (d: string | Date) => (d instanceof Date ? d.toISOString() : d);
const esc = (s: unknown) => String(s ?? "").replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
const gist = (v: unknown, n = 140) => {
  let s: string;
  try {
    s = typeof v === "string" ? v : JSON.stringify(v) ?? "";
  } catch {
    s = String(v);
  }
  s = s.replace(/\s+/g, " ");
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
};
const toArr = (v: unknown): any[] => (Array.isArray(v) ? v : []);

function actionName(a: any): string {
  return a?.toolName ?? a?.subagentName ?? a?.remoteAgentName ?? a?.name ?? "unknown";
}

/** Pair actions.requested with action.result by callId, in request order. */
export function extractActions(events: EveEvent[]): ActionRow[] {
  const rows = new Map<string, ActionRow>();
  for (const ev of events) {
    if (ev.type === "actions.requested") {
      for (const a of toArr(ev.data?.actions)) {
        const id = a.callId ?? `anon-${rows.size}`;
        if (!rows.has(id)) rows.set(id, { callId: id, tool: actionName(a), input: a.input, settled: false, ok: false });
      }
    } else if (ev.type === "action.result") {
      const r = ev.data?.result ?? {};
      const id = r.callId ?? `anon-${rows.size}`;
      const row: ActionRow = rows.get(id) ?? { callId: id, tool: actionName(r), input: undefined, settled: false, ok: false };
      const failed =
        r.isError === true || ev.data?.error !== undefined || (ev.data?.status !== undefined && ev.data.status !== "completed");
      row.settled = true;
      row.ok = !failed;
      row.output = r.output;
      if (failed) row.errorText = ev.data?.error?.message ?? gist(r.output, 300);
      if (row.tool === "unknown") row.tool = actionName(r);
      rows.set(id, row);
    }
  }
  return [...rows.values()];
}

export interface UsageSummary {
  inputTokens?: number;
  outputTokens?: number;
  costUsd?: number;
}

export function extractUsage(events: EveEvent[]): UsageSummary | undefined {
  for (let i = events.length - 1; i >= 0; i--) {
    const e = events[i]!;
    if (["session.waiting", "session.failed", "turn.waiting", "turn.completed", "session.completed"].includes(e.type) && e.data?.usage) {
      const u = e.data.usage;
      return { inputTokens: u.inputTokens, outputTokens: u.outputTokens, costUsd: u.costUsd };
    }
  }
  let sum: UsageSummary | undefined;
  for (const e of events) {
    if (e.type !== "step.completed" || !e.data?.usage) continue;
    const u = e.data.usage;
    sum ??= {};
    if (typeof u.inputTokens === "number") sum.inputTokens = (sum.inputTokens ?? 0) + u.inputTokens;
    if (typeof u.outputTokens === "number") sum.outputTokens = (sum.outputTokens ?? 0) + u.outputTokens;
    if (typeof u.costUsd === "number") sum.costUsd = (sum.costUsd ?? 0) + u.costUsd;
  }
  return sum;
}

export function decisionLine(ctx: RenderCtx): string {
  if (ctx.error) return `FAILED - ${ctx.error}`;
  if (ctx.result?.decision) return String(ctx.result.decision);
  return "NO STRUCTURED DECISION - the run completed but produced no structured result";
}

function bullets(items: unknown, empty: string): string {
  const a = toArr(items);
  return a.length ? a.map((x) => `- ${typeof x === "string" ? x : gist(x, 500)}`).join("\n") : empty;
}

function durationSec(ctx: RenderCtx): number {
  return Math.max(0, (new Date(iso(ctx.finishedAt)).getTime() - new Date(iso(ctx.startedAt)).getTime()) / 1000);
}

function failedEventLines(events: EveEvent[]): string[] {
  const out: string[] = [];
  for (const e of events) {
    if (e.type === "step.failed" || e.type === "turn.failed" || e.type === "session.failed") {
      const d = e.data ?? {};
      out.push(`${e.type}: ${d.code ? `[${d.code}] ` : ""}${d.message ?? "no message"}`);
    }
  }
  return out;
}

export function renderAnswer(ctx: RenderCtx): string {
  const r = ctx.result;
  const actions = extractActions(ctx.events);
  const usage = extractUsage(ctx.events);
  const L: string[] = [];
  L.push(`# Case ${ctx.caseNumber} - Answer`, "");
  L.push("## Decision", "", `**${decisionLine(ctx)}**`, "");

  if (ctx.error) {
    L.push("## Run failure", "", `The run did not complete successfully: ${ctx.error}`, "");
    L.push("No decision was produced by the system for this case. Nothing below is inferred; it only reports what the event log recorded.", "");
  }

  L.push("## Summary", "");
  if (r?.summary) L.push(String(r.summary), "");
  else L.push(ctx.error ? "_Not available: the run failed before producing a summary._" : "_Not available: the agent returned no structured summary._", "");
  if (!r) {
    const mc = ctx.events.filter((e) => e.type === "message.completed" && e.data?.finishReason !== "tool-calls").at(-1);
    if (mc?.data?.message) L.push("Final assistant text recorded in the event stream (unstructured):", "", quote(mc.data.message), "");
  }

  const j = r?.judgement;
  if (r?.case_type || j) {
    L.push("## Judgement", "");
    if (r?.case_type) L.push(`- **Case type:** ${r.case_type}`);
    if (j?.why_this_decision) L.push(`- **Why this decision:** ${j.why_this_decision}`);
    L.push("");
    const alts = toArr(j?.alternatives_considered);
    if (alts.length) {
      L.push("| Alternative considered | Why not |", "|---|---|");
      for (const a of alts) L.push(`| ${esc(a.option)} | ${esc(a.why_not)} |`);
      L.push("");
    }
    const checks = toArr(j?.checks_performed);
    if (checks.length) L.push("**Checks performed before acting**", "", ...checks.map((c: string) => `- ${c}`), "");
    const assumptions = toArr(j?.assumptions);
    if (assumptions.length) L.push("**Assumptions**", "", ...assumptions.map((c: string) => `- ${c}`), "");
  }

  L.push("## Actions taken", "");
  if (actions.length) {
    L.push("| # | Tool | Input (gist) | Result | Output (gist) |", "|---|---|---|---|---|");
    actions.forEach((a, i) => {
      const status = !a.settled ? "NO RESULT RECORDED" : a.ok ? "ok" : `FAILED: ${esc(gist(a.errorText, 120))}`;
      L.push(`| ${i + 1} | \`${esc(a.tool)}\` | ${esc(gist(a.input))} | ${status} | ${a.ok ? esc(gist(a.output, 120)) : ""} |`);
    });
    L.push("");
  } else {
    L.push("_No tool calls were recorded in the event stream._", "");
  }
  if (toArr(r?.actions_taken).length) {
    L.push("Agent's own account of its actions (from the structured result):", "");
    for (const a of toArr(r.actions_taken)) L.push(`- \`${a.tool}\` ${a.ok === false ? "(FAILED) " : ""}- ${a.description} -> ${a.result}`);
    L.push("");
  }

  L.push("## Approvals", "");
  const ap = toArr(r?.approvals);
  if (ap.length) {
    L.push("| Party | Status | Channel |", "|---|---|---|");
    for (const a of ap) L.push(`| ${esc(a.party)} | ${esc(a.status)} | ${esc(a.channel)} |`);
    L.push("");
  } else L.push(r ? "_None reported._" : "_Not available._", "");
  const hitl = ctx.events.filter((e) => e.type === "input.requested" || e.type === "input.resolved");
  if (hitl.length) {
    L.push("Human-input events recorded by the runtime:", "");
    for (const e of hitl) L.push(`- ${e.type}: ${gist(e.data, 300)}`);
    L.push("");
  }

  L.push("## Escalation & handover", "");
  const esc_ = r?.escalation;
  if (esc_) {
    L.push(`- Escalation needed: **${esc_.needed ? "yes" : "no"}**`);
    if (esc_.reason) L.push(`- Reason: ${esc_.reason}`);
    if (esc_.handover_summary) L.push(`- Handover summary: ${esc_.handover_summary}`);
    if (esc_.recommendation) L.push(`- Recommendation: ${esc_.recommendation}`);
    L.push("");
  } else L.push("_Not available: no structured escalation assessment was produced._", "");

  L.push("## What could not be verified", "", bullets(r?.unverified, r ? "_Nothing reported._" : "_Not available._"), "");

  L.push("## What failed", "");
  const failLines = [
    ...(ctx.error ? [`Run error: ${ctx.error}`] : []),
    ...actions.filter((a) => a.settled && !a.ok).map((a) => `Tool \`${a.tool}\` failed: ${gist(a.errorText, 300)}`),
    ...actions.filter((a) => !a.settled).map((a) => `Tool \`${a.tool}\` was requested but no result was recorded.`),
    ...failedEventLines(ctx.events).filter((l) => !(ctx.error && ctx.error.startsWith(l))),
    ...toArr(r?.failures).map((f) => `Agent reported: ${typeof f === "string" ? f : gist(f)}`),
  ];
  L.push(failLines.length ? failLines.map((x) => `- ${x}`).join("\n") : "_No failures recorded._", "");

  if (toArr(r?.risks_or_red_flags).length) {
    L.push("## Risks & red flags", "", bullets(r.risks_or_red_flags, ""), "");
  }

  L.push("## Final result / next follow-up", "");
  if (r) {
    L.push(`- Final status: ${r.final_status ?? "n/a"}`);
    L.push(`- Next follow-up: ${r.next_follow_up ? `${r.next_follow_up.when} - ${r.next_follow_up.what}` : "none"}`);
    if (typeof r.confidence === "number") L.push(`- Confidence: ${r.confidence}`);
    L.push("");
  } else L.push("_Not available._", "");

  L.push("## Run metadata", "");
  L.push(`- Case folder: \`${ctx.caseDir}\``);
  L.push(`- Session id: ${ctx.sessionId ?? findSessionId(ctx.events) ?? "n/a"}`);
  L.push(`- Started: ${iso(ctx.startedAt)}  Finished: ${iso(ctx.finishedAt)}  Duration: ${durationSec(ctx).toFixed(1)}s`);
  L.push(`- Events recorded: ${ctx.events.length}`);
  const models = [...new Set(ctx.events.filter((e) => e.type === "step.started" && e.data?.modelId).map((e) => e.data!.modelId))];
  if (models.length) L.push(`- Model(s): ${models.join(", ")}`);
  if (usage) {
    L.push(
      `- Tokens: in ${usage.inputTokens ?? "n/a"} / out ${usage.outputTokens ?? "n/a"}; cost: ${usage.costUsd !== undefined ? `$${usage.costUsd}` : "not reported"}`,
    );
  } else L.push("- Usage: not reported in event stream");
  L.push("");
  return L.join("\n");
}

function findSessionId(events: EveEvent[]): string | undefined {
  for (const e of events) {
    const id = e.data?.sessionId ?? (e.data as any)?.session?.id;
    if (typeof id === "string") return id;
  }
  return undefined;
}

const MAX_INPUT_PREVIEW = 3000;

export function renderReasoning(ctx: RenderCtx): string {
  const L: string[] = [];
  L.push(`# Case ${ctx.caseNumber} - Reasoning trace`, "");
  L.push("> Rendered mechanically from the recorded event stream (`events.ndjson`); nothing here was written by hand.", "");

  L.push("## What the system received", "");
  const preview = ctx.inputText.length > MAX_INPUT_PREVIEW ? ctx.inputText.slice(0, MAX_INPUT_PREVIEW) + "\n[... truncated, full text below ...]" : ctx.inputText;
  L.push("```text", preview, "```", "");
  if (ctx.inputText.length > MAX_INPUT_PREVIEW) {
    L.push("<details><summary>Full input text</summary>", "", "```text", ctx.inputText, "```", "", "</details>", "");
  }

  L.push("## Step-by-step trace", "");
  const results = new Map<string, EveEvent>();
  for (const e of ctx.events) if (e.type === "action.result") results.set(e.data?.result?.callId, e);
  let step = 0;
  let any = false;
  for (const e of ctx.events) {
    const d = e.data ?? {};
    switch (e.type) {
      case "step.started":
        step++;
        L.push(`### Step ${step}${d.modelId ? ` (${d.modelId})` : ""}`, "");
        any = true;
        break;
      case "reasoning.completed":
        L.push(`**Reasoning:** ${quote(d.reasoning ?? d.text)}`, "");
        break;
      case "message.completed":
        L.push(`**${d.finishReason === "tool-calls" ? "Narration" : "Assistant message"}:** ${quote(d.message)}`, "");
        break;
      case "actions.requested":
        for (const a of toArr(d.actions)) {
          const res = results.get(a.callId);
          L.push(`- **Tool call** \`${actionName(a)}\` input: \`${esc(gist(a.input, 400))}\``);
          if (!res) L.push("  - result: _none recorded_");
          else {
            const ar = extractActions([e, res]).find((x) => x.callId === a.callId)!;
            L.push(ar.ok ? `  - result (ok): \`${esc(gist(ar.output, 400))}\`` : `  - result (**FAILED**): ${esc(gist(ar.errorText, 400))}`);
          }
        }
        L.push("");
        break;
      case "input.requested":
        L.push(`**Paused for human input:** ${gist(d.requests, 400)}`, "");
        break;
      case "input.resolved":
        L.push(`**Human input resolved:** ${gist(d.resolutions, 400)}`, "");
        break;
      case "step.failed":
      case "turn.failed":
      case "session.failed":
        L.push(`**${e.type}:** ${d.code ? `[${d.code}] ` : ""}${d.message ?? ""}`, "");
        any = true;
        break;
      case "result.completed":
        L.push(`**Structured result emitted** (decision: \`${d.result?.decision ?? "n/a"}\`).`, "");
        break;
      default:
    }
  }
  if (!any && !ctx.events.length) L.push("_No events were recorded._", "");

  L.push("## CRM changes", "");
  if (ctx.crmBefore === undefined && ctx.crmAfter === undefined) L.push("_No CRM snapshot was provided._", "");
  else {
    const diff = diffObjects(ctx.crmBefore, ctx.crmAfter);
    L.push(diff.length ? diff.map((x) => `- ${x}`).join("\n") : "_No differences between the before and after CRM snapshots._", "");
  }

  L.push("## Uncertainty & red flags", "");
  const r = ctx.result;
  if (ctx.error) L.push(`- Run did not complete cleanly: ${ctx.error}`);
  if (r) {
    if (typeof r.confidence === "number") L.push(`- Agent-stated confidence: ${r.confidence}`);
    for (const u of toArr(r.unverified)) L.push(`- Unverified: ${u}`);
    for (const f of toArr(r.risks_or_red_flags)) L.push(`- Red flag: ${f}`);
    if (r.situation) L.push("", `Agent's situation assessment: ${r.situation}`);
  } else if (!ctx.error) L.push("- No structured result: uncertainty was not stated by the agent.");
  L.push("");

  L.push("## Raw log", "", "Full raw event stream: `events.ndjson` (one JSON event per line, as emitted by the eve server).", "");
  return L.join("\n");
}

function quote(s: unknown): string {
  const t = String(s ?? "").trim();
  if (!t) return "_(empty)_";
  return t.includes("\n") ? "\n\n" + t.split("\n").map((l) => `> ${l}`).join("\n") : t;
}

/** Shallow-to-deep readable diff of two JSON-like values. */
export function diffObjects(a: unknown, b: unknown, path = ""): string[] {
  if (JSON.stringify(a) === JSON.stringify(b)) return [];
  const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
  if (isObj(a) && isObj(b)) {
    const out: string[] = [];
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) out.push(...diffObjects(a[k], b[k], path ? `${path}.${k}` : k));
    return out;
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    const out: string[] = [];
    for (let i = 0; i < Math.max(a.length, b.length); i++) out.push(...diffObjects(a[i], b[i], `${path}[${i}]`));
    return out;
  }
  const p = path || "(root)";
  if (a === undefined) return [`added \`${p}\`: ${gist(b, 200)}`];
  if (b === undefined) return [`removed \`${p}\` (was ${gist(a, 200)})`];
  return [`changed \`${p}\`: ${gist(a, 200)} -> ${gist(b, 200)}`];
}
