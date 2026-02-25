"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowDownUp, Cpu, Disc, Droplets, Wind, Zap } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";

gsap.registerPlugin(ScrollTrigger);

const services = [
  {
    title: "Oil Change",
    description: "Full synthetic oil change with filter and fluid top-off.",
    price: "From $89",
    icon: Droplets,
  },
  {
    title: "Brake Service",
    description: "Pads, rotors, fluid inspection and repair.",
    price: "From $149",
    icon: Disc,
  },
  {
    title: "Battery & Electrical",
    description: "Testing, replacement, and system diagnosis.",
    price: "From $49",
    icon: Zap,
  },
  {
    title: "Engine Diagnostics",
    description: "Check engine light, computer scanning, and troubleshooting.",
    price: "From $79",
    icon: Cpu,
  },
  {
    title: "A/C Service",
    description: "Comprehensive air conditioning inspection and recharge.",
    price: "From $129",
    icon: Wind,
  },
  {
    title: "Suspension",
    description: "Diagnose and repair for a smooth, noise-free ride.",
    price: "From $99",
    icon: ArrowDownUp,
  },
];

export default function Services() {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      gsap.from(headingRef.current, {
        y: 40,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: {
          trigger: headingRef.current,
          start: "top 85%",
          toggleActions: "play none none none",
        },
      });

      cardsRef.current.forEach((el, i) => {
        if (!el) return;
        gsap.from(el, {
          y: 80,
          opacity: 0,
          duration: 0.7,
          delay: i * 0.1,
          ease: "power3.out",
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
      id="services"
      className="w-full py-32 bg-surface-alt"
    >
      <div className="max-w-7xl mx-auto px-6">
        <div ref={headingRef} className="text-center mb-20">
          <p className="text-sm uppercase tracking-[0.2em] text-red-400 font-display font-semibold mb-4">
            Our Services
          </p>
          <h2 className="text-4xl md:text-5xl font-display font-extrabold text-text tracking-tight mb-6">
            What we can help with
          </h2>
          <p className="text-text-secondary max-w-xl mx-auto">
            From routine maintenance to complex repairs, we handle it all at
            your location.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, i) => {
            const Icon = service.icon;
            return (
              <div
                key={service.title}
                ref={(el) => {
                  cardsRef.current[i] = el;
                }}
                className="group relative bg-surface border border-border rounded-2xl p-8 hover:border-red-500/30 transition-all duration-500 overflow-hidden"
              >
                {/* Hover glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative">
                  <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mb-6 group-hover:bg-red-500/20 transition-colors duration-500">
                    <Icon className="w-6 h-6 text-red-400" strokeWidth={1.5} />
                  </div>

                  <h3 className="text-lg font-display font-bold text-text mb-2">
                    {service.title}
                  </h3>
                  <p className="text-text-secondary text-sm leading-relaxed mb-4">
                    {service.description}
                  </p>
                  <p className="text-red-400 font-display font-semibold text-sm">
                    {service.price}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-16">
          <Link
            href="/chat"
            className="inline-flex items-center gap-2 px-8 py-4 border border-border text-text rounded-xl hover:border-red-500/50 hover:bg-red-500/10 transition-all duration-300 font-display font-semibold tracking-wide"
          >
            View all services
          </Link>
        </div>
      </div>
    </section>
  );
}
