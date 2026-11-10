import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import type { WorkflowStepNode, ReviewCheckItem } from "@/services/experimentalWorkflowService";
import { WORKFLOW_FIELD_CATALOG } from "../constants/workflowFieldCatalog";
import { ShieldCheck, UserCheck, User, Variable, Plus, Trash2, CheckCircle2 } from "lucide-react";

interface EditStageModalProps {
  editingNode: { node: WorkflowStepNode; index: number } | null;
  nodeTitle: string;
  setNodeTitle: (val: string) => void;
  nodeDesc: string;
  setNodeDesc: (val: string) => void;
  nodeAssignedRole: string;
  setNodeAssignedRole: (val: string) => void;
  nodeBadge: string;
  setNodeBadge: (val: string) => void;
  nodeReviewControlEnabled: boolean;
  setNodeReviewControlEnabled: (val: boolean) => void;
  nodeReviewControlRole: string;
  setNodeReviewControlRole: (val: string) => void;
  nodeReviewControlUser?: string;
  setNodeReviewControlUser?: (val: string) => void;
  nodeReviewControlVariable?: string;
  setNodeReviewControlVariable?: (val: string) => void;
  nodeReviewControlText: string;
  setNodeReviewControlText: (val: string) => void;
  nodeReviewControlItems?: ReviewCheckItem[];
  setNodeReviewControlItems?: React.Dispatch<React.SetStateAction<ReviewCheckItem[]>>;
  nodes?: WorkflowStepNode[];
  rolesList?: any[];
  usersList?: any[];
  onClose: () => void;
  onSave: () => void;
}

