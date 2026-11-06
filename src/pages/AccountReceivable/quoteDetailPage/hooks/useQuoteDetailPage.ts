import { useQuoteDetailPageActions } from "./useQuoteDetailPageActions";

export function useQuoteDetailPage() {
  const c1 = useQuoteDetailPageActions();
  return { ...c1 };
}

export type QuoteDetailPageState = ReturnType<typeof useQuoteDetailPage>;

// Names tested by the early-return guards are known to be set once the guards have passed.
type Narrowed<T, K extends keyof T> = Omit<T, K> & { [P in K]: NonNullable<T[P]> };
export type QuoteDetailPageGuardedState = Narrowed<QuoteDetailPageState, "isLoading" | "navigate" | "quote" | "isError">;
