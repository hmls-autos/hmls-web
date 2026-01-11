import Background from "@/components/Background";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { FadeIn } from "@/components/ui/Animations";

export default function Terms() {
  return (
    <main className="flex min-h-screen flex-col items-center bg-black text-white selection:bg-emerald-500 selection:text-black overflow-x-hidden">
      <Navbar />
      <Background />

      <section className="w-full max-w-4xl px-6 pt-32 pb-20">
        <FadeIn className="mb-12">
          <div className="inline-block mb-4 px-4 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs tracking-widest uppercase">
            Legal
          </div>
          <h1 className="text-4xl md:text-5xl font-thin mb-4 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
            Terms of Service
          </h1>
          <p className="text-gray-400 text-sm">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </FadeIn>

        <FadeIn delay={0.1} className="space-y-8">
          <div className="glass-panel p-8 rounded-2xl border border-emerald-500/20">
            <h2 className="text-xl font-light mb-4 text-emerald-400">
              Agreement to Terms
            </h2>
            <p className="text-gray-400 font-light leading-relaxed">
              By accessing or using HMLS Mobile Mechanic services, you agree to
              be bound by these Terms of Service. If you do not agree to these
              terms, please do not use our services.
            </p>
          </div>

          <div className="glass-panel p-8 rounded-2xl border border-emerald-500/20">
            <h2 className="text-xl font-light mb-4 text-emerald-400">
              Services
            </h2>
            <p className="text-gray-400 font-light leading-relaxed mb-4">
              HMLS Mobile Mechanic provides mobile automotive repair and
              maintenance services in Orange County, California. Our services
              include but are not limited to:
            </p>
            <ul className="text-gray-400 font-light leading-relaxed space-y-2 list-disc list-inside">
              <li>Oil changes and fluid services</li>
              <li>Brake repairs and replacements</li>
              <li>Battery testing and replacement</li>
              <li>Diagnostic services</li>
              <li>General maintenance and repairs</li>
            </ul>
          </div>

          <div className="glass-panel p-8 rounded-2xl border border-emerald-500/20">
            <h2 className="text-xl font-light mb-4 text-emerald-400">
              Scheduling and Cancellation
            </h2>
            <p className="text-gray-400 font-light leading-relaxed mb-4">
              Appointments can be scheduled through our website, chat assistant,
              or by phone. We request at least 24 hours notice for
              cancellations.
            </p>
            <p className="text-gray-400 font-light leading-relaxed">
              We reserve the right to reschedule appointments due to weather
              conditions, emergencies, or other unforeseen circumstances. We
              will notify you as soon as possible if rescheduling is necessary.
            </p>
          </div>

          <div className="glass-panel p-8 rounded-2xl border border-emerald-500/20">
            <h2 className="text-xl font-light mb-4 text-emerald-400">
              Payment Terms
            </h2>
            <p className="text-gray-400 font-light leading-relaxed mb-4">
              Payment is due upon completion of services unless otherwise
              agreed. We accept major credit cards, debit cards, and other
              payment methods as indicated during checkout.
            </p>
            <p className="text-gray-400 font-light leading-relaxed">
              Quotes provided are estimates based on the information provided.
              Final pricing may vary based on actual conditions discovered
              during service. Any additional work will be discussed and approved
              before proceeding.
            </p>
          </div>

          <div className="glass-panel p-8 rounded-2xl border border-emerald-500/20">
            <h2 className="text-xl font-light mb-4 text-emerald-400">
              Warranty
            </h2>
            <p className="text-gray-400 font-light leading-relaxed">
              We stand behind our work. Parts and labor are warranted for a
              period specified at the time of service. Warranty terms vary by
              service type and will be clearly communicated in your service
              invoice.
            </p>
          </div>

          <div className="glass-panel p-8 rounded-2xl border border-emerald-500/20">
            <h2 className="text-xl font-light mb-4 text-emerald-400">
              Limitation of Liability
            </h2>
            <p className="text-gray-400 font-light leading-relaxed">
              HMLS Mobile Mechanic shall not be liable for any indirect,
              incidental, special, consequential, or punitive damages arising
              from the use of our services. Our total liability shall not exceed
              the amount paid for the specific service in question.
            </p>
          </div>

          <div className="glass-panel p-8 rounded-2xl border border-emerald-500/20">
            <h2 className="text-xl font-light mb-4 text-emerald-400">
              Contact Us
            </h2>
            <p className="text-gray-400 font-light leading-relaxed">
              If you have any questions about these Terms of Service, please
              contact us at{" "}
              <a
                href="mailto:legal@hmls.autos"
                className="text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                legal@hmls.autos
              </a>
              .
            </p>
          </div>
        </FadeIn>
      </section>

      <Footer />
    </main>
  );
}
