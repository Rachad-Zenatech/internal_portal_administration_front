import { useNewWorkflowActions } from "./useNewWorkflowActions";
import { useNewWorkflowActions2 } from "./useNewWorkflowActions2";
import { useNewWorkflowActions3 } from "./useNewWorkflowActions3";
import type { NewWorkflowModalProps } from "../types";

export function useNewWorkflow(props: NewWorkflowModalProps) {
  const { open, onOpenChange, workflowToEdit } = props;
  const c1 = useNewWorkflowActions(props);
  const c2 = useNewWorkflowActions2(c1);
  const c3 = useNewWorkflowActions3(props, { ...c1, ...c2 });
  return { ...c1, ...c2, ...c3, open, onOpenChange, workflowToEdit };
}

export type NewWorkflowState = ReturnType<typeof useNewWorkflow>;
