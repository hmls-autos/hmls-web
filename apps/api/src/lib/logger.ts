import {
  type ConsoleSinkOptions,
  configure,
  getConsoleSink,
  getLogger,
  type LogRecord,
} from "@logtape/logtape";

/**
 * JSON formatter for structured logging output.
 */
function jsonFormatter(record: LogRecord): string {
  return JSON.stringify({
    time: new Date(record.timestamp).toISOString(),
    level: record.level,
    category: record.category.join("."),
    message: record.message
      .map((m) => (typeof m === "string" ? m : JSON.stringify(m)))
      .join(""),
    ...record.properties,
  });
}

/**
 * Initialize LogTape with structured JSON logging.
 * Call this once at application startup.
 */
export async function initLogger() {
  await configure({
    sinks: {
      console: getConsoleSink({
        formatter: jsonFormatter,
      } as ConsoleSinkOptions),
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
