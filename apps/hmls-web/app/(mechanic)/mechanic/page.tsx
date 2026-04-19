"use client";

import { CheckCircle, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { type MechanicBooking, useMechanicBookings } from "@/hooks/useMechanic";
import { formatDate, formatTime } from "@/lib/format";
import { BOOKING_STATUS } from "@/lib/status";
import { cn } from "@/lib/utils";

function vehicleLabel(b: MechanicBooking) {
  return [b.vehicleYear, b.vehicleMake, b.vehicleModel]
    .filter(Boolean)
    .join(" ");
}

function groupByDay(bookings: MechanicBooking[]) {
  const map = new Map<string, MechanicBooking[]>();
  for (const b of bookings) {
    const key = new Date(b.scheduledAt).toDateString();
    const existing = map.get(key);
    if (existing) {
      existing.push(b);
    } else {
      map.set(key, [b]);
    }
  }
  for (const [key, group] of map) {
    map.set(
      key,
      group.sort(
        (a, b) =>
          new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
      ),
    );
  }
  return map;
}

function BookingCard({
  booking,
  onConfirm,
  onReject,
}: {
  booking: MechanicBooking;
  onConfirm?: () => void;
  onReject?: () => void;
}) {
  const vehicle = vehicleLabel(booking);
  const time = formatTime(booking.scheduledAt);
  const statusConfig = BOOKING_STATUS[booking.status];
  const showActions = booking.status === "requested";

  return (
    <Card className="py-0">
      <CardContent className="p-4 flex flex-col sm:flex-row sm:items-start gap-3">
        <div className="shrink-0 text-center sm:w-16">
          <span className="text-xs font-semibold text-muted-foreground bg-muted border border-border rounded-lg px-2 py-1 inline-block">
            {time}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-foreground">
              #{booking.id}
            </span>
            {statusConfig && (
              <Badge className={cn("border-transparent", statusConfig.color)}>
                {statusConfig.label}
              </Badge>
            )}
          </div>
          <p className="text-sm text-foreground truncate">
            {booking.customerName ?? "Customer"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {booking.serviceType}
          </p>
          {vehicle && (
            <p className="text-xs text-muted-foreground">{vehicle}</p>
          )}
          {booking.location && (
            <p className="text-xs text-muted-foreground truncate">
              {booking.location}
            </p>
          )}
          {booking.customerNotes && (
            <p className="text-xs text-muted-foreground mt-1 italic truncate">
              &ldquo;{booking.customerNotes}&rdquo;
            </p>
          )}
        </div>

        {showActions && (
          <div className="flex gap-2 shrink-0 sm:flex-col sm:items-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={onConfirm}
              className="text-green-700 bg-green-100 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/40"
            >
              <CheckCircle className="size-3.5" />
              Confirm
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onReject}
              className="text-red-700 bg-red-100 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40"
            >
              <XCircle className="size-3.5" />
              Reject
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function MechanicBookingsPage() {
  // Show everything from today onward
  const fromDate = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }, []);

  const { bookings, isLoading, confirmBooking, rejectBooking } =
    useMechanicBookings(fromDate);

  const pending = bookings.filter((b) => b.status === "requested");
  const confirmed = bookings.filter((b) => b.status !== "requested");
  const confirmedByDay = groupByDay(confirmed);
  const sortedDays = [...confirmedByDay.keys()].sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime(),
  );

  const [rejectTarget, setRejectTarget] = useState<MechanicBooking | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  async function handleConfirm(id: number) {
    try {
      setActionError(null);
      await confirmBooking(id);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Failed to confirm");
    }
  }

  async function handleReject(notes: string) {
    if (!rejectTarget) return;
    try {
      setIsSubmitting(true);
      setActionError(null);
      await rejectBooking(rejectTarget.id, notes || undefined);
      setRejectTarget(null);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Failed to reject");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-10">
        <Skeleton className="h-8 w-40" />
        <div className="space-y-2">
          {["s1", "s2", "s3"].map((id) => (
            <Skeleton key={id} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <h1 className="text-2xl font-display font-bold text-foreground">
        My Bookings
      </h1>

      {actionError && <p className="text-sm text-red-600">{actionError}</p>}

      <section>
        <h2 className="text-sm font-semibold text-foreground mb-3">
          Awaiting confirmation ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nothing to review right now.
          </p>
        ) : (
          <div className="space-y-2">
            {pending.map((b) => (
              <BookingCard
                key={b.id}
                booking={b}
                onConfirm={() => handleConfirm(b.id)}
                onReject={() => setRejectTarget(b)}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold text-foreground mb-3">Upcoming</h2>
        {confirmed.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No confirmed bookings.
          </p>
        ) : (
          <div className="space-y-6">
            {sortedDays.map((day) => (
              <div key={day}>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  {formatDate(new Date(day).toISOString())}
                </h3>
                <div className="space-y-2">
                  {confirmedByDay.get(day)?.map((b) => (
                    <BookingCard key={b.id} booking={b} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {rejectTarget && (
        <RejectDialog
          booking={rejectTarget}
          open={!!rejectTarget}
          onOpenChange={(o) => !o && setRejectTarget(null)}
          onConfirm={handleReject}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}

function RejectDialog({
  booking,
  open,
  onOpenChange,
  onConfirm,
  isSubmitting,
}: {
  booking: MechanicBooking;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (notes: string) => void;
  isSubmitting: boolean;
}) {
  const [notes, setNotes] = useState("");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject Booking</DialogTitle>
          <DialogDescription>
            Booking #{booking.id} &mdash; {booking.customerName ?? "Customer"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <label
            className="block text-sm font-medium text-foreground"
            htmlFor="mechanic-reject-notes"
          >
            Reason (optional)
          </label>
          <Textarea
            id="mechanic-reject-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="e.g. Outside service area, conflict..."
            className="resize-none"
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => onConfirm(notes)}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Rejecting..." : "Reject Booking"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
