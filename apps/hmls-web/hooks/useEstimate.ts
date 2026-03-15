import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

interface LineItem {
  name: string;
  description: string;
  price: number;
}

interface Estimate {
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
  createdAt: string;
}

export function useEstimate(id: number | null) {
  const { data, error, isLoading, mutate } = useSWR<Estimate>(
    id ? `/api/estimates/${id}` : null,
    fetcher,
  );

  return {
    estimate: data,
    isLoading,
    isError: !!error,
    mutate,
  };
}
