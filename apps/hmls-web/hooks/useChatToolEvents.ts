"use client";

import {
  getToolOrDynamicToolName,
  isToolOrDynamicToolUIPart,
  type UIMessage,
} from "ai";
import { useCallback, useEffect, useRef, useState } from "react";
import type { QuestionData } from "@/components/QuestionCard";
import type { SlotPickerData } from "@/components/SlotPicker";

/**
 * Tracks streaming tool-call state from an AI SDK chat: the currently running
 * tool, pending ask_user_question payloads, and pending slot-picker results.
 *
 * `setCurrentTool` is passed in (not owned) so the consuming chat hook can
 * also clear it from `useChat`'s `onFinish` / `onError` callbacks, which are
 * captured before this sub-hook runs.
 */
export function useChatToolEvents(
  chatMessages: UIMessage[],
  setCurrentTool: (tool: string | null) => void,
) {
  const [pendingQuestion, setPendingQuestion] = useState<QuestionData | null>(
    null,
  );
  const [pendingSlotPicker, setPendingSlotPicker] =
    useState<SlotPickerData | null>(null);

  const processedInvocationsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (chatMessages.length === 0) {
      processedInvocationsRef.current.clear();
    }
  }, [chatMessages.length]);

  useEffect(() => {
    const processed = processedInvocationsRef.current;

    for (const msg of chatMessages) {
      if (msg.role !== "assistant") continue;
      const toolParts = msg.parts.filter(isToolOrDynamicToolUIPart);

      for (const part of toolParts) {
        const toolName = getToolOrDynamicToolName(part);

        if (
          part.state === "input-available" ||
          part.state === "input-streaming"
        ) {
          setCurrentTool(toolName);
        }

        if (
          toolName === "ask_user_question" &&
          (part.state === "input-available" ||
            part.state === "output-available") &&
          !processed.has(`question-${part.toolCallId}`)
        ) {
          processed.add(`question-${part.toolCallId}`);
          setPendingQuestion(part.input as QuestionData);
        }

        if (
          part.state === "output-available" &&
          !processed.has(`result-${part.toolCallId}`)
        ) {
          processed.add(`result-${part.toolCallId}`);
          setCurrentTool(null);

          if (toolName === "get_availability" && part.output) {
            setPendingSlotPicker(part.output as SlotPickerData);
          }
        }
      }
    }
  }, [chatMessages, setCurrentTool]);

  const reset = useCallback(() => {
    processedInvocationsRef.current.clear();
    setPendingQuestion(null);
    setPendingSlotPicker(null);
  }, []);

  return {
    pendingQuestion,
    pendingSlotPicker,
    setPendingQuestion,
    setPendingSlotPicker,
    reset,
  };
}
