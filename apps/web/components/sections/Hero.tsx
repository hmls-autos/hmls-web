import { MessageSquare } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative w-full min-h-[100dvh] -mt-16 flex items-center justify-center overflow-hidden">
      {/* Hex bolts at four corners */}
      <div
        className="absolute inset-0 z-20 pointer-events-none hex-bolts"
        aria-hidden="true"
      >
        <div className="absolute inset-0 hex-bolts-bottom" />
      </div>

      {/* Background image */}
      <div className="absolute inset-0">
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

      {/* Single gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        {/* Tagline with machined groove lines */}
        <div className="hero-animate hero-animate-1 flex items-center justify-center gap-4 mb-8">
          <div
            className="hidden md:block h-px w-16 machined-groove-horizontal"
            aria-hidden="true"
          />
          <p className="text-sm md:text-base uppercase tracking-[0.35em] text-red-400 font-display font-semibold">
            Mobile Mechanic &bull; Orange County, CA
          </p>
          <div
            className="hidden md:block h-px w-16 machined-groove-horizontal"
            aria-hidden="true"
          />
        </div>

        <h1 className="hero-animate hero-animate-2 text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-display font-extrabold text-white mb-8 tracking-tighter leading-[0.9]">
          We come
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-red-500 to-red-600">
            to you.
          </span>
        </h1>

        <p className="hero-animate hero-animate-3 text-lg md:text-xl text-white/70 mb-12 max-w-2xl mx-auto leading-relaxed">
          Our AI assistant handles quotes, scheduling, and diagnostics
          instantly. Just tell it what you need.
        </p>

        <div className="hero-animate hero-animate-4 flex flex-col items-center gap-4">
          <Link
            href="/chat"
            className="group relative inline-flex items-center gap-3 px-10 py-5 bg-red-600 text-white text-lg font-display font-bold rounded-2xl hover:bg-red-700 transition-all duration-300 shadow-2xl shadow-red-600/30 hover:shadow-red-600/50 hover:scale-[1.02]"
          >
            <span className="absolute inset-0 rounded-2xl ring-1 ring-red-400/0 group-hover:ring-red-400/40 transition-all duration-300" />
            <MessageSquare className="w-5 h-5" />
            Ask Our AI Mechanic
          </Link>
          <p className="text-sm text-white/40 font-display">
            Instant quotes &bull; 24/7 availability &bull; Free estimates
          </p>
        </div>
      </div>

      {/* Hydraulic piston scroll indicator */}
      <div className="hero-animate hero-animate-4 absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/40">
        <span className="text-xs uppercase tracking-widest font-display">
          Scroll
        </span>
        <div className="w-3 h-14 rounded-full border border-white/20 bg-white/5 relative overflow-hidden">
          <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-red-600 via-red-500 to-transparent animate-pulse rounded-full" />
          <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-transparent rounded-full" />
        </div>
      </div>
    </section>
  );
}
