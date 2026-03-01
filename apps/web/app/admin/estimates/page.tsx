"use client";

import { ExternalLink, FileText, Trash2 } from "lucide-react";
import { useState } from "react";
import { useAdminEstimates } from "@/hooks/useAdmin";
import { createClient } from "@/lib/supabase/client";

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

const AGENT_URL = process.env.NEXT_PUBLIC_AGENT_URL || "http://localhost:8080";

export default function EstimatesPage() {
  const { estimates, isLoading, mutate } = useAdminEstimates();
  const [deleting, setDeleting] = useState<number | null>(null);

  async function handleDelete(id: number) {
    if (!confirm("Delete this estimate? This cannot be undone.")) return;
    setDeleting(id);
    try {
      const {
        data: { session },
      } = await createClient().auth.getSession();
      const res = await fetch(`${AGENT_URL}/api/admin/estimates/${id}`, {
        method: "DELETE",
        headers: session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : {},
      });
      if (!res.ok) throw new Error("Delete failed");
      mutate();
    } catch {
      alert("Failed to delete estimate.");
    } finally {
      setDeleting(null);
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
        Estimates
      </h1>
      <p className="text-sm text-text-secondary mb-6">
        All customer estimates.
      </p>

      {estimates.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-8 text-center">
          <FileText className="w-8 h-8 text-text-secondary mx-auto mb-3" />
          <p className="text-sm text-text-secondary">No estimates yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {estimates.map((e) => {
            const isExpired = new Date(e.expiresAt) < new Date();
            return (
              <div
                key={e.id}
                className="bg-surface border border-border rounded-xl p-5 hover:border-border-hover transition-colors"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-text">
                        {formatCents(e.priceRangeLow)} &ndash;{" "}
                        {formatCents(e.priceRangeHigh)}
                      </h3>
                      <a
                        href={`/api/estimates/${e.id}/pdf?token=${e.shareToken}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-text-secondary hover:text-red-primary transition-colors"
                        title="View PDF"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <button
                        type="button"
                        onClick={() => handleDelete(e.id)}
                        disabled={deleting === e.id}
                        className="text-text-secondary hover:text-red-500 transition-colors disabled:opacity-50"
                        title="Delete estimate"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-xs text-text-secondary mt-0.5">
                      {e.customer.name ?? "Unknown"}{" "}
                      {e.customer.email && (
                        <span>&middot; {e.customer.email}</span>
                      )}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${
                      e.convertedToQuoteId
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : isExpired
                          ? "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
                          : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    }`}
                  >
                    {e.convertedToQuoteId
                      ? "Converted"
                      : isExpired
                        ? "Expired"
                        : "Active"}
                  </span>
                </div>

                {/* Line items */}
                <div className="space-y-1 mb-3">
                  {e.items.map((item) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="text-text-secondary truncate">
                        {item.name}
                      </span>
                      <span className="text-text shrink-0 ml-2">
                        {formatCents(item.price)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-4 text-xs text-text-secondary">
                  <span>Created {formatDate(e.createdAt)}</span>
                  <span>
                    {isExpired ? "Expired" : "Expires"}{" "}
                    {formatDate(e.expiresAt)}
                  </span>
                </div>

                {e.notes && (
                  <p className="mt-3 text-xs text-text-secondary border-t border-border pt-3">
                    {e.notes}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
