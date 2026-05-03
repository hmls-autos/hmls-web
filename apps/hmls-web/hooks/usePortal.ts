import useSWR from "swr";
import { useApi } from "@/hooks/useApi";
import { portalPaths } from "@/lib/api-paths";
import { useStableArray } from "@/lib/swr-stable";
import type { Customer, Order, OrderEvent } from "@/lib/types";

export type PortalCustomer = Customer;
export type PortalOrder = Order;

/** Shape returned by GET /api/portal/me/orders/:id — order + events only
 *  (no customer join; portal route is customer-scoped). */
export type PortalOrderDetail = {
  order: Order;
  events: OrderEvent[];
};

export function usePortalCustomer() {
  const api = useApi();
  const { data, error, isLoading, mutate } = useSWR(
    portalPaths.me(),
    (p: string) => api.get<PortalCustomer>(p),
  );
  return { customer: data, isLoading, isError: !!error, mutate };
}

export function usePortalOrders() {
  const api = useApi();
  const { data, error, isLoading, mutate } = useSWR(
    portalPaths.orders(),
    (p: string) => api.get<PortalOrder[]>(p),
  );
  return { orders: useStableArray(data), isLoading, isError: !!error, mutate };
}

export function usePortalOrder(id: string | number | null) {
  const api = useApi();
  const path = id != null ? portalPaths.order(id) : null;
  const { data, error, isLoading, mutate } = useSWR(path, (p: string) =>
    api.get<PortalOrderDetail>(p),
  );
  return { data, isLoading, isError: !!error, mutate };
}

/**
 * Bookings view = orders with scheduledAt set. The server filters server-side.
 */
export function usePortalBookings() {
  const api = useApi();
  const { data, error, isLoading, mutate } = useSWR(
    portalPaths.bookings(),
    (p: string) => api.get<PortalOrder[]>(p),
  );
  return {
    bookings: useStableArray(data),
    isLoading,
    isError: !!error,
    mutate,
  };
}
