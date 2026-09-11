import { apiClient } from "./apiClient";
import type {
  BusinessContactReference,
  BusinessContactReferenceList,
  BusinessContactCreateRequest,
  BusinessContactUpdateRequest,
  BusinessContactDeleteResult,
  BusinessContactBatchDeleteResult,
  BusinessContactSyncResult,
} from "../types/businessContact";

export const financeService = {
  async getPayableContacts(params?: {
    search?: string;
    is_active?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<BusinessContactReferenceList> {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.append("search", params.search);
    if (params?.is_active !== undefined) searchParams.append("is_active", String(params.is_active));
    if (params?.limit) searchParams.append("limit", String(params.limit));
    if (params?.offset) searchParams.append("offset", String(params.offset));

    const qs = searchParams.toString();
    const url = `/api/integrations/finance/payable-contacts${qs ? `?${qs}` : ""}`;
    const data = await apiClient.get<any>(url);

    if (Array.isArray(data)) {
      const items: BusinessContactReference[] = data;
      const arItems = items.filter((c) => c.contact_type === "customer" || c.account_number === "1100");
      const apItems = items.filter((c) => c.contact_type !== "customer" && c.account_number !== "1100");
      return {
        items,
        total: items.length,
        active_count: items.filter((c) => c.is_active).length,
        ar_count: arItems.length,
        ap_count: apItems.length,
        limit: params?.limit || items.length,
        offset: params?.offset || 0,
        search: params?.search,
      };
    }

    if (data && Array.isArray(data.items)) {
      const items: BusinessContactReference[] = data.items;
      const arItems = items.filter((c) => c.contact_type === "customer" || c.account_number === "1100");
      const apItems = items.filter((c) => c.contact_type !== "customer" && c.account_number !== "1100");
      return {
        items,
        total: data.total ?? items.length,
        active_count: items.filter((c) => c.is_active).length,
        ar_count: arItems.length,
        ap_count: apItems.length,
        limit: data.limit || 500,
        offset: data.offset || 0,
        search: params?.search,
      };
    }

    return {
      items: [],
      total: 0,
      active_count: 0,
      ar_count: 0,
      ap_count: 0,
      limit: 500,
      offset: 0,
    };
  },

  async createPayableContact(payload: BusinessContactCreateRequest): Promise<BusinessContactReference> {
    const accountSide = payload.account_side || (payload.contact_type === "customer" ? "ar" : "ap");
    const formattedPayload = {
      ...payload,
      contact_type: payload.contact_type || (accountSide === "ar" ? "customer" : "vendor"),
      account_number: payload.account_number || (accountSide === "ar" ? "1100" : "2000"),
      account_name: payload.account_name || (accountSide === "ar" ? "Accounts Receivable" : "Accounts Payable"),
      account_type: payload.account_type || (accountSide === "ar" ? "Accounts Receivable" : "Accounts Payable"),
    };
    return apiClient.post<BusinessContactReference>("/api/integrations/finance/payable-contacts", formattedPayload);
  },

  async updatePayableContact(id: number, payload: BusinessContactUpdateRequest): Promise<BusinessContactReference> {
    return apiClient.patch<BusinessContactReference>(`/api/integrations/finance/payable-contacts/${id}`, payload);
  },

  async deletePayableContact(id: number): Promise<BusinessContactDeleteResult> {
    return apiClient.delete<BusinessContactDeleteResult>(`/api/integrations/finance/payable-contacts/${id}`);
  },

  async batchDeletePayableContacts(ids: number[]): Promise<BusinessContactBatchDeleteResult> {
    return apiClient.post<BusinessContactBatchDeleteResult>("/api/integrations/finance/payable-contacts/batch-delete", { ids });
  },

  async syncPayableContacts(): Promise<BusinessContactSyncResult> {
    return apiClient.post<BusinessContactSyncResult>("/api/integrations/finance/sync-payable-contacts", {});
  },
};
