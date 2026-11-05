import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { arQuoteService } from "@/services/arQuoteService";
import { arInvoiceService } from "@/services/arInvoiceService";
import { countARStatuses } from "@/pages/AccountReceivable/accountReceivable/arStatusCounts";

/** Per-status A/R totals for the sidebar. Shares the A/R page's query keys, so the lists are fetched once and stay in sync. */
export function useARStatusCounts(enabled: boolean) {
  const { data: quotes } = useQuery({
    queryKey: ["ar-quotes"],
    queryFn: () => arQuoteService.listQuotes(),
    enabled,
    staleTime: 30 * 1000,
  });
  const { data: invoices } = useQuery({
    queryKey: ["ar-invoices"],
    queryFn: () => arInvoiceService.listInvoices(),
    enabled,
    staleTime: 30 * 1000,
  });
  return useMemo(() => (quotes && invoices ? countARStatuses(quotes, invoices) : undefined), [quotes, invoices]);
}
