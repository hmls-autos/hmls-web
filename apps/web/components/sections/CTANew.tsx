import Link from "next/link";
import RevealOnScroll from "@/components/ui/RevealOnScroll";

export default function CTANew() {
  return (
    <section className="w-full py-24 bg-red-primary hazard-stripe">
      <div className="max-w-2xl mx-auto px-6 text-center">
        <RevealOnScroll>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-6">
            Ready to get started?
          </h2>
          <p className="text-white/80 mb-10">
            Get a free quote in minutes. No obligation, no hassle.
          </p>
          <Link
            href="/chat"
            className="inline-block px-10 py-4 bg-white text-red-primary rounded-lg text-base font-bold hover:bg-red-light transition-colors"
          >
            Get a Free Quote
          </Link>
        </RevealOnScroll>
      </div>
    </section>
  );
}
