import type { WorkflowDetailDrawerProps } from "./workflowDetailDrawer/types";
import { useWorkflowDetailDrawer } from "./workflowDetailDrawer/hooks/useWorkflowDetailDrawer";
import { WorkflowDetailDrawerBody } from "./workflowDetailDrawer/WorkflowDetailDrawerBody";
import type { WorkflowDetailDrawerGuardedState } from "./workflowDetailDrawer/hooks/useWorkflowDetailDrawer";

export default function WorkflowDetailDrawer(props: WorkflowDetailDrawerProps) {
  const s = useWorkflowDetailDrawer(props);
  const { open } = s;
  if (!open) return null;
  return <WorkflowDetailDrawerBody s={s as WorkflowDetailDrawerGuardedState} />;
}
