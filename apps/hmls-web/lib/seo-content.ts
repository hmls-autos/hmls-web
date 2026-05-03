/**
 * Programmatic SEO content for /areas/[city] and /services/[service].
 *
 * Each entry has unique 2-3 sentence prose so Google doesn't class the
 * pages as duplicate / doorway content. When you onboard a new city or
 * service, add an entry here — the dynamic route picks it up.
 *
 * Data shape is deliberately simple: slug + display name + 1-2 lines of
 * differentiated copy. Templated layout fills in the rest from BUSINESS.
 */

export type CitySlug =
  | "irvine"
  | "newport-beach"
  | "costa-mesa"
  | "santa-ana"
  | "tustin"
  | "anaheim"
  | "orange"
  | "huntington-beach"
  | "fountain-valley"
  | "lake-forest"
  | "mission-viejo"
  | "aliso-viejo"
  | "laguna-hills"
  | "laguna-niguel";

export interface CityContent {
  slug: CitySlug;
  name: string;
  driveMinutes: number;
  neighborhoods: string[];
  intro: string;
  callout: string;
}

export const CITIES: readonly CityContent[] = [
  {
    slug: "irvine",
    name: "Irvine",
    driveMinutes: 0,
    neighborhoods: [
      "Woodbridge",
      "Quail Hill",
      "Northwood",
      "Turtle Rock",
      "UCI",
    ],
    intro:
      "We’re based in Irvine, so service here usually means same-day availability — most jobs land in your driveway within an hour or two of booking. Apartment-complex parking lots and gated communities are no problem; we work in the spot you’re already parked.",
    callout:
      "Most popular: oil changes for tech-worker commuters and brake jobs on family SUVs.",
  },
  {
    slug: "newport-beach",
    name: "Newport Beach",
    driveMinutes: 12,
    neighborhoods: [
      "Balboa Peninsula",
      "Corona del Mar",
      "Newport Coast",
      "Fashion Island",
    ],
    intro:
      "Newport drivers tend to keep their cars longer and care about doing it right. We handle European luxury vehicles (BMW, Mercedes, Audi, Porsche) at independent-shop labor rates — no dealership markup, no waiting room.",
    callout:
      "Diagnostics + pre-purchase inspections are our most-requested Newport services.",
  },
  {
    slug: "costa-mesa",
    name: "Costa Mesa",
    driveMinutes: 10,
    neighborhoods: [
      "Mesa Verde",
      "Eastside",
      "South Coast Metro",
      "OC Fairgrounds",
    ],
    intro:
      "Costa Mesa’s mix of older homes with limited driveway space and the South Coast Metro condo lots is exactly where mobile service shines. We bring the lift to you — no need to find an open shop bay before work.",
    callout:
      "Common ask: brake repair and battery replacement before South Coast commute.",
  },
  {
    slug: "santa-ana",
    name: "Santa Ana",
    driveMinutes: 15,
    neighborhoods: [
      "Downtown Santa Ana",
      "Floral Park",
      "South Coast",
      "Civic Center",
    ],
    intro:
      "Santa Ana customers often just need a fast, honest estimate before paying a chain shop’s upsell. We’ll come, diagnose, quote at OLP labor pricing, and you decide — no obligation.",
    callout:
      "Free pre-purchase inspections are popular before private-party Santa Ana car deals.",
  },
  {
    slug: "tustin",
    name: "Tustin",
    driveMinutes: 8,
    neighborhoods: [
      "Old Town Tustin",
      "Tustin Ranch",
      "Tustin Legacy",
      "Columbus Square",
    ],
    intro:
      "Tustin is a 10-minute hop from our Irvine base, so booking windows here are tight — same-day morning slots are usually open. We do the full mobile-mechanic stack: oil, brakes, batteries, diagnostics, and OBD-II code work.",
    callout:
      "Ranch and Legacy residents lean into preventive maintenance — that’s our strong suit.",
  },
  {
    slug: "anaheim",
    name: "Anaheim",
    driveMinutes: 22,
    neighborhoods: [
      "Anaheim Hills",
      "Platinum Triangle",
      "Downtown Anaheim",
      "Disneyland Resort",
    ],
    intro:
      "Anaheim families lean on minivans and SUVs that rack up miles fast. We bring brake pads, fluids, and batteries to your home — most jobs done in the time it takes to grab a coffee.",
    callout:
      "Anaheim Hills serpentine roads chew through brake pads — we keep OE-grade pads on the truck.",
  },
  {
    slug: "orange",
    name: "Orange",
    driveMinutes: 18,
    neighborhoods: [
      "Old Towne Orange",
      "Orange Park Acres",
      "El Modena",
      "Chapman University",
    ],
    intro:
      "Old Towne’s narrow streets and historic neighborhoods don’t play nicely with tow trucks or big-box service centers. We park curbside, work clean, and leave no trace — perfect for HOA-conscious blocks.",
    callout:
      "Chapman students: pre-purchase inspections before you sign that off-campus car deal.",
  },
  {
    slug: "huntington-beach",
    name: "Huntington Beach",
    driveMinutes: 18,
    neighborhoods: [
      "Huntington Harbor",
      "Downtown HB",
      "Edinger Corridor",
      "Bella Terra",
    ],
    intro:
      "Salt air and beach driving accelerate corrosion on undercarriage components — brake calipers and rotors especially. We see Huntington Beach cars more often for brake work than any other reason.",
    callout:
      "Heads up: any brake squeal near the coast deserves an inspection before it becomes a rotor job.",
  },
  {
    slug: "fountain-valley",
    name: "Fountain Valley",
    driveMinutes: 15,
    neighborhoods: [
      "Mile Square",
      "Fountain Valley Civic Center",
      "South Mile Square",
    ],
    intro:
      "Fountain Valley is one of those quiet residential pockets that big chain shops underserve. Mobile service fills the gap — we cover oil changes, brake jobs, and diagnostics across both halves of the city.",
    callout:
      "Most asked: 60K / 90K mile maintenance services to dodge the dealership markup.",
  },
  {
    slug: "lake-forest",
    name: "Lake Forest",
    driveMinutes: 14,
    neighborhoods: [
      "Foothill Ranch",
      "Portola Hills",
      "El Toro",
      "Lake Forest II",
    ],
    intro:
      "Foothill Ranch and Portola Hills sit at altitude, which means harder starts in winter and more battery turnover. We carry AGM and standard batteries on the truck for same-visit replacement.",
    callout:
      "Cold-morning no-start? We do battery + alternator load testing at your driveway.",
  },
  {
    slug: "mission-viejo",
    name: "Mission Viejo",
    driveMinutes: 20,
    neighborhoods: [
      "Lake Mission Viejo",
      "Aurora Heights",
      "Madrid Fore",
      "Casta del Sol",
    ],
    intro:
      "Mission Viejo’s rolling-hills topography is rough on suspension and brakes — we see a lot of front-pad replacements and shock complaints. We’ll quote OE-grade parts only; no aftermarket roulette.",
    callout:
      "Common request: full brake job (pads + rotors) on Suburbans and Tahoes.",
  },
  {
    slug: "aliso-viejo",
    name: "Aliso Viejo",
    driveMinutes: 22,
    neighborhoods: ["Aliso Town Center", "Aliso Niguel", "Glenwood", "Liberty"],
    intro:
      "Aliso Viejo’s 91-degree summer commute melts cooling systems — radiator hoses, coolant, and AC compressors top our service log here. We bring refrigerant, hose stock, and OBD-II tools.",
    callout:
      "Summer heat soaks: AC diagnostics is the fastest-growing Aliso service line.",
  },
  {
    slug: "laguna-hills",
    name: "Laguna Hills",
    driveMinutes: 21,
    neighborhoods: [
      "Nellie Gail Ranch",
      "Laguna Hills Mall area",
      "Moulton Pkwy corridor",
    ],
    intro:
      "Laguna Hills sits between coastal salt air and inland heat, so we tune service recommendations to whichever exposure your car gets. Battery and brake work are the two most common asks.",
    callout:
      "Nellie Gail equestrian residents: we work fine on dirt driveways and graveled spaces.",
  },
  {
    slug: "laguna-niguel",
    name: "Laguna Niguel",
    driveMinutes: 24,
    neighborhoods: [
      "Crown Valley Pkwy",
      "Niguel Ranch",
      "Marina Hills",
      "Talavera",
    ],
    intro:
      "Laguna Niguel is the south end of our coverage — booking 24 hours ahead guarantees a slot. The 5-South commuter wear shows up in brakes, tires, and CV joints.",
    callout:
      "Frequent flyer: front-brake replacement on hybrid sedans (Prius, Camry hybrid, Insight).",
  },
] as const;

