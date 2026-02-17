"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import RevealOnScroll from "@/components/ui/RevealOnScroll";

const ServiceMap = dynamic(() => import("@/components/ui/RealMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-surface-alt animate-pulse rounded-xl" />
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

export default function ServiceAreaNew() {
  return (
    <section className="w-full py-24 bg-background">
      <div className="max-w-7xl mx-auto px-6">
        <RevealOnScroll>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-text text-center mb-12 text-balance">
            Serving Orange County
          </h2>
        </RevealOnScroll>

        <RevealOnScroll delay={1}>
          <div className="w-full h-[400px] rounded-xl overflow-hidden border border-border mb-8">
            <Suspense
              fallback={
                <div className="w-full h-full bg-surface-alt animate-pulse" />
              }
            >
              <ServiceMap className="w-full h-full" />
            </Suspense>
          </div>
        </RevealOnScroll>

        <RevealOnScroll delay={2}>
          <div className="flex flex-wrap justify-center gap-3">
            {cities.map((city) => (
              <span
                key={city}
                className="px-4 py-2 bg-surface border border-border rounded-full text-sm text-text-secondary"
              >
                {city}
              </span>
            ))}
            <span className="px-4 py-2 text-sm text-text-secondary">
              and surrounding areas
            </span>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
