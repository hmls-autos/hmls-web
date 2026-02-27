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
  const dividerRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      countersRef.current.forEach((el, i) => {
        if (el) el.textContent = `${stats[i].value}${stats[i].suffix}`;
      });
      return;
    }

    const ctx = gsap.context(() => {
      // Counter animations with stagger
      countersRef.current.forEach((el, i) => {
        if (!el) return;
        const target = { val: 0 };

        // Fade in the whole stat block
        const parent = el.parentElement;
        if (parent) {
          gsap.from(parent, {
            y: 30,
            opacity: 0,
            duration: 0.8,
            delay: i * 0.15,
            ease: "power3.out",
            scrollTrigger: {
              trigger: el,
              start: "top 90%",
              toggleActions: "play none none none",
            },
          });
        }

        gsap.to(target, {
          val: stats[i].value,
          duration: 2.5,
          delay: i * 0.15,
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

      // Divider lines scale in
      dividerRefs.current.forEach((el) => {
        if (!el) return;
        gsap.from(el, {
          scaleY: 0,
          duration: 0.6,
          ease: "power2.out",
          scrollTrigger: {
            trigger: el,
            start: "top 90%",
            toggleActions: "play none none none",
          },
        });
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative w-full py-20 bg-surface-alt border-y border-border overflow-hidden"
    >
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(currentColor_1px,transparent_1px),linear-gradient(90deg,currentColor_1px,transparent_1px)] bg-[size:60px_60px]" />

      <div className="relative max-w-7xl mx-auto px-6">
        <div className="flex flex-wrap justify-center items-center gap-12 md:gap-0">
          {stats.map((stat, i) => (
            <div key={stat.label} className="flex items-center">
              {i > 0 && (
                <div
                  ref={(el) => {
                    dividerRefs.current[i - 1] = el;
                  }}
                  className="hidden md:block w-px h-12 bg-gradient-to-b from-transparent via-red-500/30 to-transparent mx-16"
                />
              )}
              <div className="text-center">
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
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
