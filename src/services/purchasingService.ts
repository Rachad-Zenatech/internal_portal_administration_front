import { compressAttachmentBeforeUpload, compressAttachmentsBeforeUpload } from "@/utils/compressAttachment";
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
  project?: string;
};

function buildQuery(filters: RequestListFilters): string {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.request_type) params.set("request_type", filters.request_type);
  if (filters.search) params.set("search", filters.search);
  if (filters.project) params.set("project", filters.project);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export async function getSummary(): Promise<PurchasingSummary> {
  return apiClient.get<PurchasingSummary>("/api/purchasing/summary");
}

export async function listDepartments(): Promise<string[]> {
  return apiClient.get<string[]>("/api/purchasing/departments");
}

export async function listProjects(): Promise<string[]> {
  return apiClient.get<string[]>("/api/purchasing/projects");
}

export const getProjects = listProjects;

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

export interface ApproverCandidateUser {
  id: string;
  full_name: string;
  email: string;
  department?: string;
  job_title?: string;
  departments?: string[];
  is_request_department?: boolean;
  is_department_approver: boolean;
  is_current_approver: boolean;
  is_requester: boolean;
}

export interface DepartmentApproverGroup {
  department: string;
  group_name: string;
  is_request_department: boolean;
  approvers: ApproverCandidateUser[];
}

export interface Level1CandidatesResponse {
  current_approver_id?: string;
  current_approver_name?: string;
  department?: string;
  department_approver_ids: string[];
  approvers?: ApproverCandidateUser[];
  department_groups: DepartmentApproverGroup[];
  candidates: ApproverCandidateUser[];
}

export function getLevel1Candidates(requestId: string) {
  return apiClient.get<Level1CandidatesResponse>(`${BASE}/requests/${requestId}/level-1-candidates`);
}

export function reassignLevel1Approver(requestId: string, approverId: string, reason?: string) {
  return apiClient.post<RequestDetail>(`${BASE}/requests/${requestId}/reassign-level1-approver`, {
    approver_id: approverId,
    reason,
  });
}

export async function extractQuote(file: File) {
  const optimizedFile = await compressAttachmentBeforeUpload(file);
  const formData = new FormData();
  formData.append("file", optimizedFile);
  return apiClient.post<any>(`${BASE}/quotes/extract`, formData, {
    actionLabel: "Extracting Multi-Part Quote",
    actionSubtitle: "Analyzing PDF layout, OCR text, and extracting line items...",
  });
}

export function createRequest(payload: RequestCreateInput) {
  return apiClient.post<RequestDetail>(`${BASE}/requests`, payload);
}

