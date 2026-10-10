import fs from "node:fs";
import path from "node:path";
import type { CaseDetail, CaseEvent, CaseSummary } from "./case-types.ts";

export const CASES_DIR =
  process.env.CASES_DIR ?? path.resolve(process.cwd(), "../HackatonPublicCases");

const read = (p: string) => (fs.existsSync(p) ? fs.readFileSync(p, "utf8").replace(/\r\n/g, "\n") : "");

export function listTracks(): string[] {
  return fs
    .readdirSync(CASES_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith("."))
    .map((d) => d.name);
}

function parseIndex(md: string) {
  const title = md.match(/^# Case \d+:\s*(.+)$/m)?.[1]?.trim() ?? "(untitled)";
  const sections: Record<string, string> = {};
  for (const part of md.split(/^## /m).slice(1)) {
    const nl = part.indexOf("\n");
    sections[part.slice(0, nl).trim()] = part.slice(nl + 1).trim();
  }
  const details: Record<string, string> = {};
  for (const m of (sections["Case details"] ?? "").matchAll(/^- \*\*(.+?):\*\*\s*(.*)$/gm)) {
    details[m[1]] = m[2];
  }
  return { title, sections, details };
}

function parseHistory(md: string): CaseEvent[] {
  const events: CaseEvent[] = [];
  for (const part of md.split(/<a id="event-\d+"><\/a>\n/).slice(1)) {
    const head = part.match(/^## (.+?) — event (\d+)/);
    if (!head) continue;
    const lines = part.slice(part.indexOf("\n") + 1).split("\n");
    const meta: Record<string, string> = {};
    let i = 0;
    while (i < lines.length && (lines[i].trim() === "" || lines[i].startsWith("- **"))) {
      const m = lines[i].match(/^- \*\*(.+?):\*\*\s*(.*)$/);
      if (m) meta[m[1].toLowerCase()] = m[2];
      i++;
    }
    const body = lines.slice(i).join("\n").trim();
    const attachments = [...body.matchAll(/\]\(attachments\/([^)]+)\)/g)].map((m) => m[1]);
    events.push({
      n: Number(head[2]),
      timestamp: head[1],
      channel: meta["channel"] ?? "",
      stage: meta["stage"],
      from: meta["from"] ?? "",
      to: meta["to"] ?? "",
      body,
      attachments,
    });
  }
  return events;
}

/** Guess the decision point: how many events the agent should see. */
function defaultCutoff(events: CaseEvent[]): number {
  const staged = events.findIndex((e) => /agent action/i.test(e.stage ?? ""));
  if (staged > 0) return staged;
  const note = events.findIndex((e, i) => i > 0 && /note/i.test(e.channel) && !/system/i.test(e.from));
  if (note > 0) return note;
  return Math.max(1, Math.floor(events.length / 2));
}

export function loadCase(track: string, id: string): CaseDetail | null {
  return loadCaseDir(path.join(CASES_DIR, track, id), track, id);
}

/** Load a case from an arbitrary folder (index.md + history.md [+ attachments/]). */
export function loadCaseDir(dir: string, track = "", id = path.basename(dir)): CaseDetail | null {
  if (!fs.existsSync(path.join(dir, "index.md"))) return null;
  const { title, sections, details } = parseIndex(read(path.join(dir, "index.md")));
  const history = parseHistory(read(path.join(dir, "history.md")));
  const attDir = path.join(dir, "attachments");
  const attachmentFiles = fs.existsSync(attDir) ? fs.readdirSync(attDir).sort() : [];
  return {
    track,
    id,
    title,
    status: details["Status"] ?? "",
    events: history.length,
    attachments: attachmentFiles.length,
    details,
    sections,
    history,
    attachmentFiles,
    defaultCutoff: defaultCutoff(history),
  };
}

let cache: CaseSummary[] | null = null;
export function listCases(): CaseSummary[] {
  if (cache) return cache;
  const out: CaseSummary[] = [];
  for (const track of listTracks()) {
    const ids = fs
      .readdirSync(path.join(CASES_DIR, track), { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .sort();
    for (const id of ids) {
      const c = loadCase(track, id);
      if (c) out.push({ track, id, title: c.title, status: c.status, events: c.events, attachments: c.attachments });
    }
  }
  return (cache = out);
}

export function attachmentPath(track: string, id: string, name: string): string | null {
  const base = path.join(CASES_DIR, track, id, "attachments");
  const p = path.resolve(base, name);
  return p.startsWith(base + path.sep) && fs.existsSync(p) ? p : null;
}
