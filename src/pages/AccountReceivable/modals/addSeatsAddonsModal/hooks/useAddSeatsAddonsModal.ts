import { useAddSeatsAddonsModalActions } from "./useAddSeatsAddonsModalActions";

export function useAddSeatsAddonsModal(props) {
  const { isOpen, onClose, invoiceId, customerName, parentInvoiceNumber, lineItems = [] } = props;
  const c1 = useAddSeatsAddonsModalActions(props);
  return { ...c1, isOpen, onClose, invoiceId, customerName, parentInvoiceNumber, lineItems };
}

export type AddSeatsAddonsModalState = ReturnType<typeof useAddSeatsAddonsModal>;
