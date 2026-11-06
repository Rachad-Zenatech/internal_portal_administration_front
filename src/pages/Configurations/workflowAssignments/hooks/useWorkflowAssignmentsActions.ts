import { useState, useEffect, useMemo } from "react";
import { apiClient as api } from "@/services/apiClient";
import { toast } from "sonner";
import type { Assignment, DepartmentApprover, DepartmentGroup } from "../types";

export function useWorkflowAssignmentsActions() {
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
  return { activeTab, setActiveTab, assignments, deptApprovers, deptGroups, users, departments, isLoading, isDeptLoading, isFormOpen, setIsFormOpen, form, setForm, expandedGroups, setExpandedGroups, draggedDept, setDraggedDept, dragOverGroup, setDragOverGroup, savingDept, savingGroup, selectedDepts, setSelectedDepts, isBatchSaving, deptSearch, setDeptSearch, operationalSearch, setOperationalSearch, isCreateGroupOpen, setIsCreateGroupOpen, newGroupName, setNewGroupName, newGroupApproverIds, setNewGroupApproverIds, newGroupDeptNames, setNewGroupDeptNames, isCreatingGroup, setIsCreatingGroup, renameGroupId, setRenameGroupId, renameGroupName, setRenameGroupName, isRenamingGroup, setIsRenamingGroup, isUserDropdownOpen, setIsUserDropdownOpen, userSearch, setUserSearch, fetchData, filteredDepartments, groupedDepartments, stats, toggleGroupExpand, handleToggleSelectDept, handleToggleSelectAll, handleBatchAssignApprovers, handleSelectDepartmentApprovers, handleAssignGroupApprovers, handleMoveDepartment };
}
