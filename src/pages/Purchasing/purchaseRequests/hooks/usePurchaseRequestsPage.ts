import { usePurchaseRequestsActions } from "./usePurchaseRequestsActions";
import { usePurchaseRequestsActions2 } from "./usePurchaseRequestsActions2";
import { usePurchaseRequestsActions3 } from "./usePurchaseRequestsActions3";

export function usePurchaseRequestsPage() {
  const c1 = usePurchaseRequestsActions();
  const c2 = usePurchaseRequestsActions2(c1);
  const c3 = usePurchaseRequestsActions3({ ...c1, ...c2 });
  return { ...c1, ...c2, ...c3 };
}

export type PurchaseRequestsState = ReturnType<typeof usePurchaseRequestsPage>;
