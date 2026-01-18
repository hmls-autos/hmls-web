import { createZypherAgent, anthropic } from "@corespeed/zypher";
import { env } from "./env.ts";
import { SYSTEM_PROMPT } from "./system-prompt.ts";
import { calcomTools } from "./tools/calcom.ts";
import { customerTools } from "./tools/customer.ts";
import { stripeTools } from "./tools/stripe.ts";

// Default model, can be overridden via env
const DEFAULT_MODEL = "claude-sonnet-4-20250514";

export async function createHmlsAgent() {
  const modelId = env.AGENT_MODEL || DEFAULT_MODEL;
  console.log(`[agent] Creating HMLS agent with model: ${modelId}`);

  const agent = await createZypherAgent({
    model: anthropic(modelId, { apiKey: env.ANTHROPIC_API_KEY }),
    tools: [...calcomTools, ...customerTools, ...stripeTools],
    overrides: {
      systemPromptLoader: async () => SYSTEM_PROMPT,
    },
  });

  // Discover and log skills
  await agent.skills.discover();
  const skillNames = Array.from(agent.skills.skills.values()).map(
    (s) => s.metadata.name
  );
  if (skillNames.length > 0) {
    console.log(`[agent] Skills loaded: ${skillNames.join(", ")}`);
  }

  return agent;
}
