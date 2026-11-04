import type { TaskDetailPanelGuardedState } from "./useTaskDetailPanel";
import { useTaskDetailPanelActions } from "./useTaskDetailPanelActions";

export function useTaskDetailPanelTail(s: TaskDetailPanelGuardedState) {
  const t1 = useTaskDetailPanelActions(s);
  return { ...t1 };
}

export type TaskDetailPanelViewState = TaskDetailPanelGuardedState & ReturnType<typeof useTaskDetailPanelTail>;
