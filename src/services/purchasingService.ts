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
  WireTransferInput,
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

export async function getSummary(): Promise<PurchasingSummary> {
  return apiClient.get<PurchasingSummary>("/api/purchasing/summary");
}

export async function listDepartments(): Promise<string[]> {
  return apiClient.get<string[]>("/api/purchasing/departments");
}

export function listRequests(filters: RequestListFilters = {}) {
  return apiClient.get<PurchaseRequest[]>(`${BASE}/requests${buildQuery(filters)}`);
}

export function listMyApprovals(status?: string) {
  const qs = status ? `?status=${encodeURIComponent(status)}` : "";
  return apiClient.get<PurchaseRequest[]>(`${BASE}/my-approvals${qs}`);
}

export function getRequest(id: string) {
  return apiClient.get<RequestDetail>(`${BASE}/requests/${id}`);
}

export function extractQuote(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return apiClient.post<any>(`${BASE}/quotes/extract`, formData);
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
  return apiClient.get<Array<{ id: string; full_name?: string; email?: string; department?: string; is_active?: boolean; [key: string]: any }>>("/api/configuration/users?is_active=true")
    .then((users) => (Array.isArray(users) ? users.filter((u) => u.is_active !== false) : []))
    .catch(() => apiClient.get<Array<{ id: string; full_name?: string; email?: string; department?: string; is_active?: boolean; [key: string]: any }>>("/configuration/users?is_active=true"))
    .then((users) => (Array.isArray(users) ? users.filter((u) => u.is_active !== false) : []))
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

import type { GLCodeOption } from "@/types/chartOfAccount";

export function getGLCodes(search?: string) {
  const qs = search ? `?search=${encodeURIComponent(search)}` : "";
  return apiClient.get<GLCodeOption[]>(`${BASE}/gl-codes${qs}`);
}

export function exportQuickBooksXlsx(ids?: string[], status?: string, year?: number | null, month?: number | null) {
  const params = new URLSearchParams();
  if (ids && ids.length > 0) {
    params.set("ids", ids.join(","));
  }
  if (status && status !== "ALL") {
    params.set("status", status);
  }
  if (year) {
    params.set("year", String(year));
  }
  if (month) {
    params.set("month", String(month));
  }
  const qs = params.toString() ? `?${params.toString()}` : "";

  const nameParts = ["QuickBooks_Export"];
  if (year) nameParts.push(String(year));
  if (month) nameParts.push(String(month).padStart(2, "0"));
  if (status && status !== "ALL" && status !== "COMPLETED") nameParts.push(status);
  const filename = `${nameParts.join("_")}.xlsx`;

  return apiClient.downloadFile(`${BASE}/export/quickbooks/xlsx${qs}`, filename);
}

export function exportSingleRequestQuickBooksXlsx(requestId: string) {
  return apiClient.downloadFile(`${BASE}/requests/${requestId}/export/quickbooks/xlsx`, `QuickBooks_Export_REQ_${requestId}.xlsx`);
}

export function getTreasuryUsers() {
  return apiClient.get<Array<{ id: string; full_name: string; email: string; department?: string }>>(BASE + "/treasury-users");
}

export function updateWireTransfer(requestId: string | number, payload: WireTransferInput) {
  return apiClient.put<RequestDetail>(`${BASE}/requests/${requestId}/wire-transfer`, payload);
}
