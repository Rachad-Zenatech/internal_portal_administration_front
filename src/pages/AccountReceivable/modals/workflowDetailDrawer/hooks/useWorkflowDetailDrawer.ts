import { useWorkflowDetailDrawerData } from "./useWorkflowDetailDrawerData";
import type { WorkflowDetailDrawerProps } from "../types";

export function useWorkflowDetailDrawer(props: WorkflowDetailDrawerProps) {
  const { open, onOpenChange } = props;
  const c1 = useWorkflowDetailDrawerData(props);
  return { ...c1, open, onOpenChange };
}

export type WorkflowDetailDrawerState = ReturnType<typeof useWorkflowDetailDrawer>;

// Names tested by the early-return guards are known to be set once the guards have passed.
type Narrowed<T, K extends keyof T> = Omit<T, K> & { [P in K]: NonNullable<T[P]> };
export type WorkflowDetailDrawerGuardedState = Narrowed<WorkflowDetailDrawerState, "open">;
