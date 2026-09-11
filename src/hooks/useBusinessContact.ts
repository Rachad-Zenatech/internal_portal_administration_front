import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { financeService } from "../services/financeService";
import type {
  BusinessContactCreateRequest,
  BusinessContactUpdateRequest,
} from "../types/businessContact";

export const BUSINESS_CONTACTS_QUERY_KEY = "businessContacts";

export function useBusinessContacts(search?: string, side?: "ar" | "ap" | "all") {
  return useQuery({
    queryKey: [BUSINESS_CONTACTS_QUERY_KEY, search || "", side || "all"],
    queryFn: async () => {
      const result = await financeService.getPayableContacts({ search });
      if (side === "ar") {
        const filtered = result.items.filter(
          (c) => c.contact_type === "customer" || c.account_number === "1100"
        );
        return {
          ...result,
          items: filtered,
          total: filtered.length,
        };
      }
      if (side === "ap") {
        const filtered = result.items.filter(
          (c) => c.contact_type !== "customer" && c.account_number !== "1100"
        );
        return {
          ...result,
          items: filtered,
          total: filtered.length,
        };
      }
      return result;
    },
  });
}

export function useCreateBusinessContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: BusinessContactCreateRequest) =>
      financeService.createPayableContact(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BUSINESS_CONTACTS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ["purchasing_vendors"] });
    },
  });
}

export function useUpdateBusinessContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: BusinessContactUpdateRequest }) =>
      financeService.updatePayableContact(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BUSINESS_CONTACTS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ["purchasing_vendors"] });
    },
  });
}

export function useDeleteBusinessContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => financeService.deletePayableContact(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BUSINESS_CONTACTS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ["purchasing_vendors"] });
    },
  });
}

export function useBatchDeleteBusinessContacts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: number[]) => financeService.batchDeletePayableContacts(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BUSINESS_CONTACTS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ["purchasing_vendors"] });
    },
  });
}

export function useSyncBusinessContacts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => financeService.syncPayableContacts(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BUSINESS_CONTACTS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ["purchasing_vendors"] });
    },
  });
}
