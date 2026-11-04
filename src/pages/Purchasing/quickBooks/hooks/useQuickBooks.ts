import { useQuickBooksActions } from "./useQuickBooksActions";
import { useQuickBooksActions2 } from "./useQuickBooksActions2";

export function useQuickBooks() {
  const c1 = useQuickBooksActions();
  const c2 = useQuickBooksActions2(c1);
  return { ...c1, ...c2 };
}

export type QuickBooksState = ReturnType<typeof useQuickBooks>;
