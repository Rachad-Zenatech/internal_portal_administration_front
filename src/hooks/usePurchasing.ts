import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as purchasing from "@/services/purchasingService";
import type { RequestListFilters } from "@/services/purchasingService";
import type { RequestCreateInput, TransitionInput } from "@/types/purchasing";

const keys = {
  all: ["purchasing"] as const,
  summary: () => [...keys.all, "summary"] as const,
  requests: (filters: RequestListFilters) => [...keys.all, "requests", filters] as const,
  request: (id: string) => [...keys.all, "request", id] as const,
  invoices: (paymentStatus?: string) => [...keys.all, "invoices", paymentStatus ?? "all"] as const,
  notifications: () => [...keys.all, "notifications"] as const,
};

export function usePurchasingSummary() {
  return useQuery({
    queryKey: keys.summary(),
    queryFn: purchasing.getSummary,
  });
}

export function usePurchaseRequests(filters: RequestListFilters = {}) {
  return useQuery({
    queryKey: keys.requests(filters),
    queryFn: () => purchasing.listRequests(filters),
  });
}

export function usePurchaseRequest(id: string | undefined) {
  return useQuery({
    queryKey: keys.request(id ?? ""),
    queryFn: () => purchasing.getRequest(id as string),
    enabled: !!id,
  });
}

export function useInvoices(paymentStatus?: string) {
  return useQuery({
    queryKey: keys.invoices(paymentStatus),
    queryFn: () => purchasing.listInvoices(paymentStatus),
  });
}

export function usePurchasingNotifications() {
  return useQuery({
    queryKey: keys.notifications(),
    queryFn: () => purchasing.listNotifications(),
  });
}

function useInvalidateAll() {
  const qc = useQueryClient();
  // Invalidate any query whose key starts with the purchasing namespace.
  // `exact: false` ensures that queries like ['purchasing','requests',…] are refreshed.
  // Also explicitly invalidate the summary to refresh open request count, and tasks queries.
  return () => {
    qc.invalidateQueries({ queryKey: keys.all, exact: false });
    qc.invalidateQueries({ queryKey: keys.summary() });
    qc.invalidateQueries({ queryKey: ["tasks"], exact: false });
  };
}

export function useCreateRequest() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: (payload: RequestCreateInput) => purchasing.createRequest(payload),
    onSuccess: invalidate,
  });
}

export function useTransitionRequest(id: string) {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: (payload: TransitionInput) => {
      const cleanPayload = payload.purchase_order
        ? { ...payload, purchase_order: (({ expected_delivery_date, ...rest }) => rest)(payload.purchase_order) }
        : payload;
      return purchasing.transitionRequest(id, cleanPayload);
    },
    onSuccess: invalidate,
  });
}

export function usePayInvoice() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: (invoiceId: string) => purchasing.payInvoice(invoiceId),
    onSuccess: invalidate,
  });
}

export function usePossibleApprovers(requestId: string | undefined) {
  return useQuery({
    queryKey: [...keys.all, "possible-approvers", requestId ?? ""] as const,
    queryFn: () => purchasing.getPossibleApprovers(requestId as string),
    enabled: !!requestId,
  });
}

export function useUsersList() {
  return useQuery({
    queryKey: ["users-autocomplete-list"],
    queryFn: () => purchasing.getUsers(),
  });
}

export function useExtractProductInfo(id: string) {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: () => purchasing.extractProductInfo(id),
    onSuccess: invalidate,
  });
}
