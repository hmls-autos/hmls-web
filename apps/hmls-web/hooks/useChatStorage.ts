"use client";

import type { UIMessage } from "ai";
import { useEffect } from "react";

const CHAT_STORAGE_KEY = "hmls-chat-history";
const CHAT_STORAGE_VERSION = 1;

type StoredChat = { v: number; messages: UIMessage[] };

export function loadStoredChatMessages(): UIMessage[] | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY);
    if (!raw) return undefined;
    const parsed: unknown = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === "object" &&
      (parsed as StoredChat).v === CHAT_STORAGE_VERSION &&
      Array.isArray((parsed as StoredChat).messages)
    ) {
      const { messages } = parsed as StoredChat;
      return messages.length > 0 ? messages : undefined;
    }
    // Legacy: bare array from pre-versioned writes.
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed as UIMessage[];
    }
  } catch {
    /* ignore corrupt data */
  }
  return undefined;
}

export function clearStoredChat() {
  try {
    localStorage.removeItem(CHAT_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function useChatPersist(chatMessages: UIMessage[]) {
  useEffect(() => {
    try {
      if (chatMessages.length > 0) {
        localStorage.setItem(
          CHAT_STORAGE_KEY,
          JSON.stringify({
            v: CHAT_STORAGE_VERSION,
            messages: chatMessages,
          } satisfies StoredChat),
        );
      } else {
        localStorage.removeItem(CHAT_STORAGE_KEY);
      }
    } catch {
      /* localStorage full or unavailable */
    }
  }, [chatMessages]);
}
