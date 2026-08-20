import { toast } from "sonner";
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

export function useRequestDetail(id: string | undefined) {
  return useQuery({
    queryKey: id ? keys.request(id) : keys.all,
    queryFn: () => (id ? purchasing.getRequest(id) : Promise.reject("no id")),
    enabled: Boolean(id),
  });
}

export function useCreateRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: RequestCreateInput) => purchasing.createRequest(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.all });
      
    },
    onError: (err: any) => {
      toast.error(err?.message ?? "Failed to create request");
    },
  });
}

export function useExtractProductInfo(requestId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id?: string | void) => purchasing.extractProductInfo(typeof id === 'string' && id ? id : (requestId || "")),
    onSuccess: (data) => {
      qc.setQueryData(keys.request(data.request.id), data);
      qc.invalidateQueries({ queryKey: keys.all });
      toast.success("Product info refreshed");
    },
    onError: (err: any) => {
      toast.error(err?.message ?? "Extraction failed");
    },
  });
}

export function useTransitionRequest(requestId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: TransitionInput) => purchasing.transitionRequest(requestId, payload),
    onSuccess: (data) => {
      qc.setQueryData(keys.request(requestId), data);
      qc.invalidateQueries({ queryKey: keys.all });
      },
    onError: (err: any) => {
      toast.error(err?.message ?? "Action failed");
    },
  });
}

export function useInvoices(paymentStatus?: string) {
  return useQuery({
    queryKey: keys.invoices(paymentStatus),
    queryFn: () => purchasing.listInvoices(paymentStatus),
  });
}

export function usePayInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => purchasing.payInvoice(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.all });
      toast.success("Invoice marked as paid");
    },
    onError: (err: any) => {
      toast.error(err?.message ?? "Failed to update invoice");
    },
  });
}

export function usePurchasingNotifications() {
  return useQuery({
    queryKey: keys.notifications(),
    queryFn: () => purchasing.listNotifications(),
    refetchInterval: 15_000,
  });
}

export function usePossibleApprovers(requestId: string | undefined) {
  return useQuery({
    queryKey: ["purchasing", "approvers", requestId],
    queryFn: () => (requestId ? purchasing.getPossibleApprovers(requestId) : Promise.resolve([])),
    enabled: Boolean(requestId),
  });
}

export function useUsersList() {
  return useQuery({
    queryKey: ["configuration", "users"],
    queryFn: purchasing.getUsers,
    staleTime: 5 * 60 * 1000,
  });
}

export function useRolesList() {
  return useQuery({
    queryKey: ["configuration", "roles"],
    queryFn: purchasing.getRoles,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCurrencies() {
  return useQuery({
    queryKey: ["purchasing", "currencies"],
    queryFn: purchasing.getCurrencies,
    staleTime: 60 * 60 * 1000,
  });
}

export function useGLCodes(search?: string) {
  return useQuery({
    queryKey: ["purchasing", "gl-codes", search],
    queryFn: () => purchasing.getGLCodes(search),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAttachments(requestId: string | undefined) {
  return useQuery({
    queryKey: ["purchasing", "attachments", requestId],
    queryFn: () => (requestId ? purchasing.listAttachments(requestId) : Promise.resolve([])),
    enabled: Boolean(requestId),
  });
}

export function useUploadAttachments(requestId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (files: File[]) => purchasing.uploadAttachments(requestId, files),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchasing", "attachments", requestId] });
      qc.invalidateQueries({ queryKey: keys.request(requestId) });
      toast.success("Files attached");
    },
    onError: (err: any) => {
      toast.error(err?.message ?? "Upload failed");
    },
  });
}

export function useDeleteAttachment(requestId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (fileId: string) => purchasing.deleteAttachment(requestId, fileId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchasing", "attachments", requestId] });
      qc.invalidateQueries({ queryKey: keys.request(requestId) });
      toast.success("Attachment deleted");
    },
    onError: (err: any) => {
      toast.error(err?.message ?? "Delete failed");
    },
  });
}

export function useUpdateRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => purchasing.updateRequest(id, data),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: keys.request(variables.id) });
      qc.invalidateQueries({ queryKey: keys.all });
    },
  });
}

export function useManualPrice(requestId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { unit_price: number; currency: string }) => purchasing.manualPrice(requestId, payload),
    onSuccess: (data) => {
      qc.setQueryData(keys.request(requestId), data);
      qc.invalidateQueries({ queryKey: keys.all });
      toast.success("Manual price updated");
    },
    onError: (err: any) => {
      toast.error(err?.message ?? "Failed to update price");
    },
  });
}

export const usePurchaseRequest = useRequestDetail;


export function useExtractQuote() {
  return useMutation({
    mutationFn: (file: File) => purchasing.extractQuote(file),
  });
}
