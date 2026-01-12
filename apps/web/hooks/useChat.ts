"use client";

import { useCallback, useEffect, useRef } from "react";
import ReconnectingWebSocket from "reconnecting-websocket";
import { useChatStore } from "@/stores/chatStore";

const WS_URL = process.env.NEXT_PUBLIC_API_WS_URL || "ws://127.0.0.1:8000/task";

// Singleton WebSocket instance shared across all components
let sharedWs: ReconnectingWebSocket | null = null;
let wsRefCount = 0;

function getSharedWebSocket() {
  if (!sharedWs) {
    sharedWs = new ReconnectingWebSocket(WS_URL, [], {
      maxRetries: 10,
      connectionTimeout: 5000,
      maxReconnectionDelay: 30000,
      minReconnectionDelay: 1000,
      reconnectionDelayGrowFactor: 2,
    });

    sharedWs.onopen = () => {
      useChatStore.getState().setConnected(true);
    };

    sharedWs.onclose = () => {
      useChatStore.getState().setConnected(false);
    };

    sharedWs.onerror = () => {
      // Errors are logged internally by reconnecting-websocket
    };

    sharedWs.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const state = useChatStore.getState();

        switch (data.type) {
          case "conversation":
            state.setConversationId(data.conversationId);
            break;

          case "delta":
            state.appendAssistantMessage(data.text);
            break;

          case "tool_start":
            state.setCurrentTool(data.tool || data.name);
            break;

          case "tool_end":
            state.setCurrentTool(null);
            break;

          case "done":
            state.resetPendingMessage();
            break;

          case "error":
            state.addErrorMessage();
            break;
        }
      } catch {
        // Ignore invalid JSON
      }
    };
  }

  return sharedWs;
}

export function useChat() {
  const wsRef = useRef<ReconnectingWebSocket | null>(null);

  const {
    messages,
    isConnected,
    isLoading,
    currentTool,
    conversationId,
    addUserMessage,
    clearMessages,
  } = useChatStore();

  useEffect(() => {
    wsRef.current = getSharedWebSocket();
    wsRefCount++;

    return () => {
      wsRefCount--;
      // Only close if no more components are using it
      if (wsRefCount === 0 && sharedWs) {
        sharedWs.close();
        sharedWs = null;
      }
    };
  }, []);

  const sendMessage = useCallback(
    (message: string) => {
      const ws = wsRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        return;
      }

      addUserMessage(message);

      ws.send(
        JSON.stringify({
          type: "message",
          message,
          conversationId,
        }),
      );
    },
    [conversationId, addUserMessage],
  );

  return {
    messages,
    isConnected,
    isLoading,
    currentTool,
    sendMessage,
    clearMessages,
  };
}

// Re-export Message type for convenience
export type { Message } from "@/stores/chatStore";
