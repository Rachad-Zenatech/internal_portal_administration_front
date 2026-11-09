import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import {
  GitFork,
  Plus,
  Play,
  RotateCcw,
  Trash2,
  Edit2,
  ArrowRight,
  Settings2,
  Sparkles,
  CheckCircle2,
  Clock,
  Circle,
  UserCheck,
  Shield,
  GripVertical,
  ArrowLeftRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  experimentalWorkflowService,
  type WorkflowConfigResponse,
  type WorkflowStepNode,
  type WorkflowActionButton,
  type WorkflowActionField
} from "@/services/experimentalWorkflowService";

interface WorkflowAutoCanvasProps {
  domain: "purchasing" | "invoices";
  title: string;
  subtitle: string;
}

export function WorkflowAutoCanvas({ domain, title, subtitle }: WorkflowAutoCanvasProps) {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const urlStatus = searchParams.get("status");

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

  const saveMutation = useMutation({
    mutationFn: (updatedNodes: WorkflowStepNode[]) =>
      experimentalWorkflowService.saveWorkflowConfig(domain, { nodes: updatedNodes }),
    onMutate: async (updatedNodes: WorkflowStepNode[]) => {
      // Optimistic instant UI update
      setLocalNodes(updatedNodes);
      await queryClient.cancelQueries({ queryKey: ["experimental-workflow", domain] });
      const previous = queryClient.getQueryData<WorkflowConfigResponse>(["experimental-workflow", domain]);
      if (previous) {
        queryClient.setQueryData<WorkflowConfigResponse>(["experimental-workflow", domain], {
          ...previous,
          nodes: updatedNodes
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
        setLocalNodes(data.nodes);
      }
      queryClient.setQueryData(["experimental-workflow", domain], data);
      toast.success("Workflow reset to original baseline template");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to reset workflow");
    },
  });

  // Active testing simulator state
  const [activeStepId, setActiveStepId] = useState<string>("");
  const [testExecutionLog, setTestExecutionLog] = useState<string[]>([]);
  const [testFieldValues, setTestFieldValues] = useState<Record<string, any>>({});

  // Editing Step Node Dialog State
  const [editingNode, setEditingNode] = useState<{ node: WorkflowStepNode; index: number } | null>(null);
  const [nodeTitle, setNodeTitle] = useState("");
  const [nodeDesc, setNodeDesc] = useState("");
  const [nodeBadge, setNodeBadge] = useState("slate");
  const [nodeAssignedRole, setNodeAssignedRole] = useState("");

  // Move Step Modal State (Sandwich / Reorder)
  const [movingNodeIndex, setMovingNodeIndex] = useState<number | null>(null);

  // Editing Action Button Dialog State
  const [editingAction, setEditingAction] = useState<{
    stepId: string;
    actionIndex: number;
    action: WorkflowActionButton;
  } | null>(null);
  const [actionLabel, setActionLabel] = useState("");
  const [actionDesc, setActionDesc] = useState("");
  const [actionVariant, setActionVariant] = useState<"default" | "outline" | "secondary" | "destructive">("default");
  const [actionType, setActionType] = useState<"NEXT_STEP" | "PREV_STEP" | "TRIGGER_API" | "CUSTOM">("NEXT_STEP");
  const [actionTarget, setActionTarget] = useState("");
  const [actionFields, setActionFields] = useState<WorkflowActionField[]>([]);

  // Sync active step with URL query param if present
  useEffect(() => {
    if (urlStatus && nodes.length > 0) {
      const match = nodes.find(n => (n.statusKey || "").toUpperCase() === urlStatus.toUpperCase());
      if (match) {
        setActiveStepId(match.id);
      }
    }
  }, [urlStatus, nodes]);

  // Determine current active simulator step
  const currentSimulatedIndex = nodes.findIndex(n => n.id === (activeStepId || nodes[0]?.id));
  const currentSimulatedNode = currentSimulatedIndex >= 0 ? nodes[currentSimulatedIndex] : nodes[0];

  const handleSimulateAction = (action: WorkflowActionButton) => {
    const logEntry = `[${new Date().toLocaleTimeString()}] Executed "${action.label}" from Step "${currentSimulatedNode?.title}"`;
    setTestExecutionLog(prev => [logEntry, ...prev.slice(0, 19)]);
    toast.success(`Action Triggered: ${action.label}`);

    if (action.targetStep) {
      const target = nodes.find(n => n.id === action.targetStep);
      if (target) {
        setActiveStepId(target.id);
      }
    } else if (action.actionType === "NEXT_STEP") {
      const currIdx = nodes.findIndex(n => n.id === currentSimulatedNode?.id);
      if (currIdx >= 0 && currIdx < nodes.length - 1) {
        setActiveStepId(nodes[currIdx + 1].id);
      }
    } else if (action.actionType === "PREV_STEP") {
      const currIdx = nodes.findIndex(n => n.id === currentSimulatedNode?.id);
      if (currIdx > 0) {
        setActiveStepId(nodes[currIdx - 1].id);
      }
    }
  };

  // Insert step at index (to left or right)
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
            { id: "decision", label: "Review Outcome", type: "dropdown", options: ["Approved", "Flagged"], value: "Approved" }
          ]
        }
      ]
    };
    const updated = [...nodes];
    updated.splice(insertIndex, 0, newStep);
    saveMutation.mutate(updated);
  };

  // Delete a step
  const handleDeleteStep = (index: number) => {
    if (nodes.length <= 1) {
      toast.error("Workflow must have at least one step.");
      return;
    }
    const updated = nodes.filter((_, i) => i !== index);
    saveMutation.mutate(updated);
  };

  // Open Step Editor
  const handleOpenEditStep = (node: WorkflowStepNode, index: number) => {
    setEditingNode({ node, index });
    setNodeTitle(node.title);
    setNodeDesc(node.description);
    setNodeBadge(node.badgeColor || "slate");
    setNodeAssignedRole(node.assignedRole || "");
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
    };
    saveMutation.mutate(updated);
    setEditingNode(null);
  };

  // Move / Reorder Step
  const handleMoveStep = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= nodes.length || fromIndex === toIndex) return;
    const updated = [...nodes];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    saveMutation.mutate(updated);
    toast.success(`Moved "${moved.title}" to position ${toIndex + 1}`);
    setMovingNodeIndex(null);
  };

  // Move directly to the other workflow domain
  const handleTransferToOtherDomain = async (fromIndex: number) => {
    const targetDomain = domain === "purchasing" ? "invoices" : "purchasing";
    const targetName = targetDomain === "purchasing" ? "Purchase Requests Workflow" : "A/P & Invoices Workflow";
    const nodeToTransfer = nodes[fromIndex];

    try {
      // 1. Fetch other domain's config
      const targetConfig = await experimentalWorkflowService.getWorkflowConfig(targetDomain);
      const targetNodes = [...(targetConfig.nodes || [])];
      targetNodes.push(nodeToTransfer);

      // 2. Save target domain
      await experimentalWorkflowService.saveWorkflowConfig(targetDomain, { nodes: targetNodes });

      // 3. Remove from current domain
      const updated = nodes.filter((_, idx) => idx !== fromIndex);
      await saveMutation.mutateAsync(updated);

      queryClient.invalidateQueries({ queryKey: ["experimental-workflow", targetDomain] });
      toast.success(`Transferred "${nodeToTransfer.title}" into ${targetName}!`);
      setMovingNodeIndex(null);
    } catch (err: any) {
      toast.error(err?.message || "Failed to transfer step to other workflow.");
    }
  };

  // Add Action Button to Step
  const handleAddActionButton = (stepId: string) => {
    const newAction: WorkflowActionButton = {
      id: `act_${Date.now()}`,
      label: "New Action",
      variant: "default",
      description: "Perform action and trigger workflow event",
      actionType: "NEXT_STEP",
      fields: []
    };
    const updated = nodes.map(n => {
      if (n.id === stepId) {
        return { ...n, actions: [...n.actions, newAction] };
      }
      return n;
    });
    saveMutation.mutate(updated);
  };

  // Open Action Editor
  const handleOpenEditAction = (stepId: string, actionIndex: number, action: WorkflowActionButton) => {
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
    const updated = nodes.map(n => {
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
    const updated = nodes.map(n => {
      if (n.id === stepId) {
        return { ...n, actions: n.actions.filter((_, idx) => idx !== actionIndex) };
      }
      return n;
    });
    saveMutation.mutate(updated);
  };

  return (
    <div className="w-full flex flex-col gap-5 animate-in fade-in duration-300">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400">
              <GitFork className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                {title}
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]">
                  Experimental Auto
                </Badge>
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              if (window.confirm("Reset workflow back to the standard Purchase Request production flow?")) {
                resetMutation.mutate();
              }
            }}
            disabled={resetMutation.isPending}
            className="text-xs h-8 gap-1.5"
            title="Load the standard production purchase request flow"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset to Standard Flow
          </Button>
          <Button
            size="sm"
            onClick={() => handleInsertStep(nodes.length)}
            className="text-xs h-8 gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Stage at End
          </Button>
        </div>
      </div>

      {/* Horizontal Visual Canvas */}
      <div className="w-full overflow-x-auto pb-4 pt-1">
        <div className="inline-flex items-start gap-3 min-w-full">
          {/* Add node at very beginning (left-most) */}
          <div className="self-center flex flex-col items-center">
            <Button
              size="icon"
              variant="outline"
              onClick={() => handleInsertStep(0)}
              title="Add stage before first step"
              className="h-8 w-8 rounded-full border-dashed border-indigo-300 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-500 shadow-2xs"
            >
              <Plus className="w-4 h-4" />
            </Button>
            <span className="text-[10px] text-muted-foreground mt-1 whitespace-nowrap">Add Left</span>
          </div>

          {nodes.map((node, idx) => {
            const isSimulated = (currentSimulatedNode?.id === node.id);
            return (
              <React.Fragment key={node.id}>
                {/* Step Card Node */}
                <div
                  className={`w-72 shrink-0 rounded-xl border transition-all ${
                    isSimulated
                      ? "ring-2 ring-indigo-500 border-indigo-400 bg-indigo-50/20 dark:bg-indigo-950/20 shadow-md"
                      : "border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs hover:border-slate-300 dark:hover:border-zinc-700"
                  }`}
                >
                  {/* Step Header */}
                  <div className="p-3 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="h-5 w-5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold text-[11px] flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <h3 className="font-semibold text-xs text-slate-900 dark:text-zinc-100 truncate max-w-[150px]">
                        {node.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-0.5">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setMovingNodeIndex(idx)}
                        title="Move / transfer stage position (sandwich handle)"
                        className="h-6 w-6 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                      >
                        <GripVertical className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleOpenEditStep(node, idx)}
                        className="h-6 w-6 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
                      >
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteStep(idx)}
                        className="h-6 w-6 text-slate-400 hover:text-rose-500"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Step Description & Assigned Role */}
                  <div className="p-3 space-y-2.5">
                    {/* Role / Owner pill */}
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-100/90 dark:bg-zinc-800 border border-slate-200/70 dark:border-zinc-700/60 text-[10px]">
                      <Shield className="w-3 h-3 text-indigo-500 shrink-0" />
                      <span className="font-semibold text-slate-500 dark:text-zinc-400">Owner:</span>
                      <span className="font-medium text-slate-800 dark:text-zinc-200 truncate">
                        {node.assignedRole || "Unassigned"}
                      </span>
                    </div>

                    <p className="text-[11px] text-muted-foreground leading-relaxed min-h-[30px]">
                      {node.description || "No description provided."}
                    </p>

                    {/* Action Buttons Container */}
                    <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Step Actions ({node.actions.length})
                        </span>
                        <button
                          type="button"
                          onClick={() => handleAddActionButton(node.id)}
                          className="text-[10px] text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-0.5"
                        >
                          <Plus className="w-3 h-3" />
                          Add Action
                        </button>
                      </div>

                      {node.actions.length === 0 ? (
                        <div className="text-[11px] text-slate-400 italic py-1">No action buttons defined.</div>
                      ) : (
                        <div className="space-y-2">
                          {node.actions.map((act, actIdx) => (
                            <div
                              key={act.id}
                              className="p-2 rounded-lg bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700/60 text-xs space-y-1.5"
                            >
                              <div className="flex items-center justify-between">
                                <Button
                                  size="sm"
                                  variant={act.variant || "default"}
                                  onClick={() => handleSimulateAction(act)}
                                  className="h-7 text-xs font-semibold px-2.5 truncate max-w-[170px]"
                                >
                                  {act.label}
                                </Button>
                                <div className="flex items-center gap-0.5">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditAction(node.id, actIdx, act)}
                                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
                                  >
                                    <Settings2 className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteAction(node.id, actIdx)}
                                    className="p-1 text-slate-400 hover:text-rose-500"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>

                              {act.description && (
                                <p className="text-[10px] text-slate-500 dark:text-zinc-400 italic">
                                  {act.description}
                                </p>
                              )}

                              {/* Form Fields & Dropdowns attached to this action button */}
                              {act.fields && act.fields.length > 0 && (
                                <div className="pt-1.5 border-t border-slate-200/60 dark:border-zinc-700/50 space-y-1.5">
                                  {act.fields.map((fld) => (
                                    <div key={fld.id} className="space-y-0.5">
                                      <label className="text-[10px] font-medium text-slate-600 dark:text-zinc-400 flex items-center justify-between">
                                        <span>{fld.label}</span>
                                        <span className="text-[9px] text-slate-400">{fld.type}</span>
                                      </label>
                                      {fld.type === "dropdown" ? (
                                        <Select
                                          value={testFieldValues[`${act.id}_${fld.id}`] || fld.value || fld.options?.[0]}
                                          onValueChange={(val) =>
                                            setTestFieldValues(prev => ({ ...prev, [`${act.id}_${fld.id}`]: val }))
                                          }
                                        >
                                          <SelectTrigger className="h-6 text-[11px] bg-white dark:bg-zinc-900">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {fld.options?.map((opt) => (
                                              <SelectItem key={opt} value={opt} className="text-xs">
                                                {opt}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      ) : (
                                        <Input
                                          placeholder={fld.placeholder || fld.label}
                                          value={testFieldValues[`${act.id}_${fld.id}`] ?? fld.value ?? ""}
                                          onChange={(e) =>
                                            setTestFieldValues(prev => ({
                                              ...prev,
                                              [`${act.id}_${fld.id}`]: e.target.value
                                            }))
                                          }
                                          className="h-6 text-[11px] bg-white dark:bg-zinc-900"
                                        />
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Connector Arrow + Inline "+" Button between steps */}
                <div className="self-center flex flex-col items-center px-1">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => handleInsertStep(idx + 1)}
                    title={`Insert stage between ${node.title} and next step`}
                    className="h-7 w-7 rounded-full border-dashed border-slate-300 text-slate-500 hover:border-indigo-500 hover:text-indigo-600 shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                  <ArrowRight className="w-4 h-4 text-slate-300 dark:text-zinc-700 mt-1" />
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Dynamic Workflow Pipeline Stepper View (mirrors request detail workflow progress) */}
      <Card className="border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                Pipeline Stepper View
              </h3>
            </div>
            <span className="text-[11px] text-muted-foreground">
              Click any stage pill below to jump simulated active state
            </span>
          </div>

          <div className="relative w-full overflow-x-auto py-2">
            <div className="w-full flex items-center justify-between gap-1 sm:gap-2 px-1 min-w-max">
              {nodes.map((node, i) => {
                const isCurrent = node.id === currentSimulatedNode?.id;
                const isDone = currentSimulatedIndex > -1 && i < currentSimulatedIndex;

                let pillClass = "bg-slate-100/80 text-slate-500 border border-slate-200/80 dark:bg-zinc-800/80 dark:text-zinc-400 dark:border-zinc-700/60";
                if (isCurrent) {
                  pillClass = "bg-amber-500/15 text-amber-800 border-2 border-amber-500 dark:bg-amber-500/25 dark:text-amber-300 font-semibold shadow-xs ring-2 ring-amber-400/20";
                } else if (isDone) {
                  pillClass = "bg-emerald-500/10 text-emerald-700 border border-emerald-500/30 dark:bg-emerald-500/20 dark:text-emerald-400 font-medium";
                }

                return (
                  <React.Fragment key={`stepper-node-${node.id}-${i}`}>
                    <div className="flex items-center shrink-0">
                      <button
                        type="button"
                        onClick={() => setActiveStepId(node.id)}
                        title={`Stage ${i + 1}: ${node.title} (Click to jump)`}
                        className={`w-max px-3 h-8 sm:h-9 inline-flex items-center justify-center gap-1.5 rounded-lg text-[11px] sm:text-xs whitespace-nowrap shrink-0 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${pillClass}`}
                      >
                        {isDone ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        ) : isCurrent ? (
                          <Clock className="h-3.5 w-3.5 text-amber-500 animate-pulse shrink-0" />
                        ) : (
                          <Circle className="h-3 w-3 text-slate-400 dark:text-zinc-500 shrink-0" />
                        )}
                        <span className="text-center">{node.title}</span>
                      </button>
                    </div>

                    {/* Flexible connector line */}
                    {i < nodes.length - 1 && (
                      <div
                        className={`h-[2px] flex-1 min-w-[12px] sm:min-w-[20px] rounded-full transition-colors duration-200 shrink-0 ${
                          isDone
                            ? "bg-emerald-500/60 dark:bg-emerald-500/40"
                            : "bg-slate-200 dark:bg-zinc-700/80"
                        }`}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Simulator & Live Test Panel */}
      <Card className="border border-slate-200 dark:border-zinc-800 shadow-xs">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-2">
            <div className="flex items-center gap-2">
              <Play className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                Live Interactive Workflow Simulator
              </h3>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-[11px] border border-slate-200 dark:border-zinc-700">
                <UserCheck className="w-3.5 h-3.5 text-indigo-500" />
                <span className="text-muted-foreground">Managed By:</span>
                <span className="font-semibold text-slate-900 dark:text-zinc-100">
                  {currentSimulatedNode?.assignedRole || "Unassigned"}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Stage:</span>
                <Badge className="bg-indigo-600 text-white font-semibold">
                  {currentSimulatedNode?.title || "None"}
                </Badge>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-2 p-3 bg-slate-50 dark:bg-zinc-800/50 rounded-lg border border-slate-200 dark:border-zinc-700">
              <div className="font-semibold text-slate-800 dark:text-zinc-200">
                Available Actions for Stage: "{currentSimulatedNode?.title}"
              </div>
              <p className="text-[11px] text-muted-foreground">
                Click any action button to test state changes, dropdown values, and transitions.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {currentSimulatedNode?.actions.map(act => (
                  <Button
                    key={act.id}
                    size="sm"
                    variant={act.variant || "default"}
                    onClick={() => handleSimulateAction(act)}
                    className="h-8 text-xs font-semibold gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {act.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2 p-3 bg-slate-50 dark:bg-zinc-800/50 rounded-lg border border-slate-200 dark:border-zinc-700 font-mono">
              <div className="font-sans font-semibold text-slate-800 dark:text-zinc-200 flex items-center justify-between">
                <span>Execution Trace Log</span>
                {testExecutionLog.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setTestExecutionLog([])}
                    className="text-[10px] text-slate-400 hover:text-slate-600"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="h-24 overflow-y-auto space-y-1 text-[11px] text-slate-600 dark:text-zinc-400">
                {testExecutionLog.length === 0 ? (
                  <span className="text-slate-400 italic">No events executed yet. Click an action above to test.</span>
                ) : (
                  testExecutionLog.map((log, i) => (
                    <div key={i} className="leading-tight">
                      {log}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Move / Reorder / Transfer Stage Modal */}
      {movingNodeIndex !== null && nodes[movingNodeIndex] && (
        <Dialog open={movingNodeIndex !== null} onOpenChange={(open) => !open && setMovingNodeIndex(null)}>
          <DialogContent className="max-w-md w-full">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <GripVertical className="w-4 h-4 text-indigo-600" />
                Move or Transfer Stage
              </DialogTitle>
              <DialogDescription className="text-xs">
                Reposition stage "{nodes[movingNodeIndex].title}" within this pipeline or relocate it to a different workflow.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-zinc-800 rounded-lg border border-slate-200 dark:border-zinc-700 space-y-2">
                <div className="font-semibold text-slate-700 dark:text-zinc-300">
                  Reorder within current flow:
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={movingNodeIndex === 0}
                    onClick={() => handleMoveStep(movingNodeIndex, movingNodeIndex - 1)}
                    className="flex-1 text-xs"
                  >
                    Move Left (Step {movingNodeIndex})
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={movingNodeIndex === nodes.length - 1}
                    onClick={() => handleMoveStep(movingNodeIndex, movingNodeIndex + 1)}
                    className="flex-1 text-xs"
                  >
                    Move Right (Step {movingNodeIndex + 2})
                  </Button>
                </div>
                <div className="pt-2">
                  <label className="text-[11px] text-muted-foreground block mb-1">
                    Or jump directly to stage slot:
                  </label>
                  <Select
                    value={String(movingNodeIndex)}
                    onValueChange={(val) => handleMoveStep(movingNodeIndex, parseInt(val, 10))}
                  >
                    <SelectTrigger className="h-8 text-xs bg-white dark:bg-zinc-900">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {nodes.map((n, i) => (
                        <SelectItem key={n.id} value={String(i)}>
                          Position {i + 1}: {n.title} {i === movingNodeIndex ? "(Current)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Cross-Flow Transfer */}
              <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/30 rounded-lg border border-indigo-200 dark:border-indigo-800/50 space-y-2">
                <div className="font-semibold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                  <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-600" />
                  Transfer to Other Workflow
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Move this entire step and its actions into the {domain === "purchasing" ? "A/P & Invoices Workflow" : "Purchase Requests Workflow"}.
                </p>
                <Button
                  size="sm"
                  onClick={() => handleTransferToOtherDomain(movingNodeIndex)}
                  className="w-full text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  Transfer to {domain === "purchasing" ? "A/P & Invoices" : "Purchase Requests"}
                </Button>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setMovingNodeIndex(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Stage Node Modal */}
      {editingNode && (
        <Dialog open={!!editingNode} onOpenChange={(open) => !open && setEditingNode(null)}>
          <DialogContent className="max-w-md w-full">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">Edit Stage Details</DialogTitle>
              <DialogDescription className="text-xs">
                Configure stage title, description, and status badge color.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-zinc-300">Stage Title</label>
                <Input
                  value={nodeTitle}
                  onChange={(e) => setNodeTitle(e.target.value)}
                  placeholder="e.g. Under Review / Executive Approval"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-zinc-300">Description</label>
                <Textarea
                  value={nodeDesc}
                  onChange={(e) => setNodeDesc(e.target.value)}
                  rows={3}
                  placeholder="Explain what occurs during this stage..."
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-zinc-300">
                  Responsible Manager / Role (Who Manages this Flow Step)
                </label>
                <Input
                  value={nodeAssignedRole}
                  onChange={(e) => setNodeAssignedRole(e.target.value)}
                  placeholder="e.g. Procurement Specialist, Dept Manager, CFO, AP Clerk"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-zinc-300">Badge Color Style</label>
                <Select value={nodeBadge} onValueChange={setNodeBadge}>
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="slate">Slate (Default / New)</SelectItem>
                    <SelectItem value="blue">Blue (Review / In Progress)</SelectItem>
                    <SelectItem value="amber">Amber (Waiting Sign-off)</SelectItem>
                    <SelectItem value="indigo">Indigo (Order / Settle)</SelectItem>
                    <SelectItem value="emerald">Emerald (Approved / Completed)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditingNode(null)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSaveStep}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Action Button Modal */}
      {editingAction && (
        <Dialog open={!!editingAction} onOpenChange={(open) => !open && setEditingAction(null)}>
          <DialogContent className="max-w-lg w-full max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">Configure Action Button &amp; Dropdowns</DialogTitle>
              <DialogDescription className="text-xs">
                Customize action trigger, behavior, button color, and dynamic drop-down fields.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-zinc-300">Button Label</label>
                <Input
                  value={actionLabel}
                  onChange={(e) => setActionLabel(e.target.value)}
                  placeholder="e.g. Approve & Record PO"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-zinc-300">Description / Tooltip</label>
                <Input
                  value={actionDesc}
                  onChange={(e) => setActionDesc(e.target.value)}
                  placeholder="Brief description of what this button executes"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-zinc-300">Button Styling</label>
                  <Select value={actionVariant} onValueChange={(v: any) => setActionVariant(v)}>
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Solid Primary (Dark/Blue)</SelectItem>
                      <SelectItem value="outline">Outline</SelectItem>
                      <SelectItem value="secondary">Secondary</SelectItem>
                      <SelectItem value="destructive">Destructive (Red / Reject)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-zinc-300">Flow Action Type</label>
                  <Select value={actionType} onValueChange={(v: any) => setActionType(v)}>
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NEXT_STEP">Move to Next Stage</SelectItem>
                      <SelectItem value="PREV_STEP">Return to Previous Stage</SelectItem>
                      <SelectItem value="TRIGGER_API">Trigger API / Event</SelectItem>
                      <SelectItem value="CUSTOM">Custom Target</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {actionType === "CUSTOM" && (
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-zinc-300">Jump to Specific Stage</label>
                  <Select value={actionTarget} onValueChange={setActionTarget}>
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Select target stage..." />
                    </SelectTrigger>
                    <SelectContent>
                      {nodes.map(n => (
                        <SelectItem key={n.id} value={n.id}>
                          {n.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Action Dropdown / Custom Fields List */}
              <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700 dark:text-zinc-300">
                    Input Fields &amp; Dropdowns ({actionFields.length})
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setActionFields(prev => [
                          ...prev,
                          {
                            id: `fld_${Date.now()}`,
                            label: "New Dropdown",
                            type: "dropdown",
                            options: ["Option A", "Option B", "Option C"],
                            value: "Option A"
                          }
                        ]);
                      }}
                      className="h-6 text-[10px] gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      Add Dropdown
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setActionFields(prev => [
                          ...prev,
                          {
                            id: `fld_${Date.now()}`,
                            label: "Text Input",
                            type: "text",
                            placeholder: "Enter details..."
                          }
                        ]);
                      }}
                      className="h-6 text-[10px] gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      Add Text Field
                    </Button>
                  </div>
                </div>

                {actionFields.map((fld, fldIdx) => (
                  <div
                    key={fld.id}
                    className="p-2.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/40 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <Input
                        value={fld.label}
                        onChange={(e) => {
                          const val = e.target.value;
                          setActionFields(prev => {
                            const next = [...prev];
                            next[fldIdx].label = val;
                            return next;
                          });
                        }}
                        placeholder="Field Label (e.g. Region, Priority)"
                        className="h-7 text-xs font-semibold w-2/3"
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setActionFields(prev => prev.filter((_, i) => i !== fldIdx));
                        }}
                        className="h-6 w-6 text-slate-400 hover:text-rose-500"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500">
                        Dropdown Options (comma separated)
                      </label>
                      <Input
                        value={(fld.options || []).join(", ")}
                        onChange={(e) => {
                          const opts = e.target.value.split(",").map(o => o.trim()).filter(Boolean);
                          setActionFields(prev => {
                            const next = [...prev];
                            next[fldIdx].options = opts;
                            return next;
                          });
                        }}
                        placeholder="Option 1, Option 2, Option 3"
                        className="h-7 text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditingAction(null)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSaveAction}>
                Save Action Button
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
