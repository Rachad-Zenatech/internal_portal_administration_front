import { formatMoney } from "./utils/purchasingMeta";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, XCircle, ShieldCheck, Search, Layers, Sparkles, Loader2, RefreshCw, Filter, AlertTriangle } from "lucide-react";
import { useMyApprovals } from "./myApprovals/hooks/useMyApprovals";
import { MainApprovalsTable } from "./myApprovals/sections/MainApprovalsTable";
import { QuickRequestPreviewDrawer } from "./myApprovals/sections/QuickRequestPreviewDrawer";

export default function MyApprovals() {
  const s = useMyApprovals();
  const { rejectMutation, actionComment, selectedIds, setIsRejectOpen, setActionComment, isRejectOpen, approveMutation, setIsApproveOpen, isApproveOpen, setSelectedIds, selectedTotalAmount, isHistoryMode, setPriorityFilter, priorityFilter, setSearchTerm, searchTerm, metrics, cardFilter, setCardFilter, kpiRef, isRefetching, isLoading, handleRefresh } = s;
  return (
    <div className="w-full max-w-[1650px] mx-auto flex flex-col gap-5 p-4 sm:p-6 animate-in fade-in duration-300">
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50 shadow-2xs">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-zinc-50">
                  My Approvals
                </h1>
                <Badge
                  variant="outline"
                  className={
                    isHistoryMode
                      ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 font-bold px-2.5 py-0.5"
                      : "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 font-bold px-2.5 py-0.5"
                  }
                >
                  {isHistoryMode ? `${metrics.approvedCount} Approved` : `${metrics.pendingCount} Pending`}
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Review, sign-off, or reject purchase requests requiring your authorization.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading || isRefetching}
            className="h-9 text-xs sm:text-sm gap-1.5 bg-white dark:bg-zinc-950 shadow-2xs font-medium"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? "animate-spin text-indigo-600" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* ── KPI Interactive Filter Cards ── */}
      <div ref={kpiRef} className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Card 1: All Pending */}
        <Card
          onClick={() => {
            setSelectedIds([]);
            setCardFilter("ALL");
          }}
          className={`border transition-all cursor-pointer rounded-xl ${
            cardFilter === "ALL"
              ? "border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/30 dark:bg-indigo-950/30 shadow-xs"
              : "border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 hover:shadow-2xs bg-white dark:bg-zinc-950"
          }`}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                All Pending
              </span>
              <div className="text-2xl font-bold text-slate-900 dark:text-zinc-50">
                {metrics.pendingCount}
              </div>
              <p className="text-xs text-muted-foreground font-mono">
                {formatMoney(metrics.pendingAmount)} total
              </p>
            </div>
            <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shrink-0 border border-indigo-100 dark:border-indigo-900/50">
              <Layers className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Card 2: High / Urgent */}
        <Card
          onClick={() => {
            setSelectedIds([]);
            setCardFilter(cardFilter === "HIGH" ? "ALL" : "HIGH");
          }}
          className={`border transition-all cursor-pointer rounded-xl ${
            cardFilter === "HIGH"
              ? "border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/30 dark:bg-amber-950/30 shadow-xs"
              : "border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 hover:shadow-2xs bg-white dark:bg-zinc-950"
          }`}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                High / Urgent Priority
              </span>
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {metrics.highPriority}
              </div>
              <p className="text-xs text-muted-foreground">Requires fast-track authorization</p>
            </div>
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 shrink-0 border border-amber-100 dark:border-amber-900/50">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Approved History */}
        <Card
          onClick={() => {
            setSelectedIds([]);
            setCardFilter(cardFilter === "APPROVED_HISTORY" ? "ALL" : "APPROVED_HISTORY");
          }}
          className={`border transition-all cursor-pointer rounded-xl ${
            cardFilter === "APPROVED_HISTORY"
              ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/30 dark:bg-emerald-950/30 shadow-xs"
              : "border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 hover:shadow-2xs bg-white dark:bg-zinc-950"
          }`}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Approved History
              </span>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {metrics.approvedCount}
              </div>
              <p className="text-xs text-emerald-700 dark:text-emerald-300 font-mono font-medium">
                {formatMoney(metrics.approvedAmount)} approved
              </p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shrink-0 border border-emerald-100 dark:border-emerald-900/50">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Search & Filter Controls ── */}
      <div className="p-3.5 sm:p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={
                isHistoryMode
                  ? "Search approved requests by title, requester, department, ID, GL code..."
                  : "Search pending requests by title, requester, department, ID, GL code..."
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9.5 h-10 text-xs sm:text-sm bg-slate-50/50 dark:bg-zinc-900/50"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            )}
          </div>

          {/* Priority Filter */}
          <div className="w-full sm:w-48">
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="h-10 text-xs sm:text-sm bg-slate-50/50 dark:bg-zinc-900/50 font-medium">
                <div className="flex items-center gap-1.5 truncate">
                  <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground mr-1">Priority:</span>
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Priorities</SelectItem>
                <SelectItem value="URGENT">🚨 Urgent</SelectItem>
                <SelectItem value="HIGH">⚡ High</SelectItem>
                <SelectItem value="MEDIUM">🔵 Medium</SelectItem>
                <SelectItem value="LOW">⚪ Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* ── Main Approvals Table ── */}
      <MainApprovalsTable s={s} />

      {/* ── Floating Batch Actions Toolbar ── */}
      {!isHistoryMode && selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white dark:bg-zinc-900 dark:border dark:border-zinc-800 px-5 py-3 rounded-2xl shadow-xl flex items-center gap-4 animate-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-center gap-2">
            <span className="h-6 w-6 rounded-full bg-indigo-500 text-white font-bold text-xs flex items-center justify-center">
              {selectedIds.length}
            </span>
            <span className="text-xs font-medium">
              Selected ({formatMoney(selectedTotalAmount)})
            </span>
          </div>

          <div className="h-4 w-px bg-slate-700 dark:bg-zinc-700" />

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => {
                setActionComment("");
                setIsApproveOpen(true);
              }}
              className="h-8 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-xs"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Approve ({selectedIds.length})
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setActionComment("");
                setIsRejectOpen(true);
              }}
              className="h-8 text-xs font-semibold border-rose-500/50 text-rose-300 hover:bg-rose-950/60 hover:text-white gap-1.5"
            >
              <XCircle className="w-3.5 h-3.5" />
              Reject ({selectedIds.length})
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedIds([])}
              className="h-8 text-xs text-slate-400 hover:text-white hover:bg-slate-800"
            >
              Deselect All
            </Button>
          </div>
        </div>
      )}

      {/* ── Quick Request Preview Drawer (Sheet) ── */}
      <QuickRequestPreviewDrawer s={s} />

      {/* ── Approve Confirmation Dialog ── */}
      <Dialog open={isApproveOpen} onOpenChange={setIsApproveOpen}>
        <DialogContent className="sm:max-w-[460px] p-6 rounded-2xl">
          <DialogHeader>
            <div className="w-11 h-11 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2 border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <DialogTitle className="text-lg font-bold">Confirm Approval</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Are you sure you want to authorize {selectedIds.length} purchase request(s)? This will advance them to Waiting for Payment.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
              Approval Note (Optional)
            </label>
            <Textarea
              placeholder="e.g. Approved as per Q3 departmental budget..."
              value={actionComment}
              onChange={(e) => setActionComment(e.target.value)}
              className="text-xs resize-none h-20 rounded-lg"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsApproveOpen(false)}
              disabled={approveMutation.isPending}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => approveMutation.mutate({ request_ids: selectedIds, comment: actionComment })}
              disabled={approveMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs gap-1.5 px-4"
            >
              {approveMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              Confirm Approval
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Reject Confirmation Dialog ── */}
      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent className="sm:max-w-[460px] p-6 rounded-2xl">
          <DialogHeader>
            <div className="w-11 h-11 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-2 border border-rose-200 dark:border-rose-800">
              <XCircle className="w-5 h-5" />
            </div>
            <DialogTitle className="text-lg font-bold">Reject Request(s)</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Please provide a clear reason for rejecting {selectedIds.length} purchase request(s).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
              Rejection Reason <span className="text-rose-500">*</span>
            </label>
            <Textarea
              placeholder="e.g. Exceeds allocated budget or requires additional quote specifications..."
              value={actionComment}
              onChange={(e) => setActionComment(e.target.value)}
              className="text-xs resize-none h-20 rounded-lg"
              required
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsRejectOpen(false)}
              disabled={rejectMutation.isPending}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => rejectMutation.mutate({ request_ids: selectedIds, comment: actionComment })}
              disabled={rejectMutation.isPending || !actionComment.trim()}
              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs gap-1.5 px-4"
            >
              {rejectMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <XCircle className="w-3.5 h-3.5" />
              )}
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
