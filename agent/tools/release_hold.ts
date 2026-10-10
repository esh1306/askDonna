import { defineTool } from "eve/tools";
import { z } from "zod";
import { releaseHold } from "../../crm/repo.ts";
import { unwrap } from "../../crm/tool-util.ts";

export default defineTool({
  description: "Release an open hold once the thing it was waiting for has arrived. Use the hold id from get_ticket_context.",
  inputSchema: z.object({ hold_id: z.number().int() }),
  async execute({ hold_id }) {
    return unwrap(releaseHold(hold_id));
  },
});
