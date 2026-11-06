import { Badge } from "../../../../components/ui/badge";
import type { WorkflowDetailViewState } from "../hooks/useWorkflowDetailTail";

export function InitialSaleSpecificMetadata({ v }: { v: WorkflowDetailViewState }) {
  const { workflow, currentType } = v;
  return (
    <>
      {currentType === "INITIAL_SALE" && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-zinc-800/60">
                    <div className="p-3.5 flex justify-between gap-2">
                      <span className="text-muted-foreground font-medium">Sales Originator</span>
                      <span className="font-semibold text-slate-900 dark:text-zinc-100 text-right">
                        {workflow.metadata?.sales_rep || "Steve (Sales Rep)"}
                      </span>
                    </div>
                    <div className="p-3.5 flex justify-between gap-2 bg-slate-50/50 dark:bg-zinc-900/30">
                      <span className="text-muted-foreground font-medium">Quote / Contract Accepted</span>
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-right">
                        {workflow.metadata?.quote_number || workflow.reference_id || "QT-ACCEPTED"}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-zinc-800/60">
                    <div className="p-3.5 flex justify-between gap-2">
                      <span className="text-muted-foreground font-medium">PO Gateway Decision</span>
                      <span className="font-semibold text-right">
                        {workflow.metadata?.po_required ? (
                          <Badge variant="outline" className="bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300">
                            PO Required (Yes)
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-slate-50 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">
                            Direct Invoicing (No PO)
                          </Badge>
                        )}
                      </span>
                    </div>
                    <div className="p-3.5 flex justify-between gap-2 bg-slate-50/50 dark:bg-zinc-900/30">
                      <span className="text-muted-foreground font-medium">Customer PO Reference #</span>
                      <span className="font-mono font-semibold text-slate-900 dark:text-zinc-100 text-right">
                        {workflow.metadata?.po_number || (workflow.metadata?.po_required ? "Pending Collection" : "Not Required")}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-zinc-800/60">
                    <div className="p-3.5 flex justify-between gap-2">
                      <span className="text-muted-foreground font-medium">Billing Terms</span>
                      <span className="font-semibold text-slate-900 dark:text-zinc-100 text-right">
                        {workflow.metadata?.payment_terms || "Net 30 Days"}
                      </span>
                    </div>
                    <div className="p-3.5 flex justify-between gap-2 bg-slate-50/50 dark:bg-zinc-900/30">
                      <span className="text-muted-foreground font-medium">Order Fulfillment Status</span>
                      <span className="font-semibold text-right">
                        {workflow.metadata?.order_fulfilled ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">Fulfilled & AR Updated</span>
                        ) : (
                          <span className="text-slate-500 font-medium">Pending Settlement</span>
                        )}
                      </span>
                    </div>
                  </div>
                </>
              )}
    </>
  );
}
