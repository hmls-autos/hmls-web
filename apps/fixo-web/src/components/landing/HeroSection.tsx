"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { ArrowRight, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";

/* ── Animated OBD code rain ── */
function CodeRain() {
  const codes = [
    "P0420",
    "P0171",
    "P0300",
    "P0442",
    "P0128",
    "B1234",
    "C0035",
    "U0100",
    "P0455",
    "P0401",
    "P0116",
    "P0340",
  ];
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden>
      {codes.map((code, i) => (
        <motion.span
          key={code}
          className="absolute text-[11px] font-mono text-primary/[0.07] font-bold"
          style={{
            left: `${8 + (i % 6) * 16}%`,
            top: `${5 + Math.floor(i / 6) * 45}%`,
          }}
          animate={{
            opacity: [0, 0.6, 0],
            y: [0, 30],
          }}
          transition={{
            duration: 4 + (i % 3),
            repeat: Number.POSITIVE_INFINITY,
            delay: i * 0.7,
            ease: "easeInOut",
          }}
        >
          {code}
        </motion.span>
      ))}
    </div>
  );
}

/* ── Inspection Sheet (mechanic inspection report) ── */
const inspectionItems = [
  { system: "Brakes", item: "Front Brake Pads", status: "fail" as const, note: "Worn past minimum — 1mm remaining", cost: "$150 – $300" },
  { system: "Brakes", item: "Rear Brake Pads", status: "warn" as const, note: "~30% life remaining", cost: null },
  { system: "Brakes", item: "Rotors", status: "warn" as const, note: "Light scoring, monitor", cost: null },
  { system: "Engine", item: "Oil Level & Condition", status: "pass" as const, note: null, cost: null },
  { system: "Engine", item: "Coolant System", status: "pass" as const, note: null, cost: null },
  { system: "Suspension", item: "Front Struts", status: "warn" as const, note: "Minor leak detected on driver side", cost: "$400 – $700" },
  { system: "Tires", item: "Tread Depth", status: "pass" as const, note: "6/32\" — good", cost: null },
];

function InspectionSheet() {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 0; i <= inspectionItems.length; i++) {
      timers.push(setTimeout(() => setVisibleCount(i + 1), 300 + i * 400));
    }
    return () => timers.forEach(clearTimeout);
  }, []);

  const statusIcon = (s: "pass" | "warn" | "fail") =>
    s === "pass" ? "✓" : s === "warn" ? "!" : "✗";
  const statusColor = (s: "pass" | "warn" | "fail") =>
    s === "pass"
      ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
      : s === "warn"
        ? "text-amber-500 bg-amber-500/10 border-amber-500/20"
        : "text-red-500 bg-red-500/10 border-red-500/20";

  const failCount = inspectionItems.filter((i) => i.status === "fail").length;
  const warnCount = inspectionItems.filter((i) => i.status === "warn").length;
  const passCount = inspectionItems.filter((i) => i.status === "pass").length;

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="rounded-xl border border-border/80 bg-card shadow-2xl shadow-black/10 overflow-hidden">
        {/* Header — looks like a real inspection form */}
        <div className="px-5 py-4 bg-muted/50 border-b border-border/60">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="size-6 rounded bg-primary flex items-center justify-center">
                <Wrench className="size-3 text-primary-foreground" />
              </div>
              <span className="text-sm font-bold">Fixo<span className="text-primary">.</span> Inspection Report</span>
            </div>
            <span className="text-[11px] font-mono text-muted-foreground">
              #FX-2026-0847
            </span>
          </div>
          <div className="flex gap-4 text-[11px] text-muted-foreground">
            <span>2019 Honda Civic LX</span>
            <span className="text-border">|</span>
            <span>67,420 mi</span>
            <span className="text-border">|</span>
            <span>Mar 8, 2026</span>
          </div>
        </div>

        {/* Inspection items */}
        <div className="divide-y divide-border/40">
          {inspectionItems.map((item, i) => (
            <motion.div
              key={item.item}
              className="px-5 py-2.5 flex items-start gap-3"
              initial={{ opacity: 0 }}
              animate={i < visibleCount ? { opacity: 1 } : {}}
              transition={{ duration: 0.25 }}
            >
              <div
                className={`mt-0.5 size-5 rounded border text-[11px] font-bold flex items-center justify-center shrink-0 ${statusColor(item.status)}`}
              >
                {statusIcon(item.status)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{item.item}</span>
                  {item.cost && (
                    <span className="text-[11px] font-mono text-muted-foreground">{item.cost}</span>
                  )}
                </div>
                {item.note && (
                  <p className="text-[12px] text-muted-foreground mt-0.5">{item.note}</p>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Summary bar */}
        <motion.div
          className="px-5 py-3 bg-muted/30 border-t border-border/60 flex items-center justify-between"
          initial={{ opacity: 0 }}
          animate={visibleCount > inspectionItems.length ? { opacity: 1 } : {}}
          transition={{ duration: 0.4 }}
        >
          <div className="flex gap-3 text-[11px] font-mono">
            <span className="text-red-500">{failCount} FAIL</span>
            <span className="text-amber-500">{warnCount} WARN</span>
            <span className="text-emerald-500">{passCount} PASS</span>
          </div>
          <span className="text-[11px] font-mono text-primary">Est. Total: $550 – $1,000</span>
        </motion.div>
      </div>
    </div>
  );
}

export function HeroSection() {
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <motion.section ref={heroRef} style={{ opacity: heroOpacity }} className="relative pt-20 pb-24 overflow-hidden">
      <CodeRain />
      <div className="max-w-5xl mx-auto px-6 relative">
        <div className="max-w-2xl mb-14">
          <motion.p
            className="text-sm font-mono text-primary mb-4 tracking-wide"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            AI VEHICLE DIAGNOSTICS
          </motion.p>

          <motion.h1
            className="text-[2.5rem] sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05] mb-5"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Your mechanic charges $150
            <br />
            to tell you this.
          </motion.h1>

          <motion.p
            className="text-lg text-muted-foreground max-w-md mb-8 leading-relaxed"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Snap a photo, record a sound, or just describe what&apos;s wrong.
            Get a real diagnosis in 30 seconds.
          </motion.p>

          <motion.div
            className="flex gap-3"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Link href="/login">
              <Button size="lg" className="h-12 px-6 text-[15px]">
                Try it free
                <ArrowRight className="size-4" />
              </Button>
            </Link>
            <Link href="#how">
              <Button variant="outline" size="lg" className="h-12 px-6 text-[15px]">
                How it works
              </Button>
            </Link>
          </motion.div>
          <motion.p
            className="text-xs text-muted-foreground/60 mt-3 font-mono"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            3 FREE DIAGNOSES/MONTH · NO CREDIT CARD
          </motion.p>
        </div>

        {/* Terminal demo */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <InspectionSheet />
        </motion.div>
      </div>
    </motion.section>
  );
}
