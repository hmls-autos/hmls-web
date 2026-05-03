import { useAuth } from "@/components/AuthProvider";

export const useApi = () => useAuth().api;
