import { defineAgent } from "eve";
import { anthropic } from "eve/models/anthropic";

// Direct Anthropic API (ANTHROPIC_API_KEY), no AI Gateway, so the agent can be self-hosted on a VPS.
// defaultTools: false removes eve's bash/file/web tools: Donna acts only through the CRM tools in agent/tools/.
export default defineAgent({
  model: anthropic(process.env.DONNA_MODEL ?? "claude-opus-5-5"),
  reasoning: "medium",
  defaultTools: false,
});
