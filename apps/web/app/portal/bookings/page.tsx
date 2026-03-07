"use client";

import { Calendar, Car, Clock, MapPin } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Spinner } from "@/components/ui/Spinner";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { usePortalBookings } from "@/hooks/usePortal";
import { formatDate, formatTime } from "@/lib/format";
import { BOOKING_STATUS } from "@/lib/status";

export default function BookingsPage() {
  const { bookings, isLoading } = usePortalBookings();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Bookings"
        subtitle="Your scheduled and past service appointments."
      />

      {bookings.length === 0 ? (
        <EmptyState icon={Calendar} message="No bookings yet." />
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
                    {b.symptomDescription && (
                      <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">
                        {b.symptomDescription}
                      </p>
                    )}
                  </div>
                  <StatusBadge status={b.status} config={BOOKING_STATUS} />
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

                {b.customerNotes && (
                  <p className="mt-3 text-xs text-text-secondary border-t border-border pt-3">
                    <span className="font-medium text-text">Note:</span>{" "}
                    {b.customerNotes}
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
