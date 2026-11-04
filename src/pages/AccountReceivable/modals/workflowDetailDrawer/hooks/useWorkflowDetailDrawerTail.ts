import type { WorkflowDetailDrawerGuardedState } from "./useWorkflowDetailDrawer";
import { useWorkflowDetailDrawerActions } from "./useWorkflowDetailDrawerActions";

export function useWorkflowDetailDrawerTail(s: WorkflowDetailDrawerGuardedState) {
  const t1 = useWorkflowDetailDrawerActions(s);
  return { ...t1 };
}

export type WorkflowDetailDrawerViewState = WorkflowDetailDrawerGuardedState & ReturnType<typeof useWorkflowDetailDrawerTail>;
