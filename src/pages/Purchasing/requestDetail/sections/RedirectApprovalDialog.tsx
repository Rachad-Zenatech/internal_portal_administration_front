import { ManualPriceDialog } from "../../dialogs/ManualPriceDialog";
import { ProjectAutocomplete } from "../../fields/ProjectAutocomplete";
import { updateRequest } from "@/services/purchasingService";
import { toast } from "sonner";
import { FolderKanban, Forward } from "lucide-react";
import { ScheduleBreakdownModal } from "../../dialogs/ScheduleBreakdownModal";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { RequestDetailViewState } from "../hooks/useRequestDetailTail";

export function RedirectApprovalDialog({ v }: { v: RequestDetailViewState }) {
  const { setIsProjectDialogOpen, quickProjectValue, queryClient, request, setQuickProjectValue, isProjectDialogOpen, setIsManualPriceOpen, isManualPriceOpen, id, setIsEditWireOpen, setIsScheduleLedgerOpen, isScheduleLedgerOpen, data, redirectToVanessaMutation, setSearchParams, searchParams, setVanessaRedirectReason, setIsRedirectVanessaDialogOpen, vanessaRedirectReason, isRedirectVanessaDialogOpen } = v;
  return (
    <>
      {id && (
        <>

      {/* Redirect to Vanessa Fernandes Dialog */}
      <Dialog open={isRedirectVanessaDialogOpen} onOpenChange={setIsRedirectVanessaDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-purple-900 dark:text-purple-200">
              <Forward className="h-5 w-5 text-purple-600" />
              Redirect Level 2 Approval to Vanessa
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600 dark:text-zinc-400 mt-1">
              This assigns Level 2 Company Approval for Request #{request?.id} directly to <strong>Vanessa Fernandes</strong> and sends her an immediate approval notification email.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-zinc-300">
                Reason / Note for Vanessa (Optional)
              </label>
              <Textarea
                value={vanessaRedirectReason}
                onChange={(e) => setVanessaRedirectReason(e.target.value)}
                placeholder="e.g., Hi Vanessa, please review and approve this requisition on Shaun's behalf."
                rows={3}
                className="mt-1 text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsRedirectVanessaDialogOpen(false)}
              disabled={redirectToVanessaMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-purple-600 hover:bg-purple-700 text-white"
              disabled={redirectToVanessaMutation.isPending}
              onClick={async () => {
                if (!id) return;
                try {
                  await redirectToVanessaMutation.mutateAsync({
                    requestId: id,
                    reason: vanessaRedirectReason.trim() || undefined,
                  });
                  setIsRedirectVanessaDialogOpen(false);
                  setVanessaRedirectReason("");
                  if (searchParams.get("redirect_to")) {
                    const next = new URLSearchParams(searchParams);
                    next.delete("redirect_to");
                    setSearchParams(next, { replace: true });
                  }
                } catch {
                  // handled by onError
                }
              }}
            >
              {redirectToVanessaMutation.isPending ? "Redirecting..." : "Confirm Redirect"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ScheduleBreakdownModal
            request={data?.request || null}
            open={isScheduleLedgerOpen}
            onOpenChange={setIsScheduleLedgerOpen}
            onEditWireInfo={() => {
              setIsScheduleLedgerOpen(false);
              setIsEditWireOpen(true);
            }}
          />

          <ManualPriceDialog
            requestId={id}
            isOpen={isManualPriceOpen}
            onOpenChange={setIsManualPriceOpen}
          />

          {/* Quick Add / Change Group Project Dialog */}
          <Dialog open={isProjectDialogOpen} onOpenChange={setIsProjectDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FolderKanban className="h-4 w-4 text-indigo-600" />
                  <span>{request.project_name ? "Change Group Project" : "Add to Group Project"}</span>
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Assign this request to a group project (e.g. &quot;Drone Project&quot;). All related purchases under this project will be grouped together.
                </DialogDescription>
              </DialogHeader>
              <div className="py-3 space-y-2">
                <Label className="text-xs font-semibold">Project Name</Label>
                <ProjectAutocomplete
                  value={quickProjectValue}
                  onChange={setQuickProjectValue}
                  placeholder="Select existing project or type new project name..."
                />
              </div>
              <DialogFooter>
                <Button variant="outline" size="sm" onClick={() => setIsProjectDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={async () => {
                    try {
                      await updateRequest(request.id, {
                        project_name: quickProjectValue.trim() || null,
                      });
                      queryClient.invalidateQueries({ queryKey: ["purchasing", "request", request.id] });
                      queryClient.invalidateQueries({ queryKey: ["purchasing", "requests"] });
                      queryClient.invalidateQueries({ queryKey: ["purchasing", "projects"] });
                      toast.success(
                        quickProjectValue.trim()
                          ? `Assigned to project "${quickProjectValue.trim()}"`
                          : "Removed from project"
                      );
                      setIsProjectDialogOpen(false);
                    } catch (err: any) {
                      toast.error(err?.message || "Failed to update project");
                    }
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  Save Project
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </>
  );
}
