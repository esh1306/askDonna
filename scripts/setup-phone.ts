// Imports the Twilio number into ElevenLabs, assigns the Donna agent, and adds post-call data collection.
// Run from project root: node scripts/setup-phone.ts
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

function loadEnv(): void {
  const f = resolve(process.cwd(), ".env");
  if (!existsSync(f)) return;
  for (const line of readFileSync(f, "utf8").split(/\r?\n/)) {
    const m = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/.exec(line);
    if (!m || line.trim().startsWith("#")) continue;
    let v = m[2]!;
    if (v.length >= 2 && (v[0] === '"' || v[0] === "'") && v.at(-1) === v[0]) v = v.slice(1, -1);
    if (process.env[m[1]!] === undefined) process.env[m[1]!] = v;
  }
}
loadEnv();

const need = ["ELEVENLABS_API_KEY", "ELEVENLABS_AGENT_ID", "TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_PHONE_NUMBER"].filter((k) => !process.env[k]);
if (need.length) {
  console.error(`Missing in .env: ${need.join(", ")}`);
  process.exit(1);
}
const key = process.env.ELEVENLABS_API_KEY!;
const agentId = process.env.ELEVENLABS_AGENT_ID!;
const H = { "xi-api-key": key, "content-type": "application/json" };
mkdirSync(resolve(process.cwd(), "docs"), { recursive: true });

// 1. data collection on the agent (only this field is patched; the rest of the agent is untouched)
const agentPatch = {
  platform_settings: {
    data_collection: {
      decision: {
        type: "string",
        description: "The landlord's decision on the repair: exactly one of approve, reject or need_more_info. Use need_more_info if unclear, conditional on something unanswered, or the call ended without a decision.",
      },
      max_amount_gbp: {
        type: "number",
        description: "Maximum spend in GBP the landlord agreed to, if they stated a number or cap. Leave empty if none stated.",
      },
      conditions: {
        type: "string",
        description: "Any conditions the landlord set (e.g. 'only if done this week'). Empty if none.",
      },
    },
  },
};
writeFileSync(resolve(process.cwd(), "docs/elevenlabs-data-collection.json"), JSON.stringify(agentPatch, null, 2) + "\n");
let r = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${encodeURIComponent(agentId)}`, { method: "PATCH", headers: H, body: JSON.stringify(agentPatch) });
if (!r.ok) {
  console.error(`Agent data-collection PATCH failed ${r.status}: ${await r.text()}`);
  process.exit(1);
}
console.log("Agent updated with data collection (decision, max_amount_gbp, conditions)");

// 2. import the Twilio number
const phonePayload = {
  provider: "twilio",
  phone_number: process.env.TWILIO_PHONE_NUMBER,
  label: "Donna (Twilio)",
  sid: process.env.TWILIO_ACCOUNT_SID,
  token: process.env.TWILIO_AUTH_TOKEN,
  agent_id: agentId,
};
writeFileSync(
  resolve(process.cwd(), "docs/elevenlabs-phone-number.json"),
  JSON.stringify({ ...phonePayload, sid: "<TWILIO_ACCOUNT_SID>", token: "<TWILIO_AUTH_TOKEN>" }, null, 2) + "\n",
);
let phoneId = process.env.ELEVENLABS_PHONE_NUMBER_ID || "";
if (phoneId) {
  console.log(`ELEVENLABS_PHONE_NUMBER_ID already set (${phoneId}); skipping import, re-assigning agent.`);
} else {
  r = await fetch("https://api.elevenlabs.io/v1/convai/phone-numbers", { method: "POST", headers: H, body: JSON.stringify(phonePayload) });
  const t = await r.text();
  if (!r.ok) {
    console.error(`Phone number import failed ${r.status}: ${t}`);
    process.exit(1);
  }
  phoneId = JSON.parse(t).phone_number_id;
}
// 3. ensure the agent is assigned (harmless if already)
r = await fetch(`https://api.elevenlabs.io/v1/convai/phone-numbers/${encodeURIComponent(phoneId)}`, {
  method: "PATCH",
  headers: H,
  body: JSON.stringify({ agent_id: agentId }),
});
if (!r.ok) console.warn(`Assigning agent to number returned ${r.status} (may already be assigned): ${await r.text()}`);
console.log(`\nAdd this to .env:\nELEVENLABS_PHONE_NUMBER_ID=${phoneId}`);
