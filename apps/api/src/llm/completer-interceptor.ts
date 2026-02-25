/**
 * Loop interceptor that stops the agent loop when a "completer" tool is called.
 *
 * Completer tools (like `ask_user_question`) are tools where the agent should
 * stop and wait for user input rather than continuing to another model turn.
 * Without this, the agent executes the tool then makes another LLM call that
 * redundantly echoes the question as text.
 *
 * Wraps Zypher's ToolExecutionInterceptor: executes all tools normally, then
 * checks if any was a completer. If so, returns `{ complete: true }`.
 */
import type {
  InterceptorContext,
  InterceptorResult,
  LoopInterceptor,
  McpServerManager,
  ToolExecutionInterceptor,
} from "@corespeed/zypher";
import { executeTools } from "@corespeed/zypher";

export class CompleterToolInterceptor implements LoopInterceptor {
  readonly name = "completer-tool-execution";
  readonly #inner: ToolExecutionInterceptor;
  readonly #completerTools: Set<string>;

  constructor(mcpServerManager: McpServerManager, completerToolNames: string[]) {
    this.#inner = executeTools(mcpServerManager) as ToolExecutionInterceptor;
    this.#completerTools = new Set(completerToolNames);
  }

  async intercept(context: InterceptorContext): Promise<InterceptorResult> {
    // Delegate to built-in tool execution first
    const result = await this.#inner.intercept(context);

    // If tool execution says "complete" (no tools were called), pass through
    if (result.complete) {
      return result;
    }

    // Tools were executed. Check if any was a completer tool.
    // The assistant message with tool_use blocks is second-to-last
    // (tool execution pushed the tool_result user message as last).
    const assistantMsg = context.messages[context.messages.length - 2];
    if (assistantMsg?.role === "assistant") {
      const hasCompleter = assistantMsg.content.some(
        (block) =>
          block.type === "tool_use" && this.#completerTools.has(block.name),
      );
      if (hasCompleter) {
        return { complete: true };
      }
    }

    return result;
  }
}
