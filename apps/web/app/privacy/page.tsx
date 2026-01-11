import Background from "@/components/Background";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { FadeIn } from "@/components/ui/Animations";

export default function Privacy() {
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
            Privacy Policy
          </h1>
          <p className="text-gray-400 text-sm">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </FadeIn>

        <FadeIn delay={0.1} className="space-y-8">
          <div className="glass-panel p-8 rounded-2xl border border-emerald-500/20">
            <h2 className="text-xl font-light mb-4 text-emerald-400">
              Information We Collect
            </h2>
            <p className="text-gray-400 font-light leading-relaxed mb-4">
              When you use HMLS Mobile Mechanic services, we may collect the
              following information:
            </p>
            <ul className="text-gray-400 font-light leading-relaxed space-y-2 list-disc list-inside">
              <li>Contact information (name, phone number, email address)</li>
              <li>Vehicle information (make, model, year, VIN)</li>
              <li>Service location and address</li>
              <li>Service history and preferences</li>
              <li>Payment information (processed securely via Stripe)</li>
            </ul>
          </div>

          <div className="glass-panel p-8 rounded-2xl border border-emerald-500/20">
            <h2 className="text-xl font-light mb-4 text-emerald-400">
              How We Use Your Information
            </h2>
            <p className="text-gray-400 font-light leading-relaxed mb-4">
              We use your information to:
            </p>
            <ul className="text-gray-400 font-light leading-relaxed space-y-2 list-disc list-inside">
              <li>Schedule and provide mobile mechanic services</li>
              <li>Process payments and send invoices</li>
              <li>Communicate about appointments and services</li>
              <li>Improve our services and customer experience</li>
              <li>Send service reminders and updates (with your consent)</li>
            </ul>
          </div>

          <div className="glass-panel p-8 rounded-2xl border border-emerald-500/20">
            <h2 className="text-xl font-light mb-4 text-emerald-400">
              Data Security
            </h2>
            <p className="text-gray-400 font-light leading-relaxed">
              We take the security of your personal information seriously. All
              payment information is processed securely through Stripe and is
              never stored on our servers. We use industry-standard security
              measures to protect your data from unauthorized access,
              disclosure, or misuse.
            </p>
          </div>

          <div className="glass-panel p-8 rounded-2xl border border-emerald-500/20">
            <h2 className="text-xl font-light mb-4 text-emerald-400">
              Your Rights
            </h2>
            <p className="text-gray-400 font-light leading-relaxed mb-4">
              You have the right to:
            </p>
            <ul className="text-gray-400 font-light leading-relaxed space-y-2 list-disc list-inside">
              <li>Access the personal information we hold about you</li>
              <li>Request correction of inaccurate information</li>
              <li>Request deletion of your information</li>
              <li>Opt out of marketing communications</li>
            </ul>
          </div>

          <div className="glass-panel p-8 rounded-2xl border border-emerald-500/20">
            <h2 className="text-xl font-light mb-4 text-emerald-400">
              Contact Us
            </h2>
            <p className="text-gray-400 font-light leading-relaxed">
              If you have any questions about this Privacy Policy, please
              contact us at{" "}
              <a
                href="mailto:privacy@hmls.autos"
                className="text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                privacy@hmls.autos
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
