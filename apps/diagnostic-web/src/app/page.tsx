"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Camera,
  Mic,
  Plug,
  MessageSquare,
  Zap,
  FileText,
  Car,
  ChevronRight,
  Check,
  Wrench,
  Shield,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

const features = [
  {
    icon: Camera,
    title: "Photo & Video",
    desc: "Snap a photo of the warning light, leak, or damage. Our AI identifies issues visually.",
  },
  {
    icon: Mic,
    title: "Audio Analysis",
    desc: "Record that strange noise. Spectrogram analysis pinpoints mechanical problems by sound.",
  },
  {
    icon: Plug,
    title: "OBD-II Codes",
    desc: "Enter your check engine codes for instant, plain-English explanations and fixes.",
  },
  {
    icon: MessageSquare,
    title: "Chat Diagnostics",
    desc: "Describe your problem in plain language. The AI asks the right follow-up questions.",
  },
  {
    icon: FileText,
    title: "PDF Reports",
    desc: "Get a professional diagnostic report you can share with your mechanic or shop.",
  },
  {
    icon: Zap,
    title: "Instant Results",
    desc: "No waiting for appointments. Get expert-level analysis in seconds, 24/7.",
  },
];

const steps = [
  {
    num: "1",
    title: "Describe the Problem",
    desc: "Type, snap a photo, record audio, or enter OBD codes.",
  },
  {
    num: "2",
    title: "AI Analyzes",
    desc: "Gemini-powered diagnostics cross-reference symptoms, codes, and vehicle data.",
  },
  {
    num: "3",
    title: "Get Your Answer",
    desc: "Receive a clear diagnosis with severity, cost estimate, and recommended next steps.",
  },
];

