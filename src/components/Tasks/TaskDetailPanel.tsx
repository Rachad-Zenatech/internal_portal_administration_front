import type { TaskDetailPanelProps } from "./taskDetailPanel/types";
import { useTaskDetailPanel } from "./taskDetailPanel/hooks/useTaskDetailPanel";
import { TaskDetailPanelBody } from "./taskDetailPanel/TaskDetailPanelBody";
import type { TaskDetailPanelGuardedState } from "./taskDetailPanel/hooks/useTaskDetailPanel";

export default function TaskDetailPanel(props: TaskDetailPanelProps) {
  const s = useTaskDetailPanel(props);
  const { task } = s;
  if (!task) return null;
  return <TaskDetailPanelBody s={s as TaskDetailPanelGuardedState} />;
}
