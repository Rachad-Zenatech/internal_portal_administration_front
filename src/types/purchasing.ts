export type { GLCodeOption } from "./chartOfAccount";

export interface TaskHistoryItem {
  id: number;
  task_id: number;
  changed_by: string;
  changed_by_name: string;
  action: string;
  old_value?: string;
  new_value?: string;
  comment?: string;
  created_at: string;
}

export type RequestType = "ADMIN" | "SPEND" | "RECURRING" | "QUOTE";

export type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export const RequestStatus = {
  Initial: "INITIAL",
  New: "NEW",
  UnderReview: "UNDER_REVIEW",
  WaitingApproval: "WAITING_APPROVAL",
  Approved: "APPROVED",
  WaitingPayment: "WAITING_PAYMENT",
  Purchased: "PURCHASED",
  Shipped: "SHIPPED",
  GoodsReceived: "GOODS_RECEIVED",
  InvoiceReceived: "INVOICE_RECEIVED",
  Completed: "COMPLETED",
  Rejected: "REJECTED",
  OnHold: "ON_HOLD",
} as const;

export type RequestStatus = (typeof RequestStatus)[keyof typeof RequestStatus];

export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";

export type ApprovalDecision = "APPROVED" | "REJECTED";

export type PaymentStatus = "UNPAID" | "WAITING_PAYMENT";

export type PaymentMethod = "CC" | "DC" | "W";

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  CC: "Credit Card",
  DC: "Debit Card",
  W: "Wire",
};

export type Currency = {
  code: string;
  name: string;
  symbol: string;
};

export type NotificationStatus = "SENT" | "READ";

export type WorkflowAction =
  | "SUBMIT_REQUEST"
  | "DELETE_REQUEST"
  | "START_REVIEW"
  | "CREATE_PO"
  | "APPROVE"
  | "REJECT"
  | "MARK_PURCHASED"
  | "ADD_TRACKING"
  | "MARK_SHIPPED"
  | "CONFIRM_GOODS_RECEIVED"
  | "RECORD_INVOICE"
  | "SEND_TO_AP"
  | "PUT_ON_HOLD"
  | "RESUME_WORKFLOW"
  | "COMPLETE";

export type ProductInfo = {
  name: string;
  price: string;
  category: string;
  brand: string;
  description: string;
  vendor: string;
  currency: string;
};

export type PurchaseRequest = {
  id: string;
  title: string;
  requester: string;
  department: string;
  request_date: string;
  request_type: RequestType;
  priority: Priority;
  status: RequestStatus;
  item_mode?: ItemMode;
  sku?: string | null;
  hold_reason?: string | null;
  hold_date?: string | null;
  assigned_user: string | null;
  description: string | null;
  item_url?: string | null;
  product_info?: ProductInfo | null;
  quantity: number;
  unit_price: number;
  amount: number;
  currency?: string | null;
  gl_code?: string | null;
  items?: PurchaseRequestItem[];
  quote_data?: any;
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
  sku?: string | null;
  item_url?: string | null;
  product_info?: ProductInfo | null;
  quantity?: number;
  unit_price?: number;
  amount: number;
  currency?: string | null;
  gl_code?: string | null;
  payment_method?: PaymentMethod | null;
  shipped_to_location?: string | null;
  approval_status: ApprovalStatus;
  expected_delivery_date?: string | null;
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
  invoice_type?: string | null;
  description?: string | null;
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
  id: number;
  user_id: string;
  type: string;
  title: string;
  message: string;
  link_url?: string;
  entity_type?: string;
  entity_id?: string;
  sender_name?: string;
  sender_avatar?: string;
  attachments?: any[];
  is_read: boolean;
  created_at: string;
  read_at?: string;
};

export type AttachmentInfo = {
  id: string;
  filename: string;
  content_type: string | null;
  size: number;
  uploaded_at: string;
};

