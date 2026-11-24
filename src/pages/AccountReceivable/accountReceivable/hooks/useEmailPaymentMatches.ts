import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { arEmailPaymentService, type EmailPaymentMatch } from "../../../../services/arEmailPaymentService";
import { oauthService } from "../../../../services/oauthService";

export function useEmailPaymentMatches() {
  const queryClient = useQueryClient();
  const [isScanningEmails, setIsScanningEmails] = useState(false);
  const [isUnmatchedDrawerOpen, setIsUnmatchedDrawerOpen] = useState(false);

  const { data, refetch } = useQuery({
    queryKey: ["ar-email-payment-matches"],
    queryFn: () => arEmailPaymentService.listMatches(),
    staleTime: 60_000,
    retry: 1,
  });

  // Subscribe to A/R Email SSE stream so incoming emails auto-sync, auto-analyze,
  // and immediately refresh Payment Found badges & Unmatched Payments count.
  useEffect(() => {
    const streamUrl = oauthService.getReceivableEmailsStreamUrl();
    const es = new EventSource(streamUrl, { withCredentials: true });
    es.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        if (msg?.type === "payment_match_updated" || msg?.type === "new_emails") {
          queryClient.invalidateQueries({ queryKey: ["ar-email-payment-matches"] });
        }
      } catch {
        // ignore keep-alive pings
      }
    };
    return () => es.close();
  }, [queryClient]);

  const handleScanEmailPayments = async () => {
    setIsScanningEmails(true);
    try {
      const res = await arEmailPaymentService.scanEmails(15, true);
      await queryClient.invalidateQueries({ queryKey: ["ar-email-payment-matches"] });
      toast.success(
        `Scanned ${res.scanned} email(s): ${res.matched} matched, ${res.unmatched} awaiting review`
      );
      return res;
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || err?.message || "Failed to scan A/R emails");
      throw err;
    } finally {
      setIsScanningEmails(false);
    }
  };

  return {
    emailMatchesByInvoice: (data?.by_invoice || {}) as Record<string, EmailPaymentMatch>,
    unmatchedEmailPayments: (data?.unmatched || []) as EmailPaymentMatch[],
    availableEmailPayments: (data?.available || []) as EmailPaymentMatch[],
    unmatchedEmailCount: data?.unmatched_count || 0,
    isScanningEmails,
    handleScanEmailPayments,
    isUnmatchedDrawerOpen,
    setIsUnmatchedDrawerOpen,
    refetchEmailMatches: refetch,
  };
}
