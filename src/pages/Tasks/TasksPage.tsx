import { useState } from "react";
import HelpIcon from "@/components/ui/HelpIcon";
import { apiClient as api } from "@/services/apiClient";
import { Button } from "../../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Input } from "../../components/ui/input";
import { Plus, Search } from "lucide-react";
import TaskBoard from "../../components/Tasks/TaskBoard";
import TaskList from "../../components/Tasks/TaskList";
import TaskDetailPanel from "../../components/Tasks/TaskDetailPanel";
import TaskFormDialog from "../../components/Tasks/TaskFormDialog";

import { useTasks, useChangeTaskStatus } from "@/hooks/useTasks";

export default function TasksPage() {
  const { data: tasks = [], refetch: fetchTasks } = useTasks();
  const changeStatusMutation = useChangeTaskStatus();
  const [searchQuery, setSearchQuery] = useState("");
  
  const [isFormOpen, setIsFormOpen] = useState(false);
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
    
    return Object.values(task).some(value => 
      value !== null && 
      value !== undefined && 
      String(value).toLowerCase().includes(query)
    );
  });

  return (
    <div className="flex-1 min-h-0 flex flex-col h-full pb-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="flex items-center gap-2"><h1 className="text-3xl font-bold tracking-tight">Tasks</h1><HelpIcon text="Create, view, and track execution of order system tasks and custom workflows." /></div>
          <p className="text-muted-foreground">Manage and track order tasks</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Task
        </Button>
      </div>

      <Tabs defaultValue="board" className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-4">
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
        <TabsContent value="board" className="flex-1 min-h-0">
          <TaskBoard 
            tasks={filteredTasks} 
            onTaskClick={handleTaskClick} 
            onTaskMoved={async (taskId, newStatus) => {
              try {
                await changeStatusMutation.mutateAsync({ taskId, newStatus });
              } catch (e) {
                console.error("Failed to move task", e);
              }
            }} 
          />
        </TabsContent>
        <TabsContent value="list" className="flex-1 min-h-0">
          <TaskList tasks={filteredTasks} onTaskClick={handleTaskClick} />
        </TabsContent>
      </Tabs>

      <TaskFormDialog 
        open={isFormOpen} 
        onOpenChange={setIsFormOpen} 
        onSuccess={fetchTasks} 
      />

      <TaskDetailPanel 
        task={selectedTask} 
        onClose={() => setSelectedTask(null)} 
        onUpdate={() => {
          fetchTasks();
          handleTaskClick(selectedTask.id);
        }}
      />
    </div>
  );
}
