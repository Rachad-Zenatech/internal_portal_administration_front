import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Banknote,
  ShoppingCart,
  Layers,
  Repeat,
  RotateCw,
  Clock,
  ArrowRight,
  CheckCircle2,
  Timer,
  XCircle,
  FileText,
  Activity,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { arService } from "../../services/arService";
import type {
  ARWorkflowState,
  ARWorkflowType,
} from "../../types/ar";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "../../components/ui/sheet";

interface WorkflowDetailDrawerProps {
  workflowId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STEP_SEQUENCE: ARWorkflowState[] = [
  "DRAFT",
  "PENDING_REVIEW",
  "INVOICE_SENT",
  "AWAITING_PAYMENT",
  "RECONCILED",
  "COMPLETED",
];

const STATE_COLORS: Record<ARWorkflowState, { label: string; bg: string; text: string; border: string }> = {
  DRAFT: {
    label: "Draft",
    bg: "bg-slate-500/10",
    text: "text-slate-600 dark:text-slate-400",
    border: "border-slate-500/20",
  },
  PENDING_REVIEW: {
    label: "Pending Review",
    bg: "bg-amber-500/10",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-500/20",
  },
  CLERK_REVIEW: {
    label: "Clerk Review",
    bg: "bg-amber-500/15",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-500/30",
  },
  INVOICE_SENT: {
    label: "Invoice Sent",
    bg: "bg-blue-500/10",
    text: "text-blue-600 dark:text-blue-400",
    border: "border-blue-500/20",
  },
  AWAITING_PAYMENT: {
    label: "Awaiting Payment",
    bg: "bg-purple-500/10",
    text: "text-purple-600 dark:text-purple-400",
    border: "border-purple-500/20",
  },
  DUNNING_REMINDER: {
    label: "Dunning / Overdue",
    bg: "bg-rose-500/10",
    text: "text-rose-600 dark:text-rose-400",
    border: "border-rose-500/20",
  },
  RECONCILED: {
    label: "Reconciled",
    bg: "bg-emerald-500/10",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-500/20",
  },
  COMPLETED: {
    label: "Completed & Provisioned",
    bg: "bg-emerald-500/15",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-500/30",
  },
  CANCELLED: {
    label: "Cancelled",
    bg: "bg-zinc-500/10",
    text: "text-zinc-500 dark:text-zinc-400",
    border: "border-zinc-500/20",
  },
};

const TYPE_CONFIGS: Record<
  ARWorkflowType,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  CASH: { label: "Cash Reconciliation", icon: Banknote, color: "text-emerald-500" },
  INITIAL_SALE: { label: "Initial Sale", icon: ShoppingCart, color: "text-blue-500" },
  ADD_ON: { label: "Add-On / Upgrade", icon: Layers, color: "text-indigo-500" },
  MONTHLY_SUBSCRIPTION: { label: "Monthly Subscription", icon: Repeat, color: "text-violet-500" },
  RENEWAL: { label: "Contract Renewal", icon: RotateCw, color: "text-amber-500" },
};

