import { useState, useEffect } from "react";
import HelpIcon from "@/components/ui/HelpIcon";
import { apiClient as api } from "@/services/apiClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { Edit2, Plus, X, Search, ChevronDown, Check } from "lucide-react";

type Assignment = {
  id: number;
  role: string;
  user_id: string | null;
  user_ids?: string[];
  team_id: string | null;
  request_type: string | null;
  active: boolean;
};

const ROLE_STATES_MAP: Record<string, string[]> = {
  "PURCHASING": ["Under Review"],
  "MANAGER": ["Waiting Approval"],
  "DIRECTOR": ["Waiting Approval"],
  "VP": ["Waiting Approval"],
  "AP": ["Waiting Payment"],
  "RECEIVING": ["Shipped", "Goods Received"],
  "TREASURY": ["Waiting Payment", "Completed"],
};

export default function WorkflowAssignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState<Partial<Assignment>>({ role: "", user_id: "", request_type: "ALL", active: true });

  // Custom dropdown states
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [userSearch, setUserSearch] = useState("");

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [assnRes, userRes] = await Promise.all([
        api.get<Assignment[]>("/purchasing/assignments"),
        api.get<any>("/configuration/users")
      ]);
      setAssignments(assnRes);
      setUsers(Array.isArray(userRes) ? userRes : (userRes as any).items || []);
    } catch (e) {
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

    // Prevent duplicated role names
    const isDuplicate = assignments.some(
      a => a.role.toUpperCase() === form.role?.toUpperCase() && a.id !== form.id
    );
    if (isDuplicate) {
      return toast.error("Role name must be unique. This role already exists.");
    }

    try {
      const requestType = form.request_type === "ALL" ? null : (form.request_type || null);

      if (form.id) {
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
    if (!ids || ids.length === 0) return <span className="text-muted-foreground italic text-xs">None</span>;
    
    const visibleIds = ids.slice(0, 2);
    const hiddenIds = ids.slice(2);
    
    return (
      <div className="flex flex-wrap items-center gap-1.5">
        {visibleIds.map(id => {
          const user = users.find(u => u.id === id);
          return (
            <Badge key={id} variant="secondary" className="font-normal bg-white dark:bg-zinc-800 border-slate-200 dark:border-slate-700 shadow-sm text-xs">
              {user ? user.full_name || user.email : id}
            </Badge>
          );
        })}
        {hiddenIds.length > 0 && (
          <Popover>
            <PopoverTrigger asChild>
              <Badge variant="secondary" className="font-normal bg-slate-100 dark:bg-zinc-800 border-slate-200 dark:border-slate-700 shadow-sm text-xs cursor-pointer hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors">
                +{hiddenIds.length} more... <ChevronDown className="h-3 w-3 ml-1 opacity-50" />
              </Badge>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-3 max-w-[300px]" align="start">
              <div className="text-xs font-semibold text-slate-500 mb-2">Additional Users</div>
              <div className="flex flex-wrap gap-1.5 max-h-[200px] overflow-y-auto">
                {hiddenIds.map(id => {
                  const user = users.find(u => u.id === id);
                  return (
                    <Badge key={id} variant="secondary" className="font-normal bg-white dark:bg-zinc-800 border-slate-200 dark:border-slate-700 shadow-sm text-xs">
                      {user ? user.full_name || user.email : id}
                    </Badge>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">Workflow Assignments</h2>
            <HelpIcon text="Assign users to purchasing workflow roles (e.g., AP, Treasury, Manager) for approval thresholds." />
          </div>
          <p className="text-sm text-slate-500 dark:text-zinc-400">Manage dynamic routing and role assignments.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Button onClick={() => { setForm({ role: "", user_id: "", user_ids: [], request_type: "ALL", active: true }); setIsFormOpen(true); }} className="w-full sm:w-auto shadow-sm">
            <Plus className="h-4 w-4 mr-2" /> Add Assignment
          </Button>
        </div>
      </div>

      <Card className="flex-1 min-h-0 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm flex flex-col p-0">
        <CardHeader className="bg-slate-50/50 dark:bg-zinc-950/50 border-b border-slate-100 dark:border-zinc-800 pb-4">
          <CardTitle className="text-lg">Role Assignments</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Loading assignments...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-slate-50 dark:bg-zinc-900 border-b">
                  <tr>
                    <th className="px-6 py-4 font-medium">Role</th>
                    <th className="px-6 py-4 font-medium">Handled States</th>
                    <th className="px-6 py-4 font-medium">Request Type</th>
                    <th className="px-6 py-4 font-medium min-w-[200px]">Assigned Users</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {assignments.filter(a => !a.role.startsWith("DELETED_")).map(a => (
                    <tr key={a.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-900 dark:text-slate-100">{a.role}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {(ROLE_STATES_MAP[a.role.toUpperCase()] || []).length > 0 ? (
                            ROLE_STATES_MAP[a.role.toUpperCase()].map(state => (
                              <Badge key={state} variant="outline" className="font-normal text-[11px] bg-slate-50 dark:bg-slate-900">{state}</Badge>
                            ))
                          ) : (
                            <Badge variant="outline" className="font-normal text-[11px] text-muted-foreground border-dashed">Custom Routing</Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="secondary" className="font-mono text-[10px] uppercase">{a.request_type || "ALL"}</Badge>
                      </td>
                      <td className="px-6 py-4">{getUserNames(a.user_ids || (a.user_id ? [a.user_id] : []))}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wide uppercase ${a.active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                          {a.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="icon" onClick={() => {
                          setForm({ ...a, user_ids: (a.user_ids && a.user_ids.length > 0) ? a.user_ids : (a.user_id ? [a.user_id] : []), request_type: a.request_type || "ALL" });
                          setIsFormOpen(true);
                        }}>
                          <Edit2 className="h-4 w-4 text-slate-500" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {assignments.filter(a => !a.role.startsWith("DELETED_")).length === 0 && (
                    <tr><td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">No assignments configured.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent aria-describedby="workflow-dialog-desc" className="sm:max-w-[500px]">
          <DialogHeader className="space-y-3 pb-4 border-b">
            <DialogTitle className="text-xl">{form.id ? "Edit Assignment" : "Add Assignment"}</DialogTitle>
            <DialogDescription id="workflow-dialog-desc">Configure the role, request type, and assigned users to manage request routing.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-100">Role Name</label>
              <Input
                placeholder="e.g. PURCHASING, AP, TREASURY"
                value={form.role || ""}
                onChange={e => setForm({ ...form, role: e.target.value.toUpperCase() })}
                className="uppercase placeholder:normal-case"
              />
              <p className="text-[13px] text-muted-foreground">The workflow role this assignment covers.</p>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-100">Request Type Filter</label>
              <div className="flex flex-wrap gap-2">
                {["ALL", "SPEND", "ADMIN", "RECURRING"].map(type => {
                  const isSelected = (form.request_type || "ALL") === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setForm({ ...form, request_type: type === "ALL" ? null : type })}
                      className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors border ${isSelected
                          ? 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700'
                          : 'bg-transparent border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
                        }`}
                    >
                      {type === "ALL" ? "ALL" : type}
                    </button>
                  );
                })}
              </div>
              <p className="text-[13px] text-muted-foreground mt-1">Restrict this assignment to specific request types.</p>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-100">Assigned Users</label>
              <div className="border rounded-lg p-4 space-y-4 bg-slate-50/50 dark:bg-zinc-900/50 shadow-sm">
                <div className="flex flex-wrap gap-2">
                  {(!form.user_ids || form.user_ids.length === 0) ? (
                    <span className="text-[13px] text-muted-foreground italic px-1 py-1">No users assigned</span>
                  ) : (
                    form.user_ids.map(uid => {
                      const u = users.find(x => x.id === uid);
                      return (
                        <Badge key={uid} variant="secondary" className="pl-3 pr-1.5 py-1.5 gap-1.5 flex items-center bg-white dark:bg-zinc-800 border-slate-200 dark:border-slate-700 shadow-sm rounded-full">
                          <span className="text-[13px] font-medium text-slate-700 dark:text-slate-200">{u ? u.full_name || u.email : uid}</span>
                          <div
                            className="hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full p-1 cursor-pointer ml-1 transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                            onClick={() => setForm({ ...form, user_ids: form.user_ids!.filter(x => x !== uid) })}
                          >
                            <X className="h-3.5 w-3.5" />
                          </div>
                        </Badge>
                      );
                    })
                  )}
                </div>

                <div className="border-t pt-4 mt-2">
                  <Popover open={isUserDropdownOpen} onOpenChange={setIsUserDropdownOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-between font-normal bg-white dark:bg-zinc-950 h-9 text-slate-500 hover:text-slate-700">
                        Select users...
                        <ChevronDown className="h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[430px] p-0" align="start">
                      <div className="flex items-center border-b px-3">
                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        <input
                          className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-slate-500 disabled:cursor-not-allowed disabled:opacity-50"
                          placeholder="Search users by name or email..."
                          value={userSearch}
                          onChange={(e) => setUserSearch(e.target.value)}
                        />
                      </div>
                      <div className="max-h-[250px] overflow-y-auto p-1">
                        {users.filter(u => (u.full_name || u.email).toLowerCase().includes(userSearch.toLowerCase())).length === 0 ? (
                          <div className="p-4 text-center text-sm text-muted-foreground">No users found.</div>
                        ) : (
                          users.filter(u => (u.full_name || u.email).toLowerCase().includes(userSearch.toLowerCase())).map(u => {
                            const isSelected = (form.user_ids || []).includes(u.id);
                            return (
                              <div
                                key={u.id}
                                className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-none hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                onClick={() => {
                                  const current = form.user_ids || [];
                                  if (isSelected) {
                                    setForm({ ...form, user_ids: current.filter(id => id !== u.id) });
                                  } else {
                                    setForm({ ...form, user_ids: [...current, u.id], user_id: undefined });
                                  }
                                }}
                              >
                                <div className={`mr-3 flex h-4 w-4 items-center justify-center rounded-sm border transition-colors ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 opacity-50 dark:border-slate-700'}`}>
                                  {isSelected && <Check className="h-3 w-3" strokeWidth={3} />}
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-medium text-slate-900 dark:text-slate-100">{u.full_name || u.email}</span>
                                  {u.full_name && <span className="text-xs text-muted-foreground">{u.email}</span>}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <input type="checkbox" id="active-checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900" />
              <label htmlFor="active-checkbox" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-900 dark:text-slate-100">Active Assignment</label>
            </div>
          </div>
          <DialogFooter className="border-t pt-4 mt-2">
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{form.id ? "Save Changes" : "Save Assignment"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
