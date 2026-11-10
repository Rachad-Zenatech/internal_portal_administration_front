import type { ChartOfAccount, ChartOfAccounts, GLCodeOption } from "../types/chartOfAccount";
import { apiClient } from "./apiClient";

export const ChartOfAccountService = {
  async getChartOfAccount(id: number | string): Promise<ChartOfAccount> {
    return apiClient.get<ChartOfAccount>(`/api/chart-of-accounts/${id}`);
  },

  async getChartOfAccounts(includeInactive = false): Promise<ChartOfAccounts> {
    const data = await apiClient.get<any>(
      `/api/chart-of-accounts?include_inactive=${includeInactive}`
    );
    if (Array.isArray(data)) {
      return { chart_of_accounts: data };
    }
    return data && data.chart_of_accounts ? data : { chart_of_accounts: [] };
  },

  async getGLCodes(search?: string): Promise<GLCodeOption[]> {
    const qs = search ? `?search=${encodeURIComponent(search)}` : "";
    return apiClient.get<GLCodeOption[]>(`/api/purchasing/gl-codes${qs}`);
  },

  async insertChartOfAccount(chartOfAccount: ChartOfAccount): Promise<ChartOfAccount> {
    return apiClient.post<ChartOfAccount>(`/api/chart-of-accounts`, chartOfAccount);
  },

  async deleteChartOfAccount(id: number): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/api/chart-of-accounts/${id}`);
  },

  async updateChartOfAccount(data: ChartOfAccount): Promise<ChartOfAccount> {
    return apiClient.put<ChartOfAccount>(`/api/chart-of-accounts/${data.id}`, data);
  },

  async setChartOfAccountStatus(id: number, isActive: boolean): Promise<{ chart_of_account: ChartOfAccount }> {
    return apiClient.patch<{ chart_of_account: ChartOfAccount }>(
      `/api/chart-of-accounts/${id}/status`,
      { is_active: isActive }
    );
  },

  async getPredictedGLSuggestions(params: {
    product_name?: string;
    vendor?: string;
    amount?: number;
    category?: string;
    description?: string;
    item_url?: string;
  }): Promise<{
    best_category: string;
    best_account_number: string;
    best_account_name: string;
    suggestions: Array<{
      account_number: string;
      account_name: string;
      confidence: number;
      reason: string;
      source: string;
      is_best_match: boolean;
    }>;
    evidence_summary: string;
    source: string;
  }> {
    return apiClient.post("/api/chart-of-accounts/suggest", params);
  },
};
