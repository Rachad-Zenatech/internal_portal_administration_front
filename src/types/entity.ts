export interface Entity {
  id: number;
  name: string;
  code?: string | null;
  entity_type?: string;
  description?: string | null;
  group_name?: string;
  state?: string | null;
  country?: string;
  currency?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EntityListResponse {
  items: Entity[];
  total: number;
  active_count: number;
  groups: string[];
  limit: number;
  offset: number;
}

export interface EntityCreateRequest {
  name: string;
  code?: string;
  entity_type?: string;
  description?: string;
  group_name?: string;
  state?: string;
  country?: string;
  currency?: string;
  is_active?: boolean;
}

export interface EntityUpdateRequest {
  name?: string;
  code?: string;
  entity_type?: string;
  description?: string;
  group_name?: string;
  state?: string;
  country?: string;
  currency?: string;
  is_active?: boolean;
}

export interface EntityDeleteResult {
  success: boolean;
  deleted_id: number;
  name: string;
}

export interface EntityBatchDeleteResult {
  deleted_count: number;
  deleted_ids: number[];
}
