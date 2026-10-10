import { createContext, Fragment, useContext, useMemo } from "react";
import type { Fact } from "../api.ts";
import { useTicketInfo, niceName, isImage } from "../info.ts";
import type { FileInfo, TicketInfo } from "../info.ts";
import { EntityChip } from "./EntityChip.tsx";
import type { PersonCard } from "./EntityChip.tsx";

export type FileRequest = { ticketId: number; file: FileInfo; hl?: string; notes?: string };
export type EntityEnv = { tickets: { id: number; case_ref: string }[]; openTicket: (id: number) => void; openFile: (r: FileRequest) => void };
export const EntityCtx = createContext<EntityEnv>({ tickets: [], openTicket: () => {}, openFile: () => {} });

type Seg = { start: number; end: number; prio: number; node: (key: number) => React.ReactNode };

const MONEY = /(?:£|GBP\s?)\d[\d,]*(?:\.\d{1,2})?/g;
const FILE = /[\w][\w.\-]*\.(?:pdf|csv|png|jpe?g|gif|webp|txt)\b/gi;
const TICKET = /\b(?:R|PM)\/\d+\b/g;
const REF = /\b[A-Z]{1,5}-\d{1,3}(?:-\d{2,})+\b|\b[A-Z]{2,5}-\d{3,}\b/g;
const TITLED = /\b(?:Mr|Mrs|Ms|Miss|Dr|Mx)\.?\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?/g;

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function peopleOf(info: TicketInfo): PersonCard[] {
  const d = info.detail;
  if (!d) return [];
  const mk = (role: string, p: any): PersonCard | null =>
    p && p.name && !/^(tenant|landlord|contractor)\b/i.test(p.name)
      ? { name: p.name, role, company: p.company, email: p.email, phone: p.phone, facts: (p.facts ?? []).filter((f: Fact) => f.status !== "superseded").map((f: Fact) => ({ key: f.key, value: f.value })) }
      : null;
  return [mk("Tenant", d.tenant), mk("Landlord", d.landlord), mk("Contractor", d.contractor)].filter(Boolean) as PersonCard[];
}

export function findFileForRef(files: FileInfo[], code: string): FileInfo | null {
  const c = code.toLowerCase();
  return files.find((f) => f.name.toLowerCase().includes(c)) ?? files.find((f) => f.content?.toLowerCase().includes(c)) ?? null;
}

/** Turns Donna's prose into text with entity chips: files, people, case refs, money and reference codes. */
export function RichText({ text, ticketId, notes, className = "" }: { text: string; ticketId: number; notes?: string; className?: string }) {
  const env = useContext(EntityCtx);
  const info = useTicketInfo(ticketId);
  const people = useMemo(() => peopleOf(info), [info]);

  const out = useMemo(() => {
    const segs: Seg[] = [];
    const add = (re: RegExp, prio: number, node: (m: string) => ((key: number) => React.ReactNode) | null) => {
      for (const m of text.matchAll(re)) {
        const n = node(m[0]);
        if (n) segs.push({ start: m.index!, end: m.index! + m[0].length, prio, node: n });
      }
    };
    const open = (f: FileInfo, hl?: string) => () => env.openFile({ ticketId, file: f, hl, notes: notes ?? text });
    add(FILE, 0, (m) => {
      const f = info.files.find((x) => x.name.toLowerCase() === m.toLowerCase());
      return f ? (k) => <EntityChip key={k} kind="file" icon={isImage(f.name) ? "image" : "file"} label={niceName(f.name)} title={f.name} onClick={open(f)} /> : null;
    });
    add(TICKET, 1, (m) => {
      const t = env.tickets.find((x) => x.case_ref === m);
      return (k) => <EntityChip key={k} kind="ticket" label={m} title="Open case" onClick={t ? () => env.openTicket(t.id) : undefined} />;
    });
    add(REF, 2, (m) => {
      const f = findFileForRef(info.files, m);
      return (k) => <EntityChip key={k} kind="ref" icon="none" label={m} title={f ? `Open ${f.name}` : "Reference"} onClick={f ? open(f, m) : undefined} />;
    });
    add(MONEY, 3, (m) => { const n = m.replace(/^GBP\s?/, "£"); return (k) => <EntityChip key={k} kind="money" label={n} />; });
    const names = people.flatMap((p) => [p.name, p.company].filter(Boolean) as string[]).filter((n) => n.length > 3);
    if (names.length) add(new RegExp(`\\b(?:${names.map(esc).join("|")})\\b`, "gi"), 4, (m) => {
      const p = people.find((x) => [x.name, x.company].some((n) => n?.toLowerCase() === m.toLowerCase()));
      return (k) => <EntityChip key={k} kind="person" label={m} person={p} />;
    });
    add(TITLED, 5, (m) => {
      const sur = m.split(/\s+/).slice(1).join(" ").toLowerCase();
      const p = people.find((x) => x.name.toLowerCase().includes(sur.split(" ").pop()!));
      return (k) => <EntityChip key={k} kind="person" label={m} person={p} />;
    });
    segs.sort((a, b) => a.start - b.start || a.prio - b.prio);
    const picked: Seg[] = [];
    for (const s of segs) if (!picked.length || s.start >= picked[picked.length - 1].end) picked.push(s);
    const parts: React.ReactNode[] = [];
    let at = 0;
    picked.forEach((s, i) => {
      if (s.start > at) parts.push(<Fragment key={`t${i}`}>{text.slice(at, s.start)}</Fragment>);
      parts.push(s.node(i));
      at = s.end;
    });
    if (at < text.length) parts.push(<Fragment key="end">{text.slice(at)}</Fragment>);
    return parts;
  }, [text, info, people, env, ticketId, notes]);

  return <span className={`rich ${className}`}>{out}</span>;
}
