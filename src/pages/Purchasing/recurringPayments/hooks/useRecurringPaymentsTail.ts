import type { RecurringPaymentsGuardedState } from "./useRecurringPayments";
import { useRecurringPaymentsActions3 } from "./useRecurringPaymentsActions3";

export function useRecurringPaymentsTail(s: RecurringPaymentsGuardedState) {
  const t1 = useRecurringPaymentsActions3(s);
  return { ...t1 };
}

export type RecurringPaymentsViewState = RecurringPaymentsGuardedState & ReturnType<typeof useRecurringPaymentsTail>;
