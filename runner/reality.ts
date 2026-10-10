// Reality Test entry point: each case folder is imported into the CRM, then processed by the running eve agent.
// Usage: node runner/reality.ts --cases <dir> --out ANSWERS [--concurrency 3] [--only 1,4]
import { main, setPrepare } from "./run-cases.ts";
import { crmPrepare } from "./prepare-crm.ts";

setPrepare(crmPrepare);
await main();
