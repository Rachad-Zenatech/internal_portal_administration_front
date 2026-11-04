import { useAccountReceivableData } from "./useAccountReceivableData";
import { useAccountReceivableDerived } from "./useAccountReceivableDerived";

export function useAccountReceivable() {
  const c1 = useAccountReceivableData();
  const c2 = useAccountReceivableDerived(c1);
  return { ...c1, ...c2 };
}

export type AccountReceivableState = ReturnType<typeof useAccountReceivable>;
