import React, { useState } from "react";
import {
  Plus,
  Trash2,
  Library,
  ChevronDown,
  Type,
  ListFilter,
  Hash,
  Calendar,
  AlignLeft,
  Paperclip,
  CheckSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  WorkflowStepNode,
  WorkflowActionButton,
  WorkflowActionField,
} from "@/services/experimentalWorkflowService";
import {
  WORKFLOW_FIELD_CATALOG,
  type CatalogWorkflowField,
} from "../constants/workflowFieldCatalog";

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
  const [selectedCatalogField, setSelectedCatalogField] = useState<string>("");

  if (!editingAction) {
    return null;
  }

  // Group catalog fields by category
  const catalogByCategory = WORKFLOW_FIELD_CATALOG.reduce<Record<string, CatalogWorkflowField[]>>(
    (acc, field) => {
      const cat = field.category || "Other Fields";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(field);
      return acc;
    },
    {}
  );

  const handleAddFromCatalog = (fieldLabel: string) => {
    if (!fieldLabel) return;
    const matched = WORKFLOW_FIELD_CATALOG.find((f) => f.label === fieldLabel);
    if (!matched) return;

    setActionFields((prev) => [
      ...prev,
      {
        id: `fld_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        label: matched.label,
        type: matched.type,
        placeholder: matched.placeholder || "",
        options: matched.options ? [...matched.options] : [],
        required: Boolean(matched.required),
        value: matched.type === "dropdown" && matched.options?.length ? matched.options[0] : "",
      },
    ]);
    setSelectedCatalogField("");
  };

  const handleAddNewField = (fieldType: WorkflowActionField["type"]) => {
    const timestamp = Date.now();
    let newField: WorkflowActionField;

    switch (fieldType) {
      case "dropdown":
        newField = {
          id: `fld_${timestamp}`,
          label: "New Dropdown",
          type: "dropdown",
          options: ["Option A", "Option B", "Option C"],
          value: "Option A",
        };
        break;
      case "number":
        newField = {
          id: `fld_${timestamp}`,
          label: "New Number Field",
          type: "number",
          placeholder: "0.00",
        };
        break;
      case "date":
        newField = {
          id: `fld_${timestamp}`,
          label: "New Date Field",
          type: "date",
        };
        break;
      case "textarea":
        newField = {
          id: `fld_${timestamp}`,
          label: "New Text Area",
          type: "textarea",
          placeholder: "Enter details or notes...",
        };
        break;
      case "file":
        newField = {
          id: `fld_${timestamp}`,
          label: "New File Attachment",
          type: "file",
          placeholder: "Upload document...",
        };
        break;
      case "checkbox":
        newField = {
          id: `fld_${timestamp}`,
          label: "New Checkbox / Flag",
          type: "checkbox",
          value: false,
        };
        break;
      case "text":
      default:
        newField = {
          id: `fld_${timestamp}`,
          label: "New Text Field",
          type: "text",
          placeholder: "Enter details...",
        };
        break;
    }

    setActionFields((prev) => [...prev, newField]);
  };

  return (
    <Dialog open={!!editingAction} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl w-full max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">Configure Action Button &amp; Form Fields</DialogTitle>
          <DialogDescription className="text-xs">
            Customize action trigger, behavior, button styling, and all input fields or dropdowns.
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
          <div className="pt-3 border-t border-slate-200 dark:border-zinc-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800 dark:text-zinc-200">
                Action Form Fields ({actionFields.length})
              </span>
              <div className="flex items-center gap-1.5">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-6 text-[10px] gap-1 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                    >
                      <Plus className="w-3 h-3" />
                      Add Field
                      <ChevronDown className="w-2.5 h-2.5 opacity-60 ml-0.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 text-xs">
                    <DropdownMenuLabel className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500">
                      Select Field Type
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleAddNewField("text")}
                      className="gap-2 cursor-pointer text-xs"
                    >
                      <Type className="w-3.5 h-3.5 text-blue-500" />
                      <span>Text Field</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleAddNewField("dropdown")}
                      className="gap-2 cursor-pointer text-xs"
                    >
                      <ListFilter className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Dropdown Select</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleAddNewField("number")}
                      className="gap-2 cursor-pointer text-xs"
                    >
                      <Hash className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Number / Amount</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleAddNewField("date")}
                      className="gap-2 cursor-pointer text-xs"
                    >
                      <Calendar className="w-3.5 h-3.5 text-amber-500" />
                      <span>Date Picker</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleAddNewField("textarea")}
                      className="gap-2 cursor-pointer text-xs"
                    >
                      <AlignLeft className="w-3.5 h-3.5 text-purple-500" />
                      <span>Text Area (Multi-line)</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleAddNewField("file")}
                      className="gap-2 cursor-pointer text-xs"
                    >
                      <Paperclip className="w-3.5 h-3.5 text-pink-500" />
                      <span>File / Attachment</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleAddNewField("checkbox")}
                      className="gap-2 cursor-pointer text-xs"
                    >
                      <CheckSquare className="w-3.5 h-3.5 text-teal-500" />
                      <span>Checkbox / Flag</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleAddNewField("dropdown")}
                  className="h-6 text-[10px] gap-1"
                >
                  <Plus className="w-3 h-3" />
                  + Dropdown
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleAddNewField("text")}
                  className="h-6 text-[10px] gap-1"
                >
                  <Plus className="w-3 h-3" />
                  + Text
                </Button>
              </div>
            </div>

            {/* Catalog Preset Selector */}
            <div className="p-2 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/70 dark:border-indigo-800/40 flex items-center gap-2">
              <Library className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <div className="flex-1">
                <Select
                  value={selectedCatalogField}
                  onValueChange={(val) => {
                    setSelectedCatalogField(val);
                    handleAddFromCatalog(val);
                  }}
                >
                  <SelectTrigger className="h-7 text-xs bg-white dark:bg-zinc-900 border-indigo-200 dark:border-indigo-800">
                    <SelectValue placeholder="Add from existing workflow fields (73 available)..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {Object.entries(catalogByCategory).map(([category, fields]) => (
                      <SelectGroup key={category}>
                        <SelectLabel className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                          {category} ({fields.length})
                        </SelectLabel>
                        {fields.map((f) => (
                          <SelectItem key={`${category}-${f.label}`} value={f.label} className="text-xs">
                            <span className="font-medium">{f.label}</span>
                            <span className="ml-2 text-[10px] text-slate-400">({f.type})</span>
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* List of existing fields */}
            {actionFields.map((fld, fldIdx) => (
              <div
                key={fld.id}
                className="p-2.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/40 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
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
                    className="h-7 text-xs font-semibold flex-1"
                  />
                  
                  {/* Field Type Selector */}
                  <Select
                    value={fld.type || "text"}
                    onValueChange={(newType: any) => {
                      setActionFields((prev) => {
                        const next = [...prev];
                        next[fldIdx].type = newType;
                        if (newType === "dropdown" && (!next[fldIdx].options || next[fldIdx].options.length === 0)) {
                          next[fldIdx].options = ["Option A", "Option B"];
                        }
                        return next;
                      });
                    }}
                  >
                    <SelectTrigger className="h-7 text-[11px] w-28 bg-white dark:bg-zinc-900">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="dropdown">Dropdown</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="textarea">Textarea</SelectItem>
                      <SelectItem value="file">File Upload</SelectItem>
                      <SelectItem value="checkbox">Checkbox</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <label className="flex items-center gap-1 text-[11px] text-slate-600 dark:text-zinc-300 font-medium cursor-pointer">
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
                      <span>Req</span>
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

                {fld.type === "dropdown" ? (
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
                      className="h-7 text-xs bg-white dark:bg-zinc-900"
                    />
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500">Placeholder / Hint Text</label>
                    <Input
                      value={fld.placeholder || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setActionFields((prev) => {
                          const next = [...prev];
                          next[fldIdx].placeholder = val;
                          return next;
                        });
                      }}
                      placeholder="Enter placeholder text..."
                      className="h-7 text-xs bg-white dark:bg-zinc-900"
                    />
                  </div>
                )}
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
