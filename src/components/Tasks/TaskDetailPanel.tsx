import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../../components/ui/sheet";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Textarea } from "../../components/ui/textarea";
import { useState } from "react";
import { apiClient as api } from "@/services/apiClient";
import { format } from "date-fns";
import { toast } from "sonner";
import { Trash2, CheckCircle2, Circle } from "lucide-react";
import { STATUS_BADGE } from "@/pages/Purchasing/purchasingMeta";
import { Card, CardContent } from "@/components/ui/card";

const FLOW = ["New Request", "Under Review", "Waiting Payment", "Paid", "Purchased", "Shipped", "Completed"];

const getStatusKey = (status: string): keyof typeof STATUS_BADGE => {
  const map: Record<string, keyof typeof STATUS_BADGE> = {
    "New Request": "NEW",
    "Under Review": "UNDER_REVIEW",
    "Waiting Payment": "WAITING_PAYMENT",
    "Paid": "PAID",
    "Approved": "APPROVED",
    "Rejected": "REJECTED",
    "Purchased": "PURCHASED",
    "Shipped": "SHIPPED",
    "Completed": "COMPLETED"
  };
  return map[status] || "NEW";
};

interface TaskDetailPanelProps {
  task: any | null;
  onClose: () => void;
  onUpdate: () => void;
}

