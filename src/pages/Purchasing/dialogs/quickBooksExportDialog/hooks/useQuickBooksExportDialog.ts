import { useQuickBooksExportDialogActions } from "./useQuickBooksExportDialogActions";
import type { QuickBooksExportDialogProps } from "../types";

export function useQuickBooksExportDialog(props: QuickBooksExportDialogProps) {
  const { open, onOpenChange } = props;
  const c1 = useQuickBooksExportDialogActions(props);
  return { ...c1, open, onOpenChange };
}

export type QuickBooksExportDialogState = ReturnType<typeof useQuickBooksExportDialog>;
