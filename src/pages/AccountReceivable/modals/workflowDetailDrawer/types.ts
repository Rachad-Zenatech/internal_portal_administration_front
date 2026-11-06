export interface WorkflowDetailDrawerProps {
  workflowId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
