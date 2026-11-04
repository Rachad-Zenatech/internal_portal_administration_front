import { useRecurringPaymentsActions } from "./useRecurringPaymentsActions";
import { useRecurringPaymentsActions2 } from "./useRecurringPaymentsActions2";
import { useRecurringPaymentsDerived } from "./useRecurringPaymentsDerived";

export function useRecurringPayments() {
  const c1 = useRecurringPaymentsActions();
  const c2 = useRecurringPaymentsActions2(c1);
  const c3 = useRecurringPaymentsDerived({ ...c1, ...c2 });
  return { ...c1, ...c2, ...c3 };
}

export type RecurringPaymentsState = ReturnType<typeof useRecurringPayments>;

// Names tested by the early-return guards are known to be set once the guards have passed.
type Narrowed<T, K extends keyof T> = Omit<T, K> & { [P in K]: NonNullable<T[P]> };
export type RecurringPaymentsGuardedState = Narrowed<RecurringPaymentsState, "navigate" | "canAccess">;
