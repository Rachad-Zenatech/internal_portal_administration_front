import type { WorkflowDetailViewState } from "../hooks/useWorkflowDetailTail";

export function ActionRequired({ v }: { v: WorkflowDetailViewState }) {
  const { stateConfig, currentState, currentType, workflow, clerksList, totalRemaining, isValueReconciled } = v;
  return (
    <div className="text-xs text-slate-700 dark:text-zinc-300 flex items-center gap-2 flex-wrap">
              <span className="font-bold text-indigo-600 dark:text-indigo-400">Action Required:</span>
              {currentState === "COMPLETED" ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                  {currentType === "INITIAL_SALE"
                    ? "Paid – AR general ledger updated and sales order fulfilled."
                    : currentType === "ADD_ON"
                    ? "Paid – Upgrades provisioned and consolidated into next renewal total."
                    : "Workflow lifecycle finalized and posted to the general ledger."}
                </span>
              ) : currentState === "CANCELLED" ? (
                <span className="text-zinc-500 font-medium">Workflow has been cancelled.</span>
              ) : currentType === "CASH" && currentState === "PENDING_REVIEW" ? (
                !isValueReconciled ? (
                  <span className="text-amber-700 dark:text-amber-400 font-medium">
                    Payment shortfall detected ({totalRemaining > 0 ? `$${totalRemaining.toLocaleString(undefined, { minimumFractionDigits: 2 })} remaining` : "Unreconciled balance"}). Please assign to AR Clerk for resolution.
                  </span>
                ) : (
                  <span>Treasury deposit received and fully matched. Confirm reconciliation to advance.</span>
                )
              ) : currentType === "CASH" && currentState === "CLERK_REVIEW" ? (
                <span className="text-amber-700 dark:text-amber-400 font-medium">
                  Shortfall / discrepancy assigned to Account Receivable user ({workflow.metadata?.ar_clerk_assigned_to || clerksList[0]?.email || "sarah.jenkins@zenatech.com"}). Resolve customer deductions to finalize.
                </span>
              ) : currentType === "CASH" && currentState === "RECONCILED" ? (
                <span>Reconciliation marked. Finalize workflow and post audit records to the general ledger.</span>
              ) : currentType === "INITIAL_SALE" && currentState === "DRAFT" ? (
                <span>Quote / contract accepted by Sales ({workflow.metadata?.sales_rep || "Sales Representative"}). Account Receivable assigned user must set up customer, products, and check PO requirements.</span>
              ) : currentType === "INITIAL_SALE" && currentState === "PENDING_REVIEW" ? (
                workflow.metadata?.po_required && !workflow.metadata?.po_number ? (
                  <span className="text-amber-700 dark:text-amber-400 font-medium">
                    PO Gateway: Customer requires Purchase Order. Collect PO # / reference before generating invoice.
                  </span>
                ) : (
                  <span>Customer & products verified (GL 1100). Generate invoice with PO reference and dispatch [Invoiced].</span>
                )
              ) : currentType === "INITIAL_SALE" && currentState === "INVOICE_SENT" ? (
                <span>Invoice sent to customer. Awaiting payment or follow-up timer.</span>
              ) : currentType === "INITIAL_SALE" && currentState === "DUNNING_REMINDER" ? (
                <span className="text-rose-700 dark:text-rose-400 font-medium">
                  Invoice overdue. Account Receivable assigned user ({workflow.metadata?.ar_clerk_assigned_to || "AR Clerk"}) is conducting follow-up and reminder dispatches.
                </span>
              ) : currentType === "INITIAL_SALE" && currentState === "AWAITING_PAYMENT" ? (
                <span>Payment inbound via check, transfer, or card. Treasury assigned user ready to apply cash [Paid].</span>
              ) : currentType === "INITIAL_SALE" && currentState === "RECONCILED" ? (
                <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                  Cash applied [Paid]. Finalize to update AR ledger and fulfill order.
                </span>
              ) : currentType === "ADD_ON" && currentState === "DRAFT" ? (
                <span>Customer requested extra quantity via Sales ({workflow.metadata?.sales_rep || "Sales Representative"}). Account Receivable assigned user must validate contract & determine prorated amount.</span>
              ) : currentType === "ADD_ON" && currentState === "PENDING_REVIEW" ? (
                <span>Contract validated. Prorated amount calculated to existing renewal date. Issue add-on invoice [Invoiced].</span>
              ) : currentType === "ADD_ON" && currentState === "INVOICE_SENT" ? (
                <span>Add-on invoice sent. Awaiting payment or follow-up timer.</span>
              ) : currentType === "ADD_ON" && currentState === "DUNNING_REMINDER" ? (
                <span className="text-rose-700 dark:text-rose-400 font-medium">
                  Add-on invoice overdue. Account Receivable assigned user ({workflow.metadata?.ar_clerk_assigned_to || "AR Clerk"}) is conducting follow-up.
                </span>
              ) : currentType === "ADD_ON" && currentState === "AWAITING_PAYMENT" ? (
                <span>Awaiting settlement. Treasury assigned user ready to apply cash [Paid].</span>
              ) : currentType === "ADD_ON" && currentState === "RECONCILED" ? (
                <span className="text-indigo-700 dark:text-indigo-300 font-medium">
                  Cash applied [Paid]. Finalize to consolidate into next renewal total and provision upgrades.
                </span>
              ) : (
                <span>{stateConfig.desc} Advance workflow to the next lifecycle stage.</span>
              )}
            </div>
  );
}
