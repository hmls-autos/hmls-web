"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CalendarDays, MapPin, ThumbsUp } from "lucide-react";
import { useEffect, useRef } from "react";

gsap.registerPlugin(ScrollTrigger);

const steps = [
  {
    number: "01",
    title: "Book online",
    description:
      "Get a quote in minutes through our AI assistant. Pick your service, date, and location.",
    icon: CalendarDays,
  },
  {
    number: "02",
    title: "We come to you",
    description:
      "Our certified mechanic arrives at your home or office with everything needed.",
    icon: MapPin,
  },
  {
    number: "03",
    title: "Done",
    description: "Pay when you're satisfied. No hidden fees, no surprises.",
    icon: ThumbsUp,
  },
];

export default function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const lineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      gsap.from(headingRef.current, {
        y: 50,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: headingRef.current,
          start: "top 85%",
          toggleActions: "play none none none",
        },
      });

      if (lineRef.current) {
        gsap.from(lineRef.current, {
          scaleX: 0,
          duration: 1.5,
          ease: "power2.inOut",
          scrollTrigger: {
            trigger: lineRef.current,
            start: "top 80%",
            toggleActions: "play none none none",
          },
        });
      }

      cardsRef.current.forEach((el, i) => {
        if (!el) return;
        gsap.from(el, {
          y: 80,
          opacity: 0,
          scale: 0.95,
          duration: 0.9,
          delay: i * 0.2,
          ease: "power3.out",
          scrollTrigger: {
            trigger: el,
            start: "top 88%",
            toggleActions: "play none none none",
          },
        });

        // Icon pulse animation after card appears
        const icon = el.querySelector("[data-icon]");
        if (icon) {
          gsap.from(icon, {
            scale: 0,
            rotation: -180,
            duration: 0.6,
            delay: i * 0.2 + 0.4,
            ease: "back.out(2)",
            scrollTrigger: {
              trigger: el,
              start: "top 88%",
              toggleActions: "play none none none",
            },
          });
        }
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="w-full py-32 bg-background">
      <div className="max-w-7xl mx-auto px-6">
        <h2
          ref={headingRef}
          className="text-4xl md:text-5xl font-display font-extrabold text-text text-center mb-20 tracking-tight"
        >
          How it works
        </h2>

        {/* Connecting line (desktop only) */}
        <div className="hidden md:block relative">
          <div
            ref={lineRef}
            className="absolute left-[16.6%] right-[16.6%] h-px bg-gradient-to-r from-transparent via-red-500/40 to-transparent origin-left"
            style={{ transform: "translateY(-60px)" }}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div
                key={step.number}
                ref={(el) => {
                  cardsRef.current[i] = el;
                }}
                className="relative group text-center"
              >
                <div
                  data-icon
                  className="relative mx-auto w-20 h-20 rounded-full bg-surface border border-border flex items-center justify-center mb-8 group-hover:border-red-500/50 group-hover:shadow-lg group-hover:shadow-red-500/10 transition-all duration-500"
                >
                  <Icon className="w-8 h-8 text-red-400" strokeWidth={1.5} />
                  <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-red-600 flex items-center justify-center text-xs font-display font-bold text-white shadow-lg shadow-red-600/30">
                    {step.number}
                  </div>
                </div>

                <h3 className="text-xl md:text-2xl font-display font-bold text-text mb-3">
                  {step.title}
                </h3>
                <p className="text-text-secondary leading-relaxed max-w-xs mx-auto">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
