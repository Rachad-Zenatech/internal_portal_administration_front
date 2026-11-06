import type { ARQuote } from "../../../../services/arQuoteService";

export interface QuoteDetailDrawerProps {
  quote: ARQuote | null;
  isOpen: boolean;
  onClose: () => void;
  onEditQuote?: (quote: ARQuote) => void;
}
