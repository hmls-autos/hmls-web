import { JsonLd } from "@/components/JsonLd";
import About from "@/components/sections/About";
import CTA from "@/components/sections/CTA";
import Hero from "@/components/sections/Hero";
import HowItWorks from "@/components/sections/HowItWorks";
import ServiceArea from "@/components/sections/ServiceArea";
import Services from "@/components/sections/Services";
import TrustBar from "@/components/sections/TrustBar";
import { autoRepairSchema } from "@/lib/schema";

export default function Home() {
  return (
    <main className="bg-background text-foreground">
      <JsonLd data={autoRepairSchema()} />
      <Hero />
      <TrustBar />
      <HowItWorks />
      <Services />
      <About />
      <ServiceArea />
      <CTA />
    </main>
  );
}
