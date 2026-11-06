import { CheckCircle2, Clock, UserCheck, AlignLeft, ShieldCheck } from "lucide-react";
import { Badge } from "../../../../components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "../../../../components/ui/card";
import type { WorkflowDetailViewState } from "../hooks/useWorkflowDetailTail";

export function CurrentAssigneeCard({ v }: { v: WorkflowDetailViewState }) {
  const { workflow, currentState, currentType, clerkAssignmentDescription, activeTreasuryAssignee } = v;
  return (
    <>
      {(() => {
            // Determine active assignee & swimlane config
            let badgeText = "AR Flow • Treasury";
            let badgeStyle = "text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800";
            let avatarLetters = "TR";
            let avatarBg = "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300";
            let assigneeTitle = "Assigned Treasury Specialist";
            let assigneeName = activeTreasuryAssignee;
            let assigneeRole = "Treasury Team • Inbound Cash & Settlement";
            let statusBadge = (
              <Badge variant="outline" className="bg-sky-50 text-sky-700 border-sky-300 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800 text-[10px] font-medium gap-1">
                <ShieldCheck className="h-3 w-3" /> Active Handling
              </Badge>
            );
            let descText = workflow.metadata?.notes || "Inbound payment processing, bank deposit matching, and cash reconciliation.";

            if (currentType === "CASH") {
              if (currentState === "CLERK_REVIEW") {
                badgeText = "AR Review";
                badgeStyle = "text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800";
                avatarLetters = workflow.metadata?.ar_clerk_assigned_to ? workflow.metadata.ar_clerk_assigned_to.slice(0, 2).toUpperCase() : "AR";
                avatarBg = "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300";
                assigneeTitle = "Account Receivable Assigned User";
                assigneeName = workflow.metadata?.ar_clerk_assigned_to || "Account Receivable Assigned User";
                assigneeRole = "Account Receivable • Discrepancy & Shortfall Resolution";
                statusBadge = (
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 text-[10px] font-medium gap-1">
                    <Clock className="h-3 w-3 animate-pulse" /> In Review
                  </Badge>
                );
                descText = clerkAssignmentDescription;
              } else if (currentState === "RECONCILED" || currentState === "COMPLETED") {
                statusBadge = (
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 text-[10px] font-medium gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Reconciled
                  </Badge>
                );
              }
            } else if (currentType === "INITIAL_SALE") {
              if (currentState === "DRAFT") {
                badgeText = "Sales Swimlane";
                badgeStyle = "text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800";
                avatarLetters = workflow.metadata?.sales_rep ? workflow.metadata.sales_rep.slice(0, 2).toUpperCase() : "SR";
                avatarBg = "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300";
                assigneeTitle = "Originating Sales Representative";
                assigneeName = workflow.metadata?.sales_rep || "Sales Representative";
                assigneeRole = "Sales Representative • Quote / Contract Accepted";
                statusBadge = (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 text-[10px] font-medium gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Quote Accepted
                  </Badge>
                );
                descText = "Quote / contract accepted by Sales. Handed off to Account Receivable assigned user for customer & product setup.";
              } else if (currentState === "PENDING_REVIEW" || currentState === "INVOICE_SENT" || currentState === "DUNNING_REMINDER") {
                badgeText = "Account Receivable Swimlane";
                badgeStyle = "text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800";
                avatarLetters = workflow.metadata?.ar_clerk_assigned_to ? workflow.metadata.ar_clerk_assigned_to.slice(0, 2).toUpperCase() : "AR";
                avatarBg = "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300";
                assigneeTitle = "Account Receivable Assigned User";
                assigneeName = workflow.metadata?.ar_clerk_assigned_to || "Account Receivable Assigned User";
                assigneeRole = currentState === "PENDING_REVIEW"
                  ? "Account Receivable • Customer Setup & PO Check"
                  : currentState === "INVOICE_SENT"
                  ? "Account Receivable • Issue & Send Invoice (GL 1100)"
                  : "Account Receivable • Overdue Follow-up";
                statusBadge = (
                  <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-300 dark:bg-indigo-950/40 dark:text-indigo-300 text-[10px] font-medium gap-1">
                    <Clock className="h-3 w-3 animate-pulse" /> {currentState === "INVOICE_SENT" ? "Invoiced" : currentState === "DUNNING_REMINDER" ? "Follow-up" : "Setup & Verify"}
                  </Badge>
                );
                descText = currentState === "PENDING_REVIEW"
                  ? (workflow.metadata?.po_required ? "Account Receivable assigned user is verifying customer & product records and validating PO # before invoicing." : "Account Receivable assigned user is setting up customer & product for direct invoicing.")
                  : currentState === "INVOICE_SENT"
                  ? "Invoice generated with PO reference (GL 1100) and dispatched. Awaiting payment."
                  : "Invoice is overdue. Account Receivable assigned user is conducting customer follow-up actions.";
              } else if (currentState === "AWAITING_PAYMENT") {
                badgeText = "Payment Gateway";
                badgeStyle = "text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800";
                avatarLetters = "SY";
                avatarBg = "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300";
                assigneeTitle = "Payment Portal Gateway";
                assigneeName = "Customer Self-Service / Bank Feed";
                assigneeRole = "Automated Gateway • Inbound Payment (Check/Transfer/Card)";
                statusBadge = (
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300 dark:bg-purple-950/40 dark:text-purple-300 text-[10px] font-medium gap-1">
                    <Clock className="h-3 w-3" /> Awaiting Payment
                  </Badge>
                );
                descText = "Invoice delivered. Awaiting payment receipt from customer via check, bank transfer, or card.";
              } else if (currentState === "RECONCILED") {
                badgeText = "Treasury Swimlane";
                badgeStyle = "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800";
                avatarLetters = workflow.metadata?.treasury_assigned_to ? workflow.metadata.treasury_assigned_to.slice(0, 2).toUpperCase() : "TR";
                avatarBg = "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300";
                assigneeTitle = "Treasury Assigned User";
                assigneeName = workflow.metadata?.treasury_assigned_to || "Treasury Assigned User";
                assigneeRole = "Treasury • Apply Cash [Paid]";
                statusBadge = (
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 text-[10px] font-medium gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Cash Applied
                  </Badge>
                );
                descText = "Payment received. Treasury assigned user is matching and applying cash against customer invoice.";
              } else if (currentState === "COMPLETED") {
                badgeText = "System Fulfilled";
                badgeStyle = "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800";
                avatarLetters = "AR";
                avatarBg = "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300";
                assigneeTitle = "AR & Order Operations";
                assigneeName = "AR Ledger & Fulfillment System";
                assigneeRole = "System • Paid – AR Updated & Order Fulfilled";
                statusBadge = (
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 text-[10px] font-medium gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Paid & Fulfilled
                  </Badge>
                );
                descText = "Workflow finalized. AR ledger updated and sales order fulfilled.";
              }
            } else if (currentType === "ADD_ON") {
              if (currentState === "DRAFT") {
                badgeText = "Sales Swimlane";
                badgeStyle = "text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800";
                avatarLetters = workflow.metadata?.sales_rep ? workflow.metadata.sales_rep.slice(0, 2).toUpperCase() : "SR";
                avatarBg = "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300";
                assigneeTitle = "Originating Sales Representative";
                assigneeName = workflow.metadata?.sales_rep || "Sales Representative";
                assigneeRole = "Sales Representative • Customer Extra Qty Request";
                statusBadge = (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 text-[10px] font-medium gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Request Active
                  </Badge>
                );
                descText = "Customer requested extra quantity via Sales Representative. Handed off to Account Receivable assigned user for validation & proration.";
              } else if (currentState === "PENDING_REVIEW" || currentState === "INVOICE_SENT" || currentState === "DUNNING_REMINDER") {
                badgeText = "Account Receivable Swimlane";
                badgeStyle = "text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800";
                avatarLetters = workflow.metadata?.ar_clerk_assigned_to ? workflow.metadata.ar_clerk_assigned_to.slice(0, 2).toUpperCase() : "AR";
                avatarBg = "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300";
                assigneeTitle = "Account Receivable Assigned User";
                assigneeName = workflow.metadata?.ar_clerk_assigned_to || "Account Receivable Assigned User";
                assigneeRole = currentState === "PENDING_REVIEW"
                  ? "Account Receivable • Validate Contract & Prorate to Renewal"
                  : currentState === "INVOICE_SENT"
                  ? "Account Receivable • Issue & Send Add-On Invoice"
                  : "Account Receivable • Overdue Follow-up";
                statusBadge = (
                  <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-300 dark:bg-indigo-950/40 dark:text-indigo-300 text-[10px] font-medium gap-1">
                    <Clock className="h-3 w-3 animate-pulse" /> {currentState === "INVOICE_SENT" ? "Add-On Invoiced" : currentState === "DUNNING_REMINDER" ? "Follow-up" : "Proration"}
                  </Badge>
                );
                descText = currentState === "PENDING_REVIEW"
                  ? "Account Receivable assigned user is validating contract and determining prorated amount to align with existing renewal date."
                  : currentState === "INVOICE_SENT"
                  ? "Add-on invoice issued and dispatched. Awaiting payment."
                  : "Add-on invoice is overdue. Account Receivable assigned user is executing customer follow-up.";
              } else if (currentState === "AWAITING_PAYMENT") {
                badgeText = "System & Renewal";
                badgeStyle = "text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800";
                avatarLetters = "SY";
                avatarBg = "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300";
                assigneeTitle = "Renewal Engine & Portal";
                assigneeName = "System / Customer Portal";
                assigneeRole = "System • Await Payment & Prepare Renewal Total";
                statusBadge = (
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300 dark:bg-purple-950/40 dark:text-purple-300 text-[10px] font-medium gap-1">
                    <Clock className="h-3 w-3" /> Awaiting Settlement
                  </Badge>
                );
                descText = "Add-on invoice delivered. Awaiting customer settlement before renewal consolidation.";
              } else if (currentState === "RECONCILED") {
                badgeText = "Treasury Swimlane";
                badgeStyle = "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800";
                avatarLetters = workflow.metadata?.treasury_assigned_to ? workflow.metadata.treasury_assigned_to.slice(0, 2).toUpperCase() : "TR";
                avatarBg = "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300";
                assigneeTitle = "Treasury Assigned User";
                assigneeName = workflow.metadata?.treasury_assigned_to || "Treasury Assigned User";
                assigneeRole = "Treasury • Apply Cash [Paid]";
                statusBadge = (
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 text-[10px] font-medium gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Cash Applied
                  </Badge>
                );
                descText = "Payment received. Treasury assigned user is applying cash against add-on invoice.";
              } else if (currentState === "COMPLETED") {
                badgeText = "System Consolidated";
                badgeStyle = "text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800";
                avatarLetters = "RN";
                avatarBg = "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300";
                assigneeTitle = "Renewal & Contract Engine";
                assigneeName = "Contract Consolidation Engine";
                assigneeRole = "System • Consolidate into Next Renewal Total";
                statusBadge = (
                  <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-300 dark:bg-indigo-950/40 dark:text-indigo-300 text-[10px] font-medium gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Consolidated & Complete
                  </Badge>
                );
                descText = "Payment complete. Extra quantities provisioned and consolidated into next renewal total.";
              }
            }

            return (
              <Card className="shadow-xs border-slate-200 dark:border-zinc-800">
                <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/50 border-b border-slate-100 dark:border-zinc-800 px-5 py-3 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-zinc-100">
                      Who This Is Assigned
                    </CardTitle>
                  </div>
                  <Badge variant="outline" className={`text-[10px] font-semibold ${badgeStyle}`}>
                    {badgeText}
                  </Badge>
                </CardHeader>

                <CardContent className="p-4 space-y-4">
                  <div className="space-y-3">
                    <div className="text-[10.5px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                      {assigneeTitle}
                    </div>
                    <div className="p-2.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-900/40 shadow-2xs flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`h-8 w-8 rounded-full ${avatarBg} flex items-center justify-center text-xs font-bold shrink-0`}>
                          {avatarLetters}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-slate-900 dark:text-zinc-100 truncate" title={assigneeName}>
                            {assigneeName}
                          </div>
                          <div className="text-[10.5px] text-muted-foreground truncate font-medium">
                            {assigneeRole}
                          </div>
                        </div>
                      </div>
                      <div>
                        {statusBadge}
                      </div>
                    </div>

                    {/* Previous Clerk Resolution info if resolved on Cash workflow */}
                    {currentType === "CASH" && workflow.metadata?.ar_clerk_assigned_to && currentState !== "CLERK_REVIEW" && (
                      <div className="p-2.5 rounded-lg border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20 text-xs flex items-center justify-between">
                        <div className="min-w-0">
                          <span className="font-semibold text-emerald-900 dark:text-emerald-200 block truncate">
                            Account Receivable Review Resolved
                          </span>
                          <span className="text-[11px] text-emerald-700 dark:text-emerald-300/80 truncate block">
                            Discrepancy cleared by {workflow.metadata.ar_clerk_assigned_to}
                          </span>
                        </div>
                        <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/50 dark:text-emerald-200 text-[10px] font-medium shrink-0 ml-2">
                          Resolved
                        </Badge>
                      </div>
                    )}

                    {/* Description & Purpose */}
                    <div className="space-y-1.5 pt-1">
                      <div className="text-[10.5px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                        <AlignLeft className="h-3.5 w-3.5 text-slate-600 dark:text-zinc-400" />
                        <span>Description & Purpose</span>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-50/90 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800 text-xs leading-relaxed text-slate-700 dark:text-zinc-300">
                        {descText}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })()}
    </>
  );
}
