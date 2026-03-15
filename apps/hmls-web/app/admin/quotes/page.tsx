"use client";

import { DollarSign, Receipt } from "lucide-react";
import { useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAdminQuotes } from "@/hooks/useAdmin";
import { formatCents, formatDate } from "@/lib/format";
import { QUOTE_STATUS } from "@/lib/status";

const statusFilters = [
  { value: "", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "accepted", label: "Accepted" },
  { value: "paid", label: "Paid" },
  { value: "declined", label: "Declined" },
];

export default function QuotesPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const { quotes, isLoading } = useAdminQuotes(statusFilter || undefined);

  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-text mb-1">Quotes</h1>
      <p className="text-sm text-text-secondary mb-6">
        All customer quotes and payment status.
      </p>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {statusFilters.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setStatusFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              statusFilter === f.value
                ? "bg-red-primary text-white"
                : "bg-surface border border-border text-text-secondary hover:text-text hover:border-border-hover"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner />
        </div>
      ) : quotes.length === 0 ? (
        <EmptyState
          icon={Receipt}
          message={
            statusFilter ? "No quotes with this status." : "No quotes yet."
          }
        />
      ) : (
        <div className="space-y-3">
          {quotes.map((q) => (
            <div
              key={q.id}
              className="bg-surface border border-border rounded-xl p-5 hover:border-border-hover transition-colors"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-text-secondary" />
                    <h3 className="text-sm font-semibold text-text">
                      {formatCents(q.totalAmount)}
                    </h3>
                  </div>
                  <p className="text-xs text-text-secondary mt-0.5">
                    {q.customer?.name ?? "Unknown"}{" "}
                    {q.customer?.email && (
                      <span>&middot; {q.customer.email}</span>
                    )}
                  </p>
                </div>
                <StatusBadge status={q.status} config={QUOTE_STATUS} />
              </div>

              {/* Line items */}
              {q.items && q.items.length > 0 && (
                <div className="space-y-1 mb-3">
                  {q.items.map((item) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="text-text-secondary truncate">
                        {item.name}
                      </span>
                      <span className="text-text shrink-0 ml-2">
                        {formatCents(item.price ?? 0)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-4 text-xs text-text-secondary">
                <span>Created {formatDate(q.createdAt)}</span>
                {q.stripePaymentUrl && q.status !== "paid" && (
                  <a
                    href={q.stripePaymentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-red-primary hover:text-red-dark font-medium"
                  >
                    Payment link
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