export function EditStageModal({
  editingNode,
  nodeTitle,
  setNodeTitle,
  nodeDesc,
  setNodeDesc,
  nodeAssignedRole,
  setNodeAssignedRole,
  nodeBadge,
  setNodeBadge,
  nodeReviewControlEnabled,
  setNodeReviewControlEnabled,
  nodeReviewControlRole: _nodeReviewControlRole = "",
  setNodeReviewControlRole: _setNodeReviewControlRole,
  nodeReviewControlUser: _nodeReviewControlUser = "",
  setNodeReviewControlUser: _setNodeReviewControlUser,
  nodeReviewControlVariable: _nodeReviewControlVariable = "",
  setNodeReviewControlVariable: _setNodeReviewControlVariable,
  nodeReviewControlText: _nodeReviewControlText = "",
  setNodeReviewControlText: _setNodeReviewControlText,
  nodeReviewControlItems = [],
  setNodeReviewControlItems,
  nodes = [],
  rolesList: _rolesList = [],
  usersList = [],
  onClose,
  onSave,
}: EditStageModalProps) {
  const [userSearch] = useState("");

  // Extract variables dynamically from current workflow flow (all fields defined across all stages/actions)
  const variableOptions = useMemo(() => {
    const list: { id: string; label: string; stageTitle?: string }[] = [];
    const seen = new Set<string>();

    const addVar = (id: string, label: string, stageTitle?: string) => {
      const cleanId = id.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_");
      if (!cleanId || seen.has(cleanId)) return;
      seen.add(cleanId);
      list.push({ id: cleanId, label, stageTitle });
    };

    // 1. First priority: fields actually present in this active workflow!
    if (nodes && nodes.length > 0) {
      nodes.forEach((n) => {
        n.actions?.forEach((act) => {
          act.fields?.forEach((f) => {
            const fieldId = f.id || f.label.toLowerCase().replace(/[^a-z0-9]+/g, "_");
            addVar(fieldId, `${f.label} [${n.title}]`, n.title);
          });
        });
      });
    }

    // 2. Add common domain-specific workflow variables (unit_price, shipping, tax, etc.)
    const commonVars = [
      { id: "unit_price", label: "Unit Price ($)" },
      { id: "shipping", label: "Shipping & Freight Fee ($)" },
      { id: "gl_code", label: "Category / GL Code (Chart of Accounts)" },
      { id: "amount", label: "Payment Amount / Total Price" },
      { id: "tax_amount", label: "Sales Tax / Duty" },
      { id: "quantity", label: "Item Quantity / Units" },
      { id: "vendor", label: "Vendor / Beneficiary Name" },
      { id: "invoice_number", label: "Invoice Number / Bill Attachment" },
      { id: "bank_account", label: "Beneficiary Bank Details / Wire Instructions" },
      { id: "quote_pdf", label: "Competitive Quote Proposals (2+ Bids)" },
      { id: "po_match_number", label: "Matched PO / Contract Number" },
      { id: "department", label: "Requesting Department / Budget Cap" },
    ];
    commonVars.forEach((v) => addVar(v.id, v.label));

    // 3. Fallback catalog fields
    WORKFLOW_FIELD_CATALOG.slice(0, 30).forEach((f) => {
      const cid = f.label.toLowerCase().replace(/[^a-z0-9]+/g, "_");
      addVar(cid, f.label);
    });

    return list;
  }, [nodes]);

  // Filtered users for specific reviewer selection
  const filteredUsers = useMemo(() => {
    if (!userSearch.trim()) return usersList.slice(0, 30);
    const q = userSearch.toLowerCase();
    return usersList.filter(
      (u: any) =>
        (u.full_name && u.full_name.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q))
    ).slice(0, 30);
  }, [usersList, userSearch]);

  if (!editingNode) {
    return null;
  }

  // Common pre-configured internal audit presets
  const CONTROL_PRESETS = [
    {
      role: "Procurement / Sourcing",
      variable: "unit_price",
      text: "Verify line item unit price aligns with vendor quotation and master agreement caps",
    },
    {
      role: "Logistics / Receiving",
      variable: "shipping",
      text: "Verify freight/shipping terms, carrier rate quote, and dock receiving instructions",
    },
    {
      role: "Accounting / Controller",
      variable: "gl_code",
      text: "Verify GL code & Category are coded properly before approving",
    },
    {
      role: "Finance / AP Specialist",
      variable: "bank_account",
      text: "Verify vendor W-9 and banking details before disbursement",
    },
    {
      role: "Procurement / Legal",
      variable: "quote_pdf",
      text: "Verify at least 2 competitive bids received or sole-source justification attached",
    },
    {
      role: "Executive / CFO Office",
      variable: "amount",
      text: "High-value spend audit ($10,000+ incl. tax budget validation)",
    },
  ];

  const handleAddReviewCheckItem = (preset?: { role: string; variable: string; text: string }) => {
    if (!setNodeReviewControlItems) return;
    const defaultVar = preset?.variable || (variableOptions[0]?.id || "unit_price");
    const foundVar = variableOptions.find((v) => v.id === defaultVar);
    const newItem: ReviewCheckItem = {
      id: `chk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      variable: defaultVar,
      label: foundVar ? foundVar.label : defaultVar,
      reviewerRole: preset?.role || "Accounting / Controller",
      reviewerUser: "",
      instructions: preset?.text || "Verify line item specification before approving",
    };
    setNodeReviewControlItems([...nodeReviewControlItems, newItem]);
  };

  const handleUpdateCheckItem = (index: number, updates: Partial<ReviewCheckItem>) => {
    if (!setNodeReviewControlItems) return;
    const next = [...nodeReviewControlItems];
    next[index] = { ...next[index], ...updates };
    setNodeReviewControlItems(next);
  };

  const handleRemoveCheckItem = (index: number) => {
    if (!setNodeReviewControlItems) return;
    const next = nodeReviewControlItems.filter((_, i) => i !== index);
    setNodeReviewControlItems(next);
  };

  return (
    <Dialog open={!!editingNode} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">Edit Stage Details &amp; Controls</DialogTitle>
          <DialogDescription className="text-xs">
            Configure stage name, description, responsible owner/reviewer, target review variables, and internal control audit checks.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3.5 py-2 text-xs">
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
              rows={2}
              placeholder="Explain what occurs during this stage..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-indigo-500" />
                Stage Reviewer / Role
              </label>
              <Input
                value={nodeAssignedRole}
                onChange={(e) => setNodeAssignedRole(e.target.value)}
                placeholder="e.g. Procurement Specialist, Department Manager"
                className="h-8 text-xs"
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

          {/* Internal Review / Control Gate Setting */}
          <div className="pt-3 border-t border-slate-200 dark:border-zinc-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <label className="font-semibold text-rose-950 dark:text-rose-200 flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={nodeReviewControlEnabled}
                    onChange={(e) => {
                      const enabled = e.target.checked;
                      setNodeReviewControlEnabled(enabled);
                      if (enabled && nodeReviewControlItems.length === 0 && setNodeReviewControlItems) {
                        setNodeReviewControlItems([
                          {
                            id: `chk_${Date.now()}_1`,
                            variable: "unit_price",
                            label: "Unit Price",
                            reviewerRole: "Procurement / Sourcing",
                            reviewerUser: "",
                            instructions: "Verify line item unit price aligns with vendor quotation",
                          },
                          {
                            id: `chk_${Date.now()}_2`,
                            variable: "shipping",
                            label: "Shipping & Freight Fee",
                            reviewerRole: "Logistics / Receiving",
                            reviewerUser: "",
                            instructions: "Verify shipping terms and freight charges are authorized",
                          },
                        ]);
                      }
                    }}
                    className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 h-4 w-4"
                  />
                  <ShieldCheck className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  Enable Internal Control Review
                </label>
                <p className="text-[11px] text-muted-foreground">
                  Places formal audit checkpoints (which variables must be reviewed, and specifically by which reviewer role / individual person) before advancing.
                </p>
              </div>
            </div>

            {nodeReviewControlEnabled && (
              <div className="space-y-3.5 p-3.5 rounded-xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/50 mt-2">
                {/* Header & Quick Add Presets */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300">
                      Add Common Control Preset
                    </label>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {CONTROL_PRESETS.map((preset, pIdx) => (
                        <button
                          key={pIdx}
                          type="button"
                          onClick={() => handleAddReviewCheckItem(preset)}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-white dark:bg-zinc-900 border border-rose-300 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-950 transition-colors text-rose-900 dark:text-rose-200 font-medium flex items-center gap-1"
                        >
                          <Plus className="w-2.5 h-2.5" />
                          {preset.variable}: {preset.role.split("/")[0].trim()}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleAddReviewCheckItem()}
                    className="h-7 text-xs border-rose-300 text-rose-700 hover:bg-rose-100 dark:border-rose-800 dark:text-rose-300 shrink-0 self-start sm:self-auto"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Add Variable Check
                  </Button>
                </div>

                {/* Multiple Review Check Items List */}
                <div className="space-y-3">
                  {nodeReviewControlItems.length === 0 ? (
                    <div className="text-center p-3 rounded-lg border border-dashed border-rose-300 dark:border-rose-800 bg-white/50 dark:bg-zinc-900/50">
                      <p className="text-xs text-rose-800 dark:text-rose-300 font-medium">
                        No variable review checks configured yet.
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => handleAddReviewCheckItem()}
                        className="text-xs text-rose-700 dark:text-rose-300 hover:bg-rose-100 mt-1 h-7"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Click here to add your first check (e.g. Unit Price or Shipping)
                      </Button>
                    </div>
                  ) : (
                    nodeReviewControlItems.map((chk, cIdx) => (
                      <div
                        key={chk.id || cIdx}
                        className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-rose-200 dark:border-rose-800/80 shadow-sm space-y-2 relative"
                      >
                        {/* Check Item Header */}
                        <div className="flex items-center justify-between gap-2 border-b border-rose-100 dark:border-rose-950 pb-1.5">
                          <span className="text-[11px] font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                            Review Check #{cIdx + 1}
                            {chk.variable && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-mono">
                                {chk.variable}
                              </span>
                            )}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveCheckItem(cIdx)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                            title="Remove this variable review check"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Row 1: Target Variable Dropdown & Custom Input */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-rose-900 dark:text-rose-200 flex items-center gap-1">
                            <Variable className="w-3 h-3 text-rose-600" />
                            Target Flow Variable (What is Reviewed)
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <Select
                              value={chk.variable || ""}
                              onValueChange={(val) => {
                                const found = variableOptions.find((v) => v.id === val);
                                handleUpdateCheckItem(cIdx, {
                                  variable: val,
                                  label: found?.label || val,
                                });
                              }}
                            >
                              <SelectTrigger className="h-8 text-xs bg-slate-50 dark:bg-zinc-800 w-full truncate">
                                <SelectValue placeholder="Select variable from flow..." />
                              </SelectTrigger>
                              <SelectContent className="max-h-56">
                                {variableOptions.map((v) => (
                                  <SelectItem key={v.id} value={v.id}>
                                    {v.label} ({v.id})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            <Input
                              value={chk.variable}
                              onChange={(e) =>
                                handleUpdateCheckItem(cIdx, { variable: e.target.value })
                              }
                              placeholder="Or custom variable key (e.g. unit_price)..."
                              className="h-8 text-xs bg-slate-50 dark:bg-zinc-800"
                            />
                          </div>
                        </div>

                        {/* Row 2: Reviewed By (Role) & Specific Person */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-[10px] font-semibold text-rose-900 dark:text-rose-200 flex items-center gap-1">
                              <UserCheck className="w-3 h-3 text-rose-600" />
                              Reviewer Role
                            </label>
                            <Input
                              value={chk.reviewerRole || ""}
                              onChange={(e) =>
                                handleUpdateCheckItem(cIdx, { reviewerRole: e.target.value })
                              }
                              placeholder="e.g. Procurement / Sourcing Specialist"
                              className="h-8 text-xs bg-slate-50 dark:bg-zinc-800"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-semibold text-rose-900 dark:text-rose-200 flex items-center gap-1">
                              <User className="w-3 h-3 text-rose-600" />
                              Specific Person (Optional)
                            </label>
                            <Select
                              value={chk.reviewerUser || "any"}
                              onValueChange={(val) =>
                                handleUpdateCheckItem(cIdx, {
                                  reviewerUser: val === "any" ? "" : val,
                                })
                              }
                            >
                              <SelectTrigger className="h-8 text-xs bg-slate-50 dark:bg-zinc-800">
                                <SelectValue placeholder="Anyone with reviewer role" />
                              </SelectTrigger>
                              <SelectContent className="max-h-56">
                                <SelectItem value="any">Anyone with Reviewer Role</SelectItem>
                                {filteredUsers.map((u: any) => {
                                  const fullName = u.full_name || u.email || "User";
                                  return (
                                    <SelectItem key={u.id || fullName} value={fullName}>
                                      {fullName} {u.department ? `(${u.department})` : ""}
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Row 3: Audit Instructions */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-rose-900 dark:text-rose-200">
                            Audit Instructions / Verification Requirement
                          </label>
                          <Input
                            value={chk.instructions || ""}
                            onChange={(e) =>
                              handleUpdateCheckItem(cIdx, { instructions: e.target.value })
                            }
                            placeholder="e.g. Verify unit price does not exceed $250.00/unit"
                            className="h-8 text-xs bg-slate-50 dark:bg-zinc-800"
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={onSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
