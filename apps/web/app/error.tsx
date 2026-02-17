"use client";

import { motion } from "framer-motion";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import Navbar from "@/components/Navbar";

// biome-ignore lint/suspicious/noShadowRestrictedNames: Next.js requires this name
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col bg-background text-text">
      <Navbar />

      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-24 h-24 rounded-full bg-red-light flex items-center justify-center mx-auto mb-6"
          >
            <AlertTriangle className="w-12 h-12 text-red-primary" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-2xl md:text-3xl font-display font-bold text-text mb-4"
          >
            Something went wrong
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-text-secondary max-w-md mx-auto mb-8"
          >
            We encountered an unexpected error. Please try again or return to
            the homepage.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <motion.button
              type="button"
              onClick={reset}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-6 py-3 bg-red-primary text-white rounded-xl font-medium hover:bg-red-dark transition-colors"
            >
              <RefreshCw size={20} aria-hidden="true" />
              Try Again
            </motion.button>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                href="/"
                className="flex items-center gap-2 px-6 py-3 bg-surface border border-border text-text rounded-xl font-medium hover:border-red-primary transition-colors"
              >
                <Home size={20} aria-hidden="true" />
                Back to Home
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </main>
  );
}
