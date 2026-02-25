"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import { useEffect, useRef } from "react";

gsap.registerPlugin(ScrollTrigger);

export default function About() {
  const sectionRef = useRef<HTMLElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      // Image parallax reveal
      gsap.from(imageRef.current, {
        x: -80,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 70%",
          toggleActions: "play none none none",
        },
      });

      // Image parallax on scroll
      const img = imageRef.current?.querySelector("img");
      if (img) {
        gsap.to(img, {
          yPercent: 15,
          ease: "none",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        });
      }

      // Text slide in
      gsap.from(textRef.current, {
        x: 80,
        opacity: 0,
        duration: 1,
        delay: 0.2,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 70%",
          toggleActions: "play none none none",
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="about" className="w-full py-32 bg-background">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          {/* Image */}
          <div ref={imageRef} className="relative">
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden">
              <Image
                src="/images/engine-bay.png"
                alt="Engine bay detail"
                fill
                className="object-cover scale-110"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              {/* Gradient overlay */}
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
          <div ref={textRef}>
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
