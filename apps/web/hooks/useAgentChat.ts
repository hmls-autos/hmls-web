"use client";

import { type Message as AgentMessage, HttpAgent } from "@ag-ui/client";
import { type RefObject, useCallback, useRef, useState } from "react";

const AGENT_URL = process.env.NEXT_PUBLIC_AGENT_URL || "http://localhost:8080";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface UseAgentChatOptions {
  scrollRef?: RefObject<HTMLElement | null>;
  inputRef?: RefObject<HTMLInputElement | null>;
}

export function useAgentChat(options: UseAgentChatOptions = {}) {
  const { scrollRef, inputRef } = options;
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTool, setCurrentTool] = useState<string | null>(null);
  const agentRef = useRef<HttpAgent | null>(null);

  const scrollToBottom = useCallback(() => {
    scrollRef?.current?.scrollIntoView({ behavior: "smooth" });
  }, [scrollRef]);

  const focusInput = useCallback(() => {
    inputRef?.current?.focus();
  }, [inputRef]);

  function getAgent() {
    if (!agentRef.current) {
      agentRef.current = new HttpAgent({ url: `${AGENT_URL}/task` });
    }
    return agentRef.current;
  }

  async function sendMessage(content: string) {
    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    setTimeout(scrollToBottom, 0);

    const agent = getAgent();

    agent.setMessages([
      ...messages.map(
        (m) => ({ id: m.id, role: m.role, content: m.content }) as AgentMessage,
      ),
      { id: userMsg.id, role: "user", content } as AgentMessage,
    ]);

    let assistantId = "";
    let buffer = "";

    try {
      await agent.runAgent(undefined, {
        onTextMessageStartEvent: ({ event }) => {
          assistantId = event.messageId;
          buffer = "";
          setMessages((m) => [
            ...m,
            { id: assistantId, role: "assistant", content: "" },
          ]);
          setTimeout(scrollToBottom, 0);
        },
        onTextMessageContentEvent: ({ event }) => {
          buffer += event.delta;
          setMessages((m) =>
            m.map((msg) =>
              msg.id === assistantId ? { ...msg, content: buffer } : msg,
            ),
          );
          setTimeout(scrollToBottom, 0);
        },
        onToolCallStartEvent: ({ event }) => {
          setCurrentTool(event.toolCallName);
          setTimeout(scrollToBottom, 0);
        },
        onToolCallEndEvent: () => {
          setCurrentTool(null);
        },
        onRunFinishedEvent: () => {
          setIsLoading(false);
          focusInput();
        },
        onRunErrorEvent: () => {
          setIsLoading(false);
          focusInput();
        },
      });
    } catch {
      setIsLoading(false);
      focusInput();
    }
  }

  function clearMessages() {
    setMessages([]);
    agentRef.current = null;
  }

  return { messages, isLoading, currentTool, sendMessage, clearMessages };
}
