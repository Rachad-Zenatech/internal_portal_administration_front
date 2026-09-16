import { FloatingVerticalFilter } from "@/components/ui/FloatingVerticalFilter";
import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { usePurchaseRequests, usePurchasingSummary } from "@/hooks/usePurchasing";
import { ChevronRight } from "lucide-react";
import { formatMoney } from "@/pages/Purchasing/purchasingMeta";
import { RequestStatus } from "@/types/purchasing";
import { parseRequestStatus } from "@/lib/requestStatus";
import {
  Activity, AlertTriangle, ReceiptText, CalendarCheck, Search, X, UserCheck, ShieldCheck, Check,
  ChevronDown, Sparkles, Building2, Users, RefreshCw, AlertCircle, CheckCircle2, CheckSquare,
  FolderPlus, GripVertical, Trash2, Folder, Layers, Edit2, Loader2
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import HelpIcon from "@/components/ui/HelpIcon";
import TaskBoard from "@/components/Tasks/TaskBoard";
import TaskList from "@/components/Tasks/TaskList";
import TaskDetailPanel from "@/components/Tasks/TaskDetailPanel";
import { apiClient as api } from "@/services/apiClient";
import { toast } from "sonner";

type ApproverSummary = {
  id: string;
  full_name?: string | null;
  email?: string | null;
  job_title?: string | null;
  department?: string | null;
};

type DepartmentApprover = {
  department: string;
  group_name?: string | null;
  approver_id: string | null;
  approver_name: string | null;
  approver_email: string | null;
  approver_title: string | null;
  approver_ids?: string[] | null;
  approvers?: ApproverSummary[] | null;
  source: "MANUAL" | "UNASSIGNED";
};

type DepartmentGroup = {
  id: number;
  name: string;
  approver_ids?: string[] | null;
  approvers?: ApproverSummary[] | null;
  departments: string[];
};

/** Rich Level 1 Approver Pill without vertical clipping */
function ApproverPill({
  name,
  email,
  title,
}: {
  name?: string | null;
  email?: string | null;
  title?: string | null;
}) {
  const displayName = name || email || "User";
  const initials = displayName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="inline-flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-lg bg-emerald-50 text-emerald-950 border border-emerald-200/90 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-800/80 shadow-2xs hover:bg-emerald-100/70 dark:hover:bg-emerald-950/60 transition-colors">
      <div className="h-6 w-6 rounded-full bg-emerald-200 text-emerald-800 dark:bg-emerald-800 dark:text-emerald-100 flex items-center justify-center text-[11px] font-bold shrink-0 shadow-2xs">
        {initials}
      </div>
      <div className="flex flex-col text-left leading-normal min-w-0">
        <span className="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate">
          {displayName}
        </span>
        {title ? (
          <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium truncate">
            {title}
          </span>
        ) : email ? (
          <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
            {email}
          </span>
        ) : null}
      </div>
    </div>
  );
}

