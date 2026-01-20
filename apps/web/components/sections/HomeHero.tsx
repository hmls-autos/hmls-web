"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { Wrench } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";

export default function HomeHero() {
  const targetRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.9]);

  return (
    <section
      ref={targetRef}
      className="w-full min-h-screen flex flex-col justify-center items-center relative z-10 px-6 pt-20"
    >
      <motion.div
        style={{ opacity, scale }}
        className="flex flex-col items-center text-center max-w-4xl mx-auto"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs tracking-widest uppercase"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Mobile Mechanic Service
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-5xl md:text-7xl lg:text-8xl font-thin tracking-tighter mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/40"
        >
          Affordable. Convenient. <br /> Reliable.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="max-w-2xl text-lg md:text-xl text-gray-400 font-light mb-12 leading-relaxed"
        >
          Experience top-quality automotive care from a trusted local mechanic
          with over 20 years of expertise. We bring the shop to you.
          <span className="block mt-2 text-emerald-500/80 font-normal">
            Future of Auto Care.
          </span>
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col md:flex-row gap-4 w-full md:w-auto"
        >
          <Link
            href="/contact"
            className="glass-button px-8 py-4 rounded-lg text-emerald-400 font-medium tracking-wide min-w-[200px] flex items-center justify-center gap-2 group"
          >
            Schedule Service
            <Wrench className="w-4 h-4 group-hover:rotate-90 transition-transform" />
          </Link>
          <Link
            href="#services"
            className="px-8 py-4 rounded-lg border border-white/10 hover:bg-white/5 transition-colors text-gray-300 font-light min-w-[200px]"
          >
            Explore Services
          </Link>
        </motion.div>
      </motion.div>

      {/* Scroll Indicator */}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/20"
      >
        <div className="w-6 h-10 border border-white/20 rounded-full flex justify-center p-1">
          <div className="w-1 h-3 bg-emerald-500/50 rounded-full" />
        </div>
      </motion.div>
    </section>
  );
}
