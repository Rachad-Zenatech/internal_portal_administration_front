import { useWorkflowAssignmentsActions } from "./useWorkflowAssignmentsActions";
import { useWorkflowAssignmentsActions2 } from "./useWorkflowAssignmentsActions2";

export function useWorkflowAssignments() {
  const c1 = useWorkflowAssignmentsActions();
  const c2 = useWorkflowAssignmentsActions2(c1);
  return { ...c1, ...c2 };
}

export type WorkflowAssignmentsState = ReturnType<typeof useWorkflowAssignments>;
