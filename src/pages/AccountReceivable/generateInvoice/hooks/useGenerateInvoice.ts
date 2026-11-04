import { useGenerateInvoiceActions } from "./useGenerateInvoiceActions";
import { useGenerateInvoiceActions2 } from "./useGenerateInvoiceActions2";
import { useGenerateInvoiceDerived } from "./useGenerateInvoiceDerived";
import { useGenerateInvoiceActions3 } from "./useGenerateInvoiceActions3";
import { useGenerateInvoiceActions4 } from "./useGenerateInvoiceActions4";
import { useGenerateInvoiceData } from "./useGenerateInvoiceData";

export function useGenerateInvoice() {
  const c1 = useGenerateInvoiceActions();
  const c2 = useGenerateInvoiceActions2(c1);
  const c3 = useGenerateInvoiceDerived({ ...c1, ...c2 });
  const c4 = useGenerateInvoiceActions3({ ...c1, ...c2, ...c3 });
  const c5 = useGenerateInvoiceActions4({ ...c1, ...c2, ...c3, ...c4 });
  const c6 = useGenerateInvoiceData({ ...c1, ...c2, ...c3, ...c4, ...c5 });
  return { ...c1, ...c2, ...c3, ...c4, ...c5, ...c6 };
}

export type GenerateInvoiceState = ReturnType<typeof useGenerateInvoice>;
