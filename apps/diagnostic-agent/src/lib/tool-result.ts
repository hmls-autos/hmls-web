// MCP-compliant tool result helper for Zypher 0.9+
// ToolResult type is CallToolResult | string, so returning JSON string is simplest

/**
 * Wrap any value as a JSON string for tool result
 */
export function toolResult(data: unknown): string {
  return typeof data === "string" ? data : JSON.stringify(data);
}
