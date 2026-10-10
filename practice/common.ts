import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

export const ROOT = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
export const PRACTICE_DIR = path.join(ROOT, "data", "practice");
export const DP_FILE = path.join(PRACTICE_DIR, "decision-points.json");
export const ANSWERS_DIR = path.join(PRACTICE_DIR, "answers");
export const CASES_TMP = path.join(PRACTICE_DIR, "cases");
export const JUDGE_DIR = path.join(PRACTICE_DIR, "judge");
export const PM_DIR = path.resolve(ROOT, "../HackatonPublicCases/Property Management");

export interface DecisionPoint {
  id: string;
  case: string;
  /** number of events the agent sees (history.slice(0, cutoff)) */
  cutoff: number;
  trigger: string;
  reference_events: { n: number; timestamp: string; channel: string; from: string; to: string; body: string }[];
  outcome: string;
}

export function parseArgs(argv: string[]) {
  const a: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i]!;
    if (!t.startsWith("--")) continue;
    const nxt = argv[i + 1];
    if (nxt === undefined || nxt.startsWith("--")) a[t.slice(2)] = true;
    else {
      a[t.slice(2)] = nxt;
      i++;
    }
  }
  return a;
}

export function loadDps(): DecisionPoint[] {
  if (!fs.existsSync(DP_FILE)) {
    console.error(`Missing ${DP_FILE}. Run: node practice/decision-points.ts`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(DP_FILE, "utf8"));
}

export function selectDps(all: DecisionPoint[], args: Record<string, string | boolean>): DecisionPoint[] {
  let sel = all;
  if (typeof args.ids === "string") {
    const want = new Set(args.ids.split(",").map((s) => s.trim()));
    sel = all.filter((d) => want.has(d.id) || want.has(d.case));
  }
  if (typeof args.limit === "string") sel = sel.slice(0, Number(args.limit));
  return sel;
}

/** Tiny .env reader (no dependency). Real env wins. */
export function loadEnv(): void {
  const p = path.join(ROOT, ".env");
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/.exec(line);
    if (!m || line.trim().startsWith("#")) continue;
    const v = m[2]!.replace(/^["']|["']$/g, "");
    if (v && process.env[m[1]!] === undefined) process.env[m[1]!] = v;
  }
}
