import { createFixoAgent } from "../agent.ts";

// Agent singleton
let agent: Awaited<ReturnType<typeof createFixoAgent>> | null = null;

export async function getAgent() {
  if (!agent) {
    agent = await createFixoAgent();
  }
  return agent;
}
