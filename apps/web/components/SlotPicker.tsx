"use client";

import { motion } from "framer-motion";

export interface SlotPickerData {
  slots: Array<{
    providerId: number;
    providerName: string;
    isPreferred: boolean;
    availableTimes: string[];
  }>;
  serviceDurationMinutes: number;
  dateRange: { start: string; end: string };
  message: string;
}

interface SlotPickerProps {
  data: SlotPickerData;
  onSelect: (providerId: number, time: string) => void;
  disabled?: boolean;
}

export function SlotPicker({ data, onSelect, disabled }: SlotPickerProps) {
  if (data.slots.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface p-4 text-sm text-text-secondary">
        {data.message}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {data.slots.map((provider) => {
        const byDate = new Map<string, string[]>();
        for (const time of provider.availableTimes) {
          const dateKey = time.split("T")[0];
          if (!byDate.has(dateKey)) byDate.set(dateKey, []);
          byDate.get(dateKey)?.push(time);
        }

        return (
          <div
            key={provider.providerId}
            className="rounded-xl border border-border bg-surface p-4"
          >
            <div className="mb-3 flex items-center gap-2">
              <span className="font-semibold text-text">
                {provider.providerName}
              </span>
              {provider.isPreferred && (
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                  Preferred
                </span>
              )}
            </div>

            <div className="space-y-3">
              {Array.from(byDate.entries()).map(([dateStr, times]) => {
                const dateLabel = new Date(
                  `${dateStr}T00:00:00`,
                ).toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                });

                return (
                  <div key={dateStr}>
                    <div className="mb-1.5 text-xs font-medium text-text-secondary">
                      {dateLabel}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {times.map((time) => {
                        const timeLabel = new Date(time).toLocaleTimeString(
                          "en-US",
                          {
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          },
                        );

                        return (
                          <button
                            key={time}
                            type="button"
                            onClick={() => onSelect(provider.providerId, time)}
                            disabled={disabled}
                            className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-text transition-colors hover:border-red-primary hover:bg-red-light hover:text-red-primary focus-visible:ring-2 focus-visible:ring-red-primary disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {timeLabel}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </motion.div>
  );
}
