import { useTaskDetailPanelState } from "./useTaskDetailPanelState";
import type { TaskDetailPanelProps } from "../types";

export function useTaskDetailPanel(props: TaskDetailPanelProps) {
  const { task, onClose, onUpdate, readOnly = false } = props;
  const c1 = useTaskDetailPanelState();
  return { ...c1, task, onClose, onUpdate, readOnly };
}

export type TaskDetailPanelState = ReturnType<typeof useTaskDetailPanel>;

// Names tested by the early-return guards are known to be set once the guards have passed.
type Narrowed<T, K extends keyof T> = Omit<T, K> & { [P in K]: NonNullable<T[P]> };
export type TaskDetailPanelGuardedState = Narrowed<TaskDetailPanelState, "task">;
