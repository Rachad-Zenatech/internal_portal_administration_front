import { Repeat } from "lucide-react";
import { Badge } from "../../../../components/ui/badge";
import type { WorkflowDetailViewState } from "../hooks/useWorkflowDetailTail";

export function AddOnSpecificMetadata({ v }: { v: WorkflowDetailViewState }) {
  const { workflow, currentType } = v;
  return (
    <>
      {currentType === "ADD_ON" && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-zinc-800/60">
                    <div className="p-3.5 flex justify-between gap-2">
                      <span className="text-muted-foreground font-medium">Sales Originator</span>
                      <span className="font-semibold text-slate-900 dark:text-zinc-100 text-right">
                        {workflow.metadata?.sales_rep || "Steve (Sales Rep)"}
                      </span>
                    </div>
                    <div className="p-3.5 flex justify-between gap-2 bg-slate-50/50 dark:bg-zinc-900/30">
                      <span className="text-muted-foreground font-medium">Parent Contract Reference</span>
                      <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-right">
                        {workflow.metadata?.parent_contract_id || "CTR-PARENT-ACTIVE"}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-zinc-800/60">
                    <div className="p-3.5 flex justify-between gap-2">
                      <span className="text-muted-foreground font-medium">Contract Renewal Date</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-zinc-100 text-right">
                        {workflow.metadata?.renewal_date || "End of Year"}
                      </span>
                    </div>
                    <div className="p-3.5 flex justify-between gap-2 bg-slate-50/50 dark:bg-zinc-900/30">
                      <span className="text-muted-foreground font-medium">Add-On Effective Date</span>
                      <span className="font-semibold text-slate-900 dark:text-zinc-100 text-right">
                        {workflow.metadata?.effective_date || "Immediate"}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-zinc-800/60">
                    <div className="p-3.5 flex justify-between gap-2">
                      <span className="text-muted-foreground font-medium">Extra Quantity Requested</span>
                      <span className="font-bold text-slate-900 dark:text-zinc-100 text-right">
                        +{workflow.metadata?.extra_quantity_requested || 1} Units / Licenses
                      </span>
                    </div>
                    <div className="p-3.5 flex justify-between gap-2 bg-slate-50/50 dark:bg-zinc-900/30">
                      <span className="text-muted-foreground font-medium">Prorated Charge (to Renewal)</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-right">
                        ${Number(workflow.metadata?.pro_rated_amount || workflow.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-zinc-800/60">
                    <div className="p-3.5 flex justify-between gap-2">
                      <span className="text-muted-foreground font-medium">Next Renewal Consolidated Total</span>
                      <span className="font-mono font-bold text-indigo-700 dark:text-indigo-300 text-right">
                        ${Number(workflow.metadata?.consolidated_renewal_amount || (Number(workflow.amount || 0) * 1.5)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="p-3.5 flex justify-between gap-2 bg-slate-50/50 dark:bg-zinc-900/30">
                      <span className="text-muted-foreground font-medium">Renewal Consolidation Status</span>
                      <span className="font-semibold text-right">
                        {workflow.metadata?.renewal_consolidated ? (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300">
                            Consolidated into Next Renewal
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300">
                            Pending Final Payment Settlement
                          </Badge>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* SVG Callout Banner */}
                  <div className="p-3.5 bg-indigo-50/70 dark:bg-indigo-950/40 text-xs text-indigo-900 dark:text-indigo-200 border-t border-indigo-100 dark:border-indigo-900/50 flex items-center gap-2">
                    <Repeat className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>
                      <strong>BPMN Workflow Note:</strong> Add-ons are prorated to align with the existing renewal date; totals consolidate at the next renewal.
                    </span>
                  </div>
                </>
              )}
    </>
  );
}
