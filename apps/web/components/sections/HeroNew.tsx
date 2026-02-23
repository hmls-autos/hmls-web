import Image from "next/image";
import { BookingWidget } from "@/components/BookingWidget";

export default function HeroNew() {
  return (
    <section className="w-full pt-8 pb-16 bg-background">
      <div className="max-w-7xl mx-auto px-6">
        {/* Content */}
        <div className="max-w-3xl mx-auto text-center mb-12">
          <p className="text-sm uppercase tracking-widest text-red-primary font-display font-semibold mb-6">
            Mobile Mechanic &bull; Orange County
          </p>

          <h1 className="text-5xl md:text-7xl font-display font-bold text-text mb-6 tracking-tight">
            We come to you.
          </h1>

          <p className="text-lg md:text-xl text-text-secondary mb-10 max-w-xl mx-auto">
            Expert auto repair at your home or office. No towing. No waiting
            rooms. Just convenience.
          </p>

          <BookingWidget />
        </div>

        {/* Hero Image */}
        <div className="relative w-full aspect-[21/9] rounded-2xl overflow-hidden shadow-lg">
          <Image
            src="/images/engine-bay-mercedes.png"
            alt="Mercedes engine bay"
            fill
            priority
            className="object-cover"
            sizes="(max-width: 1280px) 100vw, 1280px"
          />
          {/* Red accent line at bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-red-primary" />
        </div>
      </div>
    </section>
  );
}
