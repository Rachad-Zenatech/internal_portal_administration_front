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
  const isApTransaction = (r: PurchaseRequest | any) => {
    if (!r) return false;
    const cat = String(r.category || r.request_type || "").toUpperCase();
    return (
      cat === "ACCOUNTS_PAYABLE" ||
      cat === "AP" ||
      cat === "WIRE_TRANSFER" ||
      cat === "WIRE" ||
      Boolean(r.wire_transfer)
    );
  };
  // Helper to check if a recurring request is a Purchase Request (non-AP recurring subscription / standard purchasing)
  const isPurchaseRequestTransaction = (r: PurchaseRequest | any) => {
    if (!r) return false;
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
  // Filtered requests
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
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
      } else if (cardFilter === "DUE_SOON") {
        // Due in 7 Days: includes all payments (both subscriptions and M&A scheduled payments)
        if (!isDueSoon(r)) return false;
      } else if (cardFilter === "WAITING_REVIEW") {
        // Waiting for Review: includes all payments (both subscriptions and M&A scheduled payments)
        if (isRejected) return false;
        const rev = r.review_status || "WAITING_FOR_REVIEW";
        if (rev !== "WAITING_FOR_REVIEW") return false;
      } else if (cardFilter === "REVIEWED") {
        // Reviewed (AP): includes all payments (both subscriptions and M&A scheduled payments)
        if (isRejected) return false;
        if (r.review_status !== "REVIEWED") return false;
      } else if (cardFilter === "ON_HOLD") {
        // On Hold: includes all payments (both subscriptions and M&A scheduled payments)
        if (parsedStatus !== RequestStatus.OnHold && r.status !== "ON_HOLD") return false;
      } else if (cardFilter === "COMPLETED") {
        // Completed: includes all payments (both subscriptions and M&A scheduled payments)
        const isComp = parsedStatus === RequestStatus.Completed || r.status === "COMPLETED" || (r.status as string) === "PAID";
        if (!isComp) return false;
      } else if (cardFilter === "REJECTED") {
        // Rejected: includes all payments (both subscriptions and M&A scheduled payments)
        if (!isRejected) return false;
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
  }, [requests, searchTerm, cardFilter, dueFilter, priorityFilter, reviewFilter, statusFilter]);
  // Summary statistics
  const stats = useMemo(() => {
    const maRequests = requests.filter(isMaTransaction);

    const activeAll = requests.filter((r) => parseRequestStatus(r.status) !== RequestStatus.Rejected);

    const total = activeAll.length; // "All Recurring Payments" card count
    const purchaseRequests = activeAll.filter(isPurchaseRequestTransaction).length;
    const apPayments = activeAll.filter(isApTransaction).length;
    const maScheduled = maRequests.filter((r) => parseRequestStatus(r.status) !== RequestStatus.Rejected).length; // "M&A Scheduled" card count
    const dueSoon = requests.filter(isDueSoon).length; // "Due in 7 Days"
    const waitingReview = activeAll.filter(
      (r) => (r.review_status || "WAITING_FOR_REVIEW") === "WAITING_FOR_REVIEW"
    ).length; // "Waiting for Review"
    const reviewed = activeAll.filter(
      (r) => r.review_status === "REVIEWED"
    ).length; // "Reviewed (AP)"
    const onHold = requests.filter(
      (r) => parseRequestStatus(r.status) === RequestStatus.OnHold || r.status === "ON_HOLD"
    ).length; // "On Hold"
    const completed = requests.filter(
      (r) => parseRequestStatus(r.status) === RequestStatus.Completed || r.status === "COMPLETED" || (r.status as string) === "PAID"
    ).length; // "Completed"
    const rejected = requests.filter((r) => parseRequestStatus(r.status) === RequestStatus.Rejected).length; // "Rejected"
    const totalAmount = activeAll.reduce((sum, r) => sum + (r.amount || 0), 0);
    return { total, purchaseRequests, apPayments, maScheduled, dueSoon, waitingReview, reviewed, onHold, completed, rejected, totalAmount };
  }, [requests]);
  return { isMaTransaction, isApTransaction, isPurchaseRequestTransaction, filteredRequests, stats };
}
