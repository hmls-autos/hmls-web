"use client";

import { X } from "lucide-react";
import { useState } from "react";

interface AddVehicleModalProps {
  error: string | null;
  onClose: () => void;
  onAdd: (data: { year: string; make: string; model: string; nickname: string }) => void;
}

export function AddVehicleModal({ error, onClose, onAdd }: AddVehicleModalProps) {
  const [formData, setFormData] = useState({
    year: "",
    make: "",
    model: "",
    nickname: "",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
      <div className="w-full max-w-lg bg-surface rounded-t-2xl p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Add Vehicle</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-text-secondary hover:text-text"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && <p className="text-sm text-red-500 mb-3">{error}</p>}

        <div className="space-y-3 mb-4">
          <input
            type="number"
            placeholder="Year (optional)"
            value={formData.year}
            onChange={(e) =>
              setFormData({ ...formData, year: e.target.value })
            }
            className="w-full bg-surface-alt border border-border rounded-xl px-4 py-2.5 text-sm text-text placeholder-text-secondary/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
          <input
            type="text"
            placeholder="Make (e.g. Toyota)"
            value={formData.make}
            onChange={(e) =>
              setFormData({ ...formData, make: e.target.value })
            }
            className="w-full bg-surface-alt border border-border rounded-xl px-4 py-2.5 text-sm text-text placeholder-text-secondary/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
          <input
            type="text"
            placeholder="Model (e.g. Camry)"
            value={formData.model}
            onChange={(e) =>
              setFormData({ ...formData, model: e.target.value })
            }
            className="w-full bg-surface-alt border border-border rounded-xl px-4 py-2.5 text-sm text-text placeholder-text-secondary/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
          <input
            type="text"
            placeholder="Nickname (optional)"
            value={formData.nickname}
            onChange={(e) =>
              setFormData({ ...formData, nickname: e.target.value })
            }
            className="w-full bg-surface-alt border border-border rounded-xl px-4 py-2.5 text-sm text-text placeholder-text-secondary/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
        </div>

        <button
          type="button"
          onClick={() => onAdd(formData)}
          disabled={!formData.make || !formData.model}
          className="w-full py-3 rounded-xl bg-primary text-white font-medium disabled:opacity-30 transition-opacity"
        >
          Add Vehicle
        </button>
      </div>
    </div>
  );
}
