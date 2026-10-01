export type ARWorkflowType =
  | "CASH"
  | "INITIAL_SALE"
  | "ADD_ON"
  | "MONTHLY_SUBSCRIPTION"
  | "RENEWAL";

export type ARWorkflowState =
  | "DRAFT"
  | "PENDING_REVIEW"
  | "CLERK_REVIEW"
  | "INVOICE_SENT"
  | "AWAITING_PAYMENT"
  | "DUNNING_REMINDER"
  | "RECONCILED"
  | "COMPLETED"
  | "CANCELLED";

export type ARTriggerType =
  | "MANUAL"
  | "SYSTEM_TIMER"
  | "WEBHOOK"
  | "EMAIL_RECEIPT";

export interface ARLineItem {
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate?: number;
  amount: number;
}

export interface MatchedInvoiceItem {
  invoice_id?: string;
  invoice_number: string;
  currency?: string;
  invoice_total: number;
  amount_applied: number;
  balance_remaining: number;
  status: "FULLY_PAID" | "PARTIALLY_PAID";
}

export interface ARAttachment {
  id?: string;
  filename: string;
  file_url?: string;
  file_size?: number;
  file_type?: string;
  uploaded_at?: string;
  uploaded_by?: string;
  note?: string;
}

export interface ARWorkflowLog {
  id: string;
  workflow_id: string;
  from_state?: string | null;
  to_state: string;
  trigger_type: ARTriggerType;
  payload?: Record<string, any>;
  actor_id?: string | null;
  actor_name?: string | null;
  note?: string | null;
  created_at: string;
}

export interface ARWorkflow {
  id: string;
  workflow_type: ARWorkflowType;
  state: ARWorkflowState;
  customer_id: string;
  customer_name?: string | null;
  reference_id?: string | null;
  amount: number;
  currency: string;
  metadata?: Record<string, any>;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  logs?: ARWorkflowLog[];
}

export interface ARWorkflowListResponse {
  items: ARWorkflow[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ARMetrics {
  total_outstanding_balance: number;
  total_workflows_count: number;
  count_by_status: Record<string, number>;
  overdue_dunning_count: number;
  completed_this_month: number;
  volume_by_type: Record<string, number>;
}

export interface ARWorkflowFilterParams {
  type?: ARWorkflowType | "";
  state?: ARWorkflowState | "";
  customer_id?: string;
  search?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  page_size?: number;
}

export interface ARCreateWorkflowPayload {
  workflow_type: ARWorkflowType;
  customer_id: string;
  customer_name?: string;
  reference_id?: string;
  amount: number;
  currency?: string;
  notes?: string;
  metadata?: Record<string, any>;
  customer_details?: Record<string, any>;
  banking_details?: Record<string, any>;
  // Cash Workflow (Treasury Confirmation, Multi-Invoice Matching, Attachments, AR Clerk)
  account_number?: string;
  bank_name?: string;
  bank_txn_id?: string;
  matched_invoice_id?: string;
  matched_invoices?: MatchedInvoiceItem[];
  payment_match_type?: "FULL_PAID" | "PARTIAL_PAID";
  deposit_date?: string;
  ar_clerk_assigned_to?: string;
  ar_clerk_notes?: string;
  attachments?: ARAttachment[];
  // Initial Sale
  payment_terms?: string;
  line_items?: ARLineItem[];
  // Add On
  parent_contract_id?: string;
  effective_date?: string;
  pro_rated_amount?: number;
  add_on_items?: ARLineItem[];
  // Monthly Subscription
  contract_id?: string;
  subscription_plan?: string;
  billing_day_of_month?: number;
  billing_mode?: string;
  // Renewal
  expiring_contract_end_date?: string;
  renewal_term_months?: number;
  adjusted_rate?: number;
  renewal_discount_percent?: number;
}

export interface ARTransitionPayload {
  target_state: ARWorkflowState;
  trigger_type?: ARTriggerType;
  note?: string;
  payload?: Record<string, any>;
}
