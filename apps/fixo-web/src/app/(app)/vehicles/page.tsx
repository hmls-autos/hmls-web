"use client";

import { Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { AddVehicleModal } from "@/components/vehicles/AddVehicleModal";
import { EmptyState } from "@/components/vehicles/EmptyState";
import { VehicleCard } from "@/components/vehicles/VehicleCard";
import { AGENT_URL } from "@/lib/config";

interface Vehicle {
  id: string;
  year: number | null;
  make: string;
  model: string;
  vin: string | null;
  nickname: string | null;
}

export default function VehiclesPage() {
  const { session } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVehicles = useCallback(async () => {
    if (!session?.access_token) return;
    try {
      const res = await fetch(`${AGENT_URL}/vehicles`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setVehicles(data.vehicles ?? []);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [session?.access_token]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const handleAdd = async (formData: {
    year: string;
    make: string;
    model: string;
    nickname: string;
  }) => {
    if (!session?.access_token || !formData.make || !formData.model) return;
    setError(null);

    try {
      const res = await fetch(`${AGENT_URL}/vehicles`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          year: formData.year ? parseInt(formData.year, 10) : undefined,
          make: formData.make,
          model: formData.model,
          nickname: formData.nickname || undefined,
        }),
      });

      if (res.status === 403) {
        const data = await res.json();
        setError(data.message || "Upgrade required");
        return;
      }

      if (res.ok) {
        setShowForm(false);
        await fetchVehicles();
      }
    } catch {
      setError("Failed to add vehicle");
    }
  };

  const handleDelete = async (id: string) => {
    if (!session?.access_token) return;
    try {
      const res = await fetch(`${AGENT_URL}/vehicles/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        setVehicles((v) => v.filter((veh) => veh.id !== id));
      }
    } catch {
      // silently fail
    }
  };

  return (
    <div className="flex flex-col h-dvh">
      <header className="sticky top-0 z-10 bg-surface/80 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-semibold">Vehicles</h1>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Add
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 pb-24">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : vehicles.length === 0 ? (
          <EmptyState onAdd={() => setShowForm(true)} />
        ) : (
          <div className="space-y-3">
            {vehicles.map((v) => (
              <VehicleCard key={v.id} vehicle={v} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <AddVehicleModal
          error={error}
          onClose={() => {
            setShowForm(false);
            setError(null);
          }}
          onAdd={handleAdd}
        />
      )}
    </div>
  );
}
