import Image from "next/image";
import RevealOnScroll from "@/components/ui/RevealOnScroll";

export default function AboutNew() {
  return (
    <section id="about" className="w-full py-24 bg-surface-alt">
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
              {/* Red accent corner */}
              <div className="absolute top-0 left-0 w-16 h-1 bg-red-primary" />
              <div className="absolute top-0 left-0 w-1 h-16 bg-red-primary" />
            </div>
          </RevealOnScroll>

          <RevealOnScroll delay={1}>
            <div>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-text mb-6 text-balance">
                20+ years of experience
              </h2>
              <p className="text-text-secondary mb-6 leading-relaxed">
                I started HMLS to give Orange County a better alternative to
                traditional auto shops. With over two decades of hands-on
                experience, including time at Fortune 100 dealerships, I bring
                expert-level care right to your doorstep.
              </p>
              <p className="text-text-secondary leading-relaxed">
                Personal service, fair prices, no dealership overhead. That's
                the HMLS difference.
              </p>
              <p className="mt-6 text-text font-display font-semibold">
                — Owner, HMLS Mobile Mechanic
              </p>
            </div>
          </RevealOnScroll>
        </div>
      </div>
    </section>
  );
}
