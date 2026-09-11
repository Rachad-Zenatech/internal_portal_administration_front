export interface BusinessContactReference {
  id: number;
  source_company: string;
  contact_type: string;
  display_name: string;
  normalized_name?: string | null;
  compact_name?: string | null;
  phone_numbers?: string | null;
  email?: string | null;
  full_name?: string | null;
  bill_address?: string | null;
  ship_address?: string | null;
  account_number: string;
  account_name: string;
  account_type: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface BusinessContactCreateRequest {
  account_side?: "ar" | "ap";
  contact_type?: string;
  display_name: string;
  source_company?: string;
  phone_numbers?: string | null;
  email?: string | null;
  full_name?: string | null;
  bill_address?: string | null;
  ship_address?: string | null;
  account_number?: string;
  account_name?: string;
  account_type?: string;
  is_active?: boolean;
}

export interface BusinessContactUpdateRequest {
  contact_type?: string;
  display_name?: string;
  source_company?: string;
  phone_numbers?: string | null;
  email?: string | null;
  full_name?: string | null;
  bill_address?: string | null;
  ship_address?: string | null;
  account_number?: string;
  account_name?: string;
  account_type?: string;
  is_active?: boolean;
}

export interface BusinessContactDeleteResult {
  deleted: boolean;
  id: number;
}

export interface BusinessContactBatchDeleteResult {
  deleted_count: number;
  ids: number[];
}

export interface BusinessContactReferenceList {
  items: BusinessContactReference[];
  total: number;
  active_count: number;
  ar_count: number;
  ap_count: number;
  limit: number;
  offset: number;
  search?: string | null;
}

export interface BusinessContactSyncResult {
  synced: number;
  status: string;
  total_received?: number;
  error?: string;
}
