import { ArrowLeft, XCircle, SquarePen, Trash2 } from "lucide-react";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import type { WorkflowDetailViewState } from "../hooks/useWorkflowDetailTail";

export function TopNavigationActionBar({ v }: { v: WorkflowDetailViewState }) {
  const { setShowCancelPrompt, transitionMutation, cancellationReason, setCancellationReason, showCancelPrompt, allowedStates, setIsDeleteDialogOpen, setIsEditModalOpen, navigate } = v;
  return (
    <div className="flex items-center justify-between gap-4 pt-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/account-receivable")}
          className="text-xs gap-1.5"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All Workflows
        </Button>

        <div className="flex items-center gap-2">
          {/* Edit Workflow Action */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsEditModalOpen(true)}
            className="text-xs gap-1.5 shadow-2xs border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900 font-medium"
          >
            <SquarePen className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Edit Workflow</span>
          </Button>

          {/* Delete Workflow Action */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsDeleteDialogOpen(true)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:border-red-900/60 dark:text-red-400 text-xs gap-1.5 shadow-2xs font-medium"
          >
            <Trash2 className="h-3.5 w-3.5 text-red-500" />
            <span>Delete Workflow</span>
          </Button>

          {/* Cancel Workflow Action */}
          {allowedStates.includes("CANCELLED") && (
            showCancelPrompt ? (
              <div className="flex items-center gap-1.5">
                <Input
                  placeholder="Reason..."
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  className="h-8 text-xs w-48 bg-white dark:bg-zinc-900"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() =>
                    transitionMutation.mutate({
                      targetState: "CANCELLED",
                      note: cancellationReason || "Cancelled by user",
                      payload: { reason: cancellationReason },
                    })
                  }
                  disabled={transitionMutation.isPending}
                  className="h-8 text-xs font-semibold"
                >
                  Confirm Cancel
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCancelPrompt(false)}
                  className="h-8 text-xs"
                >
                  Back
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowCancelPrompt(true)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:border-red-900/60 dark:text-red-400 text-xs gap-1.5 shadow-xs"
              >
                <XCircle className="h-3.5 w-3.5" />
                Cancel Workflow
              </Button>
            )
          )}
        </div>
      </div>
  );
}
