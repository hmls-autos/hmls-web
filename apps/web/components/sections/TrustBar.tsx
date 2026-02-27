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
        <div className="flex flex-wrap justify-center items-center gap-12 md:gap-0">
          {stats.map((stat, i) => (
            <div key={stat.label} className="flex items-center">
              {i > 0 && (
                <div className="hidden md:block w-px h-12 bg-gradient-to-b from-transparent via-red-500/30 to-transparent mx-16" />
              )}
              <RevealOnScroll delay={i + 1}>
                <div className="text-center">
                  <div className="text-4xl md:text-5xl font-display font-extrabold text-text tabular-nums">
                    {stat.value}
                  </div>
                  <div className="mt-2 text-xs md:text-sm text-text-secondary uppercase tracking-[0.2em] font-display">
                    {stat.label}
                  </div>
                </div>
              </RevealOnScroll>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
