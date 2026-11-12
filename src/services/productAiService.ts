/** Product extraction from a request's vendor URL and its AI chart-of-accounts suggestions (each run again on request). */
import { apiClient } from "./apiClient";
import type { RequestDetail } from "@/types/purchasing";

const BASE = "/api/purchasing";

export function extractProductInfo(id: string) {
  return apiClient.post<RequestDetail>(`${BASE}/requests/${id}/extract-product-info`, {}, {
    actionLabel: "Extracting Product Details",
    actionSubtitle: "Retrieving product title, vendor, and price from URL...",
  });
}

/** Work out the request's AI chart-of-accounts suggestions again (they are otherwise worked out once, on the server). */
export function rerunGlSuggestions(id: string) {
  return apiClient.post<RequestDetail>(`${BASE}/requests/${id}/gl-suggestions`, {}, { skipGlobalLoading: true });
}
