import { Trash2 } from "lucide-react";
import { Button } from "../../../../components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../../../components/ui/dialog";
import type { WorkflowDetailViewState } from "../hooks/useWorkflowDetailTail";

export function DeleteConfirmationModal({ v }: { v: WorkflowDetailViewState }) {
  const { deleteMutation, setIsDeleteDialogOpen, workflow, isDeleteDialogOpen } = v;
  return (
    <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md bg-background border border-border shadow-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground">
                  Delete Account Receivable Record
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Permanently remove this workflow and all associated records.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="p-3.5 rounded-lg bg-muted/40 border border-border/80 space-y-1.5 text-xs">
            <div>
              Reference ID:{" "}
              <strong className="font-mono text-foreground">
                {workflow?.reference_id || workflow?.id}
              </strong>
            </div>
            <div>
              Customer:{" "}
              <strong className="text-foreground">
                {workflow?.customer_name || workflow?.customer_id}
              </strong>
            </div>
            <div>
              Amount:{" "}
              <strong className="font-mono text-foreground">
                ${Number(workflow?.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}{" "}
                {workflow?.currency}
              </strong>
            </div>
          </div>

          <DialogFooter className="pt-3 border-t border-border flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteDialogOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              className="text-xs gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{deleteMutation.isPending ? "Deleting..." : "Confirm Delete"}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
  );
}
