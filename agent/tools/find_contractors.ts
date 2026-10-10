import { defineTool } from "eve/tools";
import { z } from "zod";
import { all, getTicketContext } from "../../crm/repo.ts";
import { unwrap } from "../../crm/tool-util.ts";

type C = { id: number; name: string; company: string | null; email: string | null; phone: string | null };
type J = { contractor_id: number; ticket_id: number; case_ref: string; category: string | null; title: string; property_id: number | null };

const STOP = new Set(["the", "and", "for", "with", "a", "an", "of", "to", "in", "on", "at", "is", "it", "repair", "fix", "work", "works", "job"]);
const toks = (s: string) => s.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2 && !STOP.has(w));

export default defineTool({
  description:
    "Find contractors (maintenance providers) for a ticket: ranks those previously used at this property, those who did jobs in the same category, and those whose name/company matches the trade. " +
    "Use it after landlord approval when no contractor has been named, then call assign_contractor with the best fit and say why.",
  inputSchema: z.object({
    ticket_id: z.number().int(),
    trade: z.string().optional().describe("Trade needed, e.g. plumber, electrician, gas engineer, gardener"),
    text: z.string().optional().describe("Extra description of the job"),
  }),
  async execute({ ticket_id, trade, text }) {
    const ctx = unwrap(getTicketContext(ticket_id, { events: 1 }));
    const t = ctx.ticket;
    const contractors = all<C>("SELECT id, name, company, email, phone FROM contacts WHERE role='contractor'").filter(
      (c) => !/^contractor \(/i.test(c.name) && !/^(unknown|tbc|n\/a)$/i.test(c.name.trim()),
    );
    const jobs = all<J>(
      "SELECT contractor_id, id AS ticket_id, case_ref, category, title, property_id FROM tickets WHERE contractor_id IS NOT NULL AND id<>?",
      ticket_id,
    );
    const linked = new Set(
      t.property_id == null ? [] : all<{ contact_id: number }>("SELECT contact_id FROM property_contacts WHERE property_id=? AND role='contractor'", t.property_id).map((r) => r.contact_id),
    );
    const want = new Set(toks(`${trade ?? ""} ${text ?? ""}`));
    const cat = t.category?.toLowerCase() ?? null;
    const ranked = contractors
      .map((c) => {
        const mine = jobs.filter((j) => j.contractor_id === c.id);
        const here = mine.filter((j) => t.property_id != null && j.property_id === t.property_id);
        const same = cat ? mine.filter((j) => j.category?.toLowerCase() === cat) : [];
        const nameHit = toks(`${c.name} ${c.company ?? ""}`).filter((w) => want.has(w) || [...want].some((x) => w.startsWith(x) || x.startsWith(w)));
        let score = 0;
        const evidence: string[] = [];
        if (linked.has(c.id) || here.length) {
          score += 10 + here.length;
          evidence.push(...here.slice(0, 3).map((j) => `worked at this property on ticket ${j.case_ref}`));
          if (!here.length) evidence.push("linked to this property");
        }
        if (same.length) {
          score += 5 + Math.min(same.length, 5);
          evidence.push(`did ${same.length} ${cat} job${same.length > 1 ? "s" : ""}`);
        }
        if (nameHit.length) {
          score += 3;
          evidence.push(`name/company matches "${nameHit[0]}"`);
        }
        return { c, score, evidence };
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
    return {
      ok: true,
      category: t.category,
      contractors: ranked.map((r) => ({ contact_id: r.c.id, name: r.c.name, company: r.c.company, email: r.c.email, phone: r.c.phone, score: r.score, evidence: r.evidence })),
      note: ranked.length ? undefined : "No matching contractor on record; check the landlord's instructions or escalate to a human.",
    };
  },
});
