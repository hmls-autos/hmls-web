import useSWR from "swr";
import { authFetch, fetcher } from "@/lib/fetcher";
import type { Booking } from "@/lib/types";

export interface ProviderSelf {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  isActive: boolean;
  timezone: string;
}

export interface WeeklyAvailabilityRow {
  id: number;
  providerId: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface ScheduleOverride {
  id: number;
  providerId: number;
  overrideDate: string;
  isAvailable: boolean;
  startTime: string | null;
  endTime: string | null;
  reason: string | null;
}

export function useMechanicMe() {
  const { data, error, isLoading } = useSWR<ProviderSelf>(
    "/api/mechanic/me",
    fetcher,
  );
  return { provider: data, isLoading, isError: !!error };
}

export function useMechanicAvailability() {
  const { data, error, isLoading, mutate } = useSWR<WeeklyAvailabilityRow[]>(
    "/api/mechanic/availability",
    fetcher,
  );

  async function saveAvailability(
    rows: Array<
      Pick<WeeklyAvailabilityRow, "dayOfWeek" | "startTime" | "endTime">
    >,
  ) {
    await authFetch("/api/mechanic/availability", {
      method: "PUT",
      body: JSON.stringify({ availability: rows }),
    });
    await mutate();
  }

  return {
    availability: data ?? [],
    isLoading,
    isError: !!error,
    mutate,
    saveAvailability,
  };
}

export function useMechanicOverrides(from?: string, to?: string) {
  const p = new URLSearchParams();
  if (from) p.set("from", from);
  if (to) p.set("to", to);
  const qs = p.toString() ? `?${p.toString()}` : "";
  const { data, error, isLoading, mutate } = useSWR<ScheduleOverride[]>(
    `/api/mechanic/overrides${qs}`,
    fetcher,
  );

  async function addOverride(payload: {
    overrideDate: string;
    isAvailable: boolean;
    startTime?: string;
    endTime?: string;
    reason?: string;
  }) {
    await authFetch("/api/mechanic/overrides", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    await mutate();
  }

  async function deleteOverride(id: number) {
    await authFetch(`/api/mechanic/overrides/${id}`, { method: "DELETE" });
    await mutate();
  }

  return {
    overrides: data ?? [],
    isLoading,
    isError: !!error,
    mutate,
    addOverride,
    deleteOverride,
  };
}

export type MechanicBooking = Booking & {
  staffNotes?: string | null;
};

export function useMechanicBookings(from?: string, to?: string) {
  const p = new URLSearchParams();
  if (from) p.set("from", from);
  if (to) p.set("to", to);
  const qs = p.toString() ? `?${p.toString()}` : "";
  const { data, error, isLoading, mutate } = useSWR<MechanicBooking[]>(
    `/api/mechanic/bookings${qs}`,
    fetcher,
  );

  async function confirmBooking(id: number) {
    await authFetch(`/api/mechanic/bookings/${id}/confirm`, { method: "POST" });
    await mutate();
  }

  async function rejectBooking(id: number, staffNotes?: string) {
    await authFetch(`/api/mechanic/bookings/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ staffNotes }),
    });
    await mutate();
  }

  return {
    bookings: data ?? [],
    isLoading,
    isError: !!error,
    mutate,
    confirmBooking,
    rejectBooking,
  };
}
