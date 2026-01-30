import Image from "next/image";
import Link from "next/link";

export default function HeroNew() {
  return (
    <section className="w-full pt-24 pb-16 bg-cream-50">
      <div className="max-w-7xl mx-auto px-6">
        {/* Content */}
        <div className="max-w-3xl mx-auto text-center mb-12">
          <p className="text-sm uppercase tracking-widest text-charcoal-light mb-6">
            Mobile Mechanic • Orange County
          </p>

          <h1 className="text-5xl md:text-7xl font-serif text-charcoal mb-6">
            We come to you.
          </h1>

          <p className="text-lg md:text-xl text-charcoal-light mb-10 max-w-xl mx-auto">
            Expert auto repair at your home or office. No towing. No waiting
            rooms. Just convenience.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/chat"
              className="px-8 py-4 bg-charcoal-dark text-cream-50 rounded-lg text-base font-medium hover:bg-charcoal transition-colors"
            >
              Get a Free Quote
            </Link>
            <Link
              href="/contact"
              className="px-8 py-4 border border-charcoal-dark text-charcoal-dark rounded-lg text-base font-medium hover:bg-charcoal-dark hover:text-cream-50 transition-colors"
            >
              Book a Service
            </Link>
          </div>
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
        </div>
      </div>
    </section>
  );
}
