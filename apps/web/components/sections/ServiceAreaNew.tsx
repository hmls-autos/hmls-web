import dynamic from "next/dynamic";
import { Suspense } from "react";
import RevealOnScroll from "@/components/ui/RevealOnScroll";

const Map = dynamic(() => import("@/components/ui/RealMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-cream-200 animate-pulse rounded-xl" />
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
    <section className="w-full py-24 bg-cream-50">
      <div className="max-w-7xl mx-auto px-6">
        <RevealOnScroll>
          <h2 className="text-3xl md:text-4xl font-serif text-charcoal text-center mb-12">
            Serving Orange County
          </h2>
        </RevealOnScroll>

        <RevealOnScroll delay={1}>
          <div className="w-full h-[400px] rounded-xl overflow-hidden border border-cream-200 mb-8">
            <Suspense
              fallback={
                <div className="w-full h-full bg-cream-200 animate-pulse" />
              }
            >
              <Map className="w-full h-full" />
            </Suspense>
          </div>
        </RevealOnScroll>

        <RevealOnScroll delay={2}>
          <div className="flex flex-wrap justify-center gap-3">
            {cities.map((city) => (
              <span
                key={city}
                className="px-4 py-2 bg-cream-100 border border-cream-200 rounded-full text-sm text-charcoal-light"
              >
                {city}
              </span>
            ))}
            <span className="px-4 py-2 text-sm text-charcoal-light">
              and surrounding areas
            </span>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
