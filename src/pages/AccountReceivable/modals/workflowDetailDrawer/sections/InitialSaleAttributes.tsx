import { FileText } from "lucide-react";
import type { WorkflowDetailDrawerViewState } from "../hooks/useWorkflowDetailDrawerTail";

export function InitialSaleAttributes({ v }: { v: WorkflowDetailDrawerViewState }) {
  const { workflow, activeTab } = v;
  return (
    <>
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
    </>
  );
}
