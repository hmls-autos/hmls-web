"use client";

import { useCallback, useEffect, useRef } from "react";
import { HttpAgent } from "@ag-ui/client";
import {
  EventType,
  type BaseEvent,
  type TextMessageStartEvent,
  type TextMessageContentEvent,
  type ToolCallStartEvent,
  type Message as AgUIMessage,
} from "@ag-ui/core";
import { useChatStore } from "@/stores/chatStore";

const AGENT_URL =
  process.env.NEXT_PUBLIC_AGENT_URL || "http://127.0.0.1:50051/task";

// Shared agent instance
let sharedAgent: HttpAgent | null = null;

function getSharedAgent() {
  if (!sharedAgent) {
    sharedAgent = new HttpAgent({
      url: AGENT_URL,
    });
  }
  return sharedAgent;
}

export function useChat() {
  const agentRef = useRef<HttpAgent | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const threadIdRef = useRef<string>(crypto.randomUUID());
  const messagesRef = useRef<AgUIMessage[]>([]);

  const {
    messages,
    isConnected,
    isLoading,
    currentTool,
    addUserMessage,
    appendAssistantMessage,
    setCurrentTool,
    resetPendingMessage,
    addErrorMessage,
    clearMessages,
    setConnected,
    setLoading,
  } = useChatStore();

  useEffect(() => {
    agentRef.current = getSharedAgent();
    setConnected(true);

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [setConnected]);

  const sendMessage = useCallback(
    async (message: string) => {
      const agent = agentRef.current;
      if (!agent) return;

      // Add user message to UI
      addUserMessage(message);
      setLoading(true);

      // Build AG-UI message
      const userMessage: AgUIMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: message,
      };

      // Add to message history
      messagesRef.current = [...messagesRef.current, userMessage];

      const runId = crypto.randomUUID();

      try {
        // Create abort controller for this run
        abortControllerRef.current = new AbortController();

        const response = await fetch(AGENT_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "text/event-stream",
          },
          body: JSON.stringify({
            threadId: threadIdRef.current,
            runId,
            messages: messagesRef.current,
            tools: [],
            context: [],
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("No response body");
        }

        const decoder = new TextDecoder();
        let buffer = "";
        let currentMessageId: string | null = null;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;

            try {
              const event = JSON.parse(line.slice(6)) as BaseEvent;

              switch (event.type) {
                case EventType.TEXT_MESSAGE_START: {
                  const startEvent = event as unknown as TextMessageStartEvent;
                  currentMessageId = startEvent.messageId;
                  break;
                }

                case EventType.TEXT_MESSAGE_CONTENT: {
                  const contentEvent =
                    event as unknown as TextMessageContentEvent;
                  appendAssistantMessage(contentEvent.delta);
                  break;
                }

                case EventType.TEXT_MESSAGE_END:
                  if (currentMessageId) {
                    // Add assistant message to history for future context
                    const lastMsg = messages[messages.length - 1];
                    if (lastMsg?.role === "assistant") {
                      messagesRef.current = [
                        ...messagesRef.current,
                        {
                          id: currentMessageId,
                          role: "assistant",
                          content: lastMsg.content,
                        },
                      ];
                    }
                  }
                  currentMessageId = null;
                  break;

                case EventType.TOOL_CALL_START: {
                  const toolEvent = event as unknown as ToolCallStartEvent;
                  setCurrentTool(toolEvent.toolCallName);
                  break;
                }

                case EventType.TOOL_CALL_END:
                  setCurrentTool(null);
                  break;

                case EventType.RUN_FINISHED:
                  resetPendingMessage();
                  break;

                case EventType.RUN_ERROR:
                  addErrorMessage();
                  break;
              }
            } catch {
              // Ignore invalid JSON
            }
          }
        }

        // Ensure we reset state even if RUN_FINISHED wasn't received
        resetPendingMessage();
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error("[useChat] Error:", error);
          addErrorMessage();
        }
      }
    },
    [
      addUserMessage,
      appendAssistantMessage,
      setCurrentTool,
      resetPendingMessage,
      addErrorMessage,
      setLoading,
      messages,
    ]
  );

  const handleClearMessages = useCallback(() => {
    // Reset thread and message history
    threadIdRef.current = crypto.randomUUID();
    messagesRef.current = [];
    clearMessages();
  }, [clearMessages]);

  return {
    messages,
    isConnected,
    isLoading,
    currentTool,
    sendMessage,
    clearMessages: handleClearMessages,
  };
}

// Re-export Message type for convenience
export type { Message } from "@/stores/chatStore";
