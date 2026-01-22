import {
  Battery,
  Car,
  CheckCircle2,
  Cog,
  Cpu,
  Gauge,
  Heart,
  ShieldCheck,
  Thermometer,
  UserCheck,
  Wrench,
} from "lucide-react";
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

      {/* About Section */}
      <section id="about" className="w-full max-w-7xl px-6 py-24 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          <FadeIn direction="left">
            <h2 className="text-sm font-medium text-emerald-500 tracking-widest uppercase mb-4">
              About HMLS
            </h2>
            <h3 className="text-4xl md:text-5xl font-thin mb-8 leading-tight">
              20+ Years of <br />
              <span className="text-emerald-500">Expertise</span>
            </h3>

            <div className="glass-panel p-8 rounded-2xl border border-emerald-500/20 mb-8">
              <p className="text-gray-400 font-light leading-relaxed mb-6">
                Hi, I&apos;m the founder of HMLS Mobile Mechanic. With over 20
                years of hands-on experience, including time at Fortune 100
                dealerships, I&apos;ve seen it all.
              </p>
              <p className="text-gray-400 font-light leading-relaxed mb-6">
                I started this business to give Orange County a better, more
                personalized alternative to traditional auto repair shops. My
                aim is to deliver exceptional care for your vehicle without the
                high overhead costs or the impersonal service you&apos;d find at
                a dealership.
              </p>
              <p className="text-gray-400 font-light leading-relaxed">
                Whether it&apos;s routine maintenance or complex diagnostics,
                I&apos;ll make sure your car gets the attention it deserves
                right at your driveway.
              </p>
            </div>
          </FadeIn>

          <div className="space-y-6">
            {[
              {
                title: "Our Mission",
                desc: "We deliver convenient, affordable, and high-quality auto repair services to keep your vehicle running smoothly.",
                icon: <Wrench className="w-6 h-6 text-emerald-500" />,
              },
              {
                title: "Our Vision",
                desc: "To become the trusted go-to mobile mechanic for stress-free, reliable, and expert automotive care in Orange County.",
                icon: <UserCheck className="w-6 h-6 text-emerald-500" />,
              },
              {
                title: "Core Values",
                desc: "Honesty, dedication, and customer satisfaction are the driving forces behind every repair we perform.",
                icon: <Heart className="w-6 h-6 text-emerald-500" />,
              },
            ].map((item, i) => (
              <FadeIn
                key={item.title}
                direction="right"
                delay={i * 0.2}
                className="flex gap-4 items-start"
              >
                <div className="shrink-0 w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  {item.icon}
                </div>
                <div>
                  <h4 className="text-xl font-medium text-white mb-2">
                    {item.title}
                  </h4>
                  <p className="text-gray-400 font-light text-sm leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </FadeIn>
            ))}

            <FadeIn
              direction="right"
              delay={0.6}
              className="relative h-64 rounded-2xl overflow-hidden glass-panel border-white/5 mt-8"
            >
              <Image
                src="/images/engine-bay.png"
                alt="Engine bay"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover hover:scale-105 transition-transform duration-700"
              />
            </FadeIn>
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

      {/* Services Section */}
      <section id="services" className="w-full bg-white/[0.02] py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <FadeIn className="mb-16 text-center">
            <h2 className="text-sm font-medium text-emerald-500 tracking-widest uppercase mb-4">
              Our Services
            </h2>
            <h3 className="text-4xl md:text-5xl font-thin">
              Comprehensive Care for Your Vehicle
            </h3>
            <p className="text-xl text-gray-400 font-light max-w-2xl mx-auto mt-6">
              From routine maintenance to complex engine work, we handle it all
              with precision right at your location.
            </p>
          </FadeIn>

          {/* Value Props */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {[
              {
                step: "01",
                title: "Lower Overhead, Lower Costs",
                desc: "Our streamlined mobile approach minimizes operational expenses, passing the savings directly to you.",
              },
              {
                step: "02",
                title: "Customized Part Solutions",
                desc: "We collaborate with multiple suppliers to find the perfect part for your budget and specific needs.",
              },
              {
                step: "03",
                title: "Proactive Care Saves Money",
                desc: "Regular maintenance prevents costly future repairs, keeping your car in top condition for longer.",
              },
            ].map((item, i) => (
              <FadeIn
                key={item.step}
                delay={i * 0.2}
                className="glass-panel p-8 rounded-2xl relative group hover:border-emerald-500/30 transition-colors"
              >
                <div className="text-sm text-emerald-500 font-medium mb-4">
                  {item.step}
                </div>
                <h4 className="text-xl font-medium mb-3">{item.title}</h4>
                <p className="text-gray-400 font-light leading-relaxed">
                  {item.desc}
                </p>
              </FadeIn>
            ))}
          </div>

          {/* Detailed Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "Oil Change",
                desc: "Replace engine oil and filter while topping off all fluids for smooth performance.",
                icon: <Gauge className="w-6 h-6" />,
              },
              {
                title: "Brakes",
                desc: "Inspect brake pads, rotors, and fluid to ensure safety and stopping power.",
                icon: <ShieldCheck className="w-6 h-6" />,
              },
              {
                title: "HVAC Service",
                desc: "Comprehensive air conditioning inspection and servicing for your comfort.",
                icon: <Thermometer className="w-6 h-6" />,
              },
              {
                title: "Suspension",
                desc: "Diagnose and repair suspension for a smooth, noise-free ride.",
                icon: <Cog className="w-6 h-6" />,
              },
              {
                title: "Battery & Electrical",
                desc: "Full diagnostics for starting and charging systems, including alternator and battery replacement.",
                icon: <Battery className="w-6 h-6" />,
              },
              {
                title: "Engine Diagnostics",
                desc: "Advanced tools to diagnose and resolve complex engine issues efficiently.",
                icon: <Car className="w-6 h-6" />,
              },
            ].map((service, i) => (
              <ScaleIn
                key={service.title}
                delay={i * 0.1}
                className="p-8 rounded-2xl border border-white/5 hover:border-emerald-500/30 hover:bg-white/[0.02] transition-all group cursor-default flex flex-col"
              >
                <div className="mb-6 w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:text-emerald-400 transition-colors">
                  {service.icon}
                </div>
                <h4 className="text-lg font-medium mb-3 text-white group-hover:translate-x-2 transition-transform duration-300">
                  {service.title}
                </h4>
                <p className="text-sm text-gray-400 font-light leading-relaxed">
                  {service.desc}
                </p>
              </ScaleIn>
            ))}
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

          <div className="flex justify-center gap-4 relative z-10">
            <Link
              href="/contact"
              className="glass-button px-12 py-5 rounded-xl text-emerald-400 font-medium tracking-wide text-lg hover:scale-105 active:scale-95"
            >
              Get Started
            </Link>
            <Link
              href="/chat"
              className="px-12 py-5 rounded-xl border border-white/10 text-white font-medium tracking-wide text-lg hover:border-emerald-500/30 hover:scale-105 active:scale-95 transition-all"
            >
              Chat with AI
            </Link>
          </div>
        </FadeIn>
      </section>

      <Footer />
    </main>
  );
}
