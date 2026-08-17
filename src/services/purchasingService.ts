// API wrappers for the Purchasing + Accounts Payable workflow.
// Services contain API calls only; React Query orchestration lives in hooks.
import { apiClient } from "./apiClient";
import type {
  AttachmentInfo,
  Currency,
  Invoice,
  PurchaseRequest,
  PurchasingNotification,
  PurchasingSummary,
  RequestCreateInput,
  RequestDetail,
  TransitionInput,
} from "@/types/purchasing";

const BASE = "/api/purchasing";

export type RequestListFilters = {
  status?: string;
  request_type?: string;
  search?: string;
};

function buildQuery(filters: RequestListFilters): string {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.request_type) params.set("request_type", filters.request_type);
  if (filters.search) params.set("search", filters.search);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function getSummary() {
  return apiClient.get<PurchasingSummary>(`${BASE}/summary`);
}

export function listRequests(filters: RequestListFilters = {}) {
  return apiClient.get<PurchaseRequest[]>(`${BASE}/requests${buildQuery(filters)}`);
}

export function getRequest(id: string) {
  return apiClient.get<RequestDetail>(`${BASE}/requests/${id}`);
}

export function createRequest(payload: RequestCreateInput) {
  return apiClient.post<RequestDetail>(`${BASE}/requests`, payload);
}

export function extractProductInfo(id: string) {
  return apiClient.post<RequestDetail>(`${BASE}/requests/${id}/extract-product-info`, {});
}

export function transitionRequest(id: string, payload: TransitionInput) {
  return apiClient.post<RequestDetail>(`${BASE}/requests/${id}/transition`, payload);
}

export function listInvoices(paymentStatus?: string) {
  const qs = paymentStatus ? `?payment_status=${encodeURIComponent(paymentStatus)}` : "";
  return apiClient.get<Invoice[]>(`${BASE}/invoices${qs}`);
}

export function payInvoice(id: string) {
  return apiClient.patch<Invoice>(`${BASE}/invoices/${id}/pay`);
}

export function listNotifications(limit = 50) {
  return apiClient.get<PurchasingNotification[]>(`${BASE}/notifications?limit=${limit}`);
}

import type { Role } from "@/lib/AuthContext";

export function getPossibleApprovers(requestId: string) {
  return apiClient.get<Array<{ user_id: string; name: string }>>(`${BASE}/requests/${requestId}/approvers`);
}

export function getUsers() {
  return apiClient.get<Array<{ id: string; full_name?: string; email?: string; department?: string; [key: string]: any }>>("/api/configuration/users")
    .catch(() => apiClient.get<Array<{ id: string; full_name?: string; email?: string; department?: string; [key: string]: any }>>("/configuration/users"))
    .catch(() => []);
}

export function getRoles() {
  return apiClient.get<Role[]>("/api/configuration/roles")
    .catch(() => apiClient.get<Role[]>("/configuration/roles"))
    .catch(() => []);
}

export function getCurrencies() {
  return apiClient.get<Currency[]>(`${BASE}/currencies`).catch(() => []);
}

export function listAttachments(requestId: string) {
  return apiClient.get<AttachmentInfo[]>(`${BASE}/requests/${requestId}/attachments`);
}

export function uploadAttachments(requestId: string, files: File[]) {
  const form = new FormData();
  files.forEach((file) => form.append("files", file));
  return apiClient.post<AttachmentInfo[]>(`${BASE}/requests/${requestId}/attachments`, form);
}

export function deleteAttachment(requestId: string, fileId: string) {
  return apiClient.delete<void>(`${BASE}/requests/${requestId}/attachments/${fileId}`);
}

export function downloadAttachment(requestId: string, fileId: string, filename: string) {
  return apiClient.downloadFile(`${BASE}/requests/${requestId}/attachments/${fileId}/download`, filename);
}

export function updateRequest(id: string, payload: any) {
  return apiClient.put<RequestDetail>(`${BASE}/requests/${id}`, payload);
}

export function manualPrice(id: string, payload: { unit_price: number, currency: string }) {
  return apiClient.put<RequestDetail>(`${BASE}/requests/${id}/manual-price`, payload);
}
