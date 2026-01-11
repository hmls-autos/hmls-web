import {
  Battery,
  Car,
  Cog,
  Gauge,
  ShieldCheck,
  Thermometer,
  Wrench,
} from "lucide-react";
import Image from "next/image";
import Background from "@/components/Background";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { FadeIn, ScaleIn } from "@/components/ui/Animations";

export default function Services() {
  return (
    <main className="flex min-h-screen flex-col items-center bg-black text-white selection:bg-emerald-500 selection:text-black overflow-x-hidden">
      <Navbar />
      <Background />

      <section className="w-full max-w-7xl px-6 pt-32 pb-20">
        <div className="flex flex-col lg:flex-row gap-16 mb-24">
          <FadeIn className="flex-1">
            <div className="inline-block mb-4 px-4 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs tracking-widest uppercase">
              Our Services
            </div>
            <h1 className="text-5xl md:text-7xl font-thin mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
              Comprehensive Care for <br />
              <span className="text-emerald-500">Your Vehicle.</span>
            </h1>
            <p className="text-xl text-gray-400 font-light max-w-xl">
              From routine maintenance to complex engine work, we handle it all
              with laboratory precision right at your location.
            </p>
          </FadeIn>
          <ScaleIn className="relative flex-1 h-[400px] rounded-3xl overflow-hidden glass-panel border-emerald-500/20">
            <Image
              src="/images/vacuum-pump.png"
              alt="Mobile workshop van"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover hover:scale-105 transition-transform duration-700"
            />
          </ScaleIn>
        </div>

        {/* Value Props */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
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
            // Added to fill grid
            {
              title: "Pre-Purchase Inspection",
              desc: "Thorough assessment of a used vehicle's condition before you buy.",
              icon: <Wrench className="w-6 h-6" />,
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
      </section>

      <Footer />
    </main>
  );
}
