"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Loader2, MessageCircle, Send, Wrench, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type FormEvent, useRef, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Markdown } from "@/components/ui/Markdown";
import { useAgentChat } from "@/hooks/useAgentChat";
import { toolDisplayNames } from "@/lib/agent-tools";

export function ChatWidget() {
  const pathname = usePathname();
  const { user, isLoading: authLoading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { messages, isLoading, currentTool, sendMessage, clearMessages } =
    useAgentChat({ scrollRef: messagesEndRef, inputRef });

  // Don't render on the dedicated chat page
  if (pathname === "/chat") {
    return null;
  }

  const isAuthenticated = !!user;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      window.location.href = "/login";
      return;
    }
    if (!input.trim() || isLoading) return;
    sendMessage(input.trim());
    setInput("");
  };

  return (
    <>
      {/* Chat Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-red-primary text-white shadow-lg hover:bg-red-dark transition-colors flex items-center justify-center"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
            >
              <X size={24} />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
            >
              <MessageCircle size={24} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-50 w-[380px] h-[500px] bg-white border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-surface">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-light flex items-center justify-center">
                  <Wrench className="w-5 h-5 text-red-primary" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-text">
                    HMLS Assistant
                  </h3>
                  <p className="text-xs text-text-secondary">Online</p>
                </div>
              </div>
              <button
                type="button"
                onClick={clearMessages}
                className="text-xs text-text-secondary hover:text-text transition-colors"
              >
                Clear chat
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-surface-alt">
              {!authLoading && !isAuthenticated ? (
                <div className="text-center text-text-secondary mt-8 space-y-4">
                  <p className="text-sm text-text font-medium">
                    Sign in to start chatting
                  </p>
                  <p className="text-sm">
                    You need an account to use the HMLS assistant. Sign in to
                    access scheduling, quotes, and service updates.
                  </p>
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center px-6 py-2 rounded-lg bg-red-primary text-white text-sm font-medium hover:bg-red-dark transition-colors"
                  >
                    Go to login
                  </Link>
                </div>
              ) : (
                messages.length === 0 && (
                  <div className="text-center text-text-secondary mt-8">
                    <p className="text-sm">Hi! I'm the HMLS assistant.</p>
                    <p className="text-sm mt-1">How can I help you today?</p>
                  </div>
                )
              )}

              {isAuthenticated &&
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                        msg.role === "user"
                          ? "bg-red-primary text-white rounded-br-md"
                          : "bg-white border border-border text-text rounded-bl-md"
                      }`}
                    >
                      {msg.role === "user" ? (
                        <p className="text-sm whitespace-pre-wrap">
                          {msg.content}
                        </p>
                      ) : (
                        <Markdown content={msg.content} className="text-sm" />
                      )}
                    </div>
                  </div>
                ))}

              {/* Tool indicator */}
              {isAuthenticated && currentTool && (
                <div className="flex justify-start">
                  <div className="bg-white border border-border px-3 py-2 rounded-xl flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-red-primary animate-spin" />
                    <span className="text-xs text-text-secondary">
                      {toolDisplayNames[currentTool] || currentTool}...
                    </span>
                  </div>
                </div>
              )}

              {/* Loading indicator */}
              {isAuthenticated &&
                isLoading &&
                !currentTool &&
                messages[messages.length - 1]?.role === "user" && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-border px-4 py-2 rounded-2xl rounded-bl-md">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-text-secondary/50 rounded-full animate-bounce" />
                        <span className="w-2 h-2 bg-text-secondary/50 rounded-full animate-bounce [animation-delay:0.1s]" />
                        <span className="w-2 h-2 bg-text-secondary/50 rounded-full animate-bounce [animation-delay:0.2s]" />
                      </div>
                    </div>
                  </div>
                )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form
              onSubmit={handleSubmit}
              className="p-4 border-t border-border bg-surface"
            >
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    isAuthenticated
                      ? "Type a message..."
                      : "Sign in to start chatting"
                  }
                  disabled={isLoading || !isAuthenticated}
                  className="flex-1 bg-surface-alt border border-border rounded-xl px-4 py-2 text-sm text-text placeholder-text-secondary/50 focus:outline-none focus:border-red-primary disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim() || !isAuthenticated}
                  className="w-10 h-10 rounded-xl bg-red-primary text-white flex items-center justify-center hover:bg-red-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={18} />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
