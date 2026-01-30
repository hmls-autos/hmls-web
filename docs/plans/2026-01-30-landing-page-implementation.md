# Landing Page Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the HMLS landing page with a premium neutral luxury aesthetic, SSR-first architecture, and CSS-only animations.

**Architecture:** Replace Framer Motion animations with CSS transitions, convert all sections to React Server Components, use Tailwind for styling with new color tokens. Map component lazy-loaded with next/dynamic.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS 4, next/image, next/dynamic

---

## Phase 1: Design System Setup

### Task 1.1: Update Tailwind Config with New Colors

**Files:**
- Modify: `apps/web/tailwind.config.ts`

**Step 1: Read current Tailwind config**

Run: Review current color configuration to understand existing setup.

**Step 2: Add new color tokens**

Add to `theme.extend.colors`:

```typescript
colors: {
  // Neutral luxury palette
  cream: {
    50: '#FAF9F7',   // bg-primary
    100: '#F5F4F2',  // bg-surface (cards)
    200: '#E8E6E3',  // borders
  },
  charcoal: {
    DEFAULT: '#1A1A1A', // text-primary
    light: '#6B6560',   // text-secondary
    dark: '#2C2C2C',    // accent/buttons
  },
}
```

**Step 3: Verify Tailwind compiles**

Run: `cd apps/web && bun run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add apps/web/tailwind.config.ts
git commit -m "feat(web): add neutral luxury color palette to Tailwind"
```

---

### Task 1.2: Add Serif Font

**Files:**
- Modify: `apps/web/app/layout.tsx`
- Modify: `apps/web/tailwind.config.ts`

**Step 1: Add Playfair Display via next/font**

In `layout.tsx`, add:

```typescript
import { Playfair_Display } from "next/font/google";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});
```

Add to html className: `${playfair.variable}`

**Step 2: Add font family to Tailwind**

In `tailwind.config.ts`, add to `theme.extend`:

```typescript
fontFamily: {
  serif: ['var(--font-serif)', 'Georgia', 'serif'],
}
```

**Step 3: Verify fonts load**

Run: `cd apps/web && bun run dev`
Expected: No errors, fonts load in browser

**Step 4: Commit**

```bash
git add apps/web/app/layout.tsx apps/web/tailwind.config.ts
git commit -m "feat(web): add Playfair Display serif font"
```

---

### Task 1.3: Create CSS Animation Utilities

**Files:**
- Create: `apps/web/app/globals.css` (add to existing)

**Step 1: Add reveal animation classes**

Add to `globals.css`:

```css
/* Scroll reveal animations */
.reveal {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}

.reveal.visible {
  opacity: 1;
  transform: translateY(0);
}

/* Stagger delays */
.reveal-delay-1 { transition-delay: 0.1s; }
.reveal-delay-2 { transition-delay: 0.2s; }
.reveal-delay-3 { transition-delay: 0.3s; }

/* Hover lift effect for cards */
.card-hover {
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.card-hover:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px -8px rgba(0, 0, 0, 0.1);
}
```

**Step 2: Commit**

```bash
git add apps/web/app/globals.css
git commit -m "feat(web): add CSS reveal and card hover animations"
```

---

### Task 1.4: Create RevealOnScroll Client Component

**Files:**
- Create: `apps/web/components/ui/RevealOnScroll.tsx`

**Step 1: Create minimal client component**

```typescript
"use client";

import { useEffect, useRef, type ReactNode } from "react";

interface RevealOnScrollProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export default function RevealOnScroll({
  children,
  className = "",
  delay = 0,
}: RevealOnScrollProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          element.classList.add("visible");
          observer.unobserve(element);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const delayClass = delay > 0 ? `reveal-delay-${delay}` : "";

  return (
    <div ref={ref} className={`reveal ${delayClass} ${className}`}>
      {children}
    </div>
  );
}
```

**Step 2: Verify component compiles**

Run: `cd apps/web && bun run typecheck`
Expected: No type errors

