import { Clock, XCircle } from "lucide-react";
import { Button } from "../../components/ui/button";
import { useWorkflowDetail } from "./workflowDetail/hooks/useWorkflowDetail";
import { WorkflowDetailBody } from "./workflowDetail/WorkflowDetailBody";
import type { WorkflowDetailGuardedState } from "./workflowDetail/hooks/useWorkflowDetail";

export default function WorkflowDetailPage() {
  const s = useWorkflowDetail();
  const { isLoading, navigate, workflow } = s;
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-3">
        <Clock className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground">
          Loading workflow details...
        </p>
      </div>
    );
  }
  if (!workflow) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center space-y-4">
        <div className="p-4 rounded-full bg-red-500/10 text-red-500 w-12 h-12 mx-auto flex items-center justify-center">
          <XCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Workflow Not Found</h2>
        <p className="text-xs text-muted-foreground">
          The requested Account Receivable workflow ID does not exist or has been removed.
        </p>
        <Button onClick={() => navigate("/account-receivable")} variant="outline" className="text-xs">
          Back to Workflows
        </Button>
      </div>
    );
  }
  return <WorkflowDetailBody s={s as WorkflowDetailGuardedState} />;
}
