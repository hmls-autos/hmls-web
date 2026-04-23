import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, schema } from "../../db/client.ts";
import type { OrderItem } from "../../db/schema.ts";
import { toolResult } from "@hmls/shared/tool-result";
import { randomUUID } from "node:crypto";
import type { ToolContext } from "../../common/convert-tools.ts";

// Statuses a customer is allowed to cancel from (before any money changes hands)
const CUSTOMER_CANCELLABLE_STATUSES = ["draft", "estimated"];

// Statuses where a customer can still add/remove items on their own order
const CUSTOMER_EDITABLE_STATUSES = ["draft", "revised", "estimated"];

// ---------------------------------------------------------------------------
// Tool 1: approve_order
// ---------------------------------------------------------------------------

const approveOrderTool = {
  name: "approve_order",
  description:
    "Customer approves an estimate/quote. Only valid when the order is in 'estimated' status. " +
    "This does not charge the customer — it signals acceptance so the shop can assign a mechanic and schedule the appointment.",
  schema: z.object({
    orderId: z.string().describe("The order ID to approve"),
  }),
  execute: async (params: { orderId: string }, ctx: ToolContext | undefined) => {
    const id = Number(params.orderId);
    if (!Number.isInteger(id) || id <= 0) {
      return toolResult({ success: false, error: "Invalid order ID" });
    }

    const [order] = await db
      .select()
      .from(schema.orders)
      .where(eq(schema.orders.id, id))
      .limit(1);

    if (!ctx?.customerId) {
      return toolResult({ success: false, error: "Authentication required" });
    }
    if (!order || order.customerId !== ctx.customerId) {
      return toolResult({ success: false, error: `Order #${id} not found` });
    }

    if (order.status !== "estimated") {
      return toolResult({
        success: false,
        error:
          `Order #${id} cannot be approved — current status is '${order.status}'. Only 'estimated' orders can be approved.`,
      });
    }

    await db
      .update(schema.orders)
      .set({
        status: "approved",
        statusHistory: [
          ...(Array.isArray(order.statusHistory) ? order.statusHistory : []),
          { status: "approved", timestamp: new Date().toISOString(), actor: "customer" },
        ],
        updatedAt: new Date(),
      })
      .where(eq(schema.orders.id, id));

    await db.insert(schema.orderEvents).values({
      orderId: id,
      eventType: "status_change",
      fromStatus: "estimated",
      toStatus: "approved",
      actor: "customer",
      metadata: {},
    });

    return toolResult({
      success: true,
      orderId: id,
      newStatus: "approved",
      message: `Order #${id} approved. The shop will schedule your appointment.`,
    });
  },
};

// ---------------------------------------------------------------------------
// Tool 2: decline_order
// ---------------------------------------------------------------------------

const declineOrderTool = {
  name: "decline_order",
  description:
    "Customer declines an estimate/quote. Only valid when the order is in 'estimated' status. " +
    "The shop may revise and resend the estimate.",
  schema: z.object({
    orderId: z.string().describe("The order ID to decline"),
    reason: z.string().optional().describe("Optional reason for declining"),
  }),
  execute: async (
    params: { orderId: string; reason?: string },
    ctx: ToolContext | undefined,
  ) => {
    const id = Number(params.orderId);
    if (!Number.isInteger(id) || id <= 0) {
      return toolResult({ success: false, error: "Invalid order ID" });
    }

    if (!ctx?.customerId) {
      return toolResult({ success: false, error: "Authentication required" });
    }

    const [order] = await db
      .select()
      .from(schema.orders)
      .where(eq(schema.orders.id, id))
      .limit(1);

    if (!order || order.customerId !== ctx.customerId) {
      return toolResult({ success: false, error: `Order #${id} not found` });
    }

    if (order.status !== "estimated") {
      return toolResult({
        success: false,
        error:
          `Order #${id} cannot be declined — current status is '${order.status}'. Only 'estimated' orders can be declined.`,
      });
    }

    await db
      .update(schema.orders)
      .set({
        status: "declined",
        statusHistory: [
          ...(Array.isArray(order.statusHistory) ? order.statusHistory : []),
          { status: "declined", timestamp: new Date().toISOString(), actor: "customer" },
        ],
        updatedAt: new Date(),
      })
      .where(eq(schema.orders.id, id));

    await db.insert(schema.orderEvents).values({
      orderId: id,
      eventType: "status_change",
      fromStatus: "estimated",
      toStatus: "declined",
      actor: "customer",
      metadata: params.reason ? { reason: params.reason } : {},
    });

    return toolResult({
      success: true,
      orderId: id,
      newStatus: "declined",
      message: `Order #${id} declined. The shop has been notified and may revise the estimate.`,
    });
  },
};

