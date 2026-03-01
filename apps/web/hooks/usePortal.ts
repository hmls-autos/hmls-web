import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

interface VehicleInfo {
  make?: string;
  model?: string;
  year?: string;
}

export interface PortalCustomer {
  id: number;
  name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  vehicleInfo: VehicleInfo | null;
  stripeCustomerId: string | null;
  createdAt: string;
}

export interface Booking {
  id: number;
  customerId: number;
  providerId: number | null;
  serviceType: string;
  serviceItems: unknown[];
  symptomDescription: string | null;
  vehicleYear: number | null;
  vehicleMake: string | null;
  vehicleModel: string | null;
  vehicleMileage: number | null;
  estimateId: number | null;
  scheduledAt: string;
  appointmentEnd: string | null;
  durationMinutes: number;
  location: string | null;
  customerName: string | null;
  customerNotes: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Estimate {
  id: number;
  customerId: number;
  items: { name: string; description: string; price: number }[];
  subtotal: number;
  priceRangeLow: number;
  priceRangeHigh: number;
  notes: string | null;
  shareToken: string;
  validDays: number;
  expiresAt: string;
  convertedToQuoteId: number | null;
  createdAt: string;
}

export interface Quote {
  id: number;
  customerId: number;
  bookingId: number | null;
  stripeQuoteId: string | null;
  stripeInvoiceId: string | null;
  items: { service: string; description: string; amount: number }[];
  totalAmount: number;
  status: string;
  expiresAt: string | null;
  createdAt: string;
}

export function usePortalCustomer() {
  const { data, error, isLoading, mutate } = useSWR<PortalCustomer>(
    "/api/portal/me",
    fetcher,
  );
  return { customer: data, isLoading, isError: !!error, mutate };
}

export function usePortalBookings() {
  const { data, error, isLoading } = useSWR<Booking[]>(
    "/api/portal/me/bookings",
    fetcher,
  );
  return { bookings: data ?? [], isLoading, isError: !!error };
}

export function usePortalEstimates() {
  const { data, error, isLoading } = useSWR<Estimate[]>(
    "/api/portal/me/estimates",
    fetcher,
  );
  return { estimates: data ?? [], isLoading, isError: !!error };
}

export function usePortalQuotes() {
  const { data, error, isLoading } = useSWR<Quote[]>(
    "/api/portal/me/quotes",
    fetcher,
  );
  return { quotes: data ?? [], isLoading, isError: !!error };
}
