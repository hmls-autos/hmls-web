"use client";

import { useChat } from "ai/react";
import { type RefObject, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AGENT_URL } from "@/lib/config";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  imageUrl?: string;
}

interface UseAgentChatOptions {
  scrollRef?: RefObject<HTMLElement | null>;
  inputRef?: RefObject<HTMLInputElement | null>;
  accessToken?: string | null;
}

export function useAgentChat(options: UseAgentChatOptions = {}) {
  const { scrollRef, inputRef, accessToken } = options;
  const [currentTool, setCurrentTool] = useState<string | null>(null);
  const imageUrlMapRef = useRef<Map<string, string>>(new Map());

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

  // Track active tool calls from streaming messages
  useEffect(() => {
    for (const msg of chatMessages) {
      if (msg.role !== "assistant" || !msg.toolInvocations) continue;
      for (const inv of msg.toolInvocations) {
        if (inv.state === "call" || inv.state === "partial-call") {
          setCurrentTool(inv.toolName);
        } else if (inv.state === "result") {
          setCurrentTool(null);
        }
      }
    }
  }, [chatMessages]);

  // Scroll on new messages
  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, scrollToBottom]);

  // Map to our Message interface
  const messages: Message[] = useMemo(() => {
    return chatMessages
      .filter((msg) => msg.role === "user" || msg.role === "assistant")
      .filter((msg) => msg.content) // skip empty tool-only steps
      .map((msg) => ({
        id: msg.id,
        role: msg.role as "user" | "assistant",
        content: msg.content,
        imageUrl: imageUrlMapRef.current.get(msg.id),
      }));
  }, [chatMessages]);

  const error = chatError?.message ?? null;

  const sendMessage = useCallback(
    (content: string, options?: { imageUrl?: string }) => {
      const id = crypto.randomUUID();
      if (options?.imageUrl) {
        imageUrlMapRef.current.set(id, options.imageUrl);
      }
      append({ role: "user", content, id });
    },
    [append],
  );

  const clearMessages = useCallback(() => {
    setChatMessages([]);
    imageUrlMapRef.current.clear();
  }, [setChatMessages]);

  const clearError = useCallback(() => {
    // useChat manages error state internally
  }, []);

  return {
    messages,
    isLoading,
    error,
    currentTool,
    sendMessage,
    clearMessages,
    clearError,
  };
}
