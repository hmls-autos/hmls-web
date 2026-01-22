import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

interface VehicleInfo {
  make?: string;
  model?: string;
  year?: string;
}

interface Customer {
  id: number;
  name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  vehicleInfo: VehicleInfo | null;
  stripeCustomerId: string | null;
  createdAt: string;
}

export function useCustomer(id: number | null) {
  const { data, error, isLoading, mutate } = useSWR<Customer>(
    id ? `/api/customers/${id}` : null,
    fetcher,
  );

  return {
    customer: data,
    isLoading,
    isError: !!error,
    mutate,
  };
}
