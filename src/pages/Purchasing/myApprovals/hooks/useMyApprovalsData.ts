import { useState, useMemo, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { apiClient } from "@/services/apiClient";
import { useGLCodes } from "@/hooks/usePurchasing";
import type { PurchaseRequest, RequestDetail } from "@/types/purchasing";
import { toast } from "sonner";

export function useMyApprovalsData() {
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
  const { data: glCodes = [] } = useGLCodes();
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
    const cleanId = q.replace(/^(?:req-#|req-|rec-#|rec-|#)/i, "").trim();

    return result.filter(
      (r) =>
        r.id.toString().includes(q) ||
        (cleanId.length > 0 && r.id.toString().includes(cleanId)) ||
        (r.title || "").toLowerCase().includes(q) ||
        (r.requester || "").toLowerCase().includes(q) ||
        (r.department || "").toLowerCase().includes(q) ||
        (r.assigned_user || "").toLowerCase().includes(q) ||
        (r.description || "").toLowerCase().includes(q) ||
        (r.gl_code || "").toLowerCase().includes(q) ||
        (r.status || "").toLowerCase().includes(q) ||
        String(r.amount || "").includes(q)
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
  return { navigate, selectedIds, setSelectedIds, searchTerm, setSearchTerm, priorityFilter, setPriorityFilter, cardFilter, setCardFilter, isApproveOpen, setIsApproveOpen, isRejectOpen, setIsRejectOpen, actionComment, setActionComment, previewRequest, setPreviewRequest, glCodes, kpiRef, isHistoryMode, isLoading, isRefetching, handleRefresh, approveMutation, rejectMutation, metrics, filteredRequests, selectedTotalAmount, handleSelectAll, handleToggleRow, handleSingleApprove, handleSingleReject };
}
