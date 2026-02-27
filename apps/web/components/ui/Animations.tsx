"use client";

import type { ReactNode } from "react";
import RevealOnScroll from "@/components/ui/RevealOnScroll";

export function FadeIn({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  direction?: "up" | "down" | "left" | "right";
}) {
  const delayIndex = Math.min(Math.round(delay * 10), 3);
  return (
    <RevealOnScroll delay={delayIndex} className={className}>
      {children}
    </RevealOnScroll>
  );
}

export function ScaleIn({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const delayIndex = Math.min(Math.round(delay * 10), 3);
  return (
    <RevealOnScroll delay={delayIndex} className={className}>
      {children}
    </RevealOnScroll>
  );
}

export function StaggerContainer({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
  delayChildren?: number;
  staggerChildren?: number;
}) {
  return <div className={className}>{children}</div>;
}
