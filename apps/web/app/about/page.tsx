import { Heart, UserCheck, Wrench } from "lucide-react";
import Image from "next/image";
import Background from "@/components/Background";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { FadeIn } from "@/components/ui/Animations";

export default function About() {
  return (
    <main className="flex min-h-screen flex-col items-center bg-black text-white selection:bg-emerald-500 selection:text-black overflow-x-hidden">
      <Navbar />
      <Background />

      <section className="w-full max-w-7xl px-6 pt-32 pb-20">
        <FadeIn className="max-w-3xl">
          <div className="inline-block mb-4 px-4 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs tracking-widest uppercase">
            About Us
          </div>
          <h1 className="text-5xl md:text-7xl font-thin mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
            Personalized Auto Care with <br />
            <span className="text-emerald-500">20+ Years of Expertise.</span>
          </h1>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 mt-16 items-start">
          <div className="space-y-8">
            <FadeIn
              direction="left"
              className="glass-panel p-8 rounded-2xl border border-emerald-500/20"
            >
              <h3 className="text-2xl font-light mb-6">The HMLS Story</h3>
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
            </FadeIn>

            {/* Image - Replaced Grid with Single Image */}
            <FadeIn
              direction="up"
              className="relative h-64 rounded-2xl overflow-hidden border border-white/10"
            >
              <Image
                src="/images/engine-bay-mercedes.png"
                alt="Mechanic working on engine"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover hover:scale-105 transition-transform duration-700"
              />
            </FadeIn>
          </div>

          <div className="space-y-8">
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
              className="relative h-80 rounded-2xl overflow-hidden glass-panel border-white/5 mt-8"
            >
              <Image
                src="/images/brake-pads.png"
                alt="Mechanic tools"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover hover:scale-105 transition-transform duration-700"
              />
            </FadeIn>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-24">
          {[
            { label: "Friendly Support", desc: "Responsive communication" },
            { label: "Expertise", desc: "Dealer-quality service" },
            { label: "Flexibility", desc: "Tailored to your schedule" },
            { label: "Affordable", desc: "No shop overhead costs" },
          ].map((stat, i) => (
            <FadeIn
              key={stat.label}
              delay={i * 0.1}
              className="glass-panel p-6 rounded-xl text-center"
            >
              <div className="text-emerald-400 font-medium mb-2">
                {stat.label}
              </div>
              <div className="text-xs text-gray-500">{stat.desc}</div>
            </FadeIn>
          ))}
        </div>
      </section>

      <Footer />
    </main>
  );
}
