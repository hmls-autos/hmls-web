import { type CoreMessage, streamText, tool as aiTool } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { SYSTEM_PROMPT } from "./system-prompt.ts";
import { schedulingTools } from "./tools/scheduling.ts";
import { createStripeTools } from "./tools/stripe.ts";
import { estimateTools } from "./skills/estimate/tools.ts";
import { askUserQuestionTools } from "./tools/ask-user-question.ts";
import { laborLookupTools } from "./tools/labor-lookup.ts";
import { partsLookupTools } from "./tools/parts-lookup.ts";
import { formatUserContext, type UserContext } from "../types/user-context.ts";

const DEFAULT_MODEL = "gemini-2.5-flash";

export interface AgentConfig {
  googleApiKey: string;
  stripeSecretKey: string;
  agentModel?: string;
}

export interface RunAgentOptions {
  messages: CoreMessage[];
  config: AgentConfig;
  userContext?: UserContext;
}

// deno-lint-ignore no-explicit-any
interface LegacyTool<P = any> {
  name: string;
  description: string;
  // deno-lint-ignore no-explicit-any
  schema: any;
  execute: (params: P, ctx: unknown) => Promise<unknown>;
}

/** Convert existing tool arrays (name/schema/execute) to AI SDK tool records. */
function convertTools(existingTools: LegacyTool[]): Record<string, ReturnType<typeof aiTool>> {
  // deno-lint-ignore no-explicit-any
  const result: Record<string, any> = {};
  for (const t of existingTools) {
    result[t.name] = aiTool({
      description: t.description,
      parameters: t.schema,
      execute: (input) => t.execute(input, undefined),
    });
  }
  return result;
}

export function runHmlsAgent(options: RunAgentOptions) {
  const { messages, config, userContext } = options;
  const modelId = config.agentModel || DEFAULT_MODEL;
  console.log(`[agent] Running HMLS agent with model: ${modelId}`);

  const google = createGoogleGenerativeAI({ apiKey: config.googleApiKey });

  const systemPrompt = userContext
    ? `${SYSTEM_PROMPT}\n\n${formatUserContext(userContext)}`
    : SYSTEM_PROMPT;

  const allTools: LegacyTool[] = [
    ...askUserQuestionTools,
    ...estimateTools,
    ...(config.stripeSecretKey ? createStripeTools(config.stripeSecretKey) : []),
    ...schedulingTools,
    ...laborLookupTools,
    ...partsLookupTools,
  ];

  const tools = convertTools(allTools);

  const abortController = new AbortController();

  return streamText({
    model: google(modelId),
    system: systemPrompt,
    messages,
    tools,
    maxSteps: 10,
    abortSignal: abortController.signal,
    onStepFinish({ toolCalls }) {
      if (toolCalls.some((tc) => tc.toolName === "ask_user_question")) {
        abortController.abort();
      }
    },
  });
}
