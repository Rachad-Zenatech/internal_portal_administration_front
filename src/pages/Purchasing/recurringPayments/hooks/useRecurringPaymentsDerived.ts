import { useMemo } from "react";
import { RequestStatus, type PurchaseRequest } from "@/types/purchasing";
import { parseRequestStatus } from "@/lib/requestStatus";
import { getRecurringAmounts } from "../../utils/recurringScheduleUtils";
import type { useRecurringPaymentsActions } from "./useRecurringPaymentsActions";
import type { useRecurringPaymentsActions2 } from "./useRecurringPaymentsActions2";

export function useRecurringPaymentsDerived(ctx: ReturnType<typeof useRecurringPaymentsActions> & ReturnType<typeof useRecurringPaymentsActions2>) {
  const { statusFilter, reviewFilter, priorityFilter, dueFilter, cardFilter, searchTerm, requests } = ctx;
  // Helper to check if a recurring request is strictly synced from M&A
  const isMaTransaction = (r: PurchaseRequest | any) => {
    if (!r) return false;
    const src = (r.source_portal || "").toString().toLowerCase().trim();
    return Boolean(
      r.is_ma === true ||
      r.type === "m&a" ||
      src === "m7a" ||
      src === "m&a" ||
      src === "m_and_a" ||
      src === "ma"
    );
  };
  // Helper to check if a recurring request is an Accounts Payable / Wire transfer request
  // Uses the payment_domain / is_ap flag on recurring_schedule or quote_data so Purchase Request scheduled payments stay in Purchase Requests
  const isApTransaction = (r: PurchaseRequest | any) => {
    if (!r) return false;
    const cat = String(r.category || r.request_type || "").toUpperCase();
    if (
      cat === "ACCOUNTS_PAYABLE" ||
      cat === "AP" ||
      cat === "WIRE_TRANSFER" ||
      cat === "WIRE" ||
      Boolean(r.wire_transfer)
    ) {
      return true;
    }
    const domain = String(
      r.recurring_schedule?.payment_domain || r.quote_data?.payment_domain || ""
    )
      .toUpperCase()
      .trim();
    const isApFlag = Boolean(r.recurring_schedule?.is_ap || r.quote_data?.is_ap);
    return domain === "AP" || isApFlag;
  };
  // Helper to check if a recurring request is a Purchase Request (non-AP recurring subscription / purchase request scheduled payment)
  const isPurchaseRequestTransaction = (r: PurchaseRequest | any) => {
    if (!r) return false;
    if (isMaTransaction(r)) return false;
    return !isApTransaction(r);
  };
  // Helper to check if a recurring request is due within 7 days
  const isDueSoon = (r: PurchaseRequest) => {
    const dateStr = r.due_date || r.request_date;
    const st = parseRequestStatus(r.status);
    if (!dateStr || st === RequestStatus.Completed || st === RequestStatus.Rejected) return false;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    d.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  };
  // Exclude M&A transactions (which belong in /purchasing/invoices) from Recurring Payments
  const nonMaRequests = useMemo(() => requests.filter((r) => !isMaTransaction(r)), [requests]);
  // Filtered requests
  const filteredRequests = useMemo(() => {
    return nonMaRequests.filter((r) => {
      const parsedStatus = parseRequestStatus(r.status);
      const isRejected = parsedStatus === RequestStatus.Rejected;

      if (searchTerm && searchTerm.trim()) {
        const rawTerm = searchTerm.toLowerCase().trim();
        const cleanIdTerm = rawTerm.replace(/^(?:req-#|req-|rec-#|rec-|#)/i, "").trim();
        const idStr = String(r.id ?? "").toLowerCase();
        const titleStr = String(r.title ?? "").toLowerCase();
        const reqStr = String(r.requester ?? "").toLowerCase();
        const deptStr = String(r.department ?? "").toLowerCase();
        const descStr = String(r.description ?? "").toLowerCase();
        const vendorStr = String((r as any).vendor ?? r.product_info?.vendor ?? "").toLowerCase();
        const statusStr = String(r.status ?? "").toLowerCase();
        const amountStr = String(r.amount ?? "");
        const glStr = String(r.gl_code ?? "").toLowerCase();
        const { displayAmount, nextFormatted, totalFormatted } = getRecurringAmounts(
          r.recurring_schedule,
          r.amount,
          r.currency || "USD",
          r.status,
          r.due_date || r.request_date
        );

        const matches =
          idStr.includes(rawTerm) ||
          (cleanIdTerm.length > 0 && idStr.includes(cleanIdTerm)) ||
          titleStr.includes(rawTerm) ||
          reqStr.includes(rawTerm) ||
          deptStr.includes(rawTerm) ||
          descStr.includes(rawTerm) ||
          vendorStr.includes(rawTerm) ||
          statusStr.includes(rawTerm) ||
          amountStr.includes(rawTerm) ||
          displayAmount.toLowerCase().includes(rawTerm) ||
          nextFormatted.toLowerCase().includes(rawTerm) ||
          (totalFormatted && totalFormatted.toLowerCase().includes(rawTerm)) ||
          glStr.includes(rawTerm);

        if (!matches) {
          return false;
        }
      }
      if (cardFilter === "ALL") {
        // "All Recurring Payments" tab: includes all active recurring subscriptions and M&A scheduled payments
        if (isRejected) return false;
      } else if (cardFilter === "PURCHASE_REQUESTS" || cardFilter === "REQUESTS") {
        // "Purchase Requests" sub nav: recurring purchase requests
        if (isRejected) return false;
        if (!isPurchaseRequestTransaction(r)) return false;
      } else if (cardFilter === "AP" || cardFilter === "ACCOUNTS_PAYABLE") {
        // "A/P (Accounts Payable)" sub nav: recurring wire and AP requests
        if (isRejected) return false;
        if (!isApTransaction(r)) return false;
      } else if (cardFilter === "MA_SCHEDULED" || cardFilter === "SCHEDULED") {
        // "M&A Scheduled" tab: strictly show M&A transactions
        if (isRejected) return false;
        if (!isMaTransaction(r)) return false;
      } else if (cardFilter === "DUE_SOON" || cardFilter === "AP_DUE_SOON" || cardFilter === "PR_DUE_SOON" || cardFilter === "ALL_DUE_SOON") {
        // Due in 7 Days: scoped to A/P for DUE_SOON / AP_DUE_SOON, Purchase Requests for PR_DUE_SOON
        if (!isDueSoon(r)) return false;
        if (cardFilter === "PR_DUE_SOON" && !isPurchaseRequestTransaction(r)) return false;
        if ((cardFilter === "DUE_SOON" || cardFilter === "AP_DUE_SOON") && !isApTransaction(r)) return false;
      } else if (cardFilter === "WAITING_REVIEW" || cardFilter === "PR_WAITING_REVIEW" || cardFilter === "AP_WAITING_REVIEW") {
        // Waiting for Review: includes all payments; PR_/AP_ variants are the level-2 sub navs
        if (isRejected || parsedStatus === RequestStatus.Completed || r.status === "COMPLETED" || (r.status as string) === "PAID") return false;
        const rev = r.review_status || "WAITING_FOR_REVIEW";
        if (rev !== "WAITING_FOR_REVIEW") return false;
        if (cardFilter === "PR_WAITING_REVIEW" && !isPurchaseRequestTransaction(r)) return false;
        if (cardFilter === "AP_WAITING_REVIEW" && !isApTransaction(r)) return false;
      } else if (cardFilter === "REVIEWED" || cardFilter === "PR_REVIEWED" || cardFilter === "AP_REVIEWED") {
        // Reviewed (AP): includes all payments; PR_/AP_ variants are the level-2 sub navs
        if (isRejected || parsedStatus === RequestStatus.Completed || r.status === "COMPLETED" || (r.status as string) === "PAID") return false;
        if (r.review_status !== "REVIEWED") return false;
        if (cardFilter === "PR_REVIEWED" && !isPurchaseRequestTransaction(r)) return false;
        if (cardFilter === "AP_REVIEWED" && !isApTransaction(r)) return false;
      } else if (cardFilter === "ON_HOLD" || cardFilter === "PR_ON_HOLD" || cardFilter === "AP_ON_HOLD") {
        // On Hold: includes all payments; PR_/AP_ variants are the level-2 sub navs
        if (parsedStatus !== RequestStatus.OnHold && r.status !== "ON_HOLD") return false;
        if (cardFilter === "PR_ON_HOLD" && !isPurchaseRequestTransaction(r)) return false;
        if (cardFilter === "AP_ON_HOLD" && !isApTransaction(r)) return false;
      } else if (cardFilter === "COMPLETED" || cardFilter === "PR_COMPLETED" || cardFilter === "AP_COMPLETED") {
        // Completed: includes all payments; PR_/AP_ variants are the level-2 sub navs under Purchase Requests / A/P
        const isComp = parsedStatus === RequestStatus.Completed || r.status === "COMPLETED" || (r.status as string) === "PAID";
        if (!isComp) return false;
        if (cardFilter === "PR_COMPLETED" && !isPurchaseRequestTransaction(r)) return false;
        if (cardFilter === "AP_COMPLETED" && !isApTransaction(r)) return false;
      } else if (cardFilter === "REJECTED" || cardFilter === "PR_REJECTED" || cardFilter === "AP_REJECTED") {
        // Rejected: includes all payments; PR_/AP_ variants are the level-2 sub navs
        if (!isRejected) return false;
        if (cardFilter === "PR_REJECTED" && !isPurchaseRequestTransaction(r)) return false;
        if (cardFilter === "AP_REJECTED" && !isApTransaction(r)) return false;
      }
      if (dueFilter !== "ALL") {
        const isCompOrRej =
          parsedStatus === RequestStatus.Completed ||
          parsedStatus === RequestStatus.Rejected ||
          r.status === "COMPLETED" ||
          r.status === "REJECTED" ||
          (r.status as string) === "PAID";
        if (isCompOrRej) return false;

        const dateStr = r.due_date || r.request_date;
        if (!dateStr) return false;
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return false;
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        d.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (dueFilter === "DUE_TODAY" && diffDays !== 0) return false;
        if (dueFilter === "DUE_7_DAYS" && (diffDays < 0 || diffDays > 7)) return false;
        if (dueFilter === "OVERDUE" && diffDays >= 0) return false;
      }
      if (priorityFilter !== "ALL") {
        const p = (r.priority || "MEDIUM").toUpperCase();
        if (p !== priorityFilter.toUpperCase()) return false;
      }
      if (dueFilter !== "ALL") {
        const isCompOrRej =
          parsedStatus === RequestStatus.Completed ||
          parsedStatus === RequestStatus.Rejected ||
          r.status === "COMPLETED" ||
          r.status === "REJECTED" ||
          (r.status as string) === "PAID";
        if (isCompOrRej) return false;

        const dateStr = r.due_date || r.request_date;
        if (!dateStr) return false;
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return false;
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        d.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (dueFilter === "DUE_TODAY" && diffDays !== 0) return false;
        if (dueFilter === "DUE_7_DAYS" && (diffDays < 0 || diffDays > 7)) return false;
        if (dueFilter === "OVERDUE" && diffDays >= 0) return false;
      }
      if (priorityFilter !== "ALL") {
        const p = (r.priority || "MEDIUM").toUpperCase();
        if (p !== priorityFilter.toUpperCase()) return false;
      }
      if (reviewFilter !== "ALL") {
        const rev = r.review_status || "WAITING_FOR_REVIEW";
        if (rev !== reviewFilter) return false;
      }
      if (statusFilter !== "ALL") {
        const targetStatus = parseRequestStatus(statusFilter);
        const isComp = statusFilter === "COMPLETED" && (parsedStatus === RequestStatus.Completed || r.status === "COMPLETED" || (r.status as string) === "PAID");
        if (!isComp && parsedStatus !== targetStatus && r.status !== statusFilter) {
          return false;
        }
      }
      return true;
    });
  }, [nonMaRequests, searchTerm, cardFilter, dueFilter, priorityFilter, reviewFilter, statusFilter]);
  // Determine active sub-navigation scope ("PR" = Purchase Requests, "AP" = A/P, "ALL" = All Recurring)
  const activeScope: "PR" | "AP" | "ALL" = useMemo(() => {
    if (cardFilter === "PURCHASE_REQUESTS" || cardFilter === "REQUESTS" || cardFilter.startsWith("PR_")) {
      return "PR";
    }
    if (
      cardFilter === "AP" ||
      cardFilter === "ACCOUNTS_PAYABLE" ||
      cardFilter === "MA_SCHEDULED" ||
      cardFilter === "SCHEDULED" ||
      cardFilter === "DUE_SOON" ||
      cardFilter.startsWith("AP_")
    ) {
      return "AP";
    }
    return "ALL";
  }, [cardFilter]);

  // Summary statistics scoped to the active sub-nav (Purchase Requests vs A/P vs All)
  const stats = useMemo(() => {
    const activeAll = nonMaRequests.filter((r) => parseRequestStatus(r.status) !== RequestStatus.Rejected);
    const purchaseRequests = activeAll.filter(isPurchaseRequestTransaction).length;
    const apPayments = activeAll.filter(isApTransaction).length;

    const scopedRequests =
      activeScope === "PR"
        ? nonMaRequests.filter(isPurchaseRequestTransaction)
        : activeScope === "AP"
        ? nonMaRequests.filter(isApTransaction)
        : nonMaRequests;

    const activeScoped = scopedRequests.filter(
      (r) => parseRequestStatus(r.status) !== RequestStatus.Rejected
    );
    const activeNotCompletedScoped = activeScoped.filter(
      (r) =>
        parseRequestStatus(r.status) !== RequestStatus.Completed &&
        r.status !== "COMPLETED" &&
        (r.status as string) !== "PAID"
    );

    const total = activeAll.length; // "All Recurring Payments" card count
    const maScheduled = scopedRequests
      .filter(isMaTransaction)
      .filter((r) => parseRequestStatus(r.status) !== RequestStatus.Rejected).length;
    const dueSoon = scopedRequests.filter(isDueSoon).length; // "Due in 7 Days" within scope
    const waitingReview = activeNotCompletedScoped.filter(
      (r) => (r.review_status || "WAITING_FOR_REVIEW") === "WAITING_FOR_REVIEW"
    ).length; // "Waiting for Review" within scope
    const reviewed = activeNotCompletedScoped.filter(
      (r) => r.review_status === "REVIEWED"
    ).length; // "Reviewed (AP)" within scope
    const onHold = scopedRequests.filter(
      (r) => parseRequestStatus(r.status) === RequestStatus.OnHold || r.status === "ON_HOLD"
    ).length; // "On Hold" within scope
    const completed = scopedRequests.filter(
      (r) => parseRequestStatus(r.status) === RequestStatus.Completed || r.status === "COMPLETED" || (r.status as string) === "PAID"
    ).length; // "Completed" within scope
    const rejected = scopedRequests.filter((r) => parseRequestStatus(r.status) === RequestStatus.Rejected).length; // "Rejected" within scope
    const totalAmount = activeScoped.reduce((sum, r) => sum + (r.amount || 0), 0);
    return { activeScope, total, purchaseRequests, apPayments, maScheduled, dueSoon, waitingReview, reviewed, onHold, completed, rejected, totalAmount };
  }, [nonMaRequests, activeScope]);
  return { activeScope, isMaTransaction, isApTransaction, isPurchaseRequestTransaction, filteredRequests, stats };
}
