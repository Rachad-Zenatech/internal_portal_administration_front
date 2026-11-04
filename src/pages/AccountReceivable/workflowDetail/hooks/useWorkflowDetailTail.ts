import type { WorkflowDetailGuardedState } from "./useWorkflowDetail";
import { useWorkflowDetailActions3 } from "./useWorkflowDetailActions3";

export function useWorkflowDetailTail(s: WorkflowDetailGuardedState) {
  const t1 = useWorkflowDetailActions3(s);
  return { ...t1 };
}

export type WorkflowDetailViewState = WorkflowDetailGuardedState & ReturnType<typeof useWorkflowDetailTail>;
