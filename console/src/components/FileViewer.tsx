import { useEffect, useState } from "react";
import { ext, fileUrl, isImage, niceName } from "../info.ts";
import type { FileInfo } from "../info.ts";

function parseCsv(t: string): string[][] {
  return t.split(/\r?\n/).filter((l) => l.trim()).map((l) => {
    const out: string[] = []; let cur = ""; let q = false;
    for (const ch of l) {
      if (ch === '"') q = !q;
      else if (ch === "," && !q) { out.push(cur); cur = ""; } else cur += ch;
    }
    out.push(cur);
    return out;
  });
}

function CsvTable({ text, hl }: { text: string; hl?: string }) {
  const rows = parseCsv(text);
  if (rows.length < 2) return <pre className="orig">{text}</pre>;
  const [head, ...body] = rows;
  return (
    <div className="csv-wrap">
      <table className="csv">
        <thead><tr>{head.map((h, i) => <th key={i}>{h.replace(/_/g, " ")}</th>)}</tr></thead>
        <tbody>{body.map((r, i) => <tr key={i} className={hl && r.some((c) => c.toLowerCase() === hl.toLowerCase()) ? "hl" : ""}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

/** First sentences of Donna's notes that talk about this document. */
function relevant(notes: string | undefined, file: FileInfo, hl?: string): string[] {
  if (!notes) return [];
  const toks = niceName(file.name).toLowerCase().split(/\s+/).filter((w) => w.length > 3);
  if (hl) toks.push(hl.toLowerCase());
  const sents = notes.split(/(?<=[.!?])\s+|\n+/).map((s) => s.trim()).filter((s) => s.length > 12);
  return sents.filter((s) => toks.some((t) => s.toLowerCase().includes(t))).slice(0, 5);
}

export function FileViewer({ ticketId, file, hl, notes }: { ticketId: number; file: FileInfo; hl?: string; notes?: string }) {
  const [text, setText] = useState<string | null>(file.content ?? null);
  const e = ext(file.name);
  useEffect(() => {
    if (file.content != null) return setText(file.content);
    if (e === "csv" || e === "txt") { setText(null); fetch(fileUrl(ticketId, file.name)).then((r) => r.text()).then(setText).catch(() => setText("Could not load file.")); }
  }, [ticketId, file, e]);
  const facts = relevant(notes, file, hl);
  const url = fileUrl(ticketId, file.name);
  return (
    <div className={`viewer ${facts.length ? "with-facts" : ""}`}>
      <div className="v-main">
        {file.content == null && e === "pdf" && <iframe className="v-pdf" src={url} title={file.name} />}
        {file.content == null && isImage(file.name) && <img className="v-img" src={url} alt={file.name} />}
        {(e === "csv" || e === "txt" || file.content != null) && text != null && (e === "csv" ? <CsvTable text={text} hl={hl} /> : <pre className="orig">{text}</pre>)}
        {text == null && (e === "csv" || e === "txt") && <div className="muted small">Loading…</div>}
      </div>
      {facts.length > 0 && (
        <aside className="v-facts">
          <div className="s-k">What Donna noted</div>
          <ul>{facts.map((f, i) => <li key={i}>{f}</li>)}</ul>
        </aside>
      )}
    </div>
  );
}
