import { useState, useEffect } from "react";
import { apiClient as api } from "@/services/apiClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";
import { toast } from "sonner";

interface TaskFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function TaskFormDialog({ open, onOpenChange, onSuccess }: TaskFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [workflows, setWorkflows] = useState<any[]>([]);
  const getDefaultDueDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState({
    product_name: "",
    description: "",
    amount: "",
    category: "",
    priority: "Medium",
    due_date: getDefaultDueDate(),
    workflow_id: ""
  });

  useEffect(() => {
    if (open) {
      api.get<any>("/workflows").then((res) => {
        setWorkflows(res || []);
      }).catch(console.error);
    }
  }, [open]);

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post<any>("/tasks", {
        ...formData,
        amount: parseFloat(formData.amount),
        workflow_id: formData.workflow_id ? parseInt(formData.workflow_id, 10) : null
      });
      toast.success("Task created successfully");
      onSuccess();
      onOpenChange(false);
      setFormData({
        product_name: "",
        description: "",
        amount: "",
        category: "",
        priority: "Medium",
        due_date: getDefaultDueDate(),
        workflow_id: ""
      });
    } catch (e: any) {
      console.error("Failed to create task", e);
      toast.error(e.message || "Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="product_name">Product Name</Label>
            <Input id="product_name" name="product_name" required value={formData.product_name} onChange={handleChange} />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" value={formData.description} onChange={handleChange} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount ($)</Label>
              <Input id="amount" name="amount" type="number" step="0.01" required value={formData.amount} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input id="category" name="category" required value={formData.category} onChange={handleChange} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <select 
                id="priority" 
                name="priority" 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                value={formData.priority} 
                onChange={handleChange}
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="due_date">Due Date</Label>
              <Input id="due_date" name="due_date" type="date" value={formData.due_date} onChange={handleChange} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="workflow_id">Approval Workflow</Label>
            <select 
              id="workflow_id" 
              name="workflow_id" 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              value={formData.workflow_id} 
              onChange={handleChange}
            >
              <option value="">Select a workflow...</option>
              {workflows.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Create Task"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
