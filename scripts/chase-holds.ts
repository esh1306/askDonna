// Chase due holds once (for cron / VPS): node scripts/chase-holds.ts
// For every unreleased hold whose follow-up date has passed and that has not been chased yet (data/chased-holds.json),
// run a Donna turn on the ticket via the eve server (EVE_URL, default http://127.0.0.1:2000).
import { chaseDueHolds } from "../console/server/outbox-worker.ts";
import { loadEnvFile, runTurn } from "../runner/eve-client.ts";
import { resultJsonSchema } from "../runner/output-schema.ts";

loadEnvFile();
const results = await chaseDueHolds(async (ticketId, message) => {
  const out = await runTurn(message, { outputSchema: resultJsonSchema });
  if (out.error && out.events.length === 0) throw new Error(`could not reach Donna: ${out.error}`);
  console.log(`ticket ${ticketId}: ${out.result?.summary ?? out.finalText?.slice(0, 200) ?? out.error ?? "done"}`);
});
console.log(results.length ? results.join("\n") : "No due holds to chase.");
