"use client";

import { ChevronRight, ClipboardList } from "lucide-react";
import { useState } from "react";
import { type AdminOrder, useAdminOrders } from "@/hooks/useAdmin";
import { createClient } from "@/lib/supabase/client";

const AGENT_URL = process.env.NEXT_PUBLIC_AGENT_URL || "http://localhost:8080";

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  estimated: {
    label: "Estimated",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  customer_approved: {
    label: "Customer Approved",
    color:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  customer_declined: {
    label: "Customer Declined",
    color:
      "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400",
  },
  quoted: {
    label: "Quoted",
    color:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  },
  accepted: {
    label: "Accepted",
    color:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  declined: {
    label: "Declined",
    color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
  scheduled: {
    label: "Scheduled",
    color:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  },
  in_progress: {
    label: "In Progress",
    color:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  },
  completed: {
    label: "Completed",
    color:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  cancelled: {
    label: "Cancelled",
    color:
      "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400",
  },
};

const TRANSITIONS: Record<string, string[]> = {
  estimated: ["customer_approved", "customer_declined", "cancelled"],
  customer_approved: ["quoted", "cancelled"],
  quoted: ["accepted", "declined", "cancelled"],
  accepted: ["scheduled", "cancelled"],
  scheduled: ["in_progress", "cancelled"],
  in_progress: ["completed", "cancelled"],
};

const FILTER_OPTIONS = [
  { value: "", label: "All" },
  { value: "estimated", label: "Estimated" },
  { value: "customer_approved", label: "Approved" },
  { value: "quoted", label: "Quoted" },
  { value: "accepted", label: "Accepted" },
  { value: "scheduled", label: "Scheduled" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await createClient().auth.getSession();
  return session?.access_token
    ? { Authorization: `Bearer ${session.access_token}` }
    : {};
}

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    color: "bg-neutral-100 text-neutral-500",
  };
  return (
    <span
      className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${config.color}`}
    >
      {config.label}
    </span>
  );
}

function OrderCard({
  order,
  onTransition,
  transitioning,
}: {
  order: AdminOrder;
  onTransition: (orderId: number, newStatus: string) => void;
  transitioning: number | null;
}) {
  const allowed = TRANSITIONS[order.status] ?? [];

  return (
    <div className="bg-surface border border-border rounded-xl p-5 hover:border-border-hover transition-colors">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-text">
              Order #{order.id}
            </h3>
            <StatusBadge status={order.status} />
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            {order.customer.name ?? "Unknown"}{" "}
            {order.customer.email && (
              <span>&middot; {order.customer.email}</span>
            )}
            {order.customer.phone && (
              <span>&middot; {order.customer.phone}</span>
            )}
          </p>
        </div>
      </div>

      {/* Linked entities */}
      <div className="flex flex-wrap gap-2 mb-3">
        {order.estimateId && (
          <span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
            Estimate #{order.estimateId}
          </span>
        )}
        {order.quoteId && (
          <span className="text-xs px-2 py-0.5 rounded bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400">
            Quote #{order.quoteId}
          </span>
        )}
        {order.bookingId && (
          <span className="text-xs px-2 py-0.5 rounded bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400">
            Booking #{order.bookingId}
          </span>
        )}
      </div>

      {order.adminNotes && (
        <p className="text-xs text-text-secondary mb-3 italic">
          {order.adminNotes}
        </p>
      )}

      {order.cancellationReason && (
        <p className="text-xs text-red-500 mb-3">
          Reason: {order.cancellationReason}
        </p>
      )}

      <div className="flex items-center justify-between">
        <span className="text-xs text-text-secondary">
          {formatDate(order.createdAt)}
        </span>

        {/* Transition buttons */}
        {allowed.length > 0 && (
          <div className="flex gap-2">
            {allowed.map((next) => {
              const config = STATUS_CONFIG[next];
              const isCancelling = next === "cancelled";
              return (
                <button
                  key={next}
                  type="button"
                  onClick={() => onTransition(order.id, next)}
                  disabled={transitioning === order.id}
                  className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                    isCancelling
                      ? "text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      : "text-text hover:bg-surface-alt"
                  }`}
                >
                  {config?.label ?? next}
                  <ChevronRight className="w-3 h-3" />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const [filter, setFilter] = useState("");
  const { orders, isLoading, mutate } = useAdminOrders(filter || undefined);
  const [transitioning, setTransitioning] = useState<number | null>(null);

  async function handleTransition(orderId: number, newStatus: string) {
    if (newStatus === "cancelled") {
      const reason = prompt("Cancellation reason (optional):");
      if (reason === null) return; // user hit cancel on prompt
      await doTransition(orderId, newStatus, reason || undefined);
    } else {
      await doTransition(orderId, newStatus);
    }
  }

  async function doTransition(
    orderId: number,
    newStatus: string,
    cancellationReason?: string,
  ) {
    setTransitioning(orderId);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(
        `${AGENT_URL}/api/admin/orders/${orderId}/status`,
        {
          method: "PATCH",
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus, cancellationReason }),
        },
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error?.message || "Failed to update order status");
        return;
      }
      mutate();
    } catch {
      alert("Failed to update order status");
    } finally {
      setTransitioning(null);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-red-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-display font-bold text-text">Orders</h1>
      </div>
      <p className="text-sm text-text-secondary mb-6">
        Track and manage the full order lifecycle.
      </p>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setFilter(opt.value)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
              filter === opt.value
                ? "bg-red-primary text-white"
                : "bg-surface border border-border text-text-secondary hover:text-text hover:border-border-hover"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {orders.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-8 text-center">
          <ClipboardList className="w-8 h-8 text-text-secondary mx-auto mb-3" />
          <p className="text-sm text-text-secondary">
            {filter ? `No orders with status '${filter}'.` : "No orders yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onTransition={handleTransition}
              transitioning={transitioning}
            />
          ))}
        </div>
      )}
    </div>
  );
}
