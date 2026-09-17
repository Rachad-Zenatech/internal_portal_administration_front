import { useState, useMemo, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { apiClient } from "@/services/apiClient";
import type { PurchaseRequest, RequestDetail } from "@/types/purchasing";
import {
  formatDate,
  formatMoney,
  PRIORITY_BADGE,
  getStatusLabel,
  getStatusBadge,
} from "./purchasingMeta";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Search,
  Layers,
  ExternalLink,
  Sparkles,
  Loader2,
  History,
  Eye,
  RefreshCw,
  Filter,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

// User Initials helper
function getInitials(name?: string | null) {
  if (!name) return "U";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export default function MyApprovals() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  const [cardFilter, setCardFilter] = useState<"ALL" | "HIGH" | "APPROVED_HISTORY">("ALL");

  // Dialog & Drawer state
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [actionComment, setActionComment] = useState("");
  const [previewRequest, setPreviewRequest] = useState<PurchaseRequest | null>(null);

  const kpiRef = useRef<HTMLDivElement>(null);
  const isHistoryMode = cardFilter === "APPROVED_HISTORY";

  // Fetch pending requests for this approver
  const {
    data: pendingRequests = [],
    isLoading: isPendingLoading,
    isRefetching: isPendingRefetching,
    refetch: refetchPending,
  } = useQuery<PurchaseRequest[]>({
    queryKey: ["my-approvals-list"],
    queryFn: async () => {
      return await apiClient.get<PurchaseRequest[]>("/api/purchasing/my-approvals");
    },
    refetchOnWindowFocus: true,
  });

  // Fetch approved requests history
  const {
    data: historyRequests = [],
    isLoading: isHistoryLoading,
    isRefetching: isHistoryRefetching,
    refetch: refetchHistory,
  } = useQuery<PurchaseRequest[]>({
    queryKey: ["my-approvals-history"],
    queryFn: async () => {
      return await apiClient.get<PurchaseRequest[]>("/api/purchasing/my-approvals?status=APPROVED");
    },
    refetchOnWindowFocus: true,
  });

  const isLoading = isHistoryMode ? isHistoryLoading : isPendingLoading;
  const isRefetching = isPendingRefetching || isHistoryRefetching;

  const handleRefresh = () => {
    refetchPending();
    refetchHistory();
    toast.success("Approvals refreshed");
  };

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
      setPreviewRequest(null);
      setActionComment("");
      queryClient.invalidateQueries({ queryKey: ["my-approvals-list"] });
      queryClient.invalidateQueries({ queryKey: ["my-approvals-history"] });
      queryClient.invalidateQueries({ queryKey: ["purchasing-summary"] });
    },
    onError: (err: Error) => {
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
      setPreviewRequest(null);
      setActionComment("");
      queryClient.invalidateQueries({ queryKey: ["my-approvals-list"] });
      queryClient.invalidateQueries({ queryKey: ["my-approvals-history"] });
      queryClient.invalidateQueries({ queryKey: ["purchasing-summary"] });
    },
    onError: (err: Error) => {
      toast.error(err?.message || "Rejection failed");
    },
  });

  // Metrics calculation
  const metrics = useMemo(() => {
    const pendingCount = pendingRequests.length;
    const pendingAmount = pendingRequests.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
    const highPriority = pendingRequests.filter((r) => r.priority === "HIGH" || r.priority === "URGENT").length;
    const approvedCount = historyRequests.length;
    const approvedAmount = historyRequests.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

    return {
      pendingCount,
      pendingAmount,
      highPriority,
      approvedCount,
      approvedAmount,
    };
  }, [pendingRequests, historyRequests]);

  // Filter requests based on active card, priority filter, and search
  const filteredRequests = useMemo(() => {
    let result = isHistoryMode ? historyRequests : pendingRequests;

    if (cardFilter === "HIGH") {
      result = result.filter((r) => r.priority === "HIGH" || r.priority === "URGENT");
    }

    if (priorityFilter !== "ALL") {
      result = result.filter((r) => r.priority === priorityFilter);
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
        (r.gl_code || "").toLowerCase().includes(q) ||
        (r.status || "").toLowerCase().includes(q)
    );
  }, [isHistoryMode, historyRequests, pendingRequests, cardFilter, priorityFilter, searchTerm]);

  // Total selected dollar amount
  const selectedTotalAmount = useMemo(() => {
    const map = new Map(pendingRequests.map((r) => [Number(r.id), Number(r.amount) || 0]));
    return selectedIds.reduce((sum, id) => sum + (map.get(id) || 0), 0);
  }, [selectedIds, pendingRequests]);

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

  const handleSingleApprove = (req: PurchaseRequest) => {
    setSelectedIds([Number(req.id)]);
    setActionComment("");
    setIsApproveOpen(true);
  };

  const handleSingleReject = (req: PurchaseRequest) => {
    setSelectedIds([Number(req.id)]);
    setActionComment("");
    setIsRejectOpen(true);
  };

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
      <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-2xs overflow-hidden flex flex-col flex-1 min-h-[400px]">
        <div className="overflow-x-auto flex-1">
          <Table>
            <TableHeader className="bg-slate-50/70 dark:bg-zinc-900/50 border-b border-slate-200 dark:border-zinc-800">
              <TableRow className="hover:bg-transparent">
                {!isHistoryMode && (
                  <TableHead className="w-12 text-center py-3.5 pl-4">
                    <Checkbox
                      checked={
                        filteredRequests.length > 0 &&
                        filteredRequests.every((r) => selectedIds.includes(Number(r.id)))
                      }
                      onCheckedChange={(c) => handleSelectAll(!!c)}
                      aria-label="Select all"
                    />
                  </TableHead>
                )}
                <TableHead className="w-24 font-semibold text-slate-700 dark:text-zinc-300 text-xs uppercase tracking-wider py-3.5">
                  Request ID
                </TableHead>
                <TableHead className="font-semibold text-slate-700 dark:text-zinc-300 text-xs uppercase tracking-wider py-3.5">
                  Request Title
                </TableHead>
                <TableHead className="w-48 font-semibold text-slate-700 dark:text-zinc-300 text-xs uppercase tracking-wider">
                  Requester
                </TableHead>
                <TableHead className="w-40 font-semibold text-slate-700 dark:text-zinc-300 text-xs uppercase tracking-wider">
                  Department
                </TableHead>
                <TableHead className="w-28 font-semibold text-slate-700 dark:text-zinc-300 text-xs uppercase tracking-wider">
                  Priority
                </TableHead>
                {isHistoryMode && (
                  <TableHead className="w-36 font-semibold text-slate-700 dark:text-zinc-300 text-xs uppercase tracking-wider">
                    Status
                  </TableHead>
                )}
                <TableHead className="w-32 font-semibold text-slate-700 dark:text-zinc-300 text-xs uppercase tracking-wider text-right">
                  Amount
                </TableHead>
                <TableHead className="w-32 font-semibold text-slate-700 dark:text-zinc-300 text-xs uppercase tracking-wider">
                  Submitted
                </TableHead>
                <TableHead className="w-48 text-right font-semibold text-slate-700 dark:text-zinc-300 text-xs uppercase tracking-wider pr-5">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={isHistoryMode ? 8 : 9} className="py-4">
                      <div className="h-10 bg-slate-100 dark:bg-zinc-900 rounded-lg animate-pulse" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isHistoryMode ? 8 : 9} className="text-center py-16">
                    <div className="max-w-sm mx-auto flex flex-col items-center justify-center space-y-2 text-muted-foreground">
                      <div
                        className={`p-3.5 rounded-full mb-1 ${
                          isHistoryMode
                            ? "bg-slate-100 dark:bg-zinc-800 text-slate-500"
                            : "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600"
                        }`}
                      >
                        {isHistoryMode ? <History className="w-7 h-7" /> : <CheckCircle2 className="w-7 h-7" />}
                      </div>
                      <p className="text-base font-semibold text-slate-800 dark:text-zinc-200">
                        {isHistoryMode ? "No Approved History Found" : "All Caught Up!"}
                      </p>
                      <p className="text-xs text-muted-foreground text-center">
                        {isHistoryMode
                          ? "No purchase requests matching your search or filters have been approved yet."
                          : "You have no purchase requests currently pending your review or approval."}
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
                      onClick={() => setPreviewRequest(req)}
                      className={`cursor-pointer transition-colors hover:bg-slate-50/80 dark:hover:bg-zinc-900/60 ${
                        isChecked && !isHistoryMode ? "bg-indigo-50/40 dark:bg-indigo-950/20" : ""
                      }`}
                    >
                      {/* Checkbox */}
                      {!isHistoryMode && (
                        <TableCell className="text-center py-3 pl-4" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={() => handleToggleRow(idNum)}
                            aria-label={`Select request ${req.id}`}
                          />
                        </TableCell>
                      )}

                      {/* Request ID */}
                      <TableCell className="py-3">
                        <span className="font-mono text-slate-700 dark:text-zinc-300 font-bold bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md text-xs border border-slate-200 dark:border-zinc-700">
                          #{req.id}
                        </span>
                      </TableCell>

                      {/* Request Title & Details */}
                      <TableCell className="py-3">
                        <div className="space-y-1">
                          <div className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-zinc-100 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1.5 group">
                            <span>{req.title || `Purchase Request #${req.id}`}</span>
                            <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-indigo-500 shrink-0" />
                          </div>
                          {req.gl_code && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                              <span className="bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-600 dark:text-zinc-400">
                                GL: {req.gl_code}
                              </span>
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* Requester with Avatar */}
                      <TableCell className="py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-indigo-500 to-indigo-700 text-white font-bold text-[11px] flex items-center justify-center shrink-0 shadow-2xs">
                            {getInitials(req.requester)}
                          </div>
                          <span className="text-xs font-medium text-slate-800 dark:text-zinc-200 truncate">
                            {req.requester || "Unassigned"}
                          </span>
                        </div>
                      </TableCell>

                      {/* Department */}
                      <TableCell className="py-3">
                        <span className="text-xs text-slate-600 dark:text-zinc-400 font-medium">
                          {req.department || "General"}
                        </span>
                      </TableCell>

                      {/* Priority */}
                      <TableCell className="py-3">
                        <Badge
                          variant="outline"
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${priorityClass}`}
                        >
                          {req.priority || "MEDIUM"}
                        </Badge>
                      </TableCell>

                      {/* Status (History only) */}
                      {isHistoryMode && (
                        <TableCell className="py-3">
                          <Badge
                            variant="outline"
                            className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${getStatusBadge(req.status)}`}
                          >
                            {getStatusLabel(req.status)}
                          </Badge>
                        </TableCell>
                      )}

                      {/* Amount */}
                      <TableCell className="py-3 text-right font-mono font-bold text-xs sm:text-sm text-slate-900 dark:text-zinc-100">
                        {formatMoney(Number(req.amount) || 0)}
                      </TableCell>

                      {/* Date */}
                      <TableCell className="py-3 text-xs text-muted-foreground">
                        {formatDate(req.request_date)}
                      </TableCell>

                      {/* Action Buttons */}
                      <TableCell className="py-3 text-right pr-5" onClick={(e) => e.stopPropagation()}>
                        {isHistoryMode ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/purchasing/requests/${req.id}`, { state: { from: "/purchasing/my-approvals" } })}
                            className="h-8 px-3 text-xs text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View Record
                          </Button>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              onClick={() => handleSingleApprove(req)}
                              className="h-8 px-3 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs gap-1.5"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSingleReject(req)}
                              className="h-8 px-3 text-xs font-semibold border-rose-200 text-rose-700 hover:bg-rose-50 dark:border-rose-900/60 dark:hover:bg-rose-950/40 dark:text-rose-400 gap-1.5"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* ── Table Footer Summary ── */}
        <div className="p-3.5 border-t border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/30 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Showing <strong className="text-slate-900 dark:text-zinc-100">{filteredRequests.length}</strong> {isHistoryMode ? "approved history request(s)" : "pending request(s)"}
          </span>
          {!isHistoryMode && selectedIds.length > 0 && (
            <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
              {selectedIds.length} request(s) selected ({formatMoney(selectedTotalAmount)})
            </span>
          )}
        </div>
      </div>

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
      <Sheet open={!!previewRequest} onOpenChange={(open) => !open && setPreviewRequest(null)}>
        <SheetContent className="w-full sm:max-w-lg md:max-w-xl flex flex-col p-0 overflow-hidden bg-white dark:bg-zinc-950">
          {previewRequest && (
            <div className="flex flex-col h-full">
              {/* Drawer Header */}
              <div className="p-6 pb-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/50">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      Request #{previewRequest.id}
                    </span>
                    <SheetTitle className="text-lg font-bold text-slate-900 dark:text-zinc-100 mt-1">
                      {previewRequest.title || `Purchase Request #${previewRequest.id}`}
                    </SheetTitle>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-xs font-semibold px-2.5 py-0.5 border ${
                      PRIORITY_BADGE[previewRequest.priority as keyof typeof PRIORITY_BADGE] ||
                      PRIORITY_BADGE.MEDIUM
                    }`}
                  >
                    {previewRequest.priority || "MEDIUM"}
                  </Badge>
                </div>

                <div className="mt-4 p-3 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center justify-between shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-indigo-700 text-white font-bold text-xs flex items-center justify-center">
                      {getInitials(previewRequest.requester)}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-zinc-100">
                        {previewRequest.requester || "Unassigned"}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {previewRequest.department || "General Department"}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-muted-foreground block">Total Amount</span>
                    <span className="text-base font-bold font-mono text-slate-900 dark:text-zinc-100">
                      {formatMoney(Number(previewRequest.amount) || 0)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
                {/* Key Details Grid */}
                <div className="grid grid-cols-2 gap-3.5 p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/30">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Submission Date</span>
                    <span className="font-semibold text-slate-900 dark:text-zinc-100">
                      {formatDate(previewRequest.request_date)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Due Date</span>
                    <span className="font-semibold text-slate-900 dark:text-zinc-100">
                      {previewRequest.due_date ? formatDate(previewRequest.due_date) : "Immediate"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">GL Code</span>
                    <span className="font-semibold text-slate-900 dark:text-zinc-100">
                      {previewRequest.gl_code || "Not Assigned"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Current Status</span>
                    <span className="font-semibold text-slate-900 dark:text-zinc-100">
                      {getStatusLabel(previewRequest.status)}
                    </span>
                  </div>
                </div>

                {/* Description / Terms */}
                {previewRequest.description && (
                  <div className="space-y-1.5">
                    <span className="font-semibold text-slate-800 dark:text-zinc-200">
                      Description & Business Justification
                    </span>
                    <div className="p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/30 text-slate-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                      {previewRequest.description}
                    </div>
                  </div>
                )}
              </div>

              {/* Drawer Footer Actions */}
              <div className="p-4 border-t border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/50 flex items-center justify-between gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/purchasing/requests/${previewRequest.id}`, { state: { from: "/purchasing/my-approvals" } })}
                  className="text-xs gap-1.5"
                >
                  <span>Open Full Record</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Button>

                {!isHistoryMode && (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        handleSingleApprove(previewRequest);
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        handleSingleReject(previewRequest);
                      }}
                      className="border-rose-200 text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-400 font-semibold text-xs gap-1.5"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

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
