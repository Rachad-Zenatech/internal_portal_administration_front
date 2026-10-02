import { apiClient } from "./apiClient";
import type {
  ARCreateWorkflowPayload,
  ARMetrics,
  ARTransitionPayload,
  ARWorkflow,
  ARWorkflowFilterParams,
  ARWorkflowListResponse,
  MatchedInvoiceItem,
} from "../types/ar";

export const arService = {
  async getMetrics(): Promise<ARMetrics> {
    return apiClient.get<ARMetrics>("/api/v1/ar/metrics");
  },

  async getWorkflows(params?: ARWorkflowFilterParams): Promise<ARWorkflowListResponse> {
    const searchParams = new URLSearchParams();
    if (params?.type) searchParams.append("type", params.type);
    if (params?.state) searchParams.append("state", params.state);
    if (params?.customer_id) searchParams.append("customer_id", params.customer_id);
    if (params?.search) searchParams.append("search", params.search);
    if (params?.start_date) searchParams.append("start_date", params.start_date);
    if (params?.end_date) searchParams.append("end_date", params.end_date);
    if (params?.page) searchParams.append("page", String(params.page));
    if (params?.page_size) searchParams.append("page_size", String(params.page_size));

    const qs = searchParams.toString();
    const endpoint = `/api/v1/ar/workflows${qs ? `?${qs}` : ""}`;
    return apiClient.get<ARWorkflowListResponse>(endpoint);
  },

  async getWorkflowById(id: string): Promise<ARWorkflow> {
    return apiClient.get<ARWorkflow>(`/api/v1/ar/workflows/${id}`);
  },

  async createWorkflow(payload: ARCreateWorkflowPayload): Promise<ARWorkflow> {
    return apiClient.post<ARWorkflow>("/api/v1/ar/workflows", payload, {
      actionLabel: "Creating AR Workflow",
      actionSubtitle: `Initializing new ${payload.workflow_type} workflow instance...`,
    });
  },

  async updateWorkflow(id: string, payload: Partial<ARCreateWorkflowPayload>): Promise<ARWorkflow> {
    return apiClient.put<ARWorkflow>(`/api/v1/ar/workflows/${id}`, payload, {
      actionLabel: "Updating AR Workflow Details",
      actionSubtitle: "Saving updated workflow form fields...",
    });
  },

  async transitionWorkflow(id: string, payload: ARTransitionPayload): Promise<ARWorkflow> {
    return apiClient.post<ARWorkflow>(`/api/v1/ar/workflows/${id}/transition`, payload, {
      actionLabel: "Transitioning Workflow State",
      actionSubtitle: `Advancing to ${payload.target_state}...`,
    });
  },

  async triggerWorkflowTimer(id: string, timerType: string = "DUNNING_CHECK"): Promise<ARWorkflow> {
    return apiClient.post<ARWorkflow>(
      `/api/v1/ar/workflows/${id}/trigger-timer?timer_type=${encodeURIComponent(timerType)}`,
      {},
      {
        actionLabel: "Executing System Timer",
        actionSubtitle: "Simulating payment expiration / dunning trigger...",
      }
    );
  },

  async batchDunningTrigger(): Promise<{ status: string; processed_workflows: number }> {
    return apiClient.post<{ status: string; processed_workflows: number }>(
      "/api/v1/ar/workflows/batch-dunning",
      {},
      {
        actionLabel: "Running Automated Dunning",
        actionSubtitle: "Checking all overdue invoices across the system...",
      }
    );
  },

  async addWorkflowAttachment(
    id: string,
    attachment: { filename: string; file_url?: string; file_size?: number; file_type?: string; note?: string }
  ): Promise<any> {
    return apiClient.post(`/api/v1/ar/workflows/${id}/attachments`, attachment, {
      actionLabel: "Uploading Document Attachment",
      actionSubtitle: `Attaching ${attachment.filename} to workflow...`,
    });
  },

  async uploadWorkflowAttachments(id: string, formData: FormData): Promise<any> {
    return apiClient.post(`/api/v1/ar/workflows/${id}/attachments/upload`, formData, {
      actionLabel: "Uploading Document Attachments",
      actionSubtitle: "Archiving file attachments to server storage...",
    });
  },

  async parseInvoicesOcr(files: File[]): Promise<{
    matched_invoices: MatchedInvoiceItem[];
    total_parsed_amount: number;
    suggested_customer_name?: string;
    suggested_bank_txn_id?: string;
    suggested_bank_name?: string;
    suggested_deposit_date?: string;
    files_count: number;
    summary: string;
  }> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });
    return apiClient.post("/api/v1/ar/ocr/parse-invoices", formData, {
      actionLabel: "Tesseract AI OCR Invoice Scanning",
      actionSubtitle: `Reading ${files.length} document(s) and refining invoice line items...`,
    });
  },

  async getCurrencies(): Promise<Array<{ code: string; name: string; symbol: string; country_code?: string }>> {
    return apiClient.get("/api/v1/ar/currencies");
  },

  async getAssignableClerks(workflowType?: string): Promise<Array<{ id: string; name: string; email: string; job_title?: string; department?: string }>> {
    const qs = workflowType ? `?workflow_type=${encodeURIComponent(workflowType)}` : "";
    return apiClient.get<Array<{ id: string; name: string; email: string; job_title?: string; department?: string }>>(`/api/v1/ar/clerks${qs}`);
  },

  async getCustomerInitialSaleTemplate(customerId: string): Promise<any> {
    return apiClient.get<any>(`/api/customers/${encodeURIComponent(customerId)}/initial-sale`);
  },

  async generateInvoiceFromSale(payload: any): Promise<any> {
    return apiClient.post<any>("/api/invoices/generate-from-sale", payload, {
      actionLabel: "Generating Sale Invoice & Syncing Template",
      actionSubtitle: "Creating invoice snapshot and updating customer sale template...",
    });
  },
  async deleteWorkflow(id: string): Promise<{ success: boolean; id: string; message: string }> {
    return apiClient.delete<{ success: boolean; id: string; message: string }>(
      `/api/workflows/${encodeURIComponent(id)}`,
      {
        actionLabel: "Deleting Workflow",
        actionSubtitle: "Removing AR workflow instance and records...",
      }
    );
  },
  async searchAccounts(search?: string): Promise<Array<{ id: number; account_number: string; account_name: string; account_type: string; label: string }>> {
    const qs = search ? `?search=${encodeURIComponent(search)}` : "";
    return apiClient.get<any[]>(`/api/accounts${qs}`);
  },
};
