import { configure, getConsoleSink, getLogger } from "@logtape/logtape";

/**
 * Initialize LogTape with structured JSON logging.
 * Call this once at application startup.
 */
export async function initLogger() {
  await configure({
    sinks: {
      console: getConsoleSink({
        formatter: "json",
      }),
    },
    loggers: [
      {
        category: "hmls",
        lowestLevel: "debug",
        sinks: ["console"],
      },
    ],
  });
}

// Root logger for general application logs
export const logger = getLogger(["hmls"]);

// Specialized loggers for different modules
export const stripeLogger = getLogger(["hmls", "stripe"]);
export const calcomLogger = getLogger(["hmls", "calcom"]);
export const agentLogger = getLogger(["hmls", "agent"]);
export const dbLogger = getLogger(["hmls", "db"]);
export const wsLogger = getLogger(["hmls", "websocket"]);
