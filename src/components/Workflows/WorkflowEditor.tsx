import { useState, useEffect } from "react";
import { apiClient as api } from "@/services/apiClient";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "../../components/ui/sheet";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface WorkflowEditorProps {
  open: boolean;
  workflow: any | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function WorkflowEditor({ open, workflow, onClose, onSuccess }: WorkflowEditorProps) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tiers, setTiers] = useState<any[]>([]);

  // We could fetch roles and users for assignment
  const [roles, setRoles] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    if (open) {
      api.get<any>("/roles").then(res => setRoles(res)).catch(console.error);
      api.get<any>("/configuration/users").then(res => setUsers(res)).catch(console.error);

      if (workflow) {
        setName(workflow.name);
        setDescription(workflow.description || "");
        setTiers(workflow.tiers || []);
      } else {
        setName("");
        setDescription("");
        setTiers([]);
      }
    }
  }, [open, workflow]);

  const handleAddTier = () => {
    setTiers([...tiers, { tier_order: tiers.length + 1, role_id: "", user_id: "" }]);
  };

  const handleRemoveTier = (index: number) => {
    const newTiers = [...tiers];
    newTiers.splice(index, 1);
    // update order
    newTiers.forEach((t, i) => t.tier_order = i + 1);
    setTiers(newTiers);
  };

  const handleTierChange = (index: number, field: string, value: string) => {
    const newTiers = [...tiers];
    newTiers[index][field] = value || null; // API expects null if empty
    
    // Clear user_id if role_id is selected, etc (for simplicity MVP)
    if (field === 'role_id' && value) {
        newTiers[index].user_id = null;
    } else if (field === 'user_id' && value) {
        newTiers[index].role_id = null;
    }
    setTiers(newTiers);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = {
        name,
        description,
        tiers: tiers.map(t => ({
          tier_order: t.tier_order,
          role_id: t.role_id || null,
          user_id: t.user_id || null
        }))
      };

      if (workflow) {
        await api.put<any>(`/workflows/${workflow.id}`, payload);
        toast.success("Workflow updated successfully");
      } else {
        await api.post<any>("/workflows", payload);
        toast.success("Workflow created successfully");
      }
      onSuccess();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "An error occurred while saving the workflow");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!workflow) return;
    if (!confirm("Are you sure you want to delete this workflow?")) return;
    try {
      await api.delete<any>(`/workflows/${workflow.id}`);
      toast.success("Workflow deleted successfully");
      onSuccess();
    } catch(e: any) {
      console.error(e);
      toast.error(e.message || "An error occurred while deleting the workflow");
    }
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="!max-w-[75vw] !w-[75vw] flex flex-col p-0">
        <div className="p-6 flex-1 overflow-y-auto">
          <SheetHeader className="mb-6 pr-8">
            <SheetTitle>{workflow ? "Edit Workflow" : "Create Workflow"}</SheetTitle>
          </SheetHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Workflow Name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Purchase Orders > $5k" />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} />
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <Label className="text-base font-semibold">Approval Stages (Tiers)</Label>
              <Button size="sm" variant="outline" onClick={handleAddTier}>
                <Plus className="w-4 h-4 mr-1" /> Add Tier
              </Button>
            </div>

            <div className="space-y-4 relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px before:h-full before:w-0.5 before:bg-muted">
              {tiers.map((tier, index) => (
                <div key={index} className="relative flex items-start gap-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold z-10 shrink-0 mt-1 shadow-sm">
                    {tier.tier_order}
                  </div>
                  <div className="flex-1 bg-card border rounded-md p-4 space-y-3 relative group">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleRemoveTier(index)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                    <div className="space-y-2 pr-6">
                      <Label className="text-xs text-muted-foreground">Approve by Role</Label>
                      <select
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        value={tier.role_id || ""}
                        onChange={(e) => handleTierChange(index, 'role_id', e.target.value)}
                      >
                        <option value="">-- None --</option>
                        {roles.map(r => (
                          <option 
                            key={r.id} 
                            value={r.id}
                            disabled={tiers.some((t, i) => i !== index && String(t.role_id) === String(r.id))}
                          >
                            {r.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2 pr-6">
                      <Label className="text-xs text-muted-foreground">OR Specific User</Label>
                      <select
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        value={tier.user_id || ""}
                        onChange={(e) => handleTierChange(index, 'user_id', e.target.value)}
                      >
                        <option value="">-- None --</option>
                        {users.filter(u => u.is_active !== false).map(u => (
                          <option 
                            key={u.id} 
                            value={u.id}
                            disabled={tiers.some((t, i) => i !== index && String(t.user_id) === String(u.id))}
                          >
                            {u.full_name} ({u.email})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
              {tiers.length === 0 && (
                <p className="text-sm text-muted-foreground italic pl-12 py-4">No approval stages added yet. Tasks will be instantly approved.</p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-between items-center pt-4">
            {workflow ? (
                <Button variant="destructive" onClick={handleDelete}>Delete</Button>
            ) : <div/>}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Discard</Button>
            <Button onClick={handleSubmit} disabled={loading || !name}>{loading ? "Saving..." : "Save Workflow"}</Button>
          </div>
        </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
