import type { PurchaseRequest, PurchaseOrder, WireTransferInput } from "@/types/purchasing";

export interface FieldDef {
  id: string;
  label: string;
  placeholder?: string;
  helperText?: string;
  isMono?: boolean;
  isUpper?: boolean;
}

export interface WireTransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: PurchaseRequest;
  purchaseOrder?: PurchaseOrder | null;
  onConfirm: (data: WireTransferInput) => void;
  initialData?: WireTransferInput | null;
  isEditMode?: boolean;
  isSubmitting?: boolean;
  defaultTab?: "general" | "banking" | "international";
  visibleTabs?: Array<"general" | "banking" | "international">;
  title?: string;
  submitLabel?: string;
}
