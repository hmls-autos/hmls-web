"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

export default function About() {
  const imageRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    for (const el of [imageRef.current, textRef.current]) {
      if (!el) continue;
      if (prefersReducedMotion) {
        el.classList.add("visible");
        continue;
      }
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            el.classList.add("visible");
            observer.unobserve(el);
          }
        },
        { threshold: 0.1 },
      );
      observer.observe(el);
    }
  }, []);

  return (
    <section id="about" className="w-full py-32 bg-background">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          {/* Image */}
          <div ref={imageRef} className="reveal-left relative">
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden">
              <Image
                src="/images/engine-bay.png"
                alt="Engine bay detail"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
            </div>
            {/* Red accent corner */}
            <div className="absolute -top-3 -left-3 w-20 h-px bg-red-500" />
            <div className="absolute -top-3 -left-3 w-px h-20 bg-red-500" />
            {/* Experience badge */}
            <div className="absolute -bottom-4 -right-4 bg-red-600 rounded-xl px-6 py-4 shadow-2xl shadow-red-600/20">
              <span className="text-3xl font-display font-extrabold text-white">
                20+
              </span>
              <span className="block text-xs text-white/80 uppercase tracking-wider font-display">
                Years
              </span>
            </div>
          </div>

          {/* Text */}
          <div ref={textRef} className="reveal-right">
            <p className="text-sm uppercase tracking-[0.2em] text-red-400 font-display font-semibold mb-4">
              About Us
            </p>
            <h2 className="text-4xl md:text-5xl font-display font-extrabold text-text mb-8 tracking-tight leading-tight">
              Built on experience.
              <br />
              <span className="text-text-secondary">Driven by care.</span>
            </h2>
            <p className="text-text-secondary mb-6 leading-relaxed text-lg">
              I started HMLS to give Orange County a better alternative to
              traditional auto shops. With over two decades of hands-on
              experience, including time at Fortune 100 dealerships, I bring
              expert-level care right to your doorstep.
            </p>
            <p className="text-text-secondary leading-relaxed text-lg">
              Personal service, fair prices, no dealership overhead. That&apos;s
              the HMLS difference.
            </p>
            <div className="mt-8 pt-8 border-t border-border">
              <p className="text-text font-display font-semibold text-lg">
                &mdash; Owner, HMLS Mobile Mechanic
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
