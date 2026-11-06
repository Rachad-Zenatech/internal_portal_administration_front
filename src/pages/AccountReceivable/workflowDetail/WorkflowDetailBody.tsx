import { ShoppingCart, FileText, Activity, Layers as LayersIcon, Paperclip, Check } from "lucide-react";
import NewWorkflowModal from "../modals/NewWorkflowModal";
import { FilePreviewModal } from "../../Purchasing/dialogs/FilePreviewModal";
import { Badge } from "../../../components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "../../../components/ui/card";
import type { WorkflowDetailGuardedState } from "./hooks/useWorkflowDetail";
import { useWorkflowDetailTail } from "./hooks/useWorkflowDetailTail";
import { TopNavigationActionBar } from "./sections/TopNavigationActionBar";
import { ActionRequired } from "./sections/ActionRequired";
import { TimerSimulationButtons } from "./sections/TimerSimulationButtons";
import { InitialSaleSpecificMetadata } from "./sections/InitialSaleSpecificMetadata";
import { AddOnSpecificMetadata } from "./sections/AddOnSpecificMetadata";
import { ARCustomerContact } from "./sections/ARCustomerContact";
import { BeneficiaryBankSettlementAccount } from "./sections/BeneficiaryBankSettlementAccount";
import { MatchStatusCallout } from "./sections/MatchStatusCallout";
import { AttachmentsTab } from "./sections/AttachmentsTab";
import { AuditTrailTab } from "./sections/AuditTrailTab";
import { CurrentAssigneeCard } from "./sections/CurrentAssigneeCard";
import { AssignToArClerk } from "./sections/AssignToArClerk";
import { DeleteConfirmationModal } from "./sections/DeleteConfirmationModal";