export function findCity(slug: string): CityContent | undefined {
  return CITIES.find((c) => c.slug === slug);
}

export type ServiceSlug =
  | "oil-change"
  | "brake-repair"
  | "battery-replacement"
  | "diagnostics"
  | "pre-purchase-inspection";

export interface ServiceContent {
  slug: ServiceSlug;
  name: string;
  shortName: string;
  intro: string;
  whatWeDo: string[];
  signsYouNeedIt: string[];
  typicalDuration: string;
  estimatedRange: string;
}

export const SERVICES: readonly ServiceContent[] = [
  {
    slug: "oil-change",
    name: "Mobile Oil Change",
    shortName: "Oil Change",
    intro:
      "Synthetic, blend, or conventional — we bring the oil and filter to your driveway and recycle the old fluid responsibly. Most oil changes take 25–40 minutes, and we never push a service interval you don’t need.",
    whatWeDo: [
      "Drain old oil into a sealed catch container (zero driveway mess)",
      "Replace OEM-spec filter (we stock Mahle, Mann, Wix)",
      "Refill with manufacturer-spec oil (5W-20, 5W-30, 0W-20, etc.)",
      "Reset the maintenance reminder light",
      "Check tire pressure and top off washer fluid",
    ],
    signsYouNeedIt: [
      "Maintenance light is on",
      "Oil life monitor reads under 15%",
      "It’s been more than 5,000 miles since the last change",
      "Oil on the dipstick looks dark and gritty",
    ],
    typicalDuration: "25–40 minutes",
    estimatedRange: "$60–$120 depending on oil type and capacity",
  },
  {
    slug: "brake-repair",
    name: "Mobile Brake Repair",
    shortName: "Brake Repair",
    intro:
      "Pads, rotors, calipers, fluid — we handle the full brake stack mobile. We use OE-grade pads (Akebono, Bosch, Wagner) and resurface or replace rotors based on measured wear, not eyeballing.",
    whatWeDo: [
      "Inspect pads, rotors, calipers, hoses, and brake fluid condition",
      "Measure rotor thickness with a micrometer (no guessing)",
      "Replace pads + resurface or swap rotors as needed",
      "Bleed brake fluid if old or contaminated",
      "Test-drive to verify pedal feel and braking distance",
    ],
    signsYouNeedIt: [
      "Squealing or grinding when braking",
      "Steering wheel vibrates under hard braking",
      "Brake pedal feels soft or sinks to the floor",
      "Brake warning light on the dash",
    ],
    typicalDuration: "60–120 minutes per axle",
    estimatedRange: "$180–$450 per axle (parts + labor)",
  },
  {
    slug: "battery-replacement",
    name: "Mobile Battery Replacement",
    shortName: "Battery Replacement",
    intro:
      "Dead battery in the morning? We carry AGM, EFB, and standard batteries on the truck for most makes. We test before replacing — sometimes the alternator is the real culprit, and we’ll save you the parts cost.",
    whatWeDo: [
      "Load test the existing battery and alternator",
      "Replace the battery with a matching group-size, CCA-rated unit",
      "Reprogram the BMS / register the new battery (BMW, Audi, Mercedes)",
      "Recycle the old battery (no core fee)",
      "Verify clean cranking voltage on cold start",
    ],
    signsYouNeedIt: [
      "Slow cranking on cold mornings",
      "Battery warning light on the dash",
      "Check engine light from low voltage",
      "Battery is more than 4 years old",
    ],
    typicalDuration: "30–60 minutes",
    estimatedRange: "$180–$320 depending on battery type",
  },
  {
    slug: "diagnostics",
    name: "Mobile Diagnostics",
    shortName: "Diagnostics",
    intro:
      "Check engine light, weird noise, mystery fault — we bring full OBD-II scanners (Autel, Snap-On) to read live data and pinpoint root cause. No more “just clear it and see if it comes back” from chain shops.",
    whatWeDo: [
      "Pull OBD-II codes (current and pending)",
      "Read live data: O2 sensors, fuel trims, misfire counts, MAF flow",
      "Inspect the relevant subsystem (vacuum lines, sensors, harness)",
      "Provide a written diagnosis with repair quote — no surprises",
      "If you decide not to repair, the diagnostic fee is yours to keep",
    ],
    signsYouNeedIt: [
      "Check engine light is on (solid or flashing)",
      "Car running rough, hesitating, or stalling",
      "Sudden drop in MPG",
      "Unusual noise, smell, or vibration",
    ],
    typicalDuration: "45–90 minutes",
    estimatedRange: "$95 flat diagnostic fee, applied to repair if you book",
  },
  {
    slug: "pre-purchase-inspection",
    name: "Pre-Purchase Inspection",
    shortName: "Pre-Purchase Inspection",
    intro:
      "Buying a used car? We meet you at the seller’s location, run a full inspection, and give you written findings before you wire money. One missed problem can cost more than the inspection 10x over.",
    whatWeDo: [
      "Cold-start verification + listening test for engine knock or tick",
      "OBD-II scan: confirm no hidden codes were cleared by the seller",
      "Visual check: leaks, corrosion, prior collision evidence",
      "Test drive: brakes, steering, transmission shift quality",
      "Written report with photos — yours to use as negotiation leverage",
    ],
    signsYouNeedIt: [
      "About to buy a used car private-party or dealer-as-is",
      "Sub-$15K vehicle where a hidden $3K issue would kill the deal",
      "Out-of-state purchase you can’t inspect yourself",
      "Specialty / luxury vehicle you don’t know intimately",
    ],
    typicalDuration: "60–90 minutes on-site",
    estimatedRange: "$150–$200 flat, includes written report",
  },
] as const;

export function findService(slug: string): ServiceContent | undefined {
  return SERVICES.find((s) => s.slug === slug);
}