**Step 3: Commit**

```bash
git add apps/web/components/ui/RevealOnScroll.tsx
git commit -m "feat(web): add RevealOnScroll client component with IntersectionObserver"
```

---

## Phase 2: Layout Components

### Task 2.1: Create New Navbar

**Files:**
- Create: `apps/web/components/NavbarNew.tsx`

**Step 1: Create server component navbar**

```typescript
import Link from "next/link";
import MobileNav from "./MobileNav";

export default function NavbarNew() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-cream-50/80 backdrop-blur-md border-b border-cream-200">
      <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-serif text-charcoal">
          HMLS
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          <Link
            href="#services"
            className="text-sm text-charcoal-light hover:text-charcoal transition-colors"
          >
            Services
          </Link>
          <Link
            href="#about"
            className="text-sm text-charcoal-light hover:text-charcoal transition-colors"
          >
            About
          </Link>
          <Link
            href="/contact"
            className="text-sm text-charcoal-light hover:text-charcoal transition-colors"
          >
            Contact
          </Link>
          <Link
            href="/chat"
            className="px-4 py-2 bg-charcoal-dark text-cream-50 text-sm rounded-lg hover:bg-charcoal transition-colors"
          >
            Get a Quote
          </Link>
        </div>

        {/* Mobile nav toggle */}
        <MobileNav />
      </nav>
    </header>
  );
}
```

**Step 2: Commit**

```bash
git add apps/web/components/NavbarNew.tsx
git commit -m "feat(web): add new minimal navbar component"
```

---

### Task 2.2: Create Mobile Nav Client Component

**Files:**
- Create: `apps/web/components/MobileNav.tsx`

**Step 1: Create mobile nav with toggle**

```typescript
"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export default function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-charcoal"
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {isOpen && (
        <div className="absolute top-16 left-0 right-0 bg-cream-50 border-b border-cream-200 p-6">
          <div className="flex flex-col gap-4">
            <Link
              href="#services"
              onClick={() => setIsOpen(false)}
              className="text-charcoal-light hover:text-charcoal"
            >
              Services
            </Link>
            <Link
              href="#about"
              onClick={() => setIsOpen(false)}
              className="text-charcoal-light hover:text-charcoal"
            >
              About
            </Link>
            <Link
              href="/contact"
              onClick={() => setIsOpen(false)}
              className="text-charcoal-light hover:text-charcoal"
            >
              Contact
            </Link>
            <Link
              href="/chat"
              onClick={() => setIsOpen(false)}
              className="px-4 py-3 bg-charcoal-dark text-cream-50 text-center rounded-lg"
            >
              Get a Quote
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add apps/web/components/MobileNav.tsx
git commit -m "feat(web): add mobile nav toggle component"
```

---

### Task 2.3: Create New Footer

**Files:**
- Create: `apps/web/components/FooterNew.tsx`

**Step 1: Create minimal footer**

```typescript
import Link from "next/link";

export default function FooterNew() {
  return (
    <footer className="w-full border-t border-cream-200 bg-cream-50">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div>
            <div className="text-lg font-serif text-charcoal mb-1">
              HMLS Mobile Mechanic
            </div>
            <div className="text-sm text-charcoal-light">
              Orange County, CA
            </div>
          </div>

          <div className="flex flex-wrap gap-6 text-sm text-charcoal-light">
            <Link href="#services" className="hover:text-charcoal transition-colors">
              Services
            </Link>
            <Link href="#about" className="hover:text-charcoal transition-colors">
              About
            </Link>
            <Link href="/contact" className="hover:text-charcoal transition-colors">
              Contact
            </Link>
            <Link href="/terms" className="hover:text-charcoal transition-colors">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-charcoal transition-colors">
              Privacy
            </Link>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-cream-200 text-sm text-charcoal-light">
          © {new Date().getFullYear()} HMLS. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
```

**Step 2: Commit**

