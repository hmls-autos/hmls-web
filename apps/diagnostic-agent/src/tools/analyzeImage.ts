import { z } from "zod";

const analyzeImageSchema = z.object({
  imageUrl: z.string().describe("URL of the image to analyze"),
  context: z
    .string()
    .optional()
    .describe("Additional context about what to look for"),
});

export const analyzeImageTool = {
  name: "analyzeImage",
  description:
    "Analyze a vehicle photo for damage, wear, fluid leaks, and mechanical issues",
  schema: analyzeImageSchema,
  execute: async (params: z.infer<typeof analyzeImageSchema>) => {
    const { imageUrl, context } = params;

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY is required");
    }

    const prompt = `You are an expert automotive technician. Analyze this vehicle image and identify:
- Any visible damage or wear
- Fluid leaks or stains
- Component condition (tires, brakes, belts, hoses, etc.)
- Warning signs that need attention

${context ? `Additional context: ${context}` : ""}

Provide a detailed analysis with severity ratings (low/medium/high) for any issues found.`;

    // Use Claude API directly for vision
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "url",
                  url: imageUrl,
                },
              },
              {
                type: "text",
                text: prompt,
              },
            ],
          },
        ],
      }),
    });

    const result = await response.json();
    return result.content[0].text;
  },
};
