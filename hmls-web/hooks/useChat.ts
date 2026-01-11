"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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

const WS_URL = process.env.NEXT_PUBLIC_API_WS_URL || "ws://127.0.0.1:54321/functions/v1/api/task";

export function useChat() {
  const [state, setState] = useState<ChatState>({
    messages: [],
    isConnected: false,
    isLoading: false,
    conversationId: null,
    currentTool: null,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const pendingMessageRef = useRef<string>("");

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      setState((s) => ({ ...s, isConnected: true }));
    };

    ws.onclose = () => {
      setState((s) => ({ ...s, isConnected: false }));
      // Reconnect after 3 seconds
      setTimeout(connect, 3000);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.onmessage = (event) => {
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
          setState((s) => ({ ...s, currentTool: data.name }));
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
    };

    wsRef.current = ws;
  }, []);

  const disconnect = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
  }, []);

  const sendMessage = useCallback(
    (message: string) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        console.error("WebSocket not connected");
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

      // Send to server
      wsRef.current.send(
        JSON.stringify({
          type: "message",
          message,
          conversationId: state.conversationId,
        }),
      );
    },
    [state.conversationId],
  );

  const clearMessages = useCallback(() => {
    setState((s) => ({ ...s, messages: [], conversationId: null }));
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return {
    messages: state.messages,
    isConnected: state.isConnected,
    isLoading: state.isLoading,
    currentTool: state.currentTool,
    sendMessage,
    clearMessages,
  };
}
