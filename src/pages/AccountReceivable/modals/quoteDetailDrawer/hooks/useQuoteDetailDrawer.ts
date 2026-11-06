import { useQuoteDetailDrawerData } from "./useQuoteDetailDrawerData";
import type { QuoteDetailDrawerProps } from "../types";

export function useQuoteDetailDrawer(props: QuoteDetailDrawerProps) {
  const { quote, isOpen, onClose } = props;
  const c1 = useQuoteDetailDrawerData(props);
  return { ...c1, quote, isOpen, onClose };
}

export type QuoteDetailDrawerState = ReturnType<typeof useQuoteDetailDrawer>;

// Names tested by the early-return guards are known to be set once the guards have passed.
type Narrowed<T, K extends keyof T> = Omit<T, K> & { [P in K]: NonNullable<T[P]> };
export type QuoteDetailDrawerGuardedState = Narrowed<QuoteDetailDrawerState, "quote" | "isOpen">;
