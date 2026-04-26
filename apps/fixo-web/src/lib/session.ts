"use client";

import type { MutableRefObject } from "react";

import { AGENT_URL } from "@/lib/config";

const SESSION_ID_STORAGE_KEY = "fixo-chat-session-id";

const inFlight = new WeakMap<
  MutableRefObject<number | null>,
  Promise<number | null>
>();

function persistSessionId(id: number) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SESSION_ID_STORAGE_KEY, String(id));
  } catch {
    /* localStorage full or unavailable */
  }
}

/**
 * Read a previously-created Fixo session id from localStorage. Used at chat
 * mount to re-pair a restored transcript with the backend session that
 * actually owns its uploaded media. Returns null if absent or corrupt.
 */
export function loadStoredSessionId(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(SESSION_ID_STORAGE_KEY);
    if (!stored) return null;
    const n = parseInt(stored, 10);
    return Number.isInteger(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
}

/** Clear the persisted session id, e.g. when the user starts a new chat. */
export function clearStoredSessionId() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(SESSION_ID_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Resolve the current Fixo session id, lazily creating one on the gateway if
 * none exists. Concurrent callers share the same in-flight promise so we
 * never POST /sessions twice for the same ref.
 */
export async function ensureSession(
  accessToken: string,
  sessionIdRef: MutableRefObject<number | null>,
): Promise<number | null> {
  if (sessionIdRef.current) return sessionIdRef.current;

  const existing = inFlight.get(sessionIdRef);
  if (existing) return existing;

  const promise = (async () => {
    const res = await fetch(`${AGENT_URL}/sessions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { sessionId: number };
    sessionIdRef.current = data.sessionId;
    // Persist so a refresh that restores the chat transcript also re-pairs
    // it with the same backend session — otherwise media hydration on
    // /complete looks at a fresh empty session.
    persistSessionId(data.sessionId);
    return data.sessionId;
  })();

  inFlight.set(sessionIdRef, promise);
  void promise.finally(() => inFlight.delete(sessionIdRef));
  return promise;
}
