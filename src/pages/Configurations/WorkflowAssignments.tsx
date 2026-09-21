import { formatRequestType } from "@/pages/Purchasing/purchasingMeta";
import { useState, useEffect, useMemo } from "react";
import HelpIcon from "@/components/ui/HelpIcon";
import { apiClient as api } from "@/services/apiClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  Edit2, X, Search, ChevronDown, ChevronRight, Check,
  Building2, UserCheck, Users, User, RefreshCw, CheckCircle2, AlertCircle,
  ChevronsUpDown, ShoppingCart, CreditCard, Landmark, SlidersHorizontal, CheckSquare,
  Plus, FolderPlus, GripVertical, Trash2, Folder, Layers, ShieldCheck
} from "lucide-react";

type Assignment = {
  id: number;
  role: string;
  user_id: string | null;
  user_ids?: string[];
  department?: string | null;
  team_id: string | null;
  request_type: string | null;
  active: boolean;
};

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

const ROLE_STATES_MAP: Record<string, string[]> = {
  "COMPANY_LEVEL_2_APPROVER": ["Waiting Approval (>= $10k or Escalated, Company Level 2)"],
  "PURCHASING": ["New Request", "Under Review", "Purchased / Ordered", "Goods Received (CC)", "Waiting Payment (Credit Card)"],
  "MANAGER": ["Waiting Approval (< $10k)"],
  "EXECUTIVE": ["Waiting Approval (>= $10k)"],
  "DIRECTOR": ["Waiting Approval"],
  "VP": ["Waiting Approval"],
  "AP": ["Goods Received (Debit / Wire)", "Waiting Payment (Debit Card / Invoices)", "Waiting Payment (Wire Transfer)"],
  "RECEIVING": ["Shipped", "Goods Received"],
  "TREASURY": ["Waiting Payment (Wire Transfer)", "Completed"],
};

const PRIMARY_ROLE_TABS = [
  {
    key: "departments",
    label: "Level 1 Department Approvers",
    shortLabel: "Level 1 Approvers",
    icon: Building2,
    color: "text-emerald-600 dark:text-emerald-400",
    badgeColor: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
  },
  {
    key: "COMPANY_LEVEL_2_APPROVER",
    label: "Level 2 Company Approvers",
    shortLabel: "Level 2 Approvers",
    icon: ShieldCheck,
    color: "text-purple-600 dark:text-purple-400",
    badgeColor: "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800",
    roleCode: "COMPANY_LEVEL_2_APPROVER",
    desc: "Executive / Company-wide final sign-off for requests ≥ $10k, escalated amounts, or corporate oversight.",
    states: ["Waiting Approval (>= $10k or Escalated, Company Level 2)"]
  },
  {
    key: "PURCHASING",
    label: "Purchasing Team",
    shortLabel: "Purchasing",
    icon: ShoppingCart,
    color: "text-indigo-600 dark:text-indigo-400",
    roleCode: "PURCHASING",
    desc: "Procurement, vendor quote negotiations, purchasing orders, and credit card settlements.",
    states: ["New Request", "Under Review", "Purchased / Ordered", "Goods Received (CC)", "Waiting Payment (Credit Card)"]
  },
  {
    key: "AP",
    label: "Accounts Payable (AP)",
    shortLabel: "Accounts Payable",
    icon: CreditCard,
    color: "text-amber-600 dark:text-amber-400",
    roleCode: "AP",
    desc: "Invoice matching, vendor statement review, GL validation, and debit/wire handling.",
    states: ["Goods Received (Debit / Wire)", "Waiting Payment (Debit Card / Invoices)", "Waiting Payment (Wire Transfer)"]
  },
  {
    key: "TREASURY",
    label: "Treasury",
    shortLabel: "Treasury",
    icon: Landmark,
    color: "text-sky-600 dark:text-sky-400",
    roleCode: "TREASURY",
    desc: "Bank disbursement, wire authorization, high-value release, and final settlement.",
    states: ["Waiting Payment (Wire Transfer)", "Completed"]
  },
  {
    key: "all_roles",
    label: "All Operational Roles",
    shortLabel: "All Roles",
    icon: SlidersHorizontal,
    color: "text-slate-600 dark:text-slate-400"
  },
];

const SUGGESTED_ROLES = [
  { code: "COMPANY_LEVEL_2_APPROVER", label: "Level 2 Approver", desc: "Company Level 2 executive approval (≥ $10k)" },
  { code: "PURCHASING", label: "Purchasing", desc: "Purchasing and procurement processing" },
  { code: "AP", label: "Accounts Payable", desc: "Invoice payment and debit/wire handling" },
  { code: "TREASURY", label: "Treasury", desc: "Treasury and high-value payment approval" },
  { code: "ADMIN", label: "Administrator", desc: "Workflow and system administration" },
];

