import { useMemo, useState } from "react";
import { Drawer } from "./Drawer.tsx";
import { EntityCtx } from "./RichText.tsx";
import type { FileRequest } from "./RichText.tsx";
import { FileViewer } from "./FileViewer.tsx";
import { Button } from "./Button.tsx";
import { fileUrl, niceName } from "../info.ts";

/** Provides entity navigation (open a case, open a document) to every RichText below, and renders the document drawer. */
export function EntityHost({ tickets, openTicket, children }: { tickets: { id: number; case_ref: string }[]; openTicket: (id: number) => void; children: React.ReactNode }) {
  const [req, setReq] = useState<FileRequest | null>(null);
  const env = useMemo(() => ({ tickets, openTicket, openFile: setReq }), [tickets, openTicket]);
  const f = req?.file;
  return (
    <EntityCtx.Provider value={env}>
      {children}
      <Drawer open={!!req} onClose={() => setReq(null)} title={f ? niceName(f.name) : ""} subtitle={f?.name}>
        {req && f && (
          <>
            {f.content == null && <div className="dr-actions"><a className="btn small" href={fileUrl(req.ticketId, f.name)} target="_blank" rel="noreferrer">Open in new tab</a></div>}
            <FileViewer ticketId={req.ticketId} file={f} hl={req.hl} notes={req.notes} />
            <div className="dr-foot"><Button variant="ghost" size="sm" onClick={() => setReq(null)}>Close</Button></div>
          </>
        )}
      </Drawer>
    </EntityCtx.Provider>
  );
}