/** Approver Pill List with +X More Popover Dropdown */
function ApproverPillList({
  approvers,
  maxVisible = 2,
}: {
  approvers: ApproverSummary[];
  maxVisible?: number;
}) {
  if (!approvers || approvers.length === 0) return null;

  const visible = approvers.slice(0, maxVisible);
  const remaining = approvers.slice(maxVisible);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {visible.map((appr) => (
        <ApproverPill
          key={appr.id}
          name={appr.full_name}
          email={appr.email}
          title={appr.job_title}
        />
      ))}

      {remaining.length > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-100/90 text-emerald-900 hover:bg-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-900/60 border border-emerald-300/80 dark:border-emerald-700/80 shadow-2xs transition-colors cursor-pointer"
            >
              <span>+{remaining.length} more</span>
              <ChevronDown className="h-3.5 w-3.5 opacity-70" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-2.5 shadow-xl" align="start">
            <div className="flex items-center justify-between px-1.5 pb-2 border-b border-slate-100 dark:border-slate-800 mb-1.5">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                All Approvers ({approvers.length})
              </span>
              <span className="text-[10px] text-muted-foreground font-medium">Level 1</span>
            </div>
            <div className="max-h-64 overflow-y-auto space-y-1.5 p-0.5" onWheelCapture={(e) => e.stopPropagation()}>
              {approvers.map((appr) => {
                const displayName = appr.full_name || appr.email || "User";
                const initials = displayName
                  .split(" ")
                  .map((p) => p[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase();
                return (
                  <div
                    key={appr.id}
                    className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800/80 transition-colors"
                  >
                    <div className="h-7 w-7 rounded-full bg-emerald-200 text-emerald-800 dark:bg-emerald-800 dark:text-emerald-100 flex items-center justify-center text-[10px] font-bold shrink-0 shadow-2xs">
                      {initials}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate">
                        {displayName}
                      </span>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground truncate">
                        <span>{appr.email}</span>
                        {appr.job_title && (
                          <>
                            <span>&middot;</span>
                            <span className="text-emerald-700 dark:text-emerald-400 truncate font-medium">
                              {appr.job_title}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}

/** Multi-User Approver Selection Popover */
function MultiUserApproverPopover({
  title,
  subTitle,
  users,
  selectedUserIds,
  onSave,
  isSaving,
  triggerButton,
}: {
  title: string;
  subTitle?: string;
  users: any[];
  selectedUserIds: string[];
  onSave: (userIds: string[]) => Promise<void>;
  isSaving: boolean;
  triggerButton: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [draftIds, setDraftIds] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setDraftIds(selectedUserIds || []);
      setSearch("");
    }
  }, [open, selectedUserIds]);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    const active = users.filter((u) => u.is_active !== false);
    if (!q) return active;
    return active.filter(
      (u) =>
        (u.full_name && u.full_name.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.department && u.department.toLowerCase().includes(q)) ||
        (u.job_title && u.job_title.toLowerCase().includes(q))
    );
  }, [users, search]);

  const toggleUser = (userId: string) => {
    setDraftIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSave = async () => {
    await onSave(draftIds);
    setOpen(false);
  };

  const handleClear = async () => {
    setDraftIds([]);
    await onSave([]);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{triggerButton}</PopoverTrigger>
      <PopoverContent className="w-[380px] sm:w-[420px] p-0 shadow-xl" align="end">
        <div className="p-3 border-b bg-slate-50/80 dark:bg-zinc-900/80">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-semibold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <UserCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              {title}
            </span>
            <span className="text-[10px] text-muted-foreground">Multi-Approver Selection</span>
          </div>
          {subTitle && <p className="text-[11px] text-muted-foreground mb-2">{subTitle}</p>}

          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              autoFocus
              placeholder="Search users by name, email, department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs bg-white dark:bg-zinc-950"
            />
          </div>

          {/* Selected user chips preview */}
          {draftIds.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-2 max-h-20 overflow-y-auto">
              {draftIds.map((uid) => {
                const u = users.find((x) => x.id === uid);
                return (
                  <Badge
                    key={uid}
                    variant="secondary"
                    className="text-[11px] font-normal pl-2 pr-1 py-0.5 gap-1 bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                  >
                    <span>{u ? u.full_name || u.email : uid}</span>
                    <button
                      type="button"
                      onClick={() => toggleUser(uid)}
                      className="hover:bg-emerald-200 dark:hover:bg-emerald-800 rounded-full p-0.5 text-emerald-700 dark:text-emerald-300"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                );
              })}
              <button
                type="button"
                onClick={() => setDraftIds([])}
                className="text-[10px] text-muted-foreground hover:text-red-500 underline ml-1"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* User list with checkboxes */}
        <div
          className="max-h-[260px] overflow-y-auto p-1 divide-y divide-slate-100 dark:divide-slate-800/60"
          onWheelCapture={(e) => e.stopPropagation()}
        >
          {filteredUsers.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground">
              No active users found matching "{search}"
            </div>
          ) : (
            filteredUsers.map((u) => {
              const isChecked = draftIds.includes(u.id);
              return (
                <div
                  key={u.id}
                  onClick={() => toggleUser(u.id)}
                  className={`p-2 rounded-md cursor-pointer text-xs flex items-center justify-between transition-colors ${
                    isChecked
                      ? "bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 font-medium"
                      : "hover:bg-slate-100/80 dark:hover:bg-zinc-800 text-slate-800 dark:text-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={() => toggleUser(u.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="h-7 w-7 rounded-full bg-slate-200 text-slate-700 dark:bg-zinc-700 dark:text-slate-200 flex items-center justify-center text-xs font-semibold shrink-0">
                      {u.full_name
                        ?.split(" ")
                        .map((p: string) => p[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase() || "U"}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold truncate">{u.full_name || u.email}</span>
                        {u.department && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                            {u.department}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground truncate">
                        <span>{u.email}</span>
                        {u.job_title && (
                          <>
                            <span>&middot;</span>
                            <span className="truncate">{u.job_title}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer actions */}
        <div className="p-2.5 border-t bg-slate-50/90 dark:bg-zinc-900/90 flex items-center justify-between gap-2">
          {selectedUserIds && selectedUserIds.length > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              disabled={isSaving}
              onClick={handleClear}
              className="h-8 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
            >
              Unassign All
            </Button>
          ) : (
            <span className="text-[11px] text-muted-foreground">
              {draftIds.length} approver{draftIds.length === 1 ? "" : "s"} selected
            </span>
          )}

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              className="h-8 text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={isSaving}
              onClick={handleSave}
              className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-xs"
            >
              {isSaving ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              {isSaving ? "Saving..." : `Apply (${draftIds.length})`}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default function Dashboard() {
  const kpiRef = useRef<HTMLDivElement>(null);
  // Approver Assignment Modal State
  const [isApproverModalOpen, setIsApproverModalOpen] = useState(false);
  const [workflowAssignments, setWorkflowAssignments] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [activeDropdownRole, setActiveDropdownRole] = useState<string | null>(null);
  const [userSearchText, setUserSearchText] = useState("");
  const [graphSearchResults, setGraphSearchResults] = useState<any[]>([]);
  const [isSearchingGraph, setIsSearchingGraph] = useState(false);

  // Department Approvers & Groups State in Dashboard
  const [deptApprovers, setDeptApprovers] = useState<DepartmentApprover[]>([]);
  const [deptGroups, setDeptGroups] = useState<DepartmentGroup[]>([]);
  const [isDeptLoading, setIsDeptLoading] = useState(false);
  const [savingDept, setSavingDept] = useState<string | null>(null);
  const [savingGroup, setSavingGroup] = useState<string | null>(null);
  const [deptTableSearch, setDeptTableSearch] = useState("");

  // Accordion expanded groups state
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // Drag and drop state
  const [draggedDept, setDraggedDept] = useState<string | null>(null);
  const [dragOverGroup, setDragOverGroup] = useState<string | null>(null);

  // Multi-select state for Department Approvers
  const [selectedDepts, setSelectedDepts] = useState<string[]>([]);
  const [isBatchSaving, setIsBatchSaving] = useState(false);

  // Create & Rename Group Modal States
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupApproverIds, setNewGroupApproverIds] = useState<string[]>([]);
  const [newGroupDeptNames, setNewGroupDeptNames] = useState<string[]>([]);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  const [renameGroupId, setRenameGroupId] = useState<number | null>(null);
  const [renameGroupName, setRenameGroupName] = useState("");
  const [isRenamingGroup, setIsRenamingGroup] = useState(false);

  // Debounced search for Graph Entra users
  useEffect(() => {
    if (!userSearchText || userSearchText.trim().length < 2) {
      setGraphSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearchingGraph(true);
      try {
        const res = await api.get<any[]>(`/graph/users/search?q=${encodeURIComponent(userSearchText.trim())}`);
        setGraphSearchResults(Array.isArray(res) ? res : []);
      } catch (err) {
        console.warn("Graph search failed or unavailable:", err);
        setGraphSearchResults([]);
      } finally {
        setIsSearchingGraph(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [userSearchText]);
  const [isSavingAssignments, setIsSavingAssignments] = useState(false);

  const fetchWorkflowAssignments = async () => {
    setIsDeptLoading(true);
    try {
      const [assnRes, userRes, deptApprRes, groupsRes] = await Promise.all([
        api.get<any[]>("/purchasing/assignments"),
        api.get<any>("/configuration/users?is_active=true"),
        api.get<DepartmentApprover[]>("/purchasing/department-approvers").catch(() => []),
        api.get<DepartmentGroup[]>("/purchasing/department-groups").catch(() => []),
      ]);
      setWorkflowAssignments(assnRes || []);
      setAllUsers(Array.isArray(userRes) ? userRes : (userRes as any).items || []);
      setDeptApprovers(deptApprRes || []);
      setDeptGroups(groupsRes || []);

      // Default expand all groups
      const initialExpanded: Record<string, boolean> = { __UNGROUPED__: true };
      (groupsRes || []).forEach((g: DepartmentGroup) => {
        initialExpanded[g.name] = true;
      });
      setExpandedGroups(initialExpanded);
    } catch (err) {
      console.error("Failed to fetch workflow assignments:", err);
    } finally {
      setIsDeptLoading(false);
    }
  };

  const handleOpenApproverModal = () => {
    fetchWorkflowAssignments();
    setIsApproverModalOpen(true);
  };

  // Filtered department approvers
  const filteredDeptApprovers = useMemo(() => {
    return deptApprovers.filter(
      (d) =>
        !deptTableSearch ||
        d.department.toLowerCase().includes(deptTableSearch.toLowerCase()) ||
        (d.group_name && d.group_name.toLowerCase().includes(deptTableSearch.toLowerCase())) ||
        (d.approver_name && d.approver_name.toLowerCase().includes(deptTableSearch.toLowerCase())) ||
        (d.approvers &&
          d.approvers.some(
            (a) =>
              (a.full_name && a.full_name.toLowerCase().includes(deptTableSearch.toLowerCase())) ||
              (a.email && a.email.toLowerCase().includes(deptTableSearch.toLowerCase()))
          ))
    );
  }, [deptApprovers, deptTableSearch]);

  // Grouped departments map
  const groupedDepartments = useMemo(() => {
    const map: Record<string, DepartmentApprover[]> = {};
    deptGroups.forEach((g) => {
      map[g.name] = [];
    });
    map["__UNGROUPED__"] = [];

    filteredDeptApprovers.forEach((dept) => {
      const gName = dept.group_name && dept.group_name.trim() ? dept.group_name.trim() : "__UNGROUPED__";
      if (!map[gName]) {
        map[gName] = [];
      }
      map[gName].push(dept);
    });

    return map;
  }, [deptGroups, filteredDeptApprovers]);

  const deptStats = useMemo(() => {
    const total = deptApprovers.length;
    const assigned = deptApprovers.filter((d) => Boolean(d.approver_id || (d.approver_ids && d.approver_ids.length > 0))).length;
    const unassigned = total - assigned;
    const groupsCount = deptGroups.length;
    return { total, assigned, unassigned, groupsCount };
  }, [deptApprovers, deptGroups]);

  const toggleGroupExpand = (groupKey: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupKey]: prev[groupKey] === undefined ? false : !prev[groupKey],
    }));
  };

  const handleExpandAll = () => {
    const next: Record<string, boolean> = { __UNGROUPED__: true };
    deptGroups.forEach((g) => { next[g.name] = true; });
    setExpandedGroups(next);
  };

  const handleCollapseAll = () => {
    const next: Record<string, boolean> = { __UNGROUPED__: false };
    deptGroups.forEach((g) => { next[g.name] = false; });
    setExpandedGroups(next);
  };

  // Drag and drop handlers
  const handleDragStartDept = (e: React.DragEvent, deptName: string) => {
    setDraggedDept(deptName);
    e.dataTransfer.setData("text/plain", deptName);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEndDept = () => {
    setDraggedDept(null);
    setDragOverGroup(null);
  };

  const handleDragOverGroup = (e: React.DragEvent, groupName: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverGroup !== groupName) {
      setDragOverGroup(groupName);
    }
  };

  const handleDragLeaveGroup = (e: React.DragEvent) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setDragOverGroup(null);
  };

  const handleDropOnGroup = (e: React.DragEvent, targetGroup: string | null) => {
    e.preventDefault();
    const deptName = e.dataTransfer.getData("text/plain") || draggedDept;
    if (deptName) {
      handleMoveDepartment(deptName, targetGroup);
    }
    setDraggedDept(null);
    setDragOverGroup(null);
  };

  // Multi-select handlers for departments
  const handleToggleSelectDept = (deptName: string) => {
    setSelectedDepts((prev) =>
      prev.includes(deptName) ? prev.filter((d) => d !== deptName) : [...prev, deptName]
    );
  };

  const handleToggleSelectAll = () => {
    const visibleDeptNames = filteredDeptApprovers.map((d) => d.department);
    const allSelected = visibleDeptNames.length > 0 && visibleDeptNames.every((d) => selectedDepts.includes(d));
    if (allSelected) {
      setSelectedDepts((prev) => prev.filter((d) => !visibleDeptNames.includes(d)));
    } else {
      setSelectedDepts((prev) => Array.from(new Set([...prev, ...visibleDeptNames])));
    }
  };

  // Single Department Multi-Approver Assignment
  const handleSelectDepartmentApprovers = async (deptName: string, userIds: string[]) => {
    setSavingDept(deptName);
    const primaryId = userIds.length > 0 ? userIds[0] : null;
    const assignedUserObjects = userIds
      .map((uid) => allUsers.find((u) => u.id === uid))
      .filter(Boolean)
      .map((u) => ({
        id: u.id,
        full_name: u.full_name,
        email: u.email,
        job_title: u.job_title,
        department: u.department,
      }));

    try {
      await api.post("/purchasing/department-approvers/assign", {
        department: deptName,
        user_id: primaryId,
        user_ids: userIds,
      });

      setDeptApprovers((prev) =>
        prev.map((d) => {
          if (d.department.toLowerCase() === deptName.toLowerCase()) {
            const primaryUser = assignedUserObjects[0];
            return {
              ...d,
              approver_id: primaryId,
              approver_name: primaryUser ? primaryUser.full_name || primaryUser.email : null,
              approver_email: primaryUser ? primaryUser.email : null,
              approver_title: primaryUser ? primaryUser.job_title : null,
              approver_ids: userIds.length > 0 ? userIds : null,
              approvers: assignedUserObjects.length > 0 ? assignedUserObjects : null,
              source: primaryId ? "MANUAL" : "UNASSIGNED",
            };
          }
          return d;
        })
      );

      if (userIds.length > 0) {
        toast.success(`Updated Level 1 Approver(s) for ${deptName} (${userIds.length} assigned)`);
      } else {
        toast.info(`Cleared Level 1 Approver(s) for ${deptName}`);
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || "Failed to update department approver");
    } finally {
      setSavingDept(null);
    }
  };

  // Batch assign approvers to all selected departments
  const handleBatchAssignApprovers = async (userIds: string[]) => {
    if (selectedDepts.length === 0) return;
    setIsBatchSaving(true);
    const primaryId = userIds.length > 0 ? userIds[0] : null;
    const assignedUserObjects = userIds
      .map((uid) => allUsers.find((u) => u.id === uid))
      .filter(Boolean)
      .map((u) => ({
        id: u.id,
        full_name: u.full_name,
        email: u.email,
        job_title: u.job_title,
        department: u.department,
      }));

    try {
      await api.post("/purchasing/department-approvers/batch-assign", {
        departments: selectedDepts,
        user_id: primaryId,
        user_ids: userIds,
      });

      const targetDeptsLower = new Set(selectedDepts.map((d) => d.toLowerCase()));
      setDeptApprovers((prev) =>
        prev.map((d) => {
          if (targetDeptsLower.has(d.department.toLowerCase())) {
            const primaryUser = assignedUserObjects[0];
            return {
              ...d,
              approver_id: primaryId,
              approver_name: primaryUser ? primaryUser.full_name || primaryUser.email : null,
              approver_email: primaryUser ? primaryUser.email : null,
              approver_title: primaryUser ? primaryUser.job_title : null,
              approver_ids: userIds.length > 0 ? userIds : null,
              approvers: assignedUserObjects.length > 0 ? assignedUserObjects : null,
              source: primaryId ? "MANUAL" : "UNASSIGNED",
            };
          }
          return d;
        })
      );

      if (userIds.length > 0) {
        toast.success(`Assigned ${userIds.length} Level 1 Approver(s) to ${selectedDepts.length} department(s)`);
      } else {
        toast.info(`Cleared Level 1 Approvers for ${selectedDepts.length} department(s)`);
      }

      setSelectedDepts([]);
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || "Failed to batch assign department approvers");
      fetchWorkflowAssignments();
    } finally {
      setIsBatchSaving(false);
    }
  };

  // Group-Level Multi-Approver Assignment
  const handleAssignGroupApprovers = async (groupName: string, userIds: string[]) => {
    setSavingGroup(groupName);
    const primaryId = userIds.length > 0 ? userIds[0] : null;
    const assignedUserObjects = userIds
      .map((uid) => allUsers.find((u) => u.id === uid))
      .filter(Boolean)
      .map((u) => ({
        id: u.id,
        full_name: u.full_name,
        email: u.email,
        job_title: u.job_title,
        department: u.department,
      }));

    try {
      await api.post("/purchasing/department-groups/assign-approvers", {
        group_name: groupName,
        user_ids: userIds,
      });

      setDeptGroups((prev) =>
        prev.map((g) => {
          if (g.name.toLowerCase() === groupName.toLowerCase()) {
            return {
              ...g,
              approver_ids: userIds.length > 0 ? userIds : null,
              approvers: assignedUserObjects.length > 0 ? assignedUserObjects : null,
            };
          }
          return g;
        })
      );

      setDeptApprovers((prev) =>
        prev.map((d) => {
          if ((d.group_name || "").toLowerCase() === groupName.toLowerCase()) {
            const primaryUser = assignedUserObjects[0];
            return {
              ...d,
              approver_id: primaryId,
              approver_name: primaryUser ? primaryUser.full_name || primaryUser.email : null,
              approver_email: primaryUser ? primaryUser.email : null,
              approver_title: primaryUser ? primaryUser.job_title : null,
              approver_ids: userIds.length > 0 ? userIds : null,
              approvers: assignedUserObjects.length > 0 ? assignedUserObjects : null,
              source: primaryId ? "MANUAL" : "UNASSIGNED",
            };
          }
          return d;
        })
      );

      toast.success(`Assigned ${userIds.length} approver(s) to group "${groupName}"`);
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || "Failed to assign group approvers");
      fetchWorkflowAssignments();
    } finally {
      setSavingGroup(null);
    }
  };

  // Move Department into a Group (Drag & Drop or select)
  const handleMoveDepartment = async (deptName: string, targetGroup: string | null) => {
    const targetGroupClean = targetGroup === "__UNGROUPED__" || !targetGroup ? null : targetGroup.trim();

    setDeptApprovers((prev) =>
      prev.map((d) => (d.department === deptName ? { ...d, group_name: targetGroupClean } : d))
    );

    try {
      await api.post("/purchasing/department-groups/move", {
        departments: [deptName],
        group_name: targetGroupClean,
      });

      toast.success(`Moved ${deptName} to ${targetGroupClean ? `group "${targetGroupClean}"` : "Ungrouped"}`);
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || "Failed to move department");
      fetchWorkflowAssignments();
    }
  };

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
      fetchWorkflowAssignments();
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
      fetchWorkflowAssignments();
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || "Failed to rename group");
    } finally {
      setIsRenamingGroup(false);
    }
  };

  // Delete Group Handler
  const handleDeleteGroup = async (groupId: number, groupName: string) => {
    if (!window.confirm(`Are you sure you want to delete group "${groupName}"? Member departments will become ungrouped.`)) {
      return;
    }
    try {
      await api.delete(`/purchasing/department-groups/${groupId}`);
      toast.info(`Deleted group "${groupName}". Member departments moved to Ungrouped.`);
      fetchWorkflowAssignments();
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || "Failed to delete group");
    }
  };

  const handleToggleUserInRole = (role: string, userId: string, extraUserObj?: any) => {
    if (extraUserObj && !allUsers.some((u) => u.id === userId || u.email === extraUserObj.email)) {
      setAllUsers((prev) => [...prev, { id: userId, full_name: extraUserObj.display_name, email: extraUserObj.email, ...extraUserObj }]);
    }
    setWorkflowAssignments((prev) => {
      const existing = prev.find((a) => a.role === role);
      if (existing) {
        const currentIds: string[] = existing.user_ids || (existing.user_id ? [existing.user_id] : []);
        const nextIds = currentIds.includes(userId)
          ? currentIds.filter((id) => id !== userId)
          : [...currentIds, userId];
        return prev.map((a) => (a.role === role ? { ...a, user_ids: nextIds, user_id: nextIds[0] || null } : a));
      } else {
        return [...prev, { id: 0, role, user_ids: [userId], user_id: userId, active: true }];
      }
    });
  };

  const handleToggleEntraUser = async (role: string, entraUser: any) => {
    const matchingLocal = allUsers.find(
      (u) =>
        (u.microsoft_object_id && u.microsoft_object_id === entraUser.object_id) ||
        (u.email && entraUser.email && u.email.toLowerCase() === entraUser.email.toLowerCase())
    );
    const userId = matchingLocal ? matchingLocal.id : entraUser.object_id || entraUser.email;
    handleToggleUserInRole(role, userId, { ...entraUser, id: userId });
  };

  const handleSaveApproverAssignments = async () => {
    setIsSavingAssignments(true);
    try {
      for (const item of workflowAssignments) {
        const role = item.role;
        const userIds: string[] = item.user_ids || (item.user_id ? [item.user_id] : []);

        if (role === "EXECUTIVE" || role === "MANAGER") {
          const approverRoleCode = role === "EXECUTIVE" ? "HIGH_LEVEL_APPROVER" : "LOW_LEVEL_APPROVER";
          const membersToProvision = userIds
            .map((uid) => {
              const u = allUsers.find((x) => x.id === uid) || {};
              return {
                object_id: u.microsoft_object_id || u.object_id || uid,
                email: u.email || "",
                display_name: u.full_name || u.display_name || "",
                job_title: u.job_title || null,
                department: u.department || null,
              };
            })
            .filter((m) => m.email);

          if (membersToProvision.length > 0) {
            try {
              await api.post(`/approver-roles/${approverRoleCode}/members`, membersToProvision);
            } catch (roleErr) {
              console.warn(`Approver role sync note for ${approverRoleCode}:`, roleErr);
            }
          }
        }

        const payload = {
          role: item.role,
          user_ids: userIds,
          user_id: userIds[0] || null,
          active: true,
        };
        if (item.id && item.id > 0) {
          await api.put(`/purchasing/assignments/${item.id}`, payload);
        } else {
          await api.post("/purchasing/assignments", payload);
        }
      }
      toast.success("Approver assignments updated successfully");
      setIsApproverModalOpen(false);
      fetchWorkflowAssignments();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update approver assignments");
    } finally {
      setIsSavingAssignments(false);
    }
  };

  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: requests = [], refetch: fetchRequests } = usePurchaseRequests();
  const { data: purchasingSummary } = usePurchasingSummary();
  const recurringDueCount = purchasingSummary?.recurring_due_soon_count ?? 0;
  const recurringDueAmount = purchasingSummary?.recurring_due_soon_amount ?? 0;
  const [searchQuery, setSearchQuery] = useState("");
  const [dashboardFilter, setDashboardFilter] = useState<string>("ALL");
  const [selectedTask, setSelectedTask] = useState<any>(null);



  const isTaskOwnedByUser = (task: any, currentUser: any) => {
    if (!currentUser) return false;
    const userFull = (currentUser.full_name || "").trim().toLowerCase();
    const userEmail = (currentUser.email || "").trim().toLowerCase();
    const userName = (currentUser.username || "").trim().toLowerCase();
    const userId = String(currentUser.id || "").trim();

    const reqStr = String(task.requester || task.requester_name || "").trim().toLowerCase();
    const createdByStr = String(task.created_by || task.created_by_name || task.created_by_user_id || task.user_id || "").trim().toLowerCase();
    const reqIdStr = String(task.requester_id || "").trim();

    return Boolean(
      (userFull && reqStr === userFull) ||
      (userEmail && reqStr === userEmail) ||
      (userName && reqStr === userName) ||
      (userId && (userId === reqIdStr || userId === createdByStr || userId === reqStr)) ||
      (userFull && createdByStr === userFull) ||
      (userEmail && createdByStr === userEmail)
    );
  };

  const tasks = useMemo(() => {
    return requests
      .filter((req: any) => {
        const isDraft = parseRequestStatus(req.status) === RequestStatus.Initial;
        if (isDraft) {
          return isTaskOwnedByUser(req, user);
        }
        return true;
      })
      .map((req) => ({
        ...req,
        product_name: req.title,
        category: req.request_type || "SPEND",
        assignee_name: req.assigned_user || req.requester,
      }));
  }, [requests, user]);

  const handleTaskClick = async (taskId: number | string) => {
    try {
      const res = await api.get<any>(`/tasks/${taskId}`);
      setSelectedTask(res);
    } catch (e) {
      console.error(e);
    }
  };

  const activeTasks = useMemo(() => {
    return tasks.filter((t: any) => {
      const s = parseRequestStatus(t.status);
      return s !== RequestStatus.Completed && s !== RequestStatus.Rejected;
    });
  }, [tasks]);

  const pipelineValue = useMemo(() => {
    return activeTasks.reduce((acc: number, t: any) => acc + (Number(t.amount) || 0), 0);
  }, [activeTasks]);

  const totalCount = tasks.length;
  const activeCount = activeTasks.length;

  const filteredTasks = useMemo(() => {
    return tasks.filter((task: any) => {
      if (dashboardFilter === "APPROVALS") {
        const s = String(task.status || "").toUpperCase();
        if (s !== "WAITING_APPROVAL" && s !== "UNDER_REVIEW") return false;
      } else if (dashboardFilter === "UNPAID_INVOICES") {
        const s = String(task.status || "").toUpperCase();
        if (s !== "WAITING_PAYMENT") return false;
      } else if (dashboardFilter === "RECURRING") {
        const cat = String(task.category || "").toUpperCase();
        if (cat !== "RECURRING") return false;
      }
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return Object.values(task).some((value) =>
        value !== null &&
        value !== undefined &&
        String(value).toLowerCase().includes(query)
      );
    });
  }, [tasks, searchQuery, dashboardFilter]);

  return (
    <div className="w-full space-y-3.5 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out relative">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/60 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Welcome back, {user?.full_name || "Admin"}
            </h1>
            <HelpIcon text="Provides a high-level overview of system metrics, active users, recent audit actions, and task execution counts." />
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            This is your central administrative dashboard.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            onClick={handleOpenApproverModal}
            className="flex items-center gap-2 text-xs font-semibold bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 shadow-xs hover:bg-slate-50 dark:hover:bg-zinc-800 hover:border-indigo-300 transition-all h-9 px-3.5"
          >
            <UserCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Assign Approvers</span>
          </Button>
        </div>
      </header>

      {/* Slim Vertical Floating Quick Filter (Aligned with operational cards) */}
      <FloatingVerticalFilter
        items={[
          {
            key: "ALL",
            label: "Active Requests",
            count: purchasingSummary?.open_requests ?? activeCount,
            icon: Activity,
            color: "blue",
          },
          {
            key: "APPROVALS",
            label: "Awaiting Approval",
            count: purchasingSummary?.awaiting_approval ?? 0,
            icon: UserCheck,
            color: "violet",
          },
          {
            key: "UNPAID_INVOICES",
            label: "Unpaid Invoices",
            count: purchasingSummary?.unpaid_invoices ?? 0,
            icon: ReceiptText,
            color: "orange",
          },
          {
            key: "RECURRING",
            label: "Recurring Subscriptions",
            count: purchasingSummary?.recurring_total ?? 0,
            icon: CalendarCheck,
            color: "amber",
          },
        ]}
        activeKey={dashboardFilter}
        onSelect={setDashboardFilter}
        defaultKey="ALL"
        onReset={() => setDashboardFilter("ALL")}
        scrollThreshold={140}
        title="Overview Filters"
        kpiRef={kpiRef}
      />

      {/* Recurring Payments Due Soon Alert Banner */}
      {recurringDueCount > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 sm:px-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800/60 shadow-xs text-amber-900 dark:text-amber-200 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 shrink-0">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div className="text-xs sm:text-sm">
              <span className="font-bold">
                {recurringDueCount === 1 ? "1 Recurring Payment" : `${recurringDueCount} Recurring Payments`} Due Within 7 Days
              </span>
              {recurringDueAmount > 0 && (
                <span className="font-semibold ml-1.5 opacity-90">({formatMoney(recurringDueAmount)})</span>
              )}
              <span className="opacity-75 hidden md:inline ml-2 text-xs">
                Requires review and invoice processing for upcoming payment cycle.
              </span>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate("/purchasing/recurring")}
            className="h-7.5 px-3 text-xs font-semibold border-amber-300 dark:border-amber-700 bg-white dark:bg-zinc-900 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-900 dark:text-amber-200 shrink-0 gap-1.5 shadow-2xs cursor-pointer"
          >
            <span>Review Payments</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* Multi-Module Operations Summary Grid */}
      <div ref={kpiRef} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-in fade-in duration-300">
          {/* 1. Active Purchase Requests */}
          <Card
            onClick={() => setDashboardFilter("ALL")}
            className={`shadow-xs cursor-pointer hover:shadow-md transition-all border border-slate-200/80 dark:border-zinc-800 hover:border-blue-300 ${
              dashboardFilter === "ALL" ? "ring-2 ring-blue-500 bg-blue-50/20 dark:bg-blue-950/20" : ""
            }`}
          >
            <CardContent className="p-3 sm:p-3.5 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 shrink-0">
                <Activity className="w-5 h-5" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-lg sm:text-xl font-bold leading-none mb-1">{purchasingSummary?.open_requests ?? activeCount}</span>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">Active Requests</span>
                <span className="text-[11px] text-muted-foreground mt-0.5">
                  Pipeline: {formatMoney(pipelineValue)} · {totalCount} total
                </span>
              </div>
            </CardContent>
          </Card>

          {/* 2. Pending Approvals */}
          <Card
            onClick={() => setDashboardFilter(dashboardFilter === "APPROVALS" ? "ALL" : "APPROVALS")}
            className={`shadow-xs cursor-pointer hover:shadow-md transition-all border border-slate-200/80 dark:border-zinc-800 hover:border-violet-300 ${
              dashboardFilter === "APPROVALS" ? "ring-2 ring-violet-500 bg-violet-50/20 dark:bg-violet-950/20" : ""
            }`}
          >
            <CardContent className="p-3 sm:p-3.5 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400 shrink-0">
                <UserCheck className="w-5 h-5" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-lg sm:text-xl font-bold leading-none mb-1">{purchasingSummary?.awaiting_approval ?? 0}</span>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">Awaiting Approval</span>
                <span className="text-[11px] text-violet-600 dark:text-violet-400 font-medium mt-0.5">
                  Click to filter board
                </span>
              </div>
            </CardContent>
          </Card>

          {/* 3. Unpaid Invoices (AP) */}
          <Card
            onClick={() => setDashboardFilter(dashboardFilter === "UNPAID_INVOICES" ? "ALL" : "UNPAID_INVOICES")}
            className={`shadow-xs cursor-pointer hover:shadow-md transition-all border border-slate-200/80 dark:border-zinc-800 hover:border-rose-300 ${
              dashboardFilter === "UNPAID_INVOICES" ? "ring-2 ring-rose-500 bg-rose-50/20 dark:bg-rose-950/20" : ""
            }`}
          >
            <CardContent className="p-3 sm:p-3.5 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400 shrink-0">
                <ReceiptText className="w-5 h-5" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-lg sm:text-xl font-bold leading-none mb-1">{purchasingSummary?.unpaid_invoices ?? 0}</span>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">Unpaid Invoices (AP)</span>
                <span className="text-[11px] text-muted-foreground mt-0.5 truncate">
                  {formatMoney(purchasingSummary?.unpaid_amount ?? 0)} due
                </span>
              </div>
            </CardContent>
          </Card>

          {/* 4. Recurring Subscriptions */}
          <Card
            onClick={() => setDashboardFilter(dashboardFilter === "RECURRING" ? "ALL" : "RECURRING")}
            className={`shadow-xs cursor-pointer hover:shadow-md transition-all border border-slate-200/80 dark:border-zinc-800 hover:border-amber-300 ${
              dashboardFilter === "RECURRING" ? "ring-2 ring-amber-500 bg-amber-50/20 dark:bg-amber-950/20" : ""
            }`}
          >
            <CardContent className="p-3 sm:p-3.5 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 shrink-0">
                <CalendarCheck className="w-5 h-5" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-lg sm:text-xl font-bold leading-none mb-1">{purchasingSummary?.recurring_total ?? 0}</span>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">Recurring Payments</span>
                <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5">
                  {(purchasingSummary?.recurring_due_soon_count ?? 0) > 0
                    ? `${purchasingSummary?.recurring_due_soon_count} due in 7 days`
                    : "All up to date"}
                </span>
              </div>
            </CardContent>
          </Card>
      </div>

      {/* Read-Only Tasks Board & Overview Section */}
      <Card className="border border-slate-200 dark:border-zinc-800 shadow-xs overflow-hidden w-full flex flex-col">
        <CardContent className="p-3.5 sm:p-4 flex flex-col gap-3 w-full">
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
                  className="pl-9 pr-8 bg-background h-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {(searchQuery || dashboardFilter !== "ALL") && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setDashboardFilter("ALL");
                    }}
                    className="absolute right-2.5 top-2 text-muted-foreground hover:text-foreground transition-colors"
                    title="Clear filter"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
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
          fetchRequests();
          if (selectedTask?.id) handleTaskClick(selectedTask.id);
        }}
        readOnly={true}
      />

      {/* Executive Approver Assignment & Delegation Modal */}
      <Dialog open={isApproverModalOpen} onOpenChange={setIsApproverModalOpen}>
        <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto p-6 rounded-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/40 text-indigo-600 dark:text-indigo-400 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-slate-900 dark:text-zinc-100">
                  CEO / Executive Approver & Workflow Assignment
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Organize departments into group tabs, assign multiple Level 1 approvers, and manage operational teams.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <Tabs defaultValue="departments" className="w-full mt-2">
            <TabsList className="grid grid-cols-2 w-full mb-4">
              <TabsTrigger value="departments" className="text-xs font-semibold gap-1.5 py-2">
                <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Level 1 Department Approvers
              </TabsTrigger>              <TabsTrigger value="operational" className="text-xs font-semibold gap-1.5 py-2">
                <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Operational Roles
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: Department Level 1 Approvers */}
            <TabsContent value="departments" className="space-y-4 m-0">
              {/* Stats Summary & Top Toolbar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 bg-slate-50/80 dark:bg-zinc-900/60 rounded-xl border border-slate-200/80 dark:border-zinc-800">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <Badge variant="secondary" className="gap-1.5 bg-white dark:bg-zinc-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-zinc-700 py-1 px-2.5 font-medium shadow-2xs">
                    <Building2 className="h-3.5 w-3.5 text-slate-500" />
                    Departments: <span className="font-bold">{deptStats.total}</span>
                  </Badge>
                  <Badge variant="secondary" className="gap-1.5 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 py-1 px-2.5 font-medium shadow-2xs">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    Assigned: <span className="font-bold">{deptStats.assigned}</span>
                  </Badge>
                  {deptStats.unassigned > 0 && (
                    <Badge variant="secondary" className="gap-1.5 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800 py-1 px-2.5 font-medium shadow-2xs">
                      <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                      Unassigned: <span className="font-bold">{deptStats.unassigned}</span>
                    </Badge>
                  )}
                  <Badge variant="secondary" className="gap-1.5 bg-indigo-50 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 py-1 px-2.5 font-medium shadow-2xs">
                    <Layers className="h-3.5 w-3.5 text-indigo-600" />
                    Group Tabs: <span className="font-bold">{deptStats.groupsCount}</span>
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Search departments, groups, users..."
                      value={deptTableSearch}
                      onChange={(e) => setDeptTableSearch(e.target.value)}
                      className="h-8 pl-8 text-xs bg-white dark:bg-zinc-800"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExpandAll}
                    className="h-8 text-xs px-2.5 gap-1 text-slate-700 dark:text-slate-300 hidden sm:flex"
                  >
                    Expand All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCollapseAll}
                    className="h-8 text-xs px-2.5 gap-1 text-slate-700 dark:text-slate-300 hidden sm:flex"
                  >
                    Collapse All
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      setNewGroupName("");
                      setNewGroupApproverIds([]);
                      setNewGroupDeptNames([]);
                      setIsCreateGroupOpen(true);
                    }}
                    className="h-8 text-xs px-2.5 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs shrink-0"
                  >
                    <FolderPlus className="h-3.5 w-3.5" />
                    <span>New Group</span>
                  </Button>
                </div>
              </div>

              {/* Multi-Select Action Banner for Departments */}
              {selectedDepts.length > 0 && (
                <div className="flex items-center justify-between gap-3 p-3 bg-indigo-50/90 dark:bg-indigo-950/50 rounded-xl border border-indigo-200 dark:border-indigo-900/60 transition-all animate-in fade-in slide-in-from-top-1">
                  <div className="flex items-center gap-2 text-xs font-semibold text-indigo-900 dark:text-indigo-200">
                    <CheckSquare className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    <span>{selectedDepts.length} department(s) selected</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MultiUserApproverPopover
                      title={`Batch Assign Approvers (${selectedDepts.length} Departments)`}
                      subTitle={`Select one or more Level 1 approvers to assign to all ${selectedDepts.length} selected department(s).`}
                      users={allUsers}
                      selectedUserIds={[]}
                      onSave={handleBatchAssignApprovers}
                      isSaving={isBatchSaving}
                      triggerButton={
                        <Button
                          size="sm"
                          className="h-7.5 text-xs px-3 bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 shadow-xs font-medium cursor-pointer"
                        >
                          <Users className="h-3.5 w-3.5" />
                          <span>Assign Approvers to Selected</span>
                        </Button>
                      }
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedDepts([])}
                      className="h-7.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-zinc-800"
                    >
                      Clear Selection
                    </Button>
                  </div>
                </div>
              )}

              {/* Department Groups Accordion & Ungrouped List */}
              {isDeptLoading ? (
                <div className="py-12 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                  Loading workflow departments & groups...
                </div>
              ) : filteredDeptApprovers.length === 0 ? (
                <div className="py-12 text-center text-xs text-muted-foreground bg-slate-50/50 dark:bg-zinc-900/30 rounded-xl border border-dashed">
                  No departments found matching your search.
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Select All Toggle Bar */}
                  <div className="flex items-center justify-between px-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={
                          filteredDeptApprovers.length > 0 &&
                          filteredDeptApprovers.every((d) => selectedDepts.includes(d.department))
                        }
                        onCheckedChange={handleToggleSelectAll}
                        aria-label="Select all visible departments"
                      />
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        Select All Visible ({filteredDeptApprovers.length})
                      </span>
                    </div>
                    <span className="text-[11px] italic hidden sm:inline">
                      Tip: Drag and drop any department row to move between group tabs.
                    </span>
                  </div>

                  {/* Render Custom Groups */}
                  {deptGroups.map((group) => {
                    const groupDepts = groupedDepartments[group.name] || [];
                    const isExpanded = expandedGroups[group.name] !== false; // default open
                    const isSavingThisGroup = savingGroup === group.name;
                    const isDragTarget = dragOverGroup === group.name;

                    return (
                      <div
                        key={group.id}
                        onDragOver={(e) => handleDragOverGroup(e, group.name)}
                        onDragLeave={handleDragLeaveGroup}
                        onDrop={(e) => handleDropOnGroup(e, group.name)}
                        className={`rounded-xl border transition-all duration-150 ${
                          isDragTarget
                            ? "border-emerald-500 ring-2 ring-emerald-500/30 bg-emerald-50/30 dark:bg-emerald-950/20"
                            : "border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 shadow-2xs"
                        }`}
                      >
                        {/* Group Header */}
                        <div className="p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-zinc-800/80 bg-slate-50/60 dark:bg-zinc-900/80 rounded-t-xl">
                          <div className="flex items-center gap-2 min-w-0">
                            <button
                              type="button"
                              onClick={() => toggleGroupExpand(group.name)}
                              className="p-1 hover:bg-slate-200/70 dark:hover:bg-zinc-800 rounded-md transition-colors text-slate-500 dark:text-slate-400"
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </button>

                            <div className="p-1.5 rounded-lg bg-emerald-100/70 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80 shrink-0">
                              <Folder className="h-4 w-4" />
                            </div>

                            <div className="flex flex-col min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                                  {group.name}
                                </span>
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] font-semibold bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                                >
                                  {groupDepts.length} {groupDepts.length === 1 ? "dept" : "depts"}
                                </Badge>
                              </div>
                            </div>
                          </div>

                          {/* Group Action Buttons */}
                          <div className="flex items-center gap-2 shrink-0">
                            <MultiUserApproverPopover
                              title={`Assign Approvers for Group: "${group.name}"`}
                              subTitle={`Assign approvers to all ${groupDepts.length} department(s) inside this group tab.`}
                              users={allUsers}
                              selectedUserIds={group.approver_ids || []}
                              onSave={(ids) => handleAssignGroupApprovers(group.name, ids)}
                              isSaving={isSavingThisGroup}
                              triggerButton={
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7.5 text-xs px-2.5 gap-1.5 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 bg-white dark:bg-zinc-900 shadow-2xs font-medium cursor-pointer"
                                >
                                  <UserCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                                  <span>Assign Group Approvers</span>
                                </Button>
                              }
                            />

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setRenameGroupId(group.id);
                                setRenameGroupName(group.name);
                              }}
                              className="h-7.5 w-7.5 p-0 text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-zinc-800"
                              title="Rename Group"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteGroup(group.id, group.name)}
                              className="h-7.5 w-7.5 p-0 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
                              title="Delete Group"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>

                        {/* Group Content: Departments */}
                        {isExpanded && (
                          <div className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                            {groupDepts.length === 0 ? (
                              <div className="py-6 px-4 text-center text-xs text-muted-foreground italic bg-slate-50/20 dark:bg-zinc-900/20">
                                No departments in this group yet. Drag and drop departments here.
                              </div>
                            ) : (
                              groupDepts.map((dept) => {
                                const approversList = dept.approvers || (dept.approver_id ? [{
                                  id: dept.approver_id,
                                  full_name: dept.approver_name,
                                  email: dept.approver_email,
                                  job_title: dept.approver_title,
                                }] : []);
                                const isSelected = selectedDepts.includes(dept.department);
                                const isSaving = savingDept === dept.department;
                                const isBeingDragged = draggedDept === dept.department;

                                return (
                                  <div
                                    key={dept.department}
                                    draggable
                                    onDragStart={(e) => handleDragStartDept(e, dept.department)}
                                    onDragEnd={handleDragEndDept}
                                    className={`p-3 sm:px-4 flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors ${
                                      isBeingDragged ? "opacity-40 bg-slate-100 dark:bg-zinc-800" : ""
                                    } ${isSelected ? "bg-indigo-50/40 dark:bg-indigo-950/20" : "hover:bg-slate-50/60 dark:hover:bg-zinc-900/40"}`}
                                  >
                                    <div className="flex items-center gap-3 min-w-0">
                                      <div className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                        <GripVertical className="h-4 w-4" />
                                      </div>

                                      <Checkbox
                                        checked={isSelected}
                                        onCheckedChange={() => handleToggleSelectDept(dept.department)}
                                        aria-label={`Select ${dept.department}`}
                                      />

                                      <div className="flex flex-col min-w-0">
                                        <div className="flex items-center gap-2">
                                          <span className="font-semibold text-xs text-slate-900 dark:text-zinc-100 truncate">
                                            {dept.department}
                                          </span>
                                          {dept.source === "UNASSIGNED" && (
                                            <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-950/40">
                                              Unassigned
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Approver Badges & Actions */}
                                    <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                                      <ApproverPillList approvers={approversList} />

                                      {/* Dropdown to move to another group */}
                                      <Popover>
                                        <PopoverTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 text-[11px] px-2 text-muted-foreground hover:text-slate-900 dark:hover:text-slate-100 gap-1"
                                            title="Move to another group"
                                          >
                                            <span>Move</span>
                                            <ChevronDown className="h-3 w-3" />
                                          </Button>
                                        </PopoverTrigger>
                                        <PopoverContent align="end" className="w-48 p-1 text-xs">
                                          <div className="px-2 py-1 font-semibold text-[11px] text-muted-foreground border-b mb-1">
                                            Move to Group Tab
                                          </div>
                                          <div
                                            onClick={() => handleMoveDepartment(dept.department, null)}
                                            className="p-1.5 rounded cursor-pointer hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-slate-300"
                                          >
                                            Ungrouped (General)
                                          </div>
                                          {deptGroups.map((g) => (
                                            <div
                                              key={g.id}
                                              onClick={() => handleMoveDepartment(dept.department, g.name)}
                                              className={`p-1.5 rounded cursor-pointer hover:bg-slate-100 dark:hover:bg-zinc-800 flex items-center justify-between ${
                                                dept.group_name === g.name ? "font-bold text-emerald-600 dark:text-emerald-400" : ""
                                              }`}
                                            >
                                              <span className="truncate">{g.name}</span>
                                              {dept.group_name === g.name && <Check className="h-3 w-3" />}
                                            </div>
                                          ))}
                                        </PopoverContent>
                                      </Popover>

                                      <MultiUserApproverPopover
                                        title={`Assign Approver(s) for "${dept.department}"`}
                                        subTitle="Select one or more Level 1 department approvers."
                                        users={allUsers}
                                        selectedUserIds={dept.approver_ids || (dept.approver_id ? [dept.approver_id] : [])}
                                        onSave={(ids) => handleSelectDepartmentApprovers(dept.department, ids)}
                                        isSaving={isSaving}
                                        triggerButton={
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-7 text-xs px-2.5 gap-1.5 border-slate-300 dark:border-zinc-700 hover:border-emerald-500 text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 cursor-pointer"
                                          >
                                            {isSaving ? (
                                              <RefreshCw className="h-3 w-3 animate-spin" />
                                            ) : (
                                              <UserCheck className="h-3 w-3" />
                                            )}
                                            <span>{isSaving ? "Saving..." : approversList.length > 0 ? "Edit" : "Assign"}</span>
                                          </Button>
                                        }
                                      />
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Ungrouped Departments Container */}
                  {(() => {
                    const ungrouped = groupedDepartments["__UNGROUPED__"] || [];
                    if (ungrouped.length === 0 && deptGroups.length > 0) return null;
                    const isExpanded = expandedGroups["__UNGROUPED__"] !== false;
                    const isDragTarget = dragOverGroup === "__UNGROUPED__";

                    return (
                      <div
                        onDragOver={(e) => handleDragOverGroup(e, "__UNGROUPED__")}
                        onDragLeave={handleDragLeaveGroup}
                        onDrop={(e) => handleDropOnGroup(e, null)}
                        className={`rounded-xl border transition-all duration-150 ${
                          isDragTarget
                            ? "border-indigo-500 ring-2 ring-indigo-500/30 bg-indigo-50/30 dark:bg-indigo-950/20"
                            : "border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 shadow-2xs"
                        }`}
                      >
                        <div className="p-3 sm:p-3.5 flex items-center justify-between gap-3 border-b border-slate-100 dark:border-zinc-800/80 bg-slate-50/60 dark:bg-zinc-900/80 rounded-t-xl">
                          <div className="flex items-center gap-2 min-w-0">
                            <button
                              type="button"
                              onClick={() => toggleGroupExpand("__UNGROUPED__")}
                              className="p-1 hover:bg-slate-200/70 dark:hover:bg-zinc-800 rounded-md transition-colors text-slate-500 dark:text-slate-400"
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </button>

                            <div className="p-1.5 rounded-lg bg-slate-200 text-slate-700 dark:bg-zinc-800 dark:text-slate-300 shrink-0">
                              <Building2 className="h-4 w-4" />
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                                {deptGroups.length > 0 ? "General / Ungrouped Departments" : "All Departments"}
                              </span>
                              <Badge variant="secondary" className="text-[10px] font-semibold">
                                {ungrouped.length} {ungrouped.length === 1 ? "dept" : "depts"}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                            {ungrouped.length === 0 ? (
                              <div className="py-6 px-4 text-center text-xs text-muted-foreground italic bg-slate-50/20 dark:bg-zinc-900/20">
                                No ungrouped departments. All departments belong to a group tab.
                              </div>
                            ) : (
                              ungrouped.map((dept) => {
                                const approversList = dept.approvers || (dept.approver_id ? [{
                                  id: dept.approver_id,
                                  full_name: dept.approver_name,
                                  email: dept.approver_email,
                                  job_title: dept.approver_title,
                                }] : []);
                                const isSelected = selectedDepts.includes(dept.department);
                                const isSaving = savingDept === dept.department;
                                const isBeingDragged = draggedDept === dept.department;

                                return (
                                  <div
                                    key={dept.department}
                                    draggable
                                    onDragStart={(e) => handleDragStartDept(e, dept.department)}
                                    onDragEnd={handleDragEndDept}
                                    className={`p-3 sm:px-4 flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors ${
                                      isBeingDragged ? "opacity-40 bg-slate-100 dark:bg-zinc-800" : ""
                                    } ${isSelected ? "bg-indigo-50/40 dark:bg-indigo-950/20" : "hover:bg-slate-50/60 dark:hover:bg-zinc-900/40"}`}
                                  >
                                    <div className="flex items-center gap-3 min-w-0">
                                      <div className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                        <GripVertical className="h-4 w-4" />
                                      </div>

                                      <Checkbox
                                        checked={isSelected}
                                        onCheckedChange={() => handleToggleSelectDept(dept.department)}
                                        aria-label={`Select ${dept.department}`}
                                      />

                                      <div className="flex flex-col min-w-0">
                                        <div className="flex items-center gap-2">
                                          <span className="font-semibold text-xs text-slate-900 dark:text-zinc-100 truncate">
                                            {dept.department}
                                          </span>
                                          {dept.source === "UNASSIGNED" && (
                                            <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-950/40">
                                              Unassigned
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Approver Badges & Actions */}
                                    <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                                      <ApproverPillList approvers={approversList} />

                                      {deptGroups.length > 0 && (
                                        <Popover>
                                          <PopoverTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="h-7 text-[11px] px-2 text-muted-foreground hover:text-slate-900 dark:hover:text-slate-100 gap-1"
                                              title="Move to a group"
                                            >
                                              <span>Move to Group</span>
                                              <ChevronDown className="h-3 w-3" />
                                            </Button>
                                          </PopoverTrigger>
                                          <PopoverContent align="end" className="w-48 p-1 text-xs">
                                            <div className="px-2 py-1 font-semibold text-[11px] text-muted-foreground border-b mb-1">
                                              Move to Group Tab
                                            </div>
                                            {deptGroups.map((g) => (
                                              <div
                                                key={g.id}
                                                onClick={() => handleMoveDepartment(dept.department, g.name)}
                                                className="p-1.5 rounded cursor-pointer hover:bg-slate-100 dark:hover:bg-zinc-800 flex items-center justify-between"
                                              >
                                                <span className="truncate">{g.name}</span>
                                              </div>
                                            ))}
                                          </PopoverContent>
                                        </Popover>
                                      )}

                                      <MultiUserApproverPopover
                                        title={`Assign Approver(s) for "${dept.department}"`}
                                        subTitle="Select one or more Level 1 department approvers."
                                        users={allUsers}
                                        selectedUserIds={dept.approver_ids || (dept.approver_id ? [dept.approver_id] : [])}
                                        onSave={(ids) => handleSelectDepartmentApprovers(dept.department, ids)}
                                        isSaving={isSaving}
                                        triggerButton={
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-7 text-xs px-2.5 gap-1.5 border-slate-300 dark:border-zinc-700 hover:border-emerald-500 text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 cursor-pointer"
                                          >
                                            {isSaving ? (
                                              <RefreshCw className="h-3 w-3 animate-spin" />
                                            ) : (
                                              <UserCheck className="h-3 w-3" />
                                            )}
                                            <span>{isSaving ? "Saving..." : approversList.length > 0 ? "Edit" : "Assign"}</span>
                                          </Button>
                                        }
                                      />
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
            </TabsContent>

            {/* TAB 2: Operational Roles */}
            <TabsContent value="operational" className="space-y-4 m-0">
              {[
                {
                  role: "PURCHASING",
                  label: "Purchasing Lead",
                  desc: "Vendor quote negotiations, purchase orders, and fulfillment.",
                  badgeColor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200",
                },
                {
                  role: "AP",
                  label: "Accounts Payable (AP)",
                  desc: "Invoice matching, vendor statement review, and GL validation.",
                  badgeColor: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200",
                },
                {
                  role: "TREASURY",
                  label: "Treasury Officer",
                  desc: "Bank disbursement, wire authorization, and final settlement.",
                  badgeColor: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300 border-sky-200",
                },
                {
                  role: "ADMIN",
                  label: "System & Workflow Administrator",
                  desc: "Administrative system configuration and workflow management.",
                  badgeColor: "bg-slate-100 text-slate-800 dark:bg-zinc-800 dark:text-slate-300 border-slate-200",
                },
              ].map(({ role, label, desc, badgeColor }) => {
                const assignment = workflowAssignments.find((a) => a.role === role);
                const assignedIds: string[] = assignment?.user_ids || (assignment?.user_id ? [assignment.user_id] : []);

                return (
                  <div
                    key={role}
                    className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-900/40 space-y-2.5 transition-all hover:border-slate-300 dark:hover:border-zinc-700"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900 dark:text-zinc-100">{label}</span>
                          <Badge variant="outline" className={`text-[10px] font-semibold px-2 py-0.5 ${badgeColor}`}>
                            {role}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                      </div>

                      <Popover
                        open={activeDropdownRole === role}
                        onOpenChange={(open) => setActiveDropdownRole(open ? role : null)}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs font-medium border-dashed border-slate-300 dark:border-zinc-700 hover:border-indigo-400 bg-white dark:bg-zinc-900 shrink-0 mt-1 sm:mt-0"
                          >
                            <UserCheck className="w-3.5 h-3.5 mr-1 text-indigo-500" />
                            Assign / Edit
                            <ChevronDown className="w-3.5 h-3.5 ml-1 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[360px] p-0" align="end">
                          <div className="flex items-center border-b px-3 py-2">
                            <Search className="w-4 h-4 mr-2 text-muted-foreground shrink-0" />
                            <input
                              placeholder="Search directory or Microsoft Entra..."
                              value={userSearchText}
                              onChange={(e) => setUserSearchText(e.target.value)}
                              className="w-full text-xs bg-transparent outline-none placeholder:text-muted-foreground"
                            />
                            {isSearchingGraph && <div className="w-3 h-3 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin ml-2 shrink-0" />}
                          </div>
                          <div className="max-h-[260px] overflow-y-auto p-1.5 space-y-1 divide-y divide-slate-100 dark:divide-zinc-800">
                            {/* Portal Directory Users */}
                            <div className="space-y-1 pb-1">
                              {allUsers
                                .filter(
                                  (u) =>
                                    u.is_active !== false &&
                                    (u.full_name || u.email || "")
                                      .toLowerCase()
                                      .includes(userSearchText.toLowerCase())
                                )
                                .map((u) => {
                                  const isChecked = assignedIds.includes(u.id);
                                  return (
                                    <button
                                      key={u.id}
                                      type="button"
                                      onClick={() => handleToggleUserInRole(role, u.id)}
                                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors text-left ${
                                        isChecked
                                          ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 font-medium"
                                          : "hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300"
                                      }`}
                                    >
                                      <div className="flex flex-col min-w-0 pr-2">
                                        <span className="truncate">{u.full_name || "Unnamed"}</span>
                                        <span className="text-[10px] text-muted-foreground truncate">{u.email}</span>
                                      </div>
                                      {isChecked && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
                                    </button>
                                  );
                                })}
                            </div>

                            {/* Microsoft Entra Graph Search Results */}
                            {graphSearchResults.length > 0 && (
                              <div className="pt-2 space-y-1">
                                <div className="px-2 py-0.5 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                                  <Sparkles className="w-3 h-3" />
                                  Microsoft Entra Directory
                                </div>
                                {graphSearchResults
                                  .filter((gu) => !allUsers.some((u) => u.email && gu.email && u.email.toLowerCase() === gu.email.toLowerCase()))
                                  .map((gu) => {
                                    const entraKey = gu.object_id || gu.email;
                                    const isChecked = assignedIds.includes(entraKey);
                                    return (
                                      <button
                                        key={entraKey}
                                        type="button"
                                        onClick={() => handleToggleEntraUser(role, gu)}
                                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors text-left ${
                                          isChecked
                                            ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 font-medium"
                                            : "hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300"
                                        }`}
                                      >
                                        <div className="flex flex-col min-w-0 pr-2">
                                          <div className="flex items-center gap-1.5">
                                            <span className="truncate">{gu.display_name || "Unnamed"}</span>
                                            <span className="px-1 py-0.2 text-[9px] bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 rounded font-medium">Entra</span>
                                          </div>
                                          <span className="text-[10px] text-muted-foreground truncate">{gu.email || gu.user_principal_name}</span>
                                        </div>
                                        {isChecked && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
                                      </button>
                                    );
                                  })}
                              </div>
                            )}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Assigned Users Badges */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {assignedIds.length === 0 ? (
                        <span className="text-xs text-muted-foreground italic">No approvers assigned</span>
                      ) : (
                        assignedIds.map((uid) => {
                          const userObj = allUsers.find((x) => x.id === uid);
                          return (
                            <Badge
                              key={uid}
                              variant="secondary"
                              className="text-xs py-1 px-2.5 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 shadow-2xs flex items-center gap-1.5 font-normal text-slate-800 dark:text-zinc-200"
                            >
                              <span>{userObj?.full_name || userObj?.email || uid}</span>
                              <button
                                type="button"
                                onClick={() => handleToggleUserInRole(role, uid)}
                                className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 ml-0.5 transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </TabsContent>
          </Tabs>

          <DialogFooter className="border-t border-slate-100 dark:border-zinc-800 pt-3">
            <Button variant="ghost" size="sm" onClick={() => setIsApproverModalOpen(false)}>
              Close
            </Button>
            <Button
              size="sm"
              onClick={handleSaveApproverAssignments}
              disabled={isSavingAssignments}
              className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5"
            >
              {isSavingAssignments ? (
                "Saving..."
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Save Operational Roles
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Department Group Modal */}
      <Dialog open={isCreateGroupOpen} onOpenChange={setIsCreateGroupOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-100/70 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                <FolderPlus className="h-4 w-4" />
              </div>
              <DialogTitle className="text-base font-bold">Create Group Tab</DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Create a group tab to organize multiple departments and assign approvers together.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Group Name <span className="text-red-500">*</span>
              </label>
              <Input
                autoFocus
                placeholder="e.g. Engineering & Technology, Sales & Marketing"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCreateGroupOpen(false)}
              disabled={isCreatingGroup}
              className="h-8 text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleCreateGroup}
              disabled={isCreatingGroup || !newGroupName.trim()}
              className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
            >
              {isCreatingGroup ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              {isCreatingGroup ? "Creating..." : "Create Group"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Department Group Modal */}
      <Dialog open={Boolean(renameGroupId)} onOpenChange={(open) => !open && setRenameGroupId(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-100/70 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                <Edit2 className="h-4 w-4" />
              </div>
              <DialogTitle className="text-base font-bold">Rename Group Tab</DialogTitle>
            </div>
          </DialogHeader>

          <div className="py-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
              Group Name
            </label>
            <Input
              autoFocus
              value={renameGroupName}
              onChange={(e) => setRenameGroupName(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRenameGroupId(null)}
              disabled={isRenamingGroup}
              className="h-8 text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleRenameGroup}
              disabled={isRenamingGroup || !renameGroupName.trim()}
              className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
            >
              {isRenamingGroup ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              {isRenamingGroup ? "Saving..." : "Save Name"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}