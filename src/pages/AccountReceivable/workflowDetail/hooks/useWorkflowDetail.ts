import { useWorkflowDetailActions } from "./useWorkflowDetailActions";
import { useWorkflowDetailActions2 } from "./useWorkflowDetailActions2";

export function useWorkflowDetail() {
  const c1 = useWorkflowDetailActions();
  const c2 = useWorkflowDetailActions2(c1);
  return { ...c1, ...c2 };
}

export type WorkflowDetailState = ReturnType<typeof useWorkflowDetail>;

// Names tested by the early-return guards are known to be set once the guards have passed.
type Narrowed<T, K extends keyof T> = Omit<T, K> & { [P in K]: NonNullable<T[P]> };
export type WorkflowDetailGuardedState = Narrowed<WorkflowDetailState, "isLoading" | "navigate" | "workflow">;
