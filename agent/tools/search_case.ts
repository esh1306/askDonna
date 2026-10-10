import { defineTool } from "eve/tools";
import { z } from "zod";
import { searchEvents } from "../../crm/repo.ts";

export default defineTool({
  description:
    "Search a ticket's full event history for a word or phrase (a name, reference, amount, date, 'invoice', 'quote'...). " +
    "Use it to find older events that are not in the recent context and to cross-check conflicting details.",
  inputSchema: z.object({
    ticket_id: z.number().int(),
    query: z.string().min(2),
  }),
  async execute({ ticket_id, query }) {
    const hits = searchEvents(ticket_id, query, 25);
    return { query, matches: hits.length, events: hits };
  },
});
