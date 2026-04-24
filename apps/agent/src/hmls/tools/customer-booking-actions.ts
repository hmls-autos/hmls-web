import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, schema } from "../../db/client.ts";
import { toolResult } from "@hmls/shared/tool-result";
import type { ToolContext } from "../../common/convert-tools.ts";
import { addNote, transition } from "../../services/order-state.ts";
import { customerAgentActor, toolResultFromOrderState } from "../../services/order-state-tool.ts";

// After Layer 3 there is no separate bookings entity — scheduling lives on
// the order. The two tools here cover the "customer wants to change a
// scheduled appointment" flows: cancel outright, or flag for staff review.

// ---------------------------------------------------------------------------
// Tool 1: cancel_booking — cancel a scheduled order
// ---------------------------------------------------------------------------

const cancelBookingTool = {
  name: "cancel_booking",
  description:
    "Customer cancels their scheduled appointment. Only allowed while the order is in 'scheduled' " +
    "status. Once the shop has started work, cancellations must go through staff.",
  schema: z.object({
    orderId: z.string().describe("The order ID to cancel the appointment on"),
    reason: z.string().optional().describe("Optional reason for cancellation"),
  }),
  execute: async (
    params: { orderId: string; reason?: string },
    ctx: ToolContext | undefined,
  ) => {
    const id = Number(params.orderId);
    if (!Number.isInteger(id) || id <= 0) {
      return toolResult({ success: false, error: "Invalid order ID" });
    }
    const actor = customerAgentActor(ctx);
    if (!actor) return toolResult({ success: false, error: "Authentication required" });

    const [order] = await db
      .select({ id: schema.orders.id, customerId: schema.orders.customerId })
      .from(schema.orders)
      .where(eq(schema.orders.id, id))
      .limit(1);
    if (!order || order.customerId !== ctx?.customerId) {
      return toolResult({ success: false, error: `Order #${id} not found` });
    }

    const result = await transition(id, "cancelled", actor, { reason: params.reason });
    return toolResultFromOrderState(result, (row) => ({
      orderId: row.id,
      newStatus: row.status,
      message: `Your appointment for order #${row.id} has been cancelled.`,
    }));
  },
};

// ---------------------------------------------------------------------------
// Tool 2: request_booking_reschedule — flag for staff review
// ---------------------------------------------------------------------------

const requestRescheduleTool = {
  name: "request_booking_reschedule",
  description:
    "Customer requests to reschedule their appointment. Does NOT directly change the appointment — " +
    "it records a note on the order for staff to review and follow up.",
  schema: z.object({
    orderId: z.string().describe("The order ID to reschedule"),
    preferredTime: z
      .string()
      .optional()
      .describe("Preferred new time/date (e.g. 'Thursday afternoon', 'next Monday morning')"),
    reason: z.string().optional().describe("Reason for rescheduling"),
  }),
  execute: async (
    params: { orderId: string; preferredTime?: string; reason?: string },
    ctx: ToolContext | undefined,
  ) => {
    const id = Number(params.orderId);
    if (!Number.isInteger(id) || id <= 0) {
      return toolResult({ success: false, error: "Invalid order ID" });
    }
    const actor = customerAgentActor(ctx);
    if (!actor) return toolResult({ success: false, error: "Authentication required" });

    const [order] = await db
      .select({
        id: schema.orders.id,
        status: schema.orders.status,
        customerId: schema.orders.customerId,
      })
      .from(schema.orders)
      .where(eq(schema.orders.id, id))
      .limit(1);
    if (!order || order.customerId !== ctx?.customerId) {
      return toolResult({ success: false, error: `Order #${id} not found` });
    }

    const terminalStatuses = new Set(["completed", "cancelled", "declined"]);
    if (terminalStatuses.has(order.status)) {
      return toolResult({
        success: false,
        error: `Order #${id} is '${order.status}' and cannot be rescheduled.`,
      });
    }

    const noteLines = ["[Reschedule request]"];
    if (params.preferredTime) noteLines.push(`Preferred time: ${params.preferredTime}`);
    if (params.reason) noteLines.push(`Reason: ${params.reason}`);

    const result = await addNote(id, noteLines.join("\n"), actor);
    return toolResultFromOrderState(result, () => ({
      orderId: id,
      message: order.status === "scheduled"
        ? "Reschedule request submitted. The shop will contact you to confirm a new time."
        : "Reschedule request noted. The shop will review.",
    }));
  },
};

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export const customerBookingActionTools = [
  cancelBookingTool,
  requestRescheduleTool,
];
