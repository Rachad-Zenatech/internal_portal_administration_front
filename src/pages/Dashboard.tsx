import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { usePurchaseRequests } from "@/hooks/usePurchasing";
import { formatMoney } from "@/pages/Purchasing/purchasingMeta";
import { RequestStatus } from "@/types/purchasing";
import { parseRequestStatus } from "@/lib/requestStatus";
import { isToday } from "date-fns";
import { Activity, AlertTriangle, TrendingUp, CalendarPlus, Search, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import HelpIcon from "@/components/ui/HelpIcon";
import TaskBoard from "@/components/Tasks/TaskBoard";
import TaskList from "@/components/Tasks/TaskList";
import TaskDetailPanel from "@/components/Tasks/TaskDetailPanel";
import { apiClient as api } from "@/services/apiClient";

export default function Dashboard() {
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
    <div className="w-full space-y-6 flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out p-6 lg:p-8">
      <header className="flex flex-col gap-4 border-b border-slate-200/60 pb-6">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Welcome back, {user?.full_name || "Admin"}
          </h1>
          <HelpIcon text="Provides a high-level overview of system metrics, active users, recent audit actions, and task execution counts." />
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          This is your central administrative dashboard.
        </p>
      </header>

      {/* Summary KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* 1. Task Created Today */}
        <Card
          onClick={() => setFilterTodayOnly((prev) => !prev)}
          className={`shadow-sm cursor-pointer hover:shadow-md transition-all hover:border-violet-300 ${filterTodayOnly ? "ring-2 ring-violet-500" : ""}`}
        >
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400">
              <CalendarPlus className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold leading-none mb-1">{tasksCreatedToday.length}</span>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Task Created Today</span>
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
          className={`shadow-sm cursor-pointer hover:shadow-md transition-all hover:border-blue-300 ${!searchQuery && !filterTodayOnly ? "ring-1 ring-blue-500/20" : ""}`}
        >
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
              <Activity className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold leading-none mb-1">{activeCount}</span>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Active Workflows</span>
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
          className={`shadow-sm cursor-pointer hover:shadow-md transition-all hover:border-amber-300 ${searchQuery.toLowerCase() === "high" ? "ring-2 ring-amber-500" : ""}`}
        >
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold leading-none mb-1">{urgentTasks.length}</span>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Priority Attention</span>
              <span className="text-[11px] text-muted-foreground mt-0.5">High &amp; urgent tasks</span>
            </div>
          </CardContent>
        </Card>

        {/* 4. Active Pipeline Value */}
        <Card
          onClick={() => navigate("/purchasing/requests")}
          className="shadow-sm cursor-pointer hover:shadow-md transition-all hover:border-emerald-300"
        >
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold leading-none mb-1">{formatMoney(pipelineValue)}</span>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Active Pipeline Value</span>
              <span className="text-[11px] text-muted-foreground mt-0.5">{activeCount} active requests</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Read-Only Tasks Board & Overview Section */}
      <Card className="border border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden mt-6 min-h-[calc(100vh-7rem)] flex flex-col">
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
    </div>
  );
}
