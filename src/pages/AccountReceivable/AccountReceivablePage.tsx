import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Banknote,
  ShoppingCart,
  Layers,
  Repeat,
  RotateCw,
  Plus,
  Search,
  RefreshCw,
  DollarSign,
  Clock,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Timer,
  AlertTriangle,
  ReceiptText,
} from "lucide-react";
import { arService } from "../../services/arService";
import type {
  ARWorkflowFilterParams,
  ARWorkflowState,
  ARWorkflowType,
} from "../../types/ar";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import NewWorkflowModal from "./NewWorkflowModal";

const TYPE_TABS: Array<{
  type: ARWorkflowType | "";
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}> = [
  { type: "", label: "All Workflows" },
  { type: "CASH", label: "Cash Reconciliation", icon: Banknote },
  { type: "INITIAL_SALE", label: "Initial Sale", icon: ShoppingCart },
  { type: "ADD_ON", label: "Add-On / Upgrade", icon: Layers },
  { type: "MONTHLY_SUBSCRIPTION", label: "Monthly Subscription", icon: Repeat },
  { type: "RENEWAL", label: "Contract Renewal", icon: RotateCw },
];

const STATE_BADGES: Record<ARWorkflowState, { label: string; bg: string; text: string; border: string }> = {
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
    label: "Completed",
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

const TYPE_BADGES: Record<ARWorkflowType, { label: string; icon: React.ComponentType<{ className?: string }>; color: string; bg: string }> = {
  CASH: { label: "Cash", icon: Banknote, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  INITIAL_SALE: { label: "Initial Sale", icon: ShoppingCart, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  ADD_ON: { label: "Add-On", icon: Layers, color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/20" },
  MONTHLY_SUBSCRIPTION: { label: "Subscription", icon: Repeat, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-500/10 border-violet-500/20" },
  RENEWAL: { label: "Renewal", icon: RotateCw, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
};

export default function AccountReceivablePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedType, setSelectedType] = useState<ARWorkflowType | "">("");
  const [selectedState, setSelectedState] = useState<ARWorkflowState | "">("");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);

  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Fetch Metrics
  const { data: metrics, refetch: refetchMetrics } = useQuery({
    queryKey: ["ar-metrics"],
    queryFn: () => arService.getMetrics(),
    refetchInterval: 30000,
  });

  // Fetch Workflows
  const filterParams: ARWorkflowFilterParams = {
    type: selectedType || undefined,
    state: selectedState || undefined,
    search: searchTerm.trim() || undefined,
    page,
    page_size: pageSize,
  };

  const {
    data: workflowsData,
    isLoading: isWorkflowsLoading,
    isFetching,
    refetch: refetchWorkflows,
  } = useQuery({
    queryKey: ["ar-workflows", filterParams],
    queryFn: () => arService.getWorkflows(filterParams),
    refetchInterval: 15000,
  });

  // Batch dunning mutation
  const batchDunningMutation = useMutation({
    mutationFn: () => arService.batchDunningTrigger(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ar-workflows"] });
      queryClient.invalidateQueries({ queryKey: ["ar-metrics"] });
    },
  });

  const handleOpenDetail = (id: string) => {
    navigate(`/account-receivable/${id}`);
  };

  const handleRefreshAll = () => {
    refetchMetrics();
    refetchWorkflows();
  };

  const totalOutstanding = metrics?.total_outstanding_balance ?? 0;
  const awaitingAction = (metrics?.count_by_status?.["PENDING_REVIEW"] ?? 0) + (metrics?.count_by_status?.["INVOICE_SENT"] ?? 0) + (metrics?.count_by_status?.["AWAITING_PAYMENT"] ?? 0);
  const overdueCount = metrics?.overdue_dunning_count ?? 0;
  const completedCount = metrics?.completed_this_month ?? 0;

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <ReceiptText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Account Receivable (AR)
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                BPMN workflow orchestration for Cash, Initial Sales, Add-Ons, Subscriptions & Renewals
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshAll}
            disabled={isFetching}
            className="text-xs gap-1.5 h-9"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => batchDunningMutation.mutate()}
            disabled={batchDunningMutation.isPending}
            className="text-xs gap-1.5 h-9 border border-border"
          >
            <Timer className="w-3.5 h-3.5 text-amber-500" />
            <span>Run Dunning Check</span>
          </Button>

          <Button
            onClick={() => setCreateModalOpen(true)}
            className="text-xs gap-1.5 h-9 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>New Workflow</span>
          </Button>
        </div>
      </div>

      {/* Metric Cards Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Outstanding */}
        <div className="p-4 rounded-xl bg-card border border-border/70 shadow-2xs hover:shadow-xs transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground">
              Total Outstanding Balance
            </span>
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-foreground">
              ${totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <span className="text-xs font-medium text-muted-foreground">USD</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            Across active invoices & awaiting payments
          </p>
        </div>

        {/* Workflows Awaiting Action */}
        <div className="p-4 rounded-xl bg-card border border-border/70 shadow-2xs hover:shadow-xs transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground">
              Awaiting Action / Review
            </span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-foreground">
              {awaitingAction}
            </span>
            <span className="text-xs text-muted-foreground">workflows</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            Requires approval, invoice dispatch or capture
          </p>
        </div>

        {/* Overdue / Dunning Reminders */}
        <div className="p-4 rounded-xl bg-card border border-border/70 shadow-2xs hover:shadow-xs transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground">
              Overdue Dunning Cycles
            </span>
            <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400">
              {overdueCount}
            </span>
            <span className="text-xs text-muted-foreground">overdue</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            In active dunning timer retry loop
          </p>
        </div>

        {/* Completed This Month */}
        <div className="p-4 rounded-xl bg-card border border-border/70 shadow-2xs hover:shadow-xs transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground">
              Completed & Reconciled
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {completedCount}
            </span>
            <span className="text-xs text-muted-foreground">this month</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            Fully fulfilled, ledger posted & provisioned
          </p>
        </div>
      </div>

      {/* Filter Tabs Bar */}
      <div className="space-y-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-border">
          {TYPE_TABS.map((tab) => {
            const Icon = tab.icon;
            const isSelected = selectedType === tab.type;
            return (
              <button
                key={tab.type}
                onClick={() => {
                  setSelectedType(tab.type);
                  setPage(1);
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
              >
                {Icon && <Icon className="w-3.5 h-3.5" />}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search and Secondary Filter Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <div className="relative w-full sm:w-80">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-muted-foreground" />
              <Input
                placeholder="Search reference #, customer name, ID..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="h-8 pl-8 text-xs"
              />
            </div>

            <select
              value={selectedState}
              onChange={(e) => {
                setSelectedState(e.target.value as ARWorkflowState | "");
                setPage(1);
              }}
              className="h-8 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus:ring-1 focus:ring-primary"
            >
              <option value="">All States</option>
              <option value="DRAFT">Draft</option>
              <option value="PENDING_REVIEW">Pending Review</option>
              <option value="INVOICE_SENT">Invoice Sent</option>
              <option value="AWAITING_PAYMENT">Awaiting Payment</option>
              <option value="DUNNING_REMINDER">Dunning / Overdue</option>
              <option value="RECONCILED">Reconciled</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div className="text-xs text-muted-foreground">
            Showing{" "}
            <strong className="text-foreground">
              {workflowsData?.items.length || 0}
            </strong>{" "}
            of <strong className="text-foreground">{workflowsData?.total || 0}</strong>{" "}
            workflows
          </div>
        </div>
      </div>

      {/* Main Workflow Data Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 border-b border-border text-muted-foreground uppercase text-[10px] font-semibold tracking-wider">
              <tr>
                <th className="py-3 px-4">Reference ID</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Workflow Type</th>
                <th className="py-3 px-4">Current Stage</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isWorkflowsLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground text-xs">
                    <Clock className="w-4 h-4 animate-spin inline-block mr-2" />
                    Loading workflow instances...
                  </td>
                </tr>
              ) : workflowsData?.items && workflowsData.items.length > 0 ? (
                workflowsData.items.map((wf) => {
                  const typeBadge = TYPE_BADGES[wf.workflow_type] || TYPE_BADGES.CASH;
                  const stateBadge = STATE_BADGES[wf.state] || STATE_BADGES.DRAFT;
                  const TypeIcon = typeBadge.icon;

                  return (
                    <tr
                      key={wf.id}
                      onClick={() => handleOpenDetail(wf.id)}
                      className="hover:bg-muted/30 cursor-pointer transition-colors group"
                    >
                      {/* Reference ID */}
                      <td className="py-3.5 px-4 font-mono font-bold text-foreground">
                        <span className="group-hover:text-primary transition-colors flex items-center gap-1.5">
                          {wf.reference_id || wf.id.slice(0, 8)}
                          <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                        </span>
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-foreground">
                          {wf.customer_name || "Unnamed Customer"}
                        </div>
                        <div className="font-mono text-[10px] text-muted-foreground">
                          {wf.customer_id}
                        </div>
                      </td>

                      {/* Workflow Type */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px] font-semibold ${typeBadge.bg} ${typeBadge.color}`}
                        >
                          <TypeIcon className="w-3 h-3 shrink-0" />
                          {typeBadge.label}
                        </span>
                      </td>

                      {/* Current Stage */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-[10px] font-semibold ${stateBadge.bg} ${stateBadge.text} ${stateBadge.border}`}
                        >
                          {stateBadge.label}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-foreground">
                        ${wf.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}{" "}
                        <span className="text-[10px] text-muted-foreground font-normal">
                          {wf.currency}
                        </span>
                      </td>

                      {/* Created Date */}
                      <td className="py-3.5 px-4 text-muted-foreground text-[11px]">
                        {new Date(wf.created_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>

                      {/* Actions */}
                      <td
                        className="py-3.5 px-4 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDetail(wf.id)}
                          className="h-7 text-xs gap-1 group-hover:bg-primary/10 group-hover:text-primary"
                        >
                          <span>Manage</span>
                          <ArrowRight className="w-3 h-3" />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground text-xs">
                    No accounts receivable workflows found matching the current criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {workflowsData && workflowsData.total_pages > 1 && (
          <div className="p-3 border-t border-border bg-muted/20 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              Page {workflowsData.page} of {workflowsData.total_pages}
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={workflowsData.page <= 1}
                className="h-7 px-2.5 text-xs"
              >
                <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setPage((p) => Math.min(workflowsData.total_pages, p + 1))
                }
                disabled={workflowsData.page >= workflowsData.total_pages}
                className="h-7 px-2.5 text-xs"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Creation Modal */}
      <NewWorkflowModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onCreated={(newId) => {
          navigate(`/account-receivable/${newId}`);
        }}
      />
    </div>
  );
}
