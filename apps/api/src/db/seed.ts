// Seed script for HMLS Mobile Mechanic database
// Run: deno run --allow-all --env=../../.env src/db/seed.ts

import { db, schema } from "./client.ts";
import pricingConfig from "./seed-data/pricing-config.json" with { type: "json" };
import vehiclePricing from "./seed-data/vehicle-pricing.json" with { type: "json" };
import providersData from "./seed-data/providers.json" with { type: "json" };

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
  await db.delete(schema.providerAvailability);
  await db.delete(schema.providerScheduleOverrides);
  await db.delete(schema.bookings);
  await db.delete(schema.providers);
  await db.delete(schema.vehiclePricing);
  await db.delete(schema.pricingConfig);

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

    console.log(`  Provider "${provider.name}" seeded with ${p.schedule.length} schedule slots`);
  }

  console.log("\nSeed completed successfully!");

  // Summary
  const configCount = await db.select().from(schema.pricingConfig);
  const vehicleCount = await db.select().from(schema.vehiclePricing);
  const providerCount = await db.select().from(schema.providers);

  console.log(`\nSummary:`);
  console.log(`  - Pricing config: ${configCount.length}`);
  console.log(`  - Vehicle pricing: ${vehicleCount.length}`);
  console.log(`  - Providers: ${providerCount.length}`);

  Deno.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  Deno.exit(1);
});
