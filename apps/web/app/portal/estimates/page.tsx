"use client";

import { Download, FileText } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Spinner } from "@/components/ui/Spinner";
import { usePortalEstimates } from "@/hooks/usePortal";
import { AGENT_URL } from "@/lib/config";
import { formatCents, formatDate } from "@/lib/format";

export default function EstimatesPage() {
  const { estimates, isLoading } = usePortalEstimates();

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
        title="Estimates"
        subtitle="Price estimates for requested services."
      />

      {estimates.length === 0 ? (
        <EmptyState icon={FileText} message="No estimates yet." />
      ) : (
        <div className="space-y-3">
          {estimates.map((e) => {
            const expired = new Date(e.expiresAt) < new Date();
            return (
              <div
                key={e.id}
                className="bg-surface border border-border rounded-xl p-5 hover:border-border-hover transition-colors"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-text">
                      Estimate #{e.id}
                    </h3>
                    <p className="text-xs text-text-secondary mt-0.5">
                      Created {formatDate(e.createdAt)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-text">
                      {formatCents(e.priceRangeLow)} &ndash;{" "}
                      {formatCents(e.priceRangeHigh)}
                    </p>
                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded-full inline-block mt-1 ${
                        expired
                          ? "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
                          : e.convertedToQuoteId
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      }`}
                    >
                      {expired
                        ? "Expired"
                        : e.convertedToQuoteId
                          ? "Quoted"
                          : "Active"}
                    </span>
                  </div>
                </div>

                {/* Linked order + PDF */}
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {e.orderId && (
                    <Link
                      href="/portal/orders"
                      className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 hover:underline"
                    >
                      Order #{e.orderId}
                      {e.orderStatus
                        ? ` · ${e.orderStatus.replace(/_/g, " ")}`
                        : ""}
                    </Link>
                  )}
                  {e.convertedToQuoteId && (
                    <Link
                      href="/portal/quotes"
                      className="text-xs px-2 py-0.5 rounded bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400 hover:underline"
                    >
                      Quote #{e.convertedToQuoteId}
                    </Link>
                  )}
                  <a
                    href={`${AGENT_URL}/api/estimates/${e.id}/pdf?token=${e.shareToken}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-text-secondary hover:text-text transition-colors ml-auto"
                  >
                    <Download className="w-3 h-3" />
                    PDF
                  </a>
                </div>

                {/* Line items */}
                <div className="border-t border-border pt-3 space-y-2">
                  {e.items.map((item) => (
                    <div
                      key={`${item.name}-${item.description ?? ""}`}
                      className="flex items-start justify-between gap-4 text-xs"
                    >
                      <div className="min-w-0">
                        <p className="text-text font-medium">{item.name}</p>
                        {item.description && (
                          <p className="text-text-secondary mt-0.5">
                            {item.description}
                          </p>
                        )}
                      </div>
                      <span className="text-text-secondary shrink-0">
                        {formatCents(item.price)}
                      </span>
                    </div>
                  ))}
                </div>

                {e.notes && (
                  <p className="mt-3 text-xs text-text-secondary border-t border-border pt-3">
                    {e.notes}
                  </p>
                )}

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border text-xs text-text-secondary">
                  <span>Expires {formatDate(e.expiresAt)}</span>
                  <span>Subtotal: {formatCents(e.subtotal)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
