import React from "react";
import {
  Plus,
  Trash2,
  Edit2,
  ArrowRight,
  Settings2,
  Shield,
  GripVertical,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  WorkflowStepNode,
  WorkflowActionButton,
} from "@/services/experimentalWorkflowService";

interface StageCardNodeProps {
  node: WorkflowStepNode;
  idx: number;
  isSimulated: boolean;
  isDragged: boolean;
  isDragOver: boolean;
  testFieldValues: Record<string, string>;
  setTestFieldValues: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onDragOverNode: (idx: number) => void;
  onDragLeaveNode: () => void;
  onDropNode: (idx: number) => void;
  onDragStartNode: (idx: number, e: React.DragEvent) => void;
  onDragEndNode: () => void;
  onOpenMoveModal: (idx: number) => void;
  onOpenEditStep: (node: WorkflowStepNode, index: number) => void;
  onDeleteStep: (index: number) => void;
  onOpenOwnerModal: (node: WorkflowStepNode, index: number) => void;
  onAddActionButton: (stepId: string) => void;
  onSimulateAction: (action: WorkflowActionButton) => void;
  onStartMoveAction: (sourceStepId: string, actionIndex: number, action: WorkflowActionButton) => void;
  onOpenEditAction: (stepId: string, actionIndex: number, action: WorkflowActionButton) => void;
  onDeleteAction: (stepId: string, actionIndex: number) => void;
  onInsertStepAfter: (idx: number) => void;
}

