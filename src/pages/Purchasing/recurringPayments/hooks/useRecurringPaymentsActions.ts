import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import { apiClient } from "@/services/apiClient";
import { type PurchaseRequest, type RequestDetail, type CustomScheduleDate, type WireTransferInput } from "@/types/purchasing";
import { useAuth } from "@/lib/AuthContext";
import { useUsersList, useRolesList } from "@/hooks/usePurchasing";
import { resolveUserDepartment } from "@/lib/userDepartment";
import { toast } from "sonner";
import { getRequest, updateWireTransfer as updateWireTransferApi } from "@/services/purchasingService";
import { formatDateToIso, type FrequencyType } from "../../utils/recurringScheduleUtils";

export function useRecurringPaymentsActions() {
  const kpiRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { id: routeRequestId } = useParams<{ id?: string }>();
  const queryClient = useQueryClient();
  const { roles: userRoles, hasRole, hasPermission, canAccessNavigationItem, user } = useAuth();
  const { data: usersList = [] } = useUsersList();
  const { data: rolesList = [] } = useRolesList();
  // Role check: Only TREASURY, AP, and SUPER_ADMIN
  const isSuperAdmin = hasRole("SUPER_ADMIN") || user?.is_super_admin;
  const isAP =
    userRoles.some((r) => {
      const c = (r.code || "").toUpperCase();
      const n = (r.name || "").toUpperCase();
      return (
        c.includes("AP") ||
        c.includes("PAY") ||
        n.includes("AP") ||
        n.includes("PAY")
      );
    }) ||
    hasRole("ACCTS_PAY") ||
    hasRole("AP");
  const isTreasury = userRoles.some((r) => {
    const c = (r.code || "").toUpperCase();
    const n = (r.name || "").toUpperCase();
    return c.includes("TREASURY") || n.includes("TREASURY");
  });
  const hasRecurringPermission =
    hasPermission("RECURRING_PAYMENTS_READ") ||
    hasPermission("RECURRING_PAYMENTS_VIEW") ||
    hasPermission("RECURRING_PAYMENTS_UPDATE") ||
    hasPermission("SCHEDULED_PAYMENTS_READ") ||
    hasPermission("SCHEDULED_PAYMENTS_VIEW") ||
    hasPermission("SCHEDULED_PAYMENTS_UPDATE") ||
    hasPermission("SCHEDULED_PAYMENTS_CREATE") ||
    hasPermission("SCHEDULED_PAYMENTS_MANAGE") ||
    hasPermission("SCHEDULED_PAYMENTS") ||
    (canAccessNavigationItem ? canAccessNavigationItem("SCHEDULED_PAYMENTS") : false) ||
    (canAccessNavigationItem ? canAccessNavigationItem("RECURRING_PAYMENTS") : false);
  const canManageRecurring = isSuperAdmin || isAP || isTreasury || hasRecurringPermission;
  // Purchase requesters get a read-only view; the backend scopes the list to their own requests.
  const isRequesterView = !canManageRecurring && hasPermission("PURCHASING_READ");
  const canAccess = canManageRecurring || isRequesterView;
  const canCreateRecurring = canManageRecurring || hasPermission("PURCHASING_CREATE");
  const [viewMode, setViewMode] = useState<"table" | "calendar" | "master">("table");
  const [searchTerm, setSearchTerm] = useState("");
  const [dueFilter, setDueFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  const [reviewFilter, setReviewFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchParams, setSearchParams] = useSearchParams();
  const initialFilter = searchParams.get("filter")?.toUpperCase() || "ALL";
  const [cardFilter, setCardFilter] = useState<string>(initialFilter);
  useEffect(() => {
    const f = searchParams.get("filter")?.toUpperCase() || "ALL";
    setCardFilter(f);
  }, [searchParams]);
  const handleCardFilterChange = (newFilter: string) => {
    setCardFilter(newFilter);
    if (newFilter === "ALL") {
      searchParams.delete("filter");
    } else {
      searchParams.set("filter", newFilter);
    }
    setSearchParams(searchParams, { replace: true });
  };
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [scheduleModalRequest, setScheduleModalRequest] = useState<PurchaseRequest | null>(null);
  const [wireModalRequest, setWireModalRequest] = useState<PurchaseRequest | null>(null);
  const [isUpdatingWire, setIsUpdatingWire] = useState(false);
  const [selectedCalendarInstallment, setSelectedCalendarInstallment] = useState<{
    installmentNumber?: number;
    totalInstallments?: number;
    amount?: number;
    currency?: string;
    dueDate?: string;
    isProjected?: boolean;
    isPaid?: boolean;
  } | null>(null);
  const handleOpenWireModal = async (req: PurchaseRequest, directWire?: any) => {
    const existingWire = directWire || (req as any)?.wire_transfer;
    if (existingWire) {
      setWireModalRequest({ ...req, wire_transfer: existingWire } as any);
      return;
    }
    try {
      const fullReq = await getRequest(req.id);
      if (fullReq?.wire_transfer) {
        setWireModalRequest({ ...req, wire_transfer: fullReq.wire_transfer } as any);
        return;
      }
    } catch (err) {
      console.warn("Could not fetch full wire info for request:", err);
    }
    setWireModalRequest(req);
  };
  const handleSaveWire = async (data: WireTransferInput) => {
    if (!wireModalRequest) return;
    try {
      setIsUpdatingWire(true);
      await updateWireTransferApi(wireModalRequest.id, data);
      toast.success("Wire transfer details saved successfully");
      setWireModalRequest(null);
      queryClient.invalidateQueries({ queryKey: ["recurring-requests"] });
      queryClient.invalidateQueries({ queryKey: ["purchasing"] });
      refetchRequests();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update wire transfer details");
    } finally {
      setIsUpdatingWire(false);
    }
  };
  const [editingRequest, setEditingRequest] = useState<PurchaseRequest | null>(null);
  const [selectedCalendarItem, setSelectedCalendarItem] =
    useState<PurchaseRequest | null>(null);
  // Calendar month state
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  useEffect(() => {
    let subTitle: string | undefined;
    if (viewMode === "calendar") {
      subTitle = "Calendar View";
    } else if (cardFilter === "PURCHASE_REQUESTS" || cardFilter === "REQUESTS") {
      subTitle = "Purchase Requests";
    } else if (cardFilter === "AP" || cardFilter === "ACCOUNTS_PAYABLE") {
      subTitle = "A/P (Accounts Payable)";
    } else if (cardFilter === "MA_SCHEDULED" || cardFilter === "SCHEDULED") {
      subTitle = "M&A Scheduled Payments";
    } else if (cardFilter === "DUE_SOON" || cardFilter === "AP_DUE_SOON") {
      subTitle = "A/P - Due in 7 Days";
    } else if (cardFilter === "PR_DUE_SOON") {
      subTitle = "Purchase Requests - Due in 7 Days";
    } else if (cardFilter === "ALL_DUE_SOON") {
      subTitle = "Due in 7 Days";
    } else if (cardFilter === "WAITING_REVIEW") {
      subTitle = "Waiting for Review";
    } else if (cardFilter === "PR_WAITING_REVIEW") {
      subTitle = "Purchase Requests - Waiting for Review";
    } else if (cardFilter === "AP_WAITING_REVIEW") {
      subTitle = "A/P - Waiting for Review";
    } else if (cardFilter === "REVIEWED") {
      subTitle = "Reviewed (AP)";
    } else if (cardFilter === "PR_REVIEWED") {
      subTitle = "Purchase Requests - Reviewed (AP)";
    } else if (cardFilter === "AP_REVIEWED") {
      subTitle = "A/P - Reviewed (AP)";
    } else if (cardFilter === "ON_HOLD") {
      subTitle = "On Hold";
    } else if (cardFilter === "COMPLETED") {
      subTitle = "Completed";
    } else if (cardFilter === "PR_COMPLETED") {
      subTitle = "Purchase Requests - Completed";
    } else if (cardFilter === "AP_COMPLETED") {
      subTitle = "A/P - Completed";
    } else if (cardFilter === "PR_ON_HOLD") {
      subTitle = "Purchase Requests - On Hold";
    } else if (cardFilter === "AP_ON_HOLD") {
      subTitle = "A/P - On Hold";
    } else if (cardFilter === "PR_REJECTED") {
      subTitle = "Purchase Requests - Rejected";
    } else if (cardFilter === "AP_REJECTED") {
      subTitle = "A/P - Rejected";
    } else if (cardFilter === "REJECTED") {
      subTitle = "Rejected";
    }

    document.dispatchEvent(
      new CustomEvent("set-breadcrumb-trail", {
        detail: {
          path: window.location.pathname,
          items: [
            { title: "Recurring Payments", path: subTitle ? "/purchasing/recurring" : undefined },
            ...(subTitle ? [{ title: subTitle }] : []),
          ],
        },
      })
    );
  }, [cardFilter, viewMode]);
  // Fetch all RECURRING requests with live polling
  const { data: requests = [], isLoading, refetch: refetchRequests } = useQuery<PurchaseRequest[]>({
    queryKey: ["recurring-requests"],
    queryFn: async () => {
      return await apiClient.get<PurchaseRequest[]>(
        "/api/purchasing/requests?request_type=RECURRING,SCHEDULED_PAYMENT,WIRE_RECURRING"
      );
    },
    enabled: !!canAccess,
    refetchOnWindowFocus: true,
    refetchInterval: 10000,
    staleTime: 5000,
  });
  // Toggle review status mutation
  const reviewMutation = useMutation({
    mutationFn: async ({
      id,
      review_status,
    }: {
      id: string;
      review_status: string;
    }) => {
      return await apiClient.patch<RequestDetail>(
        `/api/purchasing/requests/${id}/review-status`,
        { review_status }
      );
    },
    onSuccess: (_, variables) => {
      // Optimistically update query cache immediately
      queryClient.setQueryData<PurchaseRequest[]>(["recurring-requests"], (old = []) =>
        old.map((item) =>
          String(item.id) === String(variables.id)
            ? { ...item, review_status: variables.review_status as any }
            : item
        )
      );
      toast.success(
        `Request #${variables.id} marked as ${variables.review_status === "REVIEWED" ? "Reviewed" : "Waiting for Review"
        }`
      );
      queryClient.invalidateQueries({ queryKey: ["recurring-requests"] });
      queryClient.invalidateQueries({ queryKey: ["purchasing"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to update review status");
    },
  });
  // Helper to generate default schedule starting from a base date
  const getInitialDefaultSchedule = (baseDate?: string) => {
    const sDate = baseDate || new Date().toISOString().split("T")[0];
    const nextMonth = new Date(sDate + "T00:00:00");
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const nextMonthIso = formatDateToIso(nextMonth);
    return {
      is_scheduled: false,
      frequency: "MONTHLY" as FrequencyType,
      start_date: sDate,
      end_date: nextMonthIso,
      schedule_dates: [] as CustomScheduleDate[],
    };
  };
  // Create recurring request state
  const initialSchedule = getInitialDefaultSchedule();
  const [newForm, setNewForm] = useState({
    title: "",
    requester: "",
    department: "",
    class: "",
    location: "",
    amount: "",
    currency: "USD",
    due_date: initialSchedule.start_date,
    description: "",
    item_url: "",
    gl_code: "",
    priority: "MEDIUM",
    is_scheduled: false,
    payment_domain: "PURCHASE_REQUEST" as "PURCHASE_REQUEST" | "AP",
    frequency: "MONTHLY" as FrequencyType,
    start_date: initialSchedule.start_date,
    end_date: initialSchedule.end_date,
    schedule_dates: [] as CustomScheduleDate[],
  });
  // Edit recurring request form state
  const [editForm, setEditForm] = useState({
    id: "",
    title: "",
    requester: "",
    department: "",
    class: "",
    location: "",
    amount: "",
    currency: "USD",
    due_date: "",
    description: "",
    item_url: "",
    gl_code: "",
    priority: "MEDIUM",
    is_scheduled: false,
    payment_domain: "PURCHASE_REQUEST" as "PURCHASE_REQUEST" | "AP",
    frequency: "MONTHLY" as FrequencyType,
    start_date: "",
    end_date: "",
    completed_installments: 0,
    schedule_dates: [] as CustomScheduleDate[],
  });
  const handleOpenCreate = () => {
    const displayName = user?.full_name || user?.email || "";
    const matchedUser = usersList.find(
      (u) =>
        (u.full_name && u.full_name.toLowerCase() === displayName.toLowerCase()) ||
        (u.email && u.email.toLowerCase() === displayName.toLowerCase())
    );
    const defaultDept = (matchedUser?.department && matchedUser.department.trim() && matchedUser.department.toUpperCase() !== "REQUESTER")
      ? matchedUser.department.trim()
      : (matchedUser
        ? resolveUserDepartment(matchedUser, rolesList)
        : ((user?.department && user.department.trim() && user.department.toUpperCase() !== "REQUESTER") ? user.department.trim() : resolveUserDepartment(user, rolesList)));

    const todayIso = new Date().toISOString().split("T")[0];
    const sched = getInitialDefaultSchedule(todayIso);
    const defaultDomain: "PURCHASE_REQUEST" | "AP" =
      cardFilter === "AP" || cardFilter === "ACCOUNTS_PAYABLE" || cardFilter === "DUE_SOON" || cardFilter.startsWith("AP_")
        ? "AP"
        : "PURCHASE_REQUEST";
    setNewForm({
      title: "",
      requester: displayName,
      department: defaultDept,
      class: "",
      location: "",
      amount: "",
      currency: "USD",
      due_date: todayIso,
      description: "",
      item_url: "",
      gl_code: "",
      priority: "MEDIUM",
      is_scheduled: false,
      payment_domain: defaultDomain,
      frequency: "MONTHLY",
      start_date: sched.start_date,
      end_date: sched.end_date,
      schedule_dates: [] as CustomScheduleDate[],
    });
    setIsCreateOpen(true);
  };
  useEffect(() => {
    if (searchParams.get("create") === "true" || searchParams.get("new") === "true") {
      handleOpenCreate();
      const updatedParams = new URLSearchParams(searchParams);
      updatedParams.delete("create");
      updatedParams.delete("new");
      setSearchParams(updatedParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);
  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      return await apiClient.post<RequestDetail>(
        "/api/purchasing/requests",
        payload
      );
    },
    onSuccess: (res) => {
      toast.success(`Recurring request #${res.request.id} created successfully`);
      setIsCreateOpen(false);
      const todayIso = new Date().toISOString().split("T")[0];
      const sched = getInitialDefaultSchedule(todayIso);
      setNewForm({
        title: "",
        requester: "",
        department: "",
        class: "",
        location: "",
        amount: "",
        currency: "USD",
        due_date: todayIso,
        description: "",
        item_url: "",
        gl_code: "",
        priority: "MEDIUM",
        is_scheduled: false,
        payment_domain: "PURCHASE_REQUEST",
        frequency: "MONTHLY",
        start_date: sched.start_date,
        end_date: sched.end_date,
        schedule_dates: [] as CustomScheduleDate[],
      });
      queryClient.invalidateQueries({ queryKey: ["recurring-requests"] });
      queryClient.invalidateQueries({ queryKey: ["purchasing"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to create recurring request");
    },
  });
  return { kpiRef, navigate, routeRequestId, queryClient, usersList, rolesList, isSuperAdmin, isAP, canManageRecurring, canAccess, canCreateRecurring, viewMode, setViewMode, searchTerm, setSearchTerm, dueFilter, setDueFilter, priorityFilter, setPriorityFilter, reviewFilter, setReviewFilter, statusFilter, setStatusFilter, cardFilter, handleCardFilterChange, isCreateOpen, setIsCreateOpen, isEditOpen, setIsEditOpen, scheduleModalRequest, setScheduleModalRequest, wireModalRequest, setWireModalRequest, isUpdatingWire, selectedCalendarInstallment, setSelectedCalendarInstallment, handleOpenWireModal, handleSaveWire, editingRequest, setEditingRequest, selectedCalendarItem, setSelectedCalendarItem, currentCalendarDate, setCurrentCalendarDate, requests, isLoading, reviewMutation, newForm, setNewForm, editForm, setEditForm, handleOpenCreate, createMutation };
}
