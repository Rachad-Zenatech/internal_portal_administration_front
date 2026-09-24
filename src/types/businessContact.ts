export interface BankingDetails {
  bank_country?: string;
  bank_name?: string;
  bank_account_number?: string;
  routing_wire?: string;
  routing_ach?: string;
  swift_code?: string;
  bic?: string;
  iban?: string;
  sort_code?: string;
  transit_code_ca?: string;
  institution_code?: string;
  branch_code?: string;
  bsb_australia?: string;
  bank_code?: string;
  clearing_code?: string;
  aba?: string;
  tax_id?: string;
  region?: string;
  contact_name_china?: string;
  vendor_address?: string;
  vendor_email?: string;
  bank_address?: string;
  [key: string]: any;
}

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
  banking_details?: BankingDetails | null;
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
  banking_details?: Record<string, any> | null;
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
  banking_details?: Record<string, any> | null;
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
