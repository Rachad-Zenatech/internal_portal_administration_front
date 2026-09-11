import { apiClient } from "./apiClient";
import type {
  Entity,
  EntityListResponse,
  EntityCreateRequest,
  EntityUpdateRequest,
  EntityDeleteResult,
  EntityBatchDeleteResult,
} from "../types/entity";

export const entityService = {
  async getEntities(params?: {
    search?: string;
    group_name?: string;
    is_active?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<EntityListResponse> {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.append("search", params.search);
    if (params?.group_name) searchParams.append("group_name", params.group_name);
    if (params?.is_active !== undefined) searchParams.append("is_active", String(params.is_active));
    if (params?.limit) searchParams.append("limit", String(params.limit));
    if (params?.offset) searchParams.append("offset", String(params.offset));

    const qs = searchParams.toString();
    const url = `/api/configurations/entities${qs ? `?${qs}` : ""}`;
    const data = await apiClient.get<any>(url);

    if (Array.isArray(data)) {
      const items: Entity[] = data;
      return {
        items,
        total: items.length,
        active_count: items.filter((e) => e.is_active).length,
        groups: Array.from(new Set(items.map((e) => e.group_name).filter(Boolean))) as string[],
        limit: params?.limit || items.length,
        offset: params?.offset || 0,
      };
    }

    if (data && Array.isArray(data.items)) {
      return {
        items: data.items,
        total: data.total ?? data.items.length,
        active_count: data.active_count ?? data.items.filter((e: Entity) => e.is_active).length,
        groups: data.groups || [],
        limit: data.limit || 500,
        offset: data.offset || 0,
      };
    }

    return {
      items: [],
      total: 0,
      active_count: 0,
      groups: [],
      limit: 500,
      offset: 0,
    };
  },

  async createEntity(payload: EntityCreateRequest): Promise<Entity> {
    return apiClient.post<Entity>("/api/configurations/entities", payload);
  },

  async updateEntity(id: number, payload: EntityUpdateRequest): Promise<Entity> {
    return apiClient.patch<Entity>(`/api/configurations/entities/${id}`, payload);
  },

  async deleteEntity(id: number): Promise<EntityDeleteResult> {
    return apiClient.delete<EntityDeleteResult>(`/api/configurations/entities/${id}`);
  },

  async batchDeleteEntities(ids: number[]): Promise<EntityBatchDeleteResult> {
    return apiClient.post<EntityBatchDeleteResult>("/api/configurations/entities/batch-delete", { ids });
  },
};
