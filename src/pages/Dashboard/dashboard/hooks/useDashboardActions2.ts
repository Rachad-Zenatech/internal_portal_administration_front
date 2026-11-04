import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { usePurchaseRequests, usePurchasingSummary } from "@/hooks/usePurchasing";
import { RequestStatus } from "@/types/purchasing";
import type { PurchaseRequest } from "@/types/purchasing";
import { parseRequestStatus } from "@/lib/requestStatus";
import { apiClient as api } from "@/services/apiClient";
import { toast } from "sonner";
import type { DepartmentGroup } from "../types";
import type { useDashboardActions } from "./useDashboardActions";

export function useDashboardActions2(ctx: ReturnType<typeof useDashboardActions>) {
  const { setIsCreatingGroup, fetchWorkflowAssignments, setNewGroupDeptNames, setNewGroupApproverIds, setNewGroupName, setIsCreateGroupOpen, newGroupDeptNames, newGroupApproverIds, newGroupName, setIsRenamingGroup, setRenameGroupName, setRenameGroupId, renameGroupName, renameGroupId, setWorkflowAssignments, setAllUsers, allUsers, setIsSavingAssignments, setIsApproverModalOpen, workflowAssignments } = ctx;
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
  // My Approvals is shown only to assigned Level 1 / Level 2 approvers. This is driven by the
  // approver flags rather than my_approvals_count, so the section stays visible (showing an
  // "all caught up" state) when an approver's queue is empty.
  const isLevelApprover = Boolean(
    purchasingSummary?.is_level_approver ??
      (purchasingSummary?.is_dept_approver || purchasingSummary?.is_company_approver)
  );
  const { data: myApprovals = [], isLoading: isMyApprovalsLoading } = useQuery<PurchaseRequest[]>({
    // Same key and endpoint as the My Approvals page so both share one cache entry.
    queryKey: ["my-approvals-list"],
    queryFn: async () => await api.get<PurchaseRequest[]>("/api/purchasing/my-approvals"),
    enabled: isLevelApprover,
    refetchOnWindowFocus: true,
  });
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
  return { handleCreateGroup, handleRenameGroup, handleDeleteGroup, handleToggleUserInRole, handleToggleEntraUser, handleSaveApproverAssignments, navigate, user, fetchRequests, purchasingSummary, recurringDueCount, recurringDueAmount, isLevelApprover, myApprovals, isMyApprovalsLoading, searchQuery, setSearchQuery, dashboardFilter, setDashboardFilter, selectedTask, setSelectedTask, handleTaskClick, pipelineValue, totalCount, activeCount, filteredTasks };
}