/** Rich Level 1 Approver Pill */
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
              const isSelected = draftIds.includes(u.id);
              return (
                <div
                  key={u.id}
                  onClick={() => toggleUser(u.id)}
                  className={`p-2 rounded cursor-pointer text-xs flex items-center justify-between transition-colors ${
                    isSelected
                      ? "bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200"
                      : "hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-800 dark:text-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleUser(u.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="shrink-0"
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

export default function WorkflowAssignments() {
  const [activeTab, setActiveTab] = useState("departments");
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [deptApprovers, setDeptApprovers] = useState<DepartmentApprover[]>([]);
  const [deptGroups, setDeptGroups] = useState<DepartmentGroup[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeptLoading, setIsDeptLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState<Partial<Assignment>>({
    role: "",
    user_id: "",
    department: null,
    request_type: "ALL",
    active: true,
  });

  // Accordion expanded groups state (mapping group key -> boolean)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // Drag and Drop state
  const [draggedDept, setDraggedDept] = useState<string | null>(null);
  const [dragOverGroup, setDragOverGroup] = useState<string | null>(null);

  // Department saving state
  const [savingDept, setSavingDept] = useState<string | null>(null);
  const [savingGroup, setSavingGroup] = useState<string | null>(null);

  // Multi-Select Checkboxes State for Departments
  const [selectedDepts, setSelectedDepts] = useState<string[]>([]);
  const [isBatchSaving, setIsBatchSaving] = useState(false);

  // Search filter for departments sub-table
  const [deptSearch, setDeptSearch] = useState("");

  // Search filter for operational roles list
  const [operationalSearch, setOperationalSearch] = useState("");

  // Create & Rename Group Modal States
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupApproverIds, setNewGroupApproverIds] = useState<string[]>([]);
  const [newGroupDeptNames, setNewGroupDeptNames] = useState<string[]>([]);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  const [renameGroupId, setRenameGroupId] = useState<number | null>(null);
  const [renameGroupName, setRenameGroupName] = useState("");
  const [isRenamingGroup, setIsRenamingGroup] = useState(false);

  // Custom dropdown states for operational role modal
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [userSearch, setUserSearch] = useState("");

  const fetchData = async () => {
    setIsLoading(true);
    setIsDeptLoading(true);
    try {
      const [assnRes, userRes, deptRes, deptApprRes, groupsRes] = await Promise.all([
        api.get<Assignment[]>("/purchasing/assignments"),
        api.get<any>("/configuration/users?is_active=true"),
        api.get<string[]>("/purchasing/departments").catch(() => []),
        api.get<DepartmentApprover[]>("/purchasing/department-approvers").catch(() => []),
        api.get<DepartmentGroup[]>("/purchasing/department-groups").catch(() => []),
      ]);
      setAssignments(assnRes || []);
      setUsers(Array.isArray(userRes) ? userRes : (userRes as any).items || []);
      setDepartments(Array.isArray(deptRes) ? deptRes : []);
      setDeptApprovers(deptApprRes || []);
      setDeptGroups(groupsRes || []);

      // Default expand all groups
      const initialExpanded: Record<string, boolean> = { __UNGROUPED__: true };
      (groupsRes || []).forEach((g: DepartmentGroup) => {
        initialExpanded[g.name] = true;
      });
      setExpandedGroups(initialExpanded);
    } catch (e) {
      try {
        const assnRes = await api.get<Assignment[]>("/purchasing/assignments");
        setAssignments(assnRes || []);
      } catch (err) {
        toast.error("Failed to load assignments");
      }
    } finally {
      setIsLoading(false);
      setIsDeptLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered department approvers
  const filteredDepartments = useMemo(() => {
    return deptApprovers.filter(
      (d) =>
        !deptSearch ||
        d.department.toLowerCase().includes(deptSearch.toLowerCase()) ||
        (d.group_name && d.group_name.toLowerCase().includes(deptSearch.toLowerCase())) ||
        (d.approver_name && d.approver_name.toLowerCase().includes(deptSearch.toLowerCase())) ||
        (d.approvers &&
          d.approvers.some(
            (a) =>
              (a.full_name && a.full_name.toLowerCase().includes(deptSearch.toLowerCase())) ||
              (a.email && a.email.toLowerCase().includes(deptSearch.toLowerCase()))
          ))
    );
  }, [deptApprovers, deptSearch]);

  // Grouped departments map
  const groupedDepartments = useMemo(() => {
    const map: Record<string, DepartmentApprover[]> = {};
    // Ensure all registered groups exist in the map
    deptGroups.forEach((g) => {
      map[g.name] = [];
    });
    map["__UNGROUPED__"] = [];

    filteredDepartments.forEach((dept) => {
      const gName = dept.group_name && dept.group_name.trim() ? dept.group_name.trim() : "__UNGROUPED__";
      if (!map[gName]) {
        map[gName] = [];
      }
      map[gName].push(dept);
    });

    return map;
  }, [deptGroups, filteredDepartments]);

  const stats = useMemo(() => {
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

  // Multi-select handlers
  const handleToggleSelectDept = (deptName: string) => {
    setSelectedDepts((prev) =>
      prev.includes(deptName) ? prev.filter((d) => d !== deptName) : [...prev, deptName]
    );
  };

  const handleToggleSelectAll = () => {
    const visibleDeptNames = filteredDepartments.map((d) => d.department);
    const allSelected = visibleDeptNames.length > 0 && visibleDeptNames.every((d) => selectedDepts.includes(d));
    if (allSelected) {
      setSelectedDepts((prev) => prev.filter((d) => !visibleDeptNames.includes(d)));
    } else {
      setSelectedDepts((prev) => Array.from(new Set([...prev, ...visibleDeptNames])));
    }
  };

  // Batch assign approvers to all selected departments
  const handleBatchAssignApprovers = async (userIds: string[]) => {
    if (selectedDepts.length === 0) return;
    setIsBatchSaving(true);
    const primaryId = userIds.length > 0 ? userIds[0] : null;
    const assignedUserObjects = userIds
      .map((uid) => users.find((u) => u.id === uid))
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

      // Optimistic state update
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
      const assnRes = await api.get<Assignment[]>("/purchasing/assignments");
      setAssignments(assnRes || []);
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || "Failed to batch assign department approvers");
      fetchData();
    } finally {
      setIsBatchSaving(false);
    }
  };

  // Handle direct multi-approver assignment for a single department
  const handleSelectDepartmentApprovers = async (deptName: string, userIds: string[]) => {
    setSavingDept(deptName);
    const primaryId = userIds.length > 0 ? userIds[0] : null;
    const assignedUserObjects = userIds
      .map((uid) => users.find((u) => u.id === uid))
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

      // Optimistic state update
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

      const assnRes = await api.get<Assignment[]>("/purchasing/assignments");
      setAssignments(assnRes || []);
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || "Failed to update department approver");
      fetchData();
    } finally {
      setSavingDept(null);
    }
  };

  // Handle Group-Level Multi-Approver Assignment
  const handleAssignGroupApprovers = async (groupName: string, userIds: string[]) => {
    setSavingGroup(groupName);
    const primaryId = userIds.length > 0 ? userIds[0] : null;
    const assignedUserObjects = userIds
      .map((uid) => users.find((u) => u.id === uid))
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

      // Update group in state
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

      // Cascade update to all departments in this group
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

      toast.success(
        `Assigned ${userIds.length} approver(s) to all departments in group "${groupName}"`
      );

      const assnRes = await api.get<Assignment[]>("/purchasing/assignments");
      setAssignments(assnRes || []);
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || "Failed to assign group approvers");
      fetchData();
    } finally {
      setSavingGroup(null);
    }
  };

  // Move Department into a Group (Drag & Drop or Dropdown select)
  const handleMoveDepartment = async (deptName: string, targetGroup: string | null) => {
    const targetGroupClean = targetGroup === "__UNGROUPED__" || !targetGroup ? null : targetGroup.trim();

    // Optimistic update
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
      fetchData();
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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Workflow Roles & Approvers
            </h1>
            <HelpIcon text="Manage Level 1 Department Approvers, Level 2 Company Approvers, multi-approver assignments, drag-and-drop hierarchy, and operational teams (AP, Treasury, Purchasing)." />
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Configure Level 1 & 2 approvers, custom department groups, multi-user approval routing, and operational handlers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={isLoading || isDeptLoading}
            className="h-9 gap-1.5 shadow-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading || isDeptLoading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">
        <TabsList className="flex flex-wrap w-full max-w-full overflow-x-auto justify-start bg-slate-100 dark:bg-zinc-900 p-1 rounded-lg gap-1">
          {PRIMARY_ROLE_TABS.map((tab) => {
            const Icon = tab.icon;
            let count: number | null = null;
            if (tab.key === "departments") {
              count = deptApprovers.length;
            } else if (tab.roleCode) {
              count = getRoleUserCount(tab.roleCode);
            } else if (tab.key === "all_roles") {
              count = assignments.length;
            }

            return (
              <TabsTrigger
                key={tab.key}
                value={tab.key}
                className="gap-2 text-xs font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 shadow-2xs py-2 px-3"
              >
                <Icon className={`h-4 w-4 ${tab.color}`} />
                <span className="hidden md:inline">{tab.label}</span>
                <span className="md:hidden">{tab.shortLabel}</span>
                {count !== null && (
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0 h-4 min-w-4 justify-center bg-slate-200/80 dark:bg-zinc-700"
                  >
                    {count}
                  </Badge>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* ── TAB 1: Department Level 1 Approvers with Group Accordions & Drag-and-Drop ── */}
        <TabsContent value="departments" className="space-y-4 m-0">
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            {/* Top Toolbar */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-zinc-950 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  Level 1 Department Approver Groups
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Organize departments into groups, drag & drop between groups, and assign multiple Level 1 approvers.
                </p>
              </div>

              {/* Action Buttons & Search */}
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  size="sm"
                  onClick={() => {
                    setNewGroupName("");
                    setNewGroupApproverIds([]);
                    setNewGroupDeptNames([]);
                    setIsCreateGroupOpen(true);
                  }}
                  className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Create Group Tab
                </Button>

                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search department, group or approver..."
                    value={deptSearch}
                    onChange={(e) => setDeptSearch(e.target.value)}
                    className="pl-8 h-8 text-xs bg-white dark:bg-zinc-950"
                  />
                </div>
              </div>
            </div>

            {/* Quick Stats Bar */}
            <div className="px-4 py-2.5 bg-slate-50/60 dark:bg-zinc-900/40 border-b border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 border-r border-slate-200 dark:border-slate-700 pr-2.5 mr-1">
                  <Checkbox
                    checked={
                      filteredDepartments.length > 0 &&
                      filteredDepartments.every((d) => selectedDepts.includes(d.department))
                    }
                    onCheckedChange={handleToggleSelectAll}
                    aria-label="Select all departments"
                  />
                  <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">Select All</span>
                </div>
                <Badge variant="secondary" className="gap-1 bg-white dark:bg-zinc-800 text-slate-700 dark:text-slate-300 font-normal border border-slate-200 dark:border-slate-700">
                  <Layers className="h-3 w-3 text-indigo-500" /> Groups: <span className="font-semibold">{stats.groupsCount}</span>
                </Badge>
                <Badge variant="secondary" className="gap-1 bg-white dark:bg-zinc-800 text-slate-700 dark:text-slate-300 font-normal border border-slate-200 dark:border-slate-700">
                  <Building2 className="h-3 w-3 text-slate-500" /> Departments: <span className="font-semibold">{stats.total}</span>
                </Badge>
                <Badge variant="secondary" className="gap-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 font-normal border-emerald-200 dark:border-emerald-800">
                  <CheckCircle2 className="h-3 w-3" /> Configured: <span className="font-semibold">{stats.assigned}</span>
                </Badge>
                {stats.unassigned > 0 && (
                  <Badge variant="secondary" className="gap-1 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 font-normal border-amber-200 dark:border-amber-800">
                    <AlertCircle className="h-3 w-3" /> Unassigned: <span className="font-semibold">{stats.unassigned}</span>
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const allOpen: Record<string, boolean> = { __UNGROUPED__: true };
                    deptGroups.forEach((g) => {
                      allOpen[g.name] = true;
                    });
                    setExpandedGroups(allOpen);
                  }}
                  className="h-7 text-[11px] px-2 text-slate-600 hover:text-slate-900"
                >
                  Expand All
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpandedGroups({})}
                  className="h-7 text-[11px] px-2 text-slate-600 hover:text-slate-900"
                >
                  Collapse All
                </Button>
              </div>
            </div>

            {/* Bulk Selection Bar */}
            {selectedDepts.length > 0 && (
              <div className="px-4 py-2.5 bg-indigo-50/90 dark:bg-indigo-950/40 border-b border-indigo-100 dark:border-indigo-900/60 flex flex-wrap items-center justify-between gap-3 animate-in fade-in-50">
                <div className="flex items-center gap-2 text-xs font-semibold text-indigo-950 dark:text-indigo-200">
                  <CheckSquare className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <span>{selectedDepts.length} department{selectedDepts.length > 1 ? "s" : ""} selected</span>
                </div>

                <div className="flex items-center gap-2">
                  <MultiUserApproverPopover
                    title={`Assign Approver(s) to ${selectedDepts.length} Selected Departments`}
                    subTitle="Selected users will become Level 1 approvers for all checked departments."
                    users={users}
                    selectedUserIds={[]}
                    isSaving={isBatchSaving}
                    onSave={handleBatchAssignApprovers}
                    triggerButton={
                      <Button
                        size="sm"
                        disabled={isBatchSaving}
                        className="h-8 text-xs px-3 shadow-xs bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5"
                      >
                        {isBatchSaving ? <RefreshCw className="h-3 w-3 animate-spin" /> : <UserCheck className="h-3.5 w-3.5" />}
                        {isBatchSaving ? "Saving..." : `Assign Approver(s) to ${selectedDepts.length} Selected`}
                      </Button>
                    }
                  />

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedDepts([])}
                    className="h-8 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  >
                    Deselect All
                  </Button>
                </div>
              </div>
            )}

            {/* Accordion Group Containers */}
            <CardContent className="p-4 sm:p-6 space-y-4">
              {isDeptLoading ? (
                <div className="p-12 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin text-emerald-600" />
                  Loading department approver groups...
                </div>
              ) : Object.keys(groupedDepartments).length === 0 ? (
                <div className="p-12 text-center text-sm text-muted-foreground">
                  No departments found.
                </div>
              ) : (
                <>
                  {/* Render Custom Groups First */}
                  {deptGroups.map((group) => {
                    const deptsInGroup = groupedDepartments[group.name] || [];
                    const isExpanded = expandedGroups[group.name] !== false;
                    const isDragOver = dragOverGroup === group.name;
                    const isGroupSaving = savingGroup === group.name;

                    const groupApprovers = group.approvers || [];
                    const groupApproverIds = group.approver_ids || [];

                    return (
                      <div
                        key={group.id}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setDragOverGroup(group.name);
                        }}
                        onDragLeave={() => {
                          if (dragOverGroup === group.name) setDragOverGroup(null);
                        }}
                        onDrop={async (e) => {
                          e.preventDefault();
                          setDragOverGroup(null);
                          const deptName = e.dataTransfer.getData("text/plain") || draggedDept;
                          if (deptName) {
                            await handleMoveDepartment(deptName, group.name);
                          }
                          setDraggedDept(null);
                        }}
                        className={`rounded-xl border transition-all duration-200 overflow-hidden shadow-2xs ${
                          isDragOver
                            ? "border-indigo-500 ring-2 ring-indigo-500/30 bg-indigo-50/20 dark:bg-indigo-950/20"
                            : "border-slate-200 dark:border-slate-800 bg-white dark:bg-zinc-950"
                        }`}
                      >
                        {/* Group Header / Accordion Trigger */}
                        <div className="p-3.5 sm:p-4 bg-slate-50/90 dark:bg-zinc-900/90 border-b border-slate-100 dark:border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
                          <div
                            onClick={() => toggleGroupExpand(group.name)}
                            className="flex items-center gap-3 cursor-pointer select-none flex-1 min-w-0"
                          >
                            <button
                              type="button"
                              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-500 transition-colors"
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </button>

                            <div className="flex items-center gap-2.5 min-w-0 flex-wrap">
                              <Folder className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                              <span className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                                {group.name}
                              </span>

                              <Badge
                                variant="secondary"
                                className="text-[11px] font-normal px-2 py-0.5 bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800"
                              >
                                {deptsInGroup.length} Department{deptsInGroup.length === 1 ? "" : "s"}
                              </Badge>

                              {/* Group Default Approvers Summary Badge */}
                              {groupApproverIds.length > 0 && (
                                <div className="flex items-center gap-1.5 ml-1">
                                  <span className="text-[11px] text-muted-foreground">Group Approvers:</span>
                                  <ApproverPillList approvers={groupApprovers} maxVisible={2} />
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Group Actions */}
                          <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                            {/* Assign multi-approvers to all in group */}
                            <MultiUserApproverPopover
                              title={`Assign Approver(s) to "${group.name}" Group`}
                              subTitle={`This will assign the selected approver(s) to all ${deptsInGroup.length} departments under this group.`}
                              users={users}
                              selectedUserIds={groupApproverIds}
                              isSaving={isGroupSaving}
                              onSave={(userIds) => handleAssignGroupApprovers(group.name, userIds)}
                              triggerButton={
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={isGroupSaving}
                                  className="h-8 text-xs gap-1.5 bg-white dark:bg-zinc-950 shadow-2xs hover:border-emerald-500 hover:text-emerald-700"
                                >
                                  {isGroupSaving ? (
                                    <RefreshCw className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
                                  )}
                                  Assign Group Approvers
                                </Button>
                              }
                            />

                            {/* Rename Group */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setRenameGroupId(group.id);
                                setRenameGroupName(group.name);
                              }}
                              className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900"
                              title="Rename Group"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>

                            {/* Delete Group */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteGroup(group)}
                              className="h-8 w-8 p-0 text-slate-400 hover:text-red-600"
                              title="Delete Group"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>

                        {/* Group Content (Accordion Body) */}
                        {isExpanded && (
                          <div className="p-0">
                            {deptsInGroup.length === 0 ? (
                              <div
                                onDragOver={(e) => {
                                  e.preventDefault();
                                  setDragOverGroup(group.name);
                                }}
                                className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 m-3 rounded-lg text-xs text-muted-foreground space-y-1"
                              >
                                <FolderPlus className="h-6 w-6 mx-auto text-slate-400 opacity-60 mb-1" />
                                <p className="font-medium text-slate-700 dark:text-slate-300">
                                  No departments in this group yet
                                </p>
                                <p className="text-[11px] text-muted-foreground">
                                  Drag and drop any department row here to add it to "{group.name}"
                                </p>
                              </div>
                            ) : (
                              <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                {deptsInGroup.map((dept) => {
                                  const isSaving = savingDept === dept.department;
                                  const hasApprover = Boolean(
                                    dept.approver_id || (dept.approver_ids && dept.approver_ids.length > 0)
                                  );
                                  const isSelected = selectedDepts.includes(dept.department);
                                  const isDragging = draggedDept === dept.department;

                                  const deptApproverList = dept.approvers || [];
                                  const deptApproverIds = dept.approver_ids || (dept.approver_id ? [dept.approver_id] : []);

                                  return (
                                    <div
                                      key={dept.department}
                                      draggable={true}
                                      onDragStart={(e) => {
                                        setDraggedDept(dept.department);
                                        e.dataTransfer.setData("text/plain", dept.department);
                                        e.dataTransfer.effectAllowed = "move";
                                      }}
                                      onDragEnd={() => {
                                        setDraggedDept(null);
                                        setDragOverGroup(null);
                                      }}
                                      className={`p-3.5 sm:px-4 flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors ${
                                        isDragging
                                          ? "opacity-40 bg-slate-100 dark:bg-zinc-800"
                                          : isSelected
                                          ? "bg-indigo-50/40 dark:bg-indigo-950/20"
                                          : "hover:bg-slate-50/60 dark:hover:bg-zinc-900/40"
                                      }`}
                                    >
                                      {/* Left: Drag Handle, Checkbox, Dept Name */}
                                      <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div
                                          className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                                          title="Drag to move department to another group"
                                        >
                                          <GripVertical className="h-4 w-4" />
                                        </div>

                                        <Checkbox
                                          checked={isSelected}
                                          onCheckedChange={() => handleToggleSelectDept(dept.department)}
                                          aria-label={`Select ${dept.department}`}
                                        />

                                        <div className="flex items-center gap-2.5 min-w-0">
                                          <div className="h-7 w-7 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                            <Building2 className="h-4 w-4" />
                                          </div>
                                          <div>
                                            <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                                              {dept.department}
                                            </span>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Middle: Assigned Multi-Approvers Badges */}
                                      <div className="flex-1 min-w-0 pl-7 md:pl-0">
                                        {hasApprover && deptApproverList.length > 0 ? (
                                          <ApproverPillList approvers={deptApproverList} maxVisible={2} />
                                        ) : hasApprover && dept.approver_name ? (
                                          <ApproverPill
                                            name={dept.approver_name}
                                            email={dept.approver_email}
                                            title={dept.approver_title}
                                          />
                                        ) : (
                                          <div className="flex items-center gap-1.5 text-muted-foreground italic text-xs">
                                            <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                                            <span>Not Assigned &mdash; Click Assign Approver</span>
                                          </div>
                                        )}
                                      </div>

                                      {/* Right: Actions (Multi-User Selector Popover & Move Dropdown) */}
                                      <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                                        {/* Multi-Approver Selector Button */}
                                        <MultiUserApproverPopover
                                          title={`Level 1 Approver(s) for ${dept.department}`}
                                          subTitle="Search and select one or multiple users who can approve requests for this department."
                                          users={users}
                                          selectedUserIds={deptApproverIds}
                                          isSaving={isSaving}
                                          onSave={(userIds) =>
                                            handleSelectDepartmentApprovers(dept.department, userIds)
                                          }
                                          triggerButton={
                                            <Button
                                              variant={hasApprover ? "outline" : "default"}
                                              size="sm"
                                              disabled={isSaving}
                                              className={`h-8 text-xs px-3 shadow-xs gap-1.5 ${
                                                !hasApprover
                                                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                                  : ""
                                              }`}
                                            >
                                              {isSaving ? (
                                                <RefreshCw className="h-3 w-3 animate-spin" />
                                              ) : (
                                                <ChevronsUpDown className="h-3.5 w-3.5 opacity-70" />
                                              )}
                                              {isSaving
                                                ? "Saving..."
                                                : hasApprover
                                                ? `Change (${deptApproverIds.length})`
                                                : "Assign Approver(s)"}
                                            </Button>
                                          }
                                        />

                                        {/* Quick Move to Group Dropdown */}
                                        <select
                                          value={group.name}
                                          onChange={(e) => handleMoveDepartment(dept.department, e.target.value)}
                                          className="h-8 text-xs px-2 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-zinc-950 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                          title="Move to another group"
                                        >
                                          <option value={group.name}>{group.name} (Current)</option>
                                          <option value="__UNGROUPED__">&mdash; Move to Ungrouped &mdash;</option>
                                          {deptGroups
                                            .filter((g) => g.name !== group.name)
                                            .map((g) => (
                                              <option key={g.id} value={g.name}>
                                                Move to: {g.name}
                                              </option>
                                            ))}
                                        </select>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* ── UNGROUPED DEPARTMENTS CONTAINER ── */}
                  {(() => {
                    const ungroupedDepts = groupedDepartments["__UNGROUPED__"] || [];
                    const isExpanded = expandedGroups["__UNGROUPED__"] !== false;
                    const isDragOver = dragOverGroup === "__UNGROUPED__";

                    return (
                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          setDragOverGroup("__UNGROUPED__");
                        }}
                        onDragLeave={() => {
                          if (dragOverGroup === "__UNGROUPED__") setDragOverGroup(null);
                        }}
                        onDrop={async (e) => {
                          e.preventDefault();
                          setDragOverGroup(null);
                          const deptName = e.dataTransfer.getData("text/plain") || draggedDept;
                          if (deptName) {
                            await handleMoveDepartment(deptName, null);
                          }
                          setDraggedDept(null);
                        }}
                        className={`rounded-xl border transition-all duration-200 overflow-hidden shadow-2xs ${
                          isDragOver
                            ? "border-amber-500 ring-2 ring-amber-500/30 bg-amber-50/20 dark:bg-amber-950/20"
                            : "border-slate-200 dark:border-slate-800 bg-white dark:bg-zinc-950"
                        }`}
                      >
                        {/* Header */}
                        <div className="p-3.5 sm:p-4 bg-slate-50/90 dark:bg-zinc-900/90 border-b border-slate-100 dark:border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
                          <div
                            onClick={() => toggleGroupExpand("__UNGROUPED__")}
                            className="flex items-center gap-3 cursor-pointer select-none flex-1 min-w-0"
                          >
                            <button
                              type="button"
                              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-500 transition-colors"
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </button>

                            <div className="flex items-center gap-2.5 min-w-0 flex-wrap">
                              <Building2 className="h-4 w-4 text-slate-500 shrink-0" />
                              <span className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                                General / Ungrouped Departments
                              </span>

                              <Badge
                                variant="secondary"
                                className="text-[11px] font-normal px-2 py-0.5 bg-slate-200/70 text-slate-700 dark:bg-zinc-800 dark:text-slate-300"
                              >
                                {ungroupedDepts.length} Department{ungroupedDepts.length === 1 ? "" : "s"}
                              </Badge>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground italic">
                              Drag departments here to ungroup them
                            </span>
                          </div>
                        </div>

                        {/* Ungrouped Departments Table / List */}
                        {isExpanded && (
                          <div className="p-0">
                            {ungroupedDepts.length === 0 ? (
                              <div className="p-6 text-center text-xs text-muted-foreground">
                                All departments are organized into groups!
                              </div>
                            ) : (
                              <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                {ungroupedDepts.map((dept) => {
                                  const isSaving = savingDept === dept.department;
                                  const hasApprover = Boolean(
                                    dept.approver_id || (dept.approver_ids && dept.approver_ids.length > 0)
                                  );
                                  const isSelected = selectedDepts.includes(dept.department);
                                  const isDragging = draggedDept === dept.department;

                                  const deptApproverList = dept.approvers || [];
                                  const deptApproverIds = dept.approver_ids || (dept.approver_id ? [dept.approver_id] : []);

                                  return (
                                    <div
                                      key={dept.department}
                                      draggable={true}
                                      onDragStart={(e) => {
                                        setDraggedDept(dept.department);
                                        e.dataTransfer.setData("text/plain", dept.department);
                                        e.dataTransfer.effectAllowed = "move";
                                      }}
                                      onDragEnd={() => {
                                        setDraggedDept(null);
                                        setDragOverGroup(null);
                                      }}
                                      className={`p-3.5 sm:px-4 flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors ${
                                        isDragging
                                          ? "opacity-40 bg-slate-100 dark:bg-zinc-800"
                                          : isSelected
                                          ? "bg-indigo-50/40 dark:bg-indigo-950/20"
                                          : "hover:bg-slate-50/60 dark:hover:bg-zinc-900/40"
                                      }`}
                                    >
                                      {/* Left: Drag Handle, Checkbox, Dept Name */}
                                      <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div
                                          className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                                          title="Drag to move department to a group"
                                        >
                                          <GripVertical className="h-4 w-4" />
                                        </div>

                                        <Checkbox
                                          checked={isSelected}
                                          onCheckedChange={() => handleToggleSelectDept(dept.department)}
                                          aria-label={`Select ${dept.department}`}
                                        />

                                        <div className="flex items-center gap-2.5 min-w-0">
                                          <div className="h-7 w-7 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
                                            <Building2 className="h-4 w-4" />
                                          </div>
                                          <div>
                                            <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                                              {dept.department}
                                            </span>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Middle: Multi-Approver Badges */}
                                      <div className="flex-1 min-w-0 pl-7 md:pl-0">
                                        {hasApprover && deptApproverList.length > 0 ? (
                                          <ApproverPillList approvers={deptApproverList} maxVisible={2} />
                                        ) : hasApprover && dept.approver_name ? (
                                          <ApproverPill
                                            name={dept.approver_name}
                                            email={dept.approver_email}
                                            title={dept.approver_title}
                                          />
                                        ) : (
                                          <div className="flex items-center gap-1.5 text-muted-foreground italic text-xs">
                                            <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                                            <span>Not Assigned &mdash; Click Assign Approver</span>
                                          </div>
                                        )}
                                      </div>

                                      {/* Right: Actions */}
                                      <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                                        <MultiUserApproverPopover
                                          title={`Level 1 Approver(s) for ${dept.department}`}
                                          subTitle="Search and select one or multiple users who can approve requests for this department."
                                          users={users}
                                          selectedUserIds={deptApproverIds}
                                          isSaving={isSaving}
                                          onSave={(userIds) =>
                                            handleSelectDepartmentApprovers(dept.department, userIds)
                                          }
                                          triggerButton={
                                            <Button
                                              variant={hasApprover ? "outline" : "default"}
                                              size="sm"
                                              disabled={isSaving}
                                              className={`h-8 text-xs px-3 shadow-xs gap-1.5 ${
                                                !hasApprover
                                                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                                  : ""
                                              }`}
                                            >
                                              {isSaving ? (
                                                <RefreshCw className="h-3 w-3 animate-spin" />
                                              ) : (
                                                <ChevronsUpDown className="h-3.5 w-3.5 opacity-70" />
                                              )}
                                              {isSaving
                                                ? "Saving..."
                                                : hasApprover
                                                ? `Change (${deptApproverIds.length})`
                                                : "Assign Approver(s)"}
                                            </Button>
                                          }
                                        />

                                        {/* Quick Move to Group Dropdown */}
                                        {deptGroups.length > 0 && (
                                          <select
                                            value=""
                                            onChange={(e) => handleMoveDepartment(dept.department, e.target.value)}
                                            className="h-8 text-xs px-2 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-zinc-950 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                          >
                                            <option value="" disabled>Move to Group...</option>
                                            {deptGroups.map((g) => (
                                              <option key={g.id} value={g.name}>
                                                {g.name}
                                              </option>
                                            ))}
                                          </select>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Role Tabs (Level 2 Approvers, Purchasing, AP, Treasury) ── */}
        {PRIMARY_ROLE_TABS.filter((t) => t.roleCode).map((tab) => (
          <TabsContent key={tab.key} value={tab.key} className="space-y-4 m-0">
            {renderRoleTabContent(tab)}
          </TabsContent>
        ))}

        {/* ── TAB: All Operational Roles Overview ── */}
        <TabsContent value="all_roles" className="space-y-4 m-0">
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-zinc-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Users className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  All Operational Assignments Directory
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Complete directory of all operational team handlers, scopes, and active statuses.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative w-full sm:w-60">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Filter by role or department..."
                    value={operationalSearch}
                    onChange={(e) => setOperationalSearch(e.target.value)}
                    className="pl-8 h-8 text-xs bg-white dark:bg-zinc-950"
                  />
                </div>
              </div>
            </div>

            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-12 text-center text-sm text-muted-foreground">Loading workflow assignments...</div>
              ) : assignments.length === 0 ? (
                <div className="p-12 text-center text-sm text-muted-foreground">No operational assignments configured yet.</div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {assignments
                    .filter(
                      (a) =>
                        !operationalSearch ||
                        a.role.toLowerCase().includes(operationalSearch.toLowerCase()) ||
                        (a.department && a.department.toLowerCase().includes(operationalSearch.toLowerCase()))
                    )
                    .map((a) => {
                      const assignedUsers =
                        a.user_ids && a.user_ids.length > 0
                          ? a.user_ids.map((uid) => users.find((u) => u.id === uid)).filter(Boolean)
                          : a.user_id
                          ? [users.find((u) => u.id === a.user_id)].filter(Boolean)
                          : [];

                      const mappedStates = ROLE_STATES_MAP[a.role.toUpperCase()] || [];

                      return (
                        <div
                          key={a.id}
                          className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-zinc-900/40 transition-colors"
                        >
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-semibold text-slate-900 dark:text-slate-100">{a.role}</span>

                              {a.department ? (
                                <Badge
                                  variant="outline"
                                  className="gap-1 text-xs font-medium bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800"
                                >
                                  <Building2 className="h-3 w-3" />
                                  {a.department}
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="text-xs font-medium text-slate-600 bg-slate-50 border-slate-200 dark:bg-zinc-800/60 dark:text-slate-300 dark:border-slate-700"
                                >
                                  All / General Scope
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

                            {mappedStates.length > 0 && (
                              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                                <span className="text-xs text-muted-foreground">Handles:</span>
                                {mappedStates.map((state) => (
                                  <span
                                    key={state}
                                    className="inline-flex items-center text-[10px] bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700"
                                  >
                                    {state}
                                  </span>
                                ))}
                              </div>
                            )}

                            <div className="flex flex-wrap items-center gap-2 pt-0.5">
                              <span className="text-xs text-muted-foreground">Assigned Team:</span>
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
                              <Edit2 className="mr-1.5 h-3.5 w-3.5" /> Edit
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
        </TabsContent>
      </Tabs>

      {/* ── CREATE GROUP TAB DIALOG ── */}
      <Dialog open={isCreateGroupOpen} onOpenChange={setIsCreateGroupOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderPlus className="h-5 w-5 text-emerald-600" />
              Create Department Group Tab
            </DialogTitle>
            <DialogDescription>
              Create a group tab to organize multiple departments and assign approvers together.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-3">
            <div className="grid gap-1.5">
              <label className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                Group Name <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="e.g. Engineering & Technology, Operations, Facilities"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className="bg-white dark:bg-zinc-950 text-xs"
                autoFocus
              />
            </div>

            {/* Initial Approvers (Multi-Select) */}
            <div className="grid gap-1.5">
              <label className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                Default Level 1 Approver(s) (Optional)
              </label>
              <p className="text-[11px] text-muted-foreground">
                These approvers will be assigned to all departments added into this group.
              </p>
              <div className="border rounded-md p-2 bg-slate-50 dark:bg-zinc-900/50 max-h-32 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {users
                  .filter((u) => u.is_active !== false)
                  .map((u) => {
                    const isSelected = newGroupApproverIds.includes(u.id);
                    return (
                      <div
                        key={u.id}
                        onClick={() => {
                          setNewGroupApproverIds((prev) =>
                            isSelected ? prev.filter((id) => id !== u.id) : [...prev, u.id]
                          );
                        }}
                        className="py-1.5 px-2 flex items-center justify-between text-xs cursor-pointer hover:bg-slate-100 dark:hover:bg-zinc-800 rounded"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Checkbox checked={isSelected} />
                          <span className="font-medium truncate">{u.full_name || u.email}</span>
                          {u.department && (
                            <span className="text-[10px] text-muted-foreground">({u.department})</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Initial Departments to include */}
            <div className="grid gap-1.5">
              <label className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                Add Departments to Group (Optional)
              </label>
              <div className="border rounded-md p-2 bg-slate-50 dark:bg-zinc-900/50 max-h-36 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {deptApprovers.map((d) => {
                  const isSelected = newGroupDeptNames.includes(d.department);
                  return (
                    <div
                      key={d.department}
                      onClick={() => {
                        setNewGroupDeptNames((prev) =>
                          isSelected ? prev.filter((name) => name !== d.department) : [...prev, d.department]
                        );
                      }}
                      className="py-1.5 px-2 flex items-center justify-between text-xs cursor-pointer hover:bg-slate-100 dark:hover:bg-zinc-800 rounded"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Checkbox checked={isSelected} />
                        <span className="font-medium truncate">{d.department}</span>
                        {d.group_name && (
                          <span className="text-[10px] text-muted-foreground italic">(currently in {d.group_name})</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter className="border-t pt-3">
            <Button variant="outline" size="sm" onClick={() => setIsCreateGroupOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={isCreatingGroup || !newGroupName.trim()}
              onClick={handleCreateGroup}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isCreatingGroup ? "Creating..." : "Create Group"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── RENAME GROUP MODAL ── */}
      <Dialog open={Boolean(renameGroupId)} onOpenChange={(open) => !open && setRenameGroupId(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Rename Department Group</DialogTitle>
            <DialogDescription>Update the name for this department group.</DialogDescription>
          </DialogHeader>
          <div className="py-3">
            <Input
              value={renameGroupName}
              onChange={(e) => setRenameGroupName(e.target.value)}
              placeholder="Enter new group name"
              className="text-xs"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setRenameGroupId(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={isRenamingGroup || !renameGroupName.trim()}
              onClick={handleRenameGroup}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {isRenamingGroup ? "Saving..." : "Save Name"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── EDIT ROLE ASSIGNMENT DIALOG ── */}
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
              <label className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-100">Request Type Scope</label>
              <div className="flex flex-wrap gap-2">
                {["ALL", "SPEND", "ADMIN", "RECURRING"].map((type) => {
                  const isSelected = (form.request_type || "ALL") === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setForm({ ...form, request_type: type === "ALL" ? null : type })}
                      className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors border ${
                        isSelected
                          ? "bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700"
                          : "bg-transparent border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                      }`}
                    >
                      {type === "ALL" ? "ALL" : type}
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
    </div>
  );
}
