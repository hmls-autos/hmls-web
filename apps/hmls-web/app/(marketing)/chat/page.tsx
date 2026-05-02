"use client";

import { isToolOrDynamicToolUIPart } from "ai";
import { motion, useReducedMotion } from "framer-motion";
import { Loader2, Send, Wrench } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  type FormEvent,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAuth } from "@/components/AuthProvider";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { askConfirm } from "@/components/ui/ConfirmDialog";
import { useAgentChat } from "@/hooks/useAgentChat";

const SUGGESTIONS = [
  "What services do you offer?",
  "I need an oil change",
  "Check availability",
  "Get a quote for brake service",
];

function WelcomeScreen({ onPick }: { onPick: (text: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="w-16 h-16 rounded-full bg-red-light flex items-center justify-center mb-4"
      >
        <Wrench className="w-8 h-8 text-red-primary" />
      </motion.div>
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-xl font-display font-bold text-text mb-2"
      >
        Welcome to HMLS Assistant
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-text-secondary max-w-md"
      >
        I can help you with scheduling appointments, getting quotes, checking
        service availability, and answering questions about our mobile mechanic
        services.
      </motion.p>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex flex-wrap gap-2 mt-6 justify-center"
      >
        {SUGGESTIONS.map((suggestion, index) => (
          <motion.button
            key={suggestion}
            type="button"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 + index * 0.1 }}
            whileHover={{
              scale: 1.05,
              borderColor: "rgb(220 38 38 / 0.5)",
            }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onPick(suggestion)}
            className="px-4 py-2 rounded-full bg-surface-alt border border-border text-sm text-text-secondary hover:border-red-primary/50 hover:text-red-primary transition-colors"
          >
            {suggestion}
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
}

function ChatPageInner() {
  const prefersReducedMotion = useReducedMotion();
  const { session, isLoading: authLoading, isAdmin } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const skipAuth = process.env.NEXT_PUBLIC_SKIP_AUTH === "true";

  // Redirect unauthenticated visitors to /login so they never hit the
  // gateway's 401 on send. Admins go to /admin/chat — gateway 403s otherwise.
  // NEXT_PUBLIC_SKIP_AUTH=true bypasses for local dev.
  useEffect(() => {
    if (skipAuth) return;
    if (authLoading) return;
    if (!session) {
      router.replace("/login");
      return;
    }
    if (isAdmin) {
      router.replace("/admin/chat");
    }
  }, [skipAuth, authLoading, session, isAdmin, router]);

  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const hasSentInitial = useRef(false);

  const {
    uiMessages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    clearError,
  } = useAgentChat({
    accessToken: session?.access_token,
    inputRef,
  });

  // Focus input on mount only (avoid autoFocus on every state change for mobile).
  useEffect(() => {
    const isMobile = window.matchMedia("(pointer: coarse)").matches;
    if (!isMobile) {
      inputRef.current?.focus();
    }
  }, []);

  // Auto-send initial message from query params (hero widget).
  useEffect(() => {
    if (hasSentInitial.current || uiMessages.length > 0) return;
    const service = searchParams.get("service");
    const date = searchParams.get("date");
    const location = searchParams.get("location");

    if (service || date || location) {
      hasSentInitial.current = true;
      const parts: string[] = [];
      if (service)
        parts.push(
          `I need ${/^[aeiou]/i.test(service) ? "an" : "a"} ${service}`,
        );
      if (date) {
        const formatted = new Date(`${date}T00:00:00`).toLocaleDateString(
          "en-US",
          { weekday: "long", month: "long", day: "numeric" },
        );
        parts.push(`on ${formatted}`);
      }
      if (location) parts.push(`near ${location}`);
      sendMessage(`${parts.join(" ")}.`);
    }
  }, [searchParams, uiMessages.length, sendMessage]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage(input.trim());
    setInput("");
  };

  // Filter out empty messages so a transient assistant chunk before the
  // model emits anything doesn't render an empty bubble. Reasoning parts
  // are intentionally skipped — customer chat hides chain-of-thought.
  const renderable = useMemo(
    () =>
      uiMessages.filter((msg) => {
        if (msg.role !== "user" && msg.role !== "assistant") return false;
        return msg.parts.some(
          (p) =>
            (p.type === "text" && p.text.trim().length > 0) ||
            isToolOrDynamicToolUIPart(p),
        );
      }),
    [uiMessages],
  );

  // Map each assistant message id to the text of the first user message
  // that follows it. Replaces an O(n²) slice+find inside the render loop.
  const nextUserAnswerByAssistantId = useMemo(() => {
    const map = new Map<string, string>();
    let pendingAssistantIds: string[] = [];
    for (const msg of renderable) {
      if (msg.role === "assistant") {
        pendingAssistantIds.push(msg.id);
      } else if (msg.role === "user") {
        const text = msg.parts.find(
          (p): p is { type: "text"; text: string } => p.type === "text",
        )?.text;
        if (text) {
          for (const id of pendingAssistantIds) map.set(id, text);
        }
        pendingAssistantIds = [];
      }
    }
    return map;
  }, [renderable]);

  // Show loading state while auth resolves, or while redirecting
  // unauthenticated users to /login / admins to /admin/chat.
  if (!skipAuth && (authLoading || !session || isAdmin)) {
    return (
      <main className="flex flex-col flex-1 bg-background text-text">
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <div className="text-red-primary animate-pulse">Loading...</div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-col flex-1 bg-background text-text">
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full pt-8 pb-4 px-4 min-h-0">
        {/* Header */}
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={
            prefersReducedMotion ? { duration: 0 } : { duration: 0.4 }
          }
          className="flex items-center justify-between mb-4 px-2"
        >
          <div className="flex items-center gap-3">
            <motion.div
              initial={prefersReducedMotion ? false : { scale: 0 }}
              animate={{ scale: 1 }}
              transition={
                prefersReducedMotion
                  ? { duration: 0 }
                  : { delay: 0.2, type: "spring", stiffness: 200 }
              }
              className="w-12 h-12 rounded-full bg-red-light flex items-center justify-center"
            >
              <Wrench className="w-6 h-6 text-red-primary" />
            </motion.div>
            <div>
              <h1 className="text-xl font-display font-bold text-text">
                HMLS Assistant
              </h1>
              <p className="text-sm text-text-secondary">
                Online — Ready to help
              </p>
            </div>
          </div>
          <motion.button
            type="button"
            onClick={async () => {
              if (
                uiMessages.length === 0 ||
                (await askConfirm({
                  title: "Clear chat history?",
                  description: "This removes all messages from this device.",
                  confirmLabel: "Clear",
                  destructive: true,
                }))
              ) {
                clearMessages();
              }
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="text-sm text-text-secondary hover:text-text transition-colors px-4 py-2 rounded-lg hover:bg-surface-alt"
          >
            Clear chat
          </motion.button>
        </motion.div>

        {/* Messages — AI Elements <Conversation> handles stick-to-bottom and
            the "scroll to latest" floating button. */}
        <Conversation className="flex-1 rounded-2xl border border-border bg-surface min-h-0">
          <ConversationContent className="p-6">
            {renderable.length === 0 && <WelcomeScreen onPick={sendMessage} />}
            {renderable.map((msg, idx) => {
              const isLastAssistant =
                idx === renderable.length - 1 && msg.role === "assistant";
              const nextUserAnswer =
                msg.role === "assistant"
                  ? nextUserAnswerByAssistantId.get(msg.id)
                  : undefined;
              return (
                <ChatMessage
                  key={msg.id}
                  msg={msg}
                  isStreaming={isLastAssistant && isLoading}
                  nextUserAnswer={nextUserAnswer}
                  onAnswer={sendMessage}
                  mode="customer"
                  hideReasoning
                  hideGenericToolFallback
                />
              );
            })}

            {/* Submitted-state indicator: bridges the gap between user
                send and first assistant token / tool call so the chat
                doesn't feel frozen. */}
            {isLoading &&
              (renderable.length === 0 ||
                renderable[renderable.length - 1]?.role === "user") && (
                <Message from="assistant">
                  <MessageContent>
                    <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-alt px-3 py-1 text-xs text-text-secondary">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-red-primary" />
                      <span>Working on it…</span>
                    </div>
                  </MessageContent>
                </Message>
              )}

            {error && (
              <div className="rounded-2xl bg-red-50 border border-red-200 px-5 py-3">
                <p className="text-xs font-medium text-red-600 mb-1">Error</p>
                <p className="text-sm text-red-700">{error}</p>
                <button
                  type="button"
                  onClick={clearError}
                  className="text-xs text-red-500 hover:text-red-700 mt-1 underline"
                >
                  Dismiss
                </button>
              </div>
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        {/* Input */}
        <motion.form
          initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={
            prefersReducedMotion
              ? { duration: 0 }
              : { duration: 0.4, delay: 0.2 }
          }
          onSubmit={handleSubmit}
          className="mt-4"
        >
          <div className="flex gap-3">
            <label htmlFor="chat-input" className="sr-only">
              Chat message
            </label>
            <input
              ref={inputRef}
              id="chat-input"
              type="text"
              name="message"
              autoComplete="off"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              disabled={isLoading}
              className="flex-1 bg-surface border border-border rounded-xl px-5 py-4 text-text placeholder-text-secondary/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-primary focus-visible:border-red-primary disabled:opacity-50 transition-colors"
            />
            <motion.button
              type="submit"
              aria-label="Send message"
              disabled={isLoading || !input.trim()}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-14 h-14 rounded-xl bg-red-primary text-white flex items-center justify-center hover:bg-red-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={20} />
            </motion.button>
          </div>
        </motion.form>
      </div>
    </main>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <main className="flex flex-col flex-1 bg-background text-text">
          <div className="flex-1 flex items-center justify-center">
            <div className="text-red-primary animate-pulse">Loading...</div>
          </div>
        </main>
      }
    >
      <ChatPageInner />
    </Suspense>
  );
}
