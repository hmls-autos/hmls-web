"use client";

import { motion } from "framer-motion";

export interface QuestionOption {
  label: string;
  description?: string;
}

export interface QuestionData {
  question: string;
  header: string;
  options: QuestionOption[];
}

interface QuestionCardProps {
  data: QuestionData;
  onSelect: (label: string) => void;
  disabled?: boolean;
}

export function QuestionCard({ data, onSelect, disabled }: QuestionCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2 }}
      className="flex justify-start"
    >
      <div className="max-w-[80%] rounded-2xl rounded-bl-md bg-surface-alt border border-border px-5 py-4">
        <p className="text-xs font-medium text-red-primary uppercase tracking-wide mb-1">
          {data.header}
        </p>
        <p className="text-sm text-text mb-3">{data.question}</p>
        <div className="flex flex-col gap-2">
          {data.options.map((option) => (
            <motion.button
              key={option.label}
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={disabled}
              onClick={() => onSelect(option.label)}
              className="w-full text-left px-4 py-3 rounded-xl border border-border bg-surface hover:border-red-primary/50 hover:bg-red-light/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-sm font-medium text-text">
                {option.label}
              </span>
              {option.description && (
                <span className="block text-xs text-text-secondary mt-0.5">
                  {option.description}
                </span>
              )}
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
