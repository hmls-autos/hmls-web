import { type ModelMessage, stepCountIs, streamText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { getLogger } from "@logtape/logtape";
import { SYSTEM_PROMPT } from "./system-prompt.ts";
import { analyzeImageTool } from "./tools/analyzeImage.ts";
import { analyzeAudioNoiseTool } from "./tools/analyzeAudioNoise.ts";
import { extractVideoFramesTool } from "./tools/extractVideoFrames.ts";
import { lookupObdCodeTool } from "./tools/lookupObdCode.ts";
import { getMediaTool, saveMediaTool } from "./tools/storage.ts";

const DEFAULT_MODEL = "gemini-2.5-flash";

// deno-lint-ignore no-explicit-any
interface LegacyTool<P = any> {
  name: string;
  description: string;
  // deno-lint-ignore no-explicit-any
  schema: any;
  execute: (params: P, ctx?: unknown) => Promise<unknown>;
}

/** Convert existing tool arrays (name/schema/execute) to AI SDK tool records. */
// deno-lint-ignore no-explicit-any
function convertTools(existingTools: LegacyTool[]): Record<string, any> {
  // deno-lint-ignore no-explicit-any
  const result: Record<string, any> = {};
  for (const t of existingTools) {
    result[t.name] = {
      description: t.description,
      inputSchema: t.schema,
      execute: (input: unknown) => t.execute(input, undefined),
    };
  }
  return result;
}

const logger = getLogger(["hmls", "agent", "fixo"]);

export interface RunFixoAgentOptions {
  messages: ModelMessage[];
}

export function runFixoAgent(options: RunFixoAgentOptions) {
  const apiKey = Deno.env.get("GOOGLE_API_KEY");
  if (!apiKey) {
    throw new Error("GOOGLE_API_KEY is required");
  }

  const modelId = Deno.env.get("AGENT_MODEL") || DEFAULT_MODEL;
  const google = createGoogleGenerativeAI({ apiKey });

  const allTools: LegacyTool[] = [
    analyzeImageTool,
    analyzeAudioNoiseTool,
    extractVideoFramesTool,
    lookupObdCodeTool,
    saveMediaTool,
    getMediaTool,
  ];

  const tools = convertTools(allTools);
  const toolCount = Object.keys(tools).length;
  logger.info("Initializing Fixo agent", { model: modelId, toolCount });

  return streamText({
    model: google(modelId),
    system: SYSTEM_PROMPT,
    messages: options.messages,
    tools,
    stopWhen: stepCountIs(10),
    onStepFinish: (step) => {
      const toolCalls = step.toolCalls ?? [];
      if (toolCalls.length > 0) {
        logger.debug("Step tool calls", {
          toolNames: toolCalls.map((t) => t.toolName),
        });
      }
      if (step.finishReason && step.finishReason !== "tool-calls") {
        logger.info("Agent step finished", {
          finishReason: step.finishReason,
          inputTokens: step.usage?.inputTokens,
          outputTokens: step.usage?.outputTokens,
        });
      }
    },
  });
}
