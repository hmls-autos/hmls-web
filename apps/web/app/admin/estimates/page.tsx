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

async function getAuthHeaders(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await createClient().auth.getSession();
  return session?.access_token
    ? { Authorization: `Bearer ${session.access_token}` }
    : {};
}

export default function EstimatesPage() {
  const { estimates, isLoading, mutate } = useAdminEstimates();
  const [deleting, setDeleting] = useState<number | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [batchDeleting, setBatchDeleting] = useState(false);

  function toggleSelect(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === estimates.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(estimates.map((e) => e.id)));
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this estimate? This cannot be undone.")) return;
    setDeleting(id);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${AGENT_URL}/api/admin/estimates/${id}`, {
        method: "DELETE",
        headers,
      });
      if (!res.ok) throw new Error("Delete failed");
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      mutate();
    } catch {
      alert("Failed to delete estimate.");
    } finally {
      setDeleting(null);
    }
  }

  async function handleBatchDelete() {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    if (
      !confirm(
        `Delete ${ids.length} estimate${ids.length > 1 ? "s" : ""}? This cannot be undone.`,
      )
    )
      return;
    setBatchDeleting(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${AGENT_URL}/api/admin/estimates/batch`, {
        method: "DELETE",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      if (!res.ok) throw new Error("Batch delete failed");
      setSelected(new Set());
      mutate();
    } catch {
      alert("Failed to delete estimates.");
    } finally {
      setBatchDeleting(false);
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
        <h1 className="text-2xl font-display font-bold text-text">Estimates</h1>
      </div>
      <p className="text-sm text-text-secondary mb-6">
        All customer estimates.
      </p>

      {/* Batch action bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 mb-4 px-4 py-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <span className="text-sm font-medium text-red-700 dark:text-red-400">
            {selected.size} selected
          </span>
          <button
            type="button"
            onClick={handleBatchDelete}
            disabled={batchDeleting}
            className="ml-auto flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {batchDeleting ? "Deleting..." : "Delete selected"}
          </button>
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="text-sm text-text-secondary hover:text-text"
          >
            Cancel
          </button>
        </div>
      )}

      {estimates.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-8 text-center">
          <FileText className="w-8 h-8 text-text-secondary mx-auto mb-3" />
          <p className="text-sm text-text-secondary">No estimates yet.</p>
        </div>
      ) : (
        <>
          {/* Select all */}
          <div className="flex items-center gap-2 mb-3">
            <input
              type="checkbox"
              checked={
                selected.size === estimates.length && estimates.length > 0
              }
              onChange={toggleAll}
              className="w-4 h-4 rounded border-border text-red-primary focus:ring-red-primary/30 cursor-pointer"
            />
            <span className="text-xs text-text-secondary">Select all</span>
          </div>

          <div className="space-y-3">
            {estimates.map((e) => {
              const isExpired = new Date(e.expiresAt) < new Date();
              const isSelected = selected.has(e.id);
              return (
                <div
                  key={e.id}
                  className={`bg-surface border rounded-xl p-5 hover:border-border-hover transition-colors ${
                    isSelected
                      ? "border-red-300 dark:border-red-700"
                      : "border-border"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(e.id)}
                        className="w-4 h-4 mt-0.5 rounded border-border text-red-primary focus:ring-red-primary/30 cursor-pointer"
                      />
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
                  <div className="space-y-1 mb-3 ml-7">
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

                  <div className="flex items-center gap-4 text-xs text-text-secondary ml-7">
                    <span>Created {formatDate(e.createdAt)}</span>
                    <span>
                      {isExpired ? "Expired" : "Expires"}{" "}
                      {formatDate(e.expiresAt)}
                    </span>
                  </div>

                  {e.notes && (
                    <p className="mt-3 text-xs text-text-secondary border-t border-border pt-3 ml-7">
                      {e.notes}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
