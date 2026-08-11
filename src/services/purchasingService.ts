// API wrappers for the Purchasing + Accounts Payable workflow.
// Services contain API calls only; React Query orchestration lives in hooks.
import { apiClient } from "./apiClient";
import type {
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

export function getPossibleApprovers(requestId: string) {
  return apiClient.get<Array<{ user_id: string; name: string }>>(`${BASE}/requests/${requestId}/approvers`);
}

export function getUsers() {
  return apiClient.get<Array<{ id: string; full_name?: string; email?: string }>>("/api/configuration/users")
    .catch(() => apiClient.get<Array<{ id: string; full_name?: string; email?: string }>>("/configuration/users"))
    .catch(() => []);
}
