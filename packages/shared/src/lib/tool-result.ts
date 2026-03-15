// Tool result helper — returns raw data for AI SDK tool execution.
// AI SDK handles serialization of tool results automatically.

/**
 * Pass-through helper for tool results. Returns the data as-is.
 */
export function toolResult<T>(data: T): T {
  return data;
}
