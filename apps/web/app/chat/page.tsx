"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Loader2, LogIn, Send, Wrench } from "lucide-react";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import Background from "@/components/Background";
import Navbar from "@/components/Navbar";
import { Markdown } from "@/components/ui/Markdown";
import { useAgentChat } from "@/hooks/useAgentChat";
import { toolDisplayNames } from "@/lib/agent-tools";

export default function ChatPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { messages, isLoading, currentTool, sendMessage, clearMessages } =
    useAgentChat();

  // Always connected when hook is mounted
  const isConnected = true;

  // Scroll to bottom when messages change
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional trigger on messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input on mount and keep focus after loading
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional trigger to refocus after loading
  useEffect(() => {
    inputRef.current?.focus();
  }, [isLoading]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage(input.trim());
    setInput("");
  };

  // Show loading state
  if (authLoading) {
    return (
      <main className="flex min-h-screen flex-col bg-black text-white">
        <Navbar />
        <Background />
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <div className="text-emerald-500 animate-pulse">Loading...</div>
        </div>
      </main>
    );
  }

  // Show login prompt if not authenticated
  if (!user) {
    return (
      <main className="flex min-h-screen flex-col bg-black text-white">
        <Navbar />
        <Background />
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center max-w-md"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6"
            >
              <Wrench className="w-10 h-10 text-emerald-400" />
            </motion.div>
            <h1 className="text-2xl font-semibold mb-3">Sign in to Chat</h1>
            <p className="text-zinc-400 mb-8">
              Log in to access our AI assistant for scheduling, quotes, and
              service questions.
            </p>
            <motion.a
              href="/login"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-colors"
            >
              <LogIn className="w-5 h-5" />
              Sign In
            </motion.a>
          </motion.div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-black text-white">
      <Navbar />
      <Background />

      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full pt-24 pb-4 px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center justify-between mb-4 px-2"
        >
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center"
            >
              <Wrench className="w-6 h-6 text-emerald-400" />
            </motion.div>
            <div>
              <h1 className="text-xl font-semibold text-white">
                HMLS Assistant
              </h1>
              <p className="text-sm text-zinc-400">
                {isConnected ? "Online - Ready to help" : "Connecting..."}
              </p>
            </div>
          </div>
          <motion.button
            type="button"
            onClick={clearMessages}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors px-4 py-2 rounded-lg hover:bg-zinc-800"
          >
            Clear chat
          </motion.button>
        </motion.div>

        {/* Messages Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex-1 overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm p-6 space-y-4"
        >
          <AnimatePresence mode="wait">
            {messages.length === 0 && (
              <motion.div
                key="welcome"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center justify-center h-full text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4"
                >
                  <Wrench className="w-8 h-8 text-emerald-400" />
                </motion.div>
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-xl font-medium text-white mb-2"
                >
                  Welcome to HMLS Assistant
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-zinc-400 max-w-md"
                >
                  I can help you with scheduling appointments, getting quotes,
                  checking service availability, and answering questions about
                  our mobile mechanic services.
                </motion.p>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="flex flex-wrap gap-2 mt-6 justify-center"
                >
                  {[
                    "What services do you offer?",
                    "I need an oil change",
                    "Check availability",
                    "Get a quote for brake service",
                  ].map((suggestion, index) => (
                    <motion.button
                      key={suggestion}
                      type="button"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 + index * 0.1 }}
                      whileHover={{
                        scale: 1.05,
                        borderColor: "rgb(16 185 129 / 0.5)",
                      }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => sendMessage(suggestion)}
                      className="px-4 py-2 rounded-full bg-zinc-800 border border-zinc-700 text-sm text-zinc-300 hover:border-emerald-500/50 hover:text-emerald-400 transition-colors"
                    >
                      {suggestion}
                    </motion.button>
                  ))}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.2 }}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <motion.div
                initial={{ opacity: 0, x: msg.role === "user" ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: 0.05 }}
                className={`max-w-[80%] px-5 py-3 rounded-2xl ${
                  msg.role === "user"
                    ? "bg-emerald-500 text-white rounded-br-md"
                    : "bg-zinc-800 text-zinc-100 rounded-bl-md"
                }`}
              >
                {msg.role === "user" ? (
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">
                    {msg.content}
                  </p>
                ) : (
                  <Markdown
                    content={msg.content}
                    className="text-sm leading-relaxed"
                  />
                )}
              </motion.div>
            </motion.div>
          ))}

          {/* Tool indicator */}
          <AnimatePresence>
            {currentTool && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex justify-start"
              >
                <div className="bg-zinc-800/50 border border-zinc-700 px-4 py-2 rounded-xl flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
                  <span className="text-sm text-zinc-400">
                    {toolDisplayNames[currentTool] || currentTool}...
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loading indicator */}
          <AnimatePresence>
            {isLoading &&
              !currentTool &&
              messages[messages.length - 1]?.role === "user" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex justify-start"
                >
                  <div className="bg-zinc-800 px-5 py-3 rounded-2xl rounded-bl-md">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" />
                      <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce [animation-delay:0.1s]" />
                      <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                    </div>
                  </div>
                </motion.div>
              )}
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </motion.div>

        {/* Input Area */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          onSubmit={handleSubmit}
          className="mt-4"
        >
          <div className="flex gap-3">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              disabled={!isConnected || isLoading}
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-4 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 disabled:opacity-50 transition-colors"
            />
            <motion.button
              type="submit"
              disabled={!isConnected || isLoading || !input.trim()}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-14 h-14 rounded-xl bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={20} />
            </motion.button>
          </div>
        </motion.form>
      </div>
    </main>
  );
}
