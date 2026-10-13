import { PageConnectionBanner } from "@/components/ui/PageConnectionBanner";
import { FloatingVerticalFilter } from "@/components/ui/FloatingVerticalFilter";
import { ScheduleDatesBuilder } from "./ScheduleDatesBuilder";
import PrioritySelector from "./PrioritySelector";
import LocationAutocomplete from "./LocationAutocomplete";
import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import { apiClient } from "@/services/apiClient";
import {
  RequestStatus,
  type PurchaseRequest,
  type RequestDetail,
  type CustomScheduleDate,
  type Priority,
  type WireTransferInput,
} from "@/types/purchasing";
import { parseRequestStatus } from "@/lib/requestStatus";
import {
  formatDate,
  formatMoney,
  getStatusBadge,
  getStatusLabel,
  PRIORITY_BADGE,
} from "./purchasingMeta";
import { useAuth } from "@/lib/AuthContext";
import { useUsersList, useRolesList } from "@/hooks/usePurchasing";
import { resolveUserDepartment } from "@/lib/userDepartment";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Calendar as CalendarIcon,
  CalendarClock,
  Table as TableIcon,
  Plus,
  AlertTriangle,
  Search,
  CheckCircle2,
  Clock,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Edit2,
  Trash2,
  XCircle,
  Layers,
  PauseCircle,
  Landmark,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { deletePurchaseRequest, updateWireTransfer as updateWireTransferApi } from "@/services/purchasingService";
import {
  formatRemainingDuration,
  calculateInstallmentsCount,
  generatePaymentSchedule,
  getRecurringAmounts,
  formatDateToIso,
  type FrequencyType,
} from "./recurringScheduleUtils";
import { ScheduleBreakdownModal } from "./ScheduleBreakdownModal";
import { WireTransferDialog } from "./WireTransferDialog";
import { MasterTransactionsTable } from "./MasterTransactionsTable";


interface CalendarCell {
  day: number;
  isCurrentMonth: boolean;
  dateStr: string;
}

