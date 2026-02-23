"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const services = [
  { value: "Oil Change", label: "Oil Change" },
  { value: "Brake Service", label: "Brake Service" },
  { value: "Battery & Electrical", label: "Battery & Electrical" },
  { value: "Engine Diagnostics", label: "Engine Diagnostics" },
  { value: "A/C Service", label: "A/C Service" },
  { value: "Suspension", label: "Suspension" },
];

export function BookingWidget() {
  const router = useRouter();
  const [service, setService] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (service) params.set("service", service);
    if (date) params.set("date", date);
    if (location) params.set("location", location);
    router.push(`/chat${params.toString() ? `?${params.toString()}` : ""}`);
  };

  // Today's date in YYYY-MM-DD for min attribute
  const today = new Date().toISOString().split("T")[0];
  // 14 days from now for max
  const maxDate = new Date(Date.now() + 14 * 86400000)
    .toISOString()
    .split("T")[0];

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.5 }}
      className="flex flex-col sm:flex-row gap-3 w-full max-w-2xl mx-auto bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/20"
    >
      <select
        value={service}
        onChange={(e) => setService(e.target.value)}
        className="flex-1 rounded-xl bg-white px-4 py-3 text-sm text-zinc-900 border-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-primary appearance-none cursor-pointer"
      >
        <option value="">Select service...</option>
        {services.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>

      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        min={today}
        max={maxDate}
        className="flex-1 rounded-xl bg-white px-4 py-3 text-sm text-zinc-900 border-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-primary"
        placeholder="Pick a date"
      />

      <input
        type="text"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        placeholder="ZIP or address"
        className="flex-1 rounded-xl bg-white px-4 py-3 text-sm text-zinc-900 border-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-primary"
      />

      <motion.button
        type="submit"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="rounded-xl bg-red-primary text-white px-6 py-3 font-medium hover:bg-red-dark transition-colors flex items-center justify-center gap-2"
      >
        Book Now
        <ArrowRight className="w-4 h-4" aria-hidden="true" />
      </motion.button>
    </motion.form>
  );
}
