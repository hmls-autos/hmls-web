import Link from "next/link";
import RevealOnScroll from "@/components/ui/RevealOnScroll";

export default function CTANew() {
  return (
    <section className="w-full py-24 bg-cream-100">
      <div className="max-w-2xl mx-auto px-6 text-center">
        <RevealOnScroll>
          <h2 className="text-3xl md:text-4xl font-serif text-charcoal mb-6">
            Ready to get started?
          </h2>
          <p className="text-charcoal-light mb-10">
            Get a free quote in minutes. No obligation, no hassle.
          </p>
          <Link
            href="/chat"
            className="inline-block px-10 py-4 bg-charcoal-dark text-cream-50 rounded-lg text-base font-medium hover:bg-charcoal transition-colors"
          >
            Get a Free Quote
          </Link>
        </RevealOnScroll>
      </div>
    </section>
  );
}
