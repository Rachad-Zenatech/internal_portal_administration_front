import type { ARQuote } from "../../../services/arQuoteService";
import type { GeneratedInvoiceSummary } from "../../../services/arInvoiceService";

// Single definition of the A/R pipeline statuses, shared by the A/R page tabs and the sidebar sub-menu counts.

export const isToInvoiceQuote = (q: ARQuote): boolean => q.customer_response_state === "SIGNED" && !q.invoice_id;

export const isAwaitingPaymentInvoice = (inv: GeneratedInvoiceSummary): boolean =>
  !inv.status || !inv.status.toUpperCase().startsWith("PAID");

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isCompletedInvoice = (inv: any): boolean =>
  (inv.status || "").toUpperCase().startsWith("PAID") ||
  (inv.status || "").toUpperCase().includes("COMPLETED") ||
  (Number(inv.balance_due) === 0 && Number(inv.total_amount) > 0 && Number(inv.amount_paid) > 0);

export interface ARStatusCounts {
  quotes: number;
  to_invoice: number;
  invoices: number;
  awaiting_payment: number;
  completed: number;
}

export function countARStatuses(quotes: ARQuote[], invoices: GeneratedInvoiceSummary[]): ARStatusCounts {
  return {
    quotes: quotes.length,
    to_invoice: quotes.filter(isToInvoiceQuote).length,
    invoices: invoices.length,
    awaiting_payment: invoices.filter(isAwaitingPaymentInvoice).length,
    completed: invoices.filter(isCompletedInvoice).length,
  };
}
