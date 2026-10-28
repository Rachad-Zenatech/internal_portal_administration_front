import { apiClient } from "./apiClient";

export interface MasterItem {
  id: number;
  name: string;
  raw_name: string;
  description?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MasterListResponse {
  items: MasterItem[];
  total: number;
  last_imported_at: string | null;
  last_filename: string | null;
}

export interface ImportResult {
  success: boolean;
  imported_count: number;
  total_count: number;
  filename: string;
  imported_at: string;
}

export const masterTablesService = {
  // --- Locations ---
  getLocations: (search?: string) => {
    const qs = search ? `?search=${encodeURIComponent(search)}` : "";
    return apiClient.get<MasterListResponse>(`/api/master/locations${qs}`);
  },

  createLocation: (payload: { name: string; description?: string }) => {
    return apiClient.post<MasterItem>("/api/master/locations", payload);
  },

  updateLocation: (id: number, payload: { name: string; description?: string; is_active?: boolean }) => {
    return apiClient.put<MasterItem>(`/api/master/locations/${id}`, payload);
  },

  deleteLocation: (id: number) => {
    return apiClient.delete<{ success: boolean; message: string }>(`/api/master/locations/${id}`);
  },

  importLocationsFile: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient.post<ImportResult>("/api/master/locations/import", formData);
  },

  // --- Classes ---
  getClasses: (search?: string) => {
    const qs = search ? `?search=${encodeURIComponent(search)}` : "";
    return apiClient.get<MasterListResponse>(`/api/master/classes${qs}`);
  },

  createClass: (payload: { name: string; description?: string }) => {
    return apiClient.post<MasterItem>("/api/master/classes", payload);
  },

  updateClass: (id: number, payload: { name: string; description?: string; is_active?: boolean }) => {
    return apiClient.put<MasterItem>(`/api/master/classes/${id}`, payload);
  },

  deleteClass: (id: number) => {
    return apiClient.delete<{ success: boolean; message: string }>(`/api/master/classes/${id}`);
  },

  importClassesFile: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient.post<ImportResult>("/api/master/classes/import", formData);
  },

  // --- Products & Services (HubSpot Integration) ---
  getProducts: (search?: string, isActive?: boolean, companyId?: string) => {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (isActive !== undefined) params.append("is_active", String(isActive));
    if (companyId) params.append("company_id", companyId);
    const qs = params.toString() ? `?${params.toString()}` : "";
    return apiClient.get<MasterProductListResponse>(`/api/master/products${qs}`);
  },

  getCompanyProducts: (
    companyId: string,
    search?: string,
    isActive?: boolean,
    includeGeneral: boolean = true
  ) => {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (isActive !== undefined) params.append("is_active", String(isActive));
    if (!includeGeneral) params.append("include_general", "false");
    const qs = params.toString() ? `?${params.toString()}` : "";
    return apiClient.get<MasterProductListResponse>(
      `/api/companies/${encodeURIComponent(companyId)}/products${qs}`
    );
  },

  createProduct: (payload: {
    name: string;
    description?: string;
    price?: number;
    currency?: string;
    billing_frequency?: string;
    term?: number;
    sku?: string;
    tax_rate?: number;
    product_type?: string;
    is_active?: boolean;
    hubspot_company_id?: string | null;
    company_name?: string | null;
  }) => {
    return apiClient.post<MasterProductItem>("/api/master/products", payload);
  },

  updateProduct: (
    id: number,
    payload: {
      name: string;
      description?: string;
      price?: number;
      currency?: string;
      billing_frequency?: string;
      term?: number;
      sku?: string;
      tax_rate?: number;
      product_type?: string;
      is_active?: boolean;
      hubspot_company_id?: string | null;
      company_name?: string | null;
    }
  ) => {
    return apiClient.put<MasterProductItem>(`/api/master/products/${id}`, payload);
  },

  deleteProduct: (id: number) => {
    return apiClient.delete<{ success: boolean; message: string }>(`/api/master/products/${id}`);
  },

  syncHubSpotProducts: (apiKey?: string) => {
    return apiClient.post<HubSpotSyncResult>("/api/master/products/sync-hubspot", {
      api_key: apiKey || undefined,
    });
  },

  importProductsFile: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient.post<ImportResult>("/api/master/products/import", formData);
  },
};

export interface MasterProductItem {
  id: number;
  hubspot_id?: string | null;
  name: string;
  raw_name: string;
  description?: string | null;
  price: number;
  currency: string;
  billing_frequency: string;
  term: number;
  sku?: string | null;
  tax_rate: number;
  unit_discount: number;
  discount_type: string;
  product_type: string;
  is_active: boolean;
  source: string;
  hubspot_company_id?: string | null;
  company_name?: string | null;
  created_at: string;
  updated_at: string;
}

export interface MasterProductListResponse {
  items: MasterProductItem[];
  total: number;
  last_imported_at: string | null;
  last_filename: string | null;
}

export interface HubSpotSyncResult {
  success: boolean;
  count: number;
  message: string;
  error?: string;
  required_scopes?: string[];
}