export default function TaskDetailPanel({ task, onClose, onUpdate }: TaskDetailPanelProps) {
  const [note, setNote] = useState("");
  

  if (!task) return null;

  const handleAddNote = async () => {
    if (!note.trim()) return;
    try {
      await api.post<any>(`/tasks/${task.id}/notes`, { note_text: note });
      setNote("");
      toast.success("Note added successfully");
      onUpdate();
    } catch (e: any) {
      console.error("Failed to add note", e);
      toast.error(e.message || "Failed to add note");
    }
  };

  const handleApprove = async () => {
    try {
      await api.post<any>(`/tasks/${task.id}/approve`, { action: "APPROVE", comment: "" });
      toast.success("Task approved successfully");
      onUpdate();
      onClose();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to approve task");
    }
  };

  const handleReject = async () => {
    const reason = prompt("Enter rejection reason:");
    if (reason === null) return;
    try {
      await api.post<any>(`/tasks/${task.id}/approve`, { action: "REJECT", comment: reason });
      toast.success("Task rejected successfully");
      onUpdate();
      onClose();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to reject task");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this order? This action cannot be undone.")) return;
    
    try {
      await api.delete(`/tasks/${task.id}`);
      toast.success("Order deleted successfully");
      onUpdate();
      onClose();
    } catch (e) {
      console.error(e);
      toast.error("Failed to delete order");
    }
  };

  // very simple permission check (MVP): if user belongs to tier role or is tier user
  // (In full version, this requires evaluating the role from the token/DB)
  const canApprove = task.current_tier_id != null; 

  return (
    <Sheet open={!!task} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="!max-w-[75vw] !w-[75vw] flex flex-col p-0">
        <div className="p-6 flex-1 overflow-y-auto">
          <SheetHeader className="mb-6 pr-8">
            <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3">
                <SheetTitle className="text-2xl">{task.product_name}</SheetTitle>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10" 
                  onClick={handleDelete}
                  title="Delete Order"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex gap-2 mt-2">
                <Badge variant="outline" className={STATUS_BADGE[getStatusKey(task.status)]}>{task.status}</Badge>
                <Badge variant={task.priority === 'High' ? 'destructive' : 'default'}>{task.priority}</Badge>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">${task.amount}</div>
              <div className="text-sm text-muted-foreground">{task.category}</div>
            </div>
          </div>
        </SheetHeader>

        <Card className="border border-slate-200 dark:border-zinc-800 mb-8 mx-1">
          <CardContent className="p-4 overflow-x-auto">
            <div className="flex items-center gap-1 min-w-max">
              {FLOW.map((step, i) => {
                const currentIndex = FLOW.indexOf(task.status);
                const done = task.status !== "Rejected" && i < currentIndex;
                const current = i === currentIndex;
                return (
                  <div key={step} className="flex items-center gap-1">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
                      current ? STATUS_BADGE[getStatusKey(step)] + " border" : done ? "text-green-600" : "text-slate-400"
                    }`}>
                      {done ? <CheckCircle2 className="h-4 w-4" /> : current ? <Circle className="h-4 w-4 fill-current" /> : <Circle className="h-4 w-4" />}
                      {step}
                    </div>
                    {i < FLOW.length - 1 && <div className={`h-px w-6 ${done ? "bg-green-500" : "bg-slate-200 dark:bg-zinc-700"}`} />}
                  </div>
                );
              })}
            </div>
            {task.status === "Rejected" && (
              <p className="mt-3 text-sm font-medium text-red-600">This order was rejected.</p>
            )}
          </CardContent>
        </Card>

        <div className="space-y-8">
          <section>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
            <p className="text-sm">{task.description}</p>
            {task.assignee_name && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Assignee</h3>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shadow-sm">
                    {task.assignee_name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium">{task.assignee_name}</span>
                </div>
              </div>
            )}
          </section>

          {canApprove && (
            <section className="bg-muted p-4 rounded-lg">
              <h3 className="text-sm font-medium mb-3">Approval Actions</h3>
              <div className="flex gap-3">
                <Button onClick={handleApprove} className="flex-1 bg-green-600 hover:bg-green-700">Approve</Button>
                <Button onClick={handleReject} variant="destructive" className="flex-1">Reject</Button>
              </div>
            </section>
          )}

          {task.status === "Waiting Payment" && (
            <section className="bg-orange-50 dark:bg-orange-950 p-4 rounded-lg border border-orange-200 dark:border-orange-900">
              <h3 className="text-sm font-medium text-orange-900 dark:text-orange-400 mb-3">Accounts Payable Actions</h3>
              <div className="flex gap-3">
                <Button onClick={async () => {
                  try {
                    await api.post(`/tasks/${task.id}/status`, { status: "Paid", comment: "Marked as Paid by AP" });
                    toast.success("Task marked as Paid");
                    onUpdate();
                    onClose();
                  } catch (e: any) {
                    toast.error(e.message || "Failed to mark as paid");
                  }
                }} className="flex-1 bg-emerald-600 hover:bg-emerald-700">Mark Paid</Button>
                
                <Button onClick={async () => {
                  const reason = prompt("Enter rejection reason:");
                  if (reason === null) return;
                  try {
                    await api.post(`/tasks/${task.id}/status`, { status: "Rejected", comment: `AP Rejected: ${reason}` });
                    toast.success("Task rejected");
                    onUpdate();
                    onClose();
                  } catch (e: any) {
                    toast.error(e.message || "Failed to reject");
                  }
                }} variant="destructive" className="flex-1">Reject</Button>
              </div>
            </section>
          )}

          <section>
            <h3 className="text-sm font-medium text-muted-foreground mb-4">Notes</h3>
            <div className="space-y-4 mb-4">
              {task.notes?.map((n: any) => (
                <div key={n.id} className="bg-muted p-3 rounded-md text-sm">
                  {n.user_name && (
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-5 h-5 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-[10px] font-bold shadow-sm">
                        {n.user_name.split(" ").map((x: string) => x[0]).join("").substring(0, 2).toUpperCase()}
                      </div>
                      <span className="text-xs font-medium">{n.user_name}</span>
                    </div>
                  )}
                  <p>{n.note_text}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {n.created_at ? format(new Date(n.created_at), 'MMM d, yyyy h:mm a') : ''}
                  </p>
                </div>
              ))}
              {(!task.notes || task.notes.length === 0) && (
                <p className="text-sm text-muted-foreground italic">No notes yet.</p>
              )}
            </div>
            <div className="flex gap-2">
              <Textarea 
                placeholder="Add a note..." 
                value={note} 
                onChange={(e) => setNote(e.target.value)} 
                className="min-h-[80px]"
              />
              <Button onClick={handleAddNote} className="self-end">Post</Button>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-medium text-muted-foreground mb-4">Activity History</h3>
            <div className="space-y-4 relative before:absolute before:inset-0 before:ml-[0.625rem] before:-translate-x-px before:h-full before:w-0.5 before:bg-muted">
              {task.history?.map((h: any) => (
                <div key={h.id} className="relative flex items-start gap-4">
                  <div className="flex items-center justify-center w-5 h-5 rounded-full bg-primary z-10 shrink-0 mt-1 shadow-sm" />
                  <div className="flex-1 p-3 rounded bg-card border shadow-sm text-sm">
                    {h.changed_by_name && (
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-5 h-5 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-[10px] font-bold shadow-sm">
                          {h.changed_by_name.split(" ").map((x: string) => x[0]).join("").substring(0, 2).toUpperCase()}
                        </div>
                        <span className="text-xs font-medium">{h.changed_by_name}</span>
                      </div>
                    )}
                    <p className="font-medium">{h.action}</p>
                    {h.old_value && h.new_value && <p className="text-muted-foreground text-xs mt-1">{h.old_value} &rarr; {h.new_value}</p>}
                    {!h.old_value && h.new_value && <p className="text-muted-foreground text-xs mt-1">{h.new_value}</p>}
                    {h.comment && <p className="mt-2 bg-muted p-1.5 rounded">{h.comment}</p>}
                    <time className="block text-xs text-muted-foreground mt-2">{h.created_at ? format(new Date(h.created_at), 'MMM d, h:mm a') : ''}</time>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
