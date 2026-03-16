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
    <div className="flex items-center justify-between bg-surface-alt rounded-xl p-4 border border-border">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Car className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="font-medium">
            {v.nickname || `${v.year ?? ""} ${v.make} ${v.model}`.trim()}
          </p>
          {v.nickname && (
            <p className="text-sm text-text-secondary">
              {[v.year, v.make, v.model].filter(Boolean).join(" ")}
            </p>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={() => onDelete(v.id)}
        className="p-2 text-text-secondary hover:text-red-500 transition-colors"
        aria-label="Delete vehicle"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
