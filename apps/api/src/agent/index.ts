import { AnthropicModelProvider, createZypherAgent } from "@corespeed/zypher";
import { env } from "../lib/env";
import { agentLogger } from "../lib/logger";
import { SYSTEM_PROMPT } from "./system-prompt";
import { calcomTools } from "./tools/calcom";
import { customerTools } from "./tools/customer";
import { stripeTools } from "./tools/stripe";

// Default model, can be overridden via env
const DEFAULT_MODEL = "claude-sonnet-4-20250514";

export async function createHmlsAgent() {
  agentLogger.info`Creating HMLS agent`;

  const agent = await createZypherAgent({
    modelProvider: new AnthropicModelProvider({
      apiKey: env.ANTHROPIC_API_KEY,
    }),
    systemPrompt: SYSTEM_PROMPT,
    tools: [...calcomTools, ...customerTools, ...stripeTools],
  });

  return agent;
}

export function runAgentTask(
  agent: Awaited<ReturnType<typeof createHmlsAgent>>,
  message: string
) {
  const model = env.AGENT_MODEL || DEFAULT_MODEL;
  agentLogger.debug`Running agent task with model: ${model}`;
  return agent.runTask(message, model);
}
