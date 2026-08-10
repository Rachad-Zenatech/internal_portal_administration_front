import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient as api } from "@/services/apiClient";

export const taskKeys = {
  all: ["tasks"] as const,
  list: (filters: any) => [...taskKeys.all, "list", filters] as const,
  detail: (id: number) => [...taskKeys.all, "detail", id] as const,
};

export function useTasks(filters: any = {}) {
  return useQuery({
    queryKey: taskKeys.list(filters),
    queryFn: async () => {
      const res = await api.get<any>("/tasks?limit=100");
      return res.items || [];
    },
  });
}

export function useTaskDetail(id: number | null) {
  return useQuery({
    queryKey: taskKeys.detail(id ?? 0),
    queryFn: async () => {
      return await api.get<any>(`/tasks/${id}`);
    },
    enabled: !!id,
  });
}

export function useChangeTaskStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, newStatus }: { taskId: number; newStatus: string }) => {
      return await api.post<any>(`/tasks/${taskId}/status`, { status: newStatus });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taskKeys.all, exact: false });
      qc.invalidateQueries({ queryKey: ["purchasing"], exact: false });
    },
  });
}
