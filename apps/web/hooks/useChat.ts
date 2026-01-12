"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ReconnectingWebSocket from "reconnecting-websocket";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatState {
  messages: Message[];
  isConnected: boolean;
  isLoading: boolean;
  conversationId: number | null;
  currentTool: string | null;
}

const WS_URL = process.env.NEXT_PUBLIC_API_WS_URL || "ws://127.0.0.1:8000/task";

export function useChat() {
  const [state, setState] = useState<ChatState>({
    messages: [],
    isConnected: false,
    isLoading: false,
    conversationId: null,
    currentTool: null,
  });

  const wsRef = useRef<ReconnectingWebSocket | null>(null);
  const pendingMessageRef = useRef<string>("");
  const conversationIdRef = useRef<number | null>(null);

  // Keep conversationId in sync with ref for sendMessage
  useEffect(() => {
    conversationIdRef.current = state.conversationId;
  }, [state.conversationId]);

  useEffect(() => {
    // Create WebSocket with battle-tested reconnecting-websocket
    const ws = new ReconnectingWebSocket(WS_URL, [], {
      maxRetries: 10,
      connectionTimeout: 5000,
      maxReconnectionDelay: 30000, // Max 30s between retries
      minReconnectionDelay: 1000, // Start at 1s
      reconnectionDelayGrowFactor: 2, // Exponential backoff
    });

    ws.onopen = () => {
      setState((s) => ({ ...s, isConnected: true }));
    };

    ws.onclose = () => {
      setState((s) => ({ ...s, isConnected: false }));
    };

    ws.onerror = () => {
      // Errors are logged internally by reconnecting-websocket
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case "conversation":
            setState((s) => ({ ...s, conversationId: data.conversationId }));
            break;

          case "delta":
            pendingMessageRef.current += data.text;
            setState((s) => {
              const messages = [...s.messages];
              const lastMsg = messages[messages.length - 1];
              if (lastMsg?.role === "assistant") {
                lastMsg.content = pendingMessageRef.current;
              } else {
                messages.push({
                  id: crypto.randomUUID(),
                  role: "assistant",
                  content: pendingMessageRef.current,
                  timestamp: new Date(),
                });
              }
              return { ...s, messages };
            });
            break;

          case "tool_start":
            setState((s) => ({ ...s, currentTool: data.tool || data.name }));
            break;

          case "tool_end":
            setState((s) => ({ ...s, currentTool: null }));
            break;

          case "done":
            pendingMessageRef.current = "";
            setState((s) => ({ ...s, isLoading: false, currentTool: null }));
            break;

          case "error":
            pendingMessageRef.current = "";
            setState((s) => ({
              ...s,
              isLoading: false,
              currentTool: null,
              messages: [
                ...s.messages,
                {
                  id: crypto.randomUUID(),
                  role: "assistant",
                  content: "Sorry, an error occurred. Please try again.",
                  timestamp: new Date(),
                },
              ],
            }));
            break;
        }
      } catch {
        // Ignore invalid JSON
      }
    };

    wsRef.current = ws;

    return () => {
      ws.close();
    };
  }, []);

  const sendMessage = useCallback((message: string) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      return;
    }

    // Add user message to state
    setState((s) => ({
      ...s,
      isLoading: true,
      messages: [
        ...s.messages,
        {
          id: crypto.randomUUID(),
          role: "user",
          content: message,
          timestamp: new Date(),
        },
      ],
    }));

    // Send to server using ref for current conversationId
    ws.send(
      JSON.stringify({
        type: "message",
        message,
        conversationId: conversationIdRef.current,
      }),
    );
  }, []);

  const clearMessages = useCallback(() => {
    setState((s) => ({ ...s, messages: [], conversationId: null }));
  }, []);

  return {
    messages: state.messages,
    isConnected: state.isConnected,
    isLoading: state.isLoading,
    currentTool: state.currentTool,
    sendMessage,
    clearMessages,
  };
}
