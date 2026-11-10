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
import type { WorkflowStepNode } from "@/services/experimentalWorkflowService";
import { WORKFLOW_FIELD_CATALOG } from "../constants/workflowFieldCatalog";
import { ShieldCheck, UserCheck, User, Variable } from "lucide-react";

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
  nodeReviewControlRole,
  setNodeReviewControlRole,
  nodeReviewControlUser = "",
  setNodeReviewControlUser,
  nodeReviewControlVariable = "",
  setNodeReviewControlVariable,
  nodeReviewControlText,
  setNodeReviewControlText,
  rolesList: _rolesList = [],
  usersList = [],
  onClose,
  onSave,
}: EditStageModalProps) {
  const [userSearch] = useState("");

  // Extract catalog fields available for selection as target review variables
  const variableOptions = useMemo(() => {
    const defaultVars = [
      { id: "gl_code", label: "Category / GL Code (Chart of Accounts)" },
      { id: "amount", label: "Payment Amount / Total Price" },
      { id: "vendor", label: "Vendor / Beneficiary Name" },
      { id: "invoice_number", label: "Invoice Number / Bill Attachment" },
      { id: "bank_account", label: "Beneficiary Bank Details / Wire Instructions" },
      { id: "quote_pdf", label: "Competitive Quote Proposals (2+ Bids)" },
      { id: "po_match_number", label: "Matched PO / Contract Number" },
      { id: "department", label: "Requesting Department / Budget Cap" },
    ];
    // Merge catalog fields
    const catalogVars = WORKFLOW_FIELD_CATALOG.slice(0, 40).map((f) => ({
      id: f.label.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
      label: f.label,
    }));
    const seen = new Set<string>();
    return [...defaultVars, ...catalogVars].filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }, []);

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

  return (
    <Dialog open={!!editingNode} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg w-full max-h-[88vh] overflow-y-auto">
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
                      if (enabled && !nodeReviewControlRole) {
                        setNodeReviewControlRole("Accounting / Controller");
                        setNodeReviewControlText("Verify GL code & Category are coded properly before approving");
                        if (setNodeReviewControlVariable) setNodeReviewControlVariable("gl_code");
                      }
                    }}
                    className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 h-4 w-4"
                  />
                  <ShieldCheck className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  Enable Internal Control Review
                </label>
                <p className="text-[11px] text-muted-foreground">
                  Places a formal audit checkpoint (what variable is being reviewed, and by which reviewer/person) that must be validated before moving forward.
                </p>
              </div>
            </div>

            {nodeReviewControlEnabled && (
              <div className="space-y-3 p-3 rounded-xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/50 mt-2">
                {/* Quick Presets */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300">
                    Quick Control Presets
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {CONTROL_PRESETS.map((preset, pIdx) => (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => {
                          setNodeReviewControlRole(preset.role);
                          setNodeReviewControlText(preset.text);
                          if (setNodeReviewControlVariable) setNodeReviewControlVariable(preset.variable);
                        }}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-white dark:bg-zinc-900 border border-rose-300 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-950 transition-colors text-rose-900 dark:text-rose-200 font-medium"
                      >
                        {preset.role.split("/")[0].trim()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 1. Variable Being Reviewed */}
                <div className="space-y-1">
                  <label className="font-semibold text-rose-900 dark:text-rose-200 text-[11px] flex items-center gap-1">
                    <Variable className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                    Target Variable Being Reviewed (What is Getting Reviewed)
                  </label>
                  <div className="flex gap-2">
                    <Select
                      value={nodeReviewControlVariable || "gl_code"}
                      onValueChange={(val) => {
                        if (setNodeReviewControlVariable) setNodeReviewControlVariable(val);
                      }}
                    >
                      <SelectTrigger className="h-8 text-xs bg-white dark:bg-zinc-900 flex-1">
                        <SelectValue placeholder="Select variable being reviewed..." />
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
                      value={nodeReviewControlVariable}
                      onChange={(e) => {
                        if (setNodeReviewControlVariable) setNodeReviewControlVariable(e.target.value);
                      }}
                      placeholder="Or custom variable slug..."
                      className="h-8 text-xs w-44 bg-white dark:bg-zinc-900"
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Specifies which field/data point in the workflow is being inspected (e.g. GL code, invoice amount, quote bids).
                  </p>
                </div>

                {/* 2. Reviewed By: Role & Specific Person */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="font-semibold text-rose-900 dark:text-rose-200 text-[11px] flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                      Audited By Role (Who Reviews)
                    </label>
                    <Input
                      value={nodeReviewControlRole}
                      onChange={(e) => setNodeReviewControlRole(e.target.value)}
                      placeholder="e.g. Accounting / Controller / GL Specialist"
                      className="h-8 text-xs bg-white dark:bg-zinc-900"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-rose-900 dark:text-rose-200 text-[11px] flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                      Assigned Person (Optional Specific User)
                    </label>
                    <Select
                      value={nodeReviewControlUser || "any"}
                      onValueChange={(val) => {
                        if (setNodeReviewControlUser) {
                          setNodeReviewControlUser(val === "any" ? "" : val);
                        }
                      }}
                    >
                      <SelectTrigger className="h-8 text-xs bg-white dark:bg-zinc-900">
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

                {/* 3. Verification Requirement Prompt */}
                <div className="space-y-1">
                  <label className="font-semibold text-rose-900 dark:text-rose-200 text-[11px]">
                    Verification Requirement / Audit Instructions
                  </label>
                  <Textarea
                    value={nodeReviewControlText}
                    onChange={(e) => setNodeReviewControlText(e.target.value)}
                    rows={2}
                    placeholder="e.g. Verify GL code & Category are coded properly before approving"
                    className="text-xs bg-white dark:bg-zinc-900"
                  />
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
