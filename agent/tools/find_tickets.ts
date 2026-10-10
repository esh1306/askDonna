import { defineTool } from "eve/tools";
import { z } from "zod";
import { findTickets } from "../../crm/repo.ts";

export default defineTool({
  description:
    "Find tickets by property address, contact name or free text. Use it when someone calls or emails again " +
    "so you can pick up their existing case instead of starting from nothing.",
  inputSchema: z.object({
    property_address: z.string().optional(),
    contact_name: z.string().optional(),
    text: z.string().optional(),
  }),
  async execute({ property_address, contact_name, text }) {
    const hits = findTickets({ propertyAddress: property_address, contactName: contact_name, text });
    return { matches: hits.length, tickets: hits };
  },
});
