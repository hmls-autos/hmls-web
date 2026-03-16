// deno-lint-ignore no-explicit-any
export interface LegacyTool<P = any> {
  name: string;
  description: string;
  // deno-lint-ignore no-explicit-any
  schema: any;
  execute: (params: P, ctx?: unknown) => Promise<unknown>;
}

export interface ToolContext {
  userId?: string;
}

/** Convert existing tool arrays (name/schema/execute) to AI SDK tool records. */
// deno-lint-ignore no-explicit-any
export function convertTools(existingTools: LegacyTool[], ctx?: ToolContext): Record<string, any> {
  // deno-lint-ignore no-explicit-any
  const result: Record<string, any> = {};
  for (const t of existingTools) {
    result[t.name] = {
      description: t.description,
      inputSchema: t.schema,
      execute: (input: unknown) => t.execute(input, ctx),
    };
  }
  return result;
}
