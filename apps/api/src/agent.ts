import { anthropic, createZypherAgent, ZypherAgent, type ZypherContext } from "@corespeed/zypher";
import { SYSTEM_PROMPT } from "./system-prompt.ts";
import { createCalcomTools } from "./tools/calcom.ts";
import { serviceTools } from "./tools/customer.ts";
import { createStripeTools } from "./tools/stripe.ts";
import { estimateTools } from "./skills/estimate/tools.ts";
import { formatUserContext, type UserContext } from "./types/user-context.ts";

const DEFAULT_MODEL = "claude-sonnet-4-5-latest";

const isDenoDeploy = Deno.env.get("DENO_DEPLOYMENT_ID") !== undefined;

export interface AgentConfig {
  anthropicApiKey: string;
  stripeSecretKey: string;
  calcomApiKey: string;
  calcomEventTypeId: string;
  agentModel?: string;
}

export interface CreateAgentOptions {
  config: AgentConfig;
  userContext?: UserContext;
}

export async function createHmlsAgent(options: CreateAgentOptions) {
  const { config } = options;
  const modelId = config.agentModel || DEFAULT_MODEL;
  console.log(`[agent] Creating HMLS agent with model: ${modelId}`);

  const systemPrompt = options.userContext
    ? `${SYSTEM_PROMPT}\n\n${formatUserContext(options.userContext)}`
    : SYSTEM_PROMPT;

  const allTools = [
    ...serviceTools,
    ...estimateTools,
    ...(config.stripeSecretKey ? createStripeTools(config.stripeSecretKey) : []),
    ...(config.calcomApiKey ? createCalcomTools(config.calcomApiKey, config.calcomEventTypeId) : []),
  ];

  if (isDenoDeploy) {
    const mockContext: ZypherContext = {
      workingDirectory: "/src",
      zypherDir: "/tmp/.zypher",
      workspaceDataDir: "/tmp/.zypher/data",
      fileAttachmentCacheDir: "/tmp/.zypher/cache",
      skillsDir: "/tmp/.zypher/skills",
    };

    const agent = new ZypherAgent(
      mockContext,
      anthropic(modelId, { apiKey: config.anthropicApiKey }),
      {
        tools: allTools,
        overrides: {
          // deno-lint-ignore require-await
          systemPromptLoader: async () => systemPrompt,
        },
      },
    );

    console.log(`[agent] Running on Deno Deploy (no filesystem)`);
    return agent;
  }

  const agent = await createZypherAgent({
    model: anthropic(modelId, { apiKey: config.anthropicApiKey }),
    tools: allTools,
    overrides: {
      // deno-lint-ignore require-await
      systemPromptLoader: async () => systemPrompt,
    },
  });

  await agent.skills.discover();
  const skillNames = Array.from(agent.skills.skills.values()).map(
    (s) => s.metadata.name,
  );
  if (skillNames.length > 0) {
    console.log(`[agent] Skills loaded: ${skillNames.join(", ")}`);
  }

  return agent;
}
