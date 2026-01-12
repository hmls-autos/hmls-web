import { AnthropicModelProvider, createZypherAgent } from "@corespeed/zypher";
import { env } from "./env.ts";
import { SYSTEM_PROMPT } from "./system-prompt.ts";
import { calcomTools } from "./tools/calcom.ts";
import { customerTools } from "./tools/customer.ts";
import { stripeTools } from "./tools/stripe.ts";

// Default model, can be overridden via env
const DEFAULT_MODEL = "claude-sonnet-4-20250514";

export async function createHmlsAgent() {
  console.log("[agent] Creating HMLS agent");

  const agent = await createZypherAgent({
    modelProvider: new AnthropicModelProvider({
      apiKey: env.ANTHROPIC_API_KEY,
    }),
    tools: [...calcomTools, ...customerTools, ...stripeTools],
    overrides: {
      systemPromptLoader: async () => SYSTEM_PROMPT,
    },
  });

  return agent;
}

export function runAgentTask(
  agent: Awaited<ReturnType<typeof createHmlsAgent>>,
  message: string
) {
  const model = env.AGENT_MODEL || DEFAULT_MODEL;
  console.log(`[agent] Running task with model: ${model}`);
  return agent.runTask(message, model);
}
