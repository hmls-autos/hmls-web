import NavbarNew from "@/components/NavbarNew";
import FooterNew from "@/components/FooterNew";
import HeroNew from "@/components/sections/HeroNew";
import TrustBar from "@/components/sections/TrustBar";
import HowItWorks from "@/components/sections/HowItWorks";
import ServicesNew from "@/components/sections/ServicesNew";
import AboutNew from "@/components/sections/AboutNew";
import ServiceAreaNew from "@/components/sections/ServiceAreaNew";
import CTANew from "@/components/sections/CTANew";

export default function Home() {
  return (
    <main className="min-h-screen bg-cream-50 text-charcoal">
      <NavbarNew />
      <HeroNew />
      <TrustBar />
      <HowItWorks />
      <ServicesNew />
      <AboutNew />
      <ServiceAreaNew />
      <CTANew />
      <FooterNew />
    </main>
  );
}
