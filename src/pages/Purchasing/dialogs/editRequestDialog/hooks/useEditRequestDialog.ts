import { useEditRequestDialogActions } from "./useEditRequestDialogActions";
import { useEditRequestDialogActions2 } from "./useEditRequestDialogActions2";
import type { EditRequestDialogProps } from "../types";

export function useEditRequestDialog(props: EditRequestDialogProps) {
  const { request, open, onOpenChange } = props;
  const c1 = useEditRequestDialogActions(props);
  const c2 = useEditRequestDialogActions2(props, c1);
  return { ...c1, ...c2, request, open, onOpenChange };
}

export type EditRequestDialogState = ReturnType<typeof useEditRequestDialog>;
