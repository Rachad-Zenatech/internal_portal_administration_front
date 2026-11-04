import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Building2,
  Check,
  Search,
  UserCheck,
  Loader2,
  AlertCircle,
  Sparkles,
  UserX,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import {
  getLevel1Candidates,
  reassignLevel1Approver,
} from "@/services/purchasingService";
import type {
  ApproverCandidateUser,
} from "@/services/purchasingService";
import type { PurchaseRequest, RequestDetail } from "@/types/purchasing";

interface ChangeLevel1ApproverModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: PurchaseRequest | RequestDetail | any;
  onSuccess?: (updated: RequestDetail) => void;
}

export function ChangeLevel1ApproverModal({
  open,
  onOpenChange,
  request,
  onSuccess,
}: ChangeLevel1ApproverModalProps) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [reason, setReason] = useState("");

  const reqObj: PurchaseRequest = useMemo(() => {
    if (request && "request" in request && request.request) {
      return request.request;
    }
    return request || ({} as any);
  }, [request]);

  const reqId = String(reqObj.id || "");
  const requestDept = (reqObj.department || "General").trim();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["level1Candidates", reqId],
    queryFn: () => getLevel1Candidates(reqId),
    enabled: open && Boolean(reqId),
  });

  // Unique list of approvers grouped by person
  const approversList: ApproverCandidateUser[] = useMemo(() => {
    if (data?.approvers && data.approvers.length > 0) {
      return data.approvers;
    }
    // Fallback if backend returned department_groups: aggregate by person
    if (data?.department_groups) {
      const userMap = new Map<string, ApproverCandidateUser>();
      for (const group of data.department_groups) {
        for (const appr of group.approvers) {
          if (!userMap.has(appr.id)) {
            userMap.set(appr.id, {
              ...appr,
              departments: [group.group_name || group.department],
            });
          } else {
            const existing = userMap.get(appr.id)!;
            const depts = existing.departments || [];
            const dName = group.group_name || group.department;
            if (!depts.includes(dName)) {
              depts.push(dName);
            }
            existing.departments = depts;
          }
        }
      }
      return Array.from(userMap.values()).sort((a, b) => {
        const aReq = a.departments?.some(
          (d) => d.toLowerCase() === requestDept.toLowerCase()
        );
        const bReq = b.departments?.some(
          (d) => d.toLowerCase() === requestDept.toLowerCase()
        );
        if (aReq && !bReq) return -1;
        if (!aReq && bReq) return 1;
        return (a.full_name || "").localeCompare(b.full_name || "");
      });
    }
    return data?.candidates || [];
  }, [data, requestDept]);

  // Set initial selected user to current approver or first department approver
  React.useEffect(() => {
    if (open && approversList.length > 0 && !selectedUserId) {
      const current = approversList.find(
        (c) => c.is_current_approver && !c.is_requester
      );
      if (current) {
        setSelectedUserId(current.id);
      } else {
        const firstDept = approversList.find(
          (c) => !c.is_requester && (c.is_request_department || c.is_department_approver)
        );
        if (firstDept) setSelectedUserId(firstDept.id);
      }
    }
  }, [open, approversList, selectedUserId]);

  const filteredApprovers = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return approversList;
    return approversList.filter((c) => {
      const nameMatch = c.full_name?.toLowerCase().includes(q);
      const emailMatch = c.email?.toLowerCase().includes(q);
      const deptMatch = c.department?.toLowerCase().includes(q);
      const titleMatch = c.job_title?.toLowerCase().includes(q);
      const assignedDeptsMatch = c.departments?.some((d) =>
        d.toLowerCase().includes(q)
      );
      return nameMatch || emailMatch || deptMatch || titleMatch || assignedDeptsMatch;
    });
  }, [approversList, searchTerm]);

  const reassignMutation = useMutation({
    mutationFn: async () => {
      if (!selectedUserId) throw new Error("Please select an approver");
      return await reassignLevel1Approver(reqId, selectedUserId, reason);
    },
    onSuccess: (updated) => {
      const targetUser = approversList.find((c) => c.id === selectedUserId);
      toast.success(
        `Level 1 Approver successfully updated to ${
          targetUser?.full_name || "new approver"
        }.`
      );
      queryClient.invalidateQueries({ queryKey: ["purchaseRequest", reqId] });
      queryClient.invalidateQueries({ queryKey: ["purchasingRequests"] });
      queryClient.invalidateQueries({ queryKey: ["myApprovals"] });
      onSuccess?.(updated);
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.detail ||
          err.message ||
          "Failed to update Level 1 approver."
      );
    },
  });

  const handleSelect = (cand: ApproverCandidateUser) => {
    if (cand.is_requester) return;
    setSelectedUserId(cand.id);
  };

  const selectedCandidate = useMemo(
    () => approversList.find((c) => c.id === selectedUserId),
    [approversList, selectedUserId]
  );

  const isCurrentSelected = Boolean(
    selectedCandidate && selectedCandidate.id === data?.current_approver_id
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl sm:max-w-3xl md:max-w-4xl lg:max-w-4xl w-[95vw] p-0 gap-0 overflow-hidden bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl">
        {/* Header */}
        <DialogHeader className="p-5 pb-4 border-b border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/40">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/60 shadow-xs">
                <UserCheck className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                  <span>Change Level 1 Approver</span>
                  <Badge
                    variant="outline"
                    className="text-[10px] font-mono px-1.5 py-0 bg-white dark:bg-zinc-900"
                  >
                    REQ #{reqObj.id}
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5 flex items-center gap-1.5">
                  <span>
                    Reassign the Level 1 Department approver for &quot;
                    {reqObj.title || "Purchase Request"}&quot;
                  </span>
                  <span className="font-semibold text-slate-700 dark:text-zinc-300">
                    ({requestDept})
                  </span>
                </DialogDescription>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-xs">
              <span className="text-slate-400 text-[11px]">Current Level 1:</span>
              <Badge
                variant="secondary"
                className="font-medium text-xs px-2.5 py-0.5 bg-slate-200/80 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200"
              >
                {reqObj.level_1_approver_name ||
                  reqObj.assigned_user ||
                  "Unassigned"}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        {/* Content Body */}
        <div className="p-5 space-y-4 max-h-[68vh] overflow-y-auto">
          {/* Search Bar */}
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by approver name, email, or department name..."
              className="pl-9 text-xs h-9 bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800"
            />
          </div>

          {/* Loading / Error States */}
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-2.5 text-xs text-slate-400">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
              <span className="font-medium">
                Loading Level 1 Department Approvers...
              </span>
            </div>
          ) : isError ? (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2.5 border border-rose-200 dark:border-rose-900">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>
                Failed to load department approvers. Please refresh or try again.
              </span>
            </div>
          ) : filteredApprovers.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 bg-slate-50 dark:bg-zinc-900/40 rounded-xl border border-dashed border-slate-200 dark:border-zinc-800">
              No Level 1 Department Approvers found matching &quot;{searchTerm}&quot;.
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredApprovers.map((cand) => {
                const isSelected = cand.id === selectedUserId;
                const isCurrent = cand.id === data?.current_approver_id;
                const isReq = cand.is_requester;
                const depts = cand.departments || (cand.department ? [cand.department] : []);
                const matchesReqDept =
                  cand.is_request_department ||
                  depts.some((d) => d.toLowerCase() === requestDept.toLowerCase());

                return (
                  <div
                    key={cand.id}
                    onClick={() => !isReq && handleSelect(cand)}
                    className={`group relative p-3.5 rounded-xl border transition-all select-none flex flex-col justify-between gap-2.5 ${
                      isReq
                        ? "bg-slate-50/60 dark:bg-zinc-900/30 border-slate-200 dark:border-zinc-800 opacity-60 cursor-not-allowed"
                        : isSelected
                        ? "bg-indigo-50/90 dark:bg-indigo-950/60 border-indigo-400 dark:border-indigo-600 shadow-sm ring-2 ring-indigo-500/80 cursor-pointer"
                        : matchesReqDept
                        ? "bg-indigo-50/30 dark:bg-indigo-950/20 border-indigo-200/80 dark:border-indigo-900/50 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-xs cursor-pointer"
                        : "bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 hover:border-indigo-300 dark:hover:border-indigo-800 hover:shadow-xs cursor-pointer"
                    }`}
                  >
                    {/* Top Row: Avatar + Name/Email + Selection Radio */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 transition-colors ${
                            isSelected
                              ? "bg-indigo-600 text-white shadow-xs"
                              : matchesReqDept
                              ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                              : "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-300"
                          }`}
                        >
                          {cand.full_name?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2 flex-wrap">
                            <span className="truncate">{cand.full_name}</span>
                            {matchesReqDept && (
                              <Badge
                                variant="secondary"
                                className="text-[9px] px-1.5 py-0 bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 flex items-center gap-1 font-semibold"
                              >
                                <Sparkles className="h-2.5 w-2.5" /> Request Approver
                              </Badge>
                            )}
                            {isCurrent && (
                              <Badge
                                variant="outline"
                                className="text-[9px] px-1.5 py-0 text-slate-600 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800 font-medium"
                              >
                                Current Level 1
                              </Badge>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-zinc-400 flex items-center gap-1.5 truncate mt-0.5">
                            <span>{cand.email}</span>
                            {cand.job_title && (
                              <span>• {cand.job_title}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center pt-0.5">
                        {isReq ? (
                          <Badge
                            variant="outline"
                            className="text-[9px] px-1.5 py-0 text-rose-600 bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900 flex items-center gap-0.5"
                          >
                            <UserX className="h-2.5 w-2.5" /> Requester
                          </Badge>
                        ) : isSelected ? (
                          <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                            <Check className="h-3 w-3 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border border-slate-300 dark:border-zinc-700 group-hover:border-indigo-400 transition-colors" />
                        )}
                      </div>
                    </div>

                    {/* Bottom Row: All Departments Under This Person */}
                    {depts.length > 0 && (
                      <div className="pt-2 border-t border-slate-100 dark:border-zinc-800/80 flex items-start gap-2 text-[11px]">
                        <div className="flex items-center gap-1 text-slate-400 dark:text-zinc-500 shrink-0 text-[10px] font-medium mt-0.5">
                          <Building2 className="h-3.5 w-3.5" />
                          <span>Approver for ({depts.length}):</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 min-w-0">
                          {depts.map((dName, idx) => {
                            const isReqMatch =
                              dName.toLowerCase() === requestDept.toLowerCase();
                            return (
                              <Badge
                                key={idx}
                                variant={isReqMatch ? "default" : "outline"}
                                className={`text-[10px] px-2 py-0 font-normal transition-colors ${
                                  isReqMatch
                                    ? "bg-indigo-600 text-white font-medium border-indigo-600 shadow-2xs"
                                    : "bg-slate-50 dark:bg-zinc-900/60 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-800"
                                }`}
                              >
                                {dName}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Selected Approver Confirmation Preview */}
          {selectedCandidate && (
            <div className="p-3.5 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <span>Selected New Level 1 Approver:</span>
                    <strong className="text-indigo-700 dark:text-indigo-300 font-bold">
                      {selectedCandidate.full_name}
                    </strong>
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-zinc-400 truncate">
                    {selectedCandidate.email}{" "}
                    {selectedCandidate.department
                      ? `• ${selectedCandidate.department}`
                      : ""}
                  </div>
                </div>
              </div>

              <Badge
                variant="outline"
                className="text-[10px] self-start sm:self-auto bg-white dark:bg-zinc-900 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 font-medium"
              >
                {isCurrentSelected ? "Current Approver" : "Will receive approval task"}
              </Badge>
            </div>
          )}

          {/* Reason (Optional) */}
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center justify-between">
              <span>Reason / Note (Optional)</span>
              <span className="text-[10px] text-slate-400 font-normal">
                Recorded in audit log &amp; task history
              </span>
            </label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Primary department approver is on PTO; routing to alternate department approver..."
              rows={2}
              className="text-xs resize-none bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800"
            />
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="p-4 border-t border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/40 flex items-center justify-between gap-2 sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={reassignMutation.isPending}
            className="text-xs text-slate-600 dark:text-zinc-400"
          >
            Cancel
          </Button>

          <Button
            type="button"
            size="sm"
            disabled={
              !selectedUserId || reassignMutation.isPending || isCurrentSelected
            }
            onClick={() => reassignMutation.mutate()}
            className="text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 shadow-xs px-4"
          >
            {reassignMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <ArrowRight className="h-3.5 w-3.5" />
            )}
            <span>
              {isCurrentSelected ? "Already Assigned" : "Confirm & Reassign Approver"}
            </span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ChangeLevel1ApproverModal;
