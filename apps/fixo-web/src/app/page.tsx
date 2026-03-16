"use client";

import { AudienceSection } from "@/components/landing/AudienceSection";
import { CTASection } from "@/components/landing/CTASection";
import { DiagnosisSection } from "@/components/landing/DiagnosisSection";
import { Footer } from "@/components/landing/Footer";
import { HeroSection } from "@/components/landing/HeroSection";
import { InputMethodsSection } from "@/components/landing/InputMethodsSection";
import { NavBar } from "@/components/landing/NavBar";
import { PricingSection } from "@/components/landing/PricingSection";

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <NavBar />
      <HeroSection />
      <InputMethodsSection />
      <DiagnosisSection />
      <AudienceSection />
      <PricingSection />
      <CTASection />
      <Footer />
    </div>
  );
}
