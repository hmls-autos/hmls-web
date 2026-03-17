import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, schema } from "../../db/client.ts";
import { toolResult } from "@hmls/shared/tool-result";
import type { ToolContext } from "../../common/convert-tools.ts";

// Only "requested" bookings can be cancelled by customers
const CUSTOMER_CANCELLABLE_BOOKING_STATUSES = ["requested"];

// ---------------------------------------------------------------------------
// Tool 1: cancel_booking
// ---------------------------------------------------------------------------

const cancelBookingTool = {
  name: "cancel_booking",
  description:
    "Customer cancels a booking/appointment. Only allowed when the booking is in 'requested' status. " +
    "Confirmed bookings cannot be cancelled by the customer — they need to contact staff.",
  schema: z.object({
    bookingId: z.string().describe("The booking ID to cancel"),
    reason: z.string().optional().describe("Optional reason for cancellation"),
  }),
  execute: async (params: { bookingId: string; reason?: string }, ctx: ToolContext | undefined) => {
    const id = Number(params.bookingId);
    if (!Number.isInteger(id) || id <= 0) {
      return toolResult({ success: false, error: "Invalid booking ID" });
    }

    if (!ctx?.customerId) {
      return toolResult({ success: false, error: "Authentication required" });
    }

    const [booking] = await db
      .select()
      .from(schema.bookings)
      .where(eq(schema.bookings.id, id))
      .limit(1);

    if (!booking || booking.customerId !== ctx.customerId) {
      return toolResult({ success: false, error: `Booking #${id} not found` });
    }

    if (!CUSTOMER_CANCELLABLE_BOOKING_STATUSES.includes(booking.status)) {
      return toolResult({
        success: false,
        error: `Booking #${id} cannot be cancelled — current status is '${booking.status}'. ` +
          "Only 'requested' bookings can be cancelled by the customer. " +
          "For confirmed bookings, please contact the shop directly.",
      });
    }

    await db
      .update(schema.bookings)
      .set({
        status: "cancelled",
        customerNotes: params.reason
          ? `${
            booking.customerNotes ? booking.customerNotes + "\n" : ""
          }Cancellation reason: ${params.reason}`
          : booking.customerNotes,
        updatedAt: new Date(),
      })
      .where(eq(schema.bookings.id, id));

    // Log an order event if the booking is linked to an order
    if (booking.estimateId) {
      const [order] = await db
        .select({ id: schema.orders.id })
        .from(schema.orders)
        .where(eq(schema.orders.estimateId, booking.estimateId))
        .limit(1);

      if (order) {
        await db.insert(schema.orderEvents).values({
          orderId: order.id,
          eventType: "note_added",
          actor: "customer",
          metadata: {
            note: `Booking #${id} cancelled by customer${
              params.reason ? `: ${params.reason}` : ""
            }`,
          },
        });
      }
    }

    return toolResult({
      success: true,
      bookingId: id,
      newStatus: "cancelled",
      message: `Booking #${id} has been cancelled.`,
    });
  },
};

// ---------------------------------------------------------------------------
// Tool 2: request_reschedule
// ---------------------------------------------------------------------------

const requestRescheduleTool = {
  name: "request_booking_reschedule",
  description: "Customer requests to reschedule a booking/appointment. " +
    "This does NOT directly change a confirmed booking — it flags it for staff review. " +
    "For 'requested' bookings, the request is noted. For 'confirmed' bookings, " +
    "a reschedule request is submitted for the shop to review.",
  schema: z.object({
    bookingId: z.string().describe("The booking ID to reschedule"),
    preferredTime: z
      .string()
      .optional()
      .describe("Preferred new time/date (e.g. 'Thursday afternoon', 'next Monday morning')"),
    reason: z.string().optional().describe("Reason for rescheduling"),
  }),
  execute: async (
    params: { bookingId: string; preferredTime?: string; reason?: string },
    ctx: ToolContext | undefined,
  ) => {
    const id = Number(params.bookingId);
    if (!Number.isInteger(id) || id <= 0) {
      return toolResult({ success: false, error: "Invalid booking ID" });
    }

    if (!ctx?.customerId) {
      return toolResult({ success: false, error: "Authentication required" });
    }

    const [booking] = await db
      .select()
      .from(schema.bookings)
      .where(eq(schema.bookings.id, id))
      .limit(1);

    if (!booking || booking.customerId !== ctx.customerId) {
      return toolResult({ success: false, error: `Booking #${id} not found` });
    }

    const terminalStatuses = ["completed", "cancelled"];
    if (terminalStatuses.includes(booking.status)) {
      return toolResult({
        success: false,
        error: `Booking #${id} is '${booking.status}' and cannot be rescheduled.`,
      });
    }

    // Build the reschedule note
    const noteLines = ["[Reschedule request]"];
    if (params.preferredTime) noteLines.push(`Preferred time: ${params.preferredTime}`);
    if (params.reason) noteLines.push(`Reason: ${params.reason}`);
    const note = noteLines.join("\n");

    // Append to customer notes on the booking
    await db
      .update(schema.bookings)
      .set({
        customerNotes: booking.customerNotes ? `${booking.customerNotes}\n${note}` : note,
        updatedAt: new Date(),
      })
      .where(eq(schema.bookings.id, id));

    // Log an order event if linked
    if (booking.estimateId) {
      const [order] = await db
        .select({ id: schema.orders.id })
        .from(schema.orders)
        .where(eq(schema.orders.estimateId, booking.estimateId))
        .limit(1);

      if (order) {
        await db.insert(schema.orderEvents).values({
          orderId: order.id,
          eventType: "note_added",
          actor: "customer",
          metadata: { note },
        });
      }
    }

    return toolResult({
      success: true,
      bookingId: id,
      message: booking.status === "confirmed"
        ? "Reschedule request submitted. The shop will contact you to confirm a new time."
        : "Reschedule request noted. The shop will review when confirming your booking.",
    });
  },
};

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export const customerBookingActionTools = [
  cancelBookingTool,
  requestRescheduleTool,
];
