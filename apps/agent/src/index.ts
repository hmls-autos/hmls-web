import { eachValueFrom } from "rxjs-for-await";
import { env } from "./env.ts";
import { createHmlsAgent, runAgentTask } from "./agent.ts";

// Store agent instance (singleton)
let agentInstance: Awaited<ReturnType<typeof createHmlsAgent>> | null = null;

async function getAgent() {
  if (!agentInstance) {
    agentInstance = await createHmlsAgent();
  }
  return agentInstance;
}

// HTTP server with SSE for streaming
Deno.serve({ port: env.HTTP_PORT }, async (req) => {
  const url = new URL(req.url);

  // Health check
  if (url.pathname === "/health") {
    return new Response("ok", { status: 200 });
  }

  // Run task endpoint with SSE streaming
  if (url.pathname === "/task" && req.method === "POST") {
    try {
      const body = await req.json();
      const { message, conversation_id } = body;

      if (!message) {
        return new Response(JSON.stringify({ error: "message is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      console.log(`[http] RunTask called: "${message.substring(0, 50)}..."`);

      const agent = await getAgent();
      const taskStream = runAgentTask(agent, message);

      // Create SSE stream
      const stream = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();

          try {
            for await (const event of eachValueFrom(taskStream)) {
              let data: Record<string, unknown> | null = null;

              if (event.type === "text") {
                // Streaming text content
                data = { type: "text_delta", text: event.content };
              } else if (event.type === "tool_use") {
                data = { type: "tool_start", tool_name: event.name };
              } else if (event.type === "tool_result") {
                data = { type: "tool_end", tool_name: event.name };
              }

              if (data) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
              }
            }

            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`));
            controller.close();
          } catch (error) {
            console.error(`[http] Error:`, error);
            const errorData = { type: "error", message: error instanceof Error ? error.message : String(error) };
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorData)}\n\n`));
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
      });
    } catch (error) {
      console.error(`[http] Request error:`, error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  return new Response("Not found", { status: 404 });
});

console.log(`[http] Agent service listening on 0.0.0.0:${env.HTTP_PORT}`);
