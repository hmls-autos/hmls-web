// Seed script for HMLS Mobile Mechanic database
// Run: deno run --allow-all --env=../../.env src/db/seed.ts

import { db, schema } from "./client.ts";
import servicesRaw from "./seed-data/services.json" with { type: "json" };
import pricingConfig from "./seed-data/pricing-config.json" with { type: "json" };
import vehiclePricing from "./seed-data/vehicle-pricing.json" with { type: "json" };
import providersData from "./seed-data/providers.json" with { type: "json" };

// Convert duration string to labor hours
function durationToLaborHours(duration: string): string {
  if (duration.toLowerCase().includes("included")) {
    return "0.00";
  }

  const minuteMatch = duration.match(/^(\d+)(?:-(\d+))?\s*minutes?$/i);
  if (minuteMatch) {
    const min = parseInt(minuteMatch[1]);
    const max = minuteMatch[2] ? parseInt(minuteMatch[2]) : min;
    return ((min + max) / 2 / 60).toFixed(2);
  }

  const hourMatch = duration.match(
    /^(\d+(?:\.\d+)?)(?:-(\d+(?:\.\d+)?))?\s*hours?$/i,
  );
  if (hourMatch) {
    const min = parseFloat(hourMatch[1]);
    const max = hourMatch[2] ? parseFloat(hourMatch[2]) : min;
    return ((min + max) / 2).toFixed(2);
  }

  console.warn(`Could not parse duration: "${duration}", defaulting to 1 hour`);
  return "1.00";
}

// Transform raw services to use laborHours instead of duration
const services = servicesRaw.map((s) => ({
  name: s.name,
  description: s.description,
  laborHours: durationToLaborHours(s.duration),
  category: s.category,
}));

// Helper to batch insert large arrays
async function batchInsert<T extends Record<string, unknown>>(
  table: Parameters<typeof db.insert>[0],
  data: T[],
  batchSize = 100,
) {
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    await db.insert(table).values(batch as typeof table.$inferInsert[]);
  }
}

async function seed() {
  console.log("Seeding database...\n");

  // Clear existing data (FK-safe order: dependents first)
  console.log("Clearing existing data...");
  await db.delete(schema.providerServices);
  await db.delete(schema.providerAvailability);
  await db.delete(schema.providerScheduleOverrides);
  await db.delete(schema.bookings);
  await db.delete(schema.providers);
  await db.delete(schema.vehiclePricing);
  await db.delete(schema.pricingConfig);
  await db.delete(schema.services);

  // Seed services
  console.log(`Inserting ${services.length} services...`);
  await batchInsert(schema.services, services, 50);

  // Seed pricing config
  console.log(`Inserting ${pricingConfig.length} pricing config entries...`);
  await db.insert(schema.pricingConfig).values(pricingConfig);

  // Seed vehicle pricing
  console.log(`Inserting ${vehiclePricing.length} vehicle pricing entries...`);
  await batchInsert(schema.vehiclePricing, vehiclePricing, 50);

  // Seed providers
  console.log("Seeding providers...");
  for (const p of providersData) {
    const [provider] = await db.insert(schema.providers).values({
      name: p.name,
      email: p.email,
      phone: p.phone,
      specialties: p.specialties,
      isActive: p.isActive,
      serviceRadiusMiles: p.serviceRadiusMiles,
      timezone: p.timezone,
    }).returning();

    // Seed schedule
    for (const s of p.schedule) {
      await db.insert(schema.providerAvailability).values({
        providerId: provider.id,
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,
      });
    }

    // Link all services if allServices is true
    if (p.allServices) {
      const allServices = await db.select({ id: schema.services.id }).from(schema.services);
      for (const svc of allServices) {
        await db.insert(schema.providerServices).values({
          providerId: provider.id,
          serviceId: svc.id,
        });
      }
    }

    console.log(`  Provider "${provider.name}" seeded with ${p.schedule.length} schedule slots`);
  }

  console.log("\nSeed completed successfully!");

  // Summary
  const serviceCount = await db.select().from(schema.services);
  const configCount = await db.select().from(schema.pricingConfig);
  const vehicleCount = await db.select().from(schema.vehiclePricing);
  const providerCount = await db.select().from(schema.providers);

  console.log(`\nSummary:`);
  console.log(`  - Services: ${serviceCount.length}`);
  console.log(`  - Pricing config: ${configCount.length}`);
  console.log(`  - Vehicle pricing: ${vehicleCount.length}`);
  console.log(`  - Providers: ${providerCount.length}`);

  Deno.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  Deno.exit(1);
});
