import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/services/apiClient";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import type { Role } from "@/lib/AuthContext";
import { getErrorMessage } from "../utils";

export function useRolesActions() {
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [pendingMoves, setPendingMoves] = useState<Record<string, string | null>>({});
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeactivateDialogOpen, setIsDeactivateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    parent_role_id: "",
    display_order: 0,
    department: "",
    is_active: true,
  });
  // Fetch flat roles
  const { data: flatRoles, isLoading: isLoadingRoles } = useQuery({
    queryKey: ["roles"],
    queryFn: () => apiClient.get<Role[]>("/api/configuration/roles"),
  });
  const optimisticTree = useMemo(() => {
    if (!flatRoles) return [];
    
    // Create deep clones
    const clonedRoles: Record<string, Role> = {};
    flatRoles.forEach(r => {
      if (r.code === 'PENDING_USER') return;
      clonedRoles[r.id] = { ...r, children: [] };
    });

    // Apply pending moves locally
    Object.keys(pendingMoves).forEach(roleId => {
      if (clonedRoles[roleId]) {
        clonedRoles[roleId].parent_role_id = pendingMoves[roleId];
      }
    });

    const roots: Role[] = [];
    
    // Second pass to build tree
    Object.values(clonedRoles).forEach(r => {
      if (r.parent_role_id && clonedRoles[r.parent_role_id]) {
        clonedRoles[r.parent_role_id].children!.push(r);
      } else {
        roots.push(r);
      }
    });

    // Sort children
    const sortRoles = (arr: Role[]) => {
      arr.sort((a, b) => {
        const aOrder = a.display_order ?? 0;
        const bOrder = b.display_order ?? 0;
        if (aOrder !== bOrder) return aOrder - bOrder;
        return a.name.localeCompare(b.name);
      });
      arr.forEach(r => {
        if (r.children && r.children.length > 0) sortRoles(r.children);
      });
    };

    sortRoles(roots);
    return roots;
  }, [flatRoles, pendingMoves]);
  // Auto-expand all on load based on optimisticTree
  useEffect(() => {
    if (optimisticTree.length > 0 && expandedNodes.size === 0 && Object.keys(pendingMoves).length === 0) {
      const allIds = new Set<string>();
      const addIds = (nodes: Role[]) => {
        nodes.forEach(n => {
          allIds.add(n.id);
          if (n.children && n.children.length > 0) addIds(n.children);
        });
      };
      addIds(optimisticTree);
      setExpandedNodes(allIds);
    }
  }, [optimisticTree]);
  const toggleNode = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedNodes(newExpanded);
  };
  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => apiClient.post<Role>("/api/configuration/roles", {
      ...data,
      parent_role_id: data.parent_role_id || null
    }),
    onSuccess: (newRole) => {
      queryClient.invalidateQueries({ queryKey: ["roles-tree"] });
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast.success("Role created successfully");
      setIsEditing(false);
      setSelectedRole(newRole);
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err, "Failed to create role")),
  });
  const updateMutation = useMutation({
    mutationFn: (data: { id: string, payload: Partial<typeof formData> }) => 
      apiClient.put<Role>(`/api/configuration/roles/${data.id}`, {
        ...data.payload,
        parent_role_id: data.payload.parent_role_id || null
      }),
    onSuccess: (updatedRole) => {
      queryClient.invalidateQueries({ queryKey: ["roles-tree"] });
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast.success("Role updated successfully");
      setIsEditing(false);
      setSelectedRole(updatedRole);
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err, "Failed to update role")),
  });
  const bulkSaveHierarchyMutation = useMutation({
    mutationFn: async () => {
      // Pass 1: Set all moving roles to root (null) to break any existing hierarchy chains.
      // This prevents "cannot move under descendant" errors if the database is in an intermediate state.
      for (const roleId of Object.keys(pendingMoves)) {
        await apiClient.put(`/api/configuration/roles/${roleId}`, {
          parent_role_id: null
        });
      }
      
      // Pass 2: Set roles to their new target parents sequentially
      for (const roleId of Object.keys(pendingMoves)) {
        const targetId = pendingMoves[roleId];
        if (targetId !== null) {
          await apiClient.put(`/api/configuration/roles/${roleId}`, {
            parent_role_id: targetId
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles-tree"] });
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast.success("Hierarchy saved successfully");
      setPendingMoves({});
    },
    onError: () => toast.error("Failed to save hierarchy changes"),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete<void>(`/api/configuration/roles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles-tree"] });
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast.success("Role deactivated/deleted successfully");
      setSelectedRole(null);
      setIsEditing(false);
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err, "Failed to delete role")),
  });
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRole && isEditing && selectedRole.id !== "new") {
      updateMutation.mutate({ id: selectedRole.id, payload: formData });
    } else {
      createMutation.mutate(formData);
    }
  };
  const handleAddRoot = () => {
    setSelectedRole({ id: "new", name: "New Root Role", code: "", is_active: true } as Role);
    setFormData({ name: "", code: "", description: "", parent_role_id: "", display_order: 0, department: "", is_active: true });
    setIsEditing(true);
  };
  const handleAddChild = () => {
    if (!selectedRole || selectedRole.id === "new") return;
    const parentId = selectedRole.id;
    setSelectedRole({ id: "new", name: "New Child Role", code: "", is_active: true } as Role);
    setFormData({ name: "", code: "", description: "", parent_role_id: parentId, display_order: 0, department: "", is_active: true });
    setIsEditing(true);
  };
  const startEdit = () => {
    if (!selectedRole) return;
    setFormData({ 
      name: selectedRole.name, 
      code: selectedRole.code, 
      description: selectedRole.description || "", 
      parent_role_id: selectedRole.parent_role_id || "",
      display_order: selectedRole.display_order || 0,
      department: selectedRole.department || "",
      is_active: selectedRole.is_active ?? true 
    });
    setIsEditing(true);
  };
  const confirmDelete = async () => {
    if (!selectedRole || selectedRole.id === "new") return;
    try {
      await deleteMutation.mutateAsync(selectedRole.id);
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };
  const confirmDeactivate = async () => {
    if (!selectedRole || selectedRole.id === "new") return;
    try {
      await updateMutation.mutateAsync({
        id: selectedRole.id,
        payload: { is_active: !selectedRole.is_active }
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeactivateDialogOpen(false);
    }
  };
  const canDrop = (draggedId: string, targetId: string | null) => {
    if (draggedId === targetId) return false;
    if (targetId === null) return true; // root is always valid
    
    // Check against optimistic tree to handle pending moves
    let curr = flatRoles?.find(r => r.id === targetId);
    while (curr) {
      // Use pending move if it exists, otherwise use database parent
      const parentId = pendingMoves[curr.id] !== undefined ? pendingMoves[curr.id] : curr.parent_role_id;
      if (parentId === draggedId) return false;
      if (!parentId) break;
      curr = flatRoles?.find(r => r.id === parentId);
    }
    return true;
  };
  const handleMoveRole = (draggedId: string, targetId: string | null) => {
    if (!canDrop(draggedId, targetId)) {
      toast.error("Cannot move a role into its own child (Cycle detected)");
      return;
    }
    setPendingMoves(prev => ({
      ...prev,
      [draggedId]: targetId
    }));
    
    // Auto-expand the target node so the user sees it dropped inside
    if (targetId) {
       setExpandedNodes(prev => new Set(prev).add(targetId));
    }
  };
  const [isRootDragOver, setIsRootDragOver] = useState(false);
  const hasPendingMoves = Object.keys(pendingMoves).length > 0;
  return { hasPermission, selectedRole, setSelectedRole, isEditing, setIsEditing, expandedNodes, setPendingMoves, draggingId, setDraggingId, isDeleteDialogOpen, setIsDeleteDialogOpen, isDeactivateDialogOpen, setIsDeactivateDialogOpen, formData, setFormData, flatRoles, isLoadingRoles, optimisticTree, toggleNode, createMutation, updateMutation, bulkSaveHierarchyMutation, handleSubmit, handleAddRoot, handleAddChild, startEdit, confirmDelete, confirmDeactivate, handleMoveRole, isRootDragOver, setIsRootDragOver, hasPendingMoves };
}
