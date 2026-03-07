"use client";

import { CreditCard, Receipt } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Spinner } from "@/components/ui/Spinner";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { usePortalQuotes } from "@/hooks/usePortal";
import { formatCents, formatDate } from "@/lib/format";
import { QUOTE_STATUS } from "@/lib/status";

export default function QuotesPage() {
  const { quotes, isLoading } = usePortalQuotes();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Quotes"
        subtitle="Formal quotes and invoices for your services."
      />

      {quotes.length === 0 ? (
        <EmptyState icon={Receipt} message="No quotes yet." />
      ) : (
        <div className="space-y-3">
          {quotes.map((q) => (
            <div
              key={q.id}
              className="bg-surface border border-border rounded-xl p-5 hover:border-border-hover transition-colors"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-text">
                    Quote #{q.id}
                  </h3>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Created {formatDate(q.createdAt)}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-bold text-text">
                    {formatCents(q.totalAmount)}
                  </p>
                  <span className="inline-block mt-1">
                    <StatusBadge status={q.status} config={QUOTE_STATUS} />
                  </span>
                </div>
              </div>

              {/* Line items */}
              <div className="border-t border-border pt-3 space-y-2">
                {q.items.map((item) => (
                  <div
                    key={`${item.service}-${item.description ?? ""}`}
                    className="flex items-start justify-between gap-4 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="text-text font-medium">{item.service}</p>
                      {item.description && (
                        <p className="text-text-secondary mt-0.5">
                          {item.description}
                        </p>
                      )}
                    </div>
                    <span className="text-text-secondary shrink-0">
                      {formatCents(item.amount ?? 0)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Links + payment */}
              <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-border">
                {q.bookingId && (
                  <Link
                    href="/portal/bookings"
                    className="text-xs px-2 py-0.5 rounded bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 hover:underline"
                  >
                    Booking #{q.bookingId}
                  </Link>
                )}
                {q.stripePaymentUrl &&
                  (q.status === "sent" || q.status === "draft") && (
                    <a
                      href={q.stripePaymentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors ml-auto"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      Pay Now
                    </a>
                  )}
              </div>

              {q.expiresAt && (
                <p className="mt-2 text-xs text-text-secondary">
                  Expires {formatDate(q.expiresAt)}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
