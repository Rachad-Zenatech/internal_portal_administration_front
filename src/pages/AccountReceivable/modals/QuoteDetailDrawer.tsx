import type { QuoteDetailDrawerProps } from "./quoteDetailDrawer/types";
import { useQuoteDetailDrawer } from "./quoteDetailDrawer/hooks/useQuoteDetailDrawer";
import { QuoteDetailDrawerBody } from "./quoteDetailDrawer/QuoteDetailDrawerBody";
import type { QuoteDetailDrawerGuardedState } from "./quoteDetailDrawer/hooks/useQuoteDetailDrawer";

export function QuoteDetailDrawer(props: QuoteDetailDrawerProps) {
  const s = useQuoteDetailDrawer(props);
  const { quote, isOpen } = s;
  if (!isOpen || !quote) return null;
  return <QuoteDetailDrawerBody s={s as QuoteDetailDrawerGuardedState} />;
}
