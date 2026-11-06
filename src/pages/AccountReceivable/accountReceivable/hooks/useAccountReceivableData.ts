import { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { arInvoiceService } from "../../../../services/arInvoiceService";
import type { GeneratedInvoiceSummary } from "../../../../services/arInvoiceService";
import { arQuoteService } from "../../../../services/arQuoteService";
import type { ARQuote } from "../../../../services/arQuoteService";
import { useNotificationStream } from "@/hooks/useNotifications";
import { oauthService } from "../../../../services/oauthService";
import { useSyncHubSpotCompanies } from "../../../../hooks/useHubSpotCompanies";
import type { ARTab, CustomerInvoiceGroup } from "../types";
import { HUBSPOT_COMPANIES_PAGE_SIZE } from "../constants";

export function useAccountReceivableData() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const requestedTab = searchParams.get("tab");
  // "customers" was removed; old links fall back to the overview
  const activeTab: ARTab = requestedTab && requestedTab !== "customers" ? (requestedTab as ARTab) : "overview";
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
  // HubSpot Companies Search & Query
  const [hubspotSearchTerm, setHubspotSearchTerm] = useState("");
  const [debouncedHubspotSearch, setDebouncedHubspotSearch] = useState("");
  const [hubspotPage, setHubspotPage] = useState(0);
  const [hubspotBrand, setHubspotBrand] = useState<string>("all");
  const { data: hubspotBrandsData } = useQuery({
    queryKey: ["hubspot-companies", "brands"],
    queryFn: () => oauthService.getHubSpotCompanyBrands(),
    staleTime: 5 * 60 * 1000,
  });
  const hubspotBrands = hubspotBrandsData?.brands ?? [];
  const [allHubspotCompaniesTotal, setAllHubspotCompaniesTotal] = useState(0);
  const {
    data: hubspotCompaniesData,
    isLoading: isHubspotCompaniesLoading,
    isFetching: isHubspotCompaniesFetching,
  } = useQuery({
    queryKey: ["hubspot-companies", debouncedHubspotSearch, hubspotPage, HUBSPOT_COMPANIES_PAGE_SIZE, hubspotBrand],
    queryFn: () =>
      oauthService.getHubSpotCompanies(
        debouncedHubspotSearch || undefined,
        HUBSPOT_COMPANIES_PAGE_SIZE,
        hubspotPage * HUBSPOT_COMPANIES_PAGE_SIZE,
        hubspotBrand === "all" ? undefined : hubspotBrand,
      ),
    placeholderData: keepPreviousData,
  });
  const hubspotCompanies = hubspotCompaniesData?.items || [];
  const hubspotTotal = hubspotCompaniesData?.total ?? 0;
  const hubspotPageCount = Math.max(1, Math.ceil(hubspotTotal / HUBSPOT_COMPANIES_PAGE_SIZE));
  const hubspotRangeStart = hubspotTotal === 0 ? 0 : hubspotPage * HUBSPOT_COMPANIES_PAGE_SIZE + 1;
  const hubspotRangeEnd = Math.min(hubspotTotal, hubspotPage * HUBSPOT_COMPANIES_PAGE_SIZE + hubspotCompanies.length);
  // Search runs on the server across every company; wait for a typing pause and restart at page 1.
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedHubspotSearch(hubspotSearchTerm.trim());
      setHubspotPage(0);
    }, 300);
    return () => clearTimeout(t);
  }, [hubspotSearchTerm]);
  // Keep the unfiltered total for the tab badge while searching.
  useEffect(() => {
    if (!debouncedHubspotSearch && hubspotBrand === "all" && hubspotCompaniesData) setAllHubspotCompaniesTotal(hubspotCompaniesData.total);
  }, [debouncedHubspotSearch, hubspotBrand, hubspotCompaniesData]);
  // Starts the sync in the background; progress and the result are shown by the app-shell HubSpotSyncProgress widget.
  const syncHubspotCompaniesMutation = useSyncHubSpotCompanies();
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
  // Generate Renewal Quote Mutation
  const generateRenewalQuoteMutation = useMutation({
    mutationFn: (invoiceId: string) => arInvoiceService.generateRenewalQuote(invoiceId),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["ar-quotes"] });
      queryClient.invalidateQueries({ queryKey: ["ar-invoices"] });
      queryClient.invalidateQueries({ queryKey: ["ar-quote-summary"] });
      setBannerSuccess(`Generated Renewal Quote #${result.quote_number}! Redirecting to quotation...`);
      setTimeout(() => {
        navigate(`/account-receivable/quotes/${encodeURIComponent(result.quote_id)}`);
      }, 600);
    },
    onError: (err: any) => {
      alert(err?.response?.data?.detail || err?.message || "Failed to generate renewal quote");
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
  // Accordion state for Customer Invoices grouping (Default: collapsed)
  const [expandedCustomerInvoiceKeys, setExpandedCustomerInvoiceKeys] = useState<Set<string>>(new Set());
  const toggleCustomerInvoiceExpanded = (customerKey: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedCustomerInvoiceKeys((prev) => {
      const next = new Set(prev);
      if (next.has(customerKey)) {
        next.delete(customerKey);
      } else {
        next.add(customerKey);
      }
      return next;
    });
  };
  const handleExpandAllInvoiceCustomers = (keys: string[]) => {
    setExpandedCustomerInvoiceKeys(new Set(keys));
  };
  const handleCollapseAllInvoiceCustomers = () => {
    setExpandedCustomerInvoiceKeys(new Set());
  };
  // Group invoices by A/R customer and sort invoices by due date ascending
  const customerInvoiceGroups = useMemo<CustomerInvoiceGroup[]>(() => {
    const groupsMap = new Map<string, CustomerInvoiceGroup>();

    const parseDueDateEpoch = (dStr?: string): number => {
      if (!dStr) return Number.MAX_SAFE_INTEGER;
      try {
        const parts = dStr.split("/");
        if (parts.length === 3) {
          const month = parseInt(parts[0], 10) - 1;
          const day = parseInt(parts[1], 10);
          const year = parseInt(parts[2], 10);
          return new Date(year, month, day).getTime();
        }
        const t = new Date(dStr).getTime();
        if (!isNaN(t)) return t;
      } catch {
        // fallback
      }
      return Number.MAX_SAFE_INTEGER;
    };

    invoices.forEach((inv) => {
      const rawCustName = (inv.customer_name || inv.bill_to_name || "Direct Client").trim();
      const custKey = (inv.customer_id || rawCustName || "UNKNOWN").toLowerCase();

      if (!groupsMap.has(custKey)) {
        groupsMap.set(custKey, {
          customerKey: custKey,
          customerId: inv.customer_id,
          customerName: rawCustName,
          invoices: [],
          totalInvoiced: 0,
          totalBalanceDue: 0,
          hasOverdue: false,
        });
      }

      const grp = groupsMap.get(custKey)!;
      grp.invoices.push(inv);
      grp.totalInvoiced += Number(inv.total_amount) || 0;
      const balance = Number(inv.balance_due !== undefined ? inv.balance_due : (inv.status?.toUpperCase().startsWith("PAID") ? 0 : inv.total_amount)) || 0;
      grp.totalBalanceDue += balance;
      if ((inv.status || "").toUpperCase() === "OVERDUE") {
        grp.hasOverdue = true;
      }
    });

    const result: CustomerInvoiceGroup[] = Array.from(groupsMap.values());

    // Sort invoices inside each customer group by due date ascending (earliest due date first)
    result.forEach((grp) => {
      grp.invoices.sort((a, b) => {
        const timeA = parseDueDateEpoch(a.due_date);
        const timeB = parseDueDateEpoch(b.due_date);
        if (timeA !== timeB) return timeA - timeB;
        return parseDueDateEpoch(b.invoice_date) - parseDueDateEpoch(a.invoice_date);
      });

      const firstWithDueDate = grp.invoices.find((i) => !!i.due_date);
      grp.earliestDueDate = firstWithDueDate?.due_date;
    });

    // Sort customer groups alphabetically by customer name
    result.sort((a, b) => a.customerName.localeCompare(b.customerName));

    return result;
  }, [invoices]);
  return { navigate, activeTab, setActiveTab, searchTerm, setSearchTerm, statusFilter, setStatusFilter, quoteToSend, setQuoteToSend, selectedInvoiceForEmail, isInvoiceEmailModalOpen, setIsInvoiceEmailModalOpen, emailRecipient, setEmailRecipient, emailSubject, setEmailSubject, emailCustomMessage, setEmailCustomMessage, bannerSuccess, setBannerSuccess, summaryStats, quotes, refetchQuotes, invoices, refetchInvoices, customers, hubspotSearchTerm, setHubspotSearchTerm, debouncedHubspotSearch, hubspotPage, setHubspotPage, hubspotBrand, setHubspotBrand, hubspotBrands, allHubspotCompaniesTotal, isHubspotCompaniesLoading, isHubspotCompaniesFetching, hubspotCompanies, hubspotTotal, hubspotPageCount, hubspotRangeStart, hubspotRangeEnd, syncHubspotCompaniesMutation, convertInvoiceMutation, deleteQuoteMutation, deleteInvoiceMutation, generateRenewalQuoteMutation, sendInvoiceEmailMutation, handleOpenSendInvoiceEmail, selectedInvoiceForPayment, isInvoicePaymentModalOpen, setIsInvoicePaymentModalOpen, invoicePaymentAmount, setInvoicePaymentAmount, invoicePaymentMethod, setInvoicePaymentMethod, invoicePaymentDate, setInvoicePaymentDate, invoicePaymentRef, setInvoicePaymentRef, invoicePaymentGLCode, setInvoicePaymentGLCode, invoicePaymentClass, setInvoicePaymentClass, invoicePaymentNotes, setInvoicePaymentNotes, isSubmittingInvoicePayment, handleOpenRecordInvoicePayment, handleConfirmInvoicePayment, expandedQuoteIds, toggleQuoteExpanded, expandedCustomerInvoiceKeys, toggleCustomerInvoiceExpanded, handleExpandAllInvoiceCustomers, handleCollapseAllInvoiceCustomers, customerInvoiceGroups };
}