const audiences = [
  {
    icon: Car,
    title: "Car Owners",
    points: [
      "Understand what's wrong before visiting a shop",
      "Avoid unnecessary repairs and upsells",
      "Keep a history of all your vehicle issues",
    ],
  },
  {
    icon: Wrench,
    title: "Mechanics & Shops",
    points: [
      "Quick second opinion on complex diagnostics",
      "Generate professional reports for customers",
      "Speed up intake with AI pre-diagnosis",
    ],
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-background">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-14">
          <Link href="/" className="text-lg font-bold tracking-tight">
            Auto<span className="text-primary">Diag</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/pricing">
              <Button variant="ghost" size="sm">
                Pricing
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/login">
              <Button size="sm">
                Get Started
                <ChevronRight className="size-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--primary)_0%,transparent_50%)] opacity-[0.08]" />
        <div className="max-w-4xl mx-auto px-6 pt-24 pb-20 text-center relative">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={0}
          >
            <Badge
              variant="secondary"
              className="mb-6 text-xs font-medium px-3 py-1"
            >
              <Shield className="size-3 mr-1.5" />
              Powered by Gemini 2.5
            </Badge>
          </motion.div>

          <motion.h1
            className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] mb-6"
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={1}
          >
            Your AI Mechanic,
            <br />
            <span className="text-primary">Always On Call</span>
          </motion.h1>

          <motion.p
            className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={2}
          >
            Snap a photo, record a sound, or type your symptoms. Get
            expert-level vehicle diagnostics in seconds — no appointment needed.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={3}
          >
            <Link href="/login">
              <Button size="lg" className="text-base px-6 h-11">
                Start Free Diagnosis
                <ChevronRight className="size-4" />
              </Button>
            </Link>
            <Link href="#how-it-works">
              <Button
                variant="outline"
                size="lg"
                className="text-base px-6 h-11"
              >
                See How It Works
              </Button>
            </Link>
          </motion.div>

          <motion.p
            className="text-sm text-muted-foreground mt-4"
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={4}
          >
            <Clock className="size-3.5 inline mr-1 -mt-0.5" />
            Free tier includes 3 diagnoses/month. No credit card required.
          </motion.p>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 border-t border-border/50">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            className="text-center mb-14"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            custom={0}
          >
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
              Multiple Ways to Diagnose
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              No matter how your car communicates a problem, AutoDiag
              understands it.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-60px" }}
                variants={fadeUp}
                custom={i}
              >
                <Card className="h-full border-border/60 bg-card hover:border-primary/30 transition-colors">
                  <CardContent className="p-6">
                    <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <f.icon className="size-5 text-primary" />
                    </div>
                    <h3 className="font-semibold text-base mb-1.5">
                      {f.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {f.desc}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section
        id="how-it-works"
        className="py-20 border-t border-border/50 bg-muted/30"
      >
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            className="text-center mb-14"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            custom={0}
          >
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
              How It Works
            </h2>
            <p className="text-muted-foreground text-lg">
              Three steps. No mechanic jargon.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <motion.div
                key={s.num}
                className="text-center"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-60px" }}
                variants={fadeUp}
                custom={i}
              >
                <div className="size-12 rounded-full bg-primary text-primary-foreground font-bold text-lg flex items-center justify-center mx-auto mb-4">
                  {s.num}
                </div>
                <h3 className="font-semibold text-lg mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {s.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Who It's For */}
      <section className="py-20 border-t border-border/50">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            className="text-center mb-14"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            custom={0}
          >
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
              Built for Everyone
            </h2>
            <p className="text-muted-foreground text-lg">
              Whether you own a car or fix them for a living.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {audiences.map((a, i) => (
              <motion.div
                key={a.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-60px" }}
                variants={fadeUp}
                custom={i}
              >
                <Card className="h-full border-border/60">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <a.icon className="size-5 text-primary" />
                      </div>
                      <h3 className="font-semibold text-lg">{a.title}</h3>
                    </div>
                    <ul className="space-y-2.5">
                      {a.points.map((p) => (
                        <li
                          key={p}
                          className="flex items-start gap-2.5 text-sm text-muted-foreground"
                        >
                          <Check className="size-4 text-primary mt-0.5 shrink-0" />
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-20 border-t border-border/50 bg-muted/30">
        <div className="max-w-3xl mx-auto px-6">
          <motion.div
            className="text-center mb-14"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            custom={0}
          >
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
              Simple Pricing
            </h2>
            <p className="text-muted-foreground text-lg">
              Start free. Upgrade when you need more.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={0}
            >
              <Card className="h-full border-border/60">
                <CardContent className="p-6 flex flex-col h-full">
                  <h3 className="font-semibold text-lg mb-1">Free</h3>
                  <div className="mb-4">
                    <span className="text-3xl font-bold">$0</span>
                  </div>
                  <ul className="space-y-2 mb-6 flex-1">
                    {[
                      "3 text diagnoses/month",
                      "1 vehicle",
                      "Basic AI analysis",
                    ].map((f) => (
                      <li
                        key={f}
                        className="flex items-start gap-2 text-sm text-muted-foreground"
                      >
                        <Check className="size-4 text-primary mt-0.5 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href="/login" className="mt-auto">
                    <Button variant="outline" className="w-full">
                      Get Started
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={1}
            >
              <Card className="h-full border-primary/50 ring-1 ring-primary/20">
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-lg">Plus</h3>
                    <Badge variant="secondary" className="text-xs">
                      Popular
                    </Badge>
                  </div>
                  <div className="mb-4">
                    <span className="text-3xl font-bold">$19.99</span>
                    <span className="text-sm text-muted-foreground">
                      /month
                    </span>
                  </div>
                  <ul className="space-y-2 mb-6 flex-1">
                    {[
                      "Unlimited diagnoses",
                      "Photo, audio, video & OBD",
                      "Diagnostic reports (PDF)",
                      "Unlimited vehicles",
                      "Full diagnosis history",
                    ].map((f) => (
                      <li
                        key={f}
                        className="flex items-start gap-2 text-sm text-muted-foreground"
                      >
                        <Check className="size-4 text-primary mt-0.5 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href="/pricing" className="mt-auto">
                    <Button className="w-full">Start Plus</Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 border-t border-border/50">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Stop Guessing. Start Diagnosing.
            </h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
              Join thousands of car owners and mechanics who trust AutoDiag for
              fast, accurate vehicle diagnostics.
            </p>
            <Link href="/login">
              <Button size="lg" className="text-base px-8 h-12">
                Try AutoDiag Free
                <ChevronRight className="size-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="font-medium text-foreground">
            Auto<span className="text-primary">Diag</span>
          </div>
          <div className="flex gap-6">
            <Link
              href="/pricing"
              className="hover:text-foreground transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="/login"
              className="hover:text-foreground transition-colors"
            >
              Sign In
            </Link>
          </div>
          <p>
            &copy; {new Date().getFullYear()} AutoDiag. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
