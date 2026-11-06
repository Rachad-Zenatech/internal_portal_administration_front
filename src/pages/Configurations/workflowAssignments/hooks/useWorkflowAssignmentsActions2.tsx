import { formatRequestType } from "@/pages/Purchasing/utils/purchasingMeta";
import { apiClient as api } from "@/services/apiClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Edit2, Building2, User, Plus, Trash2 } from "lucide-react";
import type { DepartmentGroup } from "../types";
import { PRIMARY_ROLE_TABS } from "../constants";
import type { useWorkflowAssignmentsActions } from "./useWorkflowAssignmentsActions";

export function useWorkflowAssignmentsActions2(ctx: ReturnType<typeof useWorkflowAssignmentsActions>) {
  const { setIsCreatingGroup, fetchData, setNewGroupDeptNames, setNewGroupApproverIds, setNewGroupName, setIsCreateGroupOpen, newGroupDeptNames, newGroupApproverIds, newGroupName, setIsRenamingGroup, setRenameGroupName, setRenameGroupId, renameGroupName, renameGroupId, setIsFormOpen, form, assignments, setForm, users } = ctx;
  // Create Group Handler
  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      return toast.error("Group name is required");
    }
    setIsCreatingGroup(true);
    try {
      const res = await api.post<DepartmentGroup>("/purchasing/department-groups", {
        name: newGroupName.trim(),
        approver_ids: newGroupApproverIds,
        departments: newGroupDeptNames,
      });

      toast.success(`Created department group "${res.name}"`);
      setIsCreateGroupOpen(false);
      setNewGroupName("");
      setNewGroupApproverIds([]);
      setNewGroupDeptNames([]);
      fetchData();
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || "Failed to create department group");
    } finally {
      setIsCreatingGroup(false);
    }
  };
  // Rename Group Handler
  const handleRenameGroup = async () => {
    if (!renameGroupId || !renameGroupName.trim()) return;
    setIsRenamingGroup(true);
    try {
      await api.put(`/purchasing/department-groups/${renameGroupId}`, {
        name: renameGroupName.trim(),
      });
      toast.success(`Renamed group to "${renameGroupName.trim()}"`);
      setRenameGroupId(null);
      setRenameGroupName("");
      fetchData();
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || "Failed to rename group");
    } finally {
      setIsRenamingGroup(false);
    }
  };
  // Delete Group Handler
  const handleDeleteGroup = async (group: DepartmentGroup) => {
    if (!window.confirm(`Are you sure you want to delete group "${group.name}"? Member departments will become ungrouped.`)) {
      return;
    }
    try {
      await api.delete(`/purchasing/department-groups/${group.id}`);
      toast.info(`Deleted group "${group.name}". Member departments moved to Ungrouped.`);
      fetchData();
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || "Failed to delete group");
    }
  };
  // Operational Role Handlers
  const handleSaveOperationalRole = async () => {
    if (!form.role) return toast.error("Role is required");

    const formDeptClean = (form.department || "").trim().toLowerCase();
    const isDuplicate = assignments.some(
      (a) =>
        a.role.toUpperCase() === form.role?.toUpperCase() &&
        (a.department || "").trim().toLowerCase() === formDeptClean &&
        a.id !== form.id
    );
    if (isDuplicate) {
      return toast.error(`Assignment for '${form.role}' in '${form.department || "All / General"}' already exists.`);
    }

    const assignedCount =
      form.user_ids && form.user_ids.length > 0 ? form.user_ids.length : form.user_id ? 1 : 0;

    if (assignedCount === 0) {
      return toast.error(`Workflow role '${form.role}' requires at least 1 assigned user.`);
    }

    try {
      const requestType = form.request_type === "ALL" ? null : form.request_type || null;
      const selectedUserIds = form.user_ids || [];
      const payload: any = {
        role: form.role,
        department: form.department?.trim() || null,
        request_type: requestType,
        team_id: form.team_id || null,
        active: form.active ?? true,
        user_ids: selectedUserIds,
        user_id: selectedUserIds.length > 0 ? selectedUserIds[0] : null,
      };

      if (form.id) {
        await api.put(`/purchasing/assignments/${form.id}`, payload);
        toast.success("Workflow assignment updated");
      } else {
        await api.post("/purchasing/assignments", payload);
        toast.success("Workflow assignment created");
      }
      setIsFormOpen(false);
      fetchData();
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || "Failed to save workflow assignment");
    }
  };
  const getRoleUserCount = (roleCode: string) => {
    const roleAssns = assignments.filter((a) => a.role.toUpperCase() === roleCode.toUpperCase());
    const userIds = new Set<string>();
    roleAssns.forEach((a) => {
      if (a.user_ids && a.user_ids.length > 0) {
        a.user_ids.forEach((uid) => userIds.add(uid));
      } else if (a.user_id) {
        userIds.add(a.user_id);
      }
    });
    return userIds.size;
  };
  const handleDeleteAssignment = async (id: number, roleName: string) => {
    if (!window.confirm(`Are you sure you want to delete the assignment for ${roleName}?`)) {
      return;
    }
    try {
      await api.delete(`/purchasing/assignments/${id}`);
      toast.info(`Assignment for ${roleName} deleted`);
      fetchData();
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || "Failed to delete assignment");
    }
  };
  // Render Operational & Approver Role dedicated tab content
  const renderRoleTabContent = (tabConfig: typeof PRIMARY_ROLE_TABS[1]) => {
    const roleCode = tabConfig.roleCode!;
    const roleAssignments = assignments.filter((a) => a.role.toUpperCase() === roleCode.toUpperCase());

    return (
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-zinc-950 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <tabConfig.icon className={`h-5 w-5 ${tabConfig.color}`} />
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                {tabConfig.label}
              </h2>
              <Badge variant="outline" className="text-xs font-mono">
                {roleCode}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{tabConfig.desc}</p>

            {tabConfig.states && tabConfig.states.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] font-medium text-slate-500">Handles Workflow Stages:</span>
                {tabConfig.states.map((state) => (
                  <span
                    key={state}
                    className="inline-flex items-center text-[10px] bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700"
                  >
                    {state}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => {
                setForm({
                  role: roleCode,
                  user_id: "",
                  user_ids: [],
                  department: null,
                  request_type: "ALL",
                  active: true,
                });
                setIsFormOpen(true);
              }}
              className={`h-8 text-xs text-white gap-1.5 shadow-xs ${
                roleCode === "COMPANY_LEVEL_2_APPROVER"
                  ? "bg-purple-600 hover:bg-purple-700"
                  : "bg-indigo-600 hover:bg-indigo-700"
              }`}
            >
              <Plus className="h-3.5 w-3.5" />
              Assign {tabConfig.shortLabel}
            </Button>
          </div>
        </div>

        <CardContent className="p-0">
          {roleAssignments.length === 0 ? (
            <div className="p-12 text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-400">
                <tabConfig.icon className="h-6 w-6 opacity-60" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  No team members currently assigned to {tabConfig.label}
                </p>
                <p className="text-xs text-muted-foreground">
                  Requests routed to this role will require operational assignment.
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  setForm({
                    role: roleCode,
                    user_id: "",
                    user_ids: [],
                    department: null,
                    request_type: "ALL",
                    active: true,
                  });
                  setIsFormOpen(true);
                }}
                className={`h-8 text-xs text-white gap-1.5 shadow-xs ${
                  roleCode === "COMPANY_LEVEL_2_APPROVER"
                    ? "bg-purple-600 hover:bg-purple-700"
                    : "bg-indigo-600 hover:bg-indigo-700"
                }`}
              >
                <Plus className="h-3.5 w-3.5" />
                Assign {tabConfig.shortLabel} Now
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {roleAssignments.map((a) => {
                const assignedUsers =
                  a.user_ids && a.user_ids.length > 0
                    ? a.user_ids.map((uid) => users.find((u) => u.id === uid)).filter(Boolean)
                    : a.user_id
                    ? [users.find((u) => u.id === a.user_id)].filter(Boolean)
                    : [];

                return (
                  <div
                    key={a.id}
                    className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-zinc-900/40 transition-colors"
                  >
                    <div className="space-y-2.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {a.department ? (
                          <Badge
                            variant="outline"
                            className="gap-1 text-xs font-medium bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800"
                          >
                            <Building2 className="h-3 w-3" />
                            {a.department} Department Scope
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-xs font-medium text-slate-600 bg-slate-50 border-slate-200 dark:bg-zinc-800/60 dark:text-slate-300 dark:border-slate-700"
                          >
                            Global (All Departments)
                          </Badge>
                        )}

                        <Badge variant={a.active ? "default" : "secondary"} className="text-[11px]">
                          {a.active ? "Active" : "Inactive"}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="text-[11px] text-muted-foreground border-slate-200 dark:border-slate-700"
                        >
                          Type: {formatRequestType(a.request_type || "ALL")}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-0.5">
                        <span className="text-xs text-muted-foreground">Assigned Users:</span>
                        {assignedUsers.length === 0 ? (
                          <span className="text-xs italic text-muted-foreground">None</span>
                        ) : (
                          assignedUsers.map((u: any) => (
                            <Badge
                              key={u.id}
                              variant="secondary"
                              className="text-xs font-normal bg-white dark:bg-zinc-800 border border-slate-200 dark:border-slate-700 shadow-xs gap-1.5"
                            >
                              <User className="h-3 w-3 opacity-60" />
                              <span className="font-medium text-slate-900 dark:text-slate-100">
                                {u.full_name || u.email}
                              </span>
                              {u.email && <span className="text-[11px] text-muted-foreground">({u.email})</span>}
                              {u.job_title && (
                                <span className="text-[11px] text-purple-600 dark:text-purple-400 font-medium">
                                  &middot; {u.job_title}
                                </span>
                              )}
                            </Badge>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setForm({
                            ...a,
                            department: a.department || null,
                            user_ids:
                              a.user_ids && a.user_ids.length > 0
                                ? a.user_ids
                                : a.user_id
                                ? [a.user_id]
                                : [],
                            request_type: a.request_type || "ALL",
                          });
                          setIsFormOpen(true);
                        }}
                        className="h-8 px-3 shadow-xs"
                      >
                        <Edit2 className="mr-1.5 h-3.5 w-3.5" /> Edit Assignment
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteAssignment(a.id, a.role)}
                        className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
                        title="Delete Assignment"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };
  return { handleCreateGroup, handleRenameGroup, handleDeleteGroup, handleSaveOperationalRole, getRoleUserCount, handleDeleteAssignment, renderRoleTabContent };
}
