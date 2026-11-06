import type { PurchaseRequestDetailGuardedState } from "./usePurchaseRequestDetail";
import { usePurchaseRequestDetailActions2 } from "./usePurchaseRequestDetailActions2";

export function usePurchaseRequestDetailTail(s: PurchaseRequestDetailGuardedState) {
  const t1 = usePurchaseRequestDetailActions2(s);
  return { ...t1 };
}

export type PurchaseRequestDetailViewState = PurchaseRequestDetailGuardedState & ReturnType<typeof usePurchaseRequestDetailTail>;
