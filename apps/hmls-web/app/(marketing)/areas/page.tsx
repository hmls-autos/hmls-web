import { MapPin } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { FadeIn } from "@/components/ui/Animations";
import { BUSINESS } from "@/lib/business";
import { breadcrumbSchema } from "@/lib/schema";
import { CITIES } from "@/lib/seo-content";

export const metadata: Metadata = {
  title: "Service Areas — Orange County Mobile Mechanic",
  description: `Mobile mechanic service across ${CITIES.length} cities in Orange County, CA. We come to your driveway in Irvine, Newport Beach, Costa Mesa, Anaheim, and beyond.`,
  alternates: { canonical: `${BUSINESS.url}/areas` },
};

export default function AreasIndex() {
  const sorted = [...CITIES].sort((a, b) => a.driveMinutes - b.driveMinutes);
  return (
    <main className="flex-1 flex flex-col items-center bg-background text-text">
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", url: BUSINESS.url },
          { name: "Service Areas", url: `${BUSINESS.url}/areas` },
        ])}
      />
      <section className="w-full max-w-4xl px-6 pt-16 pb-20">
        <FadeIn direction="up">
          <div className="inline-block mb-4 px-4 py-1.5 rounded-full border border-red-primary/30 bg-red-light text-red-primary text-xs tracking-widest uppercase font-display font-semibold">
            Service Areas
          </div>
          <h1 className="text-5xl md:text-6xl font-display font-bold mb-4 leading-tight">
            Where we <span className="text-red-primary">come to you</span>
          </h1>
          <p className="text-xl text-text-secondary font-light mb-12 max-w-2xl leading-relaxed">
            Mobile mechanic service across {CITIES.length} cities in Orange
            County. Sorted by distance from our Irvine base — same-day slots
            usually open within ~20 minutes drive.
          </p>
        </FadeIn>

        <FadeIn direction="up" delay={0.1}>
          <div className="grid sm:grid-cols-2 gap-3">
            {sorted.map((city) => (
              <Link
                key={city.slug}
                href={`/areas/${city.slug}`}
                className="group p-5 rounded-xl border border-border bg-surface hover:border-red-primary/40 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-red-primary" />
                    <span className="font-display font-semibold text-lg group-hover:text-red-primary transition-colors">
                      {city.name}
                    </span>
                  </div>
                  <span className="text-xs text-text-secondary">
                    {city.driveMinutes === 0
                      ? "Local"
                      : `~${city.driveMinutes} min`}
                  </span>
                </div>
                <p className="text-xs text-text-secondary line-clamp-2">
                  {city.neighborhoods.slice(0, 3).join(" · ")}
                </p>
              </Link>
            ))}
          </div>
        </FadeIn>
      </section>
    </main>
  );
}
