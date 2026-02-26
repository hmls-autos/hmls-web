import {
  LoopInterceptorManager,
  McpServerManager,
  type Message as ZypherMessage,
  ZypherAgent,
  type ZypherContext,
} from "@corespeed/zypher";
import { GeminiOpenAIProvider } from "./llm/gemini-openai-provider.ts";
import { CompleterToolInterceptor } from "./llm/completer-interceptor.ts";
import { SYSTEM_PROMPT } from "./system-prompt.ts";
import { schedulingTools } from "./tools/scheduling.ts";
import { createStripeTools } from "./tools/stripe.ts";
import { estimateTools } from "./skills/estimate/tools.ts";
import { askUserQuestionTools } from "./tools/ask-user-question.ts";
import { laborLookupTools } from "./tools/labor-lookup.ts";
import { partsLookupTools } from "./tools/parts-lookup.ts";
import { formatUserContext, type UserContext } from "./types/user-context.ts";

/** Tools that should stop the agent loop after execution (wait for user input) */
const COMPLETER_TOOLS = ["ask_user_question"];

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
    ...partsLookupTools,
  ];

  const context: ZypherContext = isDenoDeploy
    ? {
      workingDirectory: "/src",
      zypherDir: "/tmp/.zypher",
      workspaceDataDir: "/tmp/.zypher/data",
      fileAttachmentCacheDir: "/tmp/.zypher/cache",
      skillsDir: "/tmp/.zypher/skills",
    }
    : {
      workingDirectory: Deno.cwd(),
      zypherDir: `${Deno.cwd()}/.zypher`,
      workspaceDataDir: `${Deno.cwd()}/.zypher/data`,
      fileAttachmentCacheDir: `${Deno.cwd()}/.zypher/cache`,
      skillsDir: `${Deno.cwd()}/.zypher/skills`,
    };

  const mcpManager = new McpServerManager(context);
  const loopManager = new LoopInterceptorManager([
    new CompleterToolInterceptor(mcpManager, COMPLETER_TOOLS),
  ]);

  const agent = new ZypherAgent(
    context,
    modelProvider,
    {
      tools: allTools,
      initialMessages: options.initialMessages,
      overrides: {
        mcpServerManager: mcpManager,
        loopInterceptorManager: loopManager,
        // deno-lint-ignore require-await
        systemPromptLoader: async () => systemPrompt,
      },
    },
  );

  if (!isDenoDeploy) {
    await agent.skills.discover();
    const skillNames = Array.from(agent.skills.skills.values()).map(
      (s) => s.metadata.name,
    );
    if (skillNames.length > 0) {
      console.log(`[agent] Skills loaded: ${skillNames.join(", ")}`);
    }
  }

  return agent;
}
