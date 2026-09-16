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
  Edit2, X, Search, ChevronDown, Check,
  Building2, UserCheck, Users, User, RefreshCw, CheckCircle2, AlertCircle,
  ChevronsUpDown, ShoppingCart, CreditCard, Landmark, SlidersHorizontal, CheckSquare
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

type DepartmentApprover = {
  department: string;
  approver_id: string | null;
  approver_name: string | null;
  approver_email: string | null;
  approver_title: string | null;
  approver_ids?: string[] | null;
  source: "MANUAL" | "UNASSIGNED";
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
  { code: "PURCHASING", label: "Purchasing", desc: "Purchasing and procurement processing" },
  { code: "AP", label: "Accounts Payable", desc: "Invoice payment and debit/wire handling" },
  { code: "TREASURY", label: "Treasury", desc: "Treasury and high-value payment approval" },
  { code: "ADMIN", label: "Administrator", desc: "Workflow and system administration" },
];

export default function WorkflowAssignments() {
  const [activeTab, setActiveTab] = useState("departments");
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [deptApprovers, setDeptApprovers] = useState<DepartmentApprover[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeptLoading, setIsDeptLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState<Partial<Assignment>>({ role: "", user_id: "", department: null, request_type: "ALL", active: true });

  // Auto-complete Popover State for Single Department Approver Selection
  const [openPopoverDept, setOpenPopoverDept] = useState<string | null>(null);
  const [deptApproverSearch, setDeptApproverSearch] = useState("");
  const [savingDept, setSavingDept] = useState<string | null>(null);

  // Multi-Select Checkboxes State for Departments
  const [selectedDepts, setSelectedDepts] = useState<string[]>([]);
  const [isBatchPopoverOpen, setIsBatchPopoverOpen] = useState(false);
  const [batchSearchText, setBatchSearchText] = useState("");
  const [isBatchSaving, setIsBatchSaving] = useState(false);

  // Search filter for departments sub-table
  const [deptSearch, setDeptSearch] = useState("");

  // Search filter for operational roles list
  const [operationalSearch, setOperationalSearch] = useState("");

  // Custom dropdown states for operational role modal
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [userSearch, setUserSearch] = useState("");

  const fetchData = async () => {
    setIsLoading(true);
    setIsDeptLoading(true);
    try {
      const [assnRes, userRes, deptRes, deptApprRes] = await Promise.all([
        api.get<Assignment[]>("/purchasing/assignments"),
        api.get<any>("/configuration/users?is_active=true"),
        api.get<string[]>("/purchasing/departments").catch(() => []),
        api.get<DepartmentApprover[]>("/purchasing/department-approvers").catch(() => []),
      ]);
      setAssignments(assnRes || []);
      setUsers(Array.isArray(userRes) ? userRes : (userRes as any).items || []);
      setDepartments(Array.isArray(deptRes) ? deptRes : []);
      setDeptApprovers(deptApprRes || []);
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
    return deptApprovers.filter(d =>
      !deptSearch ||
      d.department.toLowerCase().includes(deptSearch.toLowerCase()) ||
      (d.approver_name && d.approver_name.toLowerCase().includes(deptSearch.toLowerCase())) ||
      (d.approver_email && d.approver_email.toLowerCase().includes(deptSearch.toLowerCase()))
    );
  }, [deptApprovers, deptSearch]);

  const stats = useMemo(() => {
    const total = deptApprovers.length;
    const assigned = deptApprovers.filter(d => Boolean(d.approver_id)).length;
    const unassigned = total - assigned;
    return { total, assigned, unassigned };
  }, [deptApprovers]);

  // Multi-select handlers
  const handleToggleSelectDept = (deptName: string) => {
    setSelectedDepts(prev =>
      prev.includes(deptName) ? prev.filter(d => d !== deptName) : [...prev, deptName]
    );
  };

  const handleToggleSelectAll = () => {
    const visibleDeptNames = filteredDepartments.map(d => d.department);
    const allSelected = visibleDeptNames.length > 0 && visibleDeptNames.every(d => selectedDepts.includes(d));
    if (allSelected) {
      setSelectedDepts(prev => prev.filter(d => !visibleDeptNames.includes(d)));
    } else {
      setSelectedDepts(prev => Array.from(new Set([...prev, ...visibleDeptNames])));
    }
  };

  // Batch assign approver to all selected departments
  const handleBatchAssignApprover = async (selectedUser: any | null) => {
    if (selectedDepts.length === 0) return;
    setIsBatchSaving(true);
    const userId = selectedUser ? selectedUser.id : null;
    try {
      await api.post("/purchasing/department-approvers/batch-assign", {
        departments: selectedDepts,
        user_id: userId,
        user_ids: userId ? [userId] : []
      });

      // Optimistic state update
      const targetDeptsLower = new Set(selectedDepts.map(d => d.toLowerCase()));
      setDeptApprovers(prev => prev.map(d => {
        if (targetDeptsLower.has(d.department.toLowerCase())) {
          return {
            ...d,
            approver_id: userId,
            approver_name: selectedUser ? (selectedUser.full_name || selectedUser.email) : null,
            approver_email: selectedUser ? selectedUser.email : null,
            approver_title: selectedUser ? selectedUser.job_title : null,
            approver_ids: userId ? [userId] : null,
            source: userId ? "MANUAL" : "UNASSIGNED"
          };
        }
        return d;
      }));

      if (selectedUser) {
        toast.success(`Assigned ${selectedUser.full_name || selectedUser.email} as Level 1 Approver to ${selectedDepts.length} department(s)`);
      } else {
        toast.info(`Cleared Level 1 Approver for ${selectedDepts.length} department(s)`);
      }

      setSelectedDepts([]);
      setIsBatchPopoverOpen(false);
      setBatchSearchText("");

      // Refresh assignments in background
      const assnRes = await api.get<Assignment[]>("/purchasing/assignments");
      setAssignments(assnRes || []);
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || "Failed to batch assign department approvers");
      fetchData();
    } finally {
      setIsBatchSaving(false);
    }
  };

  // Handle direct assignment from auto-complete combobox for single Level 1 Approver
  const handleSelectApprover = async (deptName: string, selectedUser: any | null) => {
    setSavingDept(deptName);
    const userId = selectedUser ? selectedUser.id : null;
    try {
      await api.post("/purchasing/department-approvers/assign", {
        department: deptName,
        user_id: userId,
        user_ids: userId ? [userId] : []
      });

      // Optimistic state update
      setDeptApprovers(prev => prev.map(d => {
        if (d.department.toLowerCase() === deptName.toLowerCase()) {
          return {
            ...d,
            approver_id: userId,
            approver_name: selectedUser ? (selectedUser.full_name || selectedUser.email) : null,
            approver_email: selectedUser ? selectedUser.email : null,
            approver_title: selectedUser ? selectedUser.job_title : null,
            approver_ids: userId ? [userId] : null,
            source: userId ? "MANUAL" : "UNASSIGNED"
          };
        }
        return d;
      }));

      if (selectedUser) {
        toast.success(`Assigned ${selectedUser.full_name || selectedUser.email} as Level 1 Approver for ${deptName}`);
      } else {
        toast.info(`Cleared Level 1 Approver for ${deptName}`);
      }
      setOpenPopoverDept(null);
      setDeptApproverSearch("");

      // Refresh assignments in background
      const assnRes = await api.get<Assignment[]>("/purchasing/assignments");
      setAssignments(assnRes || []);
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || "Failed to update department approver");
      fetchData();
    } finally {
      setSavingDept(null);
    }
  };

  const handleSaveOperationalRole = async () => {
    if (!form.role) return toast.error("Role is required");

    const formDeptClean = (form.department || "").trim().toLowerCase();
    const isDuplicate = assignments.some(
      a => a.role.toUpperCase() === form.role?.toUpperCase() &&
           (a.department || "").trim().toLowerCase() === formDeptClean &&
           a.id !== form.id
    );
    if (isDuplicate) {
      return toast.error(`Assignment for '${form.role}' in '${form.department || "All / General"}' already exists.`);
    }

    const assignedCount = (form.user_ids && form.user_ids.length > 0)
      ? form.user_ids.length
      : (form.user_id ? 1 : 0);

    if (assignedCount === 0) {
      return toast.error(`Workflow role '${form.role}' requires at least 1 assigned user.`);
    }

    try {
      const requestType = form.request_type === "ALL" ? null : (form.request_type || null);
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

  // Helper to filter users for the auto-complete
  const filterUsersForDept = (query: string) => {
    const q = query.trim().toLowerCase();
    if (!q) return users.filter(u => u.is_active !== false);
    return users.filter(u =>
      u.is_active !== false && (
        (u.full_name && u.full_name.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.department && u.department.toLowerCase().includes(q)) ||
        (u.job_title && u.job_title.toLowerCase().includes(q))
      )
    );
  };

  // Helper to count users assigned to a role
  const getRoleUserCount = (roleCode: string) => {
    const roleAssns = assignments.filter(a => a.role.toUpperCase() === roleCode.toUpperCase());
    const userIds = new Set<string>();
    roleAssns.forEach(a => {
      if (a.user_ids && a.user_ids.length > 0) {
        a.user_ids.forEach(uid => userIds.add(uid));
      } else if (a.user_id) {
        userIds.add(a.user_id);
      }
    });
    return userIds.size;
  };

  // Render a specific role's dedicated tab content
  const renderRoleTabContent = (tabConfig: typeof PRIMARY_ROLE_TABS[1]) => {
    const roleCode = tabConfig.roleCode!;
    const roleAssignments = assignments.filter(a => a.role.toUpperCase() === roleCode.toUpperCase());

    return (
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Banner Header */}
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
            <p className="text-xs text-muted-foreground">
              {tabConfig.desc}
            </p>

            {tabConfig.states && tabConfig.states.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] font-medium text-slate-500">Handles Workflow Stages:</span>
                {tabConfig.states.map(state => (
                  <span key={state} className="inline-flex items-center text-[10px] bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                    {state}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Assigned Users Grid & Assignments */}
        <CardContent className="p-0">
          {roleAssignments.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-400">
                <tabConfig.icon className="h-6 w-6 opacity-60" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  No team members currently assigned to {tabConfig.label}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Requests routed to this role will require operational assignment.
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {roleAssignments.map((a) => {
                const assignedUsers = a.user_ids && a.user_ids.length > 0
                  ? a.user_ids.map(uid => users.find(u => u.id === uid)).filter(Boolean)
                  : (a.user_id ? [users.find(u => u.id === a.user_id)].filter(Boolean) : []);

                return (
                  <div key={a.id} className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-zinc-900/40 transition-colors">
                    <div className="space-y-2.5 flex-1">
                      {/* Assignment Scopes */}
                      <div className="flex flex-wrap items-center gap-2">
                        {a.department ? (
                          <Badge variant="outline" className="gap-1 text-xs font-medium bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800">
                            <Building2 className="h-3 w-3" />
                            {a.department} Department Scope
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs font-medium text-slate-600 bg-slate-50 border-slate-200 dark:bg-zinc-800/60 dark:text-slate-300 dark:border-slate-700">
                            Global (All Departments)
                          </Badge>
                        )}

                        <Badge variant={a.active ? "default" : "secondary"} className="text-[11px]">
                          {a.active ? "Active" : "Inactive"}
                        </Badge>
                        <Badge variant="outline" className="text-[11px] text-muted-foreground border-slate-200 dark:border-slate-700">
                          Type: {formatRequestType(a.request_type || "ALL")}
                        </Badge>
                      </div>

                      {/* Assigned Users List */}
                      <div className="space-y-1.5">
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Assigned Team Members:</span>
                        {assignedUsers.length === 0 ? (
                          <p className="text-xs italic text-muted-foreground">No active user linked to this assignment.</p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
                            {assignedUsers.map((u: any) => (
                              <div
                                key={u.id}
                                className="flex items-center gap-2.5 p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-zinc-900 shadow-2xs"
                              >
                                <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 flex items-center justify-center text-xs font-bold shrink-0">
                                  {u.full_name?.split(" ").map((p: string) => p[0]).slice(0, 2).join("").toUpperCase() || "U"}
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                                    {u.full_name || u.email}
                                  </span>
                                  <span className="text-[11px] text-muted-foreground truncate">
                                    {u.email}
                                  </span>
                                  {u.job_title && (
                                    <span className="text-[10px] text-slate-500 truncate">
                                      {u.job_title} {u.department ? `· ${u.department}` : ""}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
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
                            user_ids: (a.user_ids && a.user_ids.length > 0) ? a.user_ids : (a.user_id ? [a.user_id] : []),
                            request_type: a.request_type || "ALL"
                          });
                          setIsFormOpen(true);
                        }}
                        className="h-8 px-3 shadow-xs"
                      >
                        <Edit2 className="mr-1.5 h-3.5 w-3.5" /> Edit Assignment
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
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Workflow Roles & Approvers</h1>
            <HelpIcon text="Manage Level 1 Department Approvers and operational team handlers (AP, Treasury, Purchasing, Admin) across the system." />
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Configure department-level approval routing and operational fulfillment teams.
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
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 min-w-4 justify-center bg-slate-200/80 dark:bg-zinc-700">
                    {count}
                  </Badge>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* ── TAB 1: Department Level 1 Approvers Sub-Table ── */}
        <TabsContent value="departments" className="space-y-4 m-0">
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-zinc-950 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  Department Approvers Directory
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Select and assign the primary Level 1 approver for each department using user auto-complete.
                </p>
              </div>

              {/* Quick Stats & Search Filter */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Badge variant="secondary" className="gap-1 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 font-normal">
                    Total: <span className="font-semibold">{stats.total}</span>
                  </Badge>
                  <Badge variant="secondary" className="gap-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 font-normal border-emerald-200 dark:border-emerald-800">
                    <CheckCircle2 className="h-3 w-3" /> Assigned: <span className="font-semibold">{stats.assigned}</span>
                  </Badge>
                  {stats.unassigned > 0 && (
                    <Badge variant="secondary" className="gap-1 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 font-normal border-amber-200 dark:border-amber-800">
                      <AlertCircle className="h-3 w-3" /> Unassigned: <span className="font-semibold">{stats.unassigned}</span>
                    </Badge>
                  )}
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search department or approver..."
                    value={deptSearch}
                    onChange={e => setDeptSearch(e.target.value)}
                    className="pl-8 h-8 text-xs bg-white dark:bg-zinc-950"
                  />
                </div>
              </div>
            </div>

            {/* Multi-Selection Bulk Action Toolbar */}
            {selectedDepts.length > 0 && (
              <div className="px-4 py-2.5 bg-indigo-50/90 dark:bg-indigo-950/40 border-b border-indigo-100 dark:border-indigo-900/60 flex flex-wrap items-center justify-between gap-3 animate-in fade-in-50">
                <div className="flex items-center gap-2 text-xs font-semibold text-indigo-950 dark:text-indigo-200">
                  <CheckSquare className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <span>{selectedDepts.length} department{selectedDepts.length > 1 ? "s" : ""} selected</span>
                </div>

                <div className="flex items-center gap-2">
                  <Popover
                    open={isBatchPopoverOpen}
                    onOpenChange={(open) => {
                      setIsBatchPopoverOpen(open);
                      if (!open) setBatchSearchText("");
                    }}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        size="sm"
                        disabled={isBatchSaving}
                        className="h-8 text-xs px-3 shadow-xs bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5"
                      >
                        {isBatchSaving ? (
                          <RefreshCw className="h-3 w-3 animate-spin" />
                        ) : (
                          <ChevronsUpDown className="h-3.5 w-3.5 opacity-80" />
                        )}
                        {isBatchSaving ? "Saving..." : `Assign Approver to ${selectedDepts.length} Selected`}
                      </Button>
                    </PopoverTrigger>

                    <PopoverContent className="w-[360px] sm:w-[400px] p-0 shadow-lg" align="end">
                      <div className="p-3 border-b bg-slate-50/70 dark:bg-zinc-900/70">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                            <Building2 className="h-3.5 w-3.5 text-indigo-600" />
                            Assign {selectedDepts.length} Departments
                          </span>
                          <span className="text-[10px] text-muted-foreground">Select Approver</span>
                        </div>
                        <div className="relative">
                          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                          <Input
                            autoFocus
                            placeholder="Search name, email, department..."
                            value={batchSearchText}
                            onChange={(e) => setBatchSearchText(e.target.value)}
                            className="pl-8 h-8 text-xs bg-white dark:bg-zinc-950"
                          />
                        </div>
                      </div>

                      <div className="max-h-[260px] overflow-y-auto p-1 divide-y divide-slate-100 dark:divide-slate-800/60" onWheelCapture={(e) => e.stopPropagation()}>
                        {/* Option to clear all selected */}
                        <div
                          onClick={() => handleBatchAssignApprover(null)}
                          className="p-2.5 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 rounded cursor-pointer text-xs flex items-center justify-between transition-colors"
                        >
                          <span className="font-semibold">&times; Clear Approver for all {selectedDepts.length} selected</span>
                        </div>

                        {filterUsersForDept(batchSearchText).length === 0 ? (
                          <div className="p-6 text-center text-xs text-muted-foreground">
                            No users found matching "{batchSearchText}"
                          </div>
                        ) : (
                          filterUsersForDept(batchSearchText).map((u) => (
                            <div
                              key={u.id}
                              onClick={() => handleBatchAssignApprover(u)}
                              className="p-2.5 rounded cursor-pointer text-xs flex items-center justify-between transition-colors hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-800 dark:text-slate-200"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="h-7 w-7 rounded-full bg-slate-200 text-slate-700 dark:bg-zinc-700 dark:text-slate-200 flex items-center justify-center text-xs font-semibold shrink-0">
                                  {u.full_name?.split(" ").map((p: string) => p[0]).slice(0, 2).join("").toUpperCase() || "U"}
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
                          ))
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>

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

            <CardContent className="p-0">
              {isDeptLoading ? (
                <div className="p-12 text-center text-sm text-muted-foreground">Loading department directory...</div>
              ) : filteredDepartments.length === 0 ? (
                <div className="p-12 text-center text-sm text-muted-foreground">No matching departments found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-zinc-900/50 text-slate-600 dark:text-slate-300 font-semibold">
                        <th className="py-3 px-3 w-[4%] text-center">
                          <Checkbox
                            checked={
                              filteredDepartments.length > 0 &&
                              filteredDepartments.every(d => selectedDepts.includes(d.department))
                            }
                            onCheckedChange={handleToggleSelectAll}
                            aria-label="Select all departments"
                          />
                        </th>
                        <th className="py-3 px-4 w-[28%]">Department</th>
                        <th className="py-3 px-4 w-[40%]">Assigned Level 1 Approver</th>
                        <th className="py-3 px-4 w-[12%]">Status</th>
                        <th className="py-3 px-4 text-right w-[16%]">Assign / Change</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {filteredDepartments.map((dept) => {
                        const isSaving = savingDept === dept.department;
                        const hasApprover = Boolean(dept.approver_id);
                        const isPopoverOpen = openPopoverDept === dept.department;
                        const isSelected = selectedDepts.includes(dept.department);

                        return (
                          <tr
                            key={dept.department}
                            className={`transition-colors ${
                              isSelected
                                ? "bg-indigo-50/40 dark:bg-indigo-950/20"
                                : "hover:bg-slate-50/60 dark:hover:bg-zinc-900/40"
                            }`}
                          >
                            {/* Checkbox */}
                            <td className="py-3.5 px-3 text-center">
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => handleToggleSelectDept(dept.department)}
                                aria-label={`Select ${dept.department}`}
                              />
                            </td>

                            {/* Department Name */}
                            <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-slate-100">
                              <div className="flex items-center gap-2.5">
                                <div className="h-7 w-7 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                                  <Building2 className="h-4 w-4" />
                                </div>
                                <div>
                                  <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">{dept.department}</span>
                                </div>
                              </div>
                            </td>

                            {/* Assigned Approver */}
                            <td className="py-3.5 px-4">
                              {hasApprover ? (
                                <div className="flex items-center gap-2.5">
                                  <div className="h-7 w-7 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center text-xs font-semibold shrink-0">
                                    {dept.approver_name?.split(" ").map(p => p[0]).slice(0, 2).join("").toUpperCase() || "U"}
                                  </div>
                                  <div className="flex flex-col min-w-0">
                                    <span className="font-medium text-slate-900 dark:text-slate-100 text-xs truncate">
                                      {dept.approver_name}
                                    </span>
                                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground truncate">
                                      <span>{dept.approver_email}</span>
                                      {dept.approver_title && (
                                        <>
                                          <span>&middot;</span>
                                          <span className="truncate">{dept.approver_title}</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 text-muted-foreground italic text-xs">
                                  <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                                  <span>Not Assigned &mdash; Please select an approver</span>
                                </div>
                              )}
                            </td>

                            {/* Status */}
                            <td className="py-3.5 px-4">
                              {hasApprover ? (
                                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 text-[11px] py-0.5">
                                  Configured
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 text-[11px] py-0.5">
                                  Unassigned
                                </Badge>
                              )}
                            </td>

                            {/* Action / Auto-Complete Popover */}
                            <td className="py-3.5 px-4 text-right">
                              <Popover
                                open={isPopoverOpen}
                                onOpenChange={(open) => {
                                  if (open) {
                                    setOpenPopoverDept(dept.department);
                                    setDeptApproverSearch("");
                                  } else {
                                    setOpenPopoverDept(null);
                                  }
                                }}
                              >
                                <PopoverTrigger asChild>
                                  <Button
                                    variant={hasApprover ? "outline" : "default"}
                                    size="sm"
                                    disabled={isSaving}
                                    className={`h-8 text-xs px-3 shadow-xs gap-1.5 ${
                                      !hasApprover ? "bg-indigo-600 hover:bg-indigo-700 text-white" : ""
                                    }`}
                                  >
                                    {isSaving ? (
                                      <RefreshCw className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <ChevronsUpDown className="h-3.5 w-3.5 opacity-70" />
                                    )}
                                    {isSaving ? "Saving..." : (hasApprover ? "Change" : "Assign")}
                                  </Button>
                                </PopoverTrigger>

                                <PopoverContent className="w-[340px] sm:w-[380px] p-0 shadow-lg" align="end">
                                  <div className="p-3 border-b bg-slate-50/70 dark:bg-zinc-900/70">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="font-semibold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                                        <Building2 className="h-3.5 w-3.5 text-indigo-600" />
                                        {dept.department} Approver
                                      </span>
                                      <span className="text-[10px] text-muted-foreground">Select User</span>
                                    </div>
                                    <div className="relative">
                                      <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                                      <Input
                                        autoFocus
                                        placeholder="Type to search name, email, role..."
                                        value={deptApproverSearch}
                                        onChange={(e) => setDeptApproverSearch(e.target.value)}
                                        className="pl-8 h-8 text-xs bg-white dark:bg-zinc-950"
                                      />
                                    </div>
                                  </div>

                                  <div className="max-h-[260px] overflow-y-auto p-1 divide-y divide-slate-100 dark:divide-slate-800/60" onWheelCapture={(e) => e.stopPropagation()}>
                                    {/* Option to unassign / clear */}
                                    {hasApprover && (
                                      <div
                                        onClick={() => handleSelectApprover(dept.department, null)}
                                        className="p-2 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 rounded cursor-pointer text-xs flex items-center justify-between transition-colors"
                                      >
                                        <span className="font-medium">&times; Remove Approver (Leave Unassigned)</span>
                                      </div>
                                    )}

                                    {filterUsersForDept(deptApproverSearch).length === 0 ? (
                                      <div className="p-6 text-center text-xs text-muted-foreground">
                                        No users found matching "{deptApproverSearch}"
                                      </div>
                                    ) : (
                                      filterUsersForDept(deptApproverSearch).map((u) => {
                                        const isSelectedRow = dept.approver_id === u.id;
                                        return (
                                          <div
                                            key={u.id}
                                            onClick={() => handleSelectApprover(dept.department, u)}
                                            className={`p-2.5 rounded cursor-pointer text-xs flex items-center justify-between transition-colors ${
                                              isSelectedRow
                                                ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200"
                                                : "hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-800 dark:text-slate-200"
                                            }`}
                                          >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                              <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                                                isSelectedRow
                                                  ? "bg-indigo-600 text-white"
                                                  : "bg-slate-200 text-slate-700 dark:bg-zinc-700 dark:text-slate-200"
                                              }`}>
                                                {u.full_name?.split(" ").map((p: string) => p[0]).slice(0, 2).join("").toUpperCase() || "U"}
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

                                            {isSelectedRow && (
                                              <Check className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0 ml-2" />
                                            )}
                                          </div>
                                        );
                                      })
                                    )}
                                  </div>
                                </PopoverContent>
                              </Popover>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TAB 2: Purchasing Team ── */}
        <TabsContent value="PURCHASING" className="space-y-4 m-0">
          {renderRoleTabContent(PRIMARY_ROLE_TABS[1])}
        </TabsContent>

        {/* ── TAB 3: Accounts Payable (AP) Team ── */}
        <TabsContent value="AP" className="space-y-4 m-0">
          {renderRoleTabContent(PRIMARY_ROLE_TABS[2])}
        </TabsContent>

        {/* ── TAB 4: Treasury Team ── */}
        <TabsContent value="TREASURY" className="space-y-4 m-0">
          {renderRoleTabContent(PRIMARY_ROLE_TABS[3])}
        </TabsContent>

        {/* ── TAB 5: All Operational Roles Overview ── */}
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
                    onChange={e => setOperationalSearch(e.target.value)}
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
                    .filter(a =>
                      !operationalSearch ||
                      a.role.toLowerCase().includes(operationalSearch.toLowerCase()) ||
                      (a.department && a.department.toLowerCase().includes(operationalSearch.toLowerCase()))
                    )
                    .map((a) => {
                      const assignedUsers = a.user_ids && a.user_ids.length > 0
                        ? a.user_ids.map(uid => users.find(u => u.id === uid)).filter(Boolean)
                        : (a.user_id ? [users.find(u => u.id === a.user_id)].filter(Boolean) : []);

                      const mappedStates = ROLE_STATES_MAP[a.role.toUpperCase()] || [];

                      return (
                        <div key={a.id} className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-zinc-900/40 transition-colors">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-semibold text-slate-900 dark:text-slate-100">{a.role}</span>

                              {a.department ? (
                                <Badge variant="outline" className="gap-1 text-xs font-medium bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800">
                                  <Building2 className="h-3 w-3" />
                                  {a.department}
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs font-medium text-slate-600 bg-slate-50 border-slate-200 dark:bg-zinc-800/60 dark:text-slate-300 dark:border-slate-700">
                                  All / General Scope
                                </Badge>
                              )}

                              <Badge variant={a.active ? "default" : "secondary"} className="text-[11px]">
                                {a.active ? "Active" : "Inactive"}
                              </Badge>
                              <Badge variant="outline" className="text-[11px] text-muted-foreground border-slate-200 dark:border-slate-700">
                                Type: {formatRequestType(a.request_type || "ALL")}
                              </Badge>
                            </div>

                            {mappedStates.length > 0 && (
                              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                                <span className="text-xs text-muted-foreground">Handles:</span>
                                {mappedStates.map(state => (
                                  <span key={state} className="inline-flex items-center text-[10px] bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
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
                                  <Badge key={u.id} variant="secondary" className="text-xs font-normal bg-white dark:bg-zinc-800 border border-slate-200 dark:border-slate-700 shadow-xs gap-1.5">
                                    <User className="h-3 w-3 opacity-60" />
                                    <span className="font-medium text-slate-900 dark:text-slate-100">{u.full_name || u.email}</span>
                                    {u.email && <span className="text-[11px] text-muted-foreground">({u.email})</span>}
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
                                  user_ids: (a.user_ids && a.user_ids.length > 0) ? a.user_ids : (a.user_id ? [a.user_id] : []),
                                  request_type: a.request_type || "ALL"
                                });
                                setIsFormOpen(true);
                              }}
                              className="h-8 px-3 shadow-xs"
                            >
                              <Edit2 className="mr-1.5 h-3.5 w-3.5" /> Edit
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

      {/* Edit Operational Role Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit Role Assignment" : "Configure Role Assignment"}</DialogTitle>
            <DialogDescription>
              Assign team members to operational roles (AP, Treasury, Purchasing).
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Role selection */}
            <div className="grid gap-2">
              <label className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-100">Workflow Role</label>
              <Input
                placeholder="e.g. AP, TREASURY, PURCHASING"
                value={form.role || ""}
                disabled={Boolean(form.id)}
                onChange={e => setForm({ ...form, role: e.target.value.toUpperCase() })}
                className="bg-white dark:bg-zinc-950 font-mono text-xs"
              />
              {!form.id && (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {SUGGESTED_ROLES.map(r => (
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

            {/* Department Dropdown Selector */}
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

            {/* Request type filter */}
            <div className="grid gap-2">
              <label className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-100">Request Type Scope</label>
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
            </div>

            {/* Assigned Users */}
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-100">Assigned Users</label>
                <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                  At least 1 user required
                </span>
              </div>
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
                      <div className="max-h-[250px] overflow-y-auto p-1" onWheelCapture={(e) => e.stopPropagation()}>
                        {users.filter(u => u.is_active !== false && (u.full_name || u.email || "").toLowerCase().includes(userSearch.toLowerCase())).length === 0 ? (
                          <div className="p-4 text-center text-sm text-muted-foreground">No users found.</div>
                        ) : (
                          users.filter(u => (u.full_name || u.email || "").toLowerCase().includes(userSearch.toLowerCase())).map(u => {
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
            <Button onClick={handleSaveOperationalRole}>{form.id ? "Save Changes" : "Save Assignment"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
