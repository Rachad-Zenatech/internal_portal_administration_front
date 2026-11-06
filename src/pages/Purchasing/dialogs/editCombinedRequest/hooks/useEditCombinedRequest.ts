import { useEditCombinedRequestActions } from "./useEditCombinedRequestActions";
import { useEditCombinedRequestActions2 } from "./useEditCombinedRequestActions2";
import type { EditCombinedRequestDialogProps } from "../types";

export function useEditCombinedRequest(props: EditCombinedRequestDialogProps) {
  const { open, onOpenChange, data, refetch } = props;
  const c1 = useEditCombinedRequestActions(props);
  const c2 = useEditCombinedRequestActions2(props, c1);
  return { ...c1, ...c2, open, onOpenChange, data, refetch };
}

export type EditCombinedRequestState = ReturnType<typeof useEditCombinedRequest>;
