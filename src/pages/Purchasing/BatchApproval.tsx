import { formatMoney } from "./utils/purchasingMeta";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle2, XCircle, Settings, ShieldCheck, Search, DollarSign, Layers, BellRing } from "lucide-react";
import { useBatchApproval } from "./batchApproval/hooks/useBatchApproval";
import { TableOfWaitingApprovals } from "./batchApproval/sections/TableOfWaitingApprovals";
import { NotificationScheduleSettingsModal } from "./batchApproval/sections/NotificationScheduleSettingsModal";

export default function BatchApproval() {
  const s = useBatchApproval();
  const { selectedIds, rejectMutation, actionComment, setIsRejectOpen, setActionComment, isRejectOpen, approveMutation, setIsApproveOpen, selectedTotalAmount, isApproveOpen, setSearchTerm, searchTerm, requests, notifyMutation, setIsSettingsOpen, notifSettings, setSettingsForm } = s;
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
              Batch Approval
            </h1>
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
              Manager & Executive
            </Badge>
          </div>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Review and take batch action on all pending purchase requests. Automated email summaries are dispatched twice daily (midday & end of day).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-1.5 text-xs font-medium"
            onClick={() => {
              if (notifSettings) setSettingsForm(notifSettings);
              setIsSettingsOpen(true);
            }}
          >
            <Settings size={15} />
            Schedule Settings
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-1.5 text-xs font-medium text-amber-700 border-amber-300 hover:bg-amber-50"
            disabled={notifyMutation.isPending || requests.length === 0}
            onClick={() => notifyMutation.mutate()}
          >
            <BellRing size={15} />
            {notifyMutation.isPending ? "Sending..." : "Notify Managers Now"}
          </Button>
        </div>
      </div>

      {/* Stats and Action Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border border-slate-200/80 dark:border-zinc-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">
                Awaiting Approval
              </p>
              <h3 className="text-2xl font-bold text-yellow-600 mt-1">
                {requests.length}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-yellow-50 dark:bg-yellow-950 flex items-center justify-center text-yellow-600">
              <Layers size={20} />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200/80 dark:border-zinc-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">
                Selected Requests
              </p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-zinc-100 mt-1">
                {selectedIds.length} <span className="text-xs text-muted-foreground font-normal">of {requests.length}</span>
              </h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600">
              <ShieldCheck size={20} />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200/80 dark:border-zinc-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">
                Selected Total Value
              </p>
              <h3 className="text-2xl font-bold text-emerald-600 mt-1">
                {formatMoney(selectedTotalAmount)}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-600">
              <DollarSign size={20} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Batch Action Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/80 dark:bg-zinc-900/50 p-3 rounded-lg border border-slate-200 dark:border-zinc-800">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search pending requests..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 h-8 text-xs bg-white dark:bg-zinc-800"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Button
            variant="default"
            size="sm"
            disabled={selectedIds.length === 0}
            className="h-8 gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => setIsApproveOpen(true)}
          >
            <CheckCircle2 size={15} />
            Batch Approve ({selectedIds.length})
          </Button>

          <Button
            variant="destructive"
            size="sm"
            disabled={selectedIds.length === 0}
            className="h-8 gap-1.5 text-xs"
            onClick={() => setIsRejectOpen(true)}
          >
            <XCircle size={15} />
            Batch Reject ({selectedIds.length})
          </Button>
        </div>
      </div>

      {/* Table of Waiting Approvals */}
      <TableOfWaitingApprovals s={s} />

      {/* Batch Approve Modal */}
      <Dialog open={isApproveOpen} onOpenChange={setIsApproveOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600">
              <CheckCircle2 size={20} />
              Confirm Batch Approval
            </DialogTitle>
            <DialogDescription>
              You are about to approve <strong>{selectedIds.length}</strong> purchase request(s) totaling <strong>{formatMoney(selectedTotalAmount)}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <label className="text-sm font-medium">Approval Comment (Optional)</label>
            <textarea
              className="w-full text-sm rounded-md border border-input bg-background px-3 py-2 min-h-[80px]"
              placeholder="e.g. Approved per quarterly budget review."
              value={actionComment}
              onChange={(e) => setActionComment(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsApproveOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={approveMutation.isPending}
              onClick={() =>
                approveMutation.mutate({
                  request_ids: selectedIds,
                  comment: actionComment,
                })
              }
            >
              {approveMutation.isPending ? "Approving..." : `Approve ${selectedIds.length} Requests`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Batch Reject Modal */}
      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <XCircle size={20} />
              Confirm Batch Rejection
            </DialogTitle>
            <DialogDescription>
              You are about to reject <strong>{selectedIds.length}</strong> purchase request(s).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <label className="text-sm font-medium">
              Rejection Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              className="w-full text-sm rounded-md border border-input bg-background px-3 py-2 min-h-[80px]"
              placeholder="Reason for rejecting these requests..."
              value={actionComment}
              onChange={(e) => setActionComment(e.target.value)}
              required
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRejectOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={rejectMutation.isPending || !actionComment.trim()}
              onClick={() =>
                rejectMutation.mutate({
                  request_ids: selectedIds,
                  comment: actionComment,
                })
              }
            >
              {rejectMutation.isPending ? "Rejecting..." : `Reject ${selectedIds.length} Requests`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notification Schedule Settings Modal */}
      <NotificationScheduleSettingsModal s={s} />
    </div>
  );
}
