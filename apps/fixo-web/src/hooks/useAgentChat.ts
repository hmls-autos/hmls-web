"use client";

import { useChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  type DynamicToolUIPart,
  lastAssistantMessageIsCompleteWithToolCalls,
  type UIMessage,
} from "ai";
import {
  type RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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

/** Extract concatenated text from a UIMessage's parts. */
function getTextContent(msg: UIMessage): string {
  return msg.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}

/** Extract dynamic tool parts from a UIMessage. */
function getToolParts(msg: UIMessage): DynamicToolUIPart[] {
  return msg.parts.filter(
    (p): p is DynamicToolUIPart => p.type === "dynamic-tool",
  );
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

  // Keep headers ref in sync so transport always has fresh token
  const headersRef = useRef<Record<string, string>>({});
  useEffect(() => {
    const h: Record<string, string> = {};
    if (accessToken) {
      h.Authorization = `Bearer ${accessToken}`;
    }
    headersRef.current = h;
  }, [accessToken]);

  // Create transport once, using a ref-based header resolver
  const transportRef = useRef<DefaultChatTransport<UIMessage> | null>(null);
  if (!transportRef.current) {
    transportRef.current = new DefaultChatTransport<UIMessage>({
      api: `${AGENT_URL}/task`,
      headers: () => headersRef.current,
    });
  }

  const {
    messages: chatMessages,
    status,
    error: chatError,
    sendMessage: chatSendMessage,
    setMessages: setChatMessages,
  } = useChat({
    transport: transportRef.current,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    onFinish: () => {
      setCurrentTool(null);
      focusInput();
    },
    onError: (err) => {
      console.error("[agent] Chat error:", err);
      setCurrentTool(null);
    },
  });

  const isLoading = status === "submitted" || status === "streaming";

  // Track active tool calls from streaming messages
  useEffect(() => {
    for (const msg of chatMessages) {
      if (msg.role !== "assistant") continue;
      for (const part of getToolParts(msg)) {
        if (
          part.state === "input-available" ||
          part.state === "input-streaming"
        ) {
          setCurrentTool(part.toolName);
        } else if (part.state === "output-available") {
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
      .filter((msg) => getTextContent(msg)) // skip empty tool-only steps
      .map((msg) => ({
        id: msg.id,
        role: msg.role as "user" | "assistant",
        content: getTextContent(msg),
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
      chatSendMessage({ text: content, messageId: id });
    },
    [chatSendMessage],
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
