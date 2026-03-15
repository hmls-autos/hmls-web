import { type CoreMessage, streamText, tool as aiTool } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
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

export interface RunFixoAgentOptions {
  messages: CoreMessage[];
}

export function runFixoAgent(options: RunFixoAgentOptions) {
  const apiKey = Deno.env.get("GOOGLE_API_KEY");
  if (!apiKey) {
    throw new Error("GOOGLE_API_KEY is required");
  }

  const modelId = Deno.env.get("AGENT_MODEL") || DEFAULT_MODEL;
  console.log(`[fixo-agent] Running agent with model: ${modelId}`);

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

  return streamText({
    model: google(modelId),
    system: SYSTEM_PROMPT,
    messages: options.messages,
    tools,
    maxSteps: 10,
  });
}