export function WorkflowDetailBody({ s }: { s: WorkflowDetailGuardedState }) {
  const v = { ...s, ...useWorkflowDetailTail(s) };
  const { workflow, setIsEditModalOpen, isEditModalOpen, previewTarget, setIsPreviewOpen, isPreviewOpen, currentType, glAccountCombinedName, glAccountNumber, stateConfig, typeConfig, customerDetails, activeTab, setActiveTab, getStepLabel, currentStepIdx, stepSequence, TypeIcon } = v;
  return (
    <div className="w-full space-y-6 pb-12">
      {/* ── Top Navigation Action Bar ── */}
      <TopNavigationActionBar v={v} />

      {/* ── Main Request Header Banner (Hero Card) ── */}
      <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xl font-bold font-mono text-slate-400 dark:text-zinc-500">
                #{workflow.reference_id || workflow.id}
              </span>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-zinc-100">
                {workflow.customer_name || "Account Receivable Workflow"}
              </h1>
              <Badge
                variant="outline"
                className={`text-xs px-2.5 py-1 font-semibold ${stateConfig.bg} ${stateConfig.text} ${stateConfig.border}`}
              >
                {stateConfig.label}
              </Badge>
              <Badge
                variant="outline"
                className={`text-xs px-2.5 py-1 font-semibold ${typeConfig.bg} ${typeConfig.color} flex items-center gap-1.5`}
              >
                <TypeIcon className="h-3.5 w-3.5" />
                {typeConfig.label}
              </Badge>
            </div>

            <p className="text-xs text-slate-500 dark:text-zinc-400 flex items-center gap-2 flex-wrap">
              <span>· {typeConfig.desc}</span>
              <span>· Customer: <strong className="text-slate-800 dark:text-zinc-200">{customerDetails.name}</strong> ({workflow.customer_id})</span>
              <span>· A/R GL Account: <strong className="text-slate-800 dark:text-zinc-200">{glAccountCombinedName}</strong></span>
              <span>· Created on {new Date(workflow.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="text-right bg-slate-50 dark:bg-zinc-800/60 px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-700/60">
              <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium block">Total Value</span>
              <span className="text-2xl font-black font-mono text-slate-900 dark:text-zinc-100">
                ${Number(workflow.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-xs font-semibold text-slate-500">{workflow.currency || "USD"}</span>
              </span>
            </div>
          </div>
        </div>

        {/* ── Workflow Status / Stepper Pipeline ── */}
        <div className="pt-4 border-t border-slate-100 dark:border-zinc-800/80 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
              Workflow Status & Progression
            </span>
            <span className="text-xs text-slate-500 dark:text-zinc-400">
              Step {Math.max(1, currentStepIdx + 1)} of {stepSequence.length} · {stateConfig.desc}
            </span>
          </div>

          {/* Stepper Pipeline */}
          <div className={`grid grid-cols-2 ${stepSequence.length === 6 ? "sm:grid-cols-6" : stepSequence.length === 4 ? "sm:grid-cols-4" : "sm:grid-cols-3"} gap-2`}>
            {stepSequence.map((st, idx) => {
              const isPassed = currentStepIdx > idx;
              const isCurrent = currentStepIdx === idx;
              const stepLabel = getStepLabel(currentType, st);

              return (
                <div
                  key={st}
                  className={`p-2.5 rounded-xl border flex items-center gap-2.5 text-xs transition-all ${
                    isCurrent
                      ? "bg-indigo-50/80 border-indigo-300 dark:bg-indigo-950/50 dark:border-indigo-800 text-indigo-950 dark:text-indigo-200 font-bold shadow-2xs"
                      : isPassed
                      ? "bg-slate-50 border-slate-200 dark:bg-zinc-800/40 dark:border-zinc-800 text-slate-600 dark:text-zinc-400"
                      : "bg-white dark:bg-zinc-950 border-dashed border-slate-200 dark:border-zinc-800 text-slate-400"
                  }`}
                >
                  <div
                    className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isCurrent
                        ? "bg-indigo-600 text-white"
                        : isPassed
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-200 dark:bg-zinc-800 text-slate-500"
                    }`}
                  >
                    {isPassed ? <Check className="h-3 w-3" /> : idx + 1}
                  </div>
                  <span className="truncate">{stepLabel}</span>
                </div>
              );
            })}
          </div>

          {/* Action Prompt Banner */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/60 flex items-center justify-between flex-wrap gap-3">
            <ActionRequired v={v} />

            <TimerSimulationButtons v={v} />
          </div>
        </div>
      </div>

      {/* ── Tabs Navigation ── */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-zinc-800 text-xs font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveTab("overview")}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === "overview"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold"
              : "border-transparent text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          }`}
        >
          <LayersIcon className="w-4 h-4" />
          <span>Workflow Details & Specifications</span>
        </button>
        <button
          onClick={() => setActiveTab("attachments")}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === "attachments"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold"
              : "border-transparent text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          }`}
        >
          <Paperclip className="w-4 h-4" />
          <span>Attachments ({workflow.metadata?.attachments?.length || 0})</span>
        </button>
        <button
          onClick={() => setActiveTab("timeline")}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === "timeline"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold"
              : "border-transparent text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Audit Trail ({workflow.logs?.length || 0})</span>
        </button>
      </div>

      {/* ── Main Responsive 2-Column Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Content Column (Left 8 cols) */}
        <div className="lg:col-span-8 xl:col-span-8 space-y-6 min-w-0">
          {/* ── Tab Content ── */}
          {activeTab === "overview" && (
        <div className="space-y-6">
          {/* 1. Domain Specifications & References Card */}
          <Card className="shadow-xs border-slate-200 dark:border-zinc-800">
            <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/50 border-b border-slate-100 dark:border-zinc-800 px-6 py-3.5 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900 dark:text-zinc-100">
                <FileText className="h-4 w-4 text-indigo-600" />
                <span>Domain Specifications & References</span>
              </CardTitle>
              <Badge variant="outline" className="text-xs font-semibold px-2 py-0.5">
                {workflow.customer_id}
              </Badge>
            </CardHeader>
            <CardContent className="p-0 text-xs divide-y divide-slate-100 dark:divide-zinc-800/60">
              <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-zinc-800/60">
                <div className="p-3.5 flex justify-between gap-2">
                  <span className="text-muted-foreground font-medium">Customer Entity</span>
                  <span className="font-semibold text-slate-900 dark:text-zinc-100 text-right">
                    {customerDetails.name}
                  </span>
                </div>
                <div className="p-3.5 flex justify-between gap-2 bg-slate-50/50 dark:bg-zinc-900/30">
                  <span className="text-muted-foreground font-medium">Customer Account ID</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-zinc-100 text-right">
                    {workflow.customer_id}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-zinc-800/60">
                <div className="p-3.5 flex justify-between gap-2">
                  <span className="text-muted-foreground font-medium">Workflow Archetype</span>
                  <span className="font-semibold text-slate-900 dark:text-zinc-100 text-right">
                    {typeConfig.label}
                  </span>
                </div>
                <div className="p-3.5 flex justify-between gap-2 bg-slate-50/50 dark:bg-zinc-900/30">
                  <span className="text-muted-foreground font-medium">Lifecycle State</span>
                  <span className="font-semibold text-slate-900 dark:text-zinc-100 text-right">
                    {stateConfig.label}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-zinc-800/60">
                <div className="p-3.5 flex justify-between gap-2">
                  <span className="text-muted-foreground font-medium">Total Workflow Value</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-zinc-100 text-right">
                    ${Number(workflow.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} {workflow.currency || "USD"}
                  </span>
                </div>
                <div className="p-3.5 flex justify-between gap-2 bg-slate-50/50 dark:bg-zinc-900/30">
                  <span className="text-muted-foreground font-medium">Currency</span>
                  <span className="font-semibold text-slate-900 dark:text-zinc-100 text-right">
                    {workflow.currency || "USD"}
                  </span>
                </div>
              </div>

              {/* GL Account # and Account Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-zinc-800/60">
                <div className="p-3.5 flex justify-between gap-2">
                  <span className="text-muted-foreground font-medium">A/R GL Account #</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-zinc-100 text-right">
                    {glAccountNumber}
                  </span>
                </div>
                <div className="p-3.5 flex justify-between gap-2 bg-slate-50/50 dark:bg-zinc-900/30">
                  <span className="text-muted-foreground font-medium">A/R GL Account Name</span>
                  <span className="font-semibold text-slate-900 dark:text-zinc-100 text-right">
                    {glAccountCombinedName}
                  </span>
                </div>
              </div>

              {/* Initial Sale Specific Metadata (BPMN) */}
              <InitialSaleSpecificMetadata v={v} />

              {/* Add-On Specific Metadata (BPMN) */}
              <AddOnSpecificMetadata v={v} />

              {workflow.metadata?.deposit_date && (
                <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-zinc-800/60">
                  <div className="p-3.5 flex justify-between gap-2">
                    <span className="text-muted-foreground font-medium">Deposit / Settlement Date</span>
                    <span className="font-semibold text-slate-900 dark:text-zinc-100 text-right">
                      {workflow.metadata.deposit_date}
                    </span>
                  </div>
                  <div className="p-3.5 flex justify-between gap-2 bg-slate-50/50 dark:bg-zinc-900/30">
                    <span className="text-muted-foreground font-medium">Payment Match Classification</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 text-right">
                      {workflow.metadata?.payment_match_type === "PARTIAL_PAID"
                        ? "Partially Paid Shortfall"
                        : "Full Paid & Reconciled"}
                    </span>
                  </div>
                </div>
              )}

              {workflow.metadata?.ar_clerk_assigned_to && currentType === "CASH" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-zinc-800/60">
                  <div className="p-3.5 flex justify-between gap-2">
                    <span className="text-muted-foreground font-medium">Assigned AR Clerk</span>
                    <span className="font-semibold text-amber-600 dark:text-amber-400 text-right">
                      {workflow.metadata.ar_clerk_assigned_to}
                    </span>
                  </div>
                  <div className="p-3.5 flex justify-between gap-2 bg-slate-50/50 dark:bg-zinc-900/30">
                    <span className="text-muted-foreground font-medium">Discrepancy / Remarks</span>
                    <span className="font-medium text-slate-800 dark:text-zinc-200 text-right italic">
                      {workflow.metadata.discrepancy_reason || "Shortfall under clerk investigation"}
                    </span>
                  </div>
                </div>
              )}

              {workflow.metadata?.subscription_plan && (
                <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-zinc-800/60">
                  <div className="p-3.5 flex justify-between gap-2">
                    <span className="text-muted-foreground font-medium">Subscription Plan</span>
                    <span className="font-bold text-slate-900 dark:text-zinc-100 text-right">
                      {workflow.metadata.subscription_plan}
                    </span>
                  </div>
                  <div className="p-3.5 flex justify-between gap-2 bg-slate-50/50 dark:bg-zinc-900/30">
                    <span className="text-muted-foreground font-medium">Billing Mode</span>
                    <span className="font-semibold text-slate-900 dark:text-zinc-100 text-right">
                      Day {workflow.metadata.billing_day_of_month || 1} ({workflow.metadata.billing_mode})
                    </span>
                  </div>
                </div>
              )}

              {workflow.metadata?.renewal_term_months && (
                <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-zinc-800/60">
                  <div className="p-3.5 flex justify-between gap-2">
                    <span className="text-muted-foreground font-medium">Renewal Term</span>
                    <span className="font-bold text-slate-900 dark:text-zinc-100 text-right">
                      {workflow.metadata.renewal_term_months} Months
                    </span>
                  </div>
                  <div className="p-3.5 flex justify-between gap-2 bg-slate-50/50 dark:bg-zinc-900/30">
                    <span className="text-muted-foreground font-medium">Renewal Discount</span>
                    <span className="font-semibold text-slate-900 dark:text-zinc-100 text-right">
                      {workflow.metadata.renewal_discount_percent || 0}%
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 2. A/R Customer Contact Details Card */}
          <ARCustomerContact v={v} />

          {/* 3. Beneficiary Bank Settlement Account Card */}
          <BeneficiaryBankSettlementAccount v={v} />

          {/* 4. Treasury Invoice Matching & Reconciliation Card */}
          <MatchStatusCallout v={v} />

          {/* 6. Itemized Lines if present */}
          {workflow.metadata?.line_items && workflow.metadata.line_items.length > 0 && (
            <Card className="shadow-xs border-slate-200 dark:border-zinc-800">
              <CardHeader className="border-b border-slate-100 dark:border-zinc-800 px-6 py-3.5 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-blue-600" />
                  <CardTitle className="text-base font-bold text-slate-900 dark:text-zinc-100">
                    Itemized Sales Order Lines
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-5">
                <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-zinc-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-zinc-800/60 border-b border-slate-200 dark:border-zinc-800 text-slate-500 uppercase text-[10px] font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">Description</th>
                        <th className="py-2.5 px-3 text-right">Quantity</th>
                        <th className="py-2.5 px-3 text-right">Unit Price</th>
                        <th className="py-2.5 px-3 text-right">Tax Rate</th>
                        <th className="py-2.5 px-3 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                      {workflow.metadata.line_items.map((item: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/40">
                          <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-zinc-100">
                            {item.description}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono">
                            {item.quantity}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono">
                            ${Number(item.unit_price).toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-500">
                            {item.tax_rate ? `${(Number(item.tax_rate) * 100).toFixed(0)}%` : "0%"}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-zinc-100">
                            ${Number(item.amount).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 7. Add-on items if present */}
          {workflow.metadata?.add_on_items && workflow.metadata.add_on_items.length > 0 && (
            <Card className="shadow-xs border-slate-200 dark:border-zinc-800">
              <CardHeader className="border-b border-slate-100 dark:border-zinc-800 px-6 py-3.5 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <LayersIcon className="h-4 w-4 text-indigo-600" />
                  <CardTitle className="text-base font-bold text-slate-900 dark:text-zinc-100">
                    Add-On Components & Upgrades
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-5">
                <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-zinc-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-zinc-800/60 border-b border-slate-200 dark:border-zinc-800 text-slate-500 uppercase text-[10px] font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">Description</th>
                        <th className="py-2.5 px-3 text-right">Quantity</th>
                        <th className="py-2.5 px-3 text-right">Rate</th>
                        <th className="py-2.5 px-3 text-right">Pro-Rated Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                      {workflow.metadata.add_on_items.map((item: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/40">
                          <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-zinc-100">
                            {item.description}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono">
                            {item.quantity}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono">
                            ${Number(item.unit_price).toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-zinc-100">
                            ${Number(item.amount).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Attachments Tab */}
      <AttachmentsTab v={v} />

      {/* Audit Trail Tab */}
      <AuditTrailTab v={v} />
        </div>

        {/* ── Sidebar (Right 4 cols) ── */}
        <div className="lg:col-span-4 xl:col-span-4 space-y-6">
          {/* Card 1: Who This Is Assigned */}
          <CurrentAssigneeCard v={v} />
        </div>
      </div>

      {/* ── Assign to AR Clerk Dialog Modal ── */}
      <AssignToArClerk v={v} />

      <FilePreviewModal
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        target={previewTarget}
      />

      <NewWorkflowModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        workflowToEdit={workflow}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal v={v} />
    </div>
  );
}