// ---------------------------------------------------------------------------
// Tool 3: cancel_order
// ---------------------------------------------------------------------------

const cancelOrderTool = {
  name: "cancel_order",
  description: "Customer cancels an order. Only allowed while the order is still in " +
    `${CUSTOMER_CANCELLABLE_STATUSES.join(" or ")}. ` +
    "Cannot cancel orders that are already scheduled, in progress, or completed.",
  schema: z.object({
    orderId: z.string().describe("The order ID to cancel"),
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

    if (!ctx?.customerId) {
      return toolResult({ success: false, error: "Authentication required" });
    }

    const [order] = await db
      .select()
      .from(schema.orders)
      .where(eq(schema.orders.id, id))
      .limit(1);

    if (!order || order.customerId !== ctx.customerId) {
      return toolResult({ success: false, error: `Order #${id} not found` });
    }

    if (!CUSTOMER_CANCELLABLE_STATUSES.includes(order.status)) {
      return toolResult({
        success: false,
        error: `Order #${id} cannot be cancelled — current status is '${order.status}'. ` +
          `Customers can only cancel orders in: ${CUSTOMER_CANCELLABLE_STATUSES.join(", ")}. ` +
          "Please contact the shop directly to discuss cancellation.",
      });
    }

    await db
      .update(schema.orders)
      .set({
        status: "cancelled",
        cancellationReason: params.reason ?? "Cancelled by customer",
        statusHistory: [
          ...(Array.isArray(order.statusHistory) ? order.statusHistory : []),
          { status: "cancelled", timestamp: new Date().toISOString(), actor: "customer" },
        ],
        updatedAt: new Date(),
      })
      .where(eq(schema.orders.id, id));

    await db.insert(schema.orderEvents).values({
      orderId: id,
      eventType: "status_change",
      fromStatus: order.status,
      toStatus: "cancelled",
      actor: "customer",
      metadata: { reason: params.reason ?? "Cancelled by customer" },
    });

    return toolResult({
      success: true,
      orderId: id,
      newStatus: "cancelled",
      message: `Order #${id} has been cancelled.`,
    });
  },
};

// ---------------------------------------------------------------------------
// Tool 4: request_reschedule
// ---------------------------------------------------------------------------

const requestRescheduleTool = {
  name: "request_reschedule",
  description: "Customer requests a reschedule for a scheduled or upcoming appointment. " +
    "This does NOT change the appointment time — it adds a note for the shop to follow up. " +
    "The shop will contact the customer to confirm a new time.",
  schema: z.object({
    orderId: z.string().describe("The order ID for the appointment to reschedule"),
    requestedTime: z
      .string()
      .optional()
      .describe("Preferred new time/date (e.g. 'Thursday afternoon', 'anytime next week')"),
    reason: z.string().optional().describe("Reason for rescheduling"),
  }),
  execute: async (
    params: { orderId: string; requestedTime?: string; reason?: string },
    ctx: ToolContext | undefined,
  ) => {
    const id = Number(params.orderId);
    if (!Number.isInteger(id) || id <= 0) {
      return toolResult({ success: false, error: "Invalid order ID" });
    }

    if (!ctx?.customerId) {
      return toolResult({ success: false, error: "Authentication required" });
    }

    const [order] = await db
      .select({
        id: schema.orders.id,
        status: schema.orders.status,
        customerId: schema.orders.customerId,
      })
      .from(schema.orders)
      .where(eq(schema.orders.id, id))
      .limit(1);

    if (!order || order.customerId !== ctx.customerId) {
      return toolResult({ success: false, error: `Order #${id} not found` });
    }

    const noteLines = ["[Customer reschedule request]"];
    if (params.requestedTime) noteLines.push(`Preferred time: ${params.requestedTime}`);
    if (params.reason) noteLines.push(`Reason: ${params.reason}`);

    await db.insert(schema.orderEvents).values({
      orderId: id,
      eventType: "note_added",
      actor: "customer",
      metadata: { note: noteLines.join("\n") },
    });

    return toolResult({
      success: true,
      orderId: id,
      message:
        "Reschedule request noted. The shop will contact you to confirm a new appointment time.",
    });
  },
};

// ---------------------------------------------------------------------------
// Tool 5: modify_order_items
// ---------------------------------------------------------------------------

const modifyOrderItemsTool = {
  name: "modify_order_items",
  description:
    "Customer adds or removes service request items on a draft, revised, or estimated order. " +
    "Added items are priced automatically from the OLP labor database at the shop's standard " +
    "rate ($140/hr) and roll into the subtotal. If the vehicle or service isn't in OLP, the " +
    "item is added at $0 and the shop prices it during review. " +
    "IMPORTANT: if the order is in 'estimated' status (shop already sent the customer a quote), " +
    "modifying items flips the order back to 'revised' so the shop must re-review and re-send " +
    "the estimate. Before calling this tool on an estimated order, tell the customer: " +
    "'Changing this estimate will send it back to the shop for a new price — you'll get an updated quote.' " +
    "Only works when the order is in 'draft', 'revised', or 'estimated' status. " +
    "Use this when a customer wants to add a service request (e.g. 'also do an oil change') " +
    "or remove an item they no longer want.",
  schema: z.object({
    orderId: z.string().describe("The order ID to modify"),
    addItems: z
      .array(
        z.object({
          name: z.string().describe("Short service name (e.g. 'Oil Change', 'Tire Rotation')"),
          description: z.string().optional().describe("Additional details or context"),
        }),
      )
      .optional()
      .describe(
        "Service items to add. Pricing is auto-looked-up from OLP when possible; otherwise shop prices on review.",
      ),
    removeItemIds: z
      .array(z.string())
      .optional()
      .describe("Item IDs to remove from the order"),
  }),
  execute: async (
    params: {
      orderId: string;
      addItems?: Array<{ name: string; description?: string }>;
      removeItemIds?: string[];
    },
    ctx: ToolContext | undefined,
  ) => {
    const id = Number(params.orderId);
    if (!Number.isInteger(id) || id <= 0) {
      return toolResult({ success: false, error: "Invalid order ID" });
    }

    if (!ctx?.customerId) {
      return toolResult({ success: false, error: "Authentication required" });
    }

    const [order] = await db
      .select()
      .from(schema.orders)
      .where(eq(schema.orders.id, id))
      .limit(1);

    if (!order || order.customerId !== ctx.customerId) {
      return toolResult({ success: false, error: `Order #${id} not found` });
    }

    if (!CUSTOMER_EDITABLE_STATUSES.includes(order.status)) {
      return toolResult({
        success: false,
        error: `Order #${id} cannot be modified — current status is '${order.status}'. ` +
          `Customers can only modify items on orders in: ${CUSTOMER_EDITABLE_STATUSES.join(", ")}.`,
      });
    }

    let items: OrderItem[] = Array.isArray(order.items) ? (order.items as OrderItem[]) : [];

    // Remove items
    if (params.removeItemIds && params.removeItemIds.length > 0) {
      const removeSet = new Set(params.removeItemIds);
      items = items.filter((item) => !removeSet.has(item.id));
    }

    // Add new service-request items. OLP labor lookup runs whenever vehicle
    // info is known. Looked-up labor is priced at $140/hr (matches the
    // pricing engine in admin-order-tools) and flows into the subtotal, so
    // the customer sees a real price immediately for any item they add —
    // on draft, revised, or estimated orders alike. Shop review catches any
    // bad lookup during the normal admin flow before final billing.
    if (params.addItems && params.addItems.length > 0) {
      const vehicleInfo = order.vehicleInfo as
        | { year?: string; make?: string; model?: string }
        | null;
      const canLookup = Boolean(
        vehicleInfo?.year && vehicleInfo?.make && vehicleInfo?.model,
      );

      for (const req of params.addItems) {
        let laborHours: number | undefined;
        let sourceMeta: Record<string, unknown> | undefined;

        if (canLookup) {
          try {
            const { searchLaborTimes, findVehicles } = await import(
              "./olp-client.ts"
            );
            const vehicles = await findVehicles(
              vehicleInfo!.make!,
              vehicleInfo!.model!,
              Number(vehicleInfo!.year),
            );
            if (vehicles.length > 0) {
              const serviceWords = req.name
                .split(/\s+/)
                .filter((w) => w.length > 1);
              const laborTimes = await searchLaborTimes(
                vehicles.map((v: { id: number }) => v.id),
                serviceWords,
                undefined,
              );
              if (laborTimes.length > 0) {
                laborHours = Number(laborTimes[0].labor_hours);
                sourceMeta = laborTimes[0].sourceMeta as Record<string, unknown>;
              }
            }
          } catch (_e) {
            // OLP unavailable — item is added without a price; shop prices manually.
          }
        }

        // $140/hr matches the pricing engine in admin-order-tools.
        const priceCents = laborHours !== undefined ? Math.round(laborHours * 140 * 100) : 0;

        const metadata: Record<string, unknown> = { customerRequested: true };
        if (sourceMeta) metadata.sourceMeta = sourceMeta;

        const newItem: OrderItem & { metadata?: Record<string, unknown> } = {
          id: randomUUID(),
          category: "labor",
          name: req.name,
          description: req.description,
          quantity: 1,
          unitPriceCents: priceCents,
          totalCents: priceCents,
          taxable: true,
          ...(laborHours !== undefined ? { laborHours } : {}),
          metadata,
        };
        items.push(newItem);
      }
    }

    const subtotalCents = items.reduce((sum, item) => sum + (item.totalCents ?? 0), 0);

    // If the customer modified an already-quoted order, the shop's previous
    // estimate no longer matches the line items. Flip back to 'revised' so
    // the shop re-reviews and re-sends. Draft/revised orders stay where they
    // are — they haven't been sent to the customer yet.
    const madeChange = (params.addItems?.length ?? 0) > 0 ||
      (params.removeItemIds?.length ?? 0) > 0;
    const shouldRevertToRevised = madeChange && order.status === "estimated";
    const newStatus = shouldRevertToRevised ? "revised" : order.status;

    const updateFields: Record<string, unknown> = {
      items,
      subtotalCents,
      updatedAt: new Date(),
    };
    if (shouldRevertToRevised) {
      updateFields.status = "revised";
      updateFields.statusHistory = [
        ...(Array.isArray(order.statusHistory) ? order.statusHistory : []),
        { status: "revised", timestamp: new Date().toISOString(), actor: "customer" },
      ];
    }

    await db
      .update(schema.orders)
      .set(updateFields)
      .where(eq(schema.orders.id, id));

    await db.insert(schema.orderEvents).values({
      orderId: id,
      eventType: "items_modified",
      actor: "customer",
      metadata: {
        added: params.addItems?.map((i) => i.name) ?? [],
        removed: params.removeItemIds ?? [],
        revertedFromEstimated: shouldRevertToRevised,
      },
    });

    if (shouldRevertToRevised) {
      await db.insert(schema.orderEvents).values({
        orderId: id,
        eventType: "status_change",
        fromStatus: "estimated",
        toStatus: "revised",
        actor: "customer",
        metadata: { reason: "customer_modified_items" },
      });
    }

    return toolResult({
      success: true,
      orderId: id,
      status: newStatus,
      itemCount: items.length,
      message: `Order #${id} updated. ` +
        (params.addItems?.length
          ? `Added ${params.addItems.length} service(s) (priced automatically where possible). `
          : "") +
        (params.removeItemIds?.length ? `Removed ${params.removeItemIds.length} item(s). ` : "") +
        (shouldRevertToRevised
          ? "Since you changed an estimate the shop already sent, the shop will re-review and send an updated estimate."
          : ""),
    });
  },
};

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export const customerOrderActionTools = [
  approveOrderTool,
  declineOrderTool,
  cancelOrderTool,
  requestRescheduleTool,
  modifyOrderItemsTool,
];
