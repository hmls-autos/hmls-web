import { Mail, MapPin, Phone } from "lucide-react";
import Background from "@/components/Background";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { FadeIn } from "@/components/ui/Animations";
import RealMap from "@/components/ui/RealMap";

export default function Contact() {
  return (
    <main className="flex min-h-screen flex-col items-center bg-black text-white selection:bg-emerald-500 selection:text-black overflow-x-hidden">
      <Navbar />
      <Background />

      <section className="w-full max-w-3xl px-6 pt-32 pb-20 flex-grow">
        <div className="flex flex-col items-center text-center">
          <FadeIn direction="up">
            <div className="inline-block mb-4 px-4 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs tracking-widest uppercase">
              Contact Us
            </div>
            <h1 className="text-5xl md:text-6xl font-thin mb-8 leading-tight">
              Get in Touch for{" "}
              <span className="text-emerald-500">Reliable Auto Care.</span>
            </h1>
            <p className="text-xl text-gray-400 font-light mb-12 max-w-lg mx-auto">
              Ready to schedule a service or have a question? We&apos;re here to
              help. We come to you anywhere in Orange County.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-8 mb-12">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-emerald-500">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="text-xs text-gray-400">Service Area</div>
                  <div className="text-sm font-medium">Orange County, CA</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-emerald-500">
                  <Phone className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="text-xs text-gray-400">Phone</div>
                  <a
                    href="tel:+19492137073"
                    className="text-sm font-medium hover:text-emerald-400 transition-colors"
                  >
                    (949) 213-7073
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-emerald-500">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="text-xs text-gray-400">Email</div>
                  <a
                    href="mailto:business@hmls.autos"
                    className="text-sm font-medium hover:text-emerald-400 transition-colors"
                  >
                    business@hmls.autos
                  </a>
                </div>
              </div>
            </div>

            <div className="w-full h-80 rounded-2xl overflow-hidden glass-panel border-emerald-500/20 relative group">
              <RealMap className="w-full h-full" />
            </div>
          </FadeIn>
        </div>
      </section>

      <Footer />
    </main>
  );
}
