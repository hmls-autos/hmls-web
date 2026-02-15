import FooterNew from "@/components/FooterNew";
import AboutNew from "@/components/sections/AboutNew";
import CTANew from "@/components/sections/CTANew";
import HeroNew from "@/components/sections/HeroNew";
import HowItWorks from "@/components/sections/HowItWorks";
import ServiceAreaNew from "@/components/sections/ServiceAreaNew";
import ServicesNew from "@/components/sections/ServicesNew";
import TrustBar from "@/components/sections/TrustBar";

export default function Home() {
  return (
    <main className="min-h-full bg-background text-text">
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