```bash
git add apps/web/components/FooterNew.tsx
git commit -m "feat(web): add new minimal footer component"
```

---

## Phase 3: Hero Section

### Task 3.1: Create New Hero Component

**Files:**
- Create: `apps/web/components/sections/HeroNew.tsx`

**Step 1: Create server component hero**

```typescript
import Image from "next/image";
import Link from "next/link";

export default function HeroNew() {
  return (
    <section className="w-full pt-24 pb-16 bg-cream-50">
      <div className="max-w-7xl mx-auto px-6">
        {/* Content */}
        <div className="max-w-3xl mx-auto text-center mb-12">
          <p className="text-sm uppercase tracking-widest text-charcoal-light mb-6">
            Mobile Mechanic • Orange County
          </p>

          <h1 className="text-5xl md:text-7xl font-serif text-charcoal mb-6">
            We come to you.
          </h1>

          <p className="text-lg md:text-xl text-charcoal-light mb-10 max-w-xl mx-auto">
            Expert auto repair at your home or office. No towing. No waiting
            rooms. Just convenience.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/chat"
              className="px-8 py-4 bg-charcoal-dark text-cream-50 rounded-lg text-base font-medium hover:bg-charcoal transition-colors"
            >
              Get a Free Quote
            </Link>
            <Link
              href="/contact"
              className="px-8 py-4 border border-charcoal-dark text-charcoal-dark rounded-lg text-base font-medium hover:bg-charcoal-dark hover:text-cream-50 transition-colors"
            >
              Book a Service
            </Link>
          </div>
        </div>

        {/* Hero Image */}
        <div className="relative w-full aspect-[21/9] rounded-2xl overflow-hidden shadow-lg">
          <Image
            src="/images/hero-mechanic.jpg"
            alt="Mechanic working on car in driveway"
            fill
            priority
            className="object-cover"
            sizes="(max-width: 1280px) 100vw, 1280px"
          />
        </div>
      </div>
    </section>
  );
}
```

**Step 2: Commit**

```bash
git add apps/web/components/sections/HeroNew.tsx
git commit -m "feat(web): add new hero section with SSR"
```

---

## Phase 4: Content Sections

### Task 4.1: Create Trust Bar Component

**Files:**
- Create: `apps/web/components/sections/TrustBar.tsx`

**Step 1: Create trust bar**

```typescript
export default function TrustBar() {
  const stats = [
    { value: "20+", label: "Years Experience" },
    { value: "500+", label: "Repairs Completed" },
    { value: "100%", label: "Satisfaction Rate" },
  ];

  return (
    <section className="w-full py-8 border-y border-cream-200 bg-cream-100">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-wrap justify-center gap-8 md:gap-16">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl md:text-3xl font-serif text-charcoal">
                {stat.value}
              </div>
              <div className="text-sm text-charcoal-light uppercase tracking-wide">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

**Step 2: Commit**

```bash
git add apps/web/components/sections/TrustBar.tsx
git commit -m "feat(web): add trust bar stats section"
```

---

### Task 4.2: Create How It Works Section

**Files:**
- Create: `apps/web/components/sections/HowItWorks.tsx`

**Step 1: Create how it works section**

```typescript
import RevealOnScroll from "@/components/ui/RevealOnScroll";

