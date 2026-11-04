import type { GeneratedInvoiceSummary } from "../../../services/arInvoiceService";
import type { ARQuote } from "../../../services/arQuoteService";

export type ARTab =
  | "overview"
  | "hubspot_companies"
  | "quotes"
  | "to_invoice"
  | "invoices"
  | "awaiting_payment"
  | "completed"
  | "activity";

  export interface CustomerInvoiceGroup {
    customerKey: string;
    customerId?: string;
    customerName: string;
    invoices: GeneratedInvoiceSummary[];
    totalInvoiced: number;
    totalBalanceDue: number;
    earliestDueDate?: string;
    hasOverdue: boolean;
  }

  export interface QuoteGroupItem {
    head: ARQuote;
    revisions: ARQuote[];
  }

  export interface CompletedInvoiceRecord {
    id: string;
    number: string;
    customer_name: string;
    contact_person: string;
    paid_amount: number;
    currency: string;
    status: string;
    date: string;
    viewUrl: string;
    is_recurring?: boolean;
  }
