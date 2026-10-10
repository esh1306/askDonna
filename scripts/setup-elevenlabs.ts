// Creates (or updates, if ELEVENLABS_AGENT_ID is set) the ElevenLabs voice agent used for landlord approval calls.
// Run from project root: node scripts/setup-elevenlabs.ts
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

const PROMPT = `You are Donna, a calm, polite maintenance coordinator at {{agency_name}}, a UK lettings agency. You are phoning a landlord, {{landlord_name}}, to get a decision on a repair. Speak British English, in short natural sentences. You are talking, not writing: no lists, no jargon.

The job
- Property: {{property_address}}
- Tenant: {{tenant_name}}
- What needs doing: {{job_summary}}
- Estimated cost: {{estimated_cost}}. If this reads as unknown or empty, say the cost isn't confirmed yet and ask whether they would approve up to a spending cap.
- Reference: {{job_ref}}

How the call goes
1. After the greeting, explain the job in two or three sentences and the cost.
2. Ask for a clear yes or no, or a maximum amount they are happy to spend.
3. Never pressure the landlord. Never invent costs, dates, contractors or promises. Only use the facts above.
4. If they ask something you cannot answer from the facts above, say you will find out and get back to them, and record need_more_info.
5. Before finishing, confirm back what was agreed in one sentence (approved up to a cap, declined, or needs more information) and any conditions they set.
6. Then call the record_approval tool exactly once with decision approve, reject or need_more_info (plus max_amount_gbp, conditions and notes where relevant), and then end the call politely using end_call.

If the landlord is not the right person or cannot talk now, record need_more_info with a note, thank them and end the call.`;

const FIRST_MESSAGE =
  "Hi {{landlord_name}}, it's Donna from {{agency_name}} calling about a repair at {{property_address}}. Have you got a minute?";

const config = {
  name: "Donna – Landlord approvals",
  conversation_config: {
    agent: {
      first_message: FIRST_MESSAGE,
      language: "en",
      dynamic_variables: {
        dynamic_variable_placeholders: {
          landlord_name: "the landlord",
          agency_name: "Northbridge Lettings",
          property_address: "the property",
          job_summary: "a repair",
          estimated_cost: "not confirmed",
          job_ref: "unknown",
          tenant_name: "the tenant",
        },
      },
      prompt: {
        prompt: PROMPT,
        llm: process.env.ELEVENLABS_LLM || "gpt-4o",
        temperature: 0.3,
        tools: [
          {
            type: "client",
            name: "record_approval",
            description:
              "Record the landlord's decision once it is clear. Call exactly once, right before ending the call.",
            expects_response: true,
            response_timeout_secs: 20,
            parameters: {
              type: "object",
              required: ["decision"],
              properties: {
                decision: {
                  type: "string",
                  enum: ["approve", "reject", "need_more_info"],
                  description: "The landlord's decision",
                },
                max_amount_gbp: { type: "number", description: "Maximum spend in GBP the landlord approved, if stated" },
                conditions: { type: "string", description: "Any conditions the landlord set" },
                notes: { type: "string", description: "Short note of anything else relevant, or the open questions" },
              },
            },
          },
        ],
        built_in_tools: {
          end_call: {
            name: "end_call",
            type: "system",
            description: "End the call once the decision is recorded and goodbyes are said, or if the landlord asks to stop.",
          },
        },
      },
    },
    tts: {
      // British English premade voice ("Alice"); override with ELEVENLABS_VOICE_ID
      voice_id: process.env.ELEVENLABS_VOICE_ID || "Xb7hH8MSUJpSbSDYk0k2",
      model_id: "eleven_turbo_v2",
    },
  },
};

mkdirSync(resolve(process.cwd(), "docs"), { recursive: true });
writeFileSync(resolve(process.cwd(), "docs/elevenlabs-agent.json"), JSON.stringify(config, null, 2) + "\n");
console.log("Saved config to docs/elevenlabs-agent.json");

const key = process.env.ELEVENLABS_API_KEY;
if (!key) {
  console.error("ELEVENLABS_API_KEY is not set (put it in .env). Config saved, nothing sent to ElevenLabs.");
  process.exit(1);
}
const agentId = process.env.ELEVENLABS_AGENT_ID || undefined;
const url = agentId
  ? `https://api.elevenlabs.io/v1/convai/agents/${encodeURIComponent(agentId)}`
  : "https://api.elevenlabs.io/v1/convai/agents/create";
const res = await fetch(url, {
  method: agentId ? "PATCH" : "POST",
  headers: { "xi-api-key": key, "content-type": "application/json" },
  body: JSON.stringify(config),
});
const text = await res.text();
if (!res.ok) {
  console.error(`ElevenLabs returned ${res.status}:\n${text}`);
  process.exit(1);
}
const json = JSON.parse(text);
const id = agentId || json.agent_id;
if (!id) { console.error("No agent_id in response:", text); process.exit(1); }
console.log(agentId ? `Updated agent ${id}` : `Created agent ${id}`);
if (!agentId) console.log(`\nAdd this to .env:\nELEVENLABS_AGENT_ID=${id}`);
