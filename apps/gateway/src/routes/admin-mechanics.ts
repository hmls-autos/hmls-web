import { Hono } from "hono";
import { and, asc, between, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { db, schema } from "@hmls/agent/db";
import { type AdminEnv, requireAdmin } from "../middleware/admin.ts";
import {
  availableMinutesForWeek,
  bookedMinutesForWeek,
  computeUtilization,
  isOnJobNow,
} from "../lib/mechanic-stats.ts";

const adminMechanics = new Hono<AdminEnv>();

adminMechanics.use("*", requireAdmin);

// GET / — list mechanics with aggregate stats
adminMechanics.get("/", async (c) => {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setUTCDate(weekStart.getUTCDate() - 14);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const providers = await db
    .select()
    .from(schema.providers)
    .orderBy(desc(schema.providers.isActive), asc(schema.providers.name));

  if (providers.length === 0) return c.json([]);

  const providerIds = providers.map((p) => p.id);

  const [
    availability,
    overrides,
    weekBookings,
    nowBookings,
    paidOrders,
    upcomingCounts,
    nextBookings,
  ] = await Promise.all([
    db
      .select()
      .from(schema.providerAvailability)
      .where(inArray(schema.providerAvailability.providerId, providerIds)),
    db
      .select()
      .from(schema.providerScheduleOverrides)
      .where(
        inArray(schema.providerScheduleOverrides.providerId, providerIds),
      ),
    db
      .select({
        providerId: schema.bookings.providerId,
        scheduledAt: schema.bookings.scheduledAt,
        durationMinutes: schema.bookings.durationMinutes,
        status: schema.bookings.status,
      })
      .from(schema.bookings)
      .where(
        and(
          inArray(schema.bookings.providerId, providerIds),
          gte(schema.bookings.scheduledAt, weekStart),
        ),
      ),
    // Snapshot bookings around "now" (±24h) for isOnJobNow.
    db
      .select({
        providerId: schema.bookings.providerId,
        scheduledAt: schema.bookings.scheduledAt,
        durationMinutes: schema.bookings.durationMinutes,
        status: schema.bookings.status,
      })
      .from(schema.bookings)
      .where(
        and(
          inArray(schema.bookings.providerId, providerIds),
          between(
            schema.bookings.scheduledAt,
            new Date(now.getTime() - 24 * 60 * 60 * 1000),
            new Date(now.getTime() + 24 * 60 * 60 * 1000),
          ),
        ),
      ),
    // Earnings 30d: orders.bookingId → bookings.providerId, orders paid/completed recently
    db
      .select({
        providerId: schema.bookings.providerId,
        amountCents: sql<
          number
        >`COALESCE(${schema.orders.capturedAmountCents}, ${schema.orders.subtotalCents})`,
      })
      .from(schema.orders)
      .innerJoin(
        schema.bookings,
        eq(schema.orders.bookingId, schema.bookings.id),
      )
      .where(
        and(
          inArray(schema.bookings.providerId, providerIds),
          sql`${schema.orders.status} IN ('paid', 'completed', 'archived')`,
          gte(schema.orders.createdAt, thirtyDaysAgo),
        ),
      ),
    db
      .select({
        providerId: schema.bookings.providerId,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(schema.bookings)
      .where(
        and(
          inArray(schema.bookings.providerId, providerIds),
          gte(schema.bookings.scheduledAt, now),
          sql`${schema.bookings.status} IN ('requested', 'confirmed')`,
        ),
      )
      .groupBy(schema.bookings.providerId),
    db
      .select({
        providerId: schema.bookings.providerId,
        scheduledAt: sql<Date>`MIN(${schema.bookings.scheduledAt})`,
      })
      .from(schema.bookings)
      .where(
        and(
          inArray(schema.bookings.providerId, providerIds),
          gte(schema.bookings.scheduledAt, now),
          sql`${schema.bookings.status} IN ('requested', 'confirmed')`,
        ),
      )
      .groupBy(schema.bookings.providerId),
  ]);

  const groupBy = <T extends { providerId: number | null }>(
    rows: T[],
  ): Map<number, T[]> => {
    const m = new Map<number, T[]>();
    for (const r of rows) {
      if (r.providerId == null) continue;
      const list = m.get(r.providerId) ?? [];
      list.push(r);
      m.set(r.providerId, list);
    }
    return m;
  };

  const availByProvider = groupBy(availability);
  const overridesByProvider = groupBy(overrides);
  const weekByProvider = groupBy(weekBookings);
  const nowByProvider = groupBy(nowBookings);

  const earningsByProvider = new Map<number, number>();
  for (const row of paidOrders) {
    if (row.providerId == null) continue;
    earningsByProvider.set(
      row.providerId,
      (earningsByProvider.get(row.providerId) ?? 0) + Number(row.amountCents),
    );
  }
  const upcomingCountByProvider = new Map<number, number>();
  for (const row of upcomingCounts) {
    if (row.providerId == null) continue;
    upcomingCountByProvider.set(row.providerId, row.count);
  }
  const nextByProvider = new Map<number, Date>();
  for (const row of nextBookings) {
    if (row.providerId == null) continue;
    nextByProvider.set(row.providerId, row.scheduledAt);
  }

  const result = providers.map((p) => {
    const avail = availByProvider.get(p.id) ?? [];
    const ovr = overridesByProvider.get(p.id) ?? [];
    const weekB = (weekByProvider.get(p.id) ?? []).map((b) => ({
      scheduledAt: new Date(b.scheduledAt),
      durationMinutes: b.durationMinutes,
      status: b.status,
    }));
    const nowB = (nowByProvider.get(p.id) ?? []).map((b) => ({
      scheduledAt: new Date(b.scheduledAt),
      durationMinutes: b.durationMinutes,
      status: b.status,
    }));

    const availableMinutes = availableMinutesForWeek(avail, ovr, now);
    const bookedMinutes = bookedMinutesForWeek(weekB, now);
    return {
      ...p,
      weekUtilization: computeUtilization(availableMinutes, bookedMinutes),
      isOnJobNow: isOnJobNow(nowB, now),
      upcomingBookingsCount: upcomingCountByProvider.get(p.id) ?? 0,
      earnings30d: earningsByProvider.get(p.id) ?? 0,
      nextBookingAt: nextByProvider.get(p.id) ?? null,
    };
  });

  return c.json(result);
});

// POST / — create a new mechanic
adminMechanics.post("/", async (c) => {
  const body = await c.req.json<{
    name?: string;
    email?: string;
    phone?: string;
    timezone?: string;
    serviceRadiusMiles?: number;
    homeBaseLat?: number | string | null;
    homeBaseLng?: number | string | null;
    specialties?: unknown;
    isActive?: boolean;
    authUserId?: string;
  }>().catch(() => null);

  if (!body?.name) {
    return c.json(
      { error: { code: "BAD_REQUEST", message: "name is required" } },
      400,
    );
  }

  const [created] = await db
    .insert(schema.providers)
    .values({
      name: body.name,
      email: body.email ?? null,
      phone: body.phone ?? null,
      timezone: body.timezone ?? "America/Los_Angeles",
      serviceRadiusMiles: body.serviceRadiusMiles ?? 30,
      homeBaseLat: body.homeBaseLat == null ? null : String(body.homeBaseLat),
      homeBaseLng: body.homeBaseLng == null ? null : String(body.homeBaseLng),
      specialties: body.specialties ?? null,
      isActive: body.isActive ?? true,
      authUserId: body.authUserId ?? null,
    })
    .returning();

  return c.json(created, 201);
});

// GET /:id — single mechanic
adminMechanics.get("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id) || id <= 0) {
    return c.json(
      { error: { code: "BAD_REQUEST", message: "Invalid mechanic ID" } },
      400,
    );
  }

  const [provider] = await db
    .select()
    .from(schema.providers)
    .where(eq(schema.providers.id, id))
    .limit(1);

  if (!provider) {
    return c.json(
      { error: { code: "NOT_FOUND", message: "Mechanic not found" } },
      404,
    );
  }
  return c.json(provider);
});

// PATCH /:id — edit profile fields
adminMechanics.patch("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id) || id <= 0) {
    return c.json(
      { error: { code: "BAD_REQUEST", message: "Invalid mechanic ID" } },
      400,
    );
  }

  type PatchBody = {
    name?: string;
    email?: string | null;
    phone?: string | null;
    timezone?: string;
    serviceRadiusMiles?: number;
    homeBaseLat?: number | string | null;
    homeBaseLng?: number | string | null;
    specialties?: unknown;
    isActive?: boolean;
    authUserId?: string | null;
  };
  const body: PatchBody = await c.req.json<PatchBody>().catch(() => ({}));

  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.email !== undefined) updates.email = body.email;
  if (body.phone !== undefined) updates.phone = body.phone;
  if (body.timezone !== undefined) updates.timezone = body.timezone;
  if (body.serviceRadiusMiles !== undefined) {
    updates.serviceRadiusMiles = body.serviceRadiusMiles;
  }
  if (body.homeBaseLat !== undefined) {
    updates.homeBaseLat = body.homeBaseLat == null ? null : String(body.homeBaseLat);
  }
  if (body.homeBaseLng !== undefined) {
    updates.homeBaseLng = body.homeBaseLng == null ? null : String(body.homeBaseLng);
  }
  if (body.specialties !== undefined) updates.specialties = body.specialties;
  if (body.isActive !== undefined) updates.isActive = body.isActive;
  if (body.authUserId !== undefined) updates.authUserId = body.authUserId;

  if (Object.keys(updates).length === 0) {
    return c.json(
      { error: { code: "BAD_REQUEST", message: "No fields to update" } },
      400,
    );
  }

  const [updated] = await db
    .update(schema.providers)
    .set(updates)
    .where(eq(schema.providers.id, id))
    .returning();

  if (!updated) {
    return c.json(
      { error: { code: "NOT_FOUND", message: "Mechanic not found" } },
      404,
    );
  }
  return c.json(updated);
});

// DELETE /:id — soft delete (sets isActive=false). Bookings reference this
// row, so we never hard-delete.
adminMechanics.delete("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id) || id <= 0) {
    return c.json(
      { error: { code: "BAD_REQUEST", message: "Invalid mechanic ID" } },
      400,
    );
  }

  const [updated] = await db
    .update(schema.providers)
    .set({ isActive: false })
    .where(eq(schema.providers.id, id))
    .returning();

  if (!updated) {
    return c.json(
      { error: { code: "NOT_FOUND", message: "Mechanic not found" } },
      404,
    );
  }
  return c.json({ success: true });
});

export { adminMechanics };
