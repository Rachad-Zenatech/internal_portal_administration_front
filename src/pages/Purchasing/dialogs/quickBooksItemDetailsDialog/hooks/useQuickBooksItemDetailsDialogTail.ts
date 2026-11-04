import type { QuickBooksItemDetailsDialogGuardedState } from "./useQuickBooksItemDetailsDialog";
import { useQuickBooksItemDetailsDialogActions } from "./useQuickBooksItemDetailsDialogActions";

export function useQuickBooksItemDetailsDialogTail(s: QuickBooksItemDetailsDialogGuardedState) {
  const t1 = useQuickBooksItemDetailsDialogActions(s);
  return { ...t1 };
}

export type QuickBooksItemDetailsDialogViewState = QuickBooksItemDetailsDialogGuardedState & ReturnType<typeof useQuickBooksItemDetailsDialogTail>;
