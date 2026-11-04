import { useWireTransferDialogActions } from "./useWireTransferDialogActions";
import type { WireTransferDialogProps } from "../types";

export function useWireTransferDialog(props: WireTransferDialogProps) {
  const { open, onOpenChange, request, isSubmitting = false, title, submitLabel } = props;
  const c1 = useWireTransferDialogActions(props);
  return { ...c1, open, onOpenChange, request, isSubmitting, title, submitLabel };
}

export type WireTransferDialogState = ReturnType<typeof useWireTransferDialog>;
