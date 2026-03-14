"use client";

import { NavBar } from "@/components/landing/NavBar";
import { HeroSection } from "@/components/landing/HeroSection";
import { InputMethodsSection } from "@/components/landing/InputMethodsSection";
import { DiagnosisSection } from "@/components/landing/DiagnosisSection";
import { AudienceSection } from "@/components/landing/AudienceSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { CTASection } from "@/components/landing/CTASection";
import { Footer } from "@/components/landing/Footer";

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
