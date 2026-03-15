"use client";

import { ChevronRight, ClipboardList } from "lucide-react";
import { useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { type AdminOrder, useAdminOrders } from "@/hooks/useAdmin";
import { authFetch } from "@/lib/fetcher";
import { formatDateTime } from "@/lib/format";
import { ORDER_STATUS, ORDER_TRANSITIONS } from "@/lib/status";

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

function OrderCard({
  order,
  onTransition,
  transitioning,
}: {
  order: AdminOrder;
  onTransition: (orderId: number, newStatus: string) => void;
  transitioning: number | null;
}) {
  const allowed = ORDER_TRANSITIONS[order.status] ?? [];

  return (
    <div className="bg-surface border border-border rounded-xl p-5 hover:border-border-hover transition-colors">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-text">
              Order #{order.id}
            </h3>
            <StatusBadge status={order.status} config={ORDER_STATUS} />
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
          <a
            href="/admin/estimates"
            className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 hover:underline"
          >
            Estimate #{order.estimateId}
          </a>
        )}
        {order.quoteId && (
          <a
            href="/admin/quotes"
            className="text-xs px-2 py-0.5 rounded bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400 hover:underline"
          >
            Quote #{order.quoteId}
          </a>
        )}
        {order.bookingId && (
          <a
            href="/admin/bookings"
            className="text-xs px-2 py-0.5 rounded bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 hover:underline"
          >
            Booking #{order.bookingId}
          </a>
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
          {formatDateTime(order.createdAt)}
        </span>

        {/* Transition buttons */}
        {allowed.length > 0 && (
          <div className="flex gap-2">
            {allowed.map((next) => {
              const config = ORDER_STATUS[next];
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
      await authFetch(`/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus, cancellationReason }),
      });
      mutate();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to update order status");
    } finally {
      setTransitioning(null);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner />
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
        <EmptyState
          icon={ClipboardList}
          message={
            filter ? `No orders with status '${filter}'.` : "No orders yet."
          }
        />
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
