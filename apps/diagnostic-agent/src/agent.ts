import { anthropic, createZypherAgent } from "@corespeed/zypher";
import { SYSTEM_PROMPT } from "./system-prompt.ts";
import { analyzeImageTool } from "./tools/analyzeImage.ts";
import { transcribeAudioTool } from "./tools/transcribeAudio.ts";
import { extractVideoFramesTool } from "./tools/extractVideoFrames.ts";
import { lookupObdCodeTool } from "./tools/lookupObdCode.ts";
import { getMediaTool, saveMediaTool } from "./tools/storage.ts";

const DEFAULT_MODEL = "claude-sonnet-4-20250514";

const allTools = [
  analyzeImageTool,
  transcribeAudioTool,
  extractVideoFramesTool,
  lookupObdCodeTool,
  saveMediaTool,
  getMediaTool,
];

export async function createDiagnosticAgent() {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is required");
  }

  const modelId = Deno.env.get("AGENT_MODEL") || DEFAULT_MODEL;
  console.log(`[diagnostic-agent] Creating agent with model: ${modelId}`);

  const isDenoDeploy = Deno.env.get("DENO_DEPLOYMENT_ID") !== undefined;

  const agent = await createZypherAgent({
    model: anthropic(modelId, { apiKey }),
    tools: allTools,
    // Use /tmp for Deno Deploy (source dir is read-only)
    context: isDenoDeploy ? { zypherDir: "/tmp/.zypher" } : undefined,
    overrides: {
      // deno-lint-ignore require-await
      systemPromptLoader: async () => SYSTEM_PROMPT,
    },
  });

  // Discover and log skills
  await agent.skills.discover();
  const skillNames = Array.from(agent.skills.skills.values()).map(
    (s) => s.metadata.name,
  );
  if (skillNames.length > 0) {
    console.log(`[diagnostic-agent] Skills loaded: ${skillNames.join(", ")}`);
  }

  return agent;
}
