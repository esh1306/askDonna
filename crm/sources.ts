import fs from "node:fs";
import path from "node:path";
import { openDb } from "./db.ts";
import { CASES_DIR } from "./cases.ts";
import { one, run } from "./repo.ts";

/** Where each ticket's source case folder lives, so tools can open its attachments. */
function ensure() {
  openDb().exec("CREATE TABLE IF NOT EXISTS ticket_sources (ticket_id INTEGER PRIMARY KEY, dir TEXT NOT NULL)");
}

export function setTicketSource(ticketId: number, dir: string) {
  ensure();
  run("INSERT OR REPLACE INTO ticket_sources (ticket_id, dir) VALUES (?, ?)", ticketId, path.resolve(dir));
}

export function getTicketSource(ticketId: number): string | null {
  ensure();
  const row = one<{ dir: string }>("SELECT dir FROM ticket_sources WHERE ticket_id=?", ticketId);
  if (row) return row.dir;
  // Public Property Management cases imported by `crm/import.ts --all` use refs like "PM/042".
  const t = one<{ case_ref: string }>("SELECT case_ref FROM tickets WHERE id=?", ticketId);
  const m = t?.case_ref.match(/^PM\/(\d+)$/);
  const dir = m ? path.join(CASES_DIR, "Property Management", m[1]) : null;
  return dir && fs.existsSync(dir) ? dir : null;
}
