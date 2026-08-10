import { useState, useEffect } from "react";
import { apiClient as api } from "@/services/apiClient";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface PlanEditorProps {
  open: boolean;
  plan: any | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PlanEditor({ open, plan, onClose, onSuccess }: PlanEditorProps) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [members, setMembers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    if (open) {
      api.get<any>("/roles").then(res => setRoles(res)).catch(console.error);
      api.get<any>("/configuration/users").then(res => setUsers(res)).catch(console.error);

      if (plan) {
        setName(plan.plan_name);
        setMembers(plan.members || []);
      } else {
        setName("");
        setMembers([]);
      }
    }
  }, [open, plan]);

  const handleAddMember = () => {
    setMembers([...members, { role_id: "", user_id: "" }]);
  };

  const handleRemoveMember = (index: number) => {
    const newMembers = [...members];
    newMembers.splice(index, 1);
    setMembers(newMembers);
  };

  const handleMemberChange = (index: number, field: string, value: string) => {
    const newMembers = [...members];
    newMembers[index][field] = value || null;
    if (field === 'role_id' && value) {
      newMembers[index].user_id = null;
    } else if (field === 'user_id' && value) {
      newMembers[index].role_id = null;
    }
    setMembers(newMembers);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = {
        plan_name: name,
        members: members.map(m => ({
          role_id: m.role_id || null,
          user_id: m.user_id || null
        }))
      };

      if (plan) {
        await api.put<any>(`/notification-plans/${plan.id}`, payload);
        toast.success("Notification plan updated successfully");
      } else {
        await api.post<any>("/notification-plans", payload);
        toast.success("Notification plan created successfully");
      }
      onSuccess();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "An error occurred while saving the notification plan");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!plan) return;
    if (!confirm("Are you sure you want to delete this plan?")) return;
    try {
      await api.delete<any>(`/notification-plans/${plan.id}`);
      toast.success("Notification plan deleted successfully");
      onSuccess();
    } catch(e: any) {
      console.error(e);
      toast.error(e.message || "An error occurred while deleting the notification plan");
    }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="sm:max-w-[500px] w-full flex flex-col p-0">
        <div className="p-6 flex-1 overflow-y-auto">
          <SheetHeader className="mb-6 pr-8">
            <SheetTitle>{plan ? "Edit Notification Plan" : "Create Notification Plan"}</SheetTitle>
          </SheetHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Plan Name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. IT Department Approvers" />
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <Label className="text-base font-semibold">Members Configuration</Label>
              <Button size="sm" variant="outline" onClick={handleAddMember}>
                <Plus className="w-4 h-4 mr-1" /> Add Member Rule
              </Button>
            </div>

            <div className="space-y-3">
              {members.map((member, index) => (
                <div key={index} className="bg-card border rounded-md p-4 relative group">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleRemoveMember(index)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                  <div className="space-y-4 pr-6">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Notify By Role</Label>
                      <select
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        value={member.role_id || ""}
                        onChange={(e) => handleMemberChange(index, 'role_id', e.target.value)}
                      >
                        <option value="">-- None --</option>
                        {roles.map(r => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">OR Specific User</Label>
                      <select
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        value={member.user_id || ""}
                        onChange={(e) => handleMemberChange(index, 'user_id', e.target.value)}
                      >
                        <option value="">-- None --</option>
                        {users.filter(u => u.is_active !== false).map(u => (
                          <option 
                            key={u.id} 
                            value={u.id}
                            disabled={members.some((m, i) => i !== index && String(m.user_id) === String(u.id))}
                          >
                            {u.full_name} ({u.email})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
              {members.length === 0 && (
                <p className="text-sm text-muted-foreground italic">No members configured.</p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-between items-center pt-4">
            {plan ? (
                <Button variant="destructive" onClick={handleDelete}>Delete</Button>
            ) : <div/>}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Discard</Button>
            <Button onClick={handleSubmit} disabled={loading || !name}>{loading ? "Saving..." : "Save Plan"}</Button>
          </div>
        </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
