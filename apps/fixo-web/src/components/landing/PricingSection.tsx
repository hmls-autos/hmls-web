"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PricingSection() {
  return (
    <section className="py-20 bg-muted/30 border-y border-border/40">
      <div className="max-w-3xl mx-auto px-6">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <p className="text-sm font-mono text-primary mb-2 tracking-wide">PRICING</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">
            One shop visit or a year of Plus.
          </h2>
          <p className="text-muted-foreground">You pick.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
          <motion.div
            className="rounded-xl border border-border/60 bg-card p-7"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h3 className="font-semibold mb-1">Free</h3>
            <div className="mb-5">
              <span className="text-4xl font-bold">$0</span>
            </div>
            <ul className="space-y-2 mb-7">
              {["3 text diagnoses/month", "1 vehicle", "Basic AI analysis"].map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Check className="size-3.5 text-primary mt-0.5 shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Link href="/login">
              <Button variant="outline" className="w-full">
                Get Started
              </Button>
            </Link>
          </motion.div>

          <motion.div
            className="rounded-xl border-2 border-primary/30 bg-card p-7 relative"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.08 }}
          >
            <span className="absolute -top-2.5 left-5 text-[11px] font-mono bg-primary text-primary-foreground px-2 py-0.5 rounded">
              RECOMMENDED
            </span>
            <h3 className="font-semibold mb-1">Plus</h3>
            <div className="mb-5">
              <span className="text-4xl font-bold">$19.99</span>
              <span className="text-sm text-muted-foreground">/mo</span>
            </div>
            <ul className="space-y-2 mb-7">
              {[
                "Unlimited diagnoses",
                "Photo, audio & OBD-II",
                "PDF reports",
                "Unlimited vehicles",
                "Full history",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Check className="size-3.5 text-primary mt-0.5 shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Link href="/pricing">
              <Button className="w-full">Start Plus</Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
