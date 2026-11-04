import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { X, Search, ChevronDown, Check } from "lucide-react";
import { SUGGESTED_ROLES } from "../constants";
import type { WorkflowAssignmentsState } from "../hooks/useWorkflowAssignments";

export function EditRoleAssignmentDialog({ s }: { s: WorkflowAssignmentsState }) {
  const { form, handleSaveOperationalRole, setIsFormOpen, setForm, userSearch, users, setUserSearch, setIsUserDropdownOpen, isUserDropdownOpen, departments, isFormOpen } = s;
  return (
    <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit Role Assignment" : "Configure Role Assignment"}</DialogTitle>
            <DialogDescription>
              Assign team members and approvers to operational and executive roles (Level 2 Approvers, AP, Treasury, Purchasing).
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-100">Workflow Role</label>
              <Input
                placeholder="e.g. AP, TREASURY, PURCHASING"
                value={form.role || ""}
                disabled={Boolean(form.id)}
                onChange={(e) => setForm({ ...form, role: e.target.value.toUpperCase() })}
                className="bg-white dark:bg-zinc-950 font-mono text-xs"
              />
              {!form.id && (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {SUGGESTED_ROLES.map((r) => (
                    <button
                      key={r.code}
                      type="button"
                      onClick={() => setForm({ ...form, role: r.code })}
                      className={`text-[11px] px-2 py-0.5 rounded border transition-colors ${
                        form.role === r.code
                          ? "bg-indigo-50 border-indigo-300 text-indigo-700 dark:bg-indigo-950 dark:border-indigo-700 dark:text-indigo-300 font-medium"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 dark:bg-zinc-900 dark:border-slate-800 dark:text-slate-400"
                      }`}
                    >
                      {r.code}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                  Department Scope
                </label>
                <span className="text-[11px] font-medium text-slate-500 bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                  {form.department ? "Department-Specific" : "Global / All"}
                </span>
              </div>
              <select
                value={form.department || ""}
                onChange={(e) => setForm({ ...form, department: e.target.value ? e.target.value : null })}
                className="w-full h-10 px-3 py-2 text-sm bg-white dark:bg-zinc-950 border border-slate-200 dark:border-slate-800 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
              >
                <option value="">All / General (Global Scope)</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                {form.role === "ACCOUNT_RECEIVABLE" ? "Workflow Type Scope" : "Request Type Scope"}
              </label>
              <div className="flex flex-wrap gap-2">
                {(form.role === "ACCOUNT_RECEIVABLE"
                  ? [
                      { code: "ALL", label: "ALL" },
                      { code: "CASH", label: "CASH RECONCILIATION" },
                      { code: "INITIAL_SALE", label: "INITIAL SALE" },
                      { code: "ADD_ON", label: "ADD-ON / UPGRADE" },
                      { code: "MONTHLY_SUBSCRIPTION", label: "MONTHLY SUBSCRIPTION" },
                      { code: "RENEWAL", label: "CONTRACT RENEWAL" },
                    ]
                  : [
                      { code: "ALL", label: "ALL" },
                      { code: "SPEND", label: "SPEND" },
                      { code: "ADMIN", label: "ADMIN" },
                      { code: "RECURRING", label: "RECURRING" },
                    ]
                ).map((item) => {
                  const isSelected = (form.request_type || "ALL") === item.code;
                  return (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => setForm({ ...form, request_type: item.code === "ALL" ? null : item.code })}
                      className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors border ${
                        isSelected
                          ? "bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700"
                          : "bg-transparent border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-100">Assigned Users</label>
                <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                  At least 1 user required
                </span>
              </div>
              <div className="border rounded-lg p-4 space-y-4 bg-slate-50/50 dark:bg-zinc-900/50 shadow-sm">
                <div className="flex flex-wrap gap-2">
                  {!form.user_ids || form.user_ids.length === 0 ? (
                    <span className="text-[13px] text-muted-foreground italic px-1 py-1">No users assigned</span>
                  ) : (
                    form.user_ids.map((uid) => {
                      const u = users.find((x) => x.id === uid);
                      return (
                        <Badge
                          key={uid}
                          variant="secondary"
                          className="pl-3 pr-1.5 py-1.5 gap-1.5 flex items-center bg-white dark:bg-zinc-800 border-slate-200 dark:border-slate-700 shadow-sm rounded-full"
                        >
                          <span className="text-[13px] font-medium text-slate-700 dark:text-slate-200">
                            {u ? u.full_name || u.email : uid}
                          </span>
                          <div
                            className="hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full p-1 cursor-pointer ml-1 transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                            onClick={() =>
                              setForm({ ...form, user_ids: form.user_ids!.filter((x) => x !== uid) })
                            }
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
                      <Button
                        variant="outline"
                        className="w-full justify-between font-normal bg-white dark:bg-zinc-950 h-9 text-slate-500 hover:text-slate-700"
                      >
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
                      <div className="max-h-[250px] overflow-y-auto p-1" onWheelCapture={(e) => e.stopPropagation()}>
                        {users.filter(
                          (u) =>
                            u.is_active !== false &&
                            (u.full_name || u.email || "").toLowerCase().includes(userSearch.toLowerCase())
                        ).length === 0 ? (
                          <div className="p-4 text-center text-sm text-muted-foreground">No users found.</div>
                        ) : (
                          users
                            .filter((u) => (u.full_name || u.email || "").toLowerCase().includes(userSearch.toLowerCase()))
                            .map((u) => {
                              const isSelected = (form.user_ids || []).includes(u.id);
                              return (
                                <div
                                  key={u.id}
                                  className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-none hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                  onClick={() => {
                                    const current = form.user_ids || [];
                                    if (isSelected) {
                                      setForm({ ...form, user_ids: current.filter((id) => id !== u.id) });
                                    } else {
                                      setForm({ ...form, user_ids: [...current, u.id], user_id: undefined });
                                    }
                                  }}
                                >
                                  <div
                                    className={`mr-3 flex h-4 w-4 items-center justify-center rounded-sm border transition-colors ${
                                      isSelected
                                        ? "bg-indigo-600 border-indigo-600 text-white"
                                        : "border-slate-300 opacity-50 dark:border-slate-700"
                                    }`}
                                  >
                                    {isSelected && <Check className="h-3 w-3" strokeWidth={3} />}
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="font-medium text-slate-900 dark:text-slate-100">
                                      {u.full_name || u.email}
                                    </span>
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
              <input
                type="checkbox"
                id="active-checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
              />
              <label
                htmlFor="active-checkbox"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-900 dark:text-slate-100"
              >
                Active Assignment
              </label>
            </div>
          </div>
          <DialogFooter className="border-t pt-4 mt-2">
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveOperationalRole}>{form.id ? "Save Changes" : "Save Assignment"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
  );
}
