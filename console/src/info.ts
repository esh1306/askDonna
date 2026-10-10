import { useEffect, useState } from "react";
import { api } from "./api.ts";
import type { Detail } from "./api.ts";

export type FileInfo = { name: string; size?: number; /** present for files that only exist as text inside the ticket description */ content?: string };
export type TicketInfo = { detail: Detail | null; files: FileInfo[] };

const cache = new Map<number, Promise<TicketInfo>>();

/** Sections like "### invoices.csv" pasted into a ticket description behave as virtual attachments. */
export function embeddedFiles(desc: string | null | undefined): FileInfo[] {
  if (!desc) return [];
  const out: FileInfo[] = [];
  const parts = desc.split(/^### +(.+)$/m);
  for (let i = 1; i < parts.length; i += 2) {
    const name = parts[i].trim();
    if (/\.[a-z0-9]{2,4}$/i.test(name) && /^[\w.\- ]+$/.test(name)) out.push({ name, content: (parts[i + 1] ?? "").trim() });
  }
  return out;
}

export function loadTicketInfo(id: number, fresh = false): Promise<TicketInfo> {
  if (!fresh && cache.has(id)) return cache.get(id)!;
  const p = (async () => {
    const [detail, files] = await Promise.all([
      api<Detail>(`/api/tickets/${id}`).catch(() => null),
      api<FileInfo[]>(`/api/tickets/${id}/files`).catch(() => [] as FileInfo[]),
    ]);
    const have = new Set(files.map((f) => f.name.toLowerCase()));
    const virt = embeddedFiles(detail?.ticket.description).filter((f) => !have.has(f.name.toLowerCase()));
    return { detail, files: [...files, ...virt] };
  })();
  cache.set(id, p);
  return p;
}

export function useTicketInfo(id: number | null | undefined): TicketInfo {
  const [info, setInfo] = useState<TicketInfo>({ detail: null, files: [] });
  useEffect(() => {
    let alive = true;
    if (id == null) return setInfo({ detail: null, files: [] });
    loadTicketInfo(id).then((i) => alive && setInfo(i));
    return () => { alive = false; };
  }, [id]);
  return info;
}

export const fileUrl = (ticketId: number, name: string) => `/api/tickets/${ticketId}/files/${encodeURIComponent(name)}`;
export const ext = (name: string) => (name.match(/\.([a-z0-9]+)$/i)?.[1] ?? "").toLowerCase();
export const isImage = (name: string) => ["png", "jpg", "jpeg", "gif", "webp"].includes(ext(name));
/** "attachment-02-cleaning-invoice.pdf" becomes "Cleaning invoice". */
export function niceName(name: string) {
  const base = name.replace(/\.[a-z0-9]+$/i, "").replace(/^attachment-\d+-/i, "").replace(/[-_]+/g, " ").trim();
  return base ? base[0].toUpperCase() + base.slice(1) : name;
}
