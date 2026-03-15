"use client";

import { useChat } from "ai/react";
import {
  type RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { BookingConfirmationData } from "@/components/BookingConfirmation";
import type { EstimateCardData } from "@/components/EstimateCard";
import type { QuestionData } from "@/components/QuestionCard";
import type { SlotPickerData } from "@/components/SlotPicker";
import { AGENT_URL } from "@/lib/config";

export interface Message {
  id: string;
  role: "user" | "assistant" | "estimate-card" | "booking-confirmation";
  content: string;
  estimateData?: EstimateCardData;
  bookingData?: BookingConfirmationData;
}

interface UseAgentChatOptions {
  scrollRef?: RefObject<HTMLElement | null>;
  inputRef?: RefObject<HTMLInputElement | null>;
  accessToken?: string | null;
}

export function useAgentChat(options: UseAgentChatOptions = {}) {
  const { scrollRef, inputRef, accessToken } = options;
  const [pendingQuestion, setPendingQuestion] = useState<QuestionData | null>(
    null,
  );
  const [pendingSlotPicker, setPendingSlotPicker] =
    useState<SlotPickerData | null>(null);
  const [currentTool, setCurrentTool] = useState<string | null>(null);

  // Track which tool invocations we've already processed to avoid duplicates
  const processedInvocationsRef = useRef<Set<string>>(new Set());

  const scrollToBottom = useCallback(() => {
    scrollRef?.current?.scrollIntoView({ behavior: "smooth" });
  }, [scrollRef]);

  const focusInput = useCallback(() => {
    inputRef?.current?.focus();
  }, [inputRef]);

  const headers = useMemo(() => {
    const h: Record<string, string> = {};
    if (accessToken) {
      h.Authorization = `Bearer ${accessToken}`;
    }
    return h;
  }, [accessToken]);

  const {
    messages: chatMessages,
    isLoading,
    error: chatError,
    append,
    setMessages: setChatMessages,
  } = useChat({
    api: `${AGENT_URL}/task`,
    headers,
    maxSteps: 10,
    onFinish: () => {
      setCurrentTool(null);
      focusInput();
    },
    onError: (err) => {
      console.error("[agent] Chat error:", err);
      setCurrentTool(null);
    },
  });

  // Clear processed invocations when messages are reset externally
  useEffect(() => {
    if (chatMessages.length === 0) {
      processedInvocationsRef.current.clear();
    }
  }, [chatMessages.length]);

  // Derive tool call state from streaming messages
  useEffect(() => {
    const processed = processedInvocationsRef.current;

    for (const msg of chatMessages) {
      if (msg.role !== "assistant" || !msg.toolInvocations) continue;

      for (const inv of msg.toolInvocations) {
        // Track active tool calls
        if (inv.state === "call" || inv.state === "partial-call") {
          setCurrentTool(inv.toolName);
        }

        // Detect ask_user_question tool calls
        if (
          inv.toolName === "ask_user_question" &&
          (inv.state === "call" || inv.state === "result") &&
          !processed.has(`question-${inv.toolCallId}`)
        ) {
          processed.add(`question-${inv.toolCallId}`);
          setPendingQuestion(inv.args as QuestionData);
        }

        // Detect tool results
        if (inv.state === "result" && !processed.has(inv.toolCallId)) {
          processed.add(inv.toolCallId);
          setCurrentTool(null);

          if (inv.toolName === "get_availability" && inv.result) {
            setPendingSlotPicker(inv.result as SlotPickerData);
          }
        }
      }
    }
  }, [chatMessages]);

  // Scroll on new messages
  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, scrollToBottom]);

  // Build messages array matching the existing Message interface.
  // Injects estimate-card and booking-confirmation messages after
  // assistant messages that contain matching tool results.
  const messages: Message[] = useMemo(() => {
    const result: Message[] = [];

    for (const msg of chatMessages) {
      if (msg.role === "user") {
        result.push({ id: msg.id, role: "user", content: msg.content });
      } else if (msg.role === "assistant") {
        // Add the text content (may be empty during tool-only steps)
        if (msg.content) {
          result.push({ id: msg.id, role: "assistant", content: msg.content });
        }

        // Check tool invocations for card data
        if (msg.toolInvocations) {
          for (const inv of msg.toolInvocations) {
            if (inv.state !== "result") continue;

            if (
              inv.toolName === "create_booking" &&
              inv.result?.success !== undefined
            ) {
              result.push({
                id: `${msg.id}-booking-${inv.toolCallId}`,
                role: "booking-confirmation",
                content: "",
                bookingData: inv.result as BookingConfirmationData,
              });
            }

            if (
              inv.toolName === "create_estimate" &&
              inv.result?.success &&
              inv.result?.items
            ) {
              result.push({
                id: `${msg.id}-estimate-${inv.toolCallId}`,
                role: "estimate-card",
                content: "",
                estimateData: inv.result as EstimateCardData,
              });
            }
          }
        }
      }
    }

    return result;
  }, [chatMessages]);

  const error = chatError?.message ?? null;

  const sendMessage = useCallback(
    (content: string) => {
      setPendingQuestion(null);
      setPendingSlotPicker(null);
      append({ role: "user", content });
    },
    [append],
  );

  const answerQuestion = useCallback(
    (answer: string) => {
      setPendingQuestion(null);
      sendMessage(answer);
    },
    [sendMessage],
  );

  const selectSlot = useCallback(
    (providerId: number, time: string) => {
      setPendingSlotPicker(null);
      const timeLabel = new Date(time).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
      const dateLabel = new Date(time).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      });
      sendMessage(
        `I'd like the ${timeLabel} slot on ${dateLabel} with provider ${providerId}.`,
      );
    },
    [sendMessage],
  );

  const clearMessages = useCallback(() => {
    setChatMessages([]);
    setPendingQuestion(null);
    setPendingSlotPicker(null);
    processedInvocationsRef.current.clear();
  }, [setChatMessages]);

  const clearError = useCallback(() => {
    // useChat manages error state internally; clearing is a no-op
    // but we keep the function for API compatibility
  }, []);

  return {
    messages,
    isLoading,
    error,
    currentTool,
    pendingQuestion,
    pendingSlotPicker,
    sendMessage,
    answerQuestion,
    selectSlot,
    clearMessages,
    clearError,
  };
}
