import { eachValueFrom } from "rxjs-for-await";
import { env } from "./env.ts";
import { createHmlsAgent } from "./agent.ts";
import {
  createAguiEventStream,
  parseRunAgentInput,
} from "@zypher/agui";

// Store agent instance (singleton)
let agentInstance: Awaited<ReturnType<typeof createHmlsAgent>> | null = null;

async function getAgent() {
  if (!agentInstance) {
    agentInstance = await createHmlsAgent();
  }
  return agentInstance;
}

// CORS headers for browser requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept",
};

// HTTP server with SSE for streaming (AG-UI protocol)
Deno.serve({ port: env.HTTP_PORT }, async (req) => {
  const url = new URL(req.url);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // Health check
  if (url.pathname === "/health") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  // AG-UI compatible endpoint
  if (url.pathname === "/task" && req.method === "POST") {
    try {
      const body = await req.json();

      // Parse and validate AG-UI input (throws on invalid input)
      let input;
      try {
        input = parseRunAgentInput(body);
      } catch (parseError) {
        return new Response(JSON.stringify({ error: "Invalid AG-UI input", details: String(parseError) }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { threadId, runId, messages } = input;
      console.log(`[http] AG-UI RunTask called: threadId=${threadId}, messages=${messages.length}`);

      const agent = await getAgent();

      // Create AG-UI event stream
      const aguiStream = createAguiEventStream({
        agent,
        messages,
        threadId,
        runId,
      });

      // Stream AG-UI events as SSE
      const stream = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();

          try {
            for await (const event of eachValueFrom(aguiStream)) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
            }
            controller.close();
          } catch (error) {
            console.error(`[http] Error:`, error);
            const errorEvent = {
              type: "RUN_ERROR",
              message: error instanceof Error ? error.message : String(error),
            };
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorEvent)}\n\n`));
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
      });
    } catch (error) {
      console.error(`[http] Request error:`, error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  return new Response("Not found", { status: 404, headers: corsHeaders });
});

console.log(`[http] Agent service (AG-UI) listening on 0.0.0.0:${env.HTTP_PORT}`);
