import { FloatingVerticalFilter } from "@/components/ui/FloatingVerticalFilter";
import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { usePurchaseRequests, usePurchasingSummary } from "@/hooks/usePurchasing";
import { ChevronRight } from "lucide-react";
import { formatMoney } from "@/pages/Purchasing/purchasingMeta";
import { RequestStatus } from "@/types/purchasing";
import { parseRequestStatus } from "@/lib/requestStatus";
import {
  Activity, AlertTriangle, ReceiptText, CalendarCheck, Search, X, UserCheck, ShieldCheck, Check,
  ChevronDown, Sparkles, Building2, Users, RefreshCw, AlertCircle, CheckCircle2, ChevronsUpDown, CheckSquare
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import HelpIcon from "@/components/ui/HelpIcon";
import TaskBoard from "@/components/Tasks/TaskBoard";
import TaskList from "@/components/Tasks/TaskList";
import TaskDetailPanel from "@/components/Tasks/TaskDetailPanel";
import { apiClient as api } from "@/services/apiClient";
import { toast } from "sonner";

export default function Dashboard() {
  const kpiRef = useRef<HTMLDivElement>(null);
  // Approver Assignment Modal State
  const [isApproverModalOpen, setIsApproverModalOpen] = useState(false);
  const [workflowAssignments, setWorkflowAssignments] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [activeDropdownRole, setActiveDropdownRole] = useState<string | null>(null);
  const [userSearchText, setUserSearchText] = useState("");
  const [graphSearchResults, setGraphSearchResults] = useState<any[]>([]);
  const [isSearchingGraph, setIsSearchingGraph] = useState(false);

  // Department Approvers State in Dashboard
  const [deptApprovers, setDeptApprovers] = useState<any[]>([]);
  const [isDeptLoading, setIsDeptLoading] = useState(false);
  const [openPopoverDept, setOpenPopoverDept] = useState<string | null>(null);
  const [deptApproverSearch, setDeptApproverSearch] = useState("");
  const [savingDept, setSavingDept] = useState<string | null>(null);
  const [deptTableSearch, setDeptTableSearch] = useState("");

  // Multi-select state for Department Approvers
  const [selectedDepts, setSelectedDepts] = useState<string[]>([]);
  const [isBatchPopoverOpen, setIsBatchPopoverOpen] = useState(false);
  const [batchSearchText, setBatchSearchText] = useState("");
  const [isBatchSaving, setIsBatchSaving] = useState(false);

  // Debounced search for Graph Entra users
  useEffect(() => {
    if (!userSearchText || userSearchText.trim().length < 2) {
      setGraphSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearchingGraph(true);
      try {
        const res = await api.get<any[]>(`/graph/users/search?q=${encodeURIComponent(userSearchText.trim())}`);
        setGraphSearchResults(Array.isArray(res) ? res : []);
      } catch (err) {
        console.warn("Graph search failed or unavailable:", err);
        setGraphSearchResults([]);
      } finally {
        setIsSearchingGraph(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [userSearchText]);
  const [isSavingAssignments, setIsSavingAssignments] = useState(false);

  const fetchWorkflowAssignments = async () => {
    setIsDeptLoading(true);
    try {
      const [assnRes, userRes, deptApprRes] = await Promise.all([
        api.get<any[]>("/purchasing/assignments"),
        api.get<any>("/configuration/users?is_active=true"),
        api.get<any[]>("/purchasing/department-approvers").catch(() => []),
      ]);
      setWorkflowAssignments(assnRes || []);
      setAllUsers(Array.isArray(userRes) ? userRes : (userRes as any).items || []);
      setDeptApprovers(deptApprRes || []);
    } catch (err) {
      console.error("Failed to fetch workflow assignments:", err);
    } finally {
      setIsDeptLoading(false);
    }
  };

  const handleOpenApproverModal = () => {
    fetchWorkflowAssignments();
    setIsApproverModalOpen(true);
  };

  const handleSelectDepartmentApprover = async (deptName: string, selectedUser: any | null) => {
    setSavingDept(deptName);
    const userId = selectedUser ? selectedUser.id : null;
    try {
      await api.post("/purchasing/department-approvers/assign", {
        department: deptName,
        user_id: userId,
        user_ids: userId ? [userId] : []
      });

      setDeptApprovers(prev => prev.map(d => {
        if (d.department.toLowerCase() === deptName.toLowerCase()) {
          return {
            ...d,
            approver_id: userId,
            approver_name: selectedUser ? (selectedUser.full_name || selectedUser.email) : null,
            approver_email: selectedUser ? selectedUser.email : null,
            approver_title: selectedUser ? selectedUser.job_title : null,
            approver_ids: userId ? [userId] : null,
            source: userId ? "MANUAL" : "UNASSIGNED"
          };
        }
        return d;
      }));

      if (selectedUser) {
        toast.success(`Assigned ${selectedUser.full_name || selectedUser.email} as Level 1 Approver for ${deptName}`);
      } else {
        toast.info(`Cleared Level 1 Approver for ${deptName}`);
      }
      setOpenPopoverDept(null);
      setDeptApproverSearch("");
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || "Failed to update department approver");
    } finally {
      setSavingDept(null);
    }
  };

  // Multi-select handlers for departments in Dashboard
  const handleToggleSelectDept = (deptName: string) => {
    setSelectedDepts(prev =>
      prev.includes(deptName) ? prev.filter(d => d !== deptName) : [...prev, deptName]
    );
  };

  const handleToggleSelectAll = (visibleDeptNames: string[]) => {
    const allSelected = visibleDeptNames.length > 0 && visibleDeptNames.every(d => selectedDepts.includes(d));
    if (allSelected) {
      setSelectedDepts(prev => prev.filter(d => !visibleDeptNames.includes(d)));
    } else {
      setSelectedDepts(prev => Array.from(new Set([...prev, ...visibleDeptNames])));
    }
  };

  const handleBatchAssignApprover = async (selectedUser: any | null) => {
    if (selectedDepts.length === 0) return;
    setIsBatchSaving(true);
    const userId = selectedUser ? selectedUser.id : null;
    try {
      await api.post("/purchasing/department-approvers/batch-assign", {
        departments: selectedDepts,
        user_id: userId,
        user_ids: userId ? [userId] : []
      });

      const targetDeptsLower = new Set(selectedDepts.map(d => d.toLowerCase()));
      setDeptApprovers(prev => prev.map(d => {
        if (targetDeptsLower.has(d.department.toLowerCase())) {
          return {
            ...d,
            approver_id: userId,
            approver_name: selectedUser ? (selectedUser.full_name || selectedUser.email) : null,
            approver_email: selectedUser ? selectedUser.email : null,
            approver_title: selectedUser ? selectedUser.job_title : null,
            approver_ids: userId ? [userId] : null,
            source: userId ? "MANUAL" : "UNASSIGNED"
          };
        }
        return d;
      }));

      if (selectedUser) {
        toast.success(`Assigned ${selectedUser.full_name || selectedUser.email} to ${selectedDepts.length} departments`);
      } else {
        toast.info(`Cleared approver for ${selectedDepts.length} departments`);
      }

      setSelectedDepts([]);
      setIsBatchPopoverOpen(false);
      setBatchSearchText("");
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || "Failed to batch assign department approvers");
    } finally {
      setIsBatchSaving(false);
    }
  };

  const handleToggleUserInRole = (role: string, userId: string, extraUserObj?: any) => {
    if (extraUserObj && !allUsers.some(u => u.id === userId || u.email === extraUserObj.email)) {
      setAllUsers(prev => [...prev, { id: userId, full_name: extraUserObj.display_name, email: extraUserObj.email, ...extraUserObj }]);
    }
    setWorkflowAssignments((prev) => {
      const existing = prev.find((a) => a.role === role);
      if (existing) {
        const currentIds: string[] = existing.user_ids || (existing.user_id ? [existing.user_id] : []);
        const nextIds = currentIds.includes(userId)
          ? currentIds.filter((id) => id !== userId)
          : [...currentIds, userId];
        return prev.map((a) => (a.role === role ? { ...a, user_ids: nextIds, user_id: nextIds[0] || null } : a));
      } else {
        return [...prev, { id: 0, role, user_ids: [userId], user_id: userId, active: true }];
      }
    });
  };

  const handleToggleEntraUser = async (role: string, entraUser: any) => {
    const matchingLocal = allUsers.find(u => 
      (u.microsoft_object_id && u.microsoft_object_id === entraUser.object_id) ||
      (u.email && entraUser.email && u.email.toLowerCase() === entraUser.email.toLowerCase())
    );
    const userId = matchingLocal ? matchingLocal.id : (entraUser.object_id || entraUser.email);
    handleToggleUserInRole(role, userId, { ...entraUser, id: userId });
  };

  const handleSaveApproverAssignments = async () => {
    setIsSavingAssignments(true);
    try {
      for (const item of workflowAssignments) {
        const role = item.role;
        const userIds: string[] = item.user_ids || (item.user_id ? [item.user_id] : []);

        // Sync HIGH_LEVEL_APPROVER / LOW_LEVEL_APPROVER via dedicated approver role API
        if (role === "EXECUTIVE" || role === "MANAGER") {
          const approverRoleCode = role === "EXECUTIVE" ? "HIGH_LEVEL_APPROVER" : "LOW_LEVEL_APPROVER";
          const membersToProvision = userIds.map(uid => {
            const u = allUsers.find(x => x.id === uid) || {};
            return {
              object_id: u.microsoft_object_id || u.object_id || uid,
              email: u.email || "",
              display_name: u.full_name || u.display_name || "",
              job_title: u.job_title || null,
              department: u.department || null,
            };
          }).filter(m => m.email);

          if (membersToProvision.length > 0) {
            try {
              await api.post(`/approver-roles/${approverRoleCode}/members`, membersToProvision);
            } catch (roleErr) {
              console.warn(`Approver role sync note for ${approverRoleCode}:`, roleErr);
            }
          }
        }

        const payload = {
          role: item.role,
          user_ids: userIds,
          user_id: userIds[0] || null,
          active: true,
        };
        if (item.id && item.id > 0) {
          await api.put(`/purchasing/assignments/${item.id}`, payload);
        } else {
          await api.post("/purchasing/assignments", payload);
        }
      }
      toast.success("Approver assignments updated successfully");
      setIsApproverModalOpen(false);
      fetchWorkflowAssignments();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update approver assignments");
    } finally {
      setIsSavingAssignments(false);
    }
  };

  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: requests = [], refetch: fetchRequests } = usePurchaseRequests();
  const { data: purchasingSummary } = usePurchasingSummary();
  const recurringDueCount = purchasingSummary?.recurring_due_soon_count ?? 0;
  const recurringDueAmount = purchasingSummary?.recurring_due_soon_amount ?? 0;
  const [searchQuery, setSearchQuery] = useState("");
  const [dashboardFilter, setDashboardFilter] = useState<string>("ALL");
  const [selectedTask, setSelectedTask] = useState<any>(null);



  const isTaskOwnedByUser = (task: any, currentUser: any) => {
    if (!currentUser) return false;
    const userFull = (currentUser.full_name || "").trim().toLowerCase();
    const userEmail = (currentUser.email || "").trim().toLowerCase();
    const userName = (currentUser.username || "").trim().toLowerCase();
    const userId = String(currentUser.id || "").trim();

    const reqStr = String(task.requester || task.requester_name || "").trim().toLowerCase();
    const createdByStr = String(task.created_by || task.created_by_name || task.created_by_user_id || task.user_id || "").trim().toLowerCase();
    const reqIdStr = String(task.requester_id || "").trim();

    return Boolean(
      (userFull && reqStr === userFull) ||
      (userEmail && reqStr === userEmail) ||
      (userName && reqStr === userName) ||
      (userId && (userId === reqIdStr || userId === createdByStr || userId === reqStr)) ||
      (userFull && createdByStr === userFull) ||
      (userEmail && createdByStr === userEmail)
    );
  };

  const tasks = useMemo(() => {
    return requests
      .filter((req: any) => {
        const isDraft = parseRequestStatus(req.status) === RequestStatus.Initial;
        if (isDraft) {
          return isTaskOwnedByUser(req, user);
        }
        return true;
      })
      .map((req) => ({
        ...req,
        product_name: req.title,
        category: req.request_type || "SPEND",
        assignee_name: req.assigned_user || req.requester,
      }));
  }, [requests, user]);

  const handleTaskClick = async (taskId: number | string) => {
    try {
      const res = await api.get<any>(`/tasks/${taskId}`);
      setSelectedTask(res);
    } catch (e) {
      console.error(e);
    }
  };

  const activeTasks = useMemo(() => {
    return tasks.filter((t: any) => {
      const s = parseRequestStatus(t.status);
      return s !== RequestStatus.Completed && s !== RequestStatus.Rejected;
    });
  }, [tasks]);

  const pipelineValue = useMemo(() => {
    return activeTasks.reduce((acc: number, t: any) => acc + (Number(t.amount) || 0), 0);
  }, [activeTasks]);

  const totalCount = tasks.length;
  const activeCount = activeTasks.length;

  const filteredTasks = useMemo(() => {
    return tasks.filter((task: any) => {
      if (dashboardFilter === "APPROVALS") {
        const s = String(task.status || "").toUpperCase();
        if (s !== "WAITING_APPROVAL" && s !== "UNDER_REVIEW") return false;
      } else if (dashboardFilter === "UNPAID_INVOICES") {
        const s = String(task.status || "").toUpperCase();
        if (s !== "WAITING_PAYMENT") return false;
      } else if (dashboardFilter === "RECURRING") {
        const cat = String(task.category || "").toUpperCase();
        if (cat !== "RECURRING") return false;
      }
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return Object.values(task).some((value) =>
        value !== null &&
        value !== undefined &&
        String(value).toLowerCase().includes(query)
      );
    });
  }, [tasks, searchQuery, dashboardFilter]);

  return (
    <div className="w-full space-y-3.5 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out relative">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/60 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Welcome back, {user?.full_name || "Admin"}
            </h1>
            <HelpIcon text="Provides a high-level overview of system metrics, active users, recent audit actions, and task execution counts." />
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            This is your central administrative dashboard.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            onClick={handleOpenApproverModal}
            className="flex items-center gap-2 text-xs font-semibold bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 shadow-xs hover:bg-slate-50 dark:hover:bg-zinc-800 hover:border-indigo-300 transition-all h-9 px-3.5"
          >
            <UserCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Assign Approvers</span>
          </Button>
        </div>
      </header>

      {/* Slim Vertical Floating Quick Filter (Aligned with operational cards) */}
      <FloatingVerticalFilter
        items={[
          {
            key: "ALL",
            label: "Active Requests",
            count: purchasingSummary?.open_requests ?? activeCount,
            icon: Activity,
            color: "blue",
          },
          {
            key: "APPROVALS",
            label: "Awaiting Approval",
            count: purchasingSummary?.awaiting_approval ?? 0,
            icon: UserCheck,
            color: "violet",
          },
          {
            key: "UNPAID_INVOICES",
            label: "Unpaid Invoices",
            count: purchasingSummary?.unpaid_invoices ?? 0,
            icon: ReceiptText,
            color: "orange",
          },
          {
            key: "RECURRING",
            label: "Recurring Subscriptions",
            count: purchasingSummary?.recurring_total ?? 0,
            icon: CalendarCheck,
            color: "amber",
          },
        ]}
        activeKey={dashboardFilter}
        onSelect={setDashboardFilter}
        defaultKey="ALL"
        onReset={() => setDashboardFilter("ALL")}
        scrollThreshold={140}
        title="Overview Filters"
        kpiRef={kpiRef}
      />

      {/* Recurring Payments Due Soon Alert Banner */}
      {recurringDueCount > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 sm:px-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800/60 shadow-xs text-amber-900 dark:text-amber-200 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 shrink-0">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div className="text-xs sm:text-sm">
              <span className="font-bold">
                {recurringDueCount === 1 ? "1 Recurring Payment" : `${recurringDueCount} Recurring Payments`} Due Within 7 Days
              </span>
              {recurringDueAmount > 0 && (
                <span className="font-semibold ml-1.5 opacity-90">({formatMoney(recurringDueAmount)})</span>
              )}
              <span className="opacity-75 hidden md:inline ml-2 text-xs">
                Requires review and invoice processing for upcoming payment cycle.
              </span>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate("/purchasing/recurring")}
            className="h-7.5 px-3 text-xs font-semibold border-amber-300 dark:border-amber-700 bg-white dark:bg-zinc-900 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-900 dark:text-amber-200 shrink-0 gap-1.5 shadow-2xs cursor-pointer"
          >
            <span>Review Payments</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* Multi-Module Operations Summary Grid */}
      <div ref={kpiRef} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-in fade-in duration-300">
          {/* 1. Active Purchase Requests */}
          <Card
            onClick={() => setDashboardFilter("ALL")}
            className={`shadow-xs cursor-pointer hover:shadow-md transition-all border border-slate-200/80 dark:border-zinc-800 hover:border-blue-300 ${
              dashboardFilter === "ALL" ? "ring-2 ring-blue-500 bg-blue-50/20 dark:bg-blue-950/20" : ""
            }`}
          >
            <CardContent className="p-3 sm:p-3.5 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 shrink-0">
                <Activity className="w-5 h-5" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-lg sm:text-xl font-bold leading-none mb-1">{purchasingSummary?.open_requests ?? activeCount}</span>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">Active Requests</span>
                <span className="text-[11px] text-muted-foreground mt-0.5">
                  Pipeline: {formatMoney(pipelineValue)} · {totalCount} total
                </span>
              </div>
            </CardContent>
          </Card>

          {/* 2. Pending Approvals */}
          <Card
            onClick={() => setDashboardFilter(dashboardFilter === "APPROVALS" ? "ALL" : "APPROVALS")}
            className={`shadow-xs cursor-pointer hover:shadow-md transition-all border border-slate-200/80 dark:border-zinc-800 hover:border-violet-300 ${
              dashboardFilter === "APPROVALS" ? "ring-2 ring-violet-500 bg-violet-50/20 dark:bg-violet-950/20" : ""
            }`}
          >
            <CardContent className="p-3 sm:p-3.5 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400 shrink-0">
                <UserCheck className="w-5 h-5" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-lg sm:text-xl font-bold leading-none mb-1">{purchasingSummary?.awaiting_approval ?? 0}</span>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">Awaiting Approval</span>
                <span className="text-[11px] text-violet-600 dark:text-violet-400 font-medium mt-0.5">
                  Click to filter board
                </span>
              </div>
            </CardContent>
          </Card>

          {/* 3. Unpaid Invoices (AP) */}
          <Card
            onClick={() => setDashboardFilter(dashboardFilter === "UNPAID_INVOICES" ? "ALL" : "UNPAID_INVOICES")}
            className={`shadow-xs cursor-pointer hover:shadow-md transition-all border border-slate-200/80 dark:border-zinc-800 hover:border-rose-300 ${
              dashboardFilter === "UNPAID_INVOICES" ? "ring-2 ring-rose-500 bg-rose-50/20 dark:bg-rose-950/20" : ""
            }`}
          >
            <CardContent className="p-3 sm:p-3.5 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400 shrink-0">
                <ReceiptText className="w-5 h-5" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-lg sm:text-xl font-bold leading-none mb-1">{purchasingSummary?.unpaid_invoices ?? 0}</span>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">Unpaid Invoices (AP)</span>
                <span className="text-[11px] text-muted-foreground mt-0.5 truncate">
                  {formatMoney(purchasingSummary?.unpaid_amount ?? 0)} due
                </span>
              </div>
            </CardContent>
          </Card>

          {/* 4. Recurring Subscriptions */}
          <Card
            onClick={() => setDashboardFilter(dashboardFilter === "RECURRING" ? "ALL" : "RECURRING")}
            className={`shadow-xs cursor-pointer hover:shadow-md transition-all border border-slate-200/80 dark:border-zinc-800 hover:border-amber-300 ${
              dashboardFilter === "RECURRING" ? "ring-2 ring-amber-500 bg-amber-50/20 dark:bg-amber-950/20" : ""
            }`}
          >
            <CardContent className="p-3 sm:p-3.5 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 shrink-0">
                <CalendarCheck className="w-5 h-5" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-lg sm:text-xl font-bold leading-none mb-1">{purchasingSummary?.recurring_total ?? 0}</span>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">Recurring Payments</span>
                <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5">
                  {(purchasingSummary?.recurring_due_soon_count ?? 0) > 0
                    ? `${purchasingSummary?.recurring_due_soon_count} due in 7 days`
                    : "All up to date"}
                </span>
              </div>
            </CardContent>
          </Card>
      </div>

      {/* Read-Only Tasks Board & Overview Section */}
      <Card className="border border-slate-200 dark:border-zinc-800 shadow-xs overflow-hidden w-full flex flex-col">
        <CardContent className="p-3.5 sm:p-4 flex flex-col gap-3 w-full">
          <div className="flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">Tasks Overview</h2>
              <HelpIcon text="View active system tasks and workflows in read-only mode." />
            </div>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400">
              Read Only
            </span>
          </div>

          <Tabs defaultValue="board" className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="flex items-center justify-between mb-3 shrink-0">
              <TabsList>
                <TabsTrigger value="board">Board View</TabsTrigger>
                <TabsTrigger value="list">List View</TabsTrigger>
              </TabsList>
              <div className="relative w-72">
                <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tasks..."
                  className="pl-9 pr-8 bg-background h-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {(searchQuery || dashboardFilter !== "ALL") && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setDashboardFilter("ALL");
                    }}
                    className="absolute right-2.5 top-2 text-muted-foreground hover:text-foreground transition-colors"
                    title="Clear filter"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            <TabsContent value="board" className="flex-1 min-h-0 m-0 data-[state=active]:flex flex-col overflow-hidden">
              <TaskBoard
                tasks={filteredTasks}
                onTaskClick={handleTaskClick}
                readOnly={true}
              />
            </TabsContent>

            <TabsContent value="list" className="flex-1 min-h-0 m-0 overflow-y-auto">
              <TaskList
                tasks={filteredTasks}
                onTaskClick={handleTaskClick}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Task Detail Modal */}
      <TaskDetailPanel
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
        onUpdate={() => {
          fetchRequests();
          if (selectedTask?.id) handleTaskClick(selectedTask.id);
        }}
        readOnly={true}
      />

      {/* Executive Approver Assignment & Delegation Modal */}
      <Dialog open={isApproverModalOpen} onOpenChange={setIsApproverModalOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-slate-900 dark:text-zinc-100">
                  CEO / Executive Approver & Department Assignment
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Directly configure Level 1 department approvers and operational workflow teams.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <Tabs defaultValue="departments" className="w-full mt-2">
            <TabsList className="grid grid-cols-2 w-full mb-4">
              <TabsTrigger value="departments" className="text-xs font-semibold gap-1.5">
                <Building2 className="w-3.5 h-3.5" /> Department Level 1 Approvers
              </TabsTrigger>
              <TabsTrigger value="operational" className="text-xs font-semibold gap-1.5">
                <Users className="w-3.5 h-3.5" /> Operational Teams
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: Department Level 1 Approvers Sub-Table */}
            <TabsContent value="departments" className="space-y-3 m-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Badge variant="secondary" className="gap-1 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 font-normal">
                    Total: <span className="font-semibold">{deptApprovers.length}</span>
                  </Badge>
                  <Badge variant="secondary" className="gap-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 font-normal border-emerald-200 dark:border-emerald-800">
                    <CheckCircle2 className="h-3 w-3" /> Assigned: <span className="font-semibold">{deptApprovers.filter(d => Boolean(d.approver_id)).length}</span>
                  </Badge>
                  {deptApprovers.filter(d => !d.approver_id).length > 0 && (
                    <Badge variant="secondary" className="gap-1 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 font-normal border-amber-200 dark:border-amber-800">
                      <AlertCircle className="h-3 w-3" /> Unassigned: <span className="font-semibold">{deptApprovers.filter(d => !d.approver_id).length}</span>
                    </Badge>
                  )}
                </div>

                <div className="relative w-full sm:w-60">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Filter departments..."
                    value={deptTableSearch}
                    onChange={e => setDeptTableSearch(e.target.value)}
                    className="pl-8 h-8 text-xs bg-white dark:bg-zinc-950"
                  />
                </div>
              </div>

              {/* Multi-Selection Bulk Action Toolbar */}
              {selectedDepts.length > 0 && (
                <div className="px-3 py-2 bg-indigo-50/90 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 rounded-lg flex flex-wrap items-center justify-between gap-2.5 animate-in fade-in-50">
                  <div className="flex items-center gap-2 text-xs font-semibold text-indigo-950 dark:text-indigo-200">
                    <CheckSquare className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    <span>{selectedDepts.length} department{selectedDepts.length > 1 ? "s" : ""} selected</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Popover
                      open={isBatchPopoverOpen}
                      onOpenChange={(open) => {
                        setIsBatchPopoverOpen(open);
                        if (!open) setBatchSearchText("");
                      }}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          size="sm"
                          disabled={isBatchSaving}
                          className="h-7 text-xs px-2.5 shadow-xs bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5"
                        >
                          {isBatchSaving ? (
                            <RefreshCw className="h-3 w-3 animate-spin" />
                          ) : (
                            <ChevronsUpDown className="h-3 w-3 opacity-80" />
                          )}
                          {isBatchSaving ? "Saving..." : `Assign Approver to ${selectedDepts.length} Selected`}
                        </Button>
                      </PopoverTrigger>

                      <PopoverContent className="w-[340px] p-0 shadow-lg" align="end">
                        <div className="p-2.5 border-b bg-slate-50/70 dark:bg-zinc-900/70">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-semibold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                              <Building2 className="h-3 w-3 text-indigo-600" />
                              Assign {selectedDepts.length} Departments
                            </span>
                            <span className="text-[10px] text-muted-foreground">Select Approver</span>
                          </div>
                          <div className="relative">
                            <Search className="absolute left-2 top-2 h-3 w-3 text-muted-foreground" />
                            <Input
                              autoFocus
                              placeholder="Search name, email, department..."
                              value={batchSearchText}
                              onChange={(e) => setBatchSearchText(e.target.value)}
                              className="pl-7 h-7 text-xs bg-white dark:bg-zinc-950"
                            />
                          </div>
                        </div>

                        <div className="max-h-[220px] overflow-y-auto p-1 divide-y divide-slate-100 dark:divide-slate-800/60" onWheelCapture={(e) => e.stopPropagation()}>
                          <div
                            onClick={() => handleBatchAssignApprover(null)}
                            className="p-2 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 rounded cursor-pointer text-xs flex items-center justify-between transition-colors"
                          >
                            <span className="font-semibold">&times; Clear Approver for all {selectedDepts.length} selected</span>
                          </div>

                          {allUsers
                            .filter((u) => {
                              if (u.is_active === false) return false;
                              const q = batchSearchText.toLowerCase().trim();
                              if (!q) return true;
                              return (
                                (u.full_name && u.full_name.toLowerCase().includes(q)) ||
                                (u.email && u.email.toLowerCase().includes(q)) ||
                                (u.department && u.department.toLowerCase().includes(q))
                              );
                            })
                            .map((u) => (
                              <div
                                key={u.id}
                                onClick={() => handleBatchAssignApprover(u)}
                                className="p-2 rounded cursor-pointer text-xs flex items-center justify-between transition-colors hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-800 dark:text-slate-200"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="h-6 w-6 rounded-full bg-slate-200 text-slate-700 dark:bg-zinc-700 dark:text-slate-200 flex items-center justify-center text-[10px] font-semibold shrink-0">
                                    {u.full_name?.split(" ").map((p: string) => p[0]).slice(0, 2).join("").toUpperCase() || "U"}
                                  </div>
                                  <div className="flex flex-col min-w-0">
                                    <span className="font-semibold truncate">{u.full_name || u.email}</span>
                                    <span className="text-[10px] text-muted-foreground truncate">{u.email}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      </PopoverContent>
                    </Popover>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedDepts([])}
                      className="h-7 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900"
                    >
                      Deselect
                    </Button>
                  </div>
                </div>
              )}

              {isDeptLoading ? (
                <div className="p-8 text-center text-xs text-muted-foreground">Loading departments...</div>
              ) : (
                <div className="border rounded-lg overflow-hidden border-slate-200 dark:border-zinc-800">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/50 text-slate-600 dark:text-slate-300 font-semibold">
                        <th className="py-2.5 px-3 w-8 text-center">
                          <Checkbox
                            checked={
                              deptApprovers.filter(d =>
                                !deptTableSearch ||
                                d.department.toLowerCase().includes(deptTableSearch.toLowerCase()) ||
                                (d.approver_name && d.approver_name.toLowerCase().includes(deptTableSearch.toLowerCase())) ||
                                (d.approver_email && d.approver_email.toLowerCase().includes(deptTableSearch.toLowerCase()))
                              ).length > 0 &&
                              deptApprovers.filter(d =>
                                !deptTableSearch ||
                                d.department.toLowerCase().includes(deptTableSearch.toLowerCase()) ||
                                (d.approver_name && d.approver_name.toLowerCase().includes(deptTableSearch.toLowerCase())) ||
                                (d.approver_email && d.approver_email.toLowerCase().includes(deptTableSearch.toLowerCase()))
                              ).every(d => selectedDepts.includes(d.department))
                            }
                            onCheckedChange={() => {
                              const visibleDepts = deptApprovers
                                .filter(d =>
                                  !deptTableSearch ||
                                  d.department.toLowerCase().includes(deptTableSearch.toLowerCase()) ||
                                  (d.approver_name && d.approver_name.toLowerCase().includes(deptTableSearch.toLowerCase())) ||
                                  (d.approver_email && d.approver_email.toLowerCase().includes(deptTableSearch.toLowerCase()))
                                )
                                .map(d => d.department);
                              handleToggleSelectAll(visibleDepts);
                            }}
                            aria-label="Select all departments"
                          />
                        </th>
                        <th className="py-2.5 px-3">Department</th>
                        <th className="py-2.5 px-3">Level 1 Approver</th>
                        <th className="py-2.5 px-3 text-right">Assign / Change</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                      {deptApprovers
                        .filter(d =>
                          !deptTableSearch ||
                          d.department.toLowerCase().includes(deptTableSearch.toLowerCase()) ||
                          (d.approver_name && d.approver_name.toLowerCase().includes(deptTableSearch.toLowerCase())) ||
                          (d.approver_email && d.approver_email.toLowerCase().includes(deptTableSearch.toLowerCase()))
                        )
                        .map((dept) => {
                          const isSaving = savingDept === dept.department;
                          const hasApprover = Boolean(dept.approver_id);
                          const isPopoverOpen = openPopoverDept === dept.department;
                          const isSelected = selectedDepts.includes(dept.department);

                          return (
                            <tr
                              key={dept.department}
                              className={`transition-colors ${
                                isSelected
                                  ? "bg-indigo-50/40 dark:bg-indigo-950/20"
                                  : "hover:bg-slate-50/60 dark:hover:bg-zinc-900/40"
                              }`}
                            >
                              <td className="py-2.5 px-3 text-center">
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={() => handleToggleSelectDept(dept.department)}
                                  aria-label={`Select ${dept.department}`}
                                />
                              </td>
                              <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-slate-100">
                                <div className="flex items-center gap-2">
                                  <Building2 className="h-3.5 w-3.5 text-indigo-600" />
                                  <span>{dept.department}</span>
                                </div>
                              </td>

                              <td className="py-2.5 px-3">
                                {hasApprover ? (
                                  <div className="flex items-center gap-2">
                                    <div className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center text-[11px] font-semibold shrink-0">
                                      {dept.approver_name?.split(" ").map((p: string) => p[0]).slice(0, 2).join("").toUpperCase() || "U"}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                      <span className="font-semibold text-slate-900 dark:text-slate-100 text-xs truncate">{dept.approver_name}</span>
                                      <span className="text-[10px] text-muted-foreground truncate">{dept.approver_email}</span>
                                    </div>
                                  </div>
                                ) : (
                                  <span className="italic text-muted-foreground text-xs flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3 text-amber-500" /> Not Assigned
                                  </span>
                                )}
                              </td>

                              <td className="py-2.5 px-3 text-right">
                                <Popover
                                  open={isPopoverOpen}
                                  onOpenChange={(open) => {
                                    if (open) {
                                      setOpenPopoverDept(dept.department);
                                      setDeptApproverSearch("");
                                    } else {
                                      setOpenPopoverDept(null);
                                    }
                                  }}
                                >
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant={hasApprover ? "outline" : "default"}
                                      size="sm"
                                      disabled={isSaving}
                                      className={`h-7 text-xs px-2.5 shadow-2xs gap-1 ${
                                        !hasApprover ? "bg-indigo-600 hover:bg-indigo-700 text-white" : ""
                                      }`}
                                    >
                                      {isSaving ? (
                                        <RefreshCw className="h-3 w-3 animate-spin" />
                                      ) : (
                                        <ChevronsUpDown className="h-3 w-3 opacity-70" />
                                      )}
                                      {isSaving ? "Saving..." : (hasApprover ? "Change" : "Assign")}
                                    </Button>
                                  </PopoverTrigger>

                                  <PopoverContent className="w-[320px] p-0 shadow-lg" align="end">
                                    <div className="p-2.5 border-b bg-slate-50/70 dark:bg-zinc-900/70">
                                      <div className="flex items-center justify-between mb-1.5">
                                        <span className="font-semibold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1">
                                          <Building2 className="h-3 w-3 text-indigo-600" />
                                          {dept.department}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground">Select User</span>
                                      </div>
                                      <div className="relative">
                                        <Search className="absolute left-2 top-2 h-3 w-3 text-muted-foreground" />
                                        <Input
                                          autoFocus
                                          placeholder="Type to search user..."
                                          value={deptApproverSearch}
                                          onChange={(e) => setDeptApproverSearch(e.target.value)}
                                          className="pl-7 h-7 text-xs bg-white dark:bg-zinc-950"
                                        />
                                      </div>
                                    </div>

                                    <div className="max-h-[220px] overflow-y-auto p-1 divide-y divide-slate-100 dark:divide-zinc-800" onWheelCapture={(e) => e.stopPropagation()}>
                                      {hasApprover && (
                                        <div
                                          onClick={() => handleSelectDepartmentApprover(dept.department, null)}
                                          className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 rounded cursor-pointer text-xs flex items-center transition-colors"
                                        >
                                          <span className="font-medium">&times; Remove Approver (Unassign)</span>
                                        </div>
                                      )}

                                      {allUsers
                                        .filter((u) => {
                                          if (u.is_active === false) return false;
                                          const q = deptApproverSearch.toLowerCase().trim();
                                          if (!q) return true;
                                          return (
                                            (u.full_name && u.full_name.toLowerCase().includes(q)) ||
                                            (u.email && u.email.toLowerCase().includes(q)) ||
                                            (u.department && u.department.toLowerCase().includes(q))
                                          );
                                        })
                                        .map((u) => {
                                          const isSelected = dept.approver_id === u.id;
                                          return (
                                            <div
                                              key={u.id}
                                              onClick={() => handleSelectDepartmentApprover(dept.department, u)}
                                              className={`p-2 rounded cursor-pointer text-xs flex items-center justify-between transition-colors ${
                                                isSelected
                                                  ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200"
                                                  : "hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-800 dark:text-slate-200"
                                              }`}
                                            >
                                              <div className="flex items-center gap-2 min-w-0">
                                                <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0 ${
                                                  isSelected
                                                    ? "bg-indigo-600 text-white"
                                                    : "bg-slate-200 text-slate-700 dark:bg-zinc-700 dark:text-slate-200"
                                                }`}>
                                                  {u.full_name?.split(" ").map((p: string) => p[0]).slice(0, 2).join("").toUpperCase() || "U"}
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                  <span className="font-semibold truncate">{u.full_name || u.email}</span>
                                                  <span className="text-[10px] text-muted-foreground truncate">{u.email}</span>
                                                </div>
                                              </div>

                                              {isSelected && (
                                                <Check className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0 ml-1.5" />
                                              )}
                                            </div>
                                          );
                                        })}
                                    </div>
                                  </PopoverContent>
                                </Popover>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>

            {/* TAB 2: Operational Teams */}
            <TabsContent value="operational" className="space-y-4 m-0">
              {[
                {
                  role: "COMPANY_LEVEL_2_APPROVER",
                  label: "Executive Level 2 Approver — Fixed: CEO Shaun Passley",
                  desc: "Company-wide executive approval fixed to CEO Shaun Passley (shaun@zenatech.com) for ≥ $10,000 or escalated requests.",
                  badgeColor: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200",
                },
                {
                  role: "PURCHASING",
                  label: "Purchasing Lead",
                  desc: "Vendor quote negotiations, purchase orders, and fulfillment.",
                  badgeColor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200",
                },
                {
                  role: "AP",
                  label: "Accounts Payable (AP)",
                  desc: "Invoice matching, vendor statement review, and GL validation.",
                  badgeColor: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200",
                },
                {
                  role: "TREASURY",
                  label: "Treasury Officer",
                  desc: "Bank disbursement, wire authorization, and final settlement.",
                  badgeColor: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300 border-sky-200",
                },
                {
                  role: "ADMIN",
                  label: "System & Workflow Administrator",
                  desc: "Administrative system configuration and workflow management.",
                  badgeColor: "bg-slate-100 text-slate-800 dark:bg-zinc-800 dark:text-slate-300 border-slate-200",
                },
              ].map(({ role, label, desc, badgeColor }) => {
                const assignment = workflowAssignments.find((a) => a.role === role);
                const assignedIds: string[] = assignment?.user_ids || (assignment?.user_id ? [assignment.user_id] : []);

                return (
                  <div
                    key={role}
                    className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-900/40 space-y-2.5 transition-all hover:border-slate-300 dark:hover:border-zinc-700"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900 dark:text-zinc-100">{label}</span>
                          <Badge variant="outline" className={`text-[10px] font-semibold px-2 py-0.5 ${badgeColor}`}>
                            {role}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                      </div>

                      <Popover
                        open={activeDropdownRole === role}
                        onOpenChange={(open) => setActiveDropdownRole(open ? role : null)}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs font-medium border-dashed border-slate-300 dark:border-zinc-700 hover:border-indigo-400 bg-white dark:bg-zinc-900 shrink-0 mt-1 sm:mt-0"
                          >
                            <UserCheck className="w-3.5 h-3.5 mr-1 text-indigo-500" />
                            Assign / Edit
                            <ChevronDown className="w-3.5 h-3.5 ml-1 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[360px] p-0" align="end">
                          <div className="flex items-center border-b px-3 py-2">
                            <Search className="w-4 h-4 mr-2 text-muted-foreground shrink-0" />
                            <input
                              placeholder="Search directory or Microsoft Entra..."
                              value={userSearchText}
                              onChange={(e) => setUserSearchText(e.target.value)}
                              className="w-full text-xs bg-transparent outline-none placeholder:text-muted-foreground"
                            />
                            {isSearchingGraph && <div className="w-3 h-3 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin ml-2 shrink-0" />}
                          </div>
                          <div className="max-h-[260px] overflow-y-auto p-1.5 space-y-1 divide-y divide-slate-100 dark:divide-zinc-800">
                            {/* Portal Directory Users */}
                            <div className="space-y-1 pb-1">
                              {allUsers
                                .filter(
                                  (u) =>
                                    u.is_active !== false &&
                                    (u.full_name || u.email || "")
                                      .toLowerCase()
                                      .includes(userSearchText.toLowerCase())
                                )
                                .map((u) => {
                                  const isChecked = assignedIds.includes(u.id);
                                  return (
                                    <button
                                      key={u.id}
                                      type="button"
                                      onClick={() => handleToggleUserInRole(role, u.id)}
                                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors text-left ${
                                        isChecked
                                          ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 font-medium"
                                          : "hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300"
                                      }`}
                                    >
                                      <div className="flex flex-col min-w-0 pr-2">
                                        <span className="truncate">{u.full_name || "Unnamed"}</span>
                                        <span className="text-[10px] text-muted-foreground truncate">{u.email}</span>
                                      </div>
                                      {isChecked && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
                                    </button>
                                  );
                                })}
                            </div>

                            {/* Microsoft Entra Graph Search Results */}
                            {graphSearchResults.length > 0 && (
                              <div className="pt-2 space-y-1">
                                <div className="px-2 py-0.5 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                                  <Sparkles className="w-3 h-3" />
                                  Microsoft Entra Directory
                                </div>
                                {graphSearchResults
                                  .filter((gu) => !allUsers.some((u) => u.email && gu.email && u.email.toLowerCase() === gu.email.toLowerCase()))
                                  .map((gu) => {
                                    const entraKey = gu.object_id || gu.email;
                                    const isChecked = assignedIds.includes(entraKey);
                                    return (
                                      <button
                                        key={entraKey}
                                        type="button"
                                        onClick={() => handleToggleEntraUser(role, gu)}
                                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors text-left ${
                                          isChecked
                                            ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 font-medium"
                                            : "hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300"
                                        }`}
                                      >
                                        <div className="flex flex-col min-w-0 pr-2">
                                          <div className="flex items-center gap-1.5">
                                            <span className="truncate">{gu.display_name || "Unnamed"}</span>
                                            <span className="px-1 py-0.2 text-[9px] bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 rounded font-medium">Entra</span>
                                          </div>
                                          <span className="text-[10px] text-muted-foreground truncate">{gu.email || gu.user_principal_name}</span>
                                        </div>
                                        {isChecked && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
                                      </button>
                                    );
                                  })}
                              </div>
                            )}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Assigned Users Badges */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {assignedIds.length === 0 ? (
                        <span className="text-xs text-muted-foreground italic">No approvers assigned</span>
                      ) : (
                        assignedIds.map((uid) => {
                          const userObj = allUsers.find((x) => x.id === uid);
                          return (
                            <Badge
                              key={uid}
                              variant="secondary"
                              className="text-xs py-1 px-2.5 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 shadow-2xs flex items-center gap-1.5 font-normal text-slate-800 dark:text-zinc-200"
                            >
                              <span>{userObj?.full_name || userObj?.email || uid}</span>
                              <button
                                type="button"
                                onClick={() => handleToggleUserInRole(role, uid)}
                                className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 ml-0.5 transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </TabsContent>
          </Tabs>

          <DialogFooter className="border-t border-slate-100 dark:border-zinc-800 pt-3">
            <Button variant="ghost" size="sm" onClick={() => setIsApproverModalOpen(false)}>
              Close
            </Button>
            <Button
              size="sm"
              onClick={handleSaveApproverAssignments}
              disabled={isSavingAssignments}
              className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5"
            >
              {isSavingAssignments ? (
                "Saving..."
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Save Operational Roles
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}