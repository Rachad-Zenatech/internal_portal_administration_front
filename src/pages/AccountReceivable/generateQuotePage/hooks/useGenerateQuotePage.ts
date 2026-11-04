import { useGenerateQuotePageActions } from "./useGenerateQuotePageActions";
import { useGenerateQuotePageActions2 } from "./useGenerateQuotePageActions2";

export function useGenerateQuotePage() {
  const c1 = useGenerateQuotePageActions();
  const c2 = useGenerateQuotePageActions2(c1);
  return { ...c1, ...c2 };
}

export type GenerateQuotePageState = ReturnType<typeof useGenerateQuotePage>;
