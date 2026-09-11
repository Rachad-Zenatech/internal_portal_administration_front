import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { entityService } from "../services/entityService";
import type {
  EntityCreateRequest,
  EntityUpdateRequest,
} from "../types/entity";

export const ENTITIES_QUERY_KEY = "operating_entities";

export function useEntities(params?: {
  search?: string;
  group_name?: string;
  is_active?: boolean;
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: [ENTITIES_QUERY_KEY, params?.search || "", params?.group_name || "ALL", params?.is_active ?? "ALL"],
    queryFn: () => entityService.getEntities(params),
  });
}

export function useCreateEntity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: EntityCreateRequest) => entityService.createEntity(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ENTITIES_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ["purchasing_pay_from"] });
    },
  });
}

export function useUpdateEntity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: EntityUpdateRequest }) =>
      entityService.updateEntity(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ENTITIES_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ["purchasing_pay_from"] });
    },
  });
}

export function useDeleteEntity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => entityService.deleteEntity(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ENTITIES_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ["purchasing_pay_from"] });
    },
  });
}

export function useBatchDeleteEntities() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: number[]) => entityService.batchDeleteEntities(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ENTITIES_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ["purchasing_pay_from"] });
    },
  });
}
