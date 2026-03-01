"use client";

import { Calendar, Car, Clock, MapPin } from "lucide-react";
import { useState } from "react";
import { useAdminBookings } from "@/hooks/useAdmin";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

const statusStyles: Record<string, string> = {
  requested:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  confirmed: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  in_progress:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  completed:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  cancelled:
    "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400",
};

const statusFilters = [
  { value: "", label: "All" },
  { value: "requested", label: "Requested" },
  { value: "confirmed", label: "Confirmed" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export default function BookingsPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const { bookings, isLoading } = useAdminBookings(statusFilter || undefined);

  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-text mb-1">
        Bookings
      </h1>
      <p className="text-sm text-text-secondary mb-6">
        All service appointments.
      </p>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {statusFilters.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setStatusFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              statusFilter === f.value
                ? "bg-red-primary text-white"
                : "bg-surface border border-border text-text-secondary hover:text-text hover:border-border-hover"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-red-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-8 text-center">
          <Calendar className="w-8 h-8 text-text-secondary mx-auto mb-3" />
          <p className="text-sm text-text-secondary">
            {statusFilter
              ? "No bookings with this status."
              : "No bookings yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => {
            const vehicle = [b.vehicleYear, b.vehicleMake, b.vehicleModel]
              .filter(Boolean)
              .join(" ");
            return (
              <div
                key={b.id}
                className="bg-surface border border-border rounded-xl p-5 hover:border-border-hover transition-colors"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-text">
                      {b.serviceType}
                    </h3>
                    <p className="text-xs text-text-secondary mt-0.5">
                      {b.customer.name ?? "Unknown"}{" "}
                      {b.customer.email && (
                        <span className="text-text-secondary">
                          &middot; {b.customer.email}
                        </span>
                      )}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize whitespace-nowrap ${
                      statusStyles[b.status] ?? statusStyles.requested
                    }`}
                  >
                    {b.status.replace(/_/g, " ")}
                  </span>
                </div>

                <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-text-secondary">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(b.scheduledAt)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {formatTime(b.scheduledAt)} &middot; {b.durationMinutes} min
                  </span>
                  {vehicle && (
                    <span className="flex items-center gap-1.5">
                      <Car className="w-3.5 h-3.5" />
                      {vehicle}
                    </span>
                  )}
                  {b.location && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" />
                      {b.location}
                    </span>
                  )}
                </div>

                {b.internalNotes && (
                  <p className="mt-3 text-xs text-text-secondary border-t border-border pt-3">
                    <span className="font-medium text-text">Internal:</span>{" "}
                    {b.internalNotes}
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
