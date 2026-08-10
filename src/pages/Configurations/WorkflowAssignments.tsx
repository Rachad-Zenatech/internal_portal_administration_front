import { useState, useEffect } from "react";
import HelpIcon from "@/components/ui/HelpIcon";
import { apiClient as api } from "@/services/apiClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Edit2, Plus } from "lucide-react";

type Assignment = {
  id: number;
  role: string;
  user_id: string | null;
  user_ids?: string[];          // multi‑assignee (frontend only)
  team_id: string | null;
  request_type: string | null;
  active: boolean;
};

export default function WorkflowAssignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState<Partial<Assignment>>({ role: "", user_id: "", request_type: "ALL", active: true });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [assnRes, userRes] = await Promise.all([
        api.get<Assignment[]>("/purchasing/assignments"),
        api.get<any>("/configuration/users") // Correct endpoint for users
      ]);
      setAssignments(assnRes);
      // Depending on backend, userRes could be an array or { items: [] }
      setUsers(Array.isArray(userRes) ? userRes : (userRes as any).items || []);
    } catch (e) {
      // Ignore if /users fails and just show IDs
      try {
        const assnRes = await api.get<Assignment[]>("/purchasing/assignments");
        setAssignments(assnRes);
      } catch (err) {
        toast.error("Failed to load assignments");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async () => {
    if (!form.role) return toast.error("Role is required");
    try {
      const requestType = form.request_type === "ALL" ? null : (form.request_type || null);

      if (form.id) {
        // ── EDIT: PUT updates a single existing row.
        const payload: any = {
          role: form.role,
          request_type: requestType,
          team_id: form.team_id || null,
          active: form.active ?? true,
        };
        if (form.user_ids && form.user_ids.length > 0) {
          payload.user_ids = form.user_ids;
        } else {
          payload.user_id = form.user_id || null;
        }
        await api.put(`/purchasing/assignments/${form.id}`, payload);
        toast.success("Assignment updated");
      } else {
        // ── CREATE: POST creates one row per selected user.
        const payload: any = {
          role: form.role,
          request_type: requestType,
          team_id: form.team_id || null,
          active: form.active ?? true,
        };
        if (form.user_ids && form.user_ids.length > 0) {
          payload.user_ids = form.user_ids;
        } else {
          payload.user_id = form.user_id || null;
        }
        await api.post(`/purchasing/assignments`, payload);
        toast.success("Assignment created");
      }

      setIsFormOpen(false);
      fetchData();
    } catch (e: any) {
      const errMsg = e.response?.data?.detail?.[0]?.msg || e.response?.data?.detail || "Failed to save assignment";
      toast.error(`Error: ${errMsg}`);
    }
  };

  const getUserNames = (ids: string[] | null) => {
    if (!ids || ids.length === 0) return "None";
    const names = ids.map(id => {
      const user = users.find(u => u.id === id);
      return user ? user.full_name || user.email : id;
    });
    return names.join(", ");
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2"><h1 className="text-3xl font-bold tracking-tight">Workflow Assignments</h1><HelpIcon text="Assign users to purchasing workflow roles (e.g., AP, Treasury, Manager) for approval thresholds." /></div>
          <p className="text-muted-foreground">Manage dynamic routing and role assignments.</p>
        </div>
        <Button onClick={() => { setForm({ role: "", user_id: "", user_ids: [], request_type: "ALL", active: true }); setIsFormOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Add Assignment
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Role Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Loading...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-slate-50 dark:bg-zinc-900 border-b">
                  <tr>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Request Type</th>
                    <th className="px-4 py-3">Assigned User</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map(a => (
                    <tr key={a.id} className="border-b last:border-0 hover:bg-slate-50/50 dark:hover:bg-zinc-800/50">
                      <td className="px-4 py-3 font-medium">{a.role}</td>
                      <td className="px-4 py-3">{a.request_type || "ALL"}</td>
                      <td className="px-4 py-3">{getUserNames(a.user_ids || (a.user_id ? [a.user_id] : []))}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${a.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
                          {a.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="icon" onClick={() => {
                          // Pre-populate multi-select with existing single user_id when editing
                          setForm({ ...a, user_ids: (a.user_ids && a.user_ids.length > 0) ? a.user_ids : (a.user_id ? [a.user_id] : []), request_type: a.request_type || "ALL" });
                          setIsFormOpen(true);
                        }}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {assignments.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No assignments configured.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent aria-describedby="workflow-dialog-desc">
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit Assignment" : "Add Assignment"}</DialogTitle>
            <DialogDescription id="workflow-dialog-desc">Configure the role, request type, and assigned users.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Role Name (e.g. PURCHASING, AP, TREASURY)</label>
              <Input value={form.role || ""} onChange={e => setForm({ ...form, role: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Request Type Filter (Optional)</label>
              <Select value={form.request_type || "ALL"} onValueChange={(val) => setForm({ ...form, request_type: val })}>
                <SelectTrigger><SelectValue placeholder="Any (all types)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Any (all types)</SelectItem>
                  <SelectItem value="SPEND">SPEND</SelectItem>
                  <SelectItem value="ADMIN">ADMIN</SelectItem>
                  <SelectItem value="RECURRING">RECURRING</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Assigned Users</label>
              {/* Native multi‑select for simplicity */}
              <select
                multiple
                value={form.user_ids || []}
                onChange={e => {
                  const selected = Array.from(e.target.selectedOptions).map(o => o.value);
                  setForm({ ...form, user_ids: selected, user_id: undefined });
                }}
                className="w-full rounded border p-2"
              >
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.full_name || u.email}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} className="h-4 w-4" />
              <label className="text-sm font-medium">Active</label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
