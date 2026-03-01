import RevealOnScroll from "@/components/ui/RevealOnScroll";

const stats = [
  { value: "20+", label: "Years Experience" },
  { value: "500+", label: "Repairs Completed" },
  { value: "100%", label: "Satisfaction Rate" },
];

export default function TrustBar() {
  return (
    <section className="relative w-full py-20 bg-surface-alt border-y border-border overflow-hidden">
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(currentColor_1px,transparent_1px),linear-gradient(90deg,currentColor_1px,transparent_1px)] bg-[size:60px_60px]" />

      <div className="relative max-w-7xl mx-auto px-6">
        {/* Top weld seam */}
        <div className="weld-seam mb-12 md:mb-16" aria-hidden="true" />

        <div className="flex flex-wrap justify-center items-center gap-12 md:gap-0">
          {stats.map((stat, i) => (
            <div key={stat.label} className="flex items-center">
              {i > 0 && (
                <div className="hidden md:block h-16 w-[3px] mx-12 rounded-full bg-gradient-to-b from-transparent via-[var(--weld-orange)] to-transparent opacity-60" />
              )}
              <RevealOnScroll delay={i + 1}>
                {/* Gauge bezel */}
                <div className="relative w-28 h-28 md:w-32 md:h-32 rounded-full p-[2px] bg-gradient-to-b from-zinc-400/30 via-zinc-500/20 to-zinc-600/30">
                  <div className="w-full h-full rounded-full bg-surface-alt flex flex-col items-center justify-center">
                    <div className="text-3xl md:text-4xl font-display font-extrabold text-text tabular-nums">
                      {stat.value}
                    </div>
                    <div className="mt-1 text-[10px] md:text-xs text-text-secondary uppercase tracking-[0.15em] font-display text-center px-2">
                      {stat.label}
                    </div>
                  </div>
                </div>
              </RevealOnScroll>
            </div>
          ))}
        </div>

        {/* Bottom weld seam */}
        <div className="weld-seam mt-12 md:mt-16" aria-hidden="true" />
      </div>
    </section>
  );
}
