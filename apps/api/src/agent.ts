import {
  createZypherAgent,
  type Message as ZypherMessage,
  ZypherAgent,
  type ZypherContext,
} from "@corespeed/zypher";
import { GeminiOpenAIProvider } from "./llm/gemini-openai-provider.ts";
import { SYSTEM_PROMPT } from "./system-prompt.ts";
import { schedulingTools } from "./tools/scheduling.ts";
import { createStripeTools } from "./tools/stripe.ts";
import { estimateTools } from "./skills/estimate/tools.ts";
import { askUserQuestionTools } from "./tools/ask-user-question.ts";
import { laborLookupTools } from "./tools/labor-lookup.ts";
import { formatUserContext, type UserContext } from "./types/user-context.ts";

const DEFAULT_MODEL = "gemini-2.5-flash";
const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai/";

const isDenoDeploy = Deno.env.get("DENO_DEPLOYMENT_ID") !== undefined;

export interface AgentConfig {
  googleApiKey: string;
  stripeSecretKey: string;
  agentModel?: string;
}

export interface CreateAgentOptions {
  config: AgentConfig;
  userContext?: UserContext;
  /** Previous conversation messages to restore context */
  initialMessages?: ZypherMessage[];
}

export async function createHmlsAgent(options: CreateAgentOptions) {
  const { config } = options;
  const modelId = config.agentModel || DEFAULT_MODEL;
  console.log(`[agent] Creating HMLS agent with model: ${modelId}`);

  const modelProvider = new GeminiOpenAIProvider({
    model: modelId,
    apiKey: config.googleApiKey,
    baseUrl: GEMINI_BASE_URL,
  });

  const systemPrompt = options.userContext
    ? `${SYSTEM_PROMPT}\n\n${formatUserContext(options.userContext)}`
    : SYSTEM_PROMPT;

  const allTools = [
    ...askUserQuestionTools,
    ...estimateTools,
    ...(config.stripeSecretKey ? createStripeTools(config.stripeSecretKey) : []),
    ...schedulingTools,
    ...laborLookupTools,
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
      modelProvider,
      {
        tools: allTools,
        initialMessages: options.initialMessages,
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
    model: modelProvider,
    tools: allTools,
    initialMessages: options.initialMessages,
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
