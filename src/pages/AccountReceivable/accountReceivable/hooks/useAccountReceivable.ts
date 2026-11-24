import { useAccountReceivableData } from "./useAccountReceivableData";
import { useAccountReceivableDerived } from "./useAccountReceivableDerived";
import { useEmailPaymentMatches } from "./useEmailPaymentMatches";

export function useAccountReceivable() {
  const c1 = useAccountReceivableData();
  const c2 = useAccountReceivableDerived(c1);
  const c3 = useEmailPaymentMatches();
  return { ...c1, ...c2, ...c3 };
}

export type AccountReceivableState = ReturnType<typeof useAccountReceivable>;
