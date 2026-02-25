"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import dynamic from "next/dynamic";
import { Suspense, useEffect, useRef } from "react";

gsap.registerPlugin(ScrollTrigger);

const ServiceMap = dynamic(() => import("@/components/ui/RealMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-surface animate-pulse rounded-xl" />
  ),
});

const cities = [
  "Irvine",
  "Newport Beach",
  "Anaheim",
  "Santa Ana",
  "Costa Mesa",
  "Fullerton",
  "Huntington Beach",
];

export default function ServiceArea() {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const citiesRef = useRef<HTMLDivElement>(null);

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

      gsap.from(mapRef.current, {
        y: 60,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: mapRef.current,
          start: "top 85%",
          toggleActions: "play none none none",
        },
      });

      if (citiesRef.current) {
        const chips = citiesRef.current.querySelectorAll("[data-chip]");
        gsap.from(chips, {
          y: 20,
          opacity: 0,
          duration: 0.5,
          stagger: 0.08,
          ease: "power3.out",
          scrollTrigger: {
            trigger: citiesRef.current,
            start: "top 90%",
            toggleActions: "play none none none",
          },
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="w-full py-32 bg-background">
      <div className="max-w-7xl mx-auto px-6">
        <div ref={headingRef} className="text-center mb-16">
          <p className="text-sm uppercase tracking-[0.2em] text-red-400 font-display font-semibold mb-4">
            Service Area
          </p>
          <h2 className="text-4xl md:text-5xl font-display font-extrabold text-text tracking-tight">
            Serving Orange County
          </h2>
        </div>

        <div
          ref={mapRef}
          className="w-full h-[450px] rounded-2xl overflow-hidden border border-border mb-10"
        >
          <Suspense
            fallback={
              <div className="w-full h-full bg-surface animate-pulse" />
            }
          >
            <ServiceMap className="w-full h-full" />
          </Suspense>
        </div>

        <div ref={citiesRef} className="flex flex-wrap justify-center gap-3">
          {cities.map((city) => (
            <span
              key={city}
              data-chip
              className="px-5 py-2.5 bg-surface border border-border rounded-full text-sm text-text-secondary font-display hover:border-red-500/30 hover:text-text transition-all duration-300"
            >
              {city}
            </span>
          ))}
          <span
            data-chip
            className="px-5 py-2.5 text-sm text-text-secondary font-display"
          >
            and surrounding areas
          </span>
        </div>
      </div>
    </section>
  );
}
