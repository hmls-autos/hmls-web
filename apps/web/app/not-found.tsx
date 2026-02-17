"use client";

import { motion } from "framer-motion";
import { Home, Search } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function NotFound() {
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
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <span className="text-[150px] md:text-[200px] font-display font-extrabold leading-none bg-gradient-to-b from-red-primary to-red-dark bg-clip-text text-transparent">
              404
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-2xl md:text-3xl font-display font-bold text-text mb-4"
          >
            Page Not Found
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-text-secondary max-w-md mx-auto mb-8"
          >
            The page you're looking for doesn't exist or has been moved. Let's
            get you back on track.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                href="/"
                className="flex items-center gap-2 px-6 py-3 bg-red-primary text-white rounded-xl font-medium hover:bg-red-dark transition-colors"
              >
                <Home size={20} aria-hidden="true" />
                Back to Home
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                href="/chat"
                className="flex items-center gap-2 px-6 py-3 bg-surface border border-border text-text rounded-xl font-medium hover:border-red-primary transition-colors"
              >
                <Search size={20} aria-hidden="true" />
                Chat with Us
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </main>
  );
}
