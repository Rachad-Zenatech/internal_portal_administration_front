import { useMemo } from "react";
import { CheckCircle2, CreditCard, FileText, PenTool, Receipt } from "lucide-react";
import type { ARQuote } from "../../../../services/arQuoteService";
import type { ARTab, CustomerInvoiceGroup, QuoteGroupItem, CompletedInvoiceRecord } from "../types";
import type { useAccountReceivableData } from "./useAccountReceivableData";

export function useAccountReceivableDerived(ctx: ReturnType<typeof useAccountReceivableData>) {
  const { statusFilter, searchTerm, customerInvoiceGroups, quotes, invoices } = ctx;
  // Filter customer invoice groups by search term and status filter
  const filteredCustomerInvoiceGroups = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return customerInvoiceGroups
      .map((grp) => {
        const matchCustomer = !term || grp.customerName.toLowerCase().includes(term);
        const matchingInvoices = grp.invoices.filter((inv) => {
          const matchTerm =
            !term ||
            matchCustomer ||
            inv.invoice_number.toLowerCase().includes(term) ||
            (inv.customer_name && inv.customer_name.toLowerCase().includes(term)) ||
            (inv.due_date && inv.due_date.toLowerCase().includes(term)) ||
            (inv.status && inv.status.toLowerCase().includes(term));

          if (!matchTerm) return false;
          if (statusFilter === "all") return true;
          if (statusFilter === "paid") return (inv.status || "").toUpperCase().startsWith("PAID");
          if (statusFilter === "unpaid") return !(inv.status || "").toUpperCase().startsWith("PAID");
          if (statusFilter === "overdue") return (inv.status || "").toUpperCase() === "OVERDUE";
          if (statusFilter === "draft") return (inv.status || "").toUpperCase() === "DRAFT";
          return true;
        });

        if (matchingInvoices.length > 0) {
          return {
            ...grp,
            invoices: matchingInvoices,
          };
        }
        return null;
      })
      .filter(Boolean) as CustomerInvoiceGroup[];
  }, [customerInvoiceGroups, searchTerm, statusFilter]);
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
  const completedRecords = useMemo<CompletedInvoiceRecord[]>(() => {
    const list: CompletedInvoiceRecord[] = [];

    // Only fully paid & completed invoices
    invoices.forEach((inv: any) => {
      const isPaid =
        (inv.status || "").toUpperCase().startsWith("PAID") ||
        (inv.status || "").toUpperCase().includes("COMPLETED") ||
        (Number(inv.balance_due) === 0 && Number(inv.total_amount) > 0 && Number(inv.amount_paid) > 0);
      if (isPaid) {
        const hasRecItems = inv.items?.some((it: any) => {
          const freq = (it.billing_frequency || it.billing_type || "").toLowerCase();
          const badge = (it.badge || "").toLowerCase();
          return freq.includes("month") || freq.includes("annual") || freq.includes("semi") || freq.includes("quarter") || badge.includes("recurring") || badge.includes("prorated");
        });
        const isRec = inv.is_recurring || hasRecItems || false;

        list.push({
          id: inv.id,
          number: inv.invoice_number,
          customer_name: inv.customer_name || "—",
          contact_person: inv.bill_to_name || "—",
          paid_amount: Number(inv.amount_paid !== undefined && Number(inv.amount_paid) > 0 ? inv.amount_paid : inv.total_amount || 0),
          currency: inv.currency || "USD",
          status: inv.status || "PAID",
          date: inv.invoice_date || "",
          viewUrl: `/account-receivable/generate?invoiceId=${encodeURIComponent(inv.id)}`,
          is_recurring: isRec,
        });
      }
    });

    return list;
  }, [invoices]);
  // Pipeline stages, in lifecycle order. Each stage opens its existing tab view.
  const pipelineStages: {
    tab: ARTab;
    label: string;
    value: number;
    sub: string;
    icon: typeof FileText;
    tint: string;
    card: string;
    active: string;
    iconBg: string;
  }[] = [
    {
      tab: "quotes",
      label: "Quotes",
      value: quotes.length,
      sub: `${quotes.filter((q) => q.publication_state === "DRAFT").length} draft · ${
        quotes.filter((q) => q.publication_state === "PUBLISHED" && q.customer_response_state !== "SIGNED").length
      } with customer`,
      icon: FileText,
      tint: "text-amber-600",
      card: "border-l-amber-500 bg-amber-50/70 dark:bg-amber-950/20 hover:bg-amber-50 dark:hover:bg-amber-950/30",
      active: "border-amber-500 ring-2 ring-amber-500/30 bg-amber-100/70 dark:bg-amber-950/40",
      iconBg: "bg-amber-100 dark:bg-amber-900/40",
    },
    {
      tab: "to_invoice",
      label: "To Invoice",
      value: toInvoiceQuotes.length,
      sub: "signed, ready to invoice",
      icon: PenTool,
      tint: "text-sky-600",
      card: "border-l-sky-500 bg-sky-50/70 dark:bg-sky-950/20 hover:bg-sky-50 dark:hover:bg-sky-950/30",
      active: "border-sky-500 ring-2 ring-sky-500/30 bg-sky-100/70 dark:bg-sky-950/40",
      iconBg: "bg-sky-100 dark:bg-sky-900/40",
    },
    {
      tab: "invoices",
      label: "Invoices",
      value: invoices.length,
      sub: "all issued invoices",
      icon: Receipt,
      tint: "text-indigo-600",
      card: "border-l-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/20 hover:bg-indigo-50 dark:hover:bg-indigo-950/30",
      active: "border-indigo-500 ring-2 ring-indigo-500/30 bg-indigo-100/70 dark:bg-indigo-950/40",
      iconBg: "bg-indigo-100 dark:bg-indigo-900/40",
    },
    {
      tab: "awaiting_payment",
      label: "Awaiting Payment",
      value: awaitingPaymentInvoices.length,
      sub: `${awaitingPaymentInvoices.filter((i) => (i.status || "").toUpperCase() === "OVERDUE").length} overdue`,
      icon: CreditCard,
      tint: "text-fuchsia-600",
      card: "border-l-fuchsia-500 bg-fuchsia-50/70 dark:bg-fuchsia-950/20 hover:bg-fuchsia-50 dark:hover:bg-fuchsia-950/30",
      active: "border-fuchsia-500 ring-2 ring-fuchsia-500/30 bg-fuchsia-100/70 dark:bg-fuchsia-950/40",
      iconBg: "bg-fuchsia-100 dark:bg-fuchsia-900/40",
    },
    {
      tab: "completed",
      label: "Completed",
      value: completedRecords.length,
      sub: "fully paid",
      icon: CheckCircle2,
      tint: "text-emerald-600",
      card: "border-l-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/20 hover:bg-emerald-50 dark:hover:bg-emerald-950/30",
      active: "border-emerald-500 ring-2 ring-emerald-500/30 bg-emerald-100/70 dark:bg-emerald-950/40",
      iconBg: "bg-emerald-100 dark:bg-emerald-900/40",
    },
  ];
  return { filteredCustomerInvoiceGroups, filteredQuoteGroups, toInvoiceQuotes, awaitingPaymentInvoices, completedRecords, pipelineStages };
}
