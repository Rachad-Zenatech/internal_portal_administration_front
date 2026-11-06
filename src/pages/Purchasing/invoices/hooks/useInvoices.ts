import { useInvoicesActions } from "./useInvoicesActions";

export function useInvoices() {
  const c1 = useInvoicesActions();
  return { ...c1 };
}

export type InvoicesState = ReturnType<typeof useInvoices>;
