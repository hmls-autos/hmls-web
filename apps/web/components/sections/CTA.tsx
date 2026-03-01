import { ArrowRight } from "lucide-react";
import Link from "next/link";
import RevealOnScroll from "@/components/ui/RevealOnScroll";

export default function CTA() {
  return (
    <section className="relative w-full py-32 overflow-hidden forge-glow">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-700 via-red-600 to-red-800" />
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(0,0,0,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.3)_1px,transparent_1px)] bg-[size:40px_40px]" />
      {/* Radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.15),transparent_70%)]" />

      <RevealOnScroll className="relative max-w-3xl mx-auto px-6 text-center">
        <h2 className="text-4xl md:text-6xl font-display font-extrabold text-white mb-8 tracking-tight">
          Ready to get started?
        </h2>
        <p className="text-xl text-white/80 mb-12 max-w-xl mx-auto leading-relaxed">
          Get a free quote in minutes. No obligation, no hassle. Just expert
          service at your doorstep.
        </p>
        <Link
          href="/chat"
          className="group relative inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-b from-zinc-200 via-zinc-100 to-zinc-300 dark:from-zinc-400 dark:via-zinc-300 dark:to-zinc-400 text-zinc-900 rounded-xl text-lg font-display font-bold transition-all duration-300 shadow-2xl shadow-black/30 hover:shadow-black/50 hover:scale-[1.02] border border-zinc-300/50 dark:border-zinc-500/50"
        >
          <span
            className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            aria-hidden="true"
          />
          Get a Free Quote
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </Link>
      </RevealOnScroll>
    </section>
  );
}