function RequesterAutocomplete({
  value,
  onChange,
  onSelectUser,
  users = [],
  roles = [],
  label = "Requester",
  required = false,
}: {
  value: string;
  onChange: (val: string) => void;
  onSelectUser?: (user: any) => void;
  users: Array<{ id: string; full_name?: string; email?: string; department?: string; [key: string]: any }>;
  roles?: any[];
  label?: string;
  required?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredUsers = useMemo(() => {
    const activeUsers = users.filter((u) => u.is_active !== false);
    const q = (value || "").toLowerCase().trim();
    if (!q) return activeUsers.slice(0, 10);
    return activeUsers
      .filter((u) => {
        const name = (u.full_name || "").toLowerCase();
        const email = (u.email || "").toLowerCase();
        const dept = resolveUserDepartment(u, roles).toLowerCase();
        return name.includes(q) || email.includes(q) || dept.includes(q);
      })
      .slice(0, 10);
  }, [value, users, roles]);

  return (
    <div ref={containerRef} className="relative space-y-1.5">
      {label && (
        <label className="text-sm font-medium">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        <Input
          value={value}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          placeholder="Search requester (e.g. Rachad, Rachel)..."
          className="w-full"
          required
        />
        {isOpen && filteredUsers.length > 0 && (
          <div className="absolute z-50 left-0 mt-1.5 w-full max-h-60 overflow-y-auto overflow-x-hidden bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg shadow-xl py-1 text-sm divide-y divide-slate-100 dark:divide-zinc-800/60">
            {filteredUsers.map((u) => {
              const displayName = u.full_name || u.email || "Unknown User";
              const email = u.email;
              const dept = (u.department && u.department.trim() && u.department.toUpperCase() !== "REQUESTER") ? u.department.trim() : resolveUserDepartment(u, roles);

              return (
                <div
                  key={u.id}
                  className="px-3.5 py-2.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-800/80 flex flex-col gap-0.5 transition-colors text-left"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onChange(displayName);
                    if (onSelectUser) {
                      onSelectUser(u);
                    }
                    setIsOpen(false);
                  }}
                >
                  <div className="font-semibold text-slate-900 dark:text-zinc-100 text-sm leading-snug">
                    {displayName}
                  </div>
                  {email && (
                    <div className="text-xs text-slate-500 dark:text-zinc-400 truncate leading-snug">
                      {email}
                    </div>
                  )}
                  {dept ? (
                    <div className="text-[11px] font-medium text-slate-600 dark:text-zinc-400 flex items-center gap-1 mt-0.5">
                      <span className="text-slate-400 dark:text-zinc-500 font-normal">Dept:</span>
                      <span className="text-indigo-600 dark:text-indigo-400">{dept}</span>
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-400 dark:text-zinc-500 italic mt-0.5">
                      No department
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function getDueStatus(dateStr?: string | null, status?: string) {
  if (!dateStr || status === "COMPLETED" || status === "REJECTED") return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) {
    return { label: `Overdue (${Math.abs(diffDays)}d)`, variant: "destructive" as const, className: "", isUrgent: true };
  } else if (diffDays === 0) {
    return { label: "Due Today", variant: "default" as const, className: "bg-rose-600 hover:bg-rose-700 text-white font-bold", isUrgent: true };
  } else if (diffDays === 1) {
    return { label: "Due Tomorrow", variant: "default" as const, className: "bg-amber-600 hover:bg-amber-700 text-white font-semibold", isUrgent: true };
  } else if (diffDays <= 7) {
    return { label: `Due in ${diffDays}d`, variant: "outline" as const, className: "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800 font-medium", isUrgent: true };
  }
  return null;
}

export default function RecurringPayments() {
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
    } else if (cardFilter === "MA_SCHEDULED" || cardFilter === "SCHEDULED") {
      subTitle = "M&A Scheduled Payments";
    } else if (cardFilter === "DUE_SOON") {
      subTitle = "Due in 7 Days";
    } else if (cardFilter === "WAITING_REVIEW") {
      subTitle = "Waiting for Review";
    } else if (cardFilter === "REVIEWED") {
      subTitle = "Reviewed (AP)";
    } else if (cardFilter === "ON_HOLD") {
      subTitle = "On Hold";
    } else if (cardFilter === "COMPLETED") {
      subTitle = "Completed";
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
        "/api/purchasing/requests?request_type=RECURRING,SCHEDULED_PAYMENT"
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
        `Request #${variables.id} marked as ${
          variables.review_status === "REVIEWED" ? "Reviewed" : "Waiting for Review"
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
    due_date: initialSchedule.start_date,
    description: "",
    item_url: "",
    gl_code: "",
    priority: "MEDIUM",
    is_scheduled: false,
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
    due_date: "",
    description: "",
    item_url: "",
    gl_code: "",
    priority: "MEDIUM",
    is_scheduled: false,
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
    setNewForm({
      title: "",
      requester: displayName,
      department: defaultDept,
      class: "",
      location: "",
      amount: "",
      due_date: todayIso,
      description: "",
      item_url: "",
      gl_code: "",
      priority: "MEDIUM",
      is_scheduled: false,
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
        due_date: todayIso,
        description: "",
        item_url: "",
        gl_code: "",
        priority: "MEDIUM",
        is_scheduled: false,
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

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      return await apiClient.put<RequestDetail>(
        `/api/purchasing/requests/${id}`,
        payload
      );
    },
    onSuccess: (res) => {
      toast.success(`Recurring request #${res.request.id} updated successfully`);
      handleCloseEdit();
      queryClient.invalidateQueries({ queryKey: ["recurring-requests"] });
      queryClient.invalidateQueries({ queryKey: ["purchasing"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to update recurring request");
    },
  });

  const [requestToDelete, setRequestToDelete] = useState<PurchaseRequest | null>(null);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await deletePurchaseRequest(id);
    },
    onSuccess: () => {
      toast.success("Recurring payment deleted successfully");
      setRequestToDelete(null);
      queryClient.invalidateQueries({ queryKey: ["recurring-requests"] });
      queryClient.invalidateQueries({ queryKey: ["purchasing"] });
      queryClient.invalidateQueries({ queryKey: ["purchasing", "requests"] });
      queryClient.invalidateQueries({ queryKey: ["purchasing-summary"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to delete recurring payment");
    },
  });

  const handleCloseEdit = () => {
    setIsEditOpen(false);
    setEditingRequest(null);
    if (routeRequestId) {
      navigate("/purchasing/recurring", { replace: true });
    }
  };

  const handleOpenEdit = (req: PurchaseRequest) => {
    setEditingRequest(req);
    let dept = req.department || "";
    if (!dept || dept === "General") {
      const matched = usersList.find(
        (u) =>
          (u.full_name && u.full_name.toLowerCase() === (req.requester || "").toLowerCase()) ||
          (u.email && u.email.toLowerCase() === (req.requester || "").toLowerCase())
      );
      if (matched) {
        dept = resolveUserDepartment(matched, rolesList);
      }
    }
    const sched = req.recurring_schedule;
    const isSched = Boolean(sched?.is_scheduled);
    let schedDates: CustomScheduleDate[] = [];
    if (sched?.schedule_dates && sched.schedule_dates.length > 0) {
      schedDates = sched.schedule_dates;
    } else if (sched?.custom_dates && sched.custom_dates.length > 0) {
      schedDates = sched.custom_dates.map((d: string, i: number) => ({
        date: d,
        amount: sched?.amount_per_cycle || req.amount,
        note: `Installment #${i + 1}`,
      }));
    } else if (isSched) {
      const baseDate = sched?.start_date ? sched.start_date.split("T")[0] : (req.due_date ? req.due_date.split("T")[0] : new Date().toISOString().split("T")[0]);
      const nextMonth = new Date(baseDate + "T00:00:00");
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      const nextMonthIso = formatDateToIso(nextMonth);
      schedDates = [
        { date: baseDate, amount: req.amount || undefined, note: "Installment #1" },
        { date: nextMonthIso, amount: req.amount || undefined, note: "Installment #2" },
      ];
    }
    const reqLoc = (req as any).location || (req as any).from_location || req.quote_data?.location || req.quote_data?.shipped_to_location || "";
    const reqClass = (req as any).class || req.quote_data?.class || "";
    setEditForm({
      id: req.id,
      title: req.title || "",
      requester: req.requester || "",
      department: dept,
      class: reqClass,
      location: reqLoc,
      amount: req.amount ? req.amount.toString() : "",
      due_date: req.due_date ? req.due_date.split("T")[0] : "",
      description: req.description || "",
      item_url: req.item_url || "",
      gl_code: req.gl_code || "",
      priority: req.priority || "MEDIUM",
      is_scheduled: isSched,
      frequency: (sched?.frequency as FrequencyType) || (isSched ? "CUSTOM" : "MONTHLY"),
      start_date: sched?.start_date ? sched.start_date.split("T")[0] : (schedDates[0]?.date || (req.due_date ? req.due_date.split("T")[0] : "")),
      end_date: sched?.end_date ? sched.end_date.split("T")[0] : (schedDates[schedDates.length - 1]?.date || ""),
      completed_installments: sched?.completed_installments || 0,
      schedule_dates: schedDates,
    });
    setIsEditOpen(true);
  };

  // Auto-open request when navigating to /purchasing/requests/:id
  useEffect(() => {
    if (!routeRequestId) return;
    const found = requests.find((r) => String(r.id) === String(routeRequestId));
    if (found) {
      handleOpenEdit(found);
    } else if (!isLoading) {
      apiClient
        .get<RequestDetail>(`/api/purchasing/requests/${routeRequestId}`)
        .then((res) => {
          if (res?.request) {
            handleOpenEdit(res.request);
          }
        })
        .catch((err) => {
          console.error("Failed to load request #" + routeRequestId, err);
        });
    }
  }, [routeRequestId, requests, isLoading]);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForm.title.trim()) {
      toast.error("Please enter a title");
      return;
    }
    if (!newForm.requester.trim()) {
      toast.error("Please select a requester");
      return;
    }
    if (!newForm.department.trim()) {
      toast.error("Please enter or select a department");
      return;
    }
    const isCustom = newForm.frequency === "CUSTOM";
    const customDates = isCustom ? newForm.schedule_dates : [];
    const isSched = Boolean(
      newForm.is_scheduled &&
      (isCustom ? customDates.length > 0 : newForm.start_date && newForm.end_date)
    );

    const customSum = isCustom ? customDates.reduce((acc, itm) => acc + (itm.amount != null ? itm.amount : 0), 0) : 0;
    let baseAmt = parseFloat(newForm.amount) || 0;

    if (isSched && isCustom) {
      if (customDates.length === 0) {
        toast.error("Please add at least one installment date");
        return;
      }
      if (customSum <= 0 && baseAmt <= 0) {
        toast.error("Please enter an amount for the installment dates (greater than $0.00)");
        return;
      }
    } else {
      if (baseAmt <= 0) {
        toast.error("Please enter a valid amount greater than $0.00");
        return;
      }
    }

    let totalCycles: number | null = null;
    let totalAmt: number | null = null;
    let amt = baseAmt;

    if (isSched) {
      if (isCustom) {
        totalCycles = customDates.length;
        totalAmt = customSum > 0 ? customSum : (baseAmt > 0 ? baseAmt * totalCycles : 0);
        const cycleAmt = customDates[0]?.amount != null && customDates[0].amount > 0
          ? customDates[0].amount
          : (baseAmt > 0 ? baseAmt : (totalCycles > 0 ? Math.round((totalAmt / totalCycles) * 100) / 100 : 0));
        const sanitizedDates = customDates.map((d, i) => ({
          date: d.date,
          amount: d.amount != null && d.amount > 0 ? d.amount : cycleAmt,
          interest: d.interest != null ? d.interest : null,
          principal_paid: d.principal_paid != null ? d.principal_paid : null,
          balance: d.balance != null ? d.balance : null,
          note: d.note || `Installment #${i + 1}`,
        }));

        const effectiveStartDate = sanitizedDates.length > 0 ? sanitizedDates[0].date : newForm.start_date;
        const effectiveEndDate = sanitizedDates.length > 0 ? sanitizedDates[sanitizedDates.length - 1].date : newForm.end_date;
        const effectiveDueDate = effectiveStartDate || newForm.due_date;

        createMutation.mutate({
          title: newForm.title,
          requester: newForm.requester,
          department: newForm.class || newForm.department,
          request_type: "SCHEDULED_PAYMENT",
          priority: newForm.priority,
          amount: cycleAmt,
          unit_price: cycleAmt,
          quantity: 1,
          description: newForm.description,
          item_url: newForm.item_url?.trim() || null,
          gl_code: null,
          due_date: effectiveDueDate || null,
          quote_data: {
            location: newForm.location || "",
            class: newForm.class || "",
            department: newForm.department || "",
          },
          recurring_schedule: {
            is_scheduled: true,
            frequency: newForm.frequency,
            start_date: effectiveStartDate,
            end_date: effectiveEndDate,
            total_installments: totalCycles,
            completed_installments: 0,
            amount_per_cycle: cycleAmt,
            total_amount: totalAmt,
            custom_dates: sanitizedDates.map((d) => d.date),
            schedule_dates: sanitizedDates,
          },
        });
        return;
      } else {
        totalCycles = calculateInstallmentsCount(newForm.start_date, newForm.end_date, newForm.frequency);
        totalAmt = totalCycles ? Math.round(amt * totalCycles * 100) / 100 : null;
      }
    }

    const effectiveStartDate = isCustom && customDates.length > 0 ? customDates[0].date : newForm.start_date;
    const effectiveEndDate = isCustom && customDates.length > 0 ? customDates[customDates.length - 1].date : newForm.end_date;
    const effectiveDueDate = (isSched && effectiveStartDate) ? effectiveStartDate : newForm.due_date;

    createMutation.mutate({
      title: newForm.title,
      requester: newForm.requester,
      department: newForm.class || newForm.department,
      request_type: isSched ? "SCHEDULED_PAYMENT" : "RECURRING",
      priority: newForm.priority,
      amount: amt,
      unit_price: amt,
      quantity: 1,
      description: newForm.description,
      item_url: newForm.item_url?.trim() || null,
      gl_code: null,
      due_date: effectiveDueDate || null,
      quote_data: {
        location: newForm.location || "",
        class: newForm.class || "",
        department: newForm.department || "",
      },
      recurring_schedule: isSched
        ? {
            is_scheduled: true,
            frequency: newForm.frequency,
            start_date: effectiveStartDate,
            end_date: effectiveEndDate,
            total_installments: totalCycles,
            completed_installments: 0,
            amount_per_cycle: totalCycles && totalCycles > 0 ? Math.round((totalAmt! / totalCycles) * 100) / 100 : amt,
            total_amount: totalAmt,
            custom_dates: isCustom ? customDates.map((d) => d.date) : null,
            schedule_dates: isCustom ? customDates : null,
          }
        : {
            is_scheduled: false,
            frequency: newForm.frequency || "MONTHLY",
            start_date: newForm.due_date || newForm.start_date || new Date().toISOString().split("T")[0],
            end_date: null,
            total_installments: null,
            completed_installments: 0,
            amount_per_cycle: amt,
            total_amount: null,
          },
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.title.trim()) {
      toast.error("Please enter a title");
      return;
    }
    if (!editForm.requester.trim()) {
      toast.error("Please select a requester");
      return;
    }
    if (!editForm.department.trim()) {
      toast.error("Please enter or select a department");
      return;
    }

    const isCustom = editForm.frequency === "CUSTOM";
    const customDates = isCustom ? editForm.schedule_dates : [];
    const isSched = Boolean(
      editForm.is_scheduled &&
      (isCustom ? customDates.length > 0 : editForm.start_date && editForm.end_date)
    );

    const customSum = isCustom ? customDates.reduce((acc, itm) => acc + (itm.amount != null ? itm.amount : 0), 0) : 0;
    let baseAmt = parseFloat(editForm.amount) || 0;

    if (isSched && isCustom) {
      if (customDates.length === 0) {
        toast.error("Please add at least one installment date");
        return;
      }
      if (customSum <= 0 && baseAmt <= 0) {
        toast.error("Please enter an amount for the installment dates (greater than $0.00)");
        return;
      }
    } else {
      if (baseAmt <= 0) {
        toast.error("Please enter a valid amount greater than $0.00");
        return;
      }
    }

    let totalCycles: number | null = null;
    let totalAmt: number | null = null;
    let amt = baseAmt;

    if (isSched) {
      if (isCustom) {
        totalCycles = customDates.length;
        totalAmt = customSum > 0 ? customSum : (baseAmt > 0 ? baseAmt * totalCycles : 0);
        const completedCount = editForm.completed_installments || 0;
        const activeCycleDate = customDates[completedCount] || customDates[0];
        const cycleAmt = activeCycleDate?.amount != null && activeCycleDate.amount > 0
          ? activeCycleDate.amount
          : (baseAmt > 0 ? baseAmt : (totalCycles > 0 ? Math.round((totalAmt / totalCycles) * 100) / 100 : 0));
        const sanitizedDates = customDates.map((d, i) => ({
          date: d.date,
          amount: d.amount != null && d.amount > 0 ? d.amount : cycleAmt,
          interest: d.interest != null ? d.interest : null,
          principal_paid: d.principal_paid != null ? d.principal_paid : null,
          balance: d.balance != null ? d.balance : null,
          note: d.note || `Installment #${i + 1}`,
        }));

        const effectiveStartDate = sanitizedDates.length > 0 ? sanitizedDates[0].date : editForm.start_date;
        const effectiveEndDate = sanitizedDates.length > 0 ? sanitizedDates[sanitizedDates.length - 1].date : editForm.end_date;
        const effectiveDueDate = effectiveStartDate || editForm.due_date;

        updateMutation.mutate({
          id: editForm.id,
          payload: {
            title: editForm.title,
            requester: editForm.requester,
            department: editForm.class || editForm.department,
            priority: editForm.priority,
            amount: cycleAmt,
            unit_price: cycleAmt,
            quantity: 1,
            description: editForm.description,
            item_url: editForm.item_url !== undefined ? (editForm.item_url.trim() || null) : (editingRequest?.item_url || null),
            gl_code: editingRequest?.gl_code || editForm.gl_code || null,
            due_date: effectiveDueDate || null,
            quote_data: {
              ...(editingRequest?.quote_data || {}),
              location: editForm.location || "",
              class: editForm.class || "",
              department: editForm.department || "",
            },
            recurring_schedule: {
              is_scheduled: true,
              frequency: editForm.frequency,
              start_date: effectiveStartDate,
              end_date: effectiveEndDate,
              total_installments: totalCycles,
              completed_installments: editForm.completed_installments || 0,
              amount_per_cycle: cycleAmt,
              total_amount: totalAmt,
              custom_dates: sanitizedDates.map((d) => d.date),
              schedule_dates: sanitizedDates,
            },
          },
        });
        return;
      } else {
        totalCycles = calculateInstallmentsCount(editForm.start_date, editForm.end_date, editForm.frequency);
        totalAmt = totalCycles ? Math.round(amt * totalCycles * 100) / 100 : null;
      }
    }

    const effectiveStartDate = isCustom && customDates.length > 0 ? customDates[0].date : editForm.start_date;
    const effectiveEndDate = isCustom && customDates.length > 0 ? customDates[customDates.length - 1].date : editForm.end_date;
    const effectiveDueDate = (isSched && effectiveStartDate) ? effectiveStartDate : editForm.due_date;

    updateMutation.mutate({
      id: editForm.id,
      payload: {
        title: editForm.title,
        requester: editForm.requester,
        department: editForm.class || editForm.department,
        priority: editForm.priority,
        amount: amt,
        unit_price: amt,
        quantity: 1,
        description: editForm.description,
        item_url: editForm.item_url !== undefined ? (editForm.item_url.trim() || null) : (editingRequest?.item_url || null),
        gl_code: editingRequest?.gl_code || editForm.gl_code || null,
        due_date: effectiveDueDate || null,
        quote_data: {
          ...(editingRequest?.quote_data || {}),
          location: editForm.location || "",
          class: editForm.class || "",
          department: editForm.department || "",
        },
        recurring_schedule: isSched
          ? {
              is_scheduled: true,
              frequency: editForm.frequency,
              start_date: effectiveStartDate,
              end_date: effectiveEndDate,
              total_installments: totalCycles,
              completed_installments: editForm.completed_installments || 0,
              amount_per_cycle: totalCycles && totalCycles > 0 ? Math.round((totalAmt! / totalCycles) * 100) / 100 : amt,
              total_amount: totalAmt,
              custom_dates: isCustom ? customDates.map((d) => d.date) : null,
              schedule_dates: isCustom ? customDates : null,
            }
          : {
              is_scheduled: false,
              frequency: editForm.frequency || "MONTHLY",
              start_date: editForm.start_date || editForm.due_date || new Date().toISOString().split("T")[0],
              end_date: null,
              total_installments: null,
              completed_installments: editForm.completed_installments || 0,
              amount_per_cycle: amt,
              total_amount: null,
            },
      },
    });
  };

  // Helper to check if a recurring request is strictly synced from M&A
  const isMaTransaction = (r: PurchaseRequest | any) => {
    if (!r) return false;
    const src = (r.source_portal || "").toString().toLowerCase().trim();
    return Boolean(
      r.is_ma === true ||
      r.type === "m&a" ||
      src === "m7a" ||
      src === "m&a" ||
      src === "m_and_a" ||
      src === "ma"
    );
  };

  // Helper to check if a recurring request is due within 7 days
  const isDueSoon = (r: PurchaseRequest) => {
    const dateStr = r.due_date || r.request_date;
    const st = parseRequestStatus(r.status);
    if (!dateStr || st === RequestStatus.Completed || st === RequestStatus.Rejected) return false;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    d.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  };

  // Filtered requests
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      const parsedStatus = parseRequestStatus(r.status);
      const isRejected = parsedStatus === RequestStatus.Rejected;

      if (searchTerm && searchTerm.trim()) {
        const rawTerm = searchTerm.toLowerCase().trim();
        const cleanIdTerm = rawTerm.replace(/^(?:req-#|req-|rec-#|rec-|#)/i, "").trim();
        const idStr = String(r.id ?? "").toLowerCase();
        const titleStr = String(r.title ?? "").toLowerCase();
        const reqStr = String(r.requester ?? "").toLowerCase();
        const deptStr = String(r.department ?? "").toLowerCase();
        const descStr = String(r.description ?? "").toLowerCase();
        const vendorStr = String((r as any).vendor ?? r.product_info?.vendor ?? "").toLowerCase();
        const statusStr = String(r.status ?? "").toLowerCase();
        const amountStr = String(r.amount ?? "");
        const glStr = String(r.gl_code ?? "").toLowerCase();
        const { displayAmount, nextFormatted, totalFormatted } = getRecurringAmounts(
          r.recurring_schedule,
          r.amount,
          r.currency || "USD",
          r.status,
          r.due_date || r.request_date
        );

        const matches =
          idStr.includes(rawTerm) ||
          (cleanIdTerm.length > 0 && idStr.includes(cleanIdTerm)) ||
          titleStr.includes(rawTerm) ||
          reqStr.includes(rawTerm) ||
          deptStr.includes(rawTerm) ||
          descStr.includes(rawTerm) ||
          vendorStr.includes(rawTerm) ||
          statusStr.includes(rawTerm) ||
          amountStr.includes(rawTerm) ||
          displayAmount.toLowerCase().includes(rawTerm) ||
          nextFormatted.toLowerCase().includes(rawTerm) ||
          (totalFormatted && totalFormatted.toLowerCase().includes(rawTerm)) ||
          glStr.includes(rawTerm);

        if (!matches) {
          return false;
        }
      }
      if (cardFilter === "ALL") {
        // "All Subscriptions" tab: includes all active recurring subscriptions and M&A scheduled payments
        if (isRejected) return false;
      } else if (cardFilter === "MA_SCHEDULED" || cardFilter === "SCHEDULED") {
        // "M&A Scheduled" tab: strictly show M&A transactions
        if (isRejected) return false;
        if (!isMaTransaction(r)) return false;
      } else if (cardFilter === "DUE_SOON") {
        // Due in 7 Days: includes all payments (both subscriptions and M&A scheduled payments)
        if (!isDueSoon(r)) return false;
      } else if (cardFilter === "WAITING_REVIEW") {
        // Waiting for Review: includes all payments (both subscriptions and M&A scheduled payments)
        if (isRejected) return false;
        const rev = r.review_status || "WAITING_FOR_REVIEW";
        if (rev !== "WAITING_FOR_REVIEW") return false;
      } else if (cardFilter === "REVIEWED") {
        // Reviewed (AP): includes all payments (both subscriptions and M&A scheduled payments)
        if (isRejected) return false;
        if (r.review_status !== "REVIEWED") return false;
      } else if (cardFilter === "ON_HOLD") {
        // On Hold: includes all payments (both subscriptions and M&A scheduled payments)
        if (parsedStatus !== RequestStatus.OnHold && r.status !== "ON_HOLD") return false;
      } else if (cardFilter === "COMPLETED") {
        // Completed: includes all payments (both subscriptions and M&A scheduled payments)
        const isComp = parsedStatus === RequestStatus.Completed || r.status === "COMPLETED" || (r.status as string) === "PAID";
        if (!isComp) return false;
      } else if (cardFilter === "REJECTED") {
        // Rejected: includes all payments (both subscriptions and M&A scheduled payments)
        if (!isRejected) return false;
      }
      if (dueFilter !== "ALL") {
        const isCompOrRej =
          parsedStatus === RequestStatus.Completed ||
          parsedStatus === RequestStatus.Rejected ||
          r.status === "COMPLETED" ||
          r.status === "REJECTED" ||
          (r.status as string) === "PAID";
        if (isCompOrRej) return false;

        const dateStr = r.due_date || r.request_date;
        if (!dateStr) return false;
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return false;
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        d.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (dueFilter === "DUE_TODAY" && diffDays !== 0) return false;
        if (dueFilter === "DUE_7_DAYS" && (diffDays < 0 || diffDays > 7)) return false;
        if (dueFilter === "OVERDUE" && diffDays >= 0) return false;
      }
      if (priorityFilter !== "ALL") {
        const p = (r.priority || "MEDIUM").toUpperCase();
        if (p !== priorityFilter.toUpperCase()) return false;
      }
      if (reviewFilter !== "ALL") {
        const rev = r.review_status || "WAITING_FOR_REVIEW";
        if (rev !== reviewFilter) return false;
      }
      if (statusFilter !== "ALL") {
        const targetStatus = parseRequestStatus(statusFilter);
        const isComp = statusFilter === "COMPLETED" && (parsedStatus === RequestStatus.Completed || r.status === "COMPLETED" || (r.status as string) === "PAID");
        if (!isComp && parsedStatus !== targetStatus && r.status !== statusFilter) {
          return false;
        }
      }
      return true;
    });
  }, [requests, searchTerm, cardFilter, dueFilter, priorityFilter, reviewFilter, statusFilter]);

  // Summary statistics
  const stats = useMemo(() => {
    const maRequests = requests.filter(isMaTransaction);

    const activeAll = requests.filter((r) => parseRequestStatus(r.status) !== RequestStatus.Rejected);

    const total = activeAll.length; // "All Subscriptions" card count
    const maScheduled = maRequests.filter((r) => parseRequestStatus(r.status) !== RequestStatus.Rejected).length; // "M&A Scheduled" card count
    const dueSoon = requests.filter(isDueSoon).length; // "Due in 7 Days"
    const waitingReview = activeAll.filter(
      (r) => (r.review_status || "WAITING_FOR_REVIEW") === "WAITING_FOR_REVIEW"
    ).length; // "Waiting for Review"
    const reviewed = activeAll.filter(
      (r) => r.review_status === "REVIEWED"
    ).length; // "Reviewed (AP)"
    const onHold = requests.filter(
      (r) => parseRequestStatus(r.status) === RequestStatus.OnHold || r.status === "ON_HOLD"
    ).length; // "On Hold"
    const completed = requests.filter(
      (r) => parseRequestStatus(r.status) === RequestStatus.Completed || r.status === "COMPLETED" || (r.status as string) === "PAID"
    ).length; // "Completed"
    const rejected = requests.filter((r) => parseRequestStatus(r.status) === RequestStatus.Rejected).length; // "Rejected"
    const totalAmount = activeAll.reduce((sum, r) => sum + (r.amount || 0), 0);
    return { total, maScheduled, dueSoon, waitingReview, reviewed, onHold, completed, rejected, totalAmount };
  }, [requests]);

  if (!canAccess) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <ShieldAlert className="w-16 h-16 text-amber-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-800 dark:text-zinc-100">
          Access Restricted
        </h2>
        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
          The Recurring Payments dashboard is only accessible to users with the{" "}
          <strong>TREASURY</strong> or <strong>AP (Accounts Payable)</strong>{" "}
          roles.
        </p>
        <Button className="mt-6" onClick={() => navigate("/purchasing/requests")}>
          Return to Purchase Requests
        </Button>
      </div>
    );
  }

  // Calendar calculations
  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();
  const monthName = currentCalendarDate.toLocaleString("default", {
    month: "long",
  });

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const prevMonthDays = new Date(year, month, 0).getDate();
  const calendarCells: CalendarCell[] = [];

  for (let i = firstDayIndex - 1; i >= 0; i--) {
    calendarCells.push({
      day: prevMonthDays - i,
      isCurrentMonth: false,
      dateStr: "",
    });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const monthStr = String(month + 1).padStart(2, "0");
    const dayStr = String(d).padStart(2, "0");
    calendarCells.push({
      day: d,
      isCurrentMonth: true,
      dateStr: `${year}-${monthStr}-${dayStr}`,
    });
  }

  const remainingCells = 42 - calendarCells.length;
  for (let i = 1; i <= remainingCells; i++) {
    calendarCells.push({ day: i, isCurrentMonth: false, dateStr: "" });
  }

  return (
    <div className="w-full flex flex-col gap-3 sm:gap-3.5 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
      {/* Header */}
      <PageConnectionBanner serviceName="Cross-Portal AP & Treasury Integration" mode="Connected (Live)" description="Real-time multi-entity recurring payments and installment tracking" />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">Recurring Payments</h1>
            <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800">
              AP & Treasury
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Manage recurring subscriptions, process workflow from New Request → Waiting for Payment → Invoice (Fixed Assets) → Completed, and track AP review statuses.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-zinc-800/80 p-1 rounded-lg border border-slate-200 dark:border-zinc-700">
            <Button
              variant={viewMode === "table" ? "default" : "ghost"}
              size="sm"
              className={`h-8 gap-1.5 text-xs font-semibold transition-all ${
                viewMode === "table"
                  ? "bg-primary text-primary-foreground shadow-xs hover:bg-primary/95"
                  : "text-muted-foreground hover:text-foreground hover:bg-slate-200/60 dark:hover:bg-zinc-700/60"
              }`}
              onClick={() => setViewMode("table")}
            >
              <TableIcon size={14} />
              Subscriptions
            </Button>
            <Button
              variant={viewMode === "calendar" ? "default" : "ghost"}
              size="sm"
              className={`h-8 gap-1.5 text-xs font-semibold transition-all ${
                viewMode === "calendar"
                  ? "bg-primary text-primary-foreground shadow-xs hover:bg-primary/95"
                  : "text-muted-foreground hover:text-foreground hover:bg-slate-200/60 dark:hover:bg-zinc-700/60"
              }`}
              onClick={() => setViewMode("calendar")}
            >
              <CalendarIcon size={14} />
              Calendar View
            </Button>
            <Button
              variant={viewMode === "master" ? "default" : "ghost"}
              size="sm"
              className={`h-8 gap-1.5 text-xs font-semibold transition-all ${
                viewMode === "master"
                  ? "bg-primary text-primary-foreground shadow-xs hover:bg-primary/95"
                  : "text-muted-foreground hover:text-foreground hover:bg-slate-200/60 dark:hover:bg-zinc-700/60"
              }`}
              onClick={() => setViewMode("master")}
            >
              <Layers size={14} />
              Master View
            </Button>
          </div>

          {canCreateRecurring && (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={handleOpenCreate}
                className="h-9 gap-1.5 bg-sky-600 hover:bg-sky-700 text-white shadow-xs"
              >
                <Plus size={16} />
                New Recurring Request
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Slim Vertical Floating Quick Filter (Follows card colors & appears on scroll) */}
      <FloatingVerticalFilter
        items={[
          {
            key: "ALL",
            label: "All Subscriptions",
            count: stats.total,
            icon: RefreshCw,
            color: "blue",
          },
          {
            key: "MA_SCHEDULED",
            label: "M&A Scheduled",
            count: stats.maScheduled,
            icon: CalendarClock,
            color: "violet",
          },
          {
            key: "DUE_SOON",
            label: "Due in 7 Days",
            count: stats.dueSoon,
            icon: AlertTriangle,
            color: "amber",
          },
          {
            key: "WAITING_REVIEW",
            label: "Waiting Review",
            count: stats.waitingReview,
            icon: Clock,
            color: "amber",
          },
          {
            key: "REVIEWED",
            label: "Reviewed (AP)",
            count: stats.reviewed,
            icon: CheckCircle2,
            color: "sky",
          },
          {
            key: "ON_HOLD",
            label: "On Hold",
            count: stats.onHold,
            icon: PauseCircle,
            color: "rose",
          },
          {
            key: "COMPLETED",
            label: "Completed",
            count: stats.completed,
            icon: CheckCircle2,
            color: "green",
          },
          {
            key: "REJECTED",
            label: "Rejected",
            count: stats.rejected,
            icon: XCircle,
            color: "rose",
          },
        ]}
        activeKey={cardFilter}
        onSelect={handleCardFilterChange}
        defaultKey="ALL"
        onReset={() => handleCardFilterChange("ALL")}
        scrollThreshold={130}
        title="Subscriptions"
        kpiRef={kpiRef}
      />

      {/* Compact Interactive KPI Filter Cards */}
      <div ref={kpiRef} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2.5 sm:gap-3 animate-in fade-in duration-300 shrink-0">
        {/* 1. All Subscriptions */}
        <Card
          onClick={() => handleCardFilterChange("ALL")}
          className={`border border-slate-200/80 dark:border-zinc-800 cursor-pointer shadow-xs hover:shadow-xs transition-all rounded-lg hover:border-blue-300 ${
            cardFilter === "ALL" ? "ring-2 ring-blue-500 bg-blue-50/20 dark:bg-blue-950/20" : ""
          }`}
        >
          <CardContent className="p-2 sm:p-2.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground">
                Active Subscriptions
              </p>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-zinc-100 leading-tight mt-0.5">
                {stats.total}
              </h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">All active recurring</p>
            </div>
            <div className="p-1.5 rounded-md bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600 shrink-0">
              <RefreshCw size={16} />
            </div>
          </CardContent>
        </Card>

        {/* 2. M&A Scheduled Payments */}
        <Card
          onClick={() => handleCardFilterChange(cardFilter === "MA_SCHEDULED" ? "ALL" : "MA_SCHEDULED")}
          className={`border border-slate-200/80 dark:border-zinc-800 cursor-pointer shadow-xs hover:shadow-xs transition-all rounded-lg hover:border-indigo-300 ${
            cardFilter === "MA_SCHEDULED" ? "ring-2 ring-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/20" : ""
          }`}
        >
          <CardContent className="p-2 sm:p-2.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-indigo-700 dark:text-indigo-300">
                M&A Scheduled
              </p>
              <h3 className="text-base sm:text-lg font-bold text-indigo-600 dark:text-indigo-400 leading-tight mt-0.5">
                {stats.maScheduled}
              </h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Milestone contracts</p>
            </div>
            <div className="p-1.5 rounded-md bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 shrink-0">
              <CalendarClock size={16} />
            </div>
          </CardContent>
        </Card>

        {/* 3. Due Within 7 Days Alert Filter Card */}
        <Card
          onClick={() => handleCardFilterChange(cardFilter === "DUE_SOON" ? "ALL" : "DUE_SOON")}
          className={`border cursor-pointer shadow-xs hover:shadow-xs transition-all rounded-lg ${
            stats.dueSoon > 0 ? "border-amber-300/80 dark:border-amber-700/60 bg-amber-50/10" : "border-slate-200/80 dark:border-zinc-800"
          } ${
            cardFilter === "DUE_SOON" ? "ring-2 ring-amber-500 bg-amber-50/30 dark:bg-amber-950/40 border-amber-500" : "hover:border-amber-400"
          }`}
        >
          <CardContent className="p-2 sm:p-2.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-amber-700 dark:text-amber-300 flex items-center gap-1">
                Due in 7 Days
              </p>
              <h3 className="text-base sm:text-lg font-bold text-amber-600 dark:text-amber-400 leading-tight mt-0.5">
                {stats.dueSoon}
              </h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {stats.dueSoon === 1 ? "1 payment due soon" : `${stats.dueSoon} payments due soon`}
              </p>
            </div>
            <div className="p-1.5 rounded-md bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-amber-600 shrink-0">
              <AlertTriangle size={16} />
            </div>
          </CardContent>
        </Card>

        {/* 4. Waiting for Review */}
        <Card
          onClick={() => handleCardFilterChange(cardFilter === "WAITING_REVIEW" ? "ALL" : "WAITING_REVIEW")}
          className={`border border-slate-200/80 dark:border-zinc-800 cursor-pointer shadow-xs hover:shadow-xs transition-all rounded-lg hover:border-amber-300 ${
            cardFilter === "WAITING_REVIEW" ? "ring-2 ring-amber-500 bg-amber-50/20 dark:bg-amber-950/20" : ""
          }`}
        >
          <CardContent className="p-2 sm:p-2.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground">
                Waiting for Review
              </p>
              <h3 className="text-base sm:text-lg font-bold text-amber-600 dark:text-amber-400 leading-tight mt-0.5">
                {stats.waitingReview}
              </h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Pending AP sign-off</p>
            </div>
            <div className="p-1.5 rounded-md bg-amber-50 dark:bg-amber-950 flex items-center justify-center text-amber-600 shrink-0">
              <Clock size={16} />
            </div>
          </CardContent>
        </Card>

        {/* 5. Reviewed (AP Signed-Off) */}
        <Card
          onClick={() => handleCardFilterChange(cardFilter === "REVIEWED" ? "ALL" : "REVIEWED")}
          className={`border border-slate-200/80 dark:border-zinc-800 cursor-pointer shadow-xs hover:shadow-xs transition-all rounded-lg hover:border-sky-300 ${
            cardFilter === "REVIEWED" ? "ring-2 ring-sky-500 bg-sky-50/20 dark:bg-sky-950/20" : ""
          }`}
        >
          <CardContent className="p-2 sm:p-2.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground">
                Reviewed (AP)
              </p>
              <h3 className="text-base sm:text-lg font-bold text-sky-600 dark:text-sky-400 leading-tight mt-0.5">
                {stats.reviewed}
              </h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">AP validated</p>
            </div>
            <div className="p-1.5 rounded-md bg-sky-50 dark:bg-sky-950 flex items-center justify-center text-sky-600 shrink-0">
              <CheckCircle2 size={16} />
            </div>
          </CardContent>
        </Card>

        {/* 6. Completed */}
        <Card
          onClick={() => handleCardFilterChange(cardFilter === "COMPLETED" ? "ALL" : "COMPLETED")}
          className={`border border-slate-200/80 dark:border-zinc-800 cursor-pointer shadow-xs hover:shadow-xs transition-all rounded-lg hover:border-emerald-300 ${
            cardFilter === "COMPLETED" ? "ring-2 ring-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20" : ""
          }`}
        >
          <CardContent className="p-2 sm:p-2.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                Completed
              </p>
              <h3 className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400 leading-tight mt-0.5">
                {stats.completed}
              </h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Fully paid / done</p>
            </div>
            <div className="p-1.5 rounded-md bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 shrink-0">
              <CheckCircle2 size={16} />
            </div>
          </CardContent>
        </Card>

        {/* 7. Rejected */}
        <Card
          onClick={() => handleCardFilterChange(cardFilter === "REJECTED" ? "ALL" : "REJECTED")}
          className={`border border-slate-200/80 dark:border-zinc-800 cursor-pointer shadow-xs hover:shadow-xs transition-all rounded-lg hover:border-rose-300 ${
            cardFilter === "REJECTED" ? "ring-2 ring-rose-500 bg-rose-50/20 dark:bg-rose-950/20" : ""
          }`}
        >
          <CardContent className="p-2 sm:p-2.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground">
                Rejected
              </p>
              <h3 className="text-base sm:text-lg font-bold text-rose-600 dark:text-rose-400 leading-tight mt-0.5">
                {stats.rejected}
              </h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Rejected subscriptions</p>
            </div>
            <div className="p-1.5 rounded-md bg-rose-50 dark:bg-rose-950 flex items-center justify-center text-rose-600 shrink-0">
              <XCircle size={16} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="Search recurring payments by title, requester, department, ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Select value={dueFilter} onValueChange={setDueFilter}>
            <SelectTrigger className="w-[150px] h-9 text-xs">
              <SelectValue placeholder="Due Date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Due Dates</SelectItem>
              <SelectItem value="DUE_TODAY">Due Today</SelectItem>
              <SelectItem value="DUE_7_DAYS">Due in 7 Days</SelectItem>
              <SelectItem value="OVERDUE">Overdue</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[140px] h-9 text-xs">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Priorities</SelectItem>
              <SelectItem value="URGENT">Urgent</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
            </SelectContent>
          </Select>

          <Select value={reviewFilter} onValueChange={setReviewFilter}>
            <SelectTrigger className="w-[160px] h-9 text-xs">
              <SelectValue placeholder="Review Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Review States</SelectItem>
              <SelectItem value="WAITING_FOR_REVIEW">Waiting for Review</SelectItem>
              <SelectItem value="REVIEWED">Reviewed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px] h-9 text-xs">
              <SelectValue placeholder="Workflow Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Workflow Statuses</SelectItem>
              <SelectItem value="INITIAL">Draft</SelectItem>
              <SelectItem value="WAITING_PAYMENT">Waiting Payment</SelectItem>
              <SelectItem value="INVOICE_RECEIVED">Invoice Received</SelectItem>
              <SelectItem value="ON_HOLD">On Hold</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

            {/* Main View: Master, Table, or Calendar */}
      {viewMode === "master" ? (
        <MasterTransactionsTable
          requests={filteredRequests}
          isLoading={isLoading}
          isAP={isAP}
          isSuperAdmin={isSuperAdmin}
          onOpenBreakdownModal={(req) => setScheduleModalRequest(req)}
          onToggleReviewStatus={(req) => {
            const revStatus = req.review_status || "WAITING_FOR_REVIEW";
            const isRev = revStatus === "REVIEWED";
            reviewMutation.mutate({
              id: req.id,
              review_status: isRev ? "WAITING_FOR_REVIEW" : "REVIEWED",
            });
          }}
          reviewMutationPending={reviewMutation.isPending}
        />
      ) : viewMode === "table" ? (
        <Card className="border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xs bg-white dark:bg-zinc-900 overflow-hidden flex flex-col max-h-[calc(100vh-210px)] min-h-[350px]">
          <div className="flex-1 min-h-0 overflow-auto relative">
            <Table containerClassName="overflow-visible">
            <TableHeader>
              <TableRow className="bg-slate-50/75 dark:bg-zinc-900/75 border-b border-slate-200 dark:border-zinc-800">
                <TableHead className="min-w-[280px]">Request &amp; Plan</TableHead>
                <TableHead className="min-w-[170px]">Requester / Dept</TableHead>
                <TableHead className="min-w-[180px]">Schedule &amp; Due Date</TableHead>
                <TableHead className="min-w-[150px]">Amount</TableHead>
                <TableHead className="min-w-[170px]">Status &amp; Review</TableHead>
                <TableHead className="text-right w-[90px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    Loading recurring payments...
                  </TableCell>
                </TableRow>
              ) : filteredRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    No recurring payments found matching the current filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRequests.map((req) => {
                  const revStatus = req.review_status || "WAITING_FOR_REVIEW";
                  const isRev = revStatus === "REVIEWED";
                  const { nextFormatted, totalFormatted } = getRecurringAmounts(
                    req.recurring_schedule,
                    req.amount,
                    req.currency || "USD",
                    req.status,
                    req.due_date || req.request_date
                  );
                  return (
                    <TableRow
                      key={req.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/60 cursor-pointer transition-colors group"
                      onClick={() => navigate(`/purchasing/requests/${req.id}`)}
                    >
                      {/* 1. Request & Plan */}
                      <TableCell className="py-3 max-w-[320px]">
                        <div className="flex items-center gap-1.5 flex-wrap mb-1">
                          <span className="font-mono text-xs font-bold text-slate-700 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded shrink-0">
                            #{req.id}
                          </span>
                          <span className="font-semibold text-slate-900 group-hover:text-blue-600 dark:text-zinc-100 dark:group-hover:text-blue-400 text-sm transition-colors line-clamp-1">
                            {req.title}
                          </span>
                          {isMaTransaction(req) ? (
                            <Badge className="text-[10px] px-1.5 py-0 h-4 bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-300 dark:border-purple-700 font-bold shrink-0">
                              M&amp;A
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-300 font-medium shrink-0">
                              Recurring
                            </Badge>
                          )}
                          {req.item_url && (
                            <a
                              href={req.item_url.startsWith("http") ? req.item_url : `https://${req.item_url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline hover:text-blue-700 dark:hover:text-blue-300 bg-blue-50/80 dark:bg-blue-950/50 px-1.5 py-0.5 rounded border border-blue-200/60 dark:border-blue-800/40 shrink-0"
                              title={req.item_url}
                            >
                              <ExternalLink className="w-3 h-3 shrink-0" />
                              <span>Link</span>
                            </a>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                            <PrioritySelector
                              requestId={req.id}
                              priority={req.priority}
                              size="xs"
                            />
                          </div>
                          {req.description && (
                            <span className="truncate max-w-[200px]" title={req.description}>
                              {req.description}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* 2. Requester / Dept */}
                      <TableCell className="py-3">
                        <div className="text-sm font-medium text-slate-900 dark:text-zinc-100">
                          {req.requester}
                        </div>
                        {(() => {
                          const reqDept = req.department || (req as any).department_name || "";
                          return (
                            <div className="text-xs text-muted-foreground truncate max-w-[180px]" title={reqDept || undefined}>
                              {reqDept ? (
                                <span className="font-medium text-slate-700 dark:text-zinc-300">{reqDept}</span>
                              ) : (
                                <span className="text-slate-400 dark:text-zinc-500">—</span>
                              )}
                            </div>
                          );
                        })()}
                      </TableCell>

                      {/* 3. Schedule & Due Date */}
                      <TableCell className="py-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm font-semibold text-slate-800 dark:text-zinc-200">
                            {req.due_date ? formatDate(req.due_date) : formatDate(req.request_date)}
                          </span>
                          {(() => {
                            const due = getDueStatus(req.due_date || req.request_date, req.status);
                            if (!due) return null;
                            return (
                              <Badge variant={due.variant} className={`text-[10px] py-0 px-1.5 leading-tight ${due.className}`}>
                                {due.label}
                              </Badge>
                            );
                          })()}
                        </div>
                        {req.recurring_schedule?.is_scheduled && (
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <Badge
                              variant="outline"
                              className="text-[10px] py-0 px-1.5 bg-indigo-50/90 text-indigo-800 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800 flex items-center gap-1 font-semibold"
                            >
                              <Clock className="h-2.5 w-2.5 shrink-0 text-indigo-600 dark:text-indigo-400" />
                              {formatRemainingDuration(req.recurring_schedule.end_date).text}
                            </Badge>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setScheduleModalRequest(req);
                              }}
                              className="text-[10px] text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-semibold underline flex items-center gap-1 cursor-pointer"
                            >
                              <TableIcon className="h-2.5 w-2.5 shrink-0" />
                              Schedule ({req.recurring_schedule.total_installments ? `${req.recurring_schedule.completed_installments || 0}/${req.recurring_schedule.total_installments}` : `${req.recurring_schedule.completed_installments || 0} Settled`})
                            </button>
                          </div>
                        )}
                      </TableCell>

                      {/* 4. Amount */}
                      <TableCell className="py-3">
                        <div className="flex items-baseline gap-1 font-bold text-slate-900 dark:text-zinc-100 text-sm">
                          <span>{nextFormatted}</span>
                          {totalFormatted && (
                            <span className="text-xs font-normal text-muted-foreground">
                              / {totalFormatted}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {totalFormatted ? "Next Cycle / Total" : "Cycle Amount"}
                        </div>
                      </TableCell>

                      {/* 5. Status & Review */}
                      <TableCell className="py-3">
                        <div className="flex flex-col gap-1.5 items-start">
                          <Badge variant="outline" className={getStatusBadge(req.status)}>
                            {getStatusLabel(req.status)}
                            {req.recurring_schedule ? (
                              parseRequestStatus(req.status) === RequestStatus.Completed
                                ? (req.recurring_schedule.total_installments ? ` (${req.recurring_schedule.total_installments}/${req.recurring_schedule.total_installments})` : "")
                                : (req.recurring_schedule.total_installments
                                  ? ` (Cycle ${Math.min((req.recurring_schedule.completed_installments || 0) + 1, req.recurring_schedule.total_installments)}/${req.recurring_schedule.total_installments})`
                                  : ` (Cycle ${(req.recurring_schedule.completed_installments || 0) + 1})`)
                            ) : ""}
                          </Badge>
                          {isAP || isSuperAdmin ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                reviewMutation.mutate({
                                  id: req.id,
                                  review_status: isRev ? "WAITING_FOR_REVIEW" : "REVIEWED",
                                });
                              }}
                              disabled={reviewMutation.isPending}
                              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border transition-all cursor-pointer shadow-2xs hover:opacity-80 ${
                                isRev
                                  ? "bg-sky-50 text-sky-700 border-sky-300 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800"
                                  : "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800"
                              }`}
                              title="Click to toggle Review Status"
                            >
                              {isRev ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                              {isRev ? "Reviewed" : "Waiting for Review"}
                            </button>
                          ) : (
                            <Badge
                              variant="outline"
                              className={`text-[11px] py-0 px-2 ${
                                isRev
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                                  : "bg-amber-50 text-amber-700 border-amber-300"
                              }`}
                            >
                              {isRev ? "Reviewed" : "Waiting for Review"}
                            </Badge>
                          )}
                        </div>
                      </TableCell>

                      {/* 6. Actions */}
                      <TableCell className="text-right py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          {req.recurring_schedule?.is_scheduled && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
                              title="View Full Payment Schedule / Ledger"
                              onClick={(e) => {
                                e.stopPropagation();
                                setScheduleModalRequest(req);
                              }}
                            >
                              <CalendarClock size={14} />
                            </Button>
                          )}
                          {canManageRecurring && (<>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
                            title="Edit Wire Info / Banking Details"
                            onClick={(e) => {
                              e.stopPropagation();
                              setWireModalRequest(req);
                            }}
                          >
                            <Landmark size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50"
                            title="Edit Recurring Request"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEdit(req);
                            }}
                          >
                            <Edit2 size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"
                            title="Delete Recurring Request"
                            onClick={(e) => {
                              e.stopPropagation();
                              setRequestToDelete(req);
                            }}
                          >
                            <Trash2 size={14} />
                          </Button>
                          </>)}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          </div>
        </Card>
      ) : (
        /* Calendar View */
        <Card className="border border-slate-200 dark:border-zinc-800 p-6">
          {/* Calendar Month Header & Legend */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-900 dark:text-zinc-100">
                {monthName} {year}
              </h2>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs font-semibold"
                onClick={() => setCurrentCalendarDate(new Date())}
              >
                Today
              </Button>
            </div>

            {/* Legend & Navigation */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-3 text-xs text-muted-foreground mr-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
                  <span>Reviewed</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <span>Waiting Review</span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() =>
                    setCurrentCalendarDate(new Date(year, month - 1, 1))
                  }
                  title="Previous Month"
                >
                  <ChevronLeft size={16} />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() =>
                    setCurrentCalendarDate(new Date(year, month + 1, 1))
                  }
                  title="Next Month"
                >
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider">
            <div className="py-1 bg-slate-50 dark:bg-zinc-800/60 rounded">Sun</div>
            <div className="py-1 bg-slate-50 dark:bg-zinc-800/60 rounded">Mon</div>
            <div className="py-1 bg-slate-50 dark:bg-zinc-800/60 rounded">Tue</div>
            <div className="py-1 bg-slate-50 dark:bg-zinc-800/60 rounded">Wed</div>
            <div className="py-1 bg-slate-50 dark:bg-zinc-800/60 rounded">Thu</div>
            <div className="py-1 bg-slate-50 dark:bg-zinc-800/60 rounded">Fri</div>
            <div className="py-1 bg-slate-50 dark:bg-zinc-800/60 rounded">Sat</div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {calendarCells.map((cell: CalendarCell, idx: number) => {
              // Find items matching this date, including projected installments from scheduled requests
              const cellItems: Array<{
                id: string;
                request: PurchaseRequest;
                installmentNumber?: number;
                totalInstallments?: number;
                isProjected: boolean;
                isPaid: boolean;
                amount: number;
                currency?: string;
                displayTitle: string;
                isReviewed: boolean;
              }> = [];

              if (cell.isCurrentMonth) {
                filteredRequests.forEach((req) => {
                  const sched = req.recurring_schedule;
                  const installments = generatePaymentSchedule(
                    sched,
                    req.amount || 0,
                    req.currency || "USD",
                    req.status,
                    req.due_date || req.request_date
                  );
                  const match = installments.find((inst) => inst.dueDate === cell.dateStr);
                  if (match) {
                    const isOngoing = !sched?.total_installments && !sched?.end_date && sched?.frequency !== "CUSTOM" && !(sched?.schedule_dates?.length);
                    const totalInst = sched?.total_installments || (sched?.end_date ? installments.length : null);
                    cellItems.push({
                      id: `${req.id}-inst-${match.installmentNumber}`,
                      request: req,
                      installmentNumber: match.installmentNumber,
                      totalInstallments: totalInst || installments.length,
                      isProjected: match.status === "PROJECTED",
                      isPaid: match.status === "PAID",
                      amount: match.amount,
                      currency: match.currency || req.currency || "USD",
                      displayTitle: isOngoing ? `${req.title} (Cycle #${match.installmentNumber})` : `${req.title} (#${match.installmentNumber}/${totalInst || installments.length})`,
                      isReviewed: req.review_status === "REVIEWED",
                    });
                  } else if (!installments || installments.length === 0) {
                    const dStr = String(req.due_date || req.request_date || "").split("T")[0];
                    if (dStr === cell.dateStr) {
                      cellItems.push({
                        id: `${req.id}-standard`,
                        request: req,
                        isProjected: false,
                        isPaid: parseRequestStatus(req.status) === RequestStatus.Completed,
                        amount: req.amount,
                        currency: req.currency || "USD",
                        displayTitle: req.title,
                        isReviewed: req.review_status === "REVIEWED",
                      });
                    }
                  }
                });
              }

              const todayStr = new Date().toISOString().split("T")[0];
              const isToday = cell.isCurrentMonth && todayStr === cell.dateStr;

              return (
                <div
                  key={idx}
                  className={`min-h-[120px] p-2 rounded-lg border transition-all flex flex-col justify-between ${
                    cell.isCurrentMonth
                      ? isToday
                        ? "bg-sky-50/20 dark:bg-sky-950/20 border-sky-300 dark:border-sky-800 ring-1 ring-sky-400/50"
                        : "bg-card border-slate-200/80 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700"
                      : "bg-slate-50/40 dark:bg-zinc-900/20 border-transparent text-slate-400 opacity-40 select-none"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold ${
                        isToday
                          ? "bg-sky-600 text-white rounded-full w-5 h-5 flex items-center justify-center shadow-xs"
                          : "text-slate-700 dark:text-zinc-300"
                      }`}
                    >
                      {cell.day}
                    </span>
                    {cellItems.length > 0 && (
                      <span className="text-[10px] font-bold text-slate-600 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded-full">
                        {cellItems.length}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5 mt-1 flex-1 overflow-y-auto max-h-[90px] scrollbar-hide">
                    {cellItems.map((item) => {
                      const isItemReviewed = item.isReviewed;
                      if (item.isProjected) {
                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              setSelectedCalendarItem(item.request);
                              setSelectedCalendarInstallment({
                                installmentNumber: item.installmentNumber,
                                totalInstallments: item.totalInstallments,
                                amount: item.amount,
                                currency: item.currency,
                                dueDate: cell.dateStr,
                                isProjected: true,
                                isPaid: false,
                              });
                            }}
                            className="w-full text-left p-1.5 rounded-md text-[11px] font-medium border shadow-2xs transition-all hover:scale-[1.02] cursor-pointer bg-slate-50/90 text-slate-800 border-dashed border-indigo-300 dark:bg-zinc-800/60 dark:text-zinc-200 dark:border-indigo-700/60"
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="truncate font-medium text-slate-800 dark:text-zinc-200">
                                {item.displayTitle}
                              </span>
                              <div className="flex items-center gap-1 shrink-0">
                                <span className={`text-[8px] font-bold px-1 py-0.2 rounded border ${PRIORITY_BADGE[(item.request.priority as Priority) || "MEDIUM"]}`}>
                                  {item.request.priority || "MEDIUM"}
                                </span>
                                <span className="text-[9px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/80 px-1 rounded border border-indigo-200 dark:border-indigo-800 shrink-0">
                                  Proj
                                </span>
                              </div>
                            </div>
                            <div className="text-[10px] font-bold text-slate-600 dark:text-zinc-400 mt-0.5">
                              {formatMoney(item.amount, item.currency)}
                            </div>
                          </button>
                        );
                      }

                      if (item.isPaid) {
                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              setSelectedCalendarItem(item.request);
                              setSelectedCalendarInstallment({
                                installmentNumber: item.installmentNumber,
                                totalInstallments: item.totalInstallments,
                                amount: item.amount,
                                currency: item.currency,
                                dueDate: cell.dateStr,
                                isProjected: false,
                                isPaid: true,
                              });
                            }}
                            className="w-full text-left p-1.5 rounded-md text-[11px] font-medium border shadow-2xs transition-all hover:scale-[1.02] cursor-pointer bg-emerald-50/90 text-emerald-950 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-800/80"
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="truncate font-semibold text-emerald-950 dark:text-emerald-100">
                                {item.displayTitle}
                              </span>
                              <div className="flex items-center gap-1 shrink-0">
                                <span className={`text-[8px] font-bold px-1 py-0.2 rounded border ${PRIORITY_BADGE[(item.request.priority as Priority) || "MEDIUM"]}`}>
                                  {item.request.priority || "MEDIUM"}
                                </span>
                                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                              </div>
                            </div>
                            <div className="text-[10px] font-bold opacity-85 mt-0.5">
                              {formatMoney(item.amount, item.currency)}
                            </div>
                          </button>
                        );
                      }

                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setSelectedCalendarItem(item.request);
                            setSelectedCalendarInstallment({
                              installmentNumber: item.installmentNumber,
                              totalInstallments: item.totalInstallments,
                              amount: item.amount,
                              currency: item.currency,
                              dueDate: cell.dateStr,
                              isProjected: false,
                              isPaid: false,
                            });
                          }}
                          className={`w-full text-left p-1.5 rounded-md text-[11px] font-medium border shadow-2xs transition-all hover:scale-[1.02] cursor-pointer ${
                            isItemReviewed
                              ? "bg-sky-50/90 text-sky-950 border-sky-200/90 hover:bg-sky-100 dark:bg-sky-950/40 dark:text-sky-200 dark:border-sky-800/80"
                              : "bg-amber-50/90 text-amber-950 border-amber-200/90 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-800/80"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="truncate font-semibold text-slate-900 dark:text-zinc-100">
                              {item.displayTitle}
                            </span>
                            <div className="flex items-center gap-1 shrink-0">
                              <span className={`text-[8px] font-bold px-1 py-0.2 rounded border ${PRIORITY_BADGE[(item.request.priority as Priority) || "MEDIUM"]}`}>
                                {item.request.priority || "MEDIUM"}
                              </span>
                              <span
                                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                  isItemReviewed ? "bg-sky-500" : "bg-amber-500"
                                }`}
                              />
                            </div>
                          </div>
                          <div className="text-[10px] font-bold opacity-85 mt-0.5">
                            {formatMoney(item.amount, item.currency)}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Calendar Item Quick Preview Modal */}
      {selectedCalendarItem && (
        <Dialog
          open={!!selectedCalendarItem}
          onOpenChange={(open) => !open && setSelectedCalendarItem(null)}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-muted-foreground">
                  #{selectedCalendarItem.id}
                </span>
                <div className="flex items-center gap-1.5">
                  <PrioritySelector
                    requestId={selectedCalendarItem.id}
                    priority={selectedCalendarItem.priority}
                    size="xs"
                  />
                  <Badge
                    variant="outline"
                    className={getStatusBadge(selectedCalendarItem.status)}
                  >
                    {getStatusLabel(selectedCalendarItem.status)}
                    {selectedCalendarItem.recurring_schedule ? (
                      parseRequestStatus(selectedCalendarItem.status) === RequestStatus.Completed
                        ? (selectedCalendarItem.recurring_schedule.total_installments ? ` (${selectedCalendarItem.recurring_schedule.total_installments}/${selectedCalendarItem.recurring_schedule.total_installments} Cycles)` : "")
                        : (selectedCalendarItem.recurring_schedule.total_installments
                          ? ` (Cycle ${Math.min((selectedCalendarItem.recurring_schedule.completed_installments || 0) + 1, selectedCalendarItem.recurring_schedule.total_installments)}/${selectedCalendarItem.recurring_schedule.total_installments})`
                          : ` (Cycle ${(selectedCalendarItem.recurring_schedule.completed_installments || 0) + 1})`)
                    ) : ""}
                  </Badge>
                </div>
              </div>
              <DialogTitle className="text-lg font-bold mt-1">
                {selectedCalendarItem.title}
              </DialogTitle>
              <DialogDescription>
                Recurring subscription item details and review status.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-3 border-y text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-bold text-slate-900 dark:text-zinc-100">
                  {formatMoney(
                    selectedCalendarInstallment?.amount ?? selectedCalendarItem.amount,
                    selectedCalendarInstallment?.currency || selectedCalendarItem.currency || "USD"
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Next Due Date:</span>
                <span className="font-medium">
                  {selectedCalendarItem.due_date
                    ? formatDate(selectedCalendarItem.due_date)
                    : formatDate(selectedCalendarItem.request_date)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Requester:</span>
                <span className="font-medium">{selectedCalendarItem.requester}</span>
              </div>
              {selectedCalendarItem.item_url && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Product Link:</span>
                  <a
                    href={selectedCalendarItem.item_url.startsWith("http") ? selectedCalendarItem.item_url : `https://${selectedCalendarItem.item_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400 hover:underline text-xs"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Open Product Page</span>
                  </a>
                </div>
              )}
              {selectedCalendarItem.recurring_schedule?.is_scheduled && (
                <>
                  <div className="flex justify-between items-center bg-indigo-50/60 dark:bg-indigo-950/30 p-2 rounded border border-indigo-100 dark:border-indigo-900/50">
                    <span className="text-indigo-900 dark:text-indigo-200 font-medium">Schedule Horizon:</span>
                    <Badge variant="outline" className="bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-900 dark:text-indigo-200 font-semibold">
                      {formatRemainingDuration(selectedCalendarItem.recurring_schedule.end_date).text}
                    </Badge>
                  </div>
                  {selectedCalendarInstallment?.installmentNumber && (
                    <div className="flex justify-between text-xs text-slate-600 dark:text-zinc-400">
                      <span>Milestone Cycle:</span>
                      <span className="font-semibold text-slate-900 dark:text-zinc-100">
                        Installment #{selectedCalendarInstallment.installmentNumber} of {selectedCalendarInstallment.totalInstallments || selectedCalendarItem.recurring_schedule.total_installments}
                        {selectedCalendarInstallment.isProjected ? " (Projected)" : selectedCalendarInstallment.isPaid ? " (Settled)" : " (Current)"}
                      </span>
                    </div>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full text-indigo-600 border-indigo-200 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-300 text-xs cursor-pointer"
                    onClick={() => {
                      setScheduleModalRequest(selectedCalendarItem);
                    }}
                  >
                    <CalendarClock className="h-3.5 w-3.5 mr-1" />
                    View Full Payment Schedule / Ledger
                  </Button>
                </>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Department:</span>
                <span>{selectedCalendarItem.department}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Review Status:</span>
                <Badge
                  variant="outline"
                  className={
                    selectedCalendarItem.review_status === "REVIEWED"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                      : "bg-amber-50 text-amber-700 border-amber-300"
                  }
                >
                  {selectedCalendarItem.review_status === "REVIEWED"
                    ? "Reviewed"
                    : "Waiting for Review"}
                </Badge>
              </div>
              {selectedCalendarItem.description && (
                <div className="pt-2">
                  <span className="text-xs font-semibold text-muted-foreground">
                    Description:
                  </span>
                  <p className="text-xs text-slate-700 dark:text-zinc-300 mt-1 bg-slate-50 dark:bg-zinc-800 p-2 rounded">
                    {selectedCalendarItem.description}
                  </p>
                </div>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              {canManageRecurring && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const itm = selectedCalendarItem;
                    setSelectedCalendarItem(null);
                    handleOpenEdit(itm);
                  }}
                >
                  Edit Request
                </Button>
              )}
              <Button
                size="sm"
                onClick={() =>
                  navigate(`/purchasing/requests/${selectedCalendarItem.id}`)
                }
              >
                Open Full Request
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Create Recurring Request Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="w-[96vw] max-w-[96vw] sm:max-w-[1440px] 2xl:max-w-[1600px] max-h-[92vh] overflow-y-auto p-6 sm:p-8 rounded-2xl">
          <form onSubmit={handleCreateSubmit} className="space-y-5">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/50 shadow-2xs shrink-0">
                  <CalendarClock className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold text-slate-900 dark:text-zinc-100">
                    Create Recurring Payment Request
                  </DialogTitle>
                  <DialogDescription className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                    Add a new recurring software license, subscription, or lease with automated or custom milestone installments.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 py-2">
              {/* Left Column: General Request Details */}
              <div className="lg:col-span-6 space-y-4 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                    Title / Service Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="e.g. AWS Cloud Infrastructure, Zoom Enterprise"
                    value={newForm.title}
                    onChange={(e) =>
                      setNewForm({ ...newForm, title: e.target.value })
                    }
                    className="h-10 text-sm font-medium"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                        Amount (USD) <span className="text-red-500">*</span>
                      </label>
                      {newForm.is_scheduled && newForm.frequency === "CUSTOM" && (
                        <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
                          (Installments)
                        </span>
                      )}
                      {newForm.is_scheduled && newForm.frequency !== "CUSTOM" && (
                        <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
                          (Per cycle)
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-semibold">$</span>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={
                          newForm.is_scheduled && newForm.frequency === "CUSTOM" && newForm.schedule_dates.length > 0
                            ? (newForm.schedule_dates.reduce((acc, itm) => acc + (itm.amount != null ? itm.amount : 0), 0) || "").toString()
                            : newForm.amount
                        }
                        onChange={(e) =>
                          setNewForm({ ...newForm, amount: e.target.value })
                        }
                        disabled={newForm.is_scheduled && newForm.frequency === "CUSTOM"}
                        className="h-10 text-sm font-mono pl-7 disabled:opacity-75 disabled:bg-slate-100 dark:disabled:bg-zinc-800 disabled:cursor-not-allowed"
                        required={!(newForm.is_scheduled && newForm.frequency === "CUSTOM")}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                      Frequency <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={newForm.frequency}
                      onValueChange={(val: any) => setNewForm({ ...newForm, frequency: val })}
                    >
                      <SelectTrigger className="h-10 text-sm bg-white dark:bg-zinc-950">
                        <SelectValue placeholder="Frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MONTHLY">Monthly</SelectItem>
                        <SelectItem value="ANNUALLY">Annually</SelectItem>
                        <SelectItem value="WEEKLY">Weekly</SelectItem>
                        <SelectItem value="BI_WEEKLY">Bi-Weekly</SelectItem>
                        <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                        <SelectItem value="SEMI_ANNUALLY">Semi-Annually</SelectItem>
                        <SelectItem value="DAILY">Daily</SelectItem>
                        <SelectItem value="CUSTOM">Custom Dates</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Next Due Date</label>
                      {newForm.is_scheduled && newForm.frequency === "CUSTOM" && (
                        <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
                          (From Schedule)
                        </span>
                      )}
                    </div>
                    <Input
                      type="date"
                      value={
                        newForm.is_scheduled && newForm.frequency === "CUSTOM" && newForm.schedule_dates.length > 0
                          ? (newForm.schedule_dates[0]?.date || newForm.due_date)
                          : (newForm.due_date || newForm.start_date)
                      }
                      onChange={(e) =>
                        setNewForm({ ...newForm, due_date: e.target.value })
                      }
                      disabled={newForm.is_scheduled && newForm.frequency === "CUSTOM"}
                      className="h-10 text-sm disabled:opacity-75 disabled:bg-slate-100 dark:disabled:bg-zinc-800 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <RequesterAutocomplete
                    required
                    value={newForm.requester}
                    onChange={(val) => {
                      const matched = usersList.find(
                        (u) =>
                          (u.full_name && u.full_name.toLowerCase() === val.toLowerCase().trim()) ||
                          (u.email && u.email.toLowerCase() === val.toLowerCase().trim())
                      );
                      const dept = (matched?.department && matched.department.trim() && matched.department.toUpperCase() !== "REQUESTER")
                        ? matched.department.trim()
                        : (matched ? resolveUserDepartment(matched, rolesList) : "");
                      setNewForm((prev) => ({ ...prev, requester: val, department: dept || prev.department }));
                    }}
                    onSelectUser={(selectedUser) => {
                      const dept = (selectedUser?.department && selectedUser.department.trim() && selectedUser.department.toUpperCase() !== "REQUESTER")
                        ? selectedUser.department.trim()
                        : resolveUserDepartment(selectedUser, rolesList);
                      if (dept) {
                        setNewForm((prev) => ({ ...prev, department: dept }));
                      }
                    }}
                    users={usersList}
                    roles={rolesList}
                  />

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                      Department <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={newForm.department}
                      onChange={(e) =>
                        setNewForm({ ...newForm, department: e.target.value })
                      }
                      placeholder="e.g. Finance"
                      className="h-10 text-sm"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                      Priority <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={newForm.priority}
                      onValueChange={(val) =>
                        setNewForm({ ...newForm, priority: val })
                      }
                    >
                      <SelectTrigger className="h-10 text-sm">
                        <SelectValue placeholder="Priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW">Low</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="URGENT">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="w-full">
                  <LocationAutocomplete
                    value={newForm.location}
                    onChange={(val) => setNewForm((prev) => ({ ...prev, location: val }))}
                    placeholder="Search or enter location..."
                    label="Location"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center justify-between">
                    <span>Product / Vendor Link (URL)</span>
                    {newForm.item_url && (
                      <a
                        href={newForm.item_url.startsWith("http") ? newForm.item_url : `https://${newForm.item_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Test Link</span>
                      </a>
                    )}
                  </label>
                  <Input
                    type="url"
                    value={newForm.item_url}
                    onChange={(e) =>
                      setNewForm({ ...newForm, item_url: e.target.value })
                    }
                    placeholder="https://example.com/product-or-subscription"
                    className="h-10 text-sm font-mono text-xs"
                  />
                </div>

                <div className="space-y-1.5 flex-1 flex flex-col">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Description / Terms</label>
                  <textarea
                    className="w-full text-sm rounded-lg border border-input bg-background px-3 py-2.5 flex-1 min-h-[95px] focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                    placeholder="Monthly billing schedule, renewal terms, invoice reference..."
                    value={newForm.description}
                    onChange={(e) =>
                      setNewForm({ ...newForm, description: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Right Column: Schedule Dates Builder */}
              <div className="lg:col-span-6 flex flex-col h-full">
                <ScheduleDatesBuilder
                  isScheduled={newForm.is_scheduled}
                  onIsScheduledChange={(val) => setNewForm((p) => ({ ...p, is_scheduled: val }))}
                  frequency={newForm.frequency}
                  onFrequencyChange={(val) => setNewForm((p) => ({ ...p, frequency: val }))}
                  startDate={newForm.start_date}
                  onStartDateChange={(val) => setNewForm((p) => ({ ...p, start_date: val }))}
                  endDate={newForm.end_date}
                  onEndDateChange={(val) => setNewForm((p) => ({ ...p, end_date: val }))}
                  scheduleDates={newForm.schedule_dates}
                  onScheduleDatesChange={(dates) => setNewForm((p) => ({ ...p, schedule_dates: dates }))}
                  baseAmount={parseFloat(newForm.amount) || 0}
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5">
                {createMutation.isPending ? "Creating..." : "Create Recurring Request"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Recurring Request Modal */}
      {isEditOpen && editingRequest && (
        <Dialog open={isEditOpen} onOpenChange={(open) => {
          if (!open) {
            handleCloseEdit();
          }
        }}>
          <DialogContent className="w-[96vw] max-w-[96vw] sm:max-w-[1440px] 2xl:max-w-[1600px] max-h-[92vh] overflow-y-auto p-6 sm:p-8 rounded-2xl">
            <form onSubmit={handleEditSubmit} className="space-y-5">
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/50 shadow-2xs shrink-0">
                    <Edit2 className="h-5 w-5" />
                  </div>
                  <div>
                    <DialogTitle className="text-xl font-bold text-slate-900 dark:text-zinc-100">
                      Edit Recurring Request #{editForm.id}
                    </DialogTitle>
                    <DialogDescription className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                      Update recurring terms, billing dates, or individual milestones.
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 py-2">
                {/* Left Column: General Request Details */}
                <div className="lg:col-span-6 space-y-4 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                      Title / Service Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={editForm.title}
                      onChange={(e) =>
                        setEditForm({ ...editForm, title: e.target.value })
                      }
                      className="h-10 text-sm font-medium"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                          Amount (USD) <span className="text-red-500">*</span>
                        </label>
                        {editForm.is_scheduled && editForm.frequency === "CUSTOM" && (
                          <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
                            (Installments)
                          </span>
                        )}
                        {editForm.is_scheduled && editForm.frequency !== "CUSTOM" && (
                          <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
                            (Per cycle)
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-semibold">$</span>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={
                            editForm.is_scheduled && editForm.frequency === "CUSTOM" && editForm.schedule_dates.length > 0
                              ? (editForm.schedule_dates.reduce((acc, itm) => acc + (itm.amount != null ? itm.amount : 0), 0) || "").toString()
                              : editForm.amount
                          }
                          onChange={(e) =>
                            setEditForm({ ...editForm, amount: e.target.value })
                          }
                          disabled={editForm.is_scheduled && editForm.frequency === "CUSTOM"}
                          className="h-10 text-sm font-mono pl-7 disabled:opacity-75 disabled:bg-slate-100 dark:disabled:bg-zinc-800 disabled:cursor-not-allowed"
                          required={!(editForm.is_scheduled && editForm.frequency === "CUSTOM")}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                        Frequency <span className="text-red-500">*</span>
                      </label>
                      <Select
                        value={editForm.frequency}
                        onValueChange={(val: any) => setEditForm({ ...editForm, frequency: val })}
                      >
                        <SelectTrigger className="h-10 text-sm bg-white dark:bg-zinc-950">
                          <SelectValue placeholder="Frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MONTHLY">Monthly</SelectItem>
                          <SelectItem value="ANNUALLY">Annually</SelectItem>
                          <SelectItem value="WEEKLY">Weekly</SelectItem>
                          <SelectItem value="BI_WEEKLY">Bi-Weekly</SelectItem>
                          <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                          <SelectItem value="SEMI_ANNUALLY">Semi-Annually</SelectItem>
                          <SelectItem value="DAILY">Daily</SelectItem>
                          <SelectItem value="CUSTOM">Custom Dates</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Next Due Date</label>
                        {editForm.is_scheduled && editForm.frequency === "CUSTOM" && (
                          <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
                            (From Schedule)
                          </span>
                        )}
                      </div>
                      <Input
                        type="date"
                        value={
                          editForm.is_scheduled && editForm.frequency === "CUSTOM" && editForm.schedule_dates.length > 0
                            ? (editForm.schedule_dates[0]?.date || editForm.due_date)
                            : (editForm.due_date || editForm.start_date)
                        }
                        onChange={(e) =>
                          setEditForm({ ...editForm, due_date: e.target.value })
                        }
                        disabled={editForm.is_scheduled && editForm.frequency === "CUSTOM"}
                        className="h-10 text-sm disabled:opacity-75 disabled:bg-slate-100 dark:disabled:bg-zinc-800 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <RequesterAutocomplete
                      required
                      value={editForm.requester}
                      onChange={(val) => {
                        const matched = usersList.find(
                          (u) =>
                            (u.full_name && u.full_name.toLowerCase() === val.toLowerCase().trim()) ||
                            (u.email && u.email.toLowerCase() === val.toLowerCase().trim())
                        );
                        const dept = (matched?.department && matched.department.trim() && matched.department.toUpperCase() !== "REQUESTER")
                          ? matched.department.trim()
                          : (matched ? resolveUserDepartment(matched, rolesList) : "");
                        setEditForm((prev) => ({ ...prev, requester: val, department: dept || prev.department }));
                      }}
                      onSelectUser={(selectedUser) => {
                        const dept = (selectedUser?.department && selectedUser.department.trim() && selectedUser.department.toUpperCase() !== "REQUESTER")
                          ? selectedUser.department.trim()
                          : resolveUserDepartment(selectedUser, rolesList);
                        if (dept) {
                          setEditForm((prev) => ({ ...prev, department: dept }));
                        }
                      }}
                      users={usersList}
                      roles={rolesList}
                    />

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                        Department <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={editForm.department}
                        onChange={(e) =>
                          setEditForm({ ...editForm, department: e.target.value })
                        }
                        placeholder="e.g. Finance"
                        className="h-10 text-sm"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                        Priority <span className="text-red-500">*</span>
                      </label>
                      <Select
                        value={editForm.priority}
                        onValueChange={(val) =>
                          setEditForm({ ...editForm, priority: val })
                        }
                      >
                        <SelectTrigger className="h-10 text-sm">
                          <SelectValue placeholder="Priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LOW">Low</SelectItem>
                          <SelectItem value="MEDIUM">Medium</SelectItem>
                          <SelectItem value="HIGH">High</SelectItem>
                          <SelectItem value="URGENT">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="w-full">
                    <LocationAutocomplete
                      value={editForm.location}
                      onChange={(val) => setEditForm((prev) => ({ ...prev, location: val }))}
                      placeholder="Search or enter location..."
                      label="Location"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center justify-between">
                      <span>Product / Vendor Link (URL)</span>
                      {editForm.item_url && (
                        <a
                          href={editForm.item_url.startsWith("http") ? editForm.item_url : `https://${editForm.item_url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Open Link</span>
                        </a>
                      )}
                    </label>
                    <Input
                      type="url"
                      value={editForm.item_url}
                      onChange={(e) =>
                        setEditForm({ ...editForm, item_url: e.target.value })
                      }
                      placeholder="https://example.com/product-or-subscription"
                      className="h-10 text-sm font-mono text-xs"
                    />
                  </div>

                  <div className="space-y-1.5 flex-1 flex flex-col">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Description / Terms</label>
                    <textarea
                      className="w-full text-sm rounded-lg border border-input bg-background px-3 py-2.5 flex-1 min-h-[95px] focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                      placeholder="Monthly billing schedule, renewal terms, invoice reference..."
                      value={editForm.description}
                      onChange={(e) =>
                        setEditForm({ ...editForm, description: e.target.value })
                      }
                    />
                  </div>
                </div>

                {/* Right Column: Schedule Dates Builder */}
                <div className="lg:col-span-6 flex flex-col h-full">
                  <ScheduleDatesBuilder
                    isScheduled={editForm.is_scheduled}
                    onIsScheduledChange={(val) => setEditForm((p) => ({ ...p, is_scheduled: val }))}
                    frequency={editForm.frequency}
                    onFrequencyChange={(val) => setEditForm((p) => ({ ...p, frequency: val }))}
                    startDate={editForm.start_date}
                    onStartDateChange={(val) => setEditForm((p) => ({ ...p, start_date: val }))}
                    endDate={editForm.end_date}
                    onEndDateChange={(val) => setEditForm((p) => ({ ...p, end_date: val }))}
                    scheduleDates={editForm.schedule_dates}
                    onScheduleDatesChange={(dates) => setEditForm((p) => ({ ...p, schedule_dates: dates }))}
                    baseAmount={parseFloat(editForm.amount) || 0}
                  />
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseEdit}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5">
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!requestToDelete} onOpenChange={(open) => !open && setRequestToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Recurring Payment?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong className="text-slate-900 dark:text-zinc-100">{requestToDelete?.title}</strong> (ID #{requestToDelete?.id})? This will permanently remove the recurring payment schedule and all associated cycle records. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (requestToDelete) {
                  deleteMutation.mutate(requestToDelete.id);
                }
              }}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Payment"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Schedule Breakdown Ledger Modal */}
      <ScheduleBreakdownModal
        request={scheduleModalRequest}
        open={!!scheduleModalRequest}
        onOpenChange={(open) => !open && setScheduleModalRequest(null)}
        // Without onEditRequest the modal links to the request detail page instead.
        onEditRequest={canManageRecurring ? (req) => {
          setScheduleModalRequest(null);
          handleOpenEdit(req);
        } : undefined}
        onEditWireInfo={canManageRecurring ? (req) => {
          setScheduleModalRequest(null);
          setWireModalRequest(req);
        } : undefined}
      />

      {/* Wire Transfer Dialog (Edit / Record Wire Info for Scheduled Payment) */}
      {wireModalRequest && (
        <WireTransferDialog
          open={!!wireModalRequest}
          onOpenChange={(open) => !open && setWireModalRequest(null)}
          request={wireModalRequest}
          initialData={(wireModalRequest as any)?.wire_transfer}
          isEditMode={Boolean((wireModalRequest as any)?.wire_transfer)}
          isSubmitting={isUpdatingWire}
          onConfirm={handleSaveWire}
        />
      )}
    </div>
  );
}
