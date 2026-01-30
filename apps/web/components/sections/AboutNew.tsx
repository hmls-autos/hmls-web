import Image from "next/image";
import RevealOnScroll from "@/components/ui/RevealOnScroll";

export default function AboutNew() {
  return (
    <section id="about" className="w-full py-24 bg-cream-100">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <RevealOnScroll>
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden">
              <Image
                src="/images/engine-bay.png"
                alt="Engine bay detail"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </RevealOnScroll>

          <RevealOnScroll delay={1}>
            <div>
              <h2 className="text-3xl md:text-4xl font-serif text-charcoal mb-6">
                20+ years of experience
              </h2>
              <p className="text-charcoal-light mb-6 leading-relaxed">
                I started HMLS to give Orange County a better alternative to
                traditional auto shops. With over two decades of hands-on
                experience, including time at Fortune 100 dealerships, I bring
                expert-level care right to your doorstep.
              </p>
              <p className="text-charcoal-light leading-relaxed">
                Personal service, fair prices, no dealership overhead. That's
                the HMLS difference.
              </p>
              <p className="mt-6 text-charcoal font-medium">
                — Owner, HMLS Mobile Mechanic
              </p>
            </div>
          </RevealOnScroll>
        </div>
      </div>
    </section>
  );
}
