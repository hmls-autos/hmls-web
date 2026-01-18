import { create } from "zustand";

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
  currentTool: string | null;
}

interface ChatActions {
  setConnected: (connected: boolean) => void;
  setLoading: (loading: boolean) => void;
  setCurrentTool: (tool: string | null) => void;
  addUserMessage: (content: string) => void;
  appendAssistantMessage: (text: string) => void;
  addErrorMessage: () => void;
  clearMessages: () => void;
  resetPendingMessage: () => void;
}

// Track pending message content outside of store for streaming
let pendingMessageContent = "";

export const useChatStore = create<ChatState & ChatActions>((set) => ({
  // State
  messages: [],
  isConnected: false,
  isLoading: false,
  currentTool: null,

  // Actions
  setConnected: (connected) => set({ isConnected: connected }),

  setLoading: (loading) => set({ isLoading: loading }),

  setCurrentTool: (tool) => set({ currentTool: tool }),

  addUserMessage: (content) =>
    set((state) => ({
      isLoading: true,
      messages: [
        ...state.messages,
        {
          id: crypto.randomUUID(),
          role: "user",
          content,
          timestamp: new Date(),
        },
      ],
    })),

  appendAssistantMessage: (text) => {
    pendingMessageContent += text;
    set((state) => {
      const messages = [...state.messages];
      const lastMsg = messages[messages.length - 1];
      if (lastMsg?.role === "assistant") {
        lastMsg.content = pendingMessageContent;
      } else {
        messages.push({
          id: crypto.randomUUID(),
          role: "assistant",
          content: pendingMessageContent,
          timestamp: new Date(),
        });
      }
      return { messages };
    });
  },

  addErrorMessage: () => {
    pendingMessageContent = "";
    set((state) => ({
      isLoading: false,
      currentTool: null,
      messages: [
        ...state.messages,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Sorry, an error occurred. Please try again.",
          timestamp: new Date(),
        },
      ],
    }));
  },

  clearMessages: () => {
    pendingMessageContent = "";
    set({ messages: [] });
  },

  resetPendingMessage: () => {
    pendingMessageContent = "";
    set({ isLoading: false, currentTool: null });
  },
}));
