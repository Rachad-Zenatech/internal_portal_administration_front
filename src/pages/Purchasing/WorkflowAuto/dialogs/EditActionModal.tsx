import React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  WorkflowActionField,
} from "@/services/experimentalWorkflowService";

interface EditActionModalProps {
  editingAction: {
    stepId: string;
    actionIndex: number;
    action: WorkflowActionButton;
  } | null;
  nodes: WorkflowStepNode[];
  actionLabel: string;
  setActionLabel: (val: string) => void;
  actionDesc: string;
  setActionDesc: (val: string) => void;
  actionVariant: "default" | "outline" | "secondary" | "destructive";
  setActionVariant: (val: "default" | "outline" | "secondary" | "destructive") => void;
  actionType: "NEXT_STEP" | "PREV_STEP" | "TRIGGER_API" | "UPDATE_DATABASE" | "CUSTOM";
  setActionType: (val: "NEXT_STEP" | "PREV_STEP" | "TRIGGER_API" | "UPDATE_DATABASE" | "CUSTOM") => void;
  actionTarget: string;
  setActionTarget: (val: string) => void;
  actionFields: WorkflowActionField[];
  setActionFields: React.Dispatch<React.SetStateAction<WorkflowActionField[]>>;
  onClose: () => void;
  onSave: () => void;
}

export function EditActionModal({
  editingAction,
  nodes,
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
  onClose,
  onSave,
}: EditActionModalProps) {
  if (!editingAction) {
    return null;
  }

  return (
    <Dialog open={!!editingAction} onOpenChange={(open) => !open && onClose()}>
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
                  <SelectItem value="UPDATE_DATABASE">Update Database</SelectItem>
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
                  {nodes.map((n) => (
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
                    setActionFields((prev) => [
                      ...prev,
                      {
                        id: `fld_${Date.now()}`,
                        label: "New Dropdown",
                        type: "dropdown",
                        options: ["Option A", "Option B", "Option C"],
                        value: "Option A",
                      },
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
                    setActionFields((prev) => [
                      ...prev,
                      {
                        id: `fld_${Date.now()}`,
                        label: "Text Input",
                        type: "text",
                        placeholder: "Enter details...",
                      },
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
                      setActionFields((prev) => {
                        const next = [...prev];
                        next[fldIdx].label = val;
                        return next;
                      });
                    }}
                    placeholder="Field Label (e.g. Region, Priority)"
                    className="h-7 text-xs font-semibold w-1/2"
                  />
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-zinc-300 font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(fld.required)}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setActionFields((prev) => {
                            const next = [...prev];
                            next[fldIdx].required = checked;
                            return next;
                          });
                        }}
                        className="rounded border-slate-300 text-indigo-600 h-3.5 w-3.5 focus:ring-indigo-500"
                      />
                      <span>Required</span>
                    </label>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setActionFields((prev) => prev.filter((_, i) => i !== fldIdx));
                      }}
                      className="h-6 w-6 text-slate-400 hover:text-rose-500"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500">
                    Dropdown Options (comma separated)
                  </label>
                  <Input
                    value={(fld.options || []).join(", ")}
                    onChange={(e) => {
                      const opts = e.target.value.split(",").map((o) => o.trim()).filter(Boolean);
                      setActionFields((prev) => {
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
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={onSave}>
            Save Action Button
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

