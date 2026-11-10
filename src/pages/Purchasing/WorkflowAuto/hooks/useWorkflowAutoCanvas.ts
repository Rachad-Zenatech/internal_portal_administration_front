import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import {
  experimentalWorkflowService,
  type WorkflowConfigResponse,
  type WorkflowStepNode,
  type WorkflowActionButton,
  type WorkflowActionField,
} from "@/services/experimentalWorkflowService";
import { useUsersList, useRolesList } from "@/hooks/usePurchasing";
import { resolveUserDepartment } from "@/lib/userDepartment";

export interface UseWorkflowAutoCanvasProps {
  domain: "purchasing" | "invoices";
}

export function useWorkflowAutoCanvas({ domain }: UseWorkflowAutoCanvasProps) {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const urlStatus = searchParams.get("status");

  const { data: usersList = [] } = useUsersList();
  const { data: rolesList = [] } = useRolesList();

  const { data: config } = useQuery<WorkflowConfigResponse>({
    queryKey: ["experimental-workflow", domain],
    queryFn: () => experimentalWorkflowService.getWorkflowConfig(domain),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Local state for nodes so UI updates instantly and reliably
  const [localNodes, setLocalNodes] = useState<WorkflowStepNode[] | null>(null);

  useEffect(() => {
    if (config?.nodes) {
      setLocalNodes(config.nodes);
    }
  }, [config?.nodes]);

  const nodes = localNodes ?? config?.nodes ?? [];

  // Undo / redo history
  const nodesRef = useRef<WorkflowStepNode[]>(nodes);
  nodesRef.current = nodes;
  const undoStack = useRef<WorkflowStepNode[][]>([]);
  const redoStack = useRef<WorkflowStepNode[][]>([]);
  const skipHistory = useRef(false);
  const HISTORY_LIMIT = 50;

  const recordHistory = (before: WorkflowStepNode[]) => {
    undoStack.current.push(before);
    if (undoStack.current.length > HISTORY_LIMIT) undoStack.current.shift();
    redoStack.current = [];
  };

  const saveMutation = useMutation({
    mutationFn: (updatedNodes: WorkflowStepNode[]) =>
      experimentalWorkflowService.saveWorkflowConfig(domain, { nodes: updatedNodes }),
    onMutate: async (updatedNodes: WorkflowStepNode[]) => {
      if (!skipHistory.current) recordHistory(nodesRef.current);
      skipHistory.current = false;
      setLocalNodes(updatedNodes);
      await queryClient.cancelQueries({ queryKey: ["experimental-workflow", domain] });
      const previous = queryClient.getQueryData<WorkflowConfigResponse>([
        "experimental-workflow",
        domain,
      ]);
      if (previous) {
        queryClient.setQueryData<WorkflowConfigResponse>(["experimental-workflow", domain], {
          ...previous,
          nodes: updatedNodes,
        });
      }
      return { previous };
    },
    onError: (err: any, _vars, context) => {
      if (context?.previous) {
        setLocalNodes(context.previous.nodes);
        queryClient.setQueryData(["experimental-workflow", domain], context.previous);
      }
      toast.error(err?.message || "Failed to save workflow");
    },
    onSuccess: (data: WorkflowConfigResponse) => {
      if (data?.nodes) {
        setLocalNodes(data.nodes);
      }
      queryClient.setQueryData(["experimental-workflow", domain], data);
      toast.success("Workflow flow configuration saved successfully!");
    },
  });

  const resetMutation = useMutation({
    mutationFn: () => experimentalWorkflowService.resetWorkflowConfig(domain),
    onSuccess: (data: WorkflowConfigResponse) => {
      if (data?.nodes) {
        recordHistory(nodesRef.current);
        setLocalNodes(data.nodes);
      }
      queryClient.setQueryData(["experimental-workflow", domain], data);
      toast.success("Workflow reset to original baseline template");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to reset workflow");
    },
  });

  const saveAsDefaultMutation = useMutation({
    mutationFn: () =>
      experimentalWorkflowService.saveAsDefaultWorkflowConfig(domain, { nodes: nodesRef.current }),
    onSuccess: () => {
      toast.success("Current workflow saved as the default (Reset will now restore it)");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to save default workflow");
    },
  });

  const undoChange = () => {
    const prev = undoStack.current.pop();
    if (!prev) {
      toast.info("Nothing to undo");
      return;
    }
    redoStack.current.push(nodesRef.current);
    skipHistory.current = true;
    saveMutation.mutate(prev);
    toast.info("Undid last change");
  };

  const redoChange = () => {
    const next = redoStack.current.pop();
    if (!next) {
      toast.info("Nothing to redo");
      return;
    }
    undoStack.current.push(nodesRef.current);
    skipHistory.current = true;
    saveMutation.mutate(next);
    toast.info("Redid change");
  };

  // Keyboard shortcut listener for Ctrl+Z and Ctrl+Y
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
      const key = e.key.toLowerCase();
      const isUndo = key === "z" && !e.shiftKey;
      const isRedo = key === "y" || (key === "z" && e.shiftKey);
      if (!isUndo && !isRedo) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName))) {
        return;
      }
      e.preventDefault();
      if (saveMutation.isPending || resetMutation.isPending) return;
      if (isUndo) undoChange();
      else redoChange();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  // Active testing simulator state
  const [activeStepId, setActiveStepId] = useState<string>("");
  const [testExecutionLog, setTestExecutionLog] = useState<string[]>([]);
  const [testFieldValues, setTestFieldValues] = useState<Record<string, any>>({});

  // Editing Step Node Dialog State
  const [editingNode, setEditingNode] = useState<{ node: WorkflowStepNode; index: number } | null>(
    null
  );
  const [nodeTitle, setNodeTitle] = useState("");
  const [nodeDesc, setNodeDesc] = useState("");
  const [nodeBadge, setNodeBadge] = useState("slate");
  const [nodeAssignedRole, setNodeAssignedRole] = useState("");
  const [nodeAssignedUser, setNodeAssignedUser] = useState("");
  const [nodeReviewControlEnabled, setNodeReviewControlEnabled] = useState(false);
  const [nodeReviewControlRole, setNodeReviewControlRole] = useState("");
  const [nodeReviewControlText, setNodeReviewControlText] = useState("");

  // Quick Owner Edit Modal State (Pencil on Owner pill)
  const [editingOwnerNode, setEditingOwnerNode] = useState<{
    node: WorkflowStepNode;
    index: number;
  } | null>(null);
  const [ownerSearch, setOwnerSearch] = useState("");
  const [customRoleInput, setCustomRoleInput] = useState("");

  // Move Step Modal State (Sandwich / Reorder)
  const [movingNodeIndex, setMovingNodeIndex] = useState<number | null>(null);

  // Move Action Modal State (Sandwich / Move Action between Stages)
  const [movingActionInfo, setMovingActionInfo] = useState<{
    sourceStepId: string;
    actionIndex: number;
    action: WorkflowActionButton;
  } | null>(null);

  // Drag-and-drop state for card reordering
  const [draggedNodeIndex, setDraggedNodeIndex] = useState<number | null>(null);
  const [dragOverNodeIndex, setDragOverNodeIndex] = useState<number | null>(null);
  const [dropSide, setDropSide] = useState<"left" | "right" | null>(null);

  // Editing Action Button Dialog State
  const [editingAction, setEditingAction] = useState<{
    stepId: string;
    actionIndex: number;
    action: WorkflowActionButton;
  } | null>(null);
  const [actionLabel, setActionLabel] = useState("");
  const [actionDesc, setActionDesc] = useState("");
  const [actionVariant, setActionVariant] = useState<
    "default" | "outline" | "secondary" | "destructive"
  >("default");
  const [actionType, setActionType] = useState<"NEXT_STEP" | "PREV_STEP" | "TRIGGER_API" | "CUSTOM">(
    "NEXT_STEP"
  );
  const [actionTarget, setActionTarget] = useState("");
  const [actionFields, setActionFields] = useState<WorkflowActionField[]>([]);

  // Sync active step with URL query param if present
  useEffect(() => {
    if (urlStatus && nodes.length > 0) {
      const match = nodes.find(
        (n) => (n.statusKey || "").toUpperCase() === urlStatus.toUpperCase()
      );
      if (match) {
        setActiveStepId(match.id);
      }
    }
  }, [urlStatus, nodes]);

  // Determine current active simulator step
  const currentSimulatedIndex = nodes.findIndex((n) => n.id === (activeStepId || nodes[0]?.id));
  const currentSimulatedNode = currentSimulatedIndex >= 0 ? nodes[currentSimulatedIndex] : nodes[0];

  const handleSimulateAction = (
    action: WorkflowActionButton,
    sourceNode?: WorkflowStepNode
  ) => {
    // If the action was clicked on a specific card node, that node is the origin step.
    // If clicked inside the simulator panel, sourceNode is currentSimulatedNode.
    const originNode = sourceNode ?? currentSimulatedNode;

    if (action.fields && action.fields.length > 0) {
      for (const fld of action.fields) {
        if (fld.required) {
          const val = testFieldValues[`${action.id}_${fld.id}`] ?? fld.value;
          if (val === undefined || val === null || String(val).trim() === "") {
            toast.error(`"${fld.label}" is required to execute "${action.label}".`);
            return;
          }
        }
      }
    }

    const logEntry = `[${new Date().toLocaleTimeString()}] Executed "${action.label}" from Step "${
      originNode?.title
    }"`;
    setTestExecutionLog((prev) => [logEntry, ...prev.slice(0, 19)]);
    toast.success(`Action Triggered: ${action.label}`);

    if (action.actionType === "CUSTOM" && action.targetStep) {
      const target = nodes.find((n) => n.id === action.targetStep);
      if (target) {
        setActiveStepId(target.id);
        return;
      }
    }

    if (action.actionType === "NEXT_STEP") {
      const currIdx = nodes.findIndex((n) => n.id === originNode?.id);
      if (currIdx >= 0 && currIdx < nodes.length - 1) {
        setActiveStepId(nodes[currIdx + 1].id);
      }
    } else if (action.actionType === "PREV_STEP") {
      const currIdx = nodes.findIndex((n) => n.id === originNode?.id);
      if (currIdx > 0) {
        setActiveStepId(nodes[currIdx - 1].id);
      }
    } else if (action.targetStep) {
      const target = nodes.find((n) => n.id === action.targetStep);
      if (target) {
        setActiveStepId(target.id);
      }
    }
  };

  const handleInsertStep = (insertIndex: number) => {
    const newStepId = `step_${Date.now()}`;
    const newStep: WorkflowStepNode = {
      id: newStepId,
      title: "New Automated Stage",
      description: "Stage description and automated actions.",
      statusKey: "STAGE_" + (insertIndex + 1),
      badgeColor: "indigo",
      assignedRole: "Procurement / Reviewer",
      actions: [
        {
          id: `act_${Date.now()}`,
          label: "Advance Stage",
          variant: "default",
          description: "Proceeds to subsequent stage",
          actionType: "NEXT_STEP",
          fields: [
            {
              id: "decision",
              label: "Review Outcome",
              type: "dropdown",
              options: ["Approved", "Flagged"],
              value: "Approved",
            },
          ],
        },
      ],
    };
    const updated = [...nodes];
    updated.splice(insertIndex, 0, newStep);
    saveMutation.mutate(updated);
  };

  const handleDeleteStep = (index: number) => {
    if (nodes.length <= 1) {
      toast.error("Workflow must have at least one step.");
      return;
    }
    const updated = nodes.filter((_, i) => i !== index);
    saveMutation.mutate(updated);
  };

  const handleOpenEditStep = (node: WorkflowStepNode, index: number) => {
    setEditingNode({ node, index });
    setNodeTitle(node.title);
    setNodeDesc(node.description);
    setNodeBadge(node.badgeColor || "slate");
    setNodeAssignedRole(node.assignedRole || "");
    setNodeAssignedUser(node.assignedUser || "");
    setNodeReviewControlEnabled(Boolean(node.reviewControl?.enabled));
    setNodeReviewControlRole(node.reviewControl?.reviewerRole || "Accounting / Controller");
    setNodeReviewControlText(
      node.reviewControl?.controlText || "Verify GL code & Category are coded properly"
    );
  };

  const handleSaveStep = () => {
    if (!editingNode) return;
    const updated = [...nodes];
    updated[editingNode.index] = {
      ...editingNode.node,
      title: nodeTitle.trim() || editingNode.node.title,
      description: nodeDesc.trim(),
      badgeColor: nodeBadge,
      assignedRole: nodeAssignedRole.trim() || undefined,
      assignedUser: nodeAssignedUser.trim() || undefined,
      reviewControl: nodeReviewControlEnabled
        ? {
            enabled: true,
            reviewerRole: nodeReviewControlRole.trim() || "Accounting / Controller",
            controlText:
              nodeReviewControlText.trim() || "Verify GL code & Category are coded properly",
            passed: editingNode.node.reviewControl?.passed ?? false,
          }
        : undefined,
    };
    saveMutation.mutate(updated);
    setEditingNode(null);
  };

  const handleOpenOwnerModal = (node: WorkflowStepNode, index: number) => {
    setEditingOwnerNode({ node, index });
    setOwnerSearch("");
    setCustomRoleInput(node.assignedRole || "");
  };

  const handleSelectOwnerUser = (userItem: any) => {
    if (!editingOwnerNode) return;
    const fullName = userItem.full_name || userItem.email || "User";
    const userRole = userItem.is_super_admin
      ? "Super Admin"
      : userItem.role ||
        userItem.assigned_roles?.map((r: any) => r.name || r.code).join(", ") ||
        resolveUserDepartment(userItem, rolesList) ||
        userItem.department ||
        "Team Member";

    const updated = [...nodes];
    updated[editingOwnerNode.index] = {
      ...editingOwnerNode.node,
      assignedUser: fullName,
      assignedRole: userRole,
    };
    saveMutation.mutate(updated);
    toast.success(
      `Owner for "${editingOwnerNode.node.title}" updated to ${fullName} (${userRole})`
    );
    setEditingOwnerNode(null);
  };

  const handleSaveCustomOwnerRole = () => {
    if (!editingOwnerNode) return;
    const roleText = customRoleInput.trim();
    const updated = [...nodes];
    updated[editingOwnerNode.index] = {
      ...editingOwnerNode.node,
      assignedRole: roleText || undefined,
      assignedUser: undefined,
    };
    saveMutation.mutate(updated);
    toast.success(
      `Owner role for "${editingOwnerNode.node.title}" set to ${roleText || "Unassigned"}`
    );
    setEditingOwnerNode(null);
  };

  const handleMoveStep = (fromIndex: number, targetIndex: number, side?: "left" | "right") => {
    if (fromIndex < 0 || fromIndex >= nodes.length) return;
    
    // Calculate final destination based on drop side
    let destinationIndex = targetIndex;
    if (side === "right") {
      destinationIndex = fromIndex < targetIndex ? targetIndex : targetIndex + 1;
    } else if (side === "left") {
      destinationIndex = fromIndex < targetIndex ? targetIndex - 1 : targetIndex;
    }

    if (destinationIndex < 0) destinationIndex = 0;
    if (destinationIndex >= nodes.length) destinationIndex = nodes.length - 1;
    if (destinationIndex === fromIndex) return;

    const updated = [...nodes];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(destinationIndex, 0, moved);
    saveMutation.mutate(updated);
    toast.success(`Moved "${moved.title}" to position ${destinationIndex + 1}`);
    setMovingNodeIndex(null);
  };

  const handleTransferToOtherDomain = async (fromIndex: number) => {
    const targetDomain = domain === "purchasing" ? "invoices" : "purchasing";
    const targetName =
      targetDomain === "purchasing" ? "Purchase Requests Workflow" : "A/P & Invoices Workflow";
    const nodeToTransfer = nodes[fromIndex];

    try {
      const targetConfig = await experimentalWorkflowService.getWorkflowConfig(targetDomain);
      const targetNodes = [...(targetConfig.nodes || [])];
      targetNodes.push(nodeToTransfer);

      await experimentalWorkflowService.saveWorkflowConfig(targetDomain, { nodes: targetNodes });

      const updated = nodes.filter((_, idx) => idx !== fromIndex);
      await saveMutation.mutateAsync(updated);

      queryClient.invalidateQueries({ queryKey: ["experimental-workflow", targetDomain] });
      toast.success(`Transferred "${nodeToTransfer.title}" into ${targetName}!`);
      setMovingNodeIndex(null);
    } catch (err: any) {
      toast.error(err?.message || "Failed to transfer step to other workflow.");
    }
  };

  const handleAddActionButton = (stepId: string) => {
    const newAction: WorkflowActionButton = {
      id: `act_${Date.now()}`,
      label: "New Action",
      variant: "default",
      description: "Perform action and trigger workflow event",
      actionType: "NEXT_STEP",
      fields: [],
    };
    const updated = nodes.map((n) => {
      if (n.id === stepId) {
        return { ...n, actions: [...n.actions, newAction] };
      }
      return n;
    });
    saveMutation.mutate(updated);
  };

  const handleOpenEditAction = (
    stepId: string,
    actionIndex: number,
    action: WorkflowActionButton
  ) => {
    setEditingAction({ stepId, actionIndex, action });
    setActionLabel(action.label);
    setActionDesc(action.description || "");
    setActionVariant(action.variant || "default");
    setActionType(action.actionType || "NEXT_STEP");
    setActionTarget(action.targetStep || "");
    setActionFields(action.fields ? JSON.parse(JSON.stringify(action.fields)) : []);
  };

  const handleSaveAction = () => {
    if (!editingAction) return;
    const updated = nodes.map((n) => {
      if (n.id === editingAction.stepId) {
        const nextActs = [...n.actions];
        nextActs[editingAction.actionIndex] = {
          ...editingAction.action,
          label: actionLabel.trim() || editingAction.action.label,
          description: actionDesc.trim(),
          variant: actionVariant,
          actionType,
          targetStep: actionTarget || undefined,
          fields: actionFields,
        };
        return { ...n, actions: nextActs };
      }
      return n;
    });
    saveMutation.mutate(updated);
    setEditingAction(null);
  };

  const handleDeleteAction = (stepId: string, actionIndex: number) => {
    const updated = nodes.map((n) => {
      if (n.id === stepId) {
        return { ...n, actions: n.actions.filter((_, idx) => idx !== actionIndex) };
      }
      return n;
    });
    saveMutation.mutate(updated);
  };

  const handleMoveActionToStage = (
    sourceStepId: string,
    actionIndex: number,
    targetStepId: string
  ) => {
    const sourceNode = nodes.find((n) => n.id === sourceStepId);
    const targetNode = nodes.find((n) => n.id === targetStepId);
    if (!sourceNode || !targetNode) return;

    const actionToMove = sourceNode.actions[actionIndex];
    if (!actionToMove) return;

    const updated = nodes.map((node) => {
      if (node.id === sourceStepId && node.id === targetStepId) {
        return node;
      }
      if (node.id === sourceStepId) {
        return {
          ...node,
          actions: node.actions.filter((_, idx) => idx !== actionIndex),
        };
      }
      if (node.id === targetStepId) {
        return {
          ...node,
          actions: [...node.actions, actionToMove],
        };
      }
      return node;
    });

    saveMutation.mutate(updated);
    toast.success(`Moved action "${actionToMove.label}" to "${targetNode.title}"`);
    setMovingActionInfo(null);
  };

  return {
    nodes,
    usersList,
    rolesList,
    saveMutation,
    resetMutation,
    saveAsDefaultMutation,
    // Simulator
    activeStepId,
    setActiveStepId,
    testExecutionLog,
    setTestExecutionLog,
    testFieldValues,
    setTestFieldValues,
    currentSimulatedIndex,
    currentSimulatedNode,
    handleSimulateAction,
    // Stage crud & reorder
    handleInsertStep,
    handleDeleteStep,
    handleMoveStep,
    handleTransferToOtherDomain,
    // Stage edit dialog
    editingNode,
    setEditingNode,
    nodeTitle,
    setNodeTitle,
    nodeDesc,
    setNodeDesc,
    nodeBadge,
    setNodeBadge,
    nodeAssignedRole,
    setNodeAssignedRole,
    nodeReviewControlEnabled,
    setNodeReviewControlEnabled,
    nodeReviewControlRole,
    setNodeReviewControlRole,
    nodeReviewControlText,
    setNodeReviewControlText,
    handleOpenEditStep,
    handleSaveStep,
    // Owner modal
    editingOwnerNode,
    setEditingOwnerNode,
    ownerSearch,
    setOwnerSearch,
    customRoleInput,
    setCustomRoleInput,
    handleOpenOwnerModal,
    handleSelectOwnerUser,
    handleSaveCustomOwnerRole,
    // Move stage modal
    movingNodeIndex,
    setMovingNodeIndex,
    // Move action modal
    movingActionInfo,
    setMovingActionInfo,
    handleMoveActionToStage,
    // Action edit dialog
    editingAction,
    setEditingAction,
    actionLabel,
    setActionLabel,
    actionDesc,
    setActionDesc,
    actionVariant,
    setActionVariant,
    actionType,
    setActionType,
    actionTarget,
    setActionTarget,
    actionFields,
    setActionFields,
    handleAddActionButton,
    handleOpenEditAction,
    handleSaveAction,
    handleDeleteAction,
    // Drag-and-drop
    draggedNodeIndex,
    setDraggedNodeIndex,
    dragOverNodeIndex,
    setDragOverNodeIndex,
    dropSide,
    setDropSide,
  };
}

