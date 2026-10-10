import fs from "node:fs";
import path from "node:path";
import { getTicketSource } from "./sources.ts";

const MEDIA: Record<string, string> = {
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
};
const EXTRACT_MODEL = process.env.DONNA_EXTRACT_MODEL ?? "claude-sonnet-5-5";
const cache = new Map<string, string>();

export function listAttachments(ticketId: number): string[] {
  const dir = getTicketSource(ticketId);
  const att = dir && path.join(dir, "attachments");
  return att && fs.existsSync(att) ? fs.readdirSync(att).sort() : [];
}

/** Returns the attachment's content as text. PDFs and images are read by Claude; CSV/TXT are returned as-is. */
export async function readAttachment(ticketId: number, name: string): Promise<{ ok: true; name: string; text: string } | { ok: false; error: string }> {
  const dir = getTicketSource(ticketId);
  if (!dir) return { ok: false, error: `no source folder recorded for ticket ${ticketId}` };
  const base = path.join(dir, "attachments");
  const file = path.resolve(base, name);
  if (!file.startsWith(base + path.sep) || !fs.existsSync(file)) {
    return { ok: false, error: `attachment '${name}' not found. Available: ${listAttachments(ticketId).join(", ") || "none"}` };
  }
  const ext = path.extname(file).toLowerCase();
  if (ext === ".csv" || ext === ".txt" || ext === ".md") return { ok: true, name, text: fs.readFileSync(file, "utf8") };
  const media = MEDIA[ext];
  if (!media) return { ok: false, error: `unsupported attachment type '${ext}'` };
  if (cache.has(file)) return { ok: true, name, text: cache.get(file)! };

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return { ok: false, error: "ANTHROPIC_API_KEY is not set; cannot read PDF/image attachments" };
  const data = fs.readFileSync(file).toString("base64");
  const block =
    media === "application/pdf"
      ? { type: "document", source: { type: "base64", media_type: media, data } }
      : { type: "image", source: { type: "base64", media_type: media, data } };
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: EXTRACT_MODEL,
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: [
            block,
            {
              type: "text",
              text:
                "Transcribe this property-maintenance document or photo for an operations agent. " +
                "Give all text, every name, company, reference, date, address and amount exactly as written, then a short list of anything unclear, missing or inconsistent. " +
                "If it is a photo, describe what it shows factually. Do not guess values that are not visible.",
            },
          ],
        },
      ],
    }),
  });
  if (!res.ok) return { ok: false, error: `attachment reader failed: HTTP ${res.status} ${(await res.text()).slice(0, 300)}` };
  const json = (await res.json()) as { content?: { type: string; text?: string }[] };
  const text = (json.content ?? []).filter((c) => c.type === "text").map((c) => c.text).join("\n").trim();
  cache.set(file, text);
  return { ok: true, name, text };
}