export type RequestDetail = {
  request: PurchaseRequest;
  purchase_order: PurchaseOrder | null;
  invoice: Invoice | null;
  approvals: Approval[];
  notifications: PurchasingNotification[];
  available_actions: WorkflowAction[];
  ordered_date: string | null;
  attachments: AttachmentInfo[];
  history: TaskHistoryItem[];
};

export type PurchasingSummary = {
  total_requests: number;
  open_requests: number;
  awaiting_approval: number;
  unpaid_invoices: number;
  unpaid_amount: number;
  completed: number;
  status_counts: Record<string, number>;
  status_amounts?: Record<string, number>;
};

export type RequestCreateInput = {
  title: string;
  requester: string;
  department: string;
  request_type: RequestType;
  priority: Priority;
  item_mode?: ItemMode;
  description?: string | null;
  assigned_user?: string | null;
  item_url?: string | null;
  product_info?: ProductInfo | null;
  quantity?: number;
  unit_price?: number;
  amount?: number;
  currency?: string | null;
  gl_code?: string | null;
  items?: PurchaseRequestItem[];
  quote_file_id?: string | null;
  quote_data?: any;
};

export type PurchaseOrderInput = {
  vendor: string;
  item: string;
  description?: string | null;
  quote_number?: string | null;
  item_url?: string | null;
  product_info?: ProductInfo | null;
  expected_delivery_date?: string | null;
  quantity?: number;
  unit_price?: number;
  amount: number;
  currency?: string | null;
  payment_method?: PaymentMethod | null;
  shipped_to_location?: string | null;
  gl_code?: string | null;
};

export type InvoiceInput = {
  vendor: string;
  amount: number;
  invoice_date: string;
  due_date?: string | null;
  gl_code?: string | null;
  asset_flag?: boolean;
  invoice_type?: string | null;
  description?: string | null;
};

export type ApprovalInput = {
  approver: string;
  comment?: string | null;
};

export type TrackingInput = {
  tracking_number: string;
  note?: string;
};

export type HoldInput = {
  reason: string;
};

export type TransitionInput = {
  action: WorkflowAction;
  purchase_order?: PurchaseOrderInput;
  invoice?: InvoiceInput;
  approval?: ApprovalInput;
  tracking?: TrackingInput;
  hold?: HoldInput;
};


export type ItemMode = "SINGLE" | "MULTIPLE";

export interface PurchaseRequestItem {
  id?: string;
  request_id?: string;
  item_order?: number;
  sku?: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  discount?: number;
  tax?: number;
  total: number;
}

export interface QuoteItem {
  description: string;
  sku?: string | null;
  quantity: number;
  unit_price: number;
  discount?: number;
  tax?: number;
  total: number;
}

export interface QuoteVendor {
  name?: string | null;
  address?: string | null;
  email?: string | null;
  phone?: string | null;
}

export interface QuoteCustomer {
  name?: string | null;
  address?: string | null;
}

export interface QuoteTotals {
  subtotal?: number;
  discount?: number;
  shipping?: number;
  tax?: number;
  total: number;
}

export interface QuoteExtractionResult {
  vendor?: QuoteVendor | null;
  quote_number?: string | null;
  quote_date?: string | null;
  valid_until?: string | null;
  currency?: string | null;
  customer?: QuoteCustomer | null;
  items: QuoteItem[];
  totals?: QuoteTotals | null;
  payment_terms?: string | null;
  delivery_terms?: string | null;
  notes?: string | null;
}

export interface QuoteValidationResult {
  status: "passed" | "warning" | "failed";
  warnings: string[];
  line_items_valid: boolean;
  subtotal_valid: boolean;
  total_valid: boolean;
}

export interface QuoteExtractionResponse {
  file_id?: string | null;
  file_name?: string | null;
  ocr_used: boolean;
  page_count: number;
  confidence_score: number;
  extraction: QuoteExtractionResult;
  validation: QuoteValidationResult;
}
