import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { usePurchasingSummary } from "@/hooks/usePurchasing";
import { useTasks } from "@/hooks/useTasks";
import { formatMoney } from "@/pages/Purchasing/purchasingMeta";
import { ShoppingCart, Clock, FileWarning, CheckCircle2, Search } from "lucide-react";
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
  const { data: summary } = usePurchasingSummary();
  const { data: tasks = [], refetch: fetchTasks } = useTasks();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTask, setSelectedTask] = useState<any>(null);

  const handleTaskClick = async (taskId: number) => {
    try {
      const res = await api.get<any>(`/tasks/${taskId}`);
      setSelectedTask(res);
    } catch (e) {
      console.error(e);
    }
  };

  const filteredTasks = tasks.filter((task: any) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return Object.values(task).some((value) =>
      value !== null &&
      value !== undefined &&
      String(value).toLowerCase().includes(query)
    );
  });

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
      {summary && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card onClick={() => navigate("/purchasing/requests")} className="shadow-sm cursor-pointer hover:shadow-md transition-all hover:border-blue-300">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold leading-none mb-1">{summary.open_requests}</span>
                <span className="text-xs text-muted-foreground font-medium">Open Requests</span>
              </div>
            </CardContent>
          </Card>

          <Card onClick={() => navigate("/purchasing/requests?status=WAITING_APPROVAL")} className="shadow-sm cursor-pointer hover:shadow-md transition-all hover:border-orange-300">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400">
                <Clock className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold leading-none mb-1">{summary.awaiting_approval}</span>
                <span className="text-xs text-muted-foreground font-medium">Awaiting Approval</span>
              </div>
            </CardContent>
          </Card>

          <Card onClick={() => navigate("/purchasing/requests?status=WAITING_PAYMENT")} className="shadow-sm cursor-pointer hover:shadow-md transition-all hover:border-fuchsia-300">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-fuchsia-50 text-fuchsia-600 dark:bg-fuchsia-900/20 dark:text-fuchsia-400">
                <FileWarning className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold leading-none mb-1">{summary.unpaid_invoices}</span>
                <span className="text-xs text-muted-foreground font-medium">Unpaid Invoices<br />{formatMoney(summary.unpaid_amount)}</span>
              </div>
            </CardContent>
          </Card>

          <Card onClick={() => navigate("/purchasing/requests?status=COMPLETED")} className="shadow-sm cursor-pointer hover:shadow-md transition-all hover:border-emerald-300">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold leading-none mb-1">{summary.completed}</span>
                <span className="text-xs text-muted-foreground font-medium">Completed</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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
                  className="pl-9 bg-background h-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
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
          fetchTasks();
          if (selectedTask?.id) handleTaskClick(selectedTask.id);
        }}
        readOnly={true}
      />
    </div>
  );
}
