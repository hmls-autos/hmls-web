import { createZypherAgent, anthropic } from "@corespeed/zypher";
import { env } from "./env.ts";
import { SYSTEM_PROMPT } from "./system-prompt.ts";
import { calcomTools } from "./tools/calcom.ts";
import { serviceTools } from "./tools/customer.ts";
import { stripeTools } from "./tools/stripe.ts";
import { estimateTools } from "./skills/estimate/tools.ts";
import { type UserContext, formatUserContext } from "./types/user-context.ts";

// Default model, can be overridden via env
const DEFAULT_MODEL = "claude-sonnet-4-20250514";

export interface CreateAgentOptions {
  userContext?: UserContext;
}

export async function createHmlsAgent(options: CreateAgentOptions = {}) {
  const modelId = env.AGENT_MODEL || DEFAULT_MODEL;
  console.log(`[agent] Creating HMLS agent with model: ${modelId}`);

  // Build system prompt with user context if available
  const systemPrompt = options.userContext
    ? `${SYSTEM_PROMPT}\n\n${formatUserContext(options.userContext)}`
    : SYSTEM_PROMPT;

  const agent = await createZypherAgent({
    model: anthropic(modelId, { apiKey: env.ANTHROPIC_API_KEY }),
    tools: [...serviceTools, ...estimateTools, ...stripeTools, ...calcomTools],
    // Use /tmp for Deno Deploy (source dir is read-only)
    contextDir: Deno.env.get("DENO_DEPLOYMENT_ID") ? "/tmp/.zypher" : undefined,
    overrides: {
      systemPromptLoader: async () => systemPrompt,
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
