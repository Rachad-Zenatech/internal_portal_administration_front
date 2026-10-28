import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { oauthService } from "@/services/oauthService";
import { toast } from "sonner";

export function useHubSpotCompanies(search: string | undefined, page: number, pageSize: number) {
  return useQuery({
    queryKey: ["hubspot-companies", search || "", page, pageSize],
    queryFn: () => oauthService.getHubSpotCompanies(search, pageSize, page * pageSize),
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  });
}

export function useSyncHubSpotCompanies() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => oauthService.syncHubSpotCompanies(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["hubspot-companies"] });
      queryClient.invalidateQueries({ queryKey: ["master-products"] });
      queryClient.invalidateQueries({ queryKey: ["company-products"] });
      toast.success(data.message || `Synced ${data.count} companies from HubSpot!`);
    },
    onError: (err: any) => {
      const errData = err?.response?.data;
      toast.error(errData?.detail || errData?.message || "Failed to sync companies from HubSpot", {
        duration: 8000,
      });
    },
  });
}
