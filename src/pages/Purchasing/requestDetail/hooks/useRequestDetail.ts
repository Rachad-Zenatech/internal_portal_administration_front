import { useRequestDetailActions } from "./useRequestDetailActions";

export function useRequestDetail() {
  const c1 = useRequestDetailActions();
  return { ...c1 };
}

export type RequestDetailState = ReturnType<typeof useRequestDetail>;

// Names tested by the early-return guards are known to be set once the guards have passed.
type Narrowed<T, K extends keyof T> = Omit<T, K> & { [P in K]: NonNullable<T[P]> };
export type RequestDetailGuardedState = Narrowed<RequestDetailState, "isLoading" | "refetch" | "backUrl" | "navigate" | "isError" | "error" | "data" | "isRecurring">;
