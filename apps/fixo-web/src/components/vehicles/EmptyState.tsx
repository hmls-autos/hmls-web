"use client";

import { Car } from "lucide-react";

interface EmptyStateProps {
  onAdd: () => void;
}

export function EmptyState({ onAdd }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <Car className="w-8 h-8 text-primary" />
      </div>
      <h2 className="text-lg font-semibold mb-2">No vehicles yet</h2>
      <p className="text-text-secondary text-sm max-w-xs mb-6">
        Add your vehicle for personalized diagnostics.
      </p>
      <button
        type="button"
        onClick={onAdd}
        className="px-6 py-2.5 rounded-xl bg-primary text-white font-medium"
      >
        Add Vehicle
      </button>
    </div>
  );
}
