import FooterNew from "@/components/FooterNew";
import { JsonLd } from "@/components/JsonLd";
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
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "AutoRepair",
          name: "HMLS Mobile Mechanic",
          url: "https://hmls.autos",
          telephone: "+19492137073",
          email: "business@hmls.autos",
          areaServed: {
            "@type": "City",
            name: "Orange County",
            containedInPlace: {
              "@type": "State",
              name: "California",
            },
          },
          serviceType: [
            "Mobile Mechanic",
            "Oil Change",
            "Brake Repair",
            "Diagnostics",
          ],
          description:
            "Expert mobile mechanic service in Orange County. We come to you.",
        }}
      />
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
