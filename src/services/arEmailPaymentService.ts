import { apiClient, BASE_URL } from "./apiClient";

export interface EmailPaymentAttachment {
  id: string;
  name: string;
  content_type: string;
  size: number;
}

export interface EmailPaymentAllocation {
  invoice_id: string;
  invoice_number: string;
  customer_id?: string | null;
  customer_name?: string | null;
  amount: number;
  balance_due?: number;
  confidence?: number;
  reasons?: string[];
}

export interface ExtractedPaymentData {
  is_payment_notification?: boolean;
  payer_name?: string | null;
  payer_email?: string | null;
  total_amount?: number | null;
  currency?: string;
  payment_date?: string | null;
  payment_method?: string;
  reference_number?: string | null;
  invoice_numbers?: string[];
  memo?: string | null;
  evidence?: string | null;
  attachment_name?: string | null;
  page_number?: number | null;
}

export interface EmailPaymentMatch {
  id: string;
  email_id: string;
  item_index?: number;
  item_count?: number;
  conversation_id?: string | null;
  subject: string;
  sender_name: string;
  sender_email: string;
  received_at?: string | null;
  is_payment_email: boolean;
  match_status: "MATCHED" | "NEEDS_REVIEW" | "UNMATCHED" | "RECORDED" | "DISMISSED" | "NON_PAYMENT";
  confidence: number;
  match_reasons: string[];
  extracted_data: ExtractedPaymentData;
  attachments: EmailPaymentAttachment[];
  matched_invoice_id?: string | null;
  matched_invoice_number?: string | null;
  matched_customer_id?: string | null;
  matched_customer_name?: string | null;
  allocations: EmailPaymentAllocation[];
  allocated_amount?: number | null;
  recorded_payment_id?: string | null;
}

export interface EmailPaymentMatchesResponse {
  by_invoice: Record<string, EmailPaymentMatch>;
  unmatched: EmailPaymentMatch[];
  available: EmailPaymentMatch[];
  unmatched_count: number;
}

export const arEmailPaymentService = {
  async listMatches(search?: string): Promise<EmailPaymentMatchesResponse> {
    const qs = search ? `?search=${encodeURIComponent(search)}` : "";
    return apiClient.get<EmailPaymentMatchesResponse>(`/api/ar/email-payments/matches${qs}`);
  },

  async scanEmails(limit = 15, refreshFromGraph = true): Promise<{
    scanned: number;
    analyzed: number;
    matched: number;
    unmatched: number;
  }> {
    return apiClient.post(
      "/api/ar/email-payments/scan",
      { limit, refresh_from_graph: refreshFromGraph },
      {
        actionLabel: "Scanning A/R Emails",
        actionSubtitle: "Checking incoming emails & attachments for payments...",
      }
    );
  },

  async manualMap(
    emailId: string,
    payload: {
      allocations: { invoice_id: string; amount: number }[];
      record_now?: boolean;
      remember_payer?: boolean;
      payment_method?: string;
      payment_date?: string;
      reference_number?: string;
      notes?: string;
      payer_name?: string;
      match_id?: string;
    }
  ): Promise<any> {
    return apiClient.post(`/api/ar/email-payments/${encodeURIComponent(emailId)}/map`, payload, {
      actionLabel: payload.record_now ? "Recording Payment from Email" : "Mapping Email to Invoice",
      actionSubtitle: "Updating A/R payment link and attachments...",
    });
  },

  async dismissMatch(emailId: string, detachOnly = false, matchId?: string): Promise<any> {
    return apiClient.post(`/api/ar/email-payments/${encodeURIComponent(emailId)}/dismiss`, {
      detach_only: detachOnly,
      ...(matchId ? { match_id: matchId } : {}),
    });
  },

  getEmailAttachmentUrl(emailId: string, attachmentId: string, conversationId?: string | null, inline = true): string {
    const params = new URLSearchParams({ inline: String(inline), scope: "receivable" });
    if (conversationId) params.set("conversation_id", conversationId);
    return `${BASE_URL}/api/oauth/microsoft-entra/emails/${encodeURIComponent(emailId)}/attachments/${encodeURIComponent(attachmentId)}?${params.toString()}`;
  },

  async fetchEmailAttachmentBlob(emailId: string, attachmentId: string, conversationId?: string | null): Promise<Blob> {
    const params = new URLSearchParams({ inline: "true", scope: "receivable" });
    if (conversationId) params.set("conversation_id", conversationId);
    return apiClient.getBlob(
      `/api/oauth/microsoft-entra/emails/${encodeURIComponent(emailId)}/attachments/${encodeURIComponent(attachmentId)}?${params.toString()}`
    );
  },

  getPaymentAttachmentUrl(paymentId: string, index: number, inline = true): string {
    return `${BASE_URL}/api/ar/payments/${encodeURIComponent(paymentId)}/attachments/${index}?inline=${inline}`;
  },
};
