"use client";

import type { UIMessage } from "ai";
import { useEffect } from "react";

export const DEFAULT_CHAT_STORAGE_KEY = "hmls-chat-history";
const CHAT_STORAGE_VERSION = 1;
const PERSIST_DEBOUNCE_MS = 250;

type StoredChat = { v: number; messages: UIMessage[] };

export function loadStoredChatMessages(
  storageKey: string = DEFAULT_CHAT_STORAGE_KEY,
): UIMessage[] | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = localStorage.getItem(storageKey);
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

export function clearStoredChat(storageKey: string = DEFAULT_CHAT_STORAGE_KEY) {
  try {
    localStorage.removeItem(storageKey);
  } catch {
    /* ignore */
  }
}

/** Debounced persistence — during streaming, `chatMessages` mutates per
 * token, which would otherwise mean ~100 sync `JSON.stringify` +
 * `localStorage.setItem` calls per second on the main thread. Each render
 * schedules a write 250ms out; the cleanup cancels any pending write when
 * the next change lands, so a burst coalesces into one final write. */
export function useChatPersist(
  chatMessages: UIMessage[],
  storageKey: string = DEFAULT_CHAT_STORAGE_KEY,
) {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        if (chatMessages.length > 0) {
          localStorage.setItem(
            storageKey,
            JSON.stringify({
              v: CHAT_STORAGE_VERSION,
              messages: chatMessages,
            } satisfies StoredChat),
          );
        } else {
          localStorage.removeItem(storageKey);
        }
      } catch {
        /* localStorage full or unavailable */
      }
    }, PERSIST_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [chatMessages, storageKey]);
}
