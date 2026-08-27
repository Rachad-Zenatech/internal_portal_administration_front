import { useState, useMemo, useRef } from "react";
import { FloatingVerticalFilter } from "@/components/ui/FloatingVerticalFilter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { apiClient } from "@/services/apiClient";
import type { PurchaseRequest, RequestDetail } from "@/types/purchasing";
import {
  formatDate,
  formatMoney,
  PRIORITY_BADGE,
} from "./purchasingMeta";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Search,
  DollarSign,
  Layers,
  BellRing,
  ExternalLink,
  Clock,
  Sparkles,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

export default function MyApprovals() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [cardFilter, setCardFilter] = useState<string>("ALL");
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [actionComment, setActionComment] = useState("");
  const kpiRef = useRef<HTMLDivElement>(null);

  // Fetch pending requests for this approver
  const { data: requests = [], isLoading, refetch } = useQuery<PurchaseRequest[]>({
    queryKey: ["my-approvals-list"],
    queryFn: async () => {
      return await apiClient.get<PurchaseRequest[]>("/api/purchasing/my-approvals");
    },
    refetchOnWindowFocus: true,
  });

  // Batch approve mutation
  const approveMutation = useMutation({
    mutationFn: async ({ request_ids, comment }: { request_ids: number[]; comment?: string }) => {
      return await apiClient.post<RequestDetail[]>("/api/purchasing/batch-approve", {
        request_ids,
        comment,
      });
    },
    onSuccess: (res) => {
      toast.success(`Successfully approved ${res.length} request(s)`);
      setSelectedIds([]);
      setIsApproveOpen(false);
      setActionComment("");
      queryClient.invalidateQueries({ queryKey: ["my-approvals-list"] });
      queryClient.invalidateQueries({ queryKey: ["purchasing-summary"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Approval failed");
    },
  });

  // Batch reject mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ request_ids, comment }: { request_ids: number[]; comment?: string }) => {
      return await apiClient.post<RequestDetail[]>("/api/purchasing/batch-reject", {
        request_ids,
        comment,
      });
    },
    onSuccess: (res) => {
      toast.success(`Successfully rejected ${res.length} request(s)`);
      setSelectedIds([]);
      setIsRejectOpen(false);
      setActionComment("");
      queryClient.invalidateQueries({ queryKey: ["my-approvals-list"] });
      queryClient.invalidateQueries({ queryKey: ["purchasing-summary"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Rejection failed");
    },
  });

  // Trigger manual notification mutation
  const notifyMutation = useMutation({
    mutationFn: async () => {
      return await apiClient.post<any>("/api/purchasing/batch-notify", {});
    },
    onSuccess: (res) => {
      if (res.sent) {
        toast.success(`Approval notification digest sent (${res.recipients?.join(", ") || "Configured recipients"})`);
      } else {
        toast.info(res.message || "Notification completed");
      }
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to trigger notification");
    },
  });

  // Metrics
  const metrics = useMemo(() => {
    const totalCount = requests.length;
    const totalAmount = requests.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
    const highPriority = requests.filter((r) => r.priority === "HIGH" || r.priority === "URGENT").length;
    const under10k = requests.filter((r) => (Number(r.amount) || 0) < 10000).length;
    const over10k = requests.filter((r) => (Number(r.amount) || 0) >= 10000).length;
    return { totalCount, totalAmount, highPriority, under10k, over10k };
  }, [requests]);

  // Filter requests
  const filteredRequests = useMemo(() => {
    let result = requests;
    if (cardFilter === "HIGH") {
      result = result.filter((r) => r.priority === "HIGH" || r.priority === "URGENT");
    } else if (cardFilter === "UNDER_10K") {
      result = result.filter((r) => (Number(r.amount) || 0) < 10000);
    } else if (cardFilter === "OVER_10K") {
      result = result.filter((r) => (Number(r.amount) || 0) >= 10000);
    }

    const q = searchTerm.toLowerCase().trim();
    if (!q) return result;
    return result.filter(
      (r) =>
        r.id.toString().includes(q) ||
        (r.title || "").toLowerCase().includes(q) ||
        (r.requester || "").toLowerCase().includes(q) ||
        (r.department || "").toLowerCase().includes(q) ||
        (r.assigned_user || "").toLowerCase().includes(q) ||
        (r.description || "").toLowerCase().includes(q) ||
        (r.gl_code || "").toLowerCase().includes(q)
    );
  }, [requests, cardFilter, searchTerm]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredRequests.map((r) => Number(r.id)));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleRow = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-3 sm:gap-3.5 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-zinc-800 pb-3.5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-zinc-50">My Approvals</h1>
            <Badge
              variant="outline"
              className="bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 font-semibold"
            >
              {requests.length} Pending
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Review, sign-off, or reject purchase requests requiring your managerial or executive approval. Click any row to view full request details.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => notifyMutation.mutate()}
            disabled={notifyMutation.isPending}
            className="text-xs gap-1.5"
            title="Trigger approval summary notification email"
          >
            <BellRing className="w-3.5 h-3.5 text-indigo-500" />
            Send Email Digest
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
            className="text-xs gap-1.5"
          >
            <Clock className="w-3.5 h-3.5" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Slim Vertical Floating Quick Filter (Follows card colors & appears on scroll) */}
      <FloatingVerticalFilter
        items={[
          {
            key: "ALL",
            label: "All Pending",
            count: metrics.totalCount,
            icon: Layers,
            color: "blue",
          },
          {
            key: "HIGH",
            label: "High / Urgent",
            count: metrics.highPriority,
            icon: ShieldCheck,
            color: "orange",
          },
          {
            key: "UNDER_10K",
            label: "< $10k (Standard Approver)",
            count: metrics.under10k,
            icon: DollarSign,
            color: "green",
          },
          {
            key: "OVER_10K",
            label: "≥ $10k (Senior Approver)",
            count: metrics.over10k,
            icon: Sparkles,
            color: "violet",
          },
        ]}
        activeKey={cardFilter}
        onSelect={setCardFilter}
        defaultKey="ALL"
        onReset={() => setCardFilter("ALL")}
        scrollThreshold={120}
        title="Approvals"
        kpiRef={kpiRef}
      />

      {/* Compact Metric Cards Section */}
      <div ref={kpiRef} className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 animate-in fade-in duration-300 shrink-0">
        <Card
          onClick={() => setCardFilter("ALL")}
          className={`border transition-all cursor-pointer rounded-lg ${
            cardFilter === "ALL"
              ? "border-blue-500/80 ring-2 ring-blue-500/20 bg-blue-50/20 dark:bg-blue-950/20 shadow-xs"
              : "border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 hover:shadow-xs"
          }`}
        >
          <CardContent className="p-2 sm:p-2.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground">All Pending</p>
              <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-zinc-50 leading-tight mt-0.5">{metrics.totalCount}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{formatMoney(metrics.totalAmount)}</p>
            </div>
            <div className="p-1.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 shrink-0">
              <Layers className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card
          onClick={() => setCardFilter(cardFilter === "HIGH" ? "ALL" : "HIGH")}
          className={`border transition-all cursor-pointer rounded-lg ${
            cardFilter === "HIGH"
              ? "border-orange-500/80 ring-2 ring-orange-500/20 bg-orange-50/20 dark:bg-orange-950/20 shadow-xs"
              : "border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 hover:shadow-xs"
          }`}
        >
          <CardContent className="p-2 sm:p-2.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground">High / Urgent</p>
              <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-zinc-50 leading-tight mt-0.5">{metrics.highPriority}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Requires fast-track</p>
            </div>
            <div className="p-1.5 rounded-md bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card
          onClick={() => setCardFilter(cardFilter === "UNDER_10K" ? "ALL" : "UNDER_10K")}
          className={`border transition-all cursor-pointer rounded-lg ${
            cardFilter === "UNDER_10K"
              ? "border-emerald-500/80 ring-2 ring-emerald-500/20 bg-emerald-50/20 dark:bg-emerald-950/20 shadow-xs"
              : "border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 hover:shadow-xs"
          }`}
        >
          <CardContent className="p-2 sm:p-2.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground">&lt; $10k (Standard)</p>
              <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-zinc-50 leading-tight mt-0.5">{metrics.under10k}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Tier 1 limit</p>
            </div>
            <div className="p-1.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shrink-0">
              <DollarSign className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card
          onClick={() => setCardFilter(cardFilter === "OVER_10K" ? "ALL" : "OVER_10K")}
          className={`border transition-all cursor-pointer rounded-lg ${
            cardFilter === "OVER_10K"
              ? "border-violet-500/80 ring-2 ring-violet-500/20 bg-violet-50/20 dark:bg-violet-950/20 shadow-xs"
              : "border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 hover:shadow-xs"
          }`}
        >
          <CardContent className="p-2 sm:p-2.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground">≥ $10k (Senior)</p>
              <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-zinc-50 leading-tight mt-0.5">{metrics.over10k}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Tier 2 sign-off</p>
            </div>
            <div className="p-1.5 rounded-md bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Bar & Search Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-white dark:bg-zinc-900 p-2 sm:p-2.5 rounded-lg border border-slate-200 dark:border-zinc-800 shadow-2xs shrink-0">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by title, requester, department, ID, GL code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 text-xs h-8 text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <span className="text-xs font-medium text-slate-600 dark:text-zinc-300 mr-1">
              {selectedIds.length} selected
            </span>
          )}
          <Button
            size="sm"
            onClick={() => {
              setActionComment("");
              setIsApproveOpen(true);
            }}
            disabled={selectedIds.length === 0}
            className="h-8 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Approve Selected {selectedIds.length > 0 ? `(${selectedIds.length})` : ""}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setActionComment("");
              setIsRejectOpen(true);
            }}
            disabled={selectedIds.length === 0}
            className="h-8 text-xs font-medium border-rose-200 hover:bg-rose-50 text-rose-700 dark:border-rose-900 dark:hover:bg-rose-950/40 dark:text-rose-400 gap-1.5"
          >
            <XCircle className="w-3.5 h-3.5" />
            Reject Selected {selectedIds.length > 0 ? `(${selectedIds.length})` : ""}
          </Button>
        </div>
      </div>

      {/* Main Table */}
      <Card className="flex-1 min-h-[280px] flex flex-col w-full border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xs bg-white dark:bg-zinc-900 overflow-hidden">
        <Table className="w-full min-w-full" containerClassName="flex-1 min-h-0 w-full min-w-full overflow-auto">
          <TableHeader className="bg-slate-50/90 dark:bg-zinc-900/90 border-b border-slate-200 dark:border-zinc-800">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-12 text-center py-3">
                <Checkbox
                  checked={
                    filteredRequests.length > 0 &&
                    filteredRequests.every((r) => selectedIds.includes(Number(r.id)))
                  }
                  onCheckedChange={(c) => handleSelectAll(!!c)}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead className="text-xs font-semibold text-slate-700 dark:text-zinc-300 py-3">Request Title</TableHead>
              <TableHead className="text-xs font-semibold text-slate-700 dark:text-zinc-300 py-3">Requester</TableHead>
              <TableHead className="text-xs font-semibold text-slate-700 dark:text-zinc-300 py-3">Department</TableHead>
              <TableHead className="text-xs font-semibold text-slate-700 dark:text-zinc-300 py-3">Priority</TableHead>
              <TableHead className="text-xs font-semibold text-slate-700 dark:text-zinc-300 py-3 text-right">Amount</TableHead>
              <TableHead className="text-xs font-semibold text-slate-700 dark:text-zinc-300 py-3">Date</TableHead>
              <TableHead className="text-xs font-semibold text-slate-700 dark:text-zinc-300 py-3 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                    Loading pending requests...
                  </TableCell>
                </TableRow>
              ) : filteredRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    <div className="max-w-sm mx-auto flex flex-col items-center">
                      <div className="p-3 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 mb-3">
                        <CheckCircle2 className="w-8 h-8" />
                      </div>
                      <p className="font-semibold text-slate-800 dark:text-zinc-200">No Pending Approvals</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        All purchase requests requiring approval have been processed.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredRequests.map((req) => {
                  const idNum = Number(req.id);
                  const isChecked = selectedIds.includes(idNum);
                  const priorityClass =
                    PRIORITY_BADGE[req.priority as keyof typeof PRIORITY_BADGE] ||
                    PRIORITY_BADGE.MEDIUM;

                  return (
                    <TableRow
                      key={req.id}
                      onClick={() => navigate(`/purchasing/requests/${req.id}`)}
                      className={`cursor-pointer transition-colors hover:bg-slate-50/80 dark:hover:bg-zinc-800/50 ${
                        isChecked ? "bg-indigo-50/40 dark:bg-indigo-950/20" : ""
                      }`}
                    >
                      <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => handleToggleRow(idNum)}
                          aria-label={`Select request ${req.id}`}
                        />
                      </TableCell>

                      <TableCell className="max-w-[280px]">
                        <div className="flex flex-col">
                          <div className="font-medium text-xs text-slate-900 dark:text-zinc-100 hover:text-indigo-600 dark:hover:text-indigo-400 text-left line-clamp-1 group flex items-center gap-1">
                            <span>{req.title || `Request #${req.id}`}</span>
                            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
                            <span className="font-mono text-slate-500">#{req.id}</span>
                            {req.gl_code && (
                              <span className="bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-[10px] font-mono">
                                GL: {req.gl_code}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="text-xs text-slate-700 dark:text-zinc-300">
                        {req.requester || "Unassigned"}
                      </TableCell>

                      <TableCell className="text-xs text-muted-foreground">
                        {req.department || "General"}
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={`text-[10px] py-0.5 px-2 font-medium border ${priorityClass}`}
                        >
                          {req.priority || "MEDIUM"}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right font-semibold text-xs text-slate-900 dark:text-zinc-100">
                        {formatMoney(Number(req.amount) || 0)}
                      </TableCell>

                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(req.request_date)}
                      </TableCell>

                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedIds([idNum]);
                              setActionComment("");
                              setIsApproveOpen(true);
                            }}
                            className="h-7 px-2.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedIds([idNum]);
                              setActionComment("");
                              setIsRejectOpen(true);
                            }}
                            className="h-7 px-2.5 text-xs font-medium border-rose-200 hover:bg-rose-50 text-rose-700 dark:border-rose-900 dark:hover:bg-rose-950/50 dark:text-rose-400 gap-1"
                          >
                            <XCircle className="w-3 h-3" />
                            Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        <div className="border-t border-slate-100 dark:border-zinc-800 px-4 py-2.5 bg-slate-50/50 dark:bg-zinc-950/30 text-xs text-muted-foreground flex items-center justify-between">
          <span>Showing <strong>{filteredRequests.length}</strong> pending request(s)</span>
          {selectedIds.length > 0 && (
            <span className="text-indigo-600 dark:text-indigo-400 font-medium">
              {selectedIds.length} request(s) selected
            </span>
          )}
        </div>
      </Card>

      {/* Approve Dialog */}
      <Dialog open={isApproveOpen} onOpenChange={setIsApproveOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2">
              <CheckCircle2 className="w-4.5 h-4.5" />
            </div>
            <DialogTitle>Confirm Approval</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve {selectedIds.length} purchase request(s)? This will advance them to Waiting Payment.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <label className="text-xs font-medium text-slate-700 dark:text-zinc-300">
              Approval Comment (Optional)
            </label>
            <Textarea
              placeholder="e.g. Approved for processing..."
              value={actionComment}
              onChange={(e) => setActionComment(e.target.value)}
              className="text-xs resize-none h-20"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsApproveOpen(false)}
              disabled={approveMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => approveMutation.mutate({ request_ids: selectedIds, comment: actionComment })}
              disabled={approveMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
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

      {/* Reject Dialog */}
      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-2">
              <XCircle className="w-4.5 h-4.5" />
            </div>
            <DialogTitle>Reject Request(s)</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting {selectedIds.length} purchase request(s).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <label className="text-xs font-medium text-slate-700 dark:text-zinc-300">
              Rejection Reason <span className="text-rose-500">*</span>
            </label>
            <Textarea
              placeholder="e.g. Exceeds budget or incomplete quote specifications..."
              value={actionComment}
              onChange={(e) => setActionComment(e.target.value)}
              className="text-xs resize-none h-20"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsRejectOpen(false)}
              disabled={rejectMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => rejectMutation.mutate({ request_ids: selectedIds, comment: actionComment })}
              disabled={rejectMutation.isPending || !actionComment.trim()}
              className="bg-rose-600 hover:bg-rose-700 text-white gap-1.5"
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