export default function WorkflowDetailDrawer({
  workflowId,
  open,
  onOpenChange,
}: WorkflowDetailDrawerProps) {
  const queryClient = useQueryClient();
  const [transitionNote, setTransitionNote] = useState("");
  const [cancellationReason, setCancellationReason] = useState("");
  const [showCancelPrompt, setShowCancelPrompt] = useState(false);
  const [showDeletePrompt, setShowDeletePrompt] = useState(false);
  const [activeTab, setActiveTab] = useState<"timeline" | "metadata" | "actions">("timeline");

  const deleteMutation = useMutation({
    mutationFn: () => arService.deleteWorkflow(workflowId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ar-workflows"] });
      queryClient.invalidateQueries({ queryKey: ["ar-metrics"] });
      setShowDeletePrompt(false);
      onOpenChange(false);
    },
  });

  const {
    data: workflow,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["ar-workflow", workflowId],
    queryFn: () => arService.getWorkflowById(workflowId!),
    enabled: Boolean(workflowId && open),
    refetchInterval: 15000,
  });

  const transitionMutation = useMutation({
    mutationFn: ({
      targetState,
      note,
      payload,
    }: {
      targetState: ARWorkflowState;
      note?: string;
      payload?: Record<string, any>;
    }) =>
      arService.transitionWorkflow(workflowId!, {
        target_state: targetState,
        trigger_type: "MANUAL",
        note,
        payload,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ar-workflow", workflowId] });
      queryClient.invalidateQueries({ queryKey: ["ar-workflows"] });
      queryClient.invalidateQueries({ queryKey: ["ar-metrics"] });
      setTransitionNote("");
      setShowCancelPrompt(false);
      refetch();
    },
  });

  const timerMutation = useMutation({
    mutationFn: (timerType: string) =>
      arService.triggerWorkflowTimer(workflowId!, timerType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ar-workflow", workflowId] });
      queryClient.invalidateQueries({ queryKey: ["ar-workflows"] });
      queryClient.invalidateQueries({ queryKey: ["ar-metrics"] });
      refetch();
    },
  });

  if (!open) return null;

  const currentType = workflow?.workflow_type || "INITIAL_SALE";
  const currentState = workflow?.state || "DRAFT";
  const typeConfig = TYPE_CONFIGS[currentType];
  const TypeIcon = typeConfig.icon;

  // Allowed transitions determination
  const getAllowedTargetStates = (type: ARWorkflowType, state: ARWorkflowState): ARWorkflowState[] => {
    if (state === "COMPLETED" || state === "CANCELLED") return [];
    if (type === "CASH") {
      if (state === "DRAFT") return ["PENDING_REVIEW", "RECONCILED", "CANCELLED"];
      if (state === "PENDING_REVIEW") return ["RECONCILED", "COMPLETED", "CANCELLED"];
      if (state === "RECONCILED") return ["COMPLETED", "CANCELLED"];
    }
    if (state === "DRAFT") return ["PENDING_REVIEW", "INVOICE_SENT", "CANCELLED"];
    if (state === "PENDING_REVIEW") return ["INVOICE_SENT", "CANCELLED"];
    if (state === "INVOICE_SENT") return ["AWAITING_PAYMENT", "DUNNING_REMINDER", "RECONCILED", "COMPLETED", "CANCELLED"];
    if (state === "AWAITING_PAYMENT") return ["DUNNING_REMINDER", "RECONCILED", "COMPLETED", "CANCELLED"];
    if (state === "DUNNING_REMINDER") return ["AWAITING_PAYMENT", "RECONCILED", "COMPLETED", "CANCELLED"];
    if (state === "RECONCILED") return ["COMPLETED", "CANCELLED"];
    return ["CANCELLED"];
  };

  const allowedStates = workflow ? getAllowedTargetStates(currentType, currentState) : [];

  const getStepIndex = (state: ARWorkflowState) => {
    if (state === "DUNNING_REMINDER") return 3; // within awaiting payment
    return STEP_SEQUENCE.indexOf(state);
  };

  const currentStepIdx = getStepIndex(currentState);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl p-0 flex flex-col bg-background border-l border-border shadow-2xl">
        {/* Drawer Header */}
        <SheetHeader className="p-6 border-b border-border bg-muted/20">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl bg-primary/10 ${typeConfig.color}`}>
                <TypeIcon className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <SheetTitle className="text-base font-bold text-foreground font-mono">
                    {workflow?.reference_id || "Workflow Detail"}
                  </SheetTitle>
                  {workflow && (
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        STATE_COLORS[workflow.state].bg
                      } ${STATE_COLORS[workflow.state].text} ${
                        STATE_COLORS[workflow.state].border
                      }`}
                    >
                      {STATE_COLORS[workflow.state].label}
                    </span>
                  )}
                </div>
                <SheetDescription className="text-xs text-muted-foreground mt-0.5">
                  {typeConfig.label} • Customer:{" "}
                  <strong className="text-foreground">
                    {workflow?.customer_name || workflow?.customer_id}
                  </strong>
                </SheetDescription>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-muted-foreground block">Amount</span>
              <span className="text-lg font-bold font-mono text-foreground">
                ${workflow?.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}{" "}
                <span className="text-xs font-medium text-muted-foreground">
                  {workflow?.currency}
                </span>
              </span>
            </div>
          </div>

          {/* Visual Step Progression Stepper */}
          <div className="mt-6 pt-4 border-t border-border/60">
            <div className="flex items-center justify-between relative">
              {/* Stepper connecting line */}
              <div className="absolute top-3 left-3 right-3 h-0.5 bg-muted z-0" />
              <div
                className="absolute top-3 left-3 h-0.5 bg-primary transition-all duration-300 z-0"
                style={{
                  width: `${
                    currentStepIdx < 0
                      ? 0
                      : Math.min(100, (currentStepIdx / (STEP_SEQUENCE.length - 1)) * 100)
                  }%`,
                }}
              />

              {STEP_SEQUENCE.map((st, idx) => {
                const isPassed = currentStepIdx > idx;
                const isCurrent = currentStepIdx === idx;
                return (
                  <div
                    key={st}
                    className="flex flex-col items-center relative z-10 group"
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                        isPassed
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : isCurrent
                          ? "bg-primary text-primary-foreground ring-4 ring-primary/20 shadow-xs"
                          : "bg-muted text-muted-foreground border border-border"
                      }`}
                    >
                      {isPassed ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
                    </div>
                    <span
                      className={`text-[9px] font-medium mt-1.5 transition-colors text-center ${
                        isCurrent
                          ? "text-primary font-bold"
                          : isPassed
                          ? "text-foreground"
                          : "text-muted-foreground"
                      }`}
                    >
                      {STATE_COLORS[st].label.split(" ")[0]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 mt-5 border-b border-border -mb-6 pb-0 text-xs">
            <button
              onClick={() => setActiveTab("timeline")}
              className={`pb-2.5 font-medium border-b-2 transition-colors ${
                activeTab === "timeline"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Audit History ({workflow?.logs?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab("metadata")}
              className={`pb-2.5 font-medium border-b-2 transition-colors ${
                activeTab === "metadata"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Payload & Metadata
            </button>
            <button
              onClick={() => setActiveTab("actions")}
              className={`pb-2.5 font-medium border-b-2 transition-colors ${
                activeTab === "actions"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Transition & Actions
            </button>
          </div>
        </SheetHeader>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground text-xs">
              <Clock className="w-4 h-4 animate-spin mr-2" />
              Loading workflow details...
            </div>
          ) : (
            <>
              {activeTab === "timeline" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                      <Activity className="w-4 h-4 text-primary" />
                      Chronological FSM Event Log
                    </h4>
                    <span className="text-[11px] text-muted-foreground">
                      Auto-recorded audit trail
                    </span>
                  </div>

                  <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                    {workflow?.logs && workflow.logs.length > 0 ? (
                      workflow.logs.map((log, idx) => (
                        <div key={log.id || idx} className="relative group">
                          {/* Timeline dot */}
                          <div className="absolute -left-[19px] top-1 w-3 h-3 rounded-full bg-background border-2 border-primary group-hover:scale-125 transition-transform" />

                          <div className="p-3 rounded-xl bg-card border border-border/70 hover:border-border transition-all shadow-2xs space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 flex-wrap">
                                {log.from_state ? (
                                  <div className="flex items-center gap-1.5 text-xs font-mono">
                                    <span className="text-muted-foreground">
                                      {log.from_state}
                                    </span>
                                    <ArrowRight className="w-3 h-3 text-muted-foreground" />
                                    <span className="font-bold text-foreground">
                                      {log.to_state}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-xs font-bold text-primary font-mono">
                                    INITIAL CREATION ({log.to_state})
                                  </span>
                                )}

                                <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                  {log.trigger_type}
                                </span>
                              </div>

                              <span className="text-[10px] text-muted-foreground font-mono">
                                {new Date(log.created_at).toLocaleString()}
                              </span>
                            </div>

                            {log.note && (
                              <p className="text-xs text-foreground bg-muted/30 p-2 rounded-md border border-border/40">
                                {log.note}
                              </p>
                            )}

                            <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1">
                              <span>
                                Actor:{" "}
                                <strong className="text-foreground">
                                  {log.actor_name || log.actor_id || "System"}
                                </strong>
                              </span>
                              {log.payload && Object.keys(log.payload).length > 0 && (
                                <span className="font-mono text-[9px] text-muted-foreground">
                                  Payload: {JSON.stringify(log.payload)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        No state transition logs available.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "metadata" && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-card border border-border space-y-3">
                    <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-primary" />
                      Domain Specific Workflow Attributes
                    </h4>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-muted-foreground block text-[11px]">
                          Customer Reference
                        </span>
                        <span className="font-semibold text-foreground font-mono">
                          {workflow?.customer_id}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[11px]">
                          Customer Name
                        </span>
                        <span className="font-semibold text-foreground">
                          {workflow?.customer_name || "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[11px]">
                          Workflow ID
                        </span>
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {workflow?.id}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[11px]">
                          Created Date
                        </span>
                        <span className="text-muted-foreground text-[11px]">
                          {workflow?.created_at &&
                            new Date(workflow.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Initial Sale attributes */}
                    {workflow?.workflow_type === "INITIAL_SALE" && (
                      <div className="pt-3 border-t border-border grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-muted-foreground block text-[11px]">Sales Originator</span>
                          <span className="font-semibold text-foreground">{workflow.metadata?.sales_rep || "Steve (Sales)"}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-[11px]">Quote / Reference #</span>
                          <span className="font-mono font-semibold text-foreground">{workflow.metadata?.quote_number || workflow.reference_id}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-[11px]">PO Gateway</span>
                          <span className="font-semibold text-foreground">
                            {workflow.metadata?.po_required ? `PO Required (#${workflow.metadata?.po_number || "Pending"})` : "Direct Invoicing (No PO)"}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-[11px]">Payment Terms</span>
                          <span className="font-semibold text-foreground">{workflow.metadata?.payment_terms || "Net 30"}</span>
                        </div>
                      </div>
                    )}

                    {/* Add-On attributes */}
                    {workflow?.workflow_type === "ADD_ON" && (
                      <div className="pt-3 border-t border-border grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-muted-foreground block text-[11px]">Sales Originator</span>
                          <span className="font-semibold text-foreground">{workflow.metadata?.sales_rep || "Steve (Sales)"}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-[11px]">Parent Contract ID</span>
                          <span className="font-mono font-semibold text-foreground">{workflow.metadata?.parent_contract_id || "CTR-PARENT"}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-[11px]">Contract Renewal Date</span>
                          <span className="font-mono font-semibold text-foreground">{workflow.metadata?.renewal_date || "—"}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-[11px]">Prorated Amount</span>
                          <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                            ${Number(workflow.metadata?.pro_rated_amount || workflow.amount || 0).toFixed(2)}
                          </span>
                        </div>
                        <div className="col-span-2 p-2 bg-indigo-50/50 dark:bg-indigo-950/30 rounded border border-indigo-200/60 dark:border-indigo-900/40 text-[11px] text-indigo-900 dark:text-indigo-200">
                          * Add-ons are prorated to align with the existing renewal date; totals consolidate at the next renewal.
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Line items if present */}
                  {workflow?.metadata?.line_items && (
                    <div className="p-4 rounded-xl bg-card border border-border space-y-3">
                      <h4 className="text-xs font-bold text-foreground">
                        Itemized Sales Lines
                      </h4>
                      <div className="divide-y divide-border/60 text-xs">
                        {workflow.metadata.line_items.map((item: any, i: number) => (
                          <div key={i} className="py-2 flex items-center justify-between">
                            <div>
                              <span className="font-medium text-foreground block">
                                {item.description}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                Qty: {item.quantity} × ${item.unit_price}
                              </span>
                            </div>
                            <span className="font-mono font-bold text-foreground">
                              ${item.amount}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Raw Metadata JSON */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase">
                      Raw JSON Metadata Payload
                    </span>
                    <pre className="p-3 rounded-lg bg-muted/60 border border-border text-[11px] font-mono text-muted-foreground overflow-x-auto max-h-60">
                      {JSON.stringify(workflow?.metadata || {}, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {activeTab === "actions" && (
                <div className="space-y-5">
                  {/* Next State Transition Buttons */}
                  <div className="p-4 rounded-xl bg-card border border-border space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-primary" />
                        Advance State (FSM Governed)
                      </h4>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        Current: {currentState}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Select an authorized target state according to the {currentType} finite state machine.
                    </p>

                    <div className="space-y-2">
                      <label className="text-[11px] font-medium text-muted-foreground">
                        Optional Transition Audit Note:
                      </label>
                      <Input
                        placeholder="e.g. Approved invoice dispatch after quote sign-off..."
                        value={transitionNote}
                        onChange={(e) => setTransitionNote(e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                      {allowedStates
                        .filter((st) => st !== "CANCELLED")
                        .map((targetSt) => {
                          const conf = STATE_COLORS[targetSt];
                          return (
                            <Button
                              key={targetSt}
                              type="button"
                              variant="outline"
                              onClick={() =>
                                transitionMutation.mutate({
                                  targetState: targetSt,
                                  note: transitionNote.trim() || undefined,
                                })
                              }
                              disabled={transitionMutation.isPending}
                              className={`h-9 text-xs justify-between hover:${conf.bg} hover:${conf.text} border-border`}
                            >
                              <span>Advance to {conf.label}</span>
                              <ArrowRight className="w-3.5 h-3.5 ml-2 shrink-0" />
                            </Button>
                          );
                        })}
                    </div>

                    {allowedStates.length === 0 && (
                      <p className="text-xs text-muted-foreground italic">
                        This workflow is in a terminal state ({currentState}). No further state transitions allowed.
                      </p>
                    )}
                  </div>

                  {/* System Timer Testing Trigger */}
                  <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-2.5">
                    <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                      <Timer className="w-4 h-4 text-amber-500" />
                      Background System Timer Simulation
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Trigger an asynchronous payment deadline expiration or recurring billing timer tick.
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => timerMutation.mutate("DUNNING_CHECK")}
                        disabled={timerMutation.isPending}
                        className="text-xs gap-1.5"
                      >
                        <Timer className="w-3.5 h-3.5 text-amber-500" />
                        <span>Simulate Dunning Expiration</span>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => timerMutation.mutate("INVOICE_REMINDER")}
                        disabled={timerMutation.isPending}
                        className="text-xs"
                      >
                        Send Courtesy Reminder
                      </Button>
                    </div>
                  </div>

                  {/* Cancellation */}
                  {allowedStates.includes("CANCELLED") && (
                    <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20 space-y-3">
                      <h4 className="text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
                        <XCircle className="w-4 h-4" />
                        Cancel Workflow
                      </h4>
                      {showCancelPrompt ? (
                        <div className="space-y-2">
                          <Input
                            placeholder="Reason for cancellation..."
                            value={cancellationReason}
                            onChange={(e) => setCancellationReason(e.target.value)}
                            className="h-8 text-xs"
                          />
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() =>
                                transitionMutation.mutate({
                                  targetState: "CANCELLED",
                                  note: cancellationReason || "Cancelled by user",
                                  payload: { reason: cancellationReason },
                                })
                              }
                              disabled={transitionMutation.isPending}
                              className="text-xs"
                            >
                              Confirm Cancellation
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setShowCancelPrompt(false)}
                              className="text-xs"
                            >
                              Back
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowCancelPrompt(true)}
                          className="text-xs text-red-600 dark:text-red-400 border-red-500/30 hover:bg-red-500/10"
                        >
                          Cancel Workflow
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Delete Workflow */}
                  <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20 space-y-3">
                    <h4 className="text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
                      <Trash2 className="w-4 h-4" />
                      Delete Workflow
                    </h4>
                    <p className="text-[11px] text-muted-foreground">
                      Permanently remove this workflow instance, transition audit logs, and associated records.
                    </p>
                    {showDeletePrompt ? (
                      <div className="space-y-2 pt-1">
                        <div className="text-xs text-red-600 dark:text-red-400 font-semibold">
                          Are you sure you want to permanently delete this workflow?
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteMutation.mutate()}
                            disabled={deleteMutation.isPending}
                            className="text-xs gap-1.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>{deleteMutation.isPending ? "Deleting..." : "Confirm Delete"}</span>
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowDeletePrompt(false)}
                            className="text-xs"
                          >
                            Back
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowDeletePrompt(true)}
                        className="text-xs text-red-600 dark:text-red-400 border-red-500/30 hover:bg-red-500/10 gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Workflow</span>
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
