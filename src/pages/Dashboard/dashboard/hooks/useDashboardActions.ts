import { useState, useMemo, useRef, useEffect } from "react";
import { apiClient as api } from "@/services/apiClient";
import { toast } from "sonner";
import type { DepartmentApprover, DepartmentGroup } from "../types";

export function useDashboardActions() {
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
  return { kpiRef, isApproverModalOpen, setIsApproverModalOpen, workflowAssignments, setWorkflowAssignments, allUsers, setAllUsers, activeDropdownRole, setActiveDropdownRole, userSearchText, setUserSearchText, graphSearchResults, isSearchingGraph, deptGroups, isDeptLoading, savingDept, savingGroup, deptTableSearch, setDeptTableSearch, expandedGroups, draggedDept, dragOverGroup, selectedDepts, setSelectedDepts, isBatchSaving, isCreateGroupOpen, setIsCreateGroupOpen, newGroupName, setNewGroupName, newGroupApproverIds, setNewGroupApproverIds, newGroupDeptNames, setNewGroupDeptNames, isCreatingGroup, setIsCreatingGroup, renameGroupId, setRenameGroupId, renameGroupName, setRenameGroupName, isRenamingGroup, setIsRenamingGroup, isSavingAssignments, setIsSavingAssignments, fetchWorkflowAssignments, handleOpenApproverModal, filteredDeptApprovers, groupedDepartments, deptStats, toggleGroupExpand, handleExpandAll, handleCollapseAll, handleDragStartDept, handleDragEndDept, handleDragOverGroup, handleDragLeaveGroup, handleDropOnGroup, handleToggleSelectDept, handleToggleSelectAll, handleSelectDepartmentApprovers, handleBatchAssignApprovers, handleAssignGroupApprovers, handleMoveDepartment };
}
