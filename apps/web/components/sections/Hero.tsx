"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MessageSquare } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";

gsap.registerPlugin(ScrollTrigger);

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const subtextRef = useRef<HTMLParagraphElement>(null);
  const taglineRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const lineLeftRef = useRef<HTMLDivElement>(null);
  const lineRightRef = useRef<HTMLDivElement>(null);
  const scrollIndicatorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      // Main entrance timeline — staggered cinematic reveal
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.from(imageRef.current, {
        scale: 1.4,
        duration: 2.2,
        ease: "power2.out",
      })
        .from(overlayRef.current, { opacity: 0, duration: 1.2 }, 0)
        // Accent lines sweep in from edges
        .from(
          lineLeftRef.current,
          { scaleX: 0, transformOrigin: "right center", duration: 0.8 },
          0.3,
        )
        .from(
          lineRightRef.current,
          { scaleX: 0, transformOrigin: "left center", duration: 0.8 },
          0.3,
        )
        // Tagline types in
        .from(
          taglineRef.current,
          {
            y: 20,
            opacity: 0,
            duration: 0.6,
            ease: "power2.out",
          },
          0.5,
        )
        // Main heading — dramatic scale + fade
        .from(
          headingRef.current,
          {
            y: 80,
            opacity: 0,
            scale: 0.9,
            duration: 1.2,
            ease: "power4.out",
          },
          0.7,
        )
        // Subtext
        .from(subtextRef.current, { y: 30, opacity: 0, duration: 0.8 }, 1.0)
        // CTA button — bounces in
        .from(
          ctaRef.current,
          {
            y: 50,
            opacity: 0,
            scale: 0.95,
            duration: 0.8,
            ease: "back.out(1.7)",
          },
          1.2,
        )
        // Scroll indicator fades in last
        .from(
          scrollIndicatorRef.current,
          { opacity: 0, y: -10, duration: 0.6 },
          1.6,
        );

      // Parallax on scroll — image moves slower than content
      gsap.to(imageRef.current, {
        yPercent: 25,
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });

      // Content fades and scales down on scroll
      const contentEls = [
        taglineRef.current,
        headingRef.current,
        subtextRef.current,
        ctaRef.current,
      ];
      gsap.to(contentEls, {
        y: -60,
        opacity: 0,
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "40% top",
          scrub: true,
        },
      });

      // Scroll indicator hides
      gsap.to(scrollIndicatorRef.current, {
        opacity: 0,
        y: 20,
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "5% top",
          end: "15% top",
          scrub: true,
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative w-full min-h-[100dvh] -mt-16 flex items-center justify-center overflow-hidden"
    >
      {/* Background image with parallax */}
      <div ref={imageRef} className="absolute inset-0 scale-110">
        <Image
          src="/images/engine-bay-mercedes.png"
          alt="Mercedes engine bay — precision engineering"
          fill
          priority
          className="object-cover"
          sizes="100vw"
          quality={90}
        />
      </div>

      {/* Gradient overlays — darker, more cinematic */}
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/50 to-black/85"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-black/50" />
      {/* Radial vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.4)_100%)]" />

      {/* Red accent lines — sweep in from edges */}
      <div className="absolute top-0 left-0 right-0 h-[2px] flex">
        <div
          ref={lineLeftRef}
          className="flex-1 bg-gradient-to-r from-transparent via-red-500 to-red-500"
        />
        <div
          ref={lineRightRef}
          className="flex-1 bg-gradient-to-l from-transparent via-red-500 to-red-500"
        />
      </div>

      {/* Side accent lines */}
      <div className="absolute top-0 left-0 w-[1px] h-full bg-gradient-to-b from-red-500/60 via-transparent to-transparent" />
      <div className="absolute top-0 right-0 w-[1px] h-full bg-gradient-to-b from-red-500/60 via-transparent to-transparent" />

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        <p
          ref={taglineRef}
          className="text-sm md:text-base uppercase tracking-[0.35em] text-red-400 font-display font-semibold mb-8"
        >
          Mobile Mechanic &bull; Orange County, CA
        </p>

        <h1
          ref={headingRef}
          className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-display font-extrabold text-white mb-8 tracking-tighter leading-[0.9]"
        >
          We come
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-red-500 to-red-600">
            to you.
          </span>
        </h1>

        <p
          ref={subtextRef}
          className="text-lg md:text-xl text-white/70 mb-12 max-w-2xl mx-auto leading-relaxed"
        >
          Our AI assistant handles quotes, scheduling, and diagnostics
          instantly. Just tell it what you need.
        </p>

        <div ref={ctaRef} className="flex flex-col items-center gap-4">
          <Link
            href="/chat"
            className="group relative inline-flex items-center gap-3 px-10 py-5 bg-red-600 text-white text-lg font-display font-bold rounded-2xl hover:bg-red-700 transition-all duration-300 shadow-2xl shadow-red-600/30 hover:shadow-red-600/50 hover:scale-[1.02]"
          >
            {/* Glow ring on hover */}
            <span className="absolute inset-0 rounded-2xl ring-1 ring-red-400/0 group-hover:ring-red-400/40 transition-all duration-300" />
            <MessageSquare className="w-5 h-5" />
            Ask Our AI Mechanic
            <span className="flex gap-0.5 ml-1">
              <span className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce" />
              <span className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce [animation-delay:0.15s]" />
              <span className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce [animation-delay:0.3s]" />
            </span>
          </Link>
          <p className="text-sm text-white/40 font-display">
            Instant quotes &bull; 24/7 availability &bull; Free estimates
          </p>
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        ref={scrollIndicatorRef}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/40"
      >
        <span className="text-xs uppercase tracking-widest font-display">
          Scroll
        </span>
        <div className="w-px h-10 relative overflow-hidden">
          <div className="w-full h-full bg-gradient-to-b from-red-500 to-transparent animate-pulse" />
        </div>
      </div>
    </section>
  );
}
