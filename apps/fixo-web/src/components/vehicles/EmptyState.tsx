"use client";

import { Car } from "lucide-react";

interface EmptyStateProps {
  onAdd: () => void;
}

export function EmptyState({ onAdd }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-card">
        <Car className="h-5 w-5 text-foreground" strokeWidth={1.75} />
      </div>
      <h2 className="mb-1.5 text-base font-semibold tracking-tight">
        No vehicles yet
      </h2>
      <p className="mb-6 max-w-xs text-[13px] text-muted-foreground">
        Add your vehicle for personalized diagnostics.
      </p>
      <button
        type="button"
        onClick={onAdd}
        className="inline-flex items-center justify-center rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
      >
        Add vehicle
      </button>
    </div>
  );
}