export function extractProductInfo(id: string) {
  return apiClient.post<RequestDetail>(`${BASE}/requests/${id}/extract-product-info`, {}, {
    actionLabel: "Extracting Product Details",
    actionSubtitle: "Retrieving product title, vendor, and price from URL...",
  });
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

export function getExchangeRate(fromCurrency: string, toCurrency: string = "USD") {
  return apiClient.get<import("@/types/purchasing").ExchangeRateResult>(
    `${BASE}/exchange-rate?from_currency=${encodeURIComponent(fromCurrency)}&to_currency=${encodeURIComponent(toCurrency)}`
  );
}

export function listAttachments(requestId: string) {
  return apiClient.get<AttachmentInfo[]>(`${BASE}/requests/${requestId}/attachments`);
}

export async function uploadAttachments(requestId: string, files: File[]) {
  const optimizedFiles = await compressAttachmentsBeforeUpload(files);
  const form = new FormData();
  optimizedFiles.forEach((file) => form.append("files", file));
  return apiClient.post<AttachmentInfo[]>(`${BASE}/requests/${requestId}/attachments`, form);
}

export function deleteAttachment(requestId: string, fileId: string) {
  return apiClient.delete<void>(`${BASE}/requests/${requestId}/attachments/${fileId}`);
}

export function downloadAttachment(requestId: string, fileId: string, filename: string) {
  return apiClient.downloadFile(`${BASE}/requests/${requestId}/attachments/${fileId}/download`, filename);
}

export function getAttachmentBlob(requestId: string, fileId: string): Promise<Blob> {
  return apiClient.getBlob(`${BASE}/requests/${requestId}/attachments/${fileId}/download`);
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

export function exportQuickBooksCsv(
  ids?: string[],
  status?: string,
  year?: number | null,
  month?: number | null,
  start_datetime?: string | null,
  end_datetime?: string | null,
  txn_type?: "EXPENSE" | "BILL"
) {
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
  if (start_datetime) {
    params.set("start_datetime", start_datetime);
  }
  if (end_datetime) {
    params.set("end_datetime", end_datetime);
  }
  if (txn_type) {
    params.set("txn_type", txn_type);
  }
  const qs = params.toString() ? `?${params.toString()}` : "";

  const nameParts = ["QuickBooks_Export"];
  if (txn_type) nameParts.push(txn_type === "BILL" ? "Bills" : "Expenses");
  if (year) nameParts.push(String(year));
  if (month) nameParts.push(String(month).padStart(2, "0"));
  if (status && status !== "ALL" && status !== "COMPLETED" && status !== "ORDERED / PURCHASED") nameParts.push(status);
  const filename = `${nameParts.join("_")}.csv`;

  return apiClient.downloadFile(`${BASE}/export/quickbooks/csv${qs}`, filename);
}

export function exportSingleRequestQuickBooksCsv(requestId: string) {
  return apiClient.downloadFile(`${BASE}/requests/${requestId}/export/quickbooks/csv`, `QuickBooks_Export_REQ_${requestId}.csv`);
}

export function exportQuickBooksXlsx(
  ids?: string[],
  status?: string,
  year?: number | null,
  month?: number | null,
  start_datetime?: string | null,
  end_datetime?: string | null,
  txn_type?: "EXPENSE" | "BILL"
) {
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
  if (start_datetime) {
    params.set("start_datetime", start_datetime);
  }
  if (end_datetime) {
    params.set("end_datetime", end_datetime);
  }
  if (txn_type) {
    params.set("txn_type", txn_type);
  }
  const qs = params.toString() ? `?${params.toString()}` : "";

  const nameParts = ["QuickBooks_Export"];
  if (txn_type) nameParts.push(txn_type === "BILL" ? "Bills" : "Expenses");
  if (year) nameParts.push(String(year));
  if (month) nameParts.push(String(month).padStart(2, "0"));
  if (status && status !== "ALL" && status !== "COMPLETED" && status !== "ORDERED / PURCHASED") nameParts.push(status);
  const filename = `${nameParts.join("_")}.xlsx`;

  return apiClient.downloadFile(`${BASE}/export/quickbooks/xlsx${qs}`, filename);
}

export function exportQuickBooksBundle(
  ids?: string[],
  status?: string,
  year?: number | null,
  month?: number | null,
  start_datetime?: string | null,
  end_datetime?: string | null
) {
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
  if (start_datetime) {
    params.set("start_datetime", start_datetime);
  }
  if (end_datetime) {
    params.set("end_datetime", end_datetime);
  }
  const qs = params.toString() ? `?${params.toString()}` : "";

  const nameParts = ["QuickBooks_Export_Bundle"];
  if (year) nameParts.push(String(year));
  if (month) nameParts.push(String(month).padStart(2, "0"));
  if (status && status !== "ALL" && status !== "COMPLETED" && status !== "ORDERED / PURCHASED") nameParts.push(status);
  const filename = `${nameParts.join("_")}.zip`;

  return apiClient.downloadFile(`${BASE}/export/quickbooks/bundle${qs}`, filename);
}

export function exportQuickBooksDocuments(
  ids?: string[],
  status?: string,
  year?: number | null,
  month?: number | null,
  start_datetime?: string | null,
  end_datetime?: string | null
) {
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
  if (start_datetime) {
    params.set("start_datetime", start_datetime);
  }
  if (end_datetime) {
    params.set("end_datetime", end_datetime);
  }
  const qs = params.toString() ? `?${params.toString()}` : "";

  const nameParts = ["QuickBooks_Documents"];
  if (year) nameParts.push(String(year));
  if (month) nameParts.push(String(month).padStart(2, "0"));
  if (status && status !== "ALL" && status !== "COMPLETED" && status !== "ORDERED / PURCHASED") nameParts.push(status);
  const filename = `${nameParts.join("_")}.zip`;

  return apiClient.downloadFile(`${BASE}/export/quickbooks/documents${qs}`, filename);
}

export function exportQuickBooksReconciliation(
  ids?: string[],
  status?: string,
  year?: number | null,
  month?: number | null,
  start_datetime?: string | null,
  end_datetime?: string | null
) {
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
  if (start_datetime) {
    params.set("start_datetime", start_datetime);
  }
  if (end_datetime) {
    params.set("end_datetime", end_datetime);
  }
  const qs = params.toString() ? `?${params.toString()}` : "";

  const nameParts = ["QuickBooks_Reconciliation"];
  if (year) nameParts.push(String(year));
  if (month) nameParts.push(String(month).padStart(2, "0"));
  if (status && status !== "ALL" && status !== "COMPLETED" && status !== "ORDERED / PURCHASED") nameParts.push(status);
  const filename = `${nameParts.join("_")}.csv`;

  return apiClient.downloadFile(`${BASE}/export/quickbooks/reconciliation${qs}`, filename);
}

export function exportSingleRequestQuickBooksXlsx(requestId: string) {
    return apiClient.downloadFile(`${BASE}/requests/${requestId}/export/quickbooks/xlsx`, `QuickBooks_Export_REQ_${requestId}.xlsx`);
  }

  export function exportSingleRequestQuickBooksBundle(requestId: string) {
    return apiClient.downloadFile(`${BASE}/requests/${requestId}/export/quickbooks/bundle`, `QuickBooks_Export_REQ_${requestId}_Bundle.zip`);
  }

  export function getTreasuryUsers() {
  return apiClient.get<Array<{ id: string; full_name: string; email: string; department?: string }>>(BASE + "/treasury-users");
}

export function getAPUsers() {
  return apiClient.get<Array<{ id: string; full_name: string; email: string; department?: string }>>(BASE + "/ap-users");
}

export function getKnownVendors() {
  return apiClient.get<string[]>(BASE + "/vendors");
}

export function getPayFromEntities() {
  return apiClient.get<string[]>(BASE + "/pay-from-entities");
}

export function updateWireTransfer(requestId: string | number, payload: WireTransferInput) {
  return apiClient.put<RequestDetail>(`${BASE}/requests/${requestId}/wire-transfer`, payload);
}


export interface BankingCountry {
  code: string;
  name: string;
  flag: string;
  has_iban: boolean;
  iban_length?: number | null;
  in_sepa: boolean;
}

export interface BankingFieldSpec {
  id: string;
  label: string;
  required: boolean;
  placeholder?: string;
  type?: string;
  has_same_as_wire?: boolean;
}

export interface CountryBankingSpec {
  code: string;
  name: string;
  has_iban: boolean;
  iban_length?: number | null;
  in_sepa: boolean;
  bban_positions: Record<string, { start: number; end: number }>;
  default_bank_fields: BankingFieldSpec[];
  default_clearing_fields: BankingFieldSpec[];
}

export function getBankingCountries() {
  return apiClient.get<BankingCountry[]>(`${BASE}/banking-specs/countries`);
}

export function getCountryBankingSpec(country: string) {
  return apiClient.get<CountryBankingSpec>(`${BASE}/banking-specs/spec?country=${encodeURIComponent(country)}`);
}


export interface QuickBooksPreviewPart {
  line_num?: number;
  description: string;
  amount: number;
  formatted_amount?: string;
  category?: string;
  account_id?: string | null;
  account_name?: string | null;
  acct_num?: string | null;
  class?: string | null;
  customer?: string | null;
}

export interface QuickBooksPreviewItem {
  request_id: number;
  id?: string | number;
  workflow_id?: string;
  is_ar?: boolean;
  bank_name?: string;
  account_number?: string;
  product_name: string;
  raw_payee: string;
  amount: number;
  formatted_amount: string;
  payment_date: string;
  due_date?: string;
  txn_date_api: string;
  due_date_api?: string;
  payment_method: string;
  category: string;
  department: string;
  class?: string;
  location: string;
  from_location?: string;
  status?: string;
  request_status?: string;
  ref_no: string;
  doc_number: string;
  memo: string;
  type?: "m&a" | "recurring" | "purchase" | string;
  is_ma?: boolean;
  transaction_type?: string;
  is_recurring?: boolean;
  transaction_category?: "EXPENSE" | "BILL" | string;
  source_portal?: string | null;
  project_name?: string | null;
  location_id?: string | null;
  location_resolution?: {
    id?: string | null;
    name?: string;
    status?: string;
  };
  vendor_resolution: {
    id?: string | null;
    name: string;
    status: string;
    badge: string;
    notes: string;
  };
  expense_account_resolution: {
    id?: string | null;
    name: string;
    acct_num?: string | null;
    account_type?: string;
    status: string;
    badge: string;
    notes: string;
  };
  payment_account_resolution: {
    id?: string | null;
    name: string;
    account_type?: string;
    payment_type: string;
    status: string;
    notes: string;
  };
  is_already_synced: boolean;
  existing_purchase_id?: string | null;
  existing_bill_id?: string | null;
  readiness: 'READY' | 'READY_WITH_NOTES' | 'ALREADY_SYNCED' | 'ERROR';
  quote_number?: string;
  attachments?: Array<{
    id: string;
    filename: string;
    content_type: string;
    size_bytes?: number;
    synced_to_qbo?: boolean;
  }>;
  parts_count?: number;
  parts?: QuickBooksPreviewPart[];
  attachments_count?: number;
  validation_notes: string[];
  validation_errors: string[];
  projected_payload: any;
  projected_expense_payload?: any;
  projected_bill_payload?: any;
  projected_invoice_payload?: any;
}

export interface QuickBooksPreviewResponse {
  status: string;
  connection: {
    is_configured: boolean;
    is_connected: boolean;
    realm_id?: string;
    company_name?: string;
    environment?: string;
  };
  summary: {
    total_items: number;
    total_amount: number;
    formatted_total_amount: string;
    ready_count: number;
    already_synced_count: number;
    error_count: number;
    expenses_count?: number;
    bills_count?: number;
    ma_count?: number;
    company_name?: string;
    realm_id?: string;
    environment?: string;
  };
  items: QuickBooksPreviewItem[];
}

export function getQuickBooksPreview(params?: { request_ids?: number[]; status?: string; year?: number | null; month?: number | null; start_date?: string | null; end_date?: string | null; start_datetime?: string | null; end_datetime?: string | null }) {
  return apiClient.post<QuickBooksPreviewResponse>('/api/quickbooks/preview', params || {});
}

export function syncQuickBooksBatch(requestIds: number[]) {
  return apiClient.post<{ status: string; total: number; synced: number; failed: number; results: any[] }>('/api/quickbooks/expenses/sync-batch', { request_ids: requestIds });
}

export function syncQuickBooksBillsBatch(requestIds: number[]) {
  return apiClient.post<{ status: string; total: number; synced: number; failed: number; results: any[] }>('/api/quickbooks/bills/sync-batch', { request_ids: requestIds });
}

export function syncQuickBooksBill(requestId: number | string) {
  return apiClient.post<any>(`/api/quickbooks/bills/${requestId}`, {});
}

export function deleteQuickBooksBill(requestId: number | string, billId?: string) {
  const url = billId ? `/api/quickbooks/bills/${requestId}?bill_id=${encodeURIComponent(billId)}` : `/api/quickbooks/bills/${requestId}`;
  return apiClient.delete<any>(url);
}

export function getQuickBooksStatus() {
  return apiClient.get<any>('/api/quickbooks/status');
}

export function getQuickBooksARPreview() {
  return apiClient.get<QuickBooksPreviewResponse>('/api/quickbooks/ar-invoices/preview');
}

export function syncQuickBooksARInvoice(workflowId: string) {
  return apiClient.post<any>(`/api/quickbooks/ar-invoices/${workflowId}`, {});
}

export function syncQuickBooksARBatch(workflowIds: string[]) {
  return apiClient.post<{ status: string; total: number; synced: number; failed: number; results: any[] }>('/api/quickbooks/ar-invoices/sync-batch', { workflow_ids: workflowIds });
}

export function deleteQuickBooksARInvoice(workflowId: string) {
  return apiClient.delete<any>(`/api/quickbooks/ar-invoices/${workflowId}`);
}

export function extractProductInfoFromUrl(url: string) {
  return apiClient.post<{
    name: string;
    price: string;
    category: string;
    brand: string;
    description: string;
    vendor?: string;
    currency?: string;
    original_price?: string;
    original_currency?: string;
  }>(`${BASE}/extract-product-info`, { url }, {
    skipGlobalLoading: true,
    actionSubtitle: "Analyzing website metadata, price, vendor, and specs...",
  });
}

export async function listProjectGroupsDetailed(): Promise<import("@/types/purchasing").ProjectGroupItem[]> {
  return apiClient.get<import("@/types/purchasing").ProjectGroupItem[]>("/api/purchasing/projects/details");
}

export async function createProjectGroup(payload: import("@/types/purchasing").ProjectGroupCreateInput): Promise<import("@/types/purchasing").ProjectGroupItem> {
  return apiClient.post<import("@/types/purchasing").ProjectGroupItem>("/api/purchasing/projects", payload);
}

export async function updateProjectGroup(oldName: string, payload: import("@/types/purchasing").ProjectGroupUpdateInput): Promise<import("@/types/purchasing").ProjectGroupItem> {
  return apiClient.put<import("@/types/purchasing").ProjectGroupItem>(`/api/purchasing/projects/${encodeURIComponent(oldName)}`, payload);
}

export async function deleteProjectGroup(name: string): Promise<{ success: boolean }> {
  return apiClient.delete<{ success: boolean }>(`/api/purchasing/projects/${encodeURIComponent(name)}`);
}

export async function deletePurchaseRequest(id: string | number): Promise<void> {
  return apiClient.delete<void>(`${BASE}/requests/${id}`);
}
