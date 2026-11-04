import { useQuickBooksItemDetailsDialogState } from "./useQuickBooksItemDetailsDialogState";
import type { QuickBooksItemDetailsDialogProps } from "../types";

export function useQuickBooksItemDetailsDialog(props: QuickBooksItemDetailsDialogProps) {
  const { item, open, onOpenChange, onSync, isSyncing = false, isConnected = true } = props;
  const c1 = useQuickBooksItemDetailsDialogState();
  return { ...c1, item, open, onOpenChange, onSync, isSyncing, isConnected };
}

export type QuickBooksItemDetailsDialogState = ReturnType<typeof useQuickBooksItemDetailsDialog>;

// Names tested by the early-return guards are known to be set once the guards have passed.
type Narrowed<T, K extends keyof T> = Omit<T, K> & { [P in K]: NonNullable<T[P]> };
export type QuickBooksItemDetailsDialogGuardedState = Narrowed<QuickBooksItemDetailsDialogState, "item">;
