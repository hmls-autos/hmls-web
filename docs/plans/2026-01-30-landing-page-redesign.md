# Landing Page Redesign

A complete redesign of the HMLS landing page with a premium, neutral luxury aesthetic and SSR-first
architecture.

## Design Direction

**Style:** Premium & Clean, Neutral Luxury

- Soft beige/tan tones, dark text, minimal color
- Photography-focused, warm natural lighting
- Editorial typography with serif headlines
- Generous whitespace, refined details

**Primary Focus:**

1. Convenience - "We come to you" as the hero message
2. Services - Clear offerings with transparent pricing

## Design System

### Color Palette

| Token              | Value     | Usage              |
| ------------------ | --------- | ------------------ |
| `--bg-primary`     | `#FAF9F7` | Page background    |
| `--bg-surface`     | `#F5F4F2` | Cards, sections    |
| `--text-primary`   | `#1A1A1A` | Headlines, body    |
| `--text-secondary` | `#6B6560` | Descriptions, meta |
| `--border`         | `#E8E6E3` | Subtle borders     |
| `--accent`         | `#2C2C2C` | Buttons, links     |

### Typography

| Element  | Font                                | Size           | Weight |
| -------- | ----------------------------------- | -------------- | ------ |
| Display  | Serif (Playfair Display / Fraunces) | 72px+          | 400    |
| Headline | Serif                               | 48px           | 400    |
| Subhead  | Sans-serif (Inter / system)         | 24px           | 500    |
| Body     | Sans-serif                          | 16-18px        | 400    |
| Small    | Sans-serif                          | 14px           | 400    |
| Eyebrow  | Sans-serif                          | 14px uppercase | 500    |

### Photography

- Warm, natural lighting
- Close-ups of hands working on cars
- Clean driveway/workshop settings
- Desaturated, slightly warm color grade
- Rounded corners (16px), subtle shadows

### Animations

CSS-only, no Framer Motion:

```css
.reveal {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}
.reveal.visible {
  opacity: 1;
  transform: translateY(0);
}
```

Single `useEffect` with IntersectionObserver for scroll reveals.

## Technical Architecture

### SSR-First Approach

Following Vercel React Best Practices:

| Principle                 | Implementation                                  |
| ------------------------- | ----------------------------------------------- |
| Server Components default | All sections are RSC, no `"use client"`         |
| Minimal client JS         | Only mobile nav toggle, map component           |
| CSS animations            | No Framer Motion, use CSS transitions           |
| Dynamic imports           | Lazy load map with `next/dynamic`               |
| Parallel fetching         | Fetch stats, services, testimonials in parallel |
| Suspense boundaries       | Wrap dynamic sections for streaming             |

### Key Rules Applied

- `bundle-dynamic-imports` - Lazy load map component
- `bundle-defer-third-party` - Load analytics after hydration
- `server-parallel-fetching` - Parallel data fetching
- `async-suspense-boundaries` - Stream content progressively
- `architecture-compound-components` - Composable card components
- `rendering-content-visibility` - Below-fold optimization

### Component Structure

```
app/
├── page.tsx                    # Server Component (main page)
├── components/
│   ├── Navbar.tsx              # Server Component
│   ├── Footer.tsx              # Server Component
│   ├── sections/
│   │   ├── Hero.tsx            # Server Component
│   │   ├── TrustBar.tsx        # Server Component
│   │   ├── HowItWorks.tsx      # Server Component
│   │   ├── Services.tsx        # Server Component (fetches from DB)
│   │   ├── About.tsx           # Server Component
│   │   ├── ServiceArea.tsx     # Server Component + Suspense
│   │   └── CTA.tsx             # Server Component
│   ├── ui/
│   │   ├── Button.tsx          # Server Component
│   │   ├── ServiceCard.tsx     # Server Component
│   │   └── RevealOnScroll.tsx  # Client Component (minimal)
│   └── Map.tsx                 # Client Component (lazy loaded)
```

## Page Structure

### 1. Navbar

```
┌────────────────────────────────────────────────────────────────┐
│  HMLS                              Services  About  Contact    │
└────────────────────────────────────────────────────────────────┘
```

- Logo left, nav links right
- Sticky on scroll (CSS `position: sticky`)
- Mobile: hamburger menu (only client component in nav)

### 2. Hero Section

```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│           Mobile Mechanic  •  Orange County                    │
│                                                                │
│                    We come to you.                             │
│                                                                │
│       Expert auto repair at your home or office.               │
│       No towing. No waiting rooms. Just convenience.           │
│                                                                │
│         ┌─────────────────┐   ┌─────────────────┐             │
│         │ Get a Free Quote│   │ Book a Service  │             │
│         │   (→ /chat)     │   │  (→ /contact)   │             │
│         └─────────────────┘   └─────────────────┘             │
│                                                                │
│   ┌────────────────────────────────────────────────────────┐  │
│   │         [Full-width hero image: mechanic               │  │
│   │          working on car in sunny driveway]             │  │
│   └────────────────────────────────────────────────────────┘  │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

**CTAs:**

- **Get a Free Quote** → `/chat` (primary, dark filled) - Opens AI agent
- **Book a Service** → `/contact` (secondary, outlined) - Scheduling

### 3. Trust Bar

```
┌────────────────────────────────────────────────────────────────┐
│   20+ Years Experience  •  500+ Repairs  •  Orange County      │
└────────────────────────────────────────────────────────────────┘
```

- Horizontal strip, subtle background
- Stats fetched from database (SSR)
- Clean typography, no icons

### 4. How It Works

```
┌────────────────────────────────────────────────────────────────┐
│                      How it works                              │
│                                                                │
│   ┌──────────────┐     ┌──────────────┐     ┌──────────────┐  │
│   │      01      │     │      02      │     │      03      │  │
│   │    Book      │ ──▸ │   We come    │ ──▸ │    Done      │  │
│   │   online     │     │    to you    │     │              │  │
│   │              │     │              │     │              │  │
│   │  Get a quote │     │  Our mechanic│     │  Pay when    │  │
│   │  in minutes  │     │  arrives at  │     │  you're      │  │
│   │  via chat    │     │  your location│    │  satisfied   │  │
│   └──────────────┘     └──────────────┘     └──────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

