"use client";

import { motion } from "framer-motion";
import { Wrench } from "lucide-react";

export default function Loading() {
  return (
    <main className="flex min-h-screen flex-col bg-background text-text">
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 2,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
            className="w-20 h-20 rounded-full bg-red-light flex items-center justify-center mx-auto mb-6"
          >
            <Wrench className="w-10 h-10 text-red-primary" />
          </motion.div>

          <motion.div className="flex gap-1 justify-center mb-4">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                animate={{
                  opacity: [0.3, 1, 0.3],
                  scale: [0.8, 1, 0.8],
                }}
                transition={{
                  duration: 1,
                  repeat: Number.POSITIVE_INFINITY,
                  delay: i * 0.2,
                }}
                className="w-3 h-3 bg-red-primary rounded-full"
              />
            ))}
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-text-secondary"
          >
            Loading...
          </motion.p>
        </motion.div>
      </div>
    </main>
  );
}
