import type { QuickBooksPreviewItem } from "@/services/purchasingService";

export interface QuickBooksItemDetailsDialogProps {
  item: QuickBooksPreviewItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSync?: (item: QuickBooksPreviewItem) => Promise<void> | void;
  isSyncing?: boolean;
  onDelete?: (item: QuickBooksPreviewItem) => Promise<void> | void;
  isDeleting?: boolean;
  isConnected?: boolean;
}
