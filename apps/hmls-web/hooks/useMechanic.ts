import type {
  Order,
  Provider,
  ProviderAvailability,
  ProviderScheduleOverride,
} from "@hmls/shared/db/types";
import useSWR from "swr";
import { useApi } from "@/hooks/useApi";
import { mechanicPaths } from "@/lib/api-paths";
import { useStableArray } from "@/lib/swr-stable";

export type ProviderSelf = Provider;
export type WeeklyAvailabilityRow = ProviderAvailability;
export type ScheduleOverride = ProviderScheduleOverride;
export type MechanicOrder = Order;

export function useMechanicMe() {
  const api = useApi();
  const path = mechanicPaths.me();
  const { data, error, isLoading } = useSWR(path, (p: string) =>
    api.get<ProviderSelf>(p),
  );
  return { provider: data, isLoading, isError: !!error };
}

export function useMechanicAvailability() {
  const api = useApi();
  const path = mechanicPaths.availability();
  const { data, error, isLoading, mutate } = useSWR(path, (p: string) =>
    api.get<WeeklyAvailabilityRow[]>(p),
  );

  async function saveAvailability(
    rows: Array<
      Pick<WeeklyAvailabilityRow, "dayOfWeek" | "startTime" | "endTime">
    >,
  ) {
    await api.put(path, { availability: rows });
    await mutate();
  }

  return {
    availability: useStableArray(data),
    isLoading,
    isError: !!error,
    mutate,
    saveAvailability,
  };
}

export function useMechanicOverrides(from?: string, to?: string) {
  const api = useApi();
  const p = new URLSearchParams();
  if (from) p.set("from", from);
  if (to) p.set("to", to);
  const qs = p.toString() ? `?${p.toString()}` : "";
  const path = `${mechanicPaths.overrides()}${qs}`;
  const { data, error, isLoading, mutate } = useSWR(path, (key: string) =>
    api.get<ScheduleOverride[]>(key),
  );

  async function addOverride(payload: {
    overrideDate: string;
    isAvailable: boolean;
    startTime?: string;
    endTime?: string;
    reason?: string;
  }) {
    await api.post(mechanicPaths.overrides(), payload);
    await mutate();
  }

  async function deleteOverride(id: number) {
    await api.delete(`${mechanicPaths.overrides()}/${id}`);
    await mutate();
  }

  return {
    overrides: useStableArray(data),
    isLoading,
    isError: !!error,
    mutate,
    addOverride,
    deleteOverride,
  };
}

export function useMechanicOrders(from?: string, to?: string) {
  const api = useApi();
  const p = new URLSearchParams();
  if (from) p.set("from", from);
  if (to) p.set("to", to);
  const qs = p.toString() ? `?${p.toString()}` : "";
  const path = `${mechanicPaths.orders()}${qs}`;
  const { data, error, isLoading, mutate } = useSWR(path, (key: string) =>
    api.get<MechanicOrder[]>(key),
  );

  return {
    orders: useStableArray(data),
    isLoading,
    isError: !!error,
    mutate,
  };
}
