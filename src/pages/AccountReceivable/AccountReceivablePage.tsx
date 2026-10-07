import { useState, useMemo, Fragment } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CornerDownRight,
  CreditCard,
  DollarSign,
  Eye,
  FileCheck2,
  FileText,
  Mail,
  MapPin,
  PenTool,
  Phone,
  Plus,
  Receipt,
  RefreshCw,
  Search,
  Send,
  Trash2,
  TrendingUp,
  Users,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import { Textarea } from "../../components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import {
  arInvoiceService,
} from "../../services/arInvoiceService";
import type {
  GeneratedInvoiceSummary,
} from "../../services/arInvoiceService";
import {
  arQuoteService,
} from "../../services/arQuoteService";
import type {
  ARQuote,
} from "../../services/arQuoteService";
import { SendQuoteModal } from "./SendQuoteModal";
import { GLCodeAutocomplete } from "../Purchasing/GLCodeAutocomplete";
import { ClassAutocomplete } from "../Purchasing/ClassAutocomplete";
import { useNotificationStream } from "@/hooks/useNotifications";

export type ARTab =
  | "overview"
  | "customers"
  | "quotes"
  | "to_invoice"
  | "invoices"
  | "awaiting_payment"
  | "completed"
  | "activity";

export default function AccountReceivablePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const activeTab: ARTab = (searchParams.get("tab") as ARTab) || "overview";
  const setActiveTab = (tab: ARTab) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (tab === "overview") {
          next.delete("tab");
        } else {
          next.set("tab", tab);
        }
        return next;
      },
      { replace: true }
    );
  };

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [quoteToSend, setQuoteToSend] = useState<ARQuote | null>(null);

  // Send Invoice Email State
  const [selectedInvoiceForEmail, setSelectedInvoiceForEmail] = useState<GeneratedInvoiceSummary | null>(null);
  const [isInvoiceEmailModalOpen, setIsInvoiceEmailModalOpen] = useState(false);
  const [emailSender, setEmailSender] = useState("test-invoices@zenatech.com");
  const [emailRecipient, setEmailRecipient] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailCustomMessage, setEmailCustomMessage] = useState("");


  // Notification Banner
  const [bannerSuccess, setBannerSuccess] = useState<string | null>(null);

  // Queries
  const { data: summaryStats, refetch: refetchSummaryStats } = useQuery({
    queryKey: ["ar-quote-summary"],
    queryFn: () => arQuoteService.getSummaryStats(),
  });

  const { data: quotes = [], refetch: refetchQuotes } = useQuery({
    queryKey: ["ar-quotes"],
    queryFn: () => arQuoteService.listQuotes(),
  });

  const { data: invoices = [], refetch: refetchInvoices } = useQuery({
    queryKey: ["ar-invoices"],
    queryFn: () => arInvoiceService.listInvoices(),
  });

  const { data: customers = [], refetch: refetchCustomers } = useQuery({
    queryKey: ["ar-customers"],
    queryFn: () => arInvoiceService.getCustomers(),
  });

  // Real-time SSE / WebSocket notifications & instant live cache updates
  useNotificationStream({
    onNotification: (raw: any) => {
      if (!raw) return;
      const isARType =
        raw.type === "WORKFLOW_SYNC" ||
        (raw.type && (raw.type.includes("AR_") || raw.type.includes("quote") || raw.type.includes("invoice") || raw.type.includes("payment") || raw.type.includes("PAYMENT") || raw.type.includes("audit"))) ||
        raw.entity_type === "ARQuote" ||
        raw.entity_type === "Quote" ||
        raw.entity_type === "ARInvoice" ||
        raw.entity_type === "Invoice" ||
        raw.entity_type === "ARCustomer";

      if (isARType) {
        queryClient.invalidateQueries({ queryKey: ["ar-quotes"] });
        queryClient.invalidateQueries({ queryKey: ["ar-quote-summary"] });
        queryClient.invalidateQueries({ queryKey: ["ar-invoices"] });
        queryClient.invalidateQueries({ queryKey: ["ar-customers"] });
        refetchQuotes();
        refetchInvoices();
        refetchSummaryStats();
        refetchCustomers();
        if (raw.entity_id) {
          queryClient.invalidateQueries({ queryKey: ["ar-quote-detail", raw.entity_id] });
          queryClient.invalidateQueries({ queryKey: ["ar-quote-audit", raw.entity_id] });
          queryClient.invalidateQueries({ queryKey: ["ar-invoice-detail", raw.entity_id] });
        }
      }
    },
  });

  // Convert to Invoice Mutation
  const convertInvoiceMutation = useMutation({
    mutationFn: (id: string) => arQuoteService.convertToInvoice(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["ar-quotes"] });
      queryClient.invalidateQueries({ queryKey: ["ar-invoices"] });
      queryClient.invalidateQueries({ queryKey: ["ar-quote-summary"] });
      setBannerSuccess(res.message);
      setTimeout(() => setBannerSuccess(null), 5000);
    },
  });

  // Delete Draft Quote Mutation
  const deleteQuoteMutation = useMutation({
    mutationFn: (id: string) => arQuoteService.deleteQuote(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["ar-quotes"] });
      queryClient.invalidateQueries({ queryKey: ["ar-quote-summary"] });
      setBannerSuccess(res.message);
      setTimeout(() => setBannerSuccess(null), 5000);
    },
    onError: (err: any) => {
      alert(`Failed to delete quote: ${err.message || err}`);
    },
  });

  // Delete Invoice Mutation
  const deleteInvoiceMutation = useMutation({
    mutationFn: (id: string) => arInvoiceService.deleteInvoice(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["ar-invoices"] });
      queryClient.invalidateQueries({ queryKey: ["ar-quote-summary"] });
      setBannerSuccess(res.message || "Invoice deleted successfully.");
      setTimeout(() => setBannerSuccess(null), 5000);
    },
    onError: (err: any) => {
      alert(`Failed to delete invoice: ${err.message || err}`);
    },
  });

  // Send Invoice Email Mutation
  const sendInvoiceEmailMutation = useMutation({
    mutationFn: async () => {
      if (!selectedInvoiceForEmail) throw new Error("No invoice selected");
      return arInvoiceService.sendInvoiceEmail(selectedInvoiceForEmail.id, {
        from_email: emailSender.trim() || "test-invoices@zenatech.com",
        to_email: emailRecipient.trim(),
        subject: emailSubject.trim(),
        custom_message: emailCustomMessage.trim(),
      });
    },
    onSuccess: (res) => {
      setIsInvoiceEmailModalOpen(false);
      setBannerSuccess(res.message);
      setTimeout(() => setBannerSuccess(null), 5000);
    },
  });

  const handleOpenSendInvoiceEmail = (inv: GeneratedInvoiceSummary) => {
    setSelectedInvoiceForEmail(inv);
    setEmailSender("test-invoices@zenatech.com");
    const cust = customers.find((c) => c.id === inv.customer_id || c.id === `CUST-${inv.customer_id}`);
    setEmailRecipient(cust?.email || "");
    setEmailSubject(`Invoice ${inv.invoice_number} from ZenaTech Inc.`);
    setEmailCustomMessage("");
    setIsInvoiceEmailModalOpen(true);
  };

  // Record Invoice Payment Dialog State
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<GeneratedInvoiceSummary | null>(null);
  const [isInvoicePaymentModalOpen, setIsInvoicePaymentModalOpen] = useState(false);
  const [invoicePaymentAmount, setInvoicePaymentAmount] = useState<number | string>("");
  const [invoicePaymentMethod, setInvoicePaymentMethod] = useState("WIRE");
  const [invoicePaymentDate, setInvoicePaymentDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [invoicePaymentRef, setInvoicePaymentRef] = useState("");
  const [invoicePaymentGLCode, setInvoicePaymentGLCode] = useState("");
  const [invoicePaymentClass, setInvoicePaymentClass] = useState("");
  const [invoicePaymentNotes, setInvoicePaymentNotes] = useState("");
  const [isSubmittingInvoicePayment, setIsSubmittingInvoicePayment] = useState(false);

  const handleOpenRecordInvoicePayment = (inv: GeneratedInvoiceSummary) => {
    setSelectedInvoiceForPayment(inv);
    const balanceRemaining = inv.balance_due !== undefined ? inv.balance_due : (inv.total_amount - (inv.amount_paid || 0));
    setInvoicePaymentAmount(balanceRemaining > 0 ? balanceRemaining : (inv.total_amount || 0));
    setInvoicePaymentMethod("WIRE");
    setInvoicePaymentDate(new Date().toISOString().split("T")[0]);
    setInvoicePaymentRef("");
    setInvoicePaymentGLCode("");
    setInvoicePaymentClass("");
    setInvoicePaymentNotes("");
    setIsInvoicePaymentModalOpen(true);
  };

  const handleConfirmInvoicePayment = async () => {
    if (!selectedInvoiceForPayment) return;
    const numAmt = Number(invoicePaymentAmount);
    if (isNaN(numAmt) || numAmt <= 0) {
      alert("Please enter a valid payment amount greater than zero.");
      return;
    }
    setIsSubmittingInvoicePayment(true);
    try {
      await arInvoiceService.recordInvoicePayment(selectedInvoiceForPayment.id, {
        amount: numAmt,
        payment_method: invoicePaymentMethod,
        payment_date: invoicePaymentDate,
        reference_number: invoicePaymentRef,
        gl_code: invoicePaymentGLCode,
        category: invoicePaymentGLCode,
        class_name: invoicePaymentClass,
        class: invoicePaymentClass,
        notes: invoicePaymentNotes,
      });
      queryClient.invalidateQueries({ queryKey: ["ar-invoices"] });
      queryClient.invalidateQueries({ queryKey: ["ar-quotes"] });
      queryClient.invalidateQueries({ queryKey: ["ar-quote-summary"] });
      setIsInvoicePaymentModalOpen(false);
      setSelectedInvoiceForPayment(null);
      setBannerSuccess(`Successfully recorded $${numAmt.toFixed(2)} payment for invoice ${selectedInvoiceForPayment.invoice_number}`);
      setTimeout(() => setBannerSuccess(null), 5000);
    } catch (err: any) {
      alert("Failed to record invoice payment: " + (err?.response?.data?.detail || err.message));
    } finally {
      setIsSubmittingInvoicePayment(false);
    }
  };

  const [expandedQuoteIds, setExpandedQuoteIds] = useState<Set<string>>(new Set());

  const toggleQuoteExpanded = (quoteId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedQuoteIds((prev) => {
      const next = new Set(prev);
      if (next.has(quoteId)) {
        next.delete(quoteId);
      } else {
        next.add(quoteId);
      }
      return next;
    });
  };

  interface QuoteGroupItem {
    head: ARQuote;
    revisions: ARQuote[];
  }

  // Group quotes into parent (latest) and children (previous superseded revisions)
  const quoteGroups: QuoteGroupItem[] = useMemo(() => {
    const quoteById = new Map<string, ARQuote>();
    quotes.forEach((q) => quoteById.set(q.id, q));

    const normalizeQuoteNum = (num: string) => num.replace(/(-R|-REV|\.\d+)$/i, "").trim().toLowerCase();

    // A child is any quote that was superseded by another quote or served as a parent to another quote
    const childIds = new Set<string>();

    // 1. Direct parent/superseded links
    quotes.forEach((q) => {
      if (q.parent_quote_id && quoteById.has(q.parent_quote_id)) {
        childIds.add(q.parent_quote_id);
      }
      if (q.superseded_by_id && quoteById.has(q.superseded_by_id)) {
        childIds.add(q.id);
      }
    });

    // 2. Base quote_number grouping (e.g. "Quote# 29771" vs "Quote# 29771-R")
    quotes.forEach((q) => {
      if (q.publication_state === "DISABLED" || q.customer_response_state === "SUPERSEDED") {
        const hasActivePartner = quotes.some(
          (other) =>
            other.id !== q.id &&
            other.publication_state !== "DISABLED" &&
            (other.parent_quote_id === q.id ||
              q.superseded_by_id === other.id ||
              normalizeQuoteNum(other.quote_number) === normalizeQuoteNum(q.quote_number) ||
              other.quote_number === q.quote_number)
        );
        if (hasActivePartner) {
          childIds.add(q.id);
        }
      }
    });

    // 3. Top-level head quotes are those NOT marked as children
    const heads = quotes.filter((q) => !childIds.has(q.id));

    // Keep track of all revisions claimed to prevent duplicate rows across groups
    const claimedRevisionIds = new Set<string>();

    const groups: QuoteGroupItem[] = heads.map((head) => {
      const revisions: ARQuote[] = [];
      const visited = new Set<string>([head.id]);

      // Collect via parent_quote_id chain
      let currParentId = head.parent_quote_id;
      while (currParentId && quoteById.has(currParentId) && !visited.has(currParentId)) {
        const parentQuote = quoteById.get(currParentId)!;
        revisions.push(parentQuote);
        visited.add(currParentId);
        claimedRevisionIds.add(currParentId);
        currParentId = parentQuote.parent_quote_id;
      }

      // Collect any other quote pointing to this head or sharing the base quote number
      quotes.forEach((q) => {
        if (!visited.has(q.id)) {
          const isLinked =
            q.superseded_by_id === head.id ||
            q.parent_quote_id === head.id ||
            q.quote_number === head.quote_number ||
            normalizeQuoteNum(q.quote_number) === normalizeQuoteNum(head.quote_number);

          if (
            isLinked &&
            (q.publication_state === "DISABLED" ||
              q.customer_response_state === "SUPERSEDED" ||
              childIds.has(q.id))
          ) {
            revisions.push(q);
            visited.add(q.id);
            claimedRevisionIds.add(q.id);
          }
        }
      });

      // Sort revisions by current_version descending
      revisions.sort((a, b) => (b.current_version || 1) - (a.current_version || 1));

      return { head, revisions };
    });

    // Any remaining orphaned disabled quotes that were not claimed by any head
    const unclaimedOrphans = quotes.filter(
      (q) => childIds.has(q.id) && !claimedRevisionIds.has(q.id) && !heads.some((h) => h.id === q.id)
    );

    unclaimedOrphans.forEach((orphan) => {
      groups.push({ head: orphan, revisions: [] });
    });

    return groups;
  }, [quotes]);

  // Filter Logic over Quote Groups
  const filteredQuoteGroups = useMemo(() => {
    return quoteGroups.filter((group) => {
      const q = group.head;
      const term = searchTerm.toLowerCase().trim();
      const matchSearch =
        !term ||
        q.quote_number.toLowerCase().includes(term) ||
        (q.customer_name && q.customer_name.toLowerCase().includes(term)) ||
        (q.customer_email && q.customer_email.toLowerCase().includes(term)) ||
        group.revisions.some(
          (r) =>
            r.quote_number.toLowerCase().includes(term) ||
            (r.customer_name && r.customer_name.toLowerCase().includes(term))
        );

      if (!matchSearch) return false;
      if (statusFilter === "draft") return q.publication_state === "DRAFT";
      if (statusFilter === "published") return q.publication_state === "PUBLISHED" && q.customer_response_state !== "SIGNED";
      if (statusFilter === "signed") return q.customer_response_state === "SIGNED";
      if (statusFilter === "changes") return q.customer_response_state === "CHANGES_REQUESTED";
      return true;
    });
  }, [quoteGroups, searchTerm, statusFilter]);

  const toInvoiceQuotes = quotes.filter(
    (q) => q.customer_response_state === "SIGNED" && !q.invoice_id
  );

  const awaitingPaymentInvoices = invoices.filter(
    (inv) => !inv.status || !(inv.status.toUpperCase().startsWith("PAID"))
  );

  interface CompletedRecord {
    id: string;
    type: "INVOICE" | "QUOTE";
    number: string;
    customer_name: string;
    contact_person: string;
    paid_amount: number;
    currency: string;
    status: string;
    date: string;
    viewUrl: string;
  }

  const completedRecords = useMemo<CompletedRecord[]>(() => {
    const list: CompletedRecord[] = [];
    const linkedQuoteIds = new Set<string>();

    // 1. Fully paid invoices
    invoices.forEach((inv) => {
      const isPaid =
        (inv.status || "").toUpperCase().startsWith("PAID") ||
        (Number(inv.balance_due) === 0 && Number(inv.total_amount) > 0 && Number(inv.amount_paid) > 0);
      if (isPaid) {
        if (inv.quote_id) {
          linkedQuoteIds.add(String(inv.quote_id));
        }
        list.push({
          id: inv.id,
          type: "INVOICE",
          number: inv.invoice_number,
          customer_name: inv.customer_name || "—",
          contact_person: inv.bill_to_name || "—",
          paid_amount: Number(inv.amount_paid !== undefined && Number(inv.amount_paid) > 0 ? inv.amount_paid : inv.total_amount || 0),
          currency: inv.currency || "USD",
          status: inv.status || "PAID",
          date: inv.invoice_date || "",
          viewUrl: `/account-receivable/generate?invoiceId=${encodeURIComponent(inv.id)}`,
        });
      }
    });

    // 2. Fully paid quotes that aren't already represented by an invoice
    quotes.forEach((q) => {
      const isPaid = (q.payment_status || "").toUpperCase().startsWith("PAID");
      if (isPaid && !linkedQuoteIds.has(q.id)) {
        list.push({
          id: q.id,
          type: "QUOTE",
          number: q.quote_number,
          customer_name: q.customer_name || "—",
          contact_person: q.signer_name || "—",
          paid_amount: Number(q.paid_amount || q.total_amount || 0),
          currency: q.currency || "USD",
          status: q.payment_status || "PAID",
          date: q.quote_date || "",
          viewUrl: `/account-receivable/quotes/${q.id}`,
        });
      }
    });

    return list;
  }, [invoices, quotes]);

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950 p-4 sm:p-6 lg:p-8">
      <div className="w-full space-y-6">
        {/* Banner Alert */}
        {bannerSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{bannerSuccess}</span>
          </div>
        )}

        {/* Top Header & Global Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Receipt className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  Accounts Receivable
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  End-to-end management of proposal quotes, customer link signing, invoice dispatch, and payment recording.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                refetchQuotes();
                refetchInvoices();
              }}
              className="gap-2 text-xs rounded-xl border-slate-200 dark:border-slate-800 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              <span>Refresh</span>
            </Button>

            {/* Generate Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="gap-2 text-xs bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-medium px-4 py-2 rounded-xl shadow-xs cursor-pointer">
                  <Plus className="w-4 h-4" />
                  <span>Generate</span>
                  <ChevronDown className="w-3.5 h-3.5 opacity-70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 text-xs">
                <DropdownMenuItem
                  onClick={() => navigate("/account-receivable/generate-quote")}
                  className="gap-2 cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-amber-600" />
                  <span>Generate Quote</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => navigate("/account-receivable/generate")}
                  className="gap-2 cursor-pointer"
                >
                  <Receipt className="w-4 h-4 text-indigo-600" />
                  <span>Generate Invoice</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Workflow Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto border-b border-slate-200 dark:border-slate-800 pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "overview"
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Overview</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("customers")}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "customers"
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Customers &amp; Templates</span>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
              {customers.length}
            </Badge>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("quotes")}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "quotes"
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Quotes</span>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
              {quotes.length}
            </Badge>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("to_invoice")}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "to_invoice"
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>To Invoice</span>
            {toInvoiceQuotes.length > 0 && (
              <Badge className="bg-amber-600 text-white text-[10px] px-1.5 py-0 h-4">
                {toInvoiceQuotes.length}
              </Badge>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("invoices")}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "invoices"
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Invoices</span>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
              {invoices.length}
            </Badge>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("awaiting_payment")}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "awaiting_payment"
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Awaiting Payment</span>
            {awaitingPaymentInvoices.length > 0 && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-amber-50 text-amber-700">
                {awaitingPaymentInvoices.length}
              </Badge>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("completed")}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "completed"
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Completed</span>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
              {completedRecords.length}
            </Badge>
          </button>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* KPI Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-semibold">Total Quotes</span>
                  <FileText className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  {summaryStats?.total_quotes || quotes.length}
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <span>{summaryStats?.published_quotes || 0} Published</span>
                  <span>•</span>
                  <span>{summaryStats?.draft_quotes || 0} Drafts</span>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-semibold">Signed / To Invoice</span>
                  <FileCheck2 className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  {summaryStats?.to_invoice_count || toInvoiceQuotes.length}
                </div>
                <div className="text-[11px] text-slate-400">
                  Quotes signed and awaiting invoice generation
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-semibold">Total Invoices</span>
                  <Receipt className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">
                  {invoices.length}
                </div>
                <div className="text-[11px] text-slate-400">
                  Archived formal invoice snapshots
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-semibold">Total Outstanding (USD)</span>
                  <DollarSign className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
                  ${(summaryStats?.total_outstanding || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-[11px] text-slate-400">
                  Across all active proposals &amp; invoices
                </div>
              </div>
            </div>

            {/* Quick Attention Tasks Bar */}
            {toInvoiceQuotes.length > 0 && (
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <PenTool className="w-5 h-5 text-amber-600 shrink-0" />
                  <div>
                    <h3 className="text-xs font-bold">
                      {toInvoiceQuotes.length} Signed Quote{toInvoiceQuotes.length > 1 ? "s" : ""} Ready for Invoice Generation
                    </h3>
                    <p className="text-[11px] text-amber-700 mt-0.5">
                      Customer acceptance has been verified with handwritten signatures.
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => setActiveTab("to_invoice")}
                  className="h-8 text-xs bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-xs"
                >
                  View To Invoice Queue
                </Button>
              </div>
            )}

            {/* Outstanding Balances By Currency */}
            {summaryStats?.outstanding_by_currency && Object.keys(summaryStats.outstanding_by_currency).length > 0 && (
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
                <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <span>Outstanding Receivables by Currency</span>
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {Object.entries(summaryStats.outstanding_by_currency).map(([curr, amt]) => (
                    <div key={curr} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="text-[11px] font-bold text-slate-500 uppercase">{curr}</span>
                      <div className="text-lg font-bold text-slate-900 dark:text-white font-mono mt-0.5">
                        ${amt.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Customer Profiles & Template Shortcuts */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    <span>Customer Profiles &amp; Quick Generator</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Fast generation of custom quotes or invoices for active clients.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab("customers")}
                  className="text-xs rounded-xl cursor-pointer"
                >
                  <span>View All Customers ({customers.length})</span>
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {customers.slice(0, 3).map((cust) => (
                  <div
                    key={cust.id}
                    className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900 dark:text-white">{cust.name}</span>
                        {cust.has_template && (
                          <Badge className="bg-blue-50 text-blue-600 text-[9px] px-1.5 py-0">Template</Badge>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 block truncate">{cust.email || cust.contact_person || "No email"}</span>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/account-receivable/generate-quote?customerId=${encodeURIComponent(cust.id)}&customerName=${encodeURIComponent(cust.display_name || cust.name || "")}`)}
                        className="h-7 text-[11px] flex-1 text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/40 border-amber-200 cursor-pointer"
                      >
                        <FileText className="w-3 h-3 mr-1 text-amber-600" />
                        <span>Quote</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/account-receivable/generate?customerId=${encodeURIComponent(cust.id)}`)}
                        className="h-7 text-[11px] flex-1 text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border-indigo-200 cursor-pointer"
                      >
                        <Receipt className="w-3 h-3 mr-1 text-indigo-600" />
                        <span>Invoice</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: QUOTES */}
        {activeTab === "quotes" && (
          <div className="space-y-4">
            {/* Filter and Search */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  id="ar-quotes-search"
                  name="quotesSearch"
                  aria-label="Search quotations by number, customer, or email"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search quote #, customer name, email..."
                  className="pl-9 h-8 text-xs bg-slate-50 dark:bg-slate-800/60"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  id="ar-quotes-status-filter"
                  name="quotesStatusFilter"
                  aria-label="Filter quotations by status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-8 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="draft">Drafts</option>
                  <option value="published">Published</option>
                  <option value="signed">Signed</option>
                  <option value="changes">Changes Requested</option>
                </select>
              </div>
            </div>

            {/* Quotes Table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200/80 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Quote #</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4 text-right">Amount</th>
                      <th className="py-3 px-4">Publication</th>
                      <th className="py-3 px-4">Customer Response</th>
                      <th className="py-3 px-4">Last Viewed</th>
                      <th className="py-3 px-4">Link Expiry</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredQuoteGroups.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-400">
                          No quotations found matching your criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredQuoteGroups.map((group) => {
                        const q = group.head;
                        const isSigned = q.customer_response_state === "SIGNED";
                        const isChanges = q.customer_response_state === "CHANGES_REQUESTED";
                        const isSuperseded = q.publication_state === "DISABLED" || q.customer_response_state === "SUPERSEDED" || !!q.superseded_by_id;
                        const hasRevisions = group.revisions.length > 0;
                        const isExpanded = expandedQuoteIds.has(q.id);

                        return (
                          <Fragment key={q.id}>
                            <tr
                              onClick={() => navigate(`/account-receivable/quotes/${q.id}`)}
                              className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 cursor-pointer transition-colors ${
                                isSuperseded ? "opacity-70 bg-slate-50/40 dark:bg-slate-900/30" : ""
                              } ${isExpanded ? "bg-slate-50/50 dark:bg-slate-800/30" : ""}`}
                            >
                              <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                                <div className="flex items-center gap-1.5">
                                  {hasRevisions ? (
                                    <button
                                      type="button"
                                      onClick={(e) => toggleQuoteExpanded(q.id, e)}
                                      className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                                      title={isExpanded ? "Collapse revisions" : "Show previous versions"}
                                    >
                                      <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? "rotate-90 text-amber-600" : ""}`} />
                                    </button>
                                  ) : (
                                    <div className="w-5" />
                                  )}
                                  <span>{q.quote_number}</span>
                                  <span className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800/60">
                                    v{q.current_version}
                                  </span>
                                  {hasRevisions && (
                                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 text-slate-500 bg-white dark:bg-slate-800 border-slate-200">
                                      +{group.revisions.length} rev{group.revisions.length > 1 ? "s" : ""}
                                    </Badge>
                                  )}
                                </div>
                              </td>
                              <td className="py-3.5 px-4">
                                <strong className="block text-slate-800 dark:text-zinc-200">{q.customer_name || "Direct Client"}</strong>
                                <span className="text-[10px] text-slate-400">{q.customer_email || "No email"}</span>
                              </td>
                              <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-900 dark:text-white">
                                ${Number(q.total_amount).toFixed(2)} {q.currency}
                              </td>
                              <td className="py-3.5 px-4">
                                {isSuperseded ? (
                                  <Badge className="bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-[10px]">
                                    Disabled
                                  </Badge>
                                ) : q.publication_state === "PUBLISHED" ? (
                                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-300 text-[10px]">
                                    Published
                                  </Badge>
                                ) : (
                                  <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 text-[10px]">
                                    Draft
                                  </Badge>
                                )}
                              </td>
                              <td className="py-3.5 px-4">
                                {isSuperseded ? (
                                  <Badge variant="outline" className="text-[10px] text-slate-500 border-slate-300">
                                    Moved to v{q.superseded_by_version || q.current_version + 1}
                                  </Badge>
                                ) : isSigned ? (
                                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-300 text-[10px] gap-1">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>Signed</span>
                                  </Badge>
                                ) : isChanges ? (
                                  <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-[10px] font-semibold">
                                    Changes Requested
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-[10px] text-slate-500">
                                    Awaiting Response
                                  </Badge>
                                )}
                              </td>
                              <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                                {q.last_viewed_at ? new Date(q.last_viewed_at).toLocaleDateString() : "Not viewed"}
                              </td>
                              <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                                {q.active_link_expires_at ? new Date(q.active_link_expires_at).toLocaleDateString() : "—"}
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                                  {q.publication_state === "DRAFT" && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (window.confirm(`Are you sure you want to delete draft quote ${q.quote_number}? This action cannot be undone.`)) {
                                          deleteQuoteMutation.mutate(q.id);
                                        }
                                      }}
                                      disabled={deleteQuoteMutation.isPending}
                                      className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg cursor-pointer"
                                      title="Delete draft quote"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                  )}
                                  {!isSuperseded && q.publication_state === "PUBLISHED" && !isSigned && (
                                    <Button
                                      size="sm"
                                      onClick={() => setQuoteToSend(q)}
                                      className="h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white rounded-lg gap-1"
                                    >
                                      <Send className="w-3 h-3" />
                                      <span>Send</span>
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => navigate(`/account-receivable/quotes/${q.id}`)}
                                    className="h-7 text-xs rounded-lg cursor-pointer"
                                  >
                                    Details
                                  </Button>
                                </div>
                              </td>
                            </tr>

                            {/* Expandable Sub-items for Previous Revisions */}
                            {isExpanded &&
                              group.revisions.map((rev) => (
                                <tr
                                  key={rev.id}
                                  onClick={() => navigate(`/account-receivable/quotes/${rev.id}`)}
                                  className="bg-amber-50/20 dark:bg-amber-950/10 hover:bg-amber-100/30 dark:hover:bg-amber-900/20 cursor-pointer transition-colors text-slate-600 dark:text-slate-400 border-l-4 border-l-amber-500"
                                >
                                  <td className="py-2.5 px-4 font-mono">
                                    <div className="flex items-center gap-2 pl-7">
                                      <CornerDownRight className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                      <span className="text-slate-700 dark:text-slate-300 font-medium">{rev.quote_number}</span>
                                      <Badge className="bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-[9px] px-1.5 py-0">
                                        v{rev.current_version}
                                      </Badge>
                                      <span className="text-[10px] text-slate-400 font-sans italic">Previous Version</span>
                                    </div>
                                  </td>
                                  <td className="py-2.5 px-4 text-xs">
                                    <span className="text-slate-700 dark:text-slate-300">{rev.customer_name || "Direct Client"}</span>
                                  </td>
                                  <td className="py-2.5 px-4 text-right font-mono font-medium text-slate-700 dark:text-slate-300">
                                    ${Number(rev.total_amount).toFixed(2)} {rev.currency}
                                  </td>
                                  <td className="py-2.5 px-4">
                                    <Badge className="bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 text-[10px] border border-slate-200 dark:border-slate-700">
                                      Disabled
                                    </Badge>
                                  </td>
                                  <td className="py-2.5 px-4">
                                    <Badge variant="outline" className="text-[10px] text-amber-700 dark:text-amber-400 border-amber-300/80 bg-amber-50/50 dark:bg-amber-950/30">
                                      {rev.superseded_by_quote_number && rev.superseded_by_quote_number !== rev.quote_number
                                        ? `Superseded by ${rev.superseded_by_quote_number}`
                                        : `Superseded by v${rev.superseded_by_version || q.current_version}`}
                                    </Badge>
                                  </td>
                                  <td className="py-2.5 px-4 font-mono text-[10px] text-slate-400">
                                    {rev.last_viewed_at ? new Date(rev.last_viewed_at).toLocaleDateString() : "—"}
                                  </td>
                                  <td className="py-2.5 px-4 font-mono text-[10px] text-slate-400">
                                    {rev.active_link_expires_at ? new Date(rev.active_link_expires_at).toLocaleDateString() : "—"}
                                  </td>
                                  <td className="py-2.5 px-4 text-right">
                                    <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => navigate(`/account-receivable/quotes/${rev.id}`)}
                                        className="h-6 px-2 text-[11px] text-amber-700 dark:text-amber-400 hover:text-amber-800 hover:bg-amber-100/50 rounded-md cursor-pointer"
                                      >
                                        View Revision
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                          </Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: TO INVOICE */}
        {activeTab === "to_invoice" && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <PenTool className="w-4 h-4 text-amber-600" />
                    <span>Quotes Awaiting Invoice Generation</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    These quotes have been signed by the client and are ready for conversion into formal accounts receivable invoices.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 font-bold border-b border-slate-200/80">
                    <tr>
                      <th className="py-3 px-4">Quote #</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Signer Name</th>
                      <th className="py-3 px-4">Signed Date</th>
                      <th className="py-3 px-4 text-right">Amount</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {toInvoiceQuotes.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400">
                          No signed quotes currently pending invoice generation.
                        </td>
                      </tr>
                    ) : (
                      toInvoiceQuotes.map((q) => (
                        <tr
                          key={q.id}
                          onClick={() => navigate(`/account-receivable/quotes/${q.id}`)}
                          className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                        >
                          <td className="py-3 px-4 font-mono font-bold text-amber-700 dark:text-amber-400 hover:underline">
                            {q.quote_number}
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">{q.customer_name}</td>
                          <td className="py-3 px-4">{q.signer_name}</td>
                          <td className="py-3 px-4 text-slate-500 font-mono">
                            {q.signed_at ? new Date(q.signed_at).toLocaleString() : "—"}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold">
                            ${Number(q.total_amount).toFixed(2)} {q.currency}
                          </td>
                          <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/account-receivable/quotes/${q.id}`)}
                                className="h-7 text-xs gap-1 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                <span>Details</span>
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => convertInvoiceMutation.mutate(q.id)}
                                disabled={convertInvoiceMutation.isPending}
                                className="h-7 text-xs bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg shadow-xs cursor-pointer gap-1"
                              >
                                <Receipt className="w-3.5 h-3.5" />
                                <span>Create Invoice</span>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB: CUSTOMERS & TEMPLATES */}
        {activeTab === "customers" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span>Customer Profiles &amp; Saved Invoice Templates</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select any customer to generate a new proposal quote or customized invoice with pre-filled line items.
                </p>
              </div>
              <Button
                onClick={() => navigate("/account-receivable/generate")}
                className="gap-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Generate Invoice</span>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {customers.map((cust) => (
                <div
                  key={cust.id}
                  className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-blue-400 dark:hover:border-blue-500 transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Badge variant="outline" className="text-[10px] font-mono text-slate-500 mb-1">
                          {cust.id}
                        </Badge>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                          {cust.name}
                        </h4>
                      </div>
                      {cust.has_template ? (
                        <Badge className="bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 text-[10px] whitespace-nowrap">
                          <CheckCircle2 className="w-2.5 h-2.5 mr-1" />
                          Template Saved
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px] text-slate-500 whitespace-nowrap">
                          Default
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                      {cust.contact_person && (
                        <div className="flex items-center gap-2">
                          <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{cust.contact_person}</span>
                        </div>
                      )}
                      {cust.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{cust.email}</span>
                        </div>
                      )}
                      {cust.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{cust.phone}</span>
                        </div>
                      )}
                      {cust.billing_address && (
                        <div className="flex items-start gap-2">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{cust.billing_address}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button className="w-full gap-2 bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 text-white text-xs h-8 rounded-xl shadow-xs cursor-pointer">
                          <Plus className="w-3.5 h-3.5" />
                          <span>Generate</span>
                          <ChevronDown className="w-3.5 h-3.5 opacity-70 ml-auto" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 text-xs">
                        <DropdownMenuItem
                          onClick={() => navigate(`/account-receivable/generate-quote?customerId=${encodeURIComponent(cust.id)}&customerName=${encodeURIComponent(cust.display_name || cust.name || "")}`)}
                          className="gap-2 cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5 text-amber-600" />
                          <span>Generate Quote</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => navigate(`/account-receivable/generate?customerId=${encodeURIComponent(cust.id)}`)}
                          className="gap-2 cursor-pointer"
                        >
                          <Receipt className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Generate Invoice</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: INVOICES */}
        {activeTab === "invoices" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-indigo-600" />
                  <span>Generated Invoices &amp; Accounts Receivable</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Click any invoice to edit line items, print/download PDF, or send email statements via SendGrid.
                </p>
              </div>
              <Button
                onClick={() => navigate("/account-receivable/generate")}
                className="gap-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Generate New Invoice</span>
              </Button>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 font-bold border-b border-slate-200/80">
                    <tr>
                      <th className="py-3 px-4">Invoice #</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Due Date</th>
                      <th className="py-3 px-4 text-right">Total Amount</th>
                      <th className="py-3 px-4 text-right">Balance Due</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {invoices.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-400">
                          <p className="mb-3">No generated invoices archived yet.</p>
                          <Button
                            onClick={() => navigate("/account-receivable/generate")}
                            size="sm"
                            className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5 mr-1" />
                            <span>Create Your First Invoice</span>
                          </Button>
                        </td>
                      </tr>
                    ) : (
                      invoices.map((inv) => (
                        <tr
                          key={inv.id}
                          onClick={() => navigate(`/account-receivable/generate?invoiceId=${encodeURIComponent(inv.id)}`)}
                          className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                        >
                          <td className="py-3.5 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                            {inv.invoice_number}
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-zinc-200">
                            {inv.customer_name}
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 font-mono">{inv.invoice_date}</td>
                          <td className="py-3.5 px-4 text-slate-500 font-mono">{inv.due_date || "—"}</td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                            ${Number(inv.total_amount).toFixed(2)} {inv.currency || "USD"}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold">
                            <span className={Number(inv.balance_due !== undefined ? inv.balance_due : (inv.status?.toUpperCase().startsWith("PAID") ? 0 : inv.total_amount)) === 0 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}>
                              ${Number(inv.balance_due !== undefined ? inv.balance_due : (inv.status?.toUpperCase().startsWith("PAID") ? 0 : inv.total_amount)).toFixed(2)} {inv.currency || "USD"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <Badge
                              className={
                                (inv.status || "").toUpperCase() === "PAID (PRORATED)"
                                  ? "bg-teal-50 text-teal-800 dark:bg-teal-950/40 dark:text-teal-300 border-teal-300 dark:border-teal-700 text-[10px] font-semibold"
                                  : (inv.status || "").toUpperCase() === "PAID"
                                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 text-[10px]"
                                  : (inv.status || "").toUpperCase() === "DRAFT"
                                  ? "bg-slate-100 text-slate-700 border-slate-300 text-[10px]"
                                  : (inv.status || "").toUpperCase() === "OVERDUE"
                                  ? "bg-rose-50 text-rose-700 border-rose-200 text-[10px]"
                                  : (inv.status || "").toUpperCase() === "VOID" || (inv.status || "").toUpperCase() === "CANCELLED"
                                  ? "bg-zinc-100 text-zinc-500 border-zinc-200 text-[10px]"
                                  : "bg-blue-50 text-blue-700 border-blue-200 text-[10px]"
                              }
                            >
                              {inv.status || "ISSUED"}
                            </Badge>
                          </td>
                          <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenSendInvoiceEmail(inv)}
                                className="h-7 text-xs rounded-lg gap-1 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border-indigo-200 cursor-pointer"
                              >
                                <Mail className="w-3 h-3" />
                                <span>Send Email</span>
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (window.confirm(`Are you sure you want to delete invoice ${inv.invoice_number}? This action cannot be undone.`)) {
                                    deleteInvoiceMutation.mutate(inv.id);
                                  }
                                }}
                                disabled={deleteInvoiceMutation.isPending}
                                className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg cursor-pointer"
                                title="Delete invoice"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: AWAITING PAYMENT */}
        {activeTab === "awaiting_payment" && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 font-bold border-b border-slate-200/80">
                    <tr>
                      <th className="py-3 px-4">Invoice #</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Invoice Date</th>
                      <th className="py-3 px-4 text-right">Total Amount</th>
                      <th className="py-3 px-4 text-right">Balance Due</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {awaitingPaymentInvoices.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400">
                          No invoices currently awaiting payment.
                        </td>
                      </tr>
                    ) : (
                      awaitingPaymentInvoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-slate-50/70">
                          <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">{inv.invoice_number}</td>
                          <td className="py-3 px-4 font-semibold">{inv.customer_name}</td>
                          <td className="py-3 px-4 text-slate-500 font-mono">{inv.invoice_date}</td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                            ${Number(inv.total_amount).toFixed(2)} {inv.currency || "USD"}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold">
                            <span className={Number(inv.balance_due !== undefined ? inv.balance_due : (inv.total_amount - (inv.amount_paid || 0))) === 0 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}>
                              ${Number(inv.balance_due !== undefined ? inv.balance_due : (inv.total_amount - (inv.amount_paid || 0))).toFixed(2)} {inv.currency || "USD"}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Button
                              size="sm"
                              onClick={() => handleOpenRecordInvoicePayment(inv)}
                              className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs cursor-pointer gap-1"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>Record Payment</span>
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: COMPLETED */}
        {activeTab === "completed" && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 font-bold border-b border-slate-200/80">
                    <tr>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Invoice / Quote #</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Signer / Contact</th>
                      <th className="py-3 px-4 text-right">Paid Amount</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {completedRecords.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400">
                          No completed &amp; fully paid records yet.
                        </td>
                      </tr>
                    ) : (
                      completedRecords.map((item) => (
                        <tr
                          key={item.id}
                          onClick={() => navigate(item.viewUrl)}
                          className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                        >
                          <td className="py-3 px-4">
                            <Badge
                              variant="outline"
                              className={
                                item.type === "INVOICE"
                                  ? "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800 text-[10px]"
                                  : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 text-[10px]"
                              }
                            >
                              {item.type === "INVOICE" ? "Invoice" : "Quote"}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                            {item.number}
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">{item.customer_name}</td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{item.contact_person}</td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                            ${Number(item.paid_amount).toFixed(2)} {item.currency}
                          </td>
                          <td className="py-3 px-4">
                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-300 text-[10px]">
                              {item.status.toUpperCase().includes("PRORATED") ? "Paid (Prorated)" : "Completed & Paid"}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(item.viewUrl)}
                              className="h-7 text-xs gap-1 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                              <span>Details</span>
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Send Quote Modal */}
      {quoteToSend && (
        <SendQuoteModal
          quote={quoteToSend}
          isOpen={!!quoteToSend}
          onClose={() => setQuoteToSend(null)}
          onSentSuccess={(msg) => {
            setBannerSuccess(msg);
            setTimeout(() => setBannerSuccess(null), 5000);
          }}
        />
      )}

      {/* Send Invoice Email Modal */}
      <Dialog open={isInvoiceEmailModalOpen} onOpenChange={setIsInvoiceEmailModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-indigo-600" />
              <span>Send Invoice Statement</span>
            </DialogTitle>
            <DialogDescription>
              Email invoice statement <strong>{selectedInvoiceForEmail?.invoice_number}</strong> to customer.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label htmlFor="send-invoice-recipient-email" className="text-[11px] font-semibold">Recipient Email *</Label>
              <Input
                id="send-invoice-recipient-email"
                name="recipientEmail"
                type="email"
                value={emailRecipient}
                onChange={(e) => setEmailRecipient(e.target.value)}
                placeholder="client@example.com"
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="send-invoice-subject-line" className="text-[11px] font-semibold">Subject Line</Label>
              <Input
                id="send-invoice-subject-line"
                name="subjectLine"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="send-invoice-custom-message" className="text-[11px] font-semibold">Custom Message (Optional)</Label>
              <Textarea
                id="send-invoice-custom-message"
                name="customMessage"
                value={emailCustomMessage}
                onChange={(e) => setEmailCustomMessage(e.target.value)}
                rows={3}
                placeholder="Add special notes or payment reminder..."
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsInvoiceEmailModalOpen(false)}
              className="text-xs rounded-xl"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => sendInvoiceEmailMutation.mutate()}
              disabled={sendInvoiceEmailMutation.isPending || !emailRecipient.trim()}
              className="text-xs rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {sendInvoiceEmailMutation.isPending ? "Sending..." : "Send Invoice Email"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Record Invoice Payment Dialog (Centered modal dialog for invoices) */}
      <Dialog open={isInvoicePaymentModalOpen} onOpenChange={setIsInvoicePaymentModalOpen}>
        <DialogContent className="max-w-xl w-full">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <span>Record Invoice Payment</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Record a payment settlement against Invoice <strong>{selectedInvoiceForPayment?.invoice_number}</strong> for <strong>{selectedInvoiceForPayment?.customer_name}</strong>.
            </DialogDescription>
          </DialogHeader>

          {selectedInvoiceForPayment && (
            <div className="space-y-3 py-2 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white font-mono">{selectedInvoiceForPayment.invoice_number}</div>
                  <div className="text-[11px] text-slate-500">{selectedInvoiceForPayment.customer_name}</div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-slate-500">Balance Due</div>
                  <div className="font-mono font-bold text-amber-600 dark:text-amber-400">
                    ${Number(selectedInvoiceForPayment.balance_due !== undefined ? selectedInvoiceForPayment.balance_due : selectedInvoiceForPayment.total_amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })} {selectedInvoiceForPayment.currency || "USD"}
                  </div>
                  <div className="text-[10px] text-slate-400">Total: ${Number(selectedInvoiceForPayment.total_amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="record-invoice-payment-amount" className="text-[11px] font-semibold">
                  Payment Amount ({selectedInvoiceForPayment.currency || "USD"}) *
                </Label>
                <Input
                  id="record-invoice-payment-amount"
                  name="invoicePaymentAmount"
                  type="number"
                  step="any"
                  value={invoicePaymentAmount}
                  onChange={(e) => setInvoicePaymentAmount(e.target.value)}
                  placeholder={String(selectedInvoiceForPayment.total_amount || 0)}
                  className="h-8 text-xs font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="record-invoice-payment-method" className="text-[11px] font-semibold">Payment Method</Label>
                  <Input
                    id="record-invoice-payment-method"
                    name="invoicePaymentMethod"
                    value={invoicePaymentMethod}
                    onChange={(e) => setInvoicePaymentMethod(e.target.value)}
                    placeholder="WIRE, ACH, CHECK, CARD"
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="record-invoice-payment-date" className="text-[11px] font-semibold">Payment Date</Label>
                  <Input
                    id="record-invoice-payment-date"
                    name="invoicePaymentDate"
                    type="date"
                    value={invoicePaymentDate}
                    onChange={(e) => setInvoicePaymentDate(e.target.value)}
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="record-invoice-payment-ref" className="text-[11px] font-semibold">Reference / Tx ID (Optional)</Label>
                <Input
                  id="record-invoice-payment-ref"
                  name="invoicePaymentRef"
                  value={invoicePaymentRef}
                  onChange={(e) => setInvoicePaymentRef(e.target.value)}
                  placeholder="e.g. WIRE-88491 / CHK-1002"
                  className="h-8 text-xs font-mono"
                />
              </div>

              {/* 2 Auto-completed Fields: Category (GL Codes) & Class (Classes Table) */}
              <div className="space-y-3 pt-1 border-t border-slate-100 dark:border-slate-800">
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold flex items-center justify-between">
                    <span>Category (GL Code)</span>
                    <span className="text-[10px] text-slate-400 font-normal font-sans">Chart of Accounts</span>
                  </Label>
                  <GLCodeAutocomplete
                    value={invoicePaymentGLCode}
                    onChange={setInvoicePaymentGLCode}
                    placeholder="GL Code & Account..."
                    showDetailCard={false}
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold flex items-center justify-between">
                    <span>Class</span>
                    <span className="text-[10px] text-slate-400 font-normal font-sans">Classes Table</span>
                  </Label>
                  <ClassAutocomplete
                    value={invoicePaymentClass}
                    onChange={setInvoicePaymentClass}
                    placeholder="Select Class..."
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="record-invoice-payment-notes" className="text-[11px] font-semibold">Internal Notes (Optional)</Label>
                <Textarea
                  id="record-invoice-payment-notes"
                  name="invoicePaymentNotes"
                  value={invoicePaymentNotes}
                  onChange={(e) => setInvoicePaymentNotes(e.target.value)}
                  rows={2}
                  placeholder="Any settlement details or notes..."
                  className="text-xs resize-none"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsInvoicePaymentModalOpen(false)}
              className="text-xs rounded-xl"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmInvoicePayment}
              disabled={isSubmittingInvoicePayment || !invoicePaymentAmount || Number(invoicePaymentAmount) <= 0}
              className="text-xs rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 cursor-pointer shadow-xs"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>{isSubmittingInvoicePayment ? "Recording Payment..." : "Confirm Payment"}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Seats / Add-ons Modal from AR list */}
    </div>
  );
}
