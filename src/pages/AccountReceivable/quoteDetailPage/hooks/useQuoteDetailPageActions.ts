import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { arQuoteService } from "@/services/arQuoteService";
import { useNotificationStream } from "@/hooks/useNotifications";

export function useQuoteDetailPageActions() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  // Record Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number | string>("");
  const [paymentMethod, setPaymentMethod] = useState("WIRE");
  const [paymentRef, setPaymentRef] = useState("");
  const [paymentGLCode, setPaymentGLCode] = useState("");
  const [paymentClass, setPaymentClass] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  // Fetch Quote Details
  const {
    data: quote,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["ar-quote-detail", id],
    queryFn: () => (id ? arQuoteService.getQuote(id) : null),
    enabled: !!id,
  });
  // Fetch Audit Logs for this quote
  const { data: auditLogs = [], refetch: refetchLogs } = useQuery({
    queryKey: ["ar-quote-audit", id],
    queryFn: () => (id ? arQuoteService.getAuditLogs(id) : []),
    enabled: !!id,
  });
  // Real-time WebSocket updates for Quote details & Immutable Audit Trail
  useNotificationStream({
    onNotification: (raw: any) => {
      if (!raw) return;
      const isTargetQuote =
        raw.entity_id === id ||
        !raw.entity_id ||
        (raw.link_url && raw.link_url.includes(id || ""));

      const isQuoteType =
        (raw.type && (raw.type.includes("AR_QUOTE") || raw.type.includes("quote") || raw.type.includes("PAYMENT") || raw.type.includes("audit"))) ||
        raw.entity_type === "ARQuote" ||
        raw.entity_type === "Quote";

      if (isTargetQuote || isQuoteType) {
        queryClient.invalidateQueries({ queryKey: ["ar-quote-audit", id] });
        queryClient.invalidateQueries({ queryKey: ["ar-quote-detail", id] });
        queryClient.invalidateQueries({ queryKey: ["ar-quotes"] });
        queryClient.invalidateQueries({ queryKey: ["ar-quote-summary"] });
        refetchLogs();
        refetch();
      }
    },
  });
  // Sync custom breadcrumbs
  useEffect(() => {
    if (quote && id) {
      document.dispatchEvent(
        new CustomEvent("set-breadcrumb-trail", {
          detail: {
            path: `/account-receivable/quotes/${id}`,
            items: [
              { title: "Account Receivable", label: "Account Receivable", path: "/account-receivable" },
              { title: "Quotes", label: "Quotes", path: "/account-receivable?tab=quotes" },
              { title: quote.quote_number || `#${id.slice(0, 8)}`, label: quote.quote_number || `#${id.slice(0, 8)}`, path: `/account-receivable/quotes/${id}` },
            ],
          },
        })
      );
    }
  }, [quote, id]);
  // Mutations
  const publishMutation = useMutation({
    mutationFn: (quoteId: string) => arQuoteService.publishQuote(quoteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ar-quote-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["ar-quotes"] });
      queryClient.invalidateQueries({ queryKey: ["ar-quote-summary"] });
      refetch();
      refetchLogs();
    },
  });
  const draftMutation = useMutation({
    mutationFn: (quoteId: string) => arQuoteService.moveQuoteToDraft(quoteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ar-quote-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["ar-quotes"] });
      queryClient.invalidateQueries({ queryKey: ["ar-quote-summary"] });
      refetch();
      refetchLogs();
    },
  });
  const revokeLinksMutation = useMutation({
    mutationFn: (quoteId: string) => arQuoteService.revokeCustomerLink(quoteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ar-quote-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["ar-quotes"] });
      refetch();
      refetchLogs();
    },
  });
  const convertInvoiceMutation = useMutation({
    mutationFn: (quoteId: string) => arQuoteService.convertToInvoice(quoteId),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["ar-quote-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["ar-quotes"] });
      queryClient.invalidateQueries({ queryKey: ["ar-invoices"] });
      queryClient.invalidateQueries({ queryKey: ["ar-quote-summary"] });
      refetch();
      refetchLogs();
      if (res?.invoice_id) {
        navigate(`/account-receivable/generate-invoice?invoiceId=${res.invoice_id}`);
      }
    },
  });
  const revisionMutation = useMutation({
    mutationFn: (quoteId: string) => arQuoteService.createRevision(quoteId),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["ar-quotes"] });
      if (res?.id) {
        navigate(`/account-receivable/quotes/${res.id}`);
      }
    },
  });
  const deleteMutation = useMutation({
    mutationFn: (quoteId: string) => arQuoteService.deleteQuote(quoteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ar-quotes"] });
      queryClient.invalidateQueries({ queryKey: ["ar-quote-summary"] });
      navigate("/account-receivable?tab=quotes");
    },
    onError: (err: any) => {
      alert(`Failed to delete draft quote: ${err.message || err}`);
    },
  });
  const handleCopyLink = async () => {
    if (!quote) return;
    try {
      const res = await arQuoteService.generateCustomerLink(quote.id);
      if (res?.full_url) {
        navigator.clipboard.writeText(res.full_url);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      }
    } catch {
      const fallbackUrl = `${window.location.origin}/account-receivable/quotes/${quote.id}`;
      navigator.clipboard.writeText(fallbackUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };
  const handleRecordPayment = async () => {
    if (!quote || Number(paymentAmount) <= 0) return;
    setPaymentSubmitting(true);
    try {
      await arQuoteService.recordPayment(quote.id, {
        amount: Number(paymentAmount),
        payment_method: paymentMethod,
        reference_number: paymentRef,
        gl_code: paymentGLCode,
        category: paymentGLCode,
        class_name: paymentClass,
        class: paymentClass,
        notes: paymentNotes,
      });
      queryClient.invalidateQueries({ queryKey: ["ar-quote-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["ar-quotes"] });
      queryClient.invalidateQueries({ queryKey: ["ar-quote-summary"] });
      refetch();
      refetchLogs();
      setIsPaymentModalOpen(false);
      setPaymentAmount("");
      setPaymentRef("");
      setPaymentGLCode("");
      setPaymentClass("");
      setPaymentNotes("");
    } catch (err: any) {
      alert("Failed to record payment: " + err.message);
    } finally {
      setPaymentSubmitting(false);
    }
  };
  const formatAuditEvent = (eventType: string) => {
    switch (eventType) {
      case "CREATED":
        return {
          label: "Quote Created",
          badgeClass: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
          desc: "Initial quote drafted and saved.",
        };
      case "UPDATED":
        return {
          label: "Quote Updated",
          badgeClass: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
          desc: "Quote details or line items modified.",
        };
      case "PUBLISHED":
        return {
          label: "Quote Published",
          badgeClass: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
          desc: "Quote published and ready for customer review.",
        };
      case "MOVED_TO_DRAFT":
        return {
          label: "Reverted to Draft",
          badgeClass: "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700",
          desc: "Quote moved back to draft. Access links revoked.",
        };
      case "SENT":
        return {
          label: "Emailed to Customer",
          badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800",
          desc: "Quotation email sent to customer.",
        };
      case "LINK_ACCESSED":
        return {
          label: "Link Accessed",
          badgeClass: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800",
          desc: "Customer opened the secure quote link.",
        };
      case "PAGE_VIEWED":
      case "VIEWED":
        return {
          label: "Page Viewed",
          badgeClass: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800",
          desc: "Customer viewed the formal quotation proposal.",
        };
      case "CODE_REQUESTED":
        return {
          label: "Verification Code Sent",
          badgeClass: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800",
          desc: "2FA authentication code delivered to customer.",
        };
      case "VERIFIED":
        return {
          label: "Customer Verified",
          badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
          desc: "Customer successfully passed 2FA verification.",
        };
      case "SIGNED":
      case "ACCEPTED":
        return {
          label: "Quote E-Signed",
          badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
          desc: "Customer formally accepted and e-signed proposal.",
        };
      case "CHANGES_REQUESTED":
        return {
          label: "Changes / Documents Requested",
          badgeClass: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
          desc: "Customer requested quote adjustments or required documents before signing.",
        };
      case "REVISION_CREATED":
        return {
          label: "Revision Generated",
          badgeClass: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800",
          desc: "New quote revision created from this version.",
        };
      case "CONVERTED_TO_INVOICE":
        return {
          label: "Converted to Invoice",
          badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
          desc: "Formal accounts receivable invoice generated.",
        };
      case "LINK_REVOKED":
        return {
          label: "Access Link Revoked",
          badgeClass: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
          desc: "Customer access link was invalidated.",
        };
      default:
        return {
          label: eventType.replace(/_/g, " "),
          badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
          desc: "",
        };
    }
  };
  const formatActorDisplay = (log: any) => {
    if (log.actor_name && log.actor_name !== "Portal User" && !log.actor_name.includes("-")) {
      return log.actor_email ? `${log.actor_name} (${log.actor_email})` : log.actor_name;
    }
    if (log.actor_email) {
      return log.actor_email;
    }
    if (log.actor_type === "CUSTOMER") {
      return "Customer / Client";
    }
    if (log.actor_type === "USER") {
      return "Staff Member";
    }
    return "System Automated";
  };
  return { navigate, isSendModalOpen, setIsSendModalOpen, copiedLink, isPaymentModalOpen, setIsPaymentModalOpen, paymentAmount, setPaymentAmount, paymentMethod, setPaymentMethod, paymentRef, setPaymentRef, paymentGLCode, setPaymentGLCode, paymentClass, setPaymentClass, paymentNotes, setPaymentNotes, paymentSubmitting, quote, isLoading, isError, refetch, auditLogs, refetchLogs, publishMutation, draftMutation, revokeLinksMutation, convertInvoiceMutation, revisionMutation, deleteMutation, handleCopyLink, handleRecordPayment, formatAuditEvent, formatActorDisplay };
}
