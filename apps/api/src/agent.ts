import {
  anthropic,
  createZypherAgent,
  ZypherAgent,
  type ZypherContext,
} from "@corespeed/zypher";
import { env } from "./env.ts";
import { SYSTEM_PROMPT } from "./system-prompt.ts";
import { calcomTools } from "./tools/calcom.ts";
import { serviceTools } from "./tools/customer.ts";
import { stripeTools } from "./tools/stripe.ts";
import { estimateTools } from "./skills/estimate/tools.ts";
import { formatUserContext, type UserContext } from "./types/user-context.ts";

// Default model, can be overridden via env
const DEFAULT_MODEL = "claude-sonnet-4-20250514";

const isDenoDeploy = Deno.env.get("DENO_DEPLOYMENT_ID") !== undefined;

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

  const allTools = [
    ...serviceTools,
    ...estimateTools,
    ...stripeTools,
    ...calcomTools,
  ];

  if (isDenoDeploy) {
    // Deno Deploy has no writable filesystem - instantiate ZypherAgent directly
    // with a mock context to bypass directory creation
    const mockContext: ZypherContext = {
      workingDirectory: "/src",
      zypherDir: "/tmp/.zypher",
      workspaceDataDir: "/tmp/.zypher/data",
      fileAttachmentCacheDir: "/tmp/.zypher/cache",
      skillsDir: "/tmp/.zypher/skills",
    };

    const agent = new ZypherAgent(
      mockContext,
      anthropic(modelId, { apiKey: env.ANTHROPIC_API_KEY }),
      {
        tools: allTools,
        overrides: {
          systemPromptLoader: () => systemPrompt,
        },
      },
    );

    console.log(`[agent] Running on Deno Deploy (no filesystem)`);
    return agent;
  }

  // Local development - use factory with full features
  const agent = await createZypherAgent({
    model: anthropic(modelId, { apiKey: env.ANTHROPIC_API_KEY }),
    tools: allTools,
    overrides: {
      systemPromptLoader: () => systemPrompt,
    },
  });

  // Discover and log skills (only works with filesystem)
  await agent.skills.discover();
  const skillNames = Array.from(agent.skills.skills.values()).map(
    (s) => s.metadata.name,
  );
  if (skillNames.length > 0) {
    console.log(`[agent] Skills loaded: ${skillNames.join(", ")}`);
  }

  return agent;
}
