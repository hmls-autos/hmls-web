"use client";

import { Check, ClipboardList, X as XIcon } from "lucide-react";
import { useState } from "react";
import { type PortalOrder, usePortalOrders } from "@/hooks/usePortal";
import { createClient } from "@/lib/supabase/client";

const AGENT_URL = process.env.NEXT_PUBLIC_AGENT_URL || "http://localhost:8080";

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  estimated: {
    label: "Pending Review",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  customer_approved: {
    label: "Approved",
    color:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  customer_declined: {
    label: "Declined",
    color:
      "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400",
  },
  quoted: {
    label: "Quote Ready",
    color:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  },
  accepted: {
    label: "Paid",
    color:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  declined: {
    label: "Quote Declined",
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
  onAction,
  loading,
}: {
  order: PortalOrder;
  onAction: (orderId: number, action: "approve" | "decline") => void;
  loading: number | null;
}) {
  const canAct = order.status === "estimated";

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
            {formatDate(order.createdAt)}
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

      {order.cancellationReason && (
        <p className="text-xs text-red-500 mb-3">
          Reason: {order.cancellationReason}
        </p>
      )}

      {/* Status timeline */}
      {Array.isArray(order.statusHistory) && order.statusHistory.length > 0 && (
        <div className="border-t border-border pt-3 mb-3">
          <p className="text-xs font-medium text-text-secondary mb-2">
            History
          </p>
          <div className="space-y-1">
            {order.statusHistory.map((entry, i) => (
              <div
                key={`${entry.status}-${i}`}
                className="flex items-center gap-2 text-xs text-text-secondary"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-text-secondary shrink-0" />
                <span>
                  {STATUS_CONFIG[entry.status]?.label ?? entry.status}
                </span>
                <span className="text-text-secondary/60">
                  {new Date(entry.timestamp).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Approve / Decline buttons */}
      {canAct && (
        <div className="flex gap-2 pt-3 border-t border-border">
          <button
            type="button"
            onClick={() => onAction(order.id, "approve")}
            disabled={loading === order.id}
            className="flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            <Check className="w-3.5 h-3.5" />
            Approve Estimate
          </button>
          <button
            type="button"
            onClick={() => onAction(order.id, "decline")}
            disabled={loading === order.id}
            className="flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
          >
            <XIcon className="w-3.5 h-3.5" />
            Decline
          </button>
        </div>
      )}
    </div>
  );
}

export default function PortalOrdersPage() {
  const { orders, isLoading, mutate } = usePortalOrders();
  const [loading, setLoading] = useState<number | null>(null);

  async function handleAction(orderId: number, action: "approve" | "decline") {
    if (action === "decline") {
      const reason = prompt("Reason for declining (optional):");
      if (reason === null) return;
      await doAction(orderId, action, reason || undefined);
    } else {
      await doAction(orderId, action);
    }
  }

  async function doAction(
    orderId: number,
    action: "approve" | "decline",
    reason?: string,
  ) {
    setLoading(orderId);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(
        `${AGENT_URL}/api/portal/me/orders/${orderId}/${action}`,
        {
          method: "POST",
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify(reason ? { reason } : {}),
        },
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error?.message || `Failed to ${action} order`);
        return;
      }
      mutate();
    } catch {
      alert(`Failed to ${action} order`);
    } finally {
      setLoading(null);
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
      <h1 className="text-2xl font-display font-bold text-text mb-1">
        My Orders
      </h1>
      <p className="text-sm text-text-secondary mb-8">
        Track your service orders from estimate to completion.
      </p>

      {orders.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-8 text-center">
          <ClipboardList className="w-8 h-8 text-text-secondary mx-auto mb-3" />
          <p className="text-text-secondary text-sm">
            No orders yet. Start a chat to get an estimate!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onAction={handleAction}
              loading={loading}
            />
          ))}
        </div>
      )}
    </div>
  );
}
