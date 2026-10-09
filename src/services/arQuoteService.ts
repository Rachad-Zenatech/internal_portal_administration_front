import { apiClient } from "./apiClient";

export interface ARQuoteLineItem {
  id?: string;
  name: string;
  description?: string;
  price: number | string;
  quantity: number | string;
  unit_discount?: number | string;
  discount_type?: "%" | "$";
  billing_frequency?: "One-Time" | "Monthly" | "Annually" | "One-time" | "" | string;
  term?: number | string;
  billing_start_date?: string;
  tax_rate?: number | string;
  subtotal: number;
}

export type PublicationState = "DRAFT" | "PUBLISHED" | "DISABLED";
export type CustomerResponseState = "AWAITING_RESPONSE" | "CHANGES_REQUESTED" | "SIGNED" | "SUPERSEDED";
export type PaymentStatus = "UNPAID" | "PARTIALLY_PAID" | "PAID";

export interface ARQuote {
  id: string;
  quote_number: string;
  current_version: number;
  publication_state: PublicationState;
  customer_id?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  customer_contact_person?: string;
  customer_contact_title?: string;
  customer_billing_address?: string;
  currency: string;
  quote_date: string;
  validity_days: number;
  valid_until?: string;
  prepared_by_name: string;
  prepared_by_email: string;
  company_name: string;
  logo_url?: string;
  line_items: ARQuoteLineItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total_amount: number;
  closing_message?: string;
  terms?: string;
  notes?: string;
  require_verification_to_view?: boolean;
  customer_response_state: CustomerResponseState;
  change_request_message?: string;
  change_requested_at?: string;
  signed_at?: string;
  signer_name?: string;
  signer_title?: string;
  signer_email?: string;
  signature_data_url?: string;
  agreement_accepted?: boolean;
  signed_ip?: string;
  signed_user_agent?: string;
  signed_document_hash?: string;
  signed_pdf_url?: string;
  invoice_id?: string;
  payment_status: PaymentStatus;
  paid_amount: number;
  parent_quote_id?: string;
  parent_quote_version?: number;
  parent_quote_number?: string;
  superseded_by_id?: string;
  superseded_by_version?: number;
  superseded_by_quote_number?: string;
  version_history?: ARQuoteVersionHistoryItem[];
  active_link_expires_at?: string;
  last_viewed_at?: string;
  active_links_count?: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ARQuoteVersionHistoryItem {
  id: string;
  quote_number: string;
  current_version: number;
  publication_state: PublicationState;
  customer_response_state: CustomerResponseState;
  total_amount: number;
  currency: string;
  created_at: string;
  superseded_by_id?: string;
  parent_quote_id?: string;
}

export interface ARQuoteSummaryStats {
  total_quotes: number;
  draft_quotes: number;
  published_quotes: number;
  signed_quotes: number;
  to_invoice_count: number;
  changes_requested_count: number;
  completed_count: number;
  total_outstanding: number;
  outstanding_by_currency: Record<string, number>;
  total_invoices: number;
  total_invoiced_amount: number;
}

export interface ARQuoteEmailTemplate {
  id: string;
  name: string;
  subject: string;
  body_html: string;
  is_default: boolean;
}

export interface ARQuoteAuditLog {
  id: string;
  quote_id: string;
  quote_version?: number;
  event_type: string;
  actor_type: "USER" | "CUSTOMER" | "SYSTEM";
  actor_id?: string;
  actor_name?: string;
  actor_email?: string;
  ip_address?: string;
  user_agent?: string;
  details?: Record<string, any>;
  created_at: string;
}

export interface ARQuoteAttachment {
  name: string;
  url: string;
  file_size?: number;
  content_type?: string;
}

export interface ARQuoteNote {
  id: string;
  quote_id: string;
  author_type: "SALES" | "CUSTOMER";
  author_name: string;
  author_email?: string;
  message: string;
  attachments: ARQuoteAttachment[];
  created_at: string;
}

export interface PublicQuoteResponse {
  success: boolean;
  valid: boolean;
  reason?: string;
  requires_verification_to_view?: boolean;
  quote?: ARQuote;
  recipient_email?: string;
  recipient_name?: string;
  expires_at?: string;
  quote_version?: number;
  is_mobile_session?: boolean;
}

export const arQuoteService = {
  // Staff Endpoints
  async listQuotes(): Promise<ARQuote[]> {
    try {
      const res = await apiClient.get<ARQuote[]>("/api/ar/quotes");
      return Array.isArray(res) ? res : [];
    } catch {
      return [];
    }
  },

  async getQuote(quoteId: string): Promise<ARQuote> {
    return apiClient.get<ARQuote>(`/api/ar/quotes/${encodeURIComponent(quoteId)}`);
  },

  async getNextQuoteNumber(): Promise<{ next_quote_number: string }> {
    try {
      return await apiClient.get<{ next_quote_number: string }>("/api/ar/quotes/next-number");
    } catch {
      return { next_quote_number: "Quote# 29771" };
    }
  },

  async getSummaryStats(): Promise<ARQuoteSummaryStats> {
    return apiClient.get<ARQuoteSummaryStats>("/api/ar/quotes/summary");
  },

  async saveQuote(
    payload: Partial<ARQuote>
  ): Promise<{ success: boolean; id: string; quote_number: string; publication_state: PublicationState }> {
    return apiClient.post<{ success: boolean; id: string; quote_number: string; publication_state: PublicationState }>(
      "/api/ar/quotes",
      payload,
      {
        actionLabel: "Saving Quote",
        actionSubtitle: `Saving quote ${payload.quote_number || ""}...`,
      }
    );
  },

  async publishQuote(quoteId: string): Promise<{ success: boolean; id: string; publication_state: string }> {
    return apiClient.post<{ success: boolean; id: string; publication_state: string }>(
      `/api/ar/quotes/${encodeURIComponent(quoteId)}/publish`,
      {},
      {
        actionLabel: "Publishing Quote",
        actionSubtitle: "Making quote available for customer links...",
      }
    );
  },

  async moveQuoteToDraft(quoteId: string): Promise<{ success: boolean; id: string; publication_state: string }> {
    return apiClient.post<{ success: boolean; id: string; publication_state: string }>(
      `/api/ar/quotes/${encodeURIComponent(quoteId)}/draft`,
      {},
      {
        actionLabel: "Moving Quote to Draft",
        actionSubtitle: "Revoking active customer access links...",
      }
    );
  },

  async deleteQuote(quoteId: string): Promise<{ success: boolean; message: string }> {
    return apiClient.delete<{ success: boolean; message: string }>(
      `/api/ar/quotes/${encodeURIComponent(quoteId)}`,
      {
        actionLabel: "Deleting Draft Quote",
        actionSubtitle: "Removing draft quote record...",
      }
    );
  },

  async createRevision(
    quoteId: string
  ): Promise<{ success: boolean; id: string; quote_number: string }> {
    return apiClient.post<{ success: boolean; id: string; quote_number: string }>(
      `/api/ar/quotes/${encodeURIComponent(quoteId)}/revision`,
      {},
      {
        actionLabel: "Creating Quote Revision",
        actionSubtitle: "Duplicating into a new editable draft...",
      }
    );
  },

  async generateCustomerLink(
    quoteId: string,
    recipientEmail?: string,
    recipientName?: string
  ): Promise<{
    success: boolean;
    link_id: string;
    raw_token: string;
    full_url: string;
    expires_at: string;
    recipient_email: string;
  }> {
    return apiClient.post(
      `/api/ar/quotes/${encodeURIComponent(quoteId)}/links`,
      { recipient_email: recipientEmail, recipient_name: recipientName },
      {
        actionLabel: "Generating Customer Link",
        actionSubtitle: "Generating secure access token...",
      }
    );
  },

  async revokeCustomerLink(
    quoteId: string
  ): Promise<{ success: boolean; message: string }> {
    return apiClient.delete(
      `/api/ar/quotes/${encodeURIComponent(quoteId)}/links`,
      {
        actionLabel: "Revoking Links",
        actionSubtitle: "Invalidating active customer tokens...",
      }
    );
  },

  async sendQuoteToCustomer(
    quoteId: string,
    data: {
      recipient_email: string;
      recipient_name?: string;
      subject: string;
      custom_message: string;
    }
  ): Promise<{
    success: boolean;
    message: string;
    quote_link: string;
    expires_at: string;
    email_delivered: boolean;
  }> {
    return apiClient.post(
      `/api/ar/quotes/${encodeURIComponent(quoteId)}/send`,
      data,
      {
        actionLabel: "Sending Quote to Customer",
        actionSubtitle: `Emailing secure proposal to ${data.recipient_email}...`,
      }
    );
  },

  async listEmailTemplates(): Promise<ARQuoteEmailTemplate[]> {
    try {
      const res = await apiClient.get<ARQuoteEmailTemplate[]>("/api/ar/quotes/templates");
      return Array.isArray(res) ? res : [];
    } catch {
      return [];
    }
  },

  async saveEmailTemplate(
    data: Partial<ARQuoteEmailTemplate>
  ): Promise<{ success: boolean; message: string }> {
    return apiClient.post("/api/ar/quotes/templates", data, {
      actionLabel: "Saving Email Template",
      actionSubtitle: `Saving template "${data.name}"...`,
    });
  },

  async convertToInvoice(
    quoteId: string
  ): Promise<{ success: boolean; invoice_id: string; invoice_number: string; message: string }> {
    return apiClient.post(
      `/api/ar/quotes/${encodeURIComponent(quoteId)}/convert-to-invoice`,
      {},
      {
        actionLabel: "Generating Invoice",
        actionSubtitle: "Converting signed quote into AR invoice...",
      }
    );
  },

  async recordPayment(
    quoteId: string,
    data: {
      amount: number;
      payment_method?: string;
      payment_date?: string;
      reference_number?: string;
      notes?: string;
      gl_code?: string;
      category?: string;
      class_name?: string;
      class?: string;
      invoice_id?: string;
    }
  ): Promise<{ success: boolean; message: string }> {
    return apiClient.post(
      `/api/ar/quotes/${encodeURIComponent(quoteId)}/payment`,
      data,
      {
        actionLabel: "Recording Payment",
        actionSubtitle: `Recording $${data.amount.toFixed(2)} received...`,
      }
    );
  },

  async getAuditLogs(quoteId: string): Promise<ARQuoteAuditLog[]> {
    try {
      const res = await apiClient.get<ARQuoteAuditLog[]>(`/api/ar/quotes/${encodeURIComponent(quoteId)}/audit-logs`);
      return Array.isArray(res) ? res : [];
    } catch {
      return [];
    }
  },

  async getQuoteNotes(quoteId: string): Promise<ARQuoteNote[]> {
    try {
      const res = await apiClient.get<ARQuoteNote[]>(`/api/ar/quotes/${encodeURIComponent(quoteId)}/notes`);
      return Array.isArray(res) ? res : [];
    } catch {
      return [];
    }
  },

  async addQuoteNote(
    quoteId: string,
    data: {
      message: string;
      author_name?: string;
      author_email?: string;
      attachments?: ARQuoteAttachment[];
    }
  ): Promise<ARQuoteNote> {
    return apiClient.post<ARQuoteNote>(
      `/api/ar/quotes/${encodeURIComponent(quoteId)}/notes`,
      data,
      {
        actionLabel: "Posting Note",
        actionSubtitle: "Sending note to quote thread...",
      }
    );
  },

  // Public Customer Endpoints
  async getPublicQuote(token: string): Promise<PublicQuoteResponse> {
    return apiClient.get<PublicQuoteResponse>(`/api/public/quotes/${encodeURIComponent(token)}`);
  },

  async getPublicQuoteNotes(token: string): Promise<ARQuoteNote[]> {
    try {
      const res = await apiClient.get<ARQuoteNote[]>(`/api/public/quotes/${encodeURIComponent(token)}/notes`);
      return Array.isArray(res) ? res : [];
    } catch {
      return [];
    }
  },

  async addPublicQuoteNote(
    token: string,
    data: {
      message?: string;
      author_name?: string;
      attachments?: ARQuoteAttachment[];
    }
  ): Promise<ARQuoteNote> {
    return apiClient.post<ARQuoteNote>(
      `/api/public/quotes/${encodeURIComponent(token)}/notes`,
      data,
      {
        actionLabel: "Uploading Document / Note",
        actionSubtitle: "Posting to quote discussion thread...",
      }
    );
  },

  async sendPublicBeacon(token: string): Promise<void> {
    try {
      await apiClient.post(`/api/public/quotes/${encodeURIComponent(token)}/beacon`, {});
    } catch {
      // Ignored
    }
  },

  async requestVerificationCode(token: string): Promise<{ success: boolean; message: string }> {
    return apiClient.post(`/api/public/quotes/${encodeURIComponent(token)}/request-code`, {});
  },

  async verifyCode(
    token: string,
    code: string
  ): Promise<{ success: boolean; verified: boolean; session_token: string; recipient_email: string; recipient_name?: string }> {
    return apiClient.post(`/api/public/quotes/${encodeURIComponent(token)}/verify-code`, { code });
  },

  async signQuote(
    token: string,
    data: {
      signer_name: string;
      signer_title?: string;
      signature_data_url: string;
      agreement_accepted: boolean;
    }
  ): Promise<{ success: boolean; message: string; quote_number: string; signed_at: string; document_hash: string }> {
    return apiClient.post(`/api/public/quotes/${encodeURIComponent(token)}/sign`, data);
  },

  async requestChanges(
    token: string,
    message: string
  ): Promise<{ success: boolean; message: string }> {
    return apiClient.post(`/api/public/quotes/${encodeURIComponent(token)}/request-changes`, { message });
  },

  async createMobileSession(
    token: string
  ): Promise<{ success: boolean; raw_token: string; full_url: string; expires_at: string }> {
    return apiClient.post(`/api/public/quotes/${encodeURIComponent(token)}/create-mobile-session`, {});
  },
};
