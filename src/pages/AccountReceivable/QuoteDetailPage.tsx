import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  CornerDownRight,
  CreditCard,
  FileCheck2,
  FileSpreadsheet,
  History,
  Layers,
  Link as LinkIcon,
  PenTool,
  Receipt,
  RotateCcw,
  Send,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Trash2,
  User,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { arQuoteService } from "@/services/arQuoteService";
import { useNotificationStream } from "@/hooks/useNotifications";
import { SendQuoteModal } from "./SendQuoteModal";
import { QuoteNotesThread } from "./QuoteNotesThread";
import { QuoteStepper } from "./QuoteStepper";

export default function QuoteDetailPage() {
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ar-quote-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["ar-quotes"] });
      queryClient.invalidateQueries({ queryKey: ["ar-invoices"] });
      queryClient.invalidateQueries({ queryKey: ["ar-quote-summary"] });
      refetch();
      refetchLogs();
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

  if (isLoading) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-6 animate-pulse">
        <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded-md" />
        <div className="h-12 w-96 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl md:col-span-2" />
          <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (isError || !quote) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Quotation Not Found</h2>
        <p className="text-xs text-slate-500">
          The requested quote does not exist, was removed, or you lack access permission.
        </p>
        <Button
          variant="outline"
          onClick={() => navigate("/account-receivable?tab=quotes")}
          className="text-xs gap-1.5 rounded-xl cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Quotations</span>
        </Button>
      </div>
    );
  }

  const isSigned = quote.customer_response_state === "SIGNED";
  const isChanges = quote.customer_response_state === "CHANGES_REQUESTED";
  const isSuperseded = quote.publication_state === "DISABLED" || quote.customer_response_state === "SUPERSEDED" || !!quote.superseded_by_id;
  const isPublished = quote.publication_state === "PUBLISHED" && !isSuperseded;
  const isDraft = quote.publication_state === "DRAFT" && !isSuperseded;
  const hasInvoice = !!quote.invoice_id;
  const isPaid = quote.payment_status === "PAID";

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* ── Top Navigation Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/account-receivable?tab=quotes")}
            className="h-8 text-xs gap-1.5 rounded-xl border-slate-200 dark:border-slate-800 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Quotes</span>
          </Button>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />

          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-900 dark:text-white font-mono text-sm">
              {quote.quote_number}
            </span>
            <Badge
              variant="outline"
              className={`text-[10px] font-mono uppercase ${
                isSuperseded
                  ? "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300"
                  : isSigned
                  ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                  : isPublished
                  ? "bg-amber-50 text-amber-700 border-amber-300"
                  : "bg-slate-100 text-slate-600 border-slate-200"
              }`}
            >
              {isSuperseded
                ? `Disabled (Moved to v${quote.superseded_by_version || quote.current_version + 1})`
                : isSigned
                ? "Accepted / Signed"
                : isPublished
                ? "Published"
                : "Draft"}
            </Badge>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          {isSuperseded && quote.superseded_by_id && (
            <Button
              size="sm"
              onClick={() => navigate(`/account-receivable/quotes/${quote.superseded_by_id}`)}
              className="h-8 text-xs rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-medium gap-1.5 cursor-pointer shadow-xs"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>View Latest Revision (v{quote.superseded_by_version || quote.current_version + 1})</span>
            </Button>
          )}

          {/* Send to Customer (Only if not superseded) */}
          {!isSuperseded && isPublished && !isSigned && (
            <Button
              size="sm"
              onClick={() => setIsSendModalOpen(true)}
              className="h-8 text-xs rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-medium gap-1.5 cursor-pointer shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send to Customer</span>
            </Button>
          )}

          {/* Edit Draft (Only if not superseded and not signed) */}
          {!isSuperseded && !isSigned && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/account-receivable/generate-quote?id=${quote.id}`)}
              className="h-8 text-xs rounded-xl border-slate-200 dark:border-slate-800 cursor-pointer gap-1.5"
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>Edit Quote</span>
            </Button>
          )}

          {/* Publish / Draft Toggle */}
          {!isSuperseded && !isSigned && !isPublished && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => publishMutation.mutate(quote.id)}
                disabled={publishMutation.isPending}
                className="h-8 text-xs rounded-xl border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer gap-1.5"
              >
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Publish</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (window.confirm(`Are you sure you want to delete draft quote ${quote.quote_number}? This action cannot be undone.`)) {
                    deleteMutation.mutate(quote.id);
                  }
                }}
                disabled={deleteMutation.isPending}
                className="h-8 text-xs rounded-xl border-rose-200 text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 dark:border-rose-800 cursor-pointer gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Delete Draft</span>
              </Button>
            </>
          )}

          {!isSuperseded && !isSigned && isPublished && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => draftMutation.mutate(quote.id)}
              disabled={draftMutation.isPending}
              className="h-8 text-xs rounded-xl border-slate-200 dark:border-slate-800 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Move to Draft</span>
            </Button>
          )}

          {/* Convert to Invoice */}
          {!isSuperseded && isSigned && (
            <Button
              size="sm"
              onClick={() => convertInvoiceMutation.mutate(quote.id)}
              disabled={convertInvoiceMutation.isPending}
              className="h-8 text-xs rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-medium gap-1.5 cursor-pointer shadow-xs"
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>{convertInvoiceMutation.isPending ? "Generating..." : "Generate Invoice"}</span>
            </Button>
          )}

          {/* Create Revision */}
          {!isSuperseded && (isSigned || isChanges) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => revisionMutation.mutate(quote.id)}
              disabled={revisionMutation.isPending}
              className="h-8 text-xs rounded-xl border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 cursor-pointer gap-1.5"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{revisionMutation.isPending ? "Creating..." : "Create New Revision"}</span>
            </Button>
          )}
        </div>
      </div>

      {/* ── Prominent Superseded / Disabled Banner ── */}
      {isSuperseded && (
        <div className="bg-slate-100 dark:bg-slate-800/80 border-2 border-slate-300 dark:border-slate-700 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0 mt-0.5">
              <Layers className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                This Quotation Version (v{quote.current_version}) is Disabled
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                A new revision has been created to supersede this version. Access links for this version have been revoked.
              </p>
            </div>
          </div>
          {quote.superseded_by_id && (
            <Button
              size="sm"
              onClick={() => navigate(`/account-receivable/quotes/${quote.superseded_by_id}`)}
              className="text-xs rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold gap-1.5 cursor-pointer shrink-0 self-end md:self-center"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Go to Revision v{quote.superseded_by_version || quote.current_version + 1}</span>
            </Button>
          )}
        </div>
      )}

      {/* ── Prominent Customer Change Request Alert Banner ── */}
      {!isSuperseded && isChanges && (
        <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 dark:from-amber-950/40 dark:via-orange-950/30 dark:to-amber-950/40 border-2 border-amber-300 dark:border-amber-700/80 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
              <XCircle className="w-6 h-6 text-amber-600" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-amber-950 dark:text-amber-200">
                  Customer Requested Changes / Required Documents
                </h3>
                {quote.change_requested_at && (
                  <span className="text-[11px] font-mono text-amber-700 dark:text-amber-400">
                    • {new Date(quote.change_requested_at).toLocaleString()}
                  </span>
                )}
              </div>
              <p className="text-xs text-amber-900 dark:text-amber-300 bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-amber-200/80 dark:border-amber-800/60 font-medium">
                "{quote.change_request_message || "Customer requested adjustments prior to acceptance."}"
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
            <Button
              size="sm"
              onClick={() => navigate(`/account-receivable/generate-quote?id=${quote.id}`)}
              className="text-xs rounded-xl bg-slate-800 hover:bg-slate-900 text-white gap-1.5 cursor-pointer"
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>Edit Quote</span>
            </Button>
            <Button
              size="sm"
              onClick={() => revisionMutation.mutate(quote.id)}
              disabled={revisionMutation.isPending}
              className="text-xs rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold gap-1.5 cursor-pointer shadow-xs"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{revisionMutation.isPending ? "Creating..." : "Create Revision v" + ((quote.current_version || 1) + 1)}</span>
            </Button>
          </div>
        </div>
      )}

      {/* ── Main Header Title Card ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white font-mono">
                {quote.quote_number}
              </h1>
              <Badge variant="outline" className="font-mono text-xs bg-slate-50 dark:bg-slate-800">
                Revision v{quote.current_version}
              </Badge>
              {quote.parent_quote_id && (
                <Badge
                  variant="outline"
                  onClick={() => navigate(`/account-receivable/quotes/${quote.parent_quote_id}`)}
                  className="font-mono text-[11px] bg-slate-50 dark:bg-slate-800 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                >
                  Derived from v{quote.parent_quote_version || quote.current_version - 1}
                </Badge>
              )}
              {isSuperseded ? (
                <Badge className="bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-xs font-semibold">
                  Disabled (Moved to v{quote.superseded_by_version || quote.current_version + 1})
                </Badge>
              ) : isPublished ? (
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-300 text-xs font-medium">
                  Published
                </Badge>
              ) : isDraft ? (
                <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 text-xs font-medium">
                  Draft
                </Badge>
              ) : null}
              {!isSuperseded && isSigned ? (
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-300 text-xs gap-1 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Accepted & Signed</span>
                </Badge>
              ) : !isSuperseded && isChanges ? (
                <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-xs font-bold gap-1 animate-pulse">
                  <XCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Changes Requested</span>
                </Badge>
              ) : !isSuperseded && (
                <Badge variant="outline" className="text-xs text-slate-500">
                  Awaiting Customer Response
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-zinc-400 flex-wrap pt-1">
              <span className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <strong>{quote.customer_name || "Direct Client"}</strong>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Date: {new Date(quote.quote_date).toLocaleDateString()}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Validity: {quote.terms || `${quote.validity_days} days`}
              </span>
            </div>
          </div>

          {/* Amount Badge */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 self-start lg:self-auto">
            <div>
              <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Total Value</div>
              <div className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
                ${Number(quote.total_amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{" "}
                <span className="text-xs font-normal text-slate-500">{quote.currency}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Workflow Action Bar / Stepper (Purchasing Request Layout) ── */}
        <div className="pt-4 border-t border-slate-100 dark:border-zinc-800/80 space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Workflow Status</span>
            </span>
            <span className="text-xs">
              {isSuperseded ? (
                <span className="text-slate-500 dark:text-slate-400 font-medium">
                  ⏸ Version Disabled (Superseded by v{quote.superseded_by_version || quote.current_version + 1})
                </span>
              ) : isPaid ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Quotation &amp; Payment Cycle Completed</span>
                </span>
              ) : hasInvoice ? (
                <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                  Invoice Generated • Awaiting Payment Collection &amp; Settlement
                </span>
              ) : isSigned ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Proposal Signed &amp; Verified — Ready for Invoice Generation</span>
                </span>
              ) : isChanges ? (
                <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1 animate-pulse">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Action Required: Customer Requested Changes</span>
                </span>
              ) : isPublished ? (
                <span className="text-amber-600 dark:text-amber-400 font-medium">
                  Live Customer Portal Active • Awaiting Client Review &amp; E-Sign
                </span>
              ) : (
                <span className="text-slate-500 dark:text-zinc-400 font-medium">
                  Draft Mode • Finalize Line Items &amp; Publish
                </span>
              )}
            </span>
          </div>

          {/* Stepper Pipeline (Horizontal Connected Pill Track matching Purchasing Request) */}
          <div className="py-1">
            <QuoteStepper quote={quote} />
          </div>

          {/* Action Prompt Banner */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/60 flex items-center justify-between flex-wrap gap-3">
            <div className="text-xs text-slate-700 dark:text-zinc-300 flex items-center gap-2 flex-wrap">
              <span className="font-bold text-indigo-600 dark:text-indigo-400">
                {isPaid ? "Status:" : isSuperseded ? "Notice:" : "Action Required:"}
              </span>
              {isSuperseded ? (
                <span>
                  This quotation version (v{quote.current_version}) is disabled. Workflow continues on revision{" "}
                  <strong>v{quote.superseded_by_version || quote.current_version + 1}</strong>.
                </span>
              ) : isPaid ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                  Payment of ${Number(quote.total_amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {quote.currency} has been settled.
                </span>
              ) : hasInvoice ? (
                <span>
                  Invoice #{quote.invoice_id?.slice(0, 8)} generated. Record settlement when payment arrives.
                </span>
              ) : isSigned ? (
                <span>
                  Proposal accepted and signed by <strong>{quote.signer_name || "Customer"}</strong>. Click <strong>'Generate Invoice'</strong> to create Accounts Receivable invoice.
                </span>
              ) : isChanges ? (
                <span>
                  Customer requested revisions. Review discussion notes below or click <strong>'Create Revision'</strong> to generate v{((quote.current_version || 1) + 1)}.
                </span>
              ) : isPublished && (quote.active_links_count || 0) === 0 ? (
                <span>
                  Proposal published. Click <strong>'Send to Customer'</strong> or copy the live link to deliver to the client.
                </span>
              ) : isPublished ? (
                <span>
                  Live link is active. Customer is reviewing the proposal. You can collaborate in the <strong>Documents &amp; Notes</strong> thread below.
                </span>
              ) : (
                <span>
                  Quotation in draft. Click <strong>'Publish'</strong> to activate the secure customer portal.
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {isSuperseded && quote.superseded_by_id && (
                <Button
                  size="sm"
                  onClick={() => navigate(`/account-receivable/quotes/${quote.superseded_by_id}`)}
                  className="h-8 text-xs rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-medium gap-1.5 cursor-pointer shadow-xs"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Go to Revision v{quote.superseded_by_version || quote.current_version + 1}</span>
                </Button>
              )}

              {!isSuperseded && isDraft && (
                <>
                  <Button
                    size="sm"
                    onClick={() => publishMutation.mutate(quote.id)}
                    disabled={publishMutation.isPending}
                    className="h-8 text-xs rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{publishMutation.isPending ? "Publishing..." : "Publish Proposal"}</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/account-receivable/generate-quote?id=${quote.id}`)}
                    className="h-8 text-xs rounded-xl border-slate-200 dark:border-slate-800 cursor-pointer gap-1.5"
                  >
                    <PenTool className="w-3.5 h-3.5" />
                    <span>Edit Line Items</span>
                  </Button>
                </>
              )}

              {!isSuperseded && isPublished && !isSigned && !isChanges && (
                <>
                  <Button
                    size="sm"
                    onClick={() => setIsSendModalOpen(true)}
                    className="h-8 text-xs rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-medium gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send to Customer</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyLink}
                    className="h-8 text-xs rounded-xl border-slate-200 dark:border-slate-800 cursor-pointer gap-1.5"
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    <span>{copiedLink ? "Link Copied!" : "Copy Portal Link"}</span>
                  </Button>
                </>
              )}

              {!isSuperseded && isChanges && (
                <>
                  <Button
                    size="sm"
                    onClick={() => revisionMutation.mutate(quote.id)}
                    disabled={revisionMutation.isPending}
                    className="h-8 text-xs rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>{revisionMutation.isPending ? "Creating..." : `Create Revision v${(quote.current_version || 1) + 1}`}</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/account-receivable/generate-quote?id=${quote.id}`)}
                    className="h-8 text-xs rounded-xl border-slate-200 dark:border-slate-800 cursor-pointer gap-1.5"
                  >
                    <PenTool className="w-3.5 h-3.5" />
                    <span>Edit Directly</span>
                  </Button>
                </>
              )}

              {!isSuperseded && isSigned && !hasInvoice && (
                <Button
                  size="sm"
                  onClick={() => convertInvoiceMutation.mutate(quote.id)}
                  disabled={convertInvoiceMutation.isPending}
                  className="h-8 text-xs rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold gap-1.5 cursor-pointer shadow-xs"
                >
                  <FileCheck2 className="w-3.5 h-3.5" />
                  <span>{convertInvoiceMutation.isPending ? "Generating..." : "Generate Invoice"}</span>
                </Button>
              )}

              {!isSuperseded && hasInvoice && !isPaid && (
                <>
                  <Button
                    size="sm"
                    onClick={() => setIsPaymentModalOpen(true)}
                    className="h-8 text-xs rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5 cursor-pointer shadow-xs"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Record Payment</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/account-receivable?tab=invoices")}
                    className="h-8 text-xs rounded-xl border-slate-200 dark:border-slate-800 cursor-pointer gap-1.5"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>View Invoices</span>
                  </Button>
                </>
              )}

              {!isSuperseded && isPaid && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/account-receivable?tab=invoices")}
                  className="h-8 text-xs rounded-xl border-slate-200 dark:border-slate-800 cursor-pointer gap-1.5"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>View Invoices</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── 2-Column Content Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Document Details & Line Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer & Prepared By Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 uppercase tracking-wider">
                <Building2 className="w-3.5 h-3.5 text-amber-600" />
                <span>Quotation For</span>
              </span>
              <div className="text-xs space-y-1 text-slate-600 dark:text-zinc-300">
                {quote.customer_name && <p className="font-semibold text-slate-900 dark:text-white text-sm">{quote.customer_name}</p>}
                {quote.customer_contact_person && <p>Contact: {quote.customer_contact_person} {quote.customer_contact_title ? `(${quote.customer_contact_title})` : ""}</p>}
                {quote.customer_email && <p>Email: {quote.customer_email}</p>}
                {quote.customer_phone && <p>Phone: {quote.customer_phone}</p>}
                {quote.customer_billing_address && <p className="text-slate-400 whitespace-pre-line pt-1">{quote.customer_billing_address}</p>}
                {!quote.customer_name && !quote.customer_contact_person && !quote.customer_email && (
                  <p className="text-slate-400 italic">—</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 uppercase tracking-wider">
                <User className="w-3.5 h-3.5 text-amber-600" />
                <span>Prepared By</span>
              </span>
              <div className="text-xs space-y-1 text-slate-600 dark:text-zinc-300">
                {quote.company_name && <p className="font-semibold text-slate-900 dark:text-white text-sm">{quote.company_name}</p>}
                {quote.prepared_by_name && <p>Representative: {quote.prepared_by_name}</p>}
                {quote.prepared_by_email && <p>Email: {quote.prepared_by_email}</p>}
                {!quote.company_name && !quote.prepared_by_name && !quote.prepared_by_email && (
                  <p className="text-slate-400 italic">—</p>
                )}
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-wider">
                <FileSpreadsheet className="w-4 h-4 text-amber-600" />
                <span>Line Items ({quote.line_items?.length || 0})</span>
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-slate-500 font-medium">
                    <th className="py-3 px-4">Item & Description</th>
                    <th className="py-3 px-4 text-right w-28">Unit Price</th>
                    <th className="py-3 px-4 text-right w-20">Qty</th>
                    <th className="py-3 px-4 text-right w-32">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {quote.line_items?.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400">
                        No line items recorded for this quotation.
                      </td>
                    </tr>
                  ) : (
                    quote.line_items?.map((item: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900 dark:text-white">{item.name || "—"}</div>
                          {item.description && (
                            <div className="text-[11px] text-slate-400 mt-0.5">{item.description}</div>
                          )}
                          {(item.billing_frequency || item.term || item.billing_start_date) && (
                            <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[10.5px] text-slate-500">
                              {item.billing_frequency && (
                                <Badge variant="outline" className="text-[9.5px] px-1.5 py-0">
                                  {item.billing_frequency}
                                </Badge>
                              )}
                              {item.term && (
                                <span>• {item.term} terms</span>
                              )}
                              {item.billing_start_date && (
                                <span>• Start: {item.billing_start_date}</span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-700 dark:text-zinc-300">
                          <div>${Number(item.price || 0).toFixed(2)}</div>
                          {Number(item.unit_discount || 0) > 0 && (
                            <div className="text-[10px] text-emerald-600">
                              -{item.unit_discount}{item.discount_type === "$" ? "$" : "%"}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-700 dark:text-zinc-300">
                          {item.quantity}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                          ${Number(item.subtotal || 0).toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Financial Summary */}
            <div className="p-4 bg-slate-50/50 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <div className="w-64 space-y-2 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal</span>
                  <span className="font-mono font-medium">${Number(quote.subtotal || 0).toFixed(2)}</span>
                </div>
                {Number(quote.discount || 0) > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount</span>
                    <span className="font-mono">- ${Number(quote.discount).toFixed(2)}</span>
                  </div>
                )}
                {Number(quote.tax || 0) > 0 && (
                  <div className="flex justify-between text-slate-500">
                    <span>Tax</span>
                    <span className="font-mono">+ ${Number(quote.tax).toFixed(2)}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between font-bold text-sm text-slate-900 dark:text-white">
                  <span>Total</span>
                  <span className="font-mono text-amber-600 dark:text-amber-400">
                    ${Number(quote.total_amount).toFixed(2)} {quote.currency}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Signature Verification Certificate */}
          {isSigned && (
            <div className="bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                    Cryptographic Acceptance & Signature Certificate
                  </h4>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                    Legally binding electronic signature verified with SHA-256 audit hashing.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-white dark:bg-slate-900 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
                <div className="space-y-1">
                  <span className="text-slate-400">Signer Name</span>
                  <p className="font-bold text-slate-900 dark:text-white">{quote.signer_name || "Customer"}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400">Signer Title / Designation</span>
                  <p className="font-medium text-slate-800 dark:text-zinc-200">{quote.signer_title || "Authorized Representative"}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400">Timestamp</span>
                  <p className="font-mono text-slate-800 dark:text-zinc-200">
                    {quote.signed_at ? new Date(quote.signed_at).toLocaleString() : "—"}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400">IP Address</span>
                  <p className="font-mono text-slate-800 dark:text-zinc-200">{quote.signed_ip || "127.0.0.1"}</p>
                </div>
                {quote.signed_document_hash && (
                  <div className="sm:col-span-2 space-y-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400">Document SHA-256 Hash</span>
                    <p className="font-mono text-[10px] text-slate-600 dark:text-zinc-400 break-all bg-slate-50 dark:bg-slate-800 p-2 rounded-lg">
                      {quote.signed_document_hash}
                    </p>
                  </div>
                )}
                {quote.signature_data_url && (
                  <div className="sm:col-span-2 space-y-1 pt-1">
                    <span className="text-slate-400">Handwritten Signature</span>
                    <div className="p-3 bg-white border border-slate-200 rounded-xl max-w-sm">
                      <img
                        src={quote.signature_data_url}
                        alt="Customer Signature"
                        className="max-h-20 h-auto w-auto object-contain"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Customer Change Request Notice */}
          {isChanges && quote.change_request_message && (
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-2xl p-5 space-y-2">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs">
                <XCircle className="w-4 h-4 text-amber-600" />
                <span>Customer Requested Changes</span>
              </div>
              <p className="text-xs text-amber-900 dark:text-amber-200 bg-white dark:bg-slate-900 p-3 rounded-xl border border-amber-100 dark:border-amber-900/40">
                "{quote.change_request_message}"
              </p>
            </div>
          )}

          {/* Documents Required & Messages Thread */}
          <QuoteNotesThread
            quoteId={quote.id}
            authorType="SALES"
            defaultAuthorName={quote.prepared_by_name || "Sales Team"}
            defaultAuthorEmail={quote.prepared_by_email || ""}
          />
        </div>

        {/* Right Column (1 Col): Security Link, Payments, and Audit Logs */}
        <div className="space-y-6">
          {/* Version Lineage Card */}
          {quote.version_history && quote.version_history.length > 1 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-wider">
                  <Layers className="w-4 h-4 text-amber-600" />
                  <span>Version Lineage</span>
                </h3>
                <Badge variant="outline" className="text-[10px]">
                  {quote.version_history.length} versions
                </Badge>
              </div>

              <div className="space-y-1.5">
                {quote.version_history.map((ver) => {
                  const isCurrent = ver.id === quote.id;
                  const isVerDisabled =
                    ver.publication_state === "DISABLED" ||
                    ver.customer_response_state === "SUPERSEDED" ||
                    !!ver.superseded_by_id;
                  const isVerSigned = ver.customer_response_state === "SIGNED";

                  return (
                    <button
                      key={ver.id}
                      type="button"
                      disabled={isCurrent}
                      onClick={() => navigate(`/account-receivable/quotes/${ver.id}`)}
                      className={`w-full text-left p-3 rounded-xl text-xs transition-all flex items-center justify-between gap-2 ${
                        isCurrent
                          ? "bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/60 font-semibold shadow-xs"
                          : "hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-slate-100 dark:border-slate-800/60 cursor-pointer text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {isVerDisabled && (
                          <CornerDownRight className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        )}
                        <div className="truncate">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                              {ver.quote_number}
                            </span>
                            <span className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-200 dark:border-amber-800/60">
                              v{ver.current_version}
                            </span>
                          </div>
                          <div className="text-[10.5px] text-slate-400 mt-0.5 font-mono">
                            {new Date(ver.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {isCurrent ? (
                          <Badge className="bg-amber-600 text-white text-[9px] px-1.5 py-0">
                            Current Viewing
                          </Badge>
                        ) : isVerDisabled ? (
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 text-slate-500 border-slate-300 dark:border-slate-700 bg-slate-100/80 dark:bg-slate-800">
                            Disabled
                          </Badge>
                        ) : isVerSigned ? (
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-300 text-[9px] px-1.5 py-0">
                            Signed
                          </Badge>
                        ) : (
                          <Badge className="bg-sky-50 text-sky-700 border-sky-300 text-[9px] px-1.5 py-0">
                            {ver.publication_state === "PUBLISHED" ? "Published" : "Draft"}
                          </Badge>
                        )}
                        <span className="font-mono text-[11px] font-medium text-slate-700 dark:text-slate-300">
                          ${Number(ver.total_amount).toFixed(2)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Customer Access Link Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-wider">
              <LinkIcon className="w-4 h-4 text-amber-600" />
              <span>Customer Access Link</span>
            </h3>

            {isSuperseded ? (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-center space-y-3">
                <p className="text-xs text-slate-500">
                  This version is <strong>Disabled</strong>. Customer access links were revoked when version v{quote.superseded_by_version || quote.current_version + 1} was created.
                </p>
                {quote.superseded_by_id && (
                  <Button
                    size="sm"
                    onClick={() => navigate(`/account-receivable/quotes/${quote.superseded_by_id}`)}
                    className="text-xs bg-amber-600 hover:bg-amber-700 text-white rounded-xl gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Go to Active Revision</span>
                  </Button>
                )}
              </div>
            ) : isPublished ? (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Link Status</span>
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-300 text-[10px]">
                      Active Link
                    </Badge>
                  </div>
                  {quote.active_link_expires_at && (
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Expires On</span>
                      <span className="font-mono">{new Date(quote.active_link_expires_at).toLocaleDateString()}</span>
                    </div>
                  )}
                  {quote.last_viewed_at && (
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Last Viewed</span>
                      <span className="font-mono">{new Date(quote.last_viewed_at).toLocaleString()}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyLink}
                    className="flex-1 text-xs rounded-xl border-slate-200 dark:border-slate-800 gap-1.5 cursor-pointer"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? "Copied Link!" : "Copy Access URL"}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => revokeLinksMutation.mutate(quote.id)}
                    disabled={revokeLinksMutation.isPending}
                    className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl cursor-pointer"
                    title="Revoke active link"
                  >
                    <ShieldX className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-center space-y-2">
                <p className="text-xs text-slate-500">
                  This quote is currently a <strong>Draft</strong>. Publish it to generate secure customer access links.
                </p>
                <Button
                  size="sm"
                  onClick={() => publishMutation.mutate(quote.id)}
                  disabled={publishMutation.isPending}
                  className="text-xs bg-amber-600 hover:bg-amber-700 text-white rounded-xl gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Publish Quote</span>
                </Button>
              </div>
            )}
          </div>

          {/* Immutable Audit Trail Timeline */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-wider">
              <History className="w-4 h-4 text-amber-600" />
              <span>Immutable Audit Trail ({auditLogs.length})</span>
            </h3>

            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {auditLogs.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No audit logs recorded yet.</p>
              ) : (
                auditLogs.map((log: any) => {
                  const evt = formatAuditEvent(log.event_type);
                  const actorDisplay = formatActorDisplay(log);
                  const logDate = new Date(log.created_at);
                  const formattedTime = isNaN(logDate.getTime())
                    ? ""
                    : logDate.toLocaleDateString([], { month: "short", day: "numeric" }) +
                      " • " +
                      logDate.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

                  return (
                    <div
                      key={log.id}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs space-y-1.5 transition-all hover:bg-slate-100/60 dark:hover:bg-slate-800/70"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant="outline" className={`text-[10px] font-semibold ${evt.badgeClass}`}>
                          {evt.label}
                        </Badge>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0">
                          {formattedTime}
                        </span>
                      </div>

                      <div className="text-slate-700 dark:text-zinc-200 font-medium text-[11px] flex items-center gap-1">
                        <span className="text-slate-400">By:</span>
                        <span className="font-semibold">{actorDisplay}</span>
                        {log.actor_type && log.actor_type !== "USER" && (
                          <span className="text-[10px] text-slate-400">({log.actor_type})</span>
                        )}
                      </div>

                      {evt.desc && (
                        <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                          {evt.desc}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-2 pt-0.5 text-[10px] text-slate-400 font-mono">
                        {log.quote_version && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-200/60 dark:bg-slate-700/60 text-slate-600 dark:text-zinc-300">
                            Version v{log.quote_version}
                          </span>
                        )}
                        {log.ip_address && (
                          <span>IP: {log.ip_address}</span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Modals ── */}
      {/* Send Quote Modal */}
      {quote && (
        <SendQuoteModal
          quote={quote}
          isOpen={isSendModalOpen}
          onClose={() => {
            setIsSendModalOpen(false);
            refetch();
            refetchLogs();
          }}
        />
      )}

      {/* Record Payment Modal */}
      {quote && (
        <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <span>Record Invoice Payment</span>
              </DialogTitle>
              <DialogDescription className="text-xs">
                Record a payment settlement against Quote {quote.quote_number} (Total: ${Number(quote.total_amount).toLocaleString("en-US", { minimumFractionDigits: 2 })} {quote.currency}).
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <div className="space-y-1">
                <Label className="text-[11px] font-semibold">Payment Amount ({quote.currency}) *</Label>
                <Input
                  type="number"
                  step="any"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder={quote.total_amount.toString()}
                  className="h-8 text-xs font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold">Payment Method</Label>
                  <Input
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    placeholder="e.g. WIRE, ACH, CHECK"
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold">Reference / Tx ID</Label>
                  <Input
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value)}
                    placeholder="e.g. WIRE-88491"
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-semibold">Internal Notes</Label>
                <Textarea
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  rows={2}
                  className="text-xs resize-none"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-xs rounded-xl"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleRecordPayment}
                disabled={paymentSubmitting || Number(paymentAmount) <= 0}
                className="text-xs rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {paymentSubmitting ? "Recording..." : "Confirm Payment"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
