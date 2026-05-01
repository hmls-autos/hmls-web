"use client";

import {
  getToolOrDynamicToolName,
  isToolOrDynamicToolUIPart,
  type UIMessage,
} from "ai";
import { AskUserQuestionCard } from "./AskUserQuestionCard";
import { LaborLookupCard, type LaborLookupOutput } from "./LaborLookupCard";
import { ObdCodeCard, type ObdLookupOutput } from "./ObdCodeCard";
import { type PartsLookupOutput, PartsPriceCard } from "./PartsPriceCard";

type ToolPart = Extract<
  UIMessage["parts"][number],
  { type: `tool-${string}` } | { type: "dynamic-tool" }
>;

/** Render a per-tool custom card if we know about the tool, otherwise return
 * `null` so the caller falls back to the generic <Tool> component. Centralizes
 * the type-name dispatch so the chat page stays small and adding a new card
 * is a one-line change here. */
export function renderToolCard(
  part: UIMessage["parts"][number],
  opts: {
    /** True when the user already responded to a prior ask_user_question.
     * The card uses this to disable buttons and dim the chosen option. */
    isAnswered?: boolean;
    /** The answer the user gave to a prior ask_user_question, used to
     * highlight which option they picked. */
    answer?: string;
    /** Called when the user taps an ask_user_question option. The chat page
     * forwards the label as a normal sendMessage. */
    onAnswer?: (label: string) => void;
  } = {},
): React.ReactNode {
  if (!isToolOrDynamicToolUIPart(part)) return null;
  const toolPart = part as ToolPart;
  const toolName = getToolOrDynamicToolName(toolPart);
  const state = toolPart.state;

  if (toolName === "ask_user_question") {
    // Always render with input — even input-streaming, so the user sees the
    // question forming up. Output-state of this tool is just a placeholder.
    const input = (toolPart as { input?: unknown }).input as
      | {
          question?: string;
          header?: string;
          options?: Array<{ label: string; description?: string }>;
        }
      | undefined;
    if (
      !input?.question ||
      !Array.isArray(input.options) ||
      input.options.length === 0
    ) {
      return null;
    }
    return (
      <AskUserQuestionCard
        answer={opts.answer}
        input={{
          question: input.question,
          header: input.header ?? "",
          options: input.options,
        }}
        isAnswered={opts.isAnswered ?? false}
        onAnswer={(label) => opts.onAnswer?.(label)}
      />
    );
  }

  const isLoading = state !== "output-available";
  const output =
    state === "output-available"
      ? (toolPart as { output?: unknown }).output
      : undefined;

  if (toolName === "lookupObdCode" || toolName === "lookup_obd_code") {
    return (
      <ObdCodeCard
        isLoading={isLoading}
        output={output as ObdLookupOutput | undefined}
      />
    );
  }
  if (toolName === "lookup_labor_time") {
    return (
      <LaborLookupCard
        isLoading={isLoading}
        output={output as LaborLookupOutput | undefined}
      />
    );
  }
  if (toolName === "lookup_parts_price") {
    return (
      <PartsPriceCard
        isLoading={isLoading}
        output={output as PartsLookupOutput | undefined}
      />
    );
  }
  return null;
}

export {
  AskUserQuestionCard,
  LaborLookupCard,
  type LaborLookupOutput,
  ObdCodeCard,
  type ObdLookupOutput,
  type PartsLookupOutput,
  PartsPriceCard,
};
