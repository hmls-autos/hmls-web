import { ArrowRight, CheckCircle2, Clock, Cpu, Wrench } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import Background from "@/components/Background";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import HomeHero from "@/components/sections/HomeHero";
import { FadeIn, ScaleIn, StaggerContainer } from "@/components/ui/Animations";
import RealMap from "@/components/ui/RealMap";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center bg-black text-white selection:bg-emerald-500 selection:text-black overflow-x-hidden">
      <Navbar />
      <Background />
      <HomeHero />

      {/* Stats Section */}
      <section className="w-full border-y border-white/5 bg-white/[0.02] backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: "20+", label: "Years Experience" },
              { value: "50+", label: "Satisfied Customers" },
              { value: "100%", label: "Satisfaction" },
              { value: "100+", label: "Repairs Completed" },
            ].map((stat, i) => (
              <FadeIn key={stat.label} delay={i * 0.1} className="text-center">
                <div className="text-3xl md:text-4xl font-thin text-white mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-emerald-500/60 font-medium uppercase tracking-wider">
                  {stat.label}
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="w-full max-w-7xl px-6 py-24 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <FadeIn direction="right">
            <h2 className="text-sm font-medium text-emerald-500 tracking-widest uppercase mb-4">
              Why Choose hmls.
            </h2>
            <h3 className="text-4xl md:text-5xl font-thin mb-8 leading-tight">
              Your Trusted <br /> Mobile Expert
            </h3>

            <div className="space-y-8">
              {[
                {
                  title: "Convenience You Can Count On",
                  desc: "From pick-up to delivery, we handle your repairs with ease and efficiency right at your driveway.",
                  icon: <Clock className="w-6 h-6 text-emerald-500" />,
                },
                {
                  title: "Exceptional Care for Every Vehicle",
                  desc: "Get expert service backed by decades of automotive experience and futuristic diagnostic tech.",
                  icon: <CheckCircle2 className="w-6 h-6 text-emerald-500" />,
                },
              ].map((item, i) => (
                <FadeIn
                  key={item.title}
                  direction="right"
                  delay={i * 0.2}
                  className="flex gap-4"
                >
                  <div className="shrink-0 w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="text-lg font-medium text-white mb-1">
                      {item.title}
                    </h4>
                    <p className="text-gray-400 font-light text-sm leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </FadeIn>
              ))}
            </div>

            <Link
              href="/about"
              className="inline-flex items-center gap-2 text-emerald-400 mt-8 hover:gap-4 transition-all"
            >
              Learn more about us <ArrowRight className="w-4 h-4" />
            </Link>
          </FadeIn>

          <div className="relative">
            <ScaleIn className="relative h-[500px] rounded-2xl overflow-hidden glass-panel border-emerald-500/20 z-10">
              <Image
                src="/images/engine-bay.png"
                alt="Mechanic working on car"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover hover:scale-105 transition-transform duration-700"
              />
            </ScaleIn>
            {/* Decorative offset image */}
            <div className="absolute -bottom-8 -right-8 w-2/3 h-64 rounded-2xl overflow-hidden border border-white/10 bg-black z-20 shadow-2xl">
              <Image
                src="/images/dipstick.png"
                alt="Engine detail"
                fill
                sizes="33vw"
                className="object-cover hover:scale-105 transition-transform duration-700"
              />
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="w-full max-w-7xl px-6 py-24 relative z-10 border-t border-white/5">
        <StaggerContainer className="mb-16 text-center">
          <FadeIn className="text-sm font-medium text-emerald-500 tracking-widest uppercase mb-4">
            The Process
          </FadeIn>
          <FadeIn className="text-4xl md:text-5xl font-thin">
            Ensuring repairs are done right
          </FadeIn>
        </StaggerContainer>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connecting Line */}
          <div className="hidden md:block absolute top-12 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent -z-10" />

          {[
            {
              step: "01",
              title: "Understand the issue",
              desc: "Thoroughly diagnose the root cause of the issue to ensure accurate repairs.",
              icon: <Cpu className="w-6 h-6" />,
            },
            {
              step: "02",
              title: "Execute with precision",
              desc: "Follow industry standards and manufacturer guidelines for every repair.",
              icon: <Wrench className="w-6 h-6" />,
            },
            {
              step: "03",
              title: "Confirm the results",
              desc: "Test and validate every repair for peace of mind and reliability.",
              icon: <CheckCircle2 className="w-6 h-6" />,
            },
          ].map((item, i) => (
            <FadeIn
              key={item.step}
              delay={i * 0.2}
              className="glass-panel p-8 rounded-2xl relative group hover:border-emerald-500/30 transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-black border border-white/10 flex items-center justify-center mb-6 text-emerald-500 group-hover:scale-110 transition-transform duration-500 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                {item.icon}
              </div>
              <div className="absolute top-8 right-8 text-4xl font-black text-white/5 select-none">
                {item.step}
              </div>
              <h4 className="text-xl font-medium mb-3">{item.title}</h4>
              <p className="text-gray-400 font-light leading-relaxed">
                {item.desc}
              </p>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* Services Preview */}
      <section className="w-full bg-white/[0.02] py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <FadeIn className="mb-16 md:flex justify-between items-end">
            <div>
              <h2 className="text-sm font-medium text-emerald-500 tracking-widest uppercase mb-4">
                Our Expertise
              </h2>
              <h3 className="text-4xl md:text-5xl font-thin">
                Comprehensive Services
              </h3>
            </div>
            <Link
              href="/services"
              className="hidden md:flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              View all services <ArrowRight className="w-4 h-4" />
            </Link>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: "Maintenance Services",
                desc: "Routine oil changes, tune-ups, and fluid top-ups.",
                icon: <Clock />,
              },
              {
                title: "Repair Services",
                desc: "Brakes, suspension, and essential mechanical repairs.",
                icon: <Wrench />,
              },
              {
                title: "Diagnostics Services",
                desc: "Advanced computer diagnostics for electrical issues.",
                icon: <Cpu />,
              },
            ].map((service, i) => (
              <ScaleIn
                key={service.title}
                delay={i * 0.1}
                className="p-8 rounded-2xl border border-white/5 hover:border-emerald-500/30 hover:bg-white/[0.02] transition-all group cursor-default"
              >
                <div className="mb-6 text-emerald-500 group-hover:text-emerald-400 transition-colors">
                  {service.icon}
                </div>
                <h4 className="text-lg font-medium mb-2 text-white group-hover:translate-x-2 transition-transform duration-300">
                  {service.title}
                </h4>
                <p className="text-sm text-gray-500 font-light leading-relaxed group-hover:text-gray-400 transition-colors">
                  {service.desc}
                </p>
              </ScaleIn>
            ))}
          </div>

          <div className="md:hidden mt-8 text-center">
            <Link
              href="/services"
              className="inline-flex items-center gap-2 text-emerald-400"
            >
              View all services <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Area Section */}
      <section className="w-full max-w-7xl px-6 py-24 relative z-10">
        <div className="flex flex-col md:flex-row items-center gap-16">
          <FadeIn direction="left" className="flex-1">
            <h2 className="text-4xl md:text-5xl font-thin mb-6">
              Serving <span className="text-emerald-500">Orange County</span>
            </h2>
            <p className="text-gray-400 font-light mb-8 leading-relaxed text-lg">
              We operate a fleet of mobile units covering the entire Orange
              County metro area. No need to tow your car to a shop—we bring the
              shop to you.
            </p>
            <div className="flex flex-wrap gap-3">
              {[
                "Irvine",
                "Newport Beach",
                "Anaheim",
                "Santa Ana",
                "Costa Mesa",
                "Fullerton",
                "Huntington Beach",
              ].map((city) => (
                <span
                  key={city}
                  className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-gray-300"
                >
                  {city}
                </span>
              ))}
            </div>
          </FadeIn>

          <FadeIn
            direction="right"
            className="flex-1 w-full h-[400px] glass-panel rounded-2xl overflow-hidden relative group border border-emerald-500/20"
          >
            <RealMap className="w-full h-full" />
          </FadeIn>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full px-6 py-24">
        <FadeIn className="max-w-4xl mx-auto glass-panel p-12 md:p-20 rounded-[2rem] border-emerald-500/20 text-center relative overflow-hidden">
          {/* Background image for CTA */}
          <div className="absolute inset-0 opacity-20">
            <Image
              src="/images/oil-pan.png"
              alt="Workshop background"
              fill
              sizes="100vw"
              className="object-cover"
            />
          </div>
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-black/80 via-black/60 to-black/80 pointer-events-none" />

          <h2 className="text-4xl md:text-5xl font-thin mb-6 relative z-10">
            Ready for the Future?
          </h2>
          <p className="text-gray-400 font-light mb-10 text-lg max-w-xl mx-auto relative z-10">
            Get a quote or schedule your mobile mechanic visit today. Fast,
            reliable, and futuristic service at your doorstep.
          </p>

          <div className="flex justify-center relative z-10">
            <Link
              href="/contact"
              className="glass-button px-12 py-5 rounded-xl text-emerald-400 font-medium tracking-wide text-lg hover:scale-105 active:scale-95"
            >
              Get Started
            </Link>
          </div>
        </FadeIn>
      </section>

      <Footer />
    </main>
  );
}
