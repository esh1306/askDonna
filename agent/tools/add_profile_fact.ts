import { defineTool } from "eve/tools";
import { z } from "zod";
import { addFact } from "../../crm/repo.ts";
import { unwrap } from "../../crm/tool-util.ts";

export default defineTool({
  description:
    "Record something you learned about a property or a contact so future interactions have it " +
    "(e.g. preferred_channel=call, pre_approved_limit_gbp=150, has_pets=yes, appliance_washing_machine_age=8y, pays_contractor_directly=true). " +
    "Always cite the source event. If it contradicts an existing fact, both are kept and flagged as a conflict; never overwrite. " +
    "Never record passwords, alarm/key-safe codes or bank details.",
  inputSchema: z.object({
    entity_type: z.enum(["property", "contact"]),
    entity_id: z.number().int(),
    key: z.string().regex(/^[a-z0-9_]+$/, "snake_case key"),
    value: z.string(),
    source_ref: z.string().describe("Where this came from, e.g. 'event 14 (landlord email)' or 'attachment invoice.pdf'"),
    confidence: z.number().min(0).max(1).optional(),
  }),
  async execute({ entity_type, entity_id, key, value, source_ref, confidence }) {
    if (/(password|passcode|pin|alarm_code|key_safe|bank|sort_code|account_number)/i.test(key)) {
      throw new Error("refused: sensitive credentials and bank details must not be stored");
    }
    return unwrap(addFact({ type: entity_type, id: entity_id }, key, value, source_ref, confidence ?? 0.8));
  },
});
