export interface AddSeatsAddonsModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceId: string;
  customerId: string;
  customerName: string;
  parentInvoiceNumber?: string;
  onSuccess: () => void;
  lineItems?: Array<{ activity?: string; name?: string; description?: string }>;
  targetParentIndex?: number;
  onAddDirectSubItem?: (subItem: any, targetParentIndex: number) => void;
}
