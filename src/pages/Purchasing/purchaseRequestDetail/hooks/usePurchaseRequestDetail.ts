import { usePurchaseRequestDetailActions } from "./usePurchaseRequestDetailActions";

export function usePurchaseRequestDetail() {
  const c1 = usePurchaseRequestDetailActions();
  return { ...c1 };
}

export type PurchaseRequestDetailState = ReturnType<typeof usePurchaseRequestDetail>;

// Names tested by the early-return guards are known to be set once the guards have passed.
type Narrowed<T, K extends keyof T> = Omit<T, K> & { [P in K]: NonNullable<T[P]> };
export type PurchaseRequestDetailGuardedState = Narrowed<PurchaseRequestDetailState, "isLoading" | "navigate" | "refetch" | "error" | "id" | "request">;
