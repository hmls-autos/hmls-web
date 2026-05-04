"use client";

import { Car, Trash2 } from "lucide-react";

interface Vehicle {
  id: string;
  year: number | null;
  make: string;
  model: string;
  vin: string | null;
  nickname: string | null;
}

interface VehicleCardProps {
  vehicle: Vehicle;
  onDelete: (id: string) => void;
}

export function VehicleCard({ vehicle: v, onDelete }: VehicleCardProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:border-border-hover">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-muted">
          <Car className="h-4 w-4 text-foreground" strokeWidth={1.75} />
        </div>
        <div>
          <p className="text-sm font-medium tracking-tight">
            {v.nickname || `${v.year ?? ""} ${v.make} ${v.model}`.trim()}
          </p>
          {v.nickname && (
            <p className="text-xs text-muted-foreground">
              {[v.year, v.make, v.model].filter(Boolean).join(" ")}
            </p>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={() => onDelete(v.id)}
        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-red-600 dark:hover:text-red-500"
        aria-label="Delete vehicle"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
