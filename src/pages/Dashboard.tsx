import { FloatingVerticalFilter } from "@/components/ui/FloatingVerticalFilter";
import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { usePurchaseRequests } from "@/hooks/usePurchasing";
import { formatMoney } from "@/pages/Purchasing/purchasingMeta";
import { RequestStatus } from "@/types/purchasing";
import { parseRequestStatus } from "@/lib/requestStatus";
import { isToday } from "date-fns";
import { Activity, AlertTriangle, TrendingUp, CalendarPlus, Search, X, UserCheck, ShieldCheck, Check, ChevronDown, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
    try {
      const [assnRes, userRes] = await Promise.all([
        api.get<any[]>("/purchasing/assignments"),
        api.get<any>("/configuration/users?is_active=true")
      ]);
      setWorkflowAssignments(assnRes || []);
      setAllUsers(Array.isArray(userRes) ? userRes : (userRes as any).items || []);
    } catch (err) {
      console.error("Failed to fetch workflow assignments:", err);
    }
  };

  const handleOpenApproverModal = () => {
    fetchWorkflowAssignments();
    setIsApproverModalOpen(true);
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
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTodayOnly, setFilterTodayOnly] = useState(false);
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

  const isTaskCreatedToday = (task: any) => {
    const d = task.created_at || task.request_date;
    if (!d) return false;
    try {
      return isToday(new Date(d));
    } catch {
      return false;
    }
  };

  const tasksCreatedToday = useMemo(() => {
    return tasks.filter((t: any) => isTaskCreatedToday(t));
  }, [tasks]);

  const activeTasks = useMemo(() => {
    return tasks.filter((t: any) => {
      const s = parseRequestStatus(t.status);
      return s !== RequestStatus.Completed && s !== RequestStatus.Rejected;
    });
  }, [tasks]);

  const urgentTasks = useMemo(() => {
    return activeTasks.filter((t: any) => {
      const p = (t.priority || "").toUpperCase();
      return p === "HIGH" || p === "URGENT";
    });
  }, [activeTasks]);

  const pipelineValue = useMemo(() => {
    return activeTasks.reduce((acc: number, t: any) => acc + (Number(t.amount) || 0), 0);
  }, [activeTasks]);

  const totalCount = tasks.length;
  const activeCount = activeTasks.length;

  const filteredTasks = useMemo(() => {
    return tasks.filter((task: any) => {
      if (filterTodayOnly && !isTaskCreatedToday(task)) return false;
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return Object.values(task).some((value) =>
        value !== null &&
        value !== undefined &&
        String(value).toLowerCase().includes(query)
      );
    });
  }, [tasks, searchQuery, filterTodayOnly]);

  return (
    <div className="w-full space-y-4 flex flex-col flex-1 min-h-0 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out relative">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/60 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
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

      {/* Slim Vertical Floating Quick Filter (Follows card colors & appears on scroll) */}
      <FloatingVerticalFilter
        items={[
          {
            key: "TODAY",
            label: "Created Today",
            count: tasksCreatedToday.length,
            icon: CalendarPlus,
            color: "violet",
          },
          {
            key: "ALL",
            label: "Active Workflows",
            count: activeCount,
            icon: Activity,
            color: "blue",
          },
          {
            key: "HIGH",
            label: "Priority Attention",
            count: urgentTasks.length,
            icon: AlertTriangle,
            color: "amber",
          },
        ]}
        activeKey={
          filterTodayOnly
            ? "TODAY"
            : searchQuery.toLowerCase() === "high"
            ? "HIGH"
            : "ALL"
        }
        onSelect={(key) => {
          if (key === "TODAY") {
            setFilterTodayOnly(true);
            setSearchQuery("");
          } else if (key === "HIGH") {
            setFilterTodayOnly(false);
            setSearchQuery("HIGH");
          } else {
            setFilterTodayOnly(false);
            setSearchQuery("");
          }
        }}
        defaultKey="ALL"
        onReset={() => {
          setFilterTodayOnly(false);
          setSearchQuery("");
        }}
        scrollThreshold={140}
        title="Task Filters"
        kpiRef={kpiRef}
      />

      {/* Big KPI Cards Section */}
      <div ref={kpiRef} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 animate-in fade-in duration-300">
          {/* 1. Task Created Today */}
          <Card
            onClick={() => setFilterTodayOnly((prev) => !prev)}
            className={`shadow-sm cursor-pointer hover:shadow-md transition-all hover:border-violet-300 ${
              filterTodayOnly ? "ring-2 ring-violet-500 bg-violet-50/20 dark:bg-violet-950/10" : ""
            }`}
          >
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400 shrink-0">
                <CalendarPlus className="w-6 h-6" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-2xl font-bold leading-none mb-1">{tasksCreatedToday.length}</span>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">Task Created Today</span>
                <span className="text-[11px] text-muted-foreground mt-0.5">
                  {tasksCreatedToday.length === 1 ? "1 task" : `${tasksCreatedToday.length} tasks`} today
                </span>
              </div>
            </CardContent>
          </Card>

          {/* 2. Active Workflows */}
          <Card
            onClick={() => {
              setSearchQuery("");
              setFilterTodayOnly(false);
            }}
            className={`shadow-sm cursor-pointer hover:shadow-md transition-all hover:border-blue-300 ${
              !searchQuery && !filterTodayOnly ? "ring-1 ring-blue-500/20 bg-blue-50/20 dark:bg-blue-950/10" : ""
            }`}
          >
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 shrink-0">
                <Activity className="w-6 h-6" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-2xl font-bold leading-none mb-1">{activeCount}</span>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">Active Workflows</span>
                <span className="text-[11px] text-muted-foreground mt-0.5">{totalCount} total tasks</span>
              </div>
            </CardContent>
          </Card>

          {/* 3. Priority Attention */}
          <Card
            onClick={() => {
              setFilterTodayOnly(false);
              setSearchQuery(searchQuery.toLowerCase() === "high" ? "" : "HIGH");
            }}
            className={`shadow-sm cursor-pointer hover:shadow-md transition-all hover:border-amber-300 ${
              searchQuery.toLowerCase() === "high" ? "ring-2 ring-amber-500 bg-amber-50/20 dark:bg-amber-950/10" : ""
            }`}
          >
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-2xl font-bold leading-none mb-1">{urgentTasks.length}</span>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">Priority Attention</span>
                <span className="text-[11px] text-muted-foreground mt-0.5">High &amp; urgent tasks</span>
              </div>
            </CardContent>
          </Card>

          {/* 4. Active Pipeline Value */}
          <Card
            onClick={() => navigate("/purchasing/requests")}
            className="shadow-sm cursor-pointer hover:shadow-md transition-all hover:border-emerald-300"
          >
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 shrink-0">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-2xl font-bold leading-none mb-1 truncate">{formatMoney(pipelineValue)}</span>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">Active Pipeline Value</span>
                <span className="text-[11px] text-muted-foreground mt-0.5">{activeCount} active requests</span>
              </div>
            </CardContent>
          </Card>
      </div>

      {/* Read-Only Tasks Board & Overview Section */}
      <Card className="border border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden flex-1 min-h-[750px] lg:min-h-[820px] flex flex-col">
        <CardContent className="p-4 sm:p-6 flex flex-col gap-4 flex-1 min-h-0 overflow-hidden">
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
                {(searchQuery || filterTodayOnly) && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setFilterTodayOnly(false);
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
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-slate-900 dark:text-zinc-100">
                  CEO / Executive Approver Assignment
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Directly configure authorized approvers and delegation across core purchasing pipelines.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-3">
            {[
              {
                role: "EXECUTIVE",
                label: "Executive Approver (≥ $10,000)",
                desc: "Authorized sign-off for high-value expenditures and capital purchases.",
                badgeColor: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200",
              },
              {
                role: "MANAGER",
                label: "Manager Approver (< $10,000)",
                desc: "Initial line management review and standard spend approvals.",
                badgeColor: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200",
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
          </div>

          <DialogFooter className="border-t border-slate-100 dark:border-zinc-800 pt-3">
            <Button variant="ghost" size="sm" onClick={() => setIsApproverModalOpen(false)}>
              Cancel
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
                  Save Assignments
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}