export function StageCardNode({
  node,
  idx,
  isSimulated,
  isDragged,
  isDragOver,
  testFieldValues,
  setTestFieldValues,
  onDragOverNode,
  onDragLeaveNode,
  onDropNode,
  onDragStartNode,
  onDragEndNode,
  onOpenMoveModal,
  onOpenEditStep,
  onDeleteStep,
  onOpenOwnerModal,
  onAddActionButton,
  onSimulateAction,
  onStartMoveAction,
  onOpenEditAction,
  onDeleteAction,
  onInsertStepAfter,
}: StageCardNodeProps) {
  return (
    <React.Fragment>
      {/* Step Card Node */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          onDragOverNode(idx);
        }}
        onDragLeave={onDragLeaveNode}
        onDrop={(e) => {
          e.preventDefault();
          onDropNode(idx);
        }}
        className={`w-72 shrink-0 rounded-xl border transition-all ${
          isDragged
            ? "opacity-40 scale-95 border-indigo-400 border-dashed"
            : isDragOver
            ? "ring-2 ring-indigo-500 border-indigo-500 scale-[1.02] shadow-lg"
            : isSimulated
            ? "ring-2 ring-indigo-500 border-indigo-400 bg-indigo-50/20 dark:bg-indigo-950/20 shadow-md"
            : "border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs hover:border-slate-300 dark:hover:border-zinc-700"
        }`}
      >
        {/* Step Header */}
        <div className="p-3 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {/* Drag Handle placed on the left side before the number */}
            <button
              type="button"
              draggable
              onDragStart={(e) => onDragStartNode(idx, e)}
              onDragEnd={onDragEndNode}
              onClick={() => onOpenMoveModal(idx)}
              title="Drag to reposition stage, or click to move/transfer"
              className="cursor-grab active:cursor-grabbing p-0.5 -ml-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <GripVertical className="w-4 h-4" />
            </button>

            <span className="h-5 w-5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold text-[11px] flex items-center justify-center">
              {idx + 1}
            </span>
            <h3 className="font-semibold text-xs text-slate-900 dark:text-zinc-100 truncate max-w-[130px]">
              {node.title}
            </h3>
          </div>

          <div className="flex items-center gap-0.5">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onOpenEditStep(node, idx)}
              className="h-6 w-6 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
            >
              <Edit2 className="w-3 h-3" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onDeleteStep(idx)}
              className="h-6 w-6 text-slate-400 hover:text-rose-500"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Step Description & Assigned Role */}
        <div className="p-3 space-y-2.5">
          {/* Role / Owner pill with edit pencil */}
          <div className="flex items-center justify-between gap-1 px-2 py-1 rounded-md bg-slate-100/90 dark:bg-zinc-800 border border-slate-200/70 dark:border-zinc-700/60 text-[10px]">
            <div className="flex items-center gap-1.5 min-w-0">
              <Shield className="w-3 h-3 text-indigo-500 shrink-0" />
              <span className="font-semibold text-slate-500 dark:text-zinc-400 shrink-0">Owner:</span>
              <span
                className="font-medium text-slate-800 dark:text-zinc-200 truncate"
                title={
                  node.assignedUser
                    ? `${node.assignedUser} (${node.assignedRole || "User"})`
                    : node.assignedRole || "Unassigned"
                }
              >
                {node.assignedUser ? (
                  <>
                    <span className="font-semibold text-indigo-700 dark:text-indigo-300">
                      {node.assignedUser}
                    </span>
                    {node.assignedRole && (
                      <span className="text-[9px] text-slate-400 dark:text-zinc-500 ml-1">
                        ({node.assignedRole})
                      </span>
                    )}
                  </>
                ) : (
                  node.assignedRole || "Unassigned"
                )}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onOpenOwnerModal(node, idx)}
              title="Change stage owner & role"
              className="p-0.5 -mr-0.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded hover:bg-slate-200/60 dark:hover:bg-zinc-700 transition-colors shrink-0"
            >
              <Edit2 className="w-2.5 h-2.5" />
            </button>
          </div>

          <p className="text-[11px] text-muted-foreground leading-relaxed min-h-[30px]">
            {node.description || "No description provided."}
          </p>

          {/* Stage Review & Control Gate (Underneath stage description) */}
          {node.reviewControl?.enabled && (
            <div className="p-2.5 rounded-lg bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                  Internal Control Review
                </span>
                <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-900/50 px-1.5 py-0.5 rounded">
                  {node.reviewControl.reviewerRole || "Accounting Review"}
                </span>
              </div>
              <p className="text-[11px] text-rose-900 dark:text-rose-200 leading-snug font-medium">
                {node.reviewControl.controlText || "Verify GL code & Category are coded properly"}
              </p>
            </div>
          )}

          {/* Action Buttons Container */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Step Actions ({node.actions.length})
              </span>
              <button
                type="button"
                onClick={() => onAddActionButton(node.id)}
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
                    <div className="flex items-center justify-between gap-1.5">
                      <Button
                        size="sm"
                        variant={act.variant || "default"}
                        onClick={() => onSimulateAction(act)}
                        title={act.label}
                        className="h-auto min-h-[28px] py-1 text-xs font-semibold px-2.5 flex-1 whitespace-normal text-left justify-start leading-tight"
                      >
                        {act.label}
                      </Button>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            onStartMoveAction(node.id, actIdx, act)
                          }
                          title="Move action to another stage (sandwich handle)"
                          className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded hover:bg-slate-200/60 dark:hover:bg-zinc-750 transition-colors"
                        >
                          <GripVertical className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenEditAction(node.id, actIdx, act)}
                          title="Edit action settings"
                          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 rounded hover:bg-slate-200/60 dark:hover:bg-zinc-750"
                        >
                          <Settings2 className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteAction(node.id, actIdx)}
                          title="Delete action"
                          className="p-1 text-slate-400 hover:text-rose-500 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40"
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
                              <span className="flex items-center gap-1">
                                {fld.label}
                                {fld.required && (
                                  <span className="text-rose-500 font-bold">*</span>
                                )}
                              </span>
                              <span className="text-[9px] text-slate-400">
                                {fld.required ? "required " : ""}
                                {fld.type}
                              </span>
                            </label>
                            {fld.type === "dropdown" ? (
                              <Select
                                value={
                                  testFieldValues[`${act.id}_${fld.id}`] ||
                                  fld.value ||
                                  fld.options?.[0]
                                }
                                onValueChange={(val) =>
                                  setTestFieldValues((prev) => ({
                                    ...prev,
                                    [`${act.id}_${fld.id}`]: val,
                                  }))
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
                                value={
                                  testFieldValues[`${act.id}_${fld.id}`] ??
                                  fld.value ??
                                  ""
                                }
                                onChange={(e) =>
                                  setTestFieldValues((prev) => ({
                                    ...prev,
                                    [`${act.id}_${fld.id}`]: e.target.value,
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
          onClick={() => onInsertStepAfter(idx + 1)}
          title={`Insert stage between ${node.title} and next step`}
          className="h-7 w-7 rounded-full border-dashed border-slate-300 text-slate-500 hover:border-indigo-500 hover:text-indigo-600 shadow-2xs"
        >
          <Plus className="w-3.5 h-3.5" />
        </Button>
        <ArrowRight className="w-4 h-4 text-slate-300 dark:text-zinc-700 mt-1" />
      </div>
    </React.Fragment>
  );
}

