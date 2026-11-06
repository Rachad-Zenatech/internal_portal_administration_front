import type { QuoteDetailDrawerGuardedState } from "./useQuoteDetailDrawer";
import { useQuoteDetailDrawerActions } from "./useQuoteDetailDrawerActions";

export function useQuoteDetailDrawerTail(s: QuoteDetailDrawerGuardedState) {
  const t1 = useQuoteDetailDrawerActions(s);
  return { ...t1 };
}

export type QuoteDetailDrawerViewState = QuoteDetailDrawerGuardedState & ReturnType<typeof useQuoteDetailDrawerTail>;
