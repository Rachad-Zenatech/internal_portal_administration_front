import { UserCheck } from "lucide-react";
import { UserAutocomplete } from "../../fields/UserAutocomplete";
import { Button } from "../../../../components/ui/button";
import { Textarea } from "../../../../components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../../../components/ui/dialog";
import type { WorkflowDetailViewState } from "../hooks/useWorkflowDetailTail";

export function AssignToArClerk({ v }: { v: WorkflowDetailViewState }) {
  const { setIsAssignClerkDialogOpen, clerkRemarks, transitionMutation, clerksList, clerkEmail, setClerkRemarks, setClerkEmail, isAssignClerkDialogOpen } = v;
  return (
    <Dialog open={isAssignClerkDialogOpen} onOpenChange={setIsAssignClerkDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl">
          <DialogHeader className="space-y-1.5 pb-3 border-b border-slate-100 dark:border-zinc-800">
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-zinc-100">
              <UserCheck className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              Assign to Account Receivable User
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
              Route this workflow to an Account Receivable user to investigate payment shortfalls, customer deductions, or unapplied wire funds.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            {/* Clerk Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Assigned Account Receivable User <span className="text-red-500">*</span>
              </label>
              <UserAutocomplete
                value={clerkEmail}
                onChange={(val) => setClerkEmail(val)}
                placeholder="Select Account Receivable assigned user..."
              />
            </div>

            {/* Remarks */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Discrepancy / Transition Remarks <span className="text-red-500">*</span>
              </label>
              <Textarea
                placeholder="Enter payment shortfall reason, customer deduction notes, or instructions for the AR clerk..."
                value={clerkRemarks}
                onChange={(e) => setClerkRemarks(e.target.value)}
                rows={4}
                className="text-xs resize-none"
              />
              <span className="text-[11px] text-slate-400 dark:text-zinc-500 block">
                Recorded in audit trail and assigned to the clerk's active task queue.
              </span>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t border-slate-100 dark:border-zinc-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAssignClerkDialogOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={transitionMutation.isPending}
              onClick={() => {
                const assignedEmail = clerkEmail || clerksList[0]?.email || "sarah.jenkins@zenatech.com";
                transitionMutation.mutate({
                  targetState: "CLERK_REVIEW",
                  note:
                    clerkRemarks.trim() ||
                    `Partially paid shortfall routed to AR Clerk (${assignedEmail}) for discrepancy resolution.`,
                  payload: {
                    payment_match_type: "PARTIAL_PAID",
                    ar_clerk_assigned_to: assignedEmail,
                    discrepancy_reason: clerkRemarks.trim(),
                  },
                });
                setIsAssignClerkDialogOpen(false);
              }}
              className="text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white gap-1.5"
            >
              <UserCheck className="w-3.5 h-3.5" />
              Confirm Assignment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
  );
}