- 3-column grid, responsive to stacked on mobile
- Large serif numbers in light gray
- Typography-driven, no icons

### 5. Services Section

```
┌────────────────────────────────────────────────────────────────┐
│              What we can help with                             │
│                                                                │
│   ┌────────────────────────┐   ┌────────────────────────┐     │
│   │   Oil Change           │   │   Brake Service        │     │
│   │   Full synthetic oil   │   │   Pads, rotors, fluid  │     │
│   │   change with filter   │   │   inspection & repair  │     │
│   │   From $89             │   │   From $149            │     │
│   └────────────────────────┘   └────────────────────────┘     │
│                                                                │
│   ┌────────────────────────┐   ┌────────────────────────┐     │
│   │   Battery & Electrical │   │   Engine Diagnostics   │     │
│   │   From $49             │   │   From $79             │     │
│   └────────────────────────┘   └────────────────────────┘     │
│                                                                │
│   ┌────────────────────────┐   ┌────────────────────────┐     │
│   │   A/C Service          │   │   Suspension           │     │
│   │   From $129            │   │   From $99             │     │
│   └────────────────────────┘   └────────────────────────┘     │
│                                                                │
│                  ┌─────────────────────┐                      │
│                  │  View all services  │                      │
│                  └─────────────────────┘                      │
└────────────────────────────────────────────────────────────────┘
```

**Card design:**

- Beige background (`#F5F4F2`)
- Subtle border (`#E8E6E3`)
- 32px padding
- Hover: lift + shadow + border darkens
- No icons, text-only

**Pricing:**

- "From $XX" format
- Fetched from database (SSR)

### 6. About Section

```
┌────────────────────────────────────────────────────────────────┐
│   ┌────────────────────┐                                      │
│   │                    │    20+ years of experience           │
│   │    [Photo of       │                                      │
│   │     founder]       │    I started HMLS to give Orange     │
│   │                    │    County a better alternative to    │
│   │                    │    traditional auto shops. Personal  │
│   └────────────────────┘    service, fair prices, at your     │
│                             doorstep.                         │
│                                                                │
│                             — Owner, HMLS Mobile Mechanic     │
└────────────────────────────────────────────────────────────────┘
```

- Two-column: image left, text right
- Brief quote-style copy (3-4 sentences)
- Warm, authentic photography

### 7. Service Area

```
┌────────────────────────────────────────────────────────────────┐
│   Serving Orange County                                        │
│                                                                │
│   ┌─────────────────────────────────────────────────────────┐ │
│   │                    [Map - lazy loaded]                  │ │
│   └─────────────────────────────────────────────────────────┘ │
│                                                                │
│   Irvine • Newport Beach • Anaheim • Santa Ana • Costa Mesa   │
│   Fullerton • Huntington Beach • and surrounding areas        │
└────────────────────────────────────────────────────────────────┘
```

- Map lazy loaded with `next/dynamic`
- Suspense fallback: skeleton/placeholder
- Muted map style matching palette

### 8. CTA Section

```
┌────────────────────────────────────────────────────────────────┐
│                    Ready to get started?                       │
│                                                                │
│                 ┌─────────────────────┐                       │
│                 │   Get a Free Quote  │                       │
│                 └─────────────────────┘                       │
└────────────────────────────────────────────────────────────────┘
```

- Simple, centered
- No decorative backgrounds
- Single button → `/chat`

### 9. Footer

```
┌────────────────────────────────────────────────────────────────┐
│   HMLS Mobile Mechanic          Services   About   Contact    │
│   Orange County, CA             Terms   Privacy               │
│                                                                │
│   © 2026 HMLS. All rights reserved.                           │
└────────────────────────────────────────────────────────────────┘
```

- Minimal, single row desktop
- Stacked on mobile

## Migration Notes

### Files to Remove/Replace

- `components/ui/Animations.tsx` - Remove Framer Motion animations
- `components/sections/HomeHero.tsx` - Replace with SSR Hero
- `components/Background.tsx` - Remove decorative background

### Dependencies to Remove

- `framer-motion` - Replace with CSS animations

### Dependencies to Add

- Consider `@fontsource/playfair-display` or use Google Fonts

### CSS Changes

- New color tokens in Tailwind config
- Add serif font family
- Add reveal animation classes

## Responsive Breakpoints

| Breakpoint          | Layout Changes                             |
| ------------------- | ------------------------------------------ |
| Mobile (<640px)     | Single column, stacked CTAs, hamburger nav |
| Tablet (640-1024px) | 2-column services, side-by-side about      |
| Desktop (>1024px)   | Full layout as designed                    |

## Performance Targets

| Metric | Target  |
| ------ | ------- |
| LCP    | < 2.5s  |
| FID    | < 100ms |
| CLS    | < 0.1   |
| TTI    | < 3.5s  |

Achieved through:

- SSR-first architecture
- Minimal client JavaScript
- Optimized images with `next/image`
- Lazy loaded map component
- CSS-only animations
