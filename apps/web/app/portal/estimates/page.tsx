"use client";

import { FileText } from "lucide-react";
import { usePortalEstimates } from "@/hooks/usePortal";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatCents(cents: number) {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

export default function EstimatesPage() {
  const { estimates, isLoading } = usePortalEstimates();

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
        Estimates
      </h1>
      <p className="text-sm text-text-secondary mb-8">
        Price estimates for requested services.
      </p>

      {estimates.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-8 text-center">
          <FileText className="w-8 h-8 text-text-secondary mx-auto mb-3" />
          <p className="text-text-secondary text-sm">No estimates yet.</p>
        </div>
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
