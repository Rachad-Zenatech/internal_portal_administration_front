// Shared API/domain types for the Purchasing + Accounts Payable workflow.
// These mirror the backend Pydantic models in
// internal_portal_administration_backend/models/purchasing_model.py

export type RequestType = "ADMIN" | "SPEND" | "RECURRING";

export type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type RequestStatus =
  | "NEW_REQUEST"
  | "NEW"
  | "UNDER_REVIEW"
  | "WAITING_APPROVAL"
  | "APPROVED"
  | "REJECTED"
  | "WAITING_PAYMENT"
  | "PURCHASED"
  | "SHIPPED"
  | "ORDERED"
  | "INVOICE_RECEIVED"
  | "SENT_TO_AP"
  | "PAID"
  | "COMPLETED";

export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";

export type ApprovalDecision = "APPROVED" | "REJECTED";

export type PaymentStatus = "UNPAID" | "WAITING_PAYMENT" | "PAID";

export type NotificationStatus = "SENT" | "READ";

export type WorkflowAction =
  | "START_REVIEW"
  | "CREATE_PO"
  | "SUBMIT_FOR_APPROVAL"
  | "APPROVE"
  | "REJECT"
  | "MARK_PURCHASED"
  | "ADD_TRACKING"
  | "MARK_ORDERED"
  | "MARK_SHIPPED"
  | "RECORD_INVOICE"
  | "SEND_TO_AP"
  | "PAY_INVOICE"
  | "CONFIRM_GOODS_RECEIVED"
  | "PUT_ON_HOLD"
  | "RESUME_WORKFLOW"
  | "COMPLETE";

export type PurchaseRequest = {
  id: string;
  title: string;
  requester: string;
  department: string;
  request_date: string;
  request_type: RequestType;
  priority: Priority;
  status: RequestStatus;
  assigned_user: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type PurchaseOrder = {
  id: string;
  request_id: string;
  vendor: string;
  item: string;
  description: string | null;
  quote_number: string | null;
  amount: number;
  approval_status: ApprovalStatus;
  expected_delivery_date: string | null;
  tracking_number: string | null;
  goods_received: boolean;
  goods_received_at: string | null;
  goods_received_by: string | null;
  created_at: string;
};

export type Invoice = {
  id: string;
  request_id: string;
  po_id: string | null;
  vendor: string;
  amount: number;
  invoice_date: string;
  due_date: string | null;
  payment_status: PaymentStatus;
  paid_date: string | null;
  gl_code: string | null;
  asset_flag: boolean;
  created_at: string;
};

export type Approval = {
  id: string;
  request_id: string;
  approver: string;
  approval_date: string;
  decision: ApprovalDecision;
  comment: string | null;
};

export type PurchasingNotification = {
  id: string;
  request_id: string | null;
  recipient: string;
  message: string;
  sent_date: string;
  status: NotificationStatus;
};

export type RequestDetail = {
  request: PurchaseRequest;
  purchase_order: PurchaseOrder | null;
  invoice: Invoice | null;
  approvals: Approval[];
  notifications: PurchasingNotification[];
  available_actions: WorkflowAction[];
};

export type PurchasingSummary = {
  total_requests: number;
  open_requests: number;
  awaiting_approval: number;
  unpaid_invoices: number;
  unpaid_amount: number;
  completed: number;
  status_counts: Record<string, number>;
};

// ─── Request payloads ────────────────────────────────────────────────────────

export type RequestCreateInput = {
  title: string;
  requester: string;
  department: string;
  request_type: RequestType;
  priority: Priority;
  description?: string | null;
  assigned_user?: string | null;
};

export type PurchaseOrderInput = {
  vendor: string;
  item: string;
  description?: string | null;
  quote_number?: string | null;
  amount: number;
  expected_delivery_date?: string | null;
};

export type InvoiceInput = {
  vendor: string;
  amount: number;
  invoice_date: string;
  due_date?: string | null;
  gl_code?: string | null;
  asset_flag?: boolean;
};

export type ApprovalInput = {
  approver: string;
  comment?: string | null;
};

export type TrackingInput = {
  tracking_number: string;
  note?: string;
};

export type TransitionInput = {
  action: WorkflowAction;
  purchase_order?: PurchaseOrderInput;
  invoice?: InvoiceInput;
  approval?: ApprovalInput;
  tracking?: TrackingInput;
};