export default function HowItWorks() {
  const steps = [
    {
      number: "01",
      title: "Book online",
      description: "Get a quote in minutes via our AI chat assistant.",
    },
    {
      number: "02",
      title: "We come to you",
      description: "Our mechanic arrives at your home or office.",
    },
    {
      number: "03",
      title: "Done",
      description: "Pay when you're satisfied with the work.",
    },
  ];

  return (
    <section className="w-full py-24 bg-cream-50">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-serif text-charcoal text-center mb-16">
          How it works
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {steps.map((step, index) => (
            <RevealOnScroll key={step.number} delay={index + 1}>
              <div className="text-center">
                <div className="text-5xl font-serif text-cream-200 mb-4">
                  {step.number}
                </div>
                <h3 className="text-xl font-medium text-charcoal mb-2">
                  {step.title}
                </h3>
                <p className="text-charcoal-light">
                  {step.description}
                </p>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
```

**Step 2: Commit**

```bash
git add apps/web/components/sections/HowItWorks.tsx
git commit -m "feat(web): add how it works section"
```

---

### Task 4.3: Create Service Card Component

**Files:**
- Create: `apps/web/components/ui/ServiceCard.tsx`

**Step 1: Create reusable service card**

```typescript
import Link from "next/link";

interface ServiceCardProps {
  title: string;
  description: string;
  price: string;
  href?: string;
}

export default function ServiceCard({
  title,
  description,
  price,
  href = "/chat",
}: ServiceCardProps) {
  return (
    <Link
      href={href}
      className="block p-8 bg-cream-100 border border-cream-200 rounded-xl card-hover hover:border-charcoal-light"
    >
      <h3 className="text-lg font-medium text-charcoal mb-2">{title}</h3>
      <p className="text-sm text-charcoal-light mb-4">{description}</p>
      <p className="text-sm font-medium text-charcoal">From {price}</p>
    </Link>
  );
}
```

**Step 2: Commit**

```bash
git add apps/web/components/ui/ServiceCard.tsx
git commit -m "feat(web): add reusable service card component"
```

---

### Task 4.4: Create Services Section

**Files:**
- Create: `apps/web/components/sections/ServicesNew.tsx`

**Step 1: Create services section**

```typescript
import Link from "next/link";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import ServiceCard from "@/components/ui/ServiceCard";

const services = [
  {
    title: "Oil Change",
    description: "Full synthetic oil change with filter and fluid top-off.",
    price: "$89",
  },
  {
    title: "Brake Service",
    description: "Pads, rotors, fluid inspection and repair.",
    price: "$149",
  },
  {
    title: "Battery & Electrical",
    description: "Testing, replacement, and system diagnosis.",
    price: "$49",
  },
  {
    title: "Engine Diagnostics",
    description: "Check engine light, computer scanning, and troubleshooting.",
    price: "$79",
  },
  {
    title: "A/C Service",
    description: "Comprehensive air conditioning inspection and recharge.",
    price: "$129",
  },
  {
    title: "Suspension",
    description: "Diagnose and repair for a smooth, noise-free ride.",
    price: "$99",
  },
];

export default function ServicesNew() {
  return (
    <section id="services" className="w-full py-24 bg-cream-50">
      <div className="max-w-7xl mx-auto px-6">
        <RevealOnScroll>
          <h2 className="text-3xl md:text-4xl font-serif text-charcoal text-center mb-4">
            What we can help with
          </h2>
          <p className="text-charcoal-light text-center max-w-xl mx-auto mb-16">
            From routine maintenance to complex repairs, we handle it all at
            your location.
          </p>
        </RevealOnScroll>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <RevealOnScroll key={service.title} delay={(index % 3) + 1}>
              <ServiceCard {...service} />
            </RevealOnScroll>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link
            href="/chat"
            className="inline-block px-6 py-3 border border-charcoal-dark text-charcoal-dark rounded-lg hover:bg-charcoal-dark hover:text-cream-50 transition-colors"
          >
            View all services
          </Link>
        </div>
      </div>
    </section>
  );
}
```

**Step 2: Commit**

```bash
git add apps/web/components/sections/ServicesNew.tsx
git commit -m "feat(web): add services section with cards"
```

---

### Task 4.5: Create About Section

**Files:**
- Create: `apps/web/components/sections/AboutNew.tsx`

**Step 1: Create about section**

```typescript
import Image from "next/image";
import RevealOnScroll from "@/components/ui/RevealOnScroll";

export default function AboutNew() {
  return (
    <section id="about" className="w-full py-24 bg-cream-100">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <RevealOnScroll>
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden">
              <Image
                src="/images/founder.jpg"
                alt="HMLS Founder"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </RevealOnScroll>

          <RevealOnScroll delay={1}>
            <div>
              <h2 className="text-3xl md:text-4xl font-serif text-charcoal mb-6">
                20+ years of experience
              </h2>
              <p className="text-charcoal-light mb-6 leading-relaxed">
                I started HMLS to give Orange County a better alternative to
                traditional auto shops. With over two decades of hands-on
                experience, including time at Fortune 100 dealerships, I bring
                expert-level care right to your doorstep.
              </p>
              <p className="text-charcoal-light leading-relaxed">
                Personal service, fair prices, no dealership overhead. That's
                the HMLS difference.
              </p>
              <p className="mt-6 text-charcoal font-medium">
                — Owner, HMLS Mobile Mechanic
              </p>
            </div>
          </RevealOnScroll>
        </div>
      </div>
    </section>
  );
}
```

**Step 2: Commit**

```bash
git add apps/web/components/sections/AboutNew.tsx
git commit -m "feat(web): add about section"
```

---

### Task 4.6: Create Service Area Section

**Files:**
- Create: `apps/web/components/sections/ServiceAreaNew.tsx`

**Step 1: Create service area with lazy-loaded map**

```typescript
import dynamic from "next/dynamic";
import { Suspense } from "react";
import RevealOnScroll from "@/components/ui/RevealOnScroll";

const Map = dynamic(() => import("@/components/ui/RealMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-cream-200 animate-pulse rounded-xl" />
  ),
});

const cities = [
  "Irvine",
  "Newport Beach",
  "Anaheim",
  "Santa Ana",
  "Costa Mesa",
  "Fullerton",
  "Huntington Beach",
];

export default function ServiceAreaNew() {
  return (
    <section className="w-full py-24 bg-cream-50">
      <div className="max-w-7xl mx-auto px-6">
        <RevealOnScroll>
          <h2 className="text-3xl md:text-4xl font-serif text-charcoal text-center mb-12">
            Serving Orange County
          </h2>
        </RevealOnScroll>

        <RevealOnScroll delay={1}>
          <div className="w-full h-[400px] rounded-xl overflow-hidden border border-cream-200 mb-8">
            <Suspense
              fallback={
                <div className="w-full h-full bg-cream-200 animate-pulse" />
              }
            >
              <Map className="w-full h-full" />
            </Suspense>
          </div>
        </RevealOnScroll>

        <RevealOnScroll delay={2}>
          <div className="flex flex-wrap justify-center gap-3">
            {cities.map((city) => (
              <span
                key={city}
                className="px-4 py-2 bg-cream-100 border border-cream-200 rounded-full text-sm text-charcoal-light"
              >
                {city}
              </span>
            ))}
            <span className="px-4 py-2 text-sm text-charcoal-light">
              and surrounding areas
            </span>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
```

**Step 2: Commit**

```bash
git add apps/web/components/sections/ServiceAreaNew.tsx
git commit -m "feat(web): add service area section with lazy-loaded map"
```

---

### Task 4.7: Create CTA Section

**Files:**
- Create: `apps/web/components/sections/CTANew.tsx`

**Step 1: Create simple CTA**

```typescript
import Link from "next/link";
import RevealOnScroll from "@/components/ui/RevealOnScroll";

export default function CTANew() {
  return (
    <section className="w-full py-24 bg-cream-100">
      <div className="max-w-2xl mx-auto px-6 text-center">
        <RevealOnScroll>
          <h2 className="text-3xl md:text-4xl font-serif text-charcoal mb-6">
            Ready to get started?
          </h2>
          <p className="text-charcoal-light mb-10">
            Get a free quote in minutes. No obligation, no hassle.
          </p>
          <Link
            href="/chat"
            className="inline-block px-10 py-4 bg-charcoal-dark text-cream-50 rounded-lg text-base font-medium hover:bg-charcoal transition-colors"
          >
            Get a Free Quote
          </Link>
        </RevealOnScroll>
      </div>
    </section>
  );
}
```

**Step 2: Commit**

```bash
git add apps/web/components/sections/CTANew.tsx
git commit -m "feat(web): add CTA section"
```

---

## Phase 5: Assemble New Page

### Task 5.1: Create New Landing Page

**Files:**
- Modify: `apps/web/app/page.tsx`

**Step 1: Replace page content**

```typescript
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
```

**Step 2: Verify page renders**

Run: `cd apps/web && bun run dev`
Expected: Page loads without errors, new design visible

**Step 3: Commit**

```bash
git add apps/web/app/page.tsx
git commit -m "feat(web): assemble new landing page with all sections"
```

---

## Phase 6: Cleanup

### Task 6.1: Remove Old Components

**Files:**
- Delete: `apps/web/components/ui/Animations.tsx`
- Delete: `apps/web/components/sections/HomeHero.tsx`
- Delete: `apps/web/components/Background.tsx` (if exists)

**Step 1: Remove old animation component**

```bash
rm apps/web/components/ui/Animations.tsx
rm apps/web/components/sections/HomeHero.tsx
```

**Step 2: Verify build still works**

Run: `cd apps/web && bun run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add -u
git commit -m "chore(web): remove old Framer Motion animation components"
```

---

### Task 6.2: Remove Framer Motion Dependency

**Files:**
- Modify: `apps/web/package.json`

**Step 1: Check if framer-motion is used elsewhere**

Run: `grep -r "framer-motion" apps/web --include="*.tsx" --include="*.ts"`

If no other usages found, proceed to remove.

**Step 2: Remove dependency**

```bash
cd apps/web && bun remove framer-motion
```

**Step 3: Verify build**

Run: `bun run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add apps/web/package.json apps/web/bun.lockb
git commit -m "chore(web): remove framer-motion dependency"
```

---

### Task 6.3: Add Placeholder Images

**Files:**
- Add: `apps/web/public/images/hero-mechanic.jpg`
- Add: `apps/web/public/images/founder.jpg`

**Step 1: Create placeholder images or use existing**

Check if suitable images exist in `public/images/`. If not, create placeholders or note that real images are needed.

**Step 2: Commit if new images added**

```bash
git add apps/web/public/images/
git commit -m "chore(web): add placeholder images for redesign"
```

---

## Phase 7: Verification

### Task 7.1: Final Build and Type Check

**Step 1: Run typecheck**

Run: `cd apps/web && bun run typecheck`
Expected: No type errors

**Step 2: Run build**

Run: `bun run build`
Expected: Build succeeds

**Step 3: Run lint**

Run: `turbo lint`
Expected: No lint errors (or fix any that appear)

---

### Task 7.2: Visual QA Checklist

**Step 1: Start dev server**

Run: `turbo dev`

**Step 2: Check pages manually**

- [ ] Navbar fixed, links work
- [ ] Hero renders with image, CTAs link correctly
- [ ] Trust bar displays stats
- [ ] How it works shows 3 steps
- [ ] Services grid displays 6 cards with prices
- [ ] About section shows image and text
- [ ] Map loads (may need API key)
- [ ] CTA button links to /chat
- [ ] Footer links work
- [ ] Mobile nav toggle works
- [ ] Scroll reveal animations trigger
- [ ] Hover states work on cards

**Step 3: Commit final state**

```bash
git add .
git commit -m "feat(web): complete landing page redesign"
```

---

## Summary

| Phase | Tasks | Components |
|-------|-------|------------|
| 1 | 4 | Design system (colors, fonts, CSS animations) |
| 2 | 3 | Layout (Navbar, MobileNav, Footer) |
| 3 | 1 | Hero section |
| 4 | 7 | Content sections (TrustBar, HowItWorks, Services, About, ServiceArea, CTA) |
| 5 | 1 | Assemble page |
| 6 | 3 | Cleanup (remove old components, framer-motion) |
| 7 | 2 | Verification |

**Total: 21 tasks**
