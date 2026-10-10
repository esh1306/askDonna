import { defineTool } from "eve/tools";
import { z } from "zod";
import { readAttachment } from "../../crm/attachments.ts";
import { unwrap } from "../../crm/tool-util.ts";

export default defineTool({
  description:
    "Read one of the ticket's attachments (inspection reports, quotes, invoices, photos, CSV/TXT). " +
    "Returns a faithful transcription with every name, reference, date and amount, plus anything unclear. " +
    "Read invoices and quotes before approving, forwarding or paying anything.",
  inputSchema: z.object({
    ticket_id: z.number().int(),
    name: z.string().describe("Attachment file name exactly as listed in get_ticket_context"),
  }),
  async execute({ ticket_id, name }) {
    return unwrap(await readAttachment(ticket_id, name));
  },
});
