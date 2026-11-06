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

export const HUBSPOT_SYNC_STATUS_KEY = ["hubspot-companies-sync-status"] as const;

/** Live progress of the background companies sync; polls every second only while a sync is running. */
export function useHubSpotCompaniesSyncStatus() {
  return useQuery({
    queryKey: HUBSPOT_SYNC_STATUS_KEY,
    queryFn: () => oauthService.getHubSpotCompaniesSyncStatus(),
    refetchInterval: (query) => (query.state.data?.status === "running" ? 1000 : false),
    staleTime: 0,
    retry: false,
  });
}

/**
 * Starts the companies sync in the background. The mutation resolves as soon as the sync has started;
 * `isPending` stays true for the whole run so existing buttons keep showing "Syncing...".
 * Progress and completion are shown by the HubSpotSyncProgress widget in the app shell.
 */
export function useSyncHubSpotCompanies() {
  const queryClient = useQueryClient();
  const { data: status } = useHubSpotCompaniesSyncStatus();
  const mutation = useMutation({
    mutationFn: () => oauthService.syncHubSpotCompanies(),
    onSuccess: (data) => {
      // Seeding the status query starts the 1s polling immediately.
      queryClient.setQueryData(HUBSPOT_SYNC_STATUS_KEY, data);
      if (data.started === false) toast.info("A HubSpot sync is already running.");
    },
    onError: (err: any) => {
      const errData = err?.response?.data;
      toast.error(errData?.detail || errData?.message || "Failed to start the HubSpot companies sync", {
        duration: 8000,
      });
    },
  });
  return { ...mutation, isPending: mutation.isPending || status?.status === "running" };
}
