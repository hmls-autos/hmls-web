/**
 * WebSocket message types for the HMLS chat API.
 * Uses discriminated unions for type-safe message handling.
 */

/**
 * Messages sent from the server to the client
 */
export type ServerMessage =
  | { type: "conversation"; conversationId: number }
  | { type: "delta"; text: string }
  | { type: "tool_start"; tool: string }
  | { type: "tool_end"; tool: string; result?: unknown }
  | { type: "done" }
  | { type: "error"; message: string };

/**
 * Messages sent from the client to the server
 */
export type ClientMessage = {
  type: "message";
  message: string;
  conversationId?: number;
};

/**
 * Type guard to check if a message is a valid ClientMessage
 */
export function isValidClientMessage(data: unknown): data is ClientMessage {
  if (typeof data !== "object" || data === null) return false;
  const msg = data as Record<string, unknown>;
  return msg.type === "message" && typeof msg.message === "string";
}

/**
 * Create a typed server message
 */
export function createServerMessage<T extends ServerMessage["type"]>(
  type: T,
  data: Omit<Extract<ServerMessage, { type: T }>, "type">
): ServerMessage {
  return { type, ...data } as ServerMessage;
}
