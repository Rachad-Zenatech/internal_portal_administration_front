import type { QuoteDetailPageGuardedState } from "./useQuoteDetailPage";
import { useQuoteDetailPageActions2 } from "./useQuoteDetailPageActions2";

export function useQuoteDetailPageTail(s: QuoteDetailPageGuardedState) {
  const t1 = useQuoteDetailPageActions2(s);
  return { ...t1 };
}

export type QuoteDetailPageViewState = QuoteDetailPageGuardedState & ReturnType<typeof useQuoteDetailPageTail>;
