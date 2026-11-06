import type { PurchaseRequest } from "@/types/purchasing";
import { type ProjectedInstallment } from "../../utils/recurringScheduleUtils";

export interface MasterTransactionItem {
  id: string;
  requestId: string;
  requestTitle: string;
  requestDescription?: string | null;
  requester: string;
  department: string;
  vendor: string;
  category: string;
  priority: string;
  project?: string;
  dueDate: string;
  amount: number;
  currency: string;
  cumulativeAmount: number;
  installmentNumber: number;
  totalInstallments: number | null;
  installmentStatus: "PAID" | "CURRENT" | "PROJECTED";
  workflowStatus: string;
  reviewStatus: string;
  isCustom: boolean;
  frequency: string;
  customLabel?: string | null;
  rawRequest: PurchaseRequest;
  rawInstallment: ProjectedInstallment;
}

export interface MasterTransactionsTableProps {
  requests: PurchaseRequest[];
  isLoading?: boolean;
  isAP?: boolean;
  isSuperAdmin?: boolean;
  onOpenBreakdownModal: (request: PurchaseRequest) => void;
  onToggleReviewStatus?: (request: PurchaseRequest) => void;
  reviewMutationPending?: boolean;
}
