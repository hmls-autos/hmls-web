import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

interface LineItem {
  name: string;
  description: string;
  price: number;
}

export interface Booking {
  id: number;
  customerId: number;
  serviceType: string;
  status: string;
  scheduledAt: string;
  durationMinutes: number;
  location: string | null;
  vehicleYear: string | null;
  vehicleMake: string | null;
  vehicleModel: string | null;
  internalNotes: string | null;
  customerName?: string | null;
  createdAt: string;
}

export interface Estimate {
  id: number;
  customerId: number;
  items: LineItem[];
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
  estimateId: number | null;
  items: LineItem[];
  totalAmount: number;
  status: string;
  stripePaymentUrl: string | null;
  createdAt: string;
}

interface DashboardStats {
  customers: number;
  bookings: number;
  estimates: number;
  quotes: number;
  revenue30d: number;
}

interface Customer {
  id: number;
  name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  vehicleInfo: { make?: string; model?: string; year?: string } | null;
  role: string;
  createdAt: string;
}

interface DashboardData {
  stats: DashboardStats;
  upcomingBookings: Booking[];
  recentCustomers: Customer[];
  pendingQuotes: (Quote & {
    customer?: { name: string | null; email: string | null };
  })[];
}

export type AdminBooking = Booking & {
  customer: { name: string | null; email: string | null; phone: string | null };
};

export type AdminEstimate = Estimate & {
  customer: { name: string | null; email: string | null };
};

export type AdminQuote = Quote & {
  customer: { name: string | null; email: string | null };
};

interface CustomerDetail {
  customer: Customer;
  bookings: Booking[];
  estimates: Estimate[];
  quotes: Quote[];
}

export function useAdminDashboard() {
  const { data, error, isLoading } = useSWR<DashboardData>(
    "/api/admin/dashboard",
    fetcher,
  );
  return { data, isLoading, isError: !!error };
}

export function useAdminCustomers(search?: string) {
  const params = search ? `?search=${encodeURIComponent(search)}` : "";
  const { data, error, isLoading } = useSWR<Customer[]>(
    `/api/admin/customers${params}`,
    fetcher,
  );
  return { customers: data ?? [], isLoading, isError: !!error };
}

export function useAdminCustomer(id: number | null) {
  const { data, error, isLoading } = useSWR<CustomerDetail>(
    id ? `/api/admin/customers/${id}` : null,
    fetcher,
  );
  return { data, isLoading, isError: !!error };
}

export function useAdminBookings(status?: string) {
  const params = status ? `?status=${encodeURIComponent(status)}` : "";
  const { data, error, isLoading } = useSWR<AdminBooking[]>(
    `/api/admin/bookings${params}`,
    fetcher,
  );
  return { bookings: data ?? [], isLoading, isError: !!error };
}

export function useAdminEstimates() {
  const { data, error, isLoading, mutate } = useSWR<AdminEstimate[]>(
    "/api/admin/estimates",
    fetcher,
  );
  return { estimates: data ?? [], isLoading, isError: !!error, mutate };
}

export interface Order {
  id: number;
  customerId: number;
  estimateId: number | null;
  quoteId: number | null;
  bookingId: number | null;
  status: string;
  statusHistory: { status: string; timestamp: string; actor: string }[];
  adminNotes: string | null;
  cancellationReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export type AdminOrder = Order & {
  customer: { name: string | null; email: string | null; phone: string | null };
};

export function useAdminOrders(status?: string) {
  const params = status ? `?status=${encodeURIComponent(status)}` : "";
  const { data, error, isLoading, mutate } = useSWR<AdminOrder[]>(
    `/api/admin/orders${params}`,
    fetcher,
  );
  return { orders: data ?? [], isLoading, isError: !!error, mutate };
}

export function useAdminQuotes(status?: string) {
  const params = status ? `?status=${encodeURIComponent(status)}` : "";
  const { data, error, isLoading } = useSWR<AdminQuote[]>(
    `/api/admin/quotes${params}`,
    fetcher,
  );
  return { quotes: data ?? [], isLoading, isError: !!error };
}
