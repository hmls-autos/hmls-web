import { configure, getConsoleSink, getLogger } from "@logtape/logtape";

export async function setupLogging() {
  await configure({
    sinks: {
      console: getConsoleSink(),
    },
    filters: {},
    loggers: [
      {
        category: ["hmls"],
        level: Deno.env.get("LOG_LEVEL") === "debug" ? "debug" : "info",
        sinks: ["console"],
      },
    ],
  });
}

export function getGatewayLogger(name: string) {
  return getLogger(["hmls", "gateway", name]);
}

export function getAgentLogger(name: string) {
  return getLogger(["hmls", "agent", name]);
}
