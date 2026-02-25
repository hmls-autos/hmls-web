"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef } from "react";

gsap.registerPlugin(ScrollTrigger);

const stats = [
  { value: 20, suffix: "+", label: "Years Experience" },
  { value: 500, suffix: "+", label: "Repairs Completed" },
  { value: 100, suffix: "%", label: "Satisfaction Rate" },
];

export default function TrustBar() {
  const sectionRef = useRef<HTMLElement>(null);
  const countersRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // Show final values immediately without animation
      countersRef.current.forEach((el, i) => {
        if (el) el.textContent = `${stats[i].value}${stats[i].suffix}`;
      });
      return;
    }

    const ctx = gsap.context(() => {
      countersRef.current.forEach((el, i) => {
        if (!el) return;
        const target = { val: 0 };
        gsap.to(target, {
          val: stats[i].value,
          duration: 2,
          ease: "power2.out",
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
            toggleActions: "play none none none",
          },
          onUpdate: () => {
            el.textContent = `${Math.round(target.val)}${stats[i].suffix}`;
          },
        });
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative w-full py-16 bg-surface-alt border-y border-border"
    >
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 opacity-5 bg-[linear-gradient(currentColor_1px,transparent_1px),linear-gradient(90deg,currentColor_1px,transparent_1px)] bg-[size:60px_60px]" />

      <div className="relative max-w-7xl mx-auto px-6">
        <div className="flex flex-wrap justify-center gap-12 md:gap-24">
          {stats.map((stat, i) => (
            <div key={stat.label} className="text-center">
              <div
                ref={(el) => {
                  countersRef.current[i] = el;
                }}
                className="text-4xl md:text-5xl font-display font-extrabold text-text tabular-nums"
              >
                0{stat.suffix}
              </div>
              <div className="mt-2 text-xs md:text-sm text-text-secondary uppercase tracking-[0.2em] font-display">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
