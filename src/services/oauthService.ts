import { apiClient } from "./apiClient";

export interface HubSpotOAuthConfig {
  client_id: string;
  client_secret_masked: string;
  has_client_secret: boolean;
  redirect_uri: string;
  scopes: string;
  is_configured: boolean;
  source: string;
  updated_at: string | null;
}

export interface HubSpotConnectionInfo {
  hub_id: string;
  hub_domain: string;
  user_email: string;
  app_id: string;
  expires_at: string;
  is_expired: boolean;
  seconds_left: number;
  scopes: string[];
  connected_by: string;
  created_at: string | null;
  updated_at: string | null;
}

export interface HubSpotOAuthStatus {
  connected: boolean;
  is_configured: boolean;
  config: HubSpotOAuthConfig;
  connection: HubSpotConnectionInfo | null;
}

export interface HubSpotAuthUrlResponse {
  auth_url: string;
  client_id: string;
  redirect_uri: string;
  scopes: string;
}

export interface HubSpotTestResult {
  success: boolean;
  message?: string;
  error?: string;
  portal_id?: string;
  user_email?: string;
  scopes?: string[];
  sample_product_found?: boolean;
}

export interface HubSpotDataResponse {
  object_type: string;
  total: number;
  items: Array<{
    id: string;
    created_at: string;
    updated_at: string;
    properties: Record<string, any>;
  }>;
  fetched_at: string;
}

export interface HubSpotSyncResult {
  success: boolean;
  count: number;
  message: string;
}

export const oauthService = {
  getHubSpotStatus: () => {
    return apiClient.get<HubSpotOAuthStatus>("/api/oauth/hubspot/status");
  },

  saveHubSpotConfig: (payload: {
    client_id: string;
    client_secret?: string;
    redirect_uri?: string;
    scopes?: string;
  }) => {
    return apiClient.post<{ success: boolean; config: HubSpotOAuthConfig; message: string }>(
      "/api/oauth/hubspot/config",
      payload
    );
  },

  getHubSpotAuthUrl: (state?: string) => {
    const qs = state ? `?state=${encodeURIComponent(state)}` : "";
    return apiClient.get<HubSpotAuthUrlResponse>(`/api/oauth/hubspot/auth-url${qs}`);
  },

  testHubSpotConnection: () => {
    return apiClient.post<HubSpotTestResult>("/api/oauth/hubspot/test", {});
  },

  refreshHubSpotToken: () => {
    return apiClient.post<{ success: boolean; hub_id: string; expires_at: string; message: string }>(
      "/api/oauth/hubspot/refresh",
      {}
    );
  },

  disconnectHubSpot: (hubId?: string) => {
    const qs = hubId ? `?hub_id=${encodeURIComponent(hubId)}` : "";
    return apiClient.post<{ success: boolean; message: string }>(`/api/oauth/hubspot/disconnect${qs}`, {});
  },

  fetchHubSpotData: (objectType: string = "products", limit: number = 15) => {
    return apiClient.get<HubSpotDataResponse>(
      `/api/oauth/hubspot/data?object_type=${encodeURIComponent(objectType)}&limit=${limit}`
    );
  },

  syncHubSpotProducts: () => {
    return apiClient.post<HubSpotSyncResult>("/api/oauth/hubspot/sync", {});
  },

  getHubSpotCompanies: (search?: string, limit?: number, offset?: number) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (limit !== undefined) params.set("limit", String(limit));
    if (offset) params.set("offset", String(offset));
    const qs = params.toString();
    return apiClient.get<HubSpotCompaniesResponse>(`/api/oauth/hubspot/companies${qs ? `?${qs}` : ""}`);
  },

  syncHubSpotCompanies: () => {
    return apiClient.post<{ success: boolean; count: number; message: string }>("/api/oauth/hubspot/sync-companies", {});
  },

  // ── Microsoft Entra (Receivable Mailbox) ──
  getMicrosoftEntraStatus: () => {
    return apiClient.get<MicrosoftEntraOAuthStatus>("/api/oauth/microsoft-entra/status");
  },

  saveMicrosoftEntraConfig: (payload: {
    client_id: string;
    client_secret?: string;
    tenant_id?: string;
    redirect_uri?: string;
    scopes?: string;
    target_mailbox?: string;
    auth_mode?: string;
  }) => {
    return apiClient.post<{ success: boolean; config: MicrosoftEntraOAuthConfig; message: string }>(
      "/api/oauth/microsoft-entra/config",
      payload
    );
  },

  getMicrosoftEntraAuthUrl: (state?: string) => {
    const qs = state ? `?state=${encodeURIComponent(state)}` : "";
    return apiClient.get<{ auth_url: string; redirect_uri: string; client_id: string; tenant_id: string }>(
      `/api/oauth/microsoft-entra/auth-url${qs}`
    );
  },

  testMicrosoftEntraConnection: () => {
    return apiClient.post<{ success: boolean; message?: string; error?: string; profile?: any }>(
      "/api/oauth/microsoft-entra/test",
      {}
    );
  },

  refreshMicrosoftEntraToken: () => {
    return apiClient.post<{ success: boolean; message: string }>(
      "/api/oauth/microsoft-entra/refresh",
      {}
    );
  },

  disconnectMicrosoftEntra: () => {
    return apiClient.post<{ success: boolean; message: string }>(
      "/api/oauth/microsoft-entra/disconnect",
      {}
    );
  },

  fetchReceivableEmails: (top: number = 25, search?: string) => {
    const qs = new URLSearchParams();
    qs.append("top", String(top));
    if (search && search.trim()) {
      qs.append("search", search.trim());
    }
    return apiClient.get<ReceivableEmailsResponse>(`/api/oauth/microsoft-entra/emails?${qs.toString()}`);
  },
};

export interface HubSpotCompanyItem {
  id: number;
  hubspot_id: string;
  name: string;
  domain: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  industry: string;
  description: string;
  website: string;
  currency: string;
  billing_email: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  template_status: string;
  brand: string;
  created_at: string | null;
  updated_at: string | null;
}

export interface HubSpotCompaniesResponse {
  items: HubSpotCompanyItem[];
  total: number;
  limit?: number | null;
  offset?: number;
  has_more?: boolean;
}

export interface MicrosoftEntraOAuthConfig {
  client_id: string;
  client_secret_masked: string | null;
  has_client_secret: boolean;
  tenant_id: string;
  redirect_uri: string;
  scopes: string;
  target_mailbox?: string;
  auth_mode?: string;
  source: string;
}

export interface MicrosoftEntraConnectionInfo {
  id?: number;
  user_email: string;
  display_name: string;
  mailbox_address: string;
  tenant_id: string;
  account_id?: string;
  auth_mode?: string;
  mode_label?: string;
  is_permanent?: boolean;
  tracked_emails_count?: number;
  expires_at?: string;
  seconds_left?: number;
  is_expired?: boolean;
  scopes?: string[];
  updated_at: string | null;
}

export interface MicrosoftEntraOAuthStatus {
  provider: string;
  name: string;
  connected: boolean;
  is_configured: boolean;
  auth_mode?: string;
  target_mailbox?: string;
  config: MicrosoftEntraOAuthConfig;
  connection: MicrosoftEntraConnectionInfo | null;
}

export interface ReceivableEmailItem {
  id: string;
  subject: string;
  sender_name: string;
  sender_email: string;
  received_at: string;
  has_attachments: boolean;
  is_read: boolean;
  body_preview: string;
  web_link: string;
  importance: string;
}

export interface ReceivableEmailsResponse {
  total: number;
  items: ReceivableEmailItem[];
  fetched_at: string;
}
