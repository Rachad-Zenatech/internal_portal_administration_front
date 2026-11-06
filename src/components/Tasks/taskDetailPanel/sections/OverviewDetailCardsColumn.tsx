import { renderPaymentMethodBadge } from "@/utils/glAccountUtils";
import { Badge } from "../../../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ExternalLink, FileText, Package, ReceiptText, User, Building2, Tag, Layers } from "lucide-react";
import { LinkifiedText } from "@/components/common/LinkifiedText";
import HelpIcon from "@/components/ui/HelpIcon";
import { formatDate, formatRequestType } from "@/pages/Purchasing/utils/purchasingMeta";
import { DetailField } from "../components/DetailField";
import type { TaskDetailPanelViewState } from "../hooks/useTaskDetailPanelTail";

export function OverviewDetailCardsColumn({ v }: { v: TaskDetailPanelViewState }) {
  const { task, formatGLCode, totalAmount, unitPrice, quantity, parsedQuoteData, parsedProductInfo, afterTaxAmount, isRecurring, isMulti, rawItems } = v;
  return (
    <div className="lg:col-span-7 space-y-6">
              {/* Request Details Card */}
              <Card className="border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
                <CardHeader className="py-3 px-4 border-b border-slate-100 dark:border-zinc-800">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-800 dark:text-zinc-200">
                    <FileText className="h-4 w-4 text-primary" /> Request Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                  <DetailField label="Requester" value={task.requester_name || task.requester} icon={User} />
                  <DetailField label="Department" value={task.department} icon={Building2} />
                  <DetailField label="Type" value={formatRequestType(task.category || task.request_type)} icon={Layers} />
                  {(task.wire_transfer?.category || (task as any)?.payment_type || task.request_type === "ACCOUNTS_PAYABLE") && (
                    <DetailField
                      label="Payment Type"
                      value={task.wire_transfer?.category || (task as any)?.payment_type || "Others"}
                      badge
                    />
                  )}
                  {!isRecurring && (
                    <DetailField
                      label="Configuration"
                      value={
                        isMulti ? (
                          <Badge variant="outline" className="text-xs bg-indigo-50/50 text-indigo-700 border-indigo-200">
                            Multi Parts ({rawItems.length} parts)
                          </Badge>
                        ) : (
                          "Single Item"
                        )
                      }
                    />
                  )}
                  <DetailField label="Assigned To" value={task.assignee_name} icon={User} />
                  {!isRecurring && <DetailField label="GL Code" value={formatGLCode(task.gl_code)} icon={Tag} badge />}
                  <DetailField label="Requested Date" value={task.created_at ? formatDate(task.created_at) : null} />
                  <DetailField label="Last Updated" value={task.updated_at ? formatDate(task.updated_at) : null} />
                  {!isMulti && !isRecurring && (
                    <>
                      <DetailField label="Quantity" value={quantity} />
                      <DetailField label="Unit Price" value={`$${unitPrice.toFixed(2)}`} />
                    </>
                  )}
                  <DetailField label="Total (Pre-Tax)" value={`$${totalAmount.toFixed(2)}`} />
                  <DetailField label="Total (After-Tax)" value={`$${afterTaxAmount.toFixed(2)}`} />
                  <DetailField label="Currency" value={task.currency || "USD"} />

                  {task.description && (
                    <div className="col-span-2 sm:col-span-3 pt-2 border-t border-slate-100 dark:border-zinc-800">
                      <div className="text-xs font-medium text-slate-500 dark:text-zinc-400 mb-1">Description</div>
                      <p className="text-sm text-slate-700 dark:text-zinc-300 whitespace-pre-wrap">{task.description}</p>
                    </div>
                  )}

                  {task.item_url && (
                    <div className="col-span-2 sm:col-span-3 pt-2 border-t border-slate-100 dark:border-zinc-800">
                      <div className="text-xs font-medium text-slate-500 dark:text-zinc-400 mb-1.5">Product / Vendor Link</div>
                      <a
                        href={task.item_url.startsWith("http") ? task.item_url : `https://${task.item_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex max-w-full items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800 transition-colors"
                      >
                        <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                        <span className="min-w-0 truncate">Open Product Page ({task.item_url})</span>
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* AI Product Analysis Card */}
              {parsedProductInfo && task.status !== "INITIAL" && task.status !== "Draft" && (
                <Card className="border-indigo-100 bg-indigo-50/40 dark:border-indigo-900/50 dark:bg-indigo-950/20 shadow-sm">
                  <CardHeader className="py-3 px-4 border-b border-indigo-100 dark:border-indigo-900/50">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2 text-indigo-900 dark:text-indigo-100">
                      <Package className="h-4 w-4" /> AI Product Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 grid grid-cols-2 gap-4 text-sm">
                    <div className="col-span-2">
                      <div className="text-xs text-indigo-500 dark:text-indigo-400 font-medium mb-1">Product Title</div>
                      <div className="font-semibold text-slate-900 dark:text-slate-100">{parsedProductInfo.name}</div>
                    </div>
                    <div>
                      <div className="text-xs text-indigo-500 dark:text-indigo-400 font-medium mb-1">Extracted Price</div>
                      <div className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {parsedProductInfo.price} {parsedProductInfo.currency && parsedProductInfo.currency !== "N/A" ? parsedProductInfo.currency : ""}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-indigo-500 dark:text-indigo-400 font-medium mb-1">Brand</div>
                      <div className="text-slate-700 dark:text-slate-300">{parsedProductInfo.brand}</div>
                    </div>
                    <div>
                      <div className="text-xs text-indigo-500 dark:text-indigo-400 font-medium mb-1">Vendor</div>
                      <div className="text-slate-700 dark:text-slate-300">{parsedProductInfo.vendor}</div>
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs text-indigo-500 dark:text-indigo-400 font-medium mb-1">Category</div>
                      <Badge variant="outline" className="bg-white dark:bg-zinc-900 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 max-w-full truncate block" title={parsedProductInfo.category}>
                        {parsedProductInfo.category}
                      </Badge>
                    </div>
                    {parsedProductInfo.description && (
                      <div className="col-span-2">
                        <div className="text-xs text-indigo-500 dark:text-indigo-400 font-medium mb-1">Summary</div>
                        <div className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">{parsedProductInfo.description}</div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Purchase Order Card */}
              {task.purchase_order && (() => {
                const po = task.purchase_order;
                const rawItems = (task.items && task.items.length > 0)
                  ? task.items
                  : (parsedQuoteData?.items || parsedQuoteData?.line_items || []);
                const isMultiPO = task.item_mode === "MULTIPLE" || rawItems.length > 0;
                const poItemsSum = rawItems.reduce((acc: number, itm: any) => acc + (Number(itm.total) || 0), 0);
                const poShipping = Number(parsedQuoteData?.totals?.shipping || 0) || (Number(po.amount || totalAmount) > poItemsSum && poItemsSum > 0 ? Math.round((Number(po.amount || totalAmount) - poItemsSum) * 100) / 100 : 0);

                return (
                  <Card className="border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
                    <CardHeader className="py-3 px-4 border-b border-slate-100 dark:border-zinc-800">
                      <CardTitle className="text-sm font-semibold flex items-center justify-between gap-2 text-slate-800 dark:text-zinc-200">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-emerald-600" /> Purchase Order #{po.id}
                        </div>
                        {isMultiPO && (
                          <Badge variant="outline" className="text-xs bg-indigo-50/50 text-indigo-700 border-indigo-200">
                            Multi Parts ({rawItems.length} parts)
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4 text-sm">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        <DetailField label="Vendor" value={po.vendor} />
                        <DetailField label="Item" value={po.item} />
                        <DetailField label="Quote / PO #" value={po.quote_number} />
                        {!isMultiPO && (
                          <>
                            <DetailField label="Quantity" value={po.quantity || quantity} />
                            <DetailField label="Unit Price" value={`$${Number(po.unit_price || unitPrice).toFixed(2)}`} />
                          </>
                        )}
                        <DetailField label="PO Amount" value={`$${Number(po.amount || totalAmount).toFixed(2)}`} />
                        {poShipping > 0 && (
                          <DetailField label="Shipping Fee" value={`$${Number(poShipping).toFixed(2)}`} />
                        )}
                        <DetailField label="Payment Format" value={po.payment_method ? renderPaymentMethodBadge(po.payment_method) : "—"} />
                        <DetailField label="GL Code" value={formatGLCode(po.gl_code || task.gl_code)} badge />
                        <DetailField label="Shipped To" value={po.shipped_to_location} />
                        <DetailField label="Approval" value={po.approval_status} />
                        <DetailField label="Tracking #" value={po.tracking_number} />
                        <DetailField
                          label="Goods Received"
                          value={po.goods_received ? `Yes (${po.goods_received_at ? formatDate(po.goods_received_at) : "Received"})` : "No"}
                        />
                      </div>

                      {/* Embedded Line Items Table for Multiple Parts */}
                      {isMultiPO && rawItems.length > 0 && (
                        <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 space-y-2">
                          <div className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                            Line Items &amp; Parts Breakdown ({rawItems.length})
                          </div>
                          <div className="overflow-hidden rounded-md border border-slate-200 dark:border-zinc-700">
                            <Table>
                              <TableHeader className="bg-slate-50 dark:bg-zinc-800/80">
                                <TableRow>
                                  <TableHead className="w-10 text-xs font-semibold text-center">#</TableHead>
                                  <TableHead className="w-28 text-xs font-semibold">SKU</TableHead>
                                  <TableHead className="text-xs font-semibold">Description</TableHead>
                                  <TableHead className="w-16 text-xs font-semibold text-right">Qty</TableHead>
                                  <TableHead className="w-24 text-xs font-semibold text-right">Unit Price</TableHead>
                                  <TableHead className="w-24 text-xs font-semibold text-right">Total</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody className="divide-y divide-slate-100 dark:divide-zinc-800 text-xs">
                                {rawItems.map((itm: any, idx: number) => (
                                  <TableRow key={idx}>
                                    <TableCell className="text-center text-slate-400 font-mono text-[11px]">{idx + 1}</TableCell>
                                    <TableCell className="text-xs text-slate-500 font-mono">{itm.sku || "—"}</TableCell>
                                    <TableCell className="font-medium text-slate-900 dark:text-zinc-100 text-xs">
                                      <LinkifiedText text={itm.description} />
                                    </TableCell>
                                    <TableCell className="text-right text-xs">{itm.quantity ?? 1}</TableCell>
                                    <TableCell className="text-right font-mono text-xs">${Number(itm.unit_price || 0).toFixed(2)}</TableCell>
                                    <TableCell className="text-right font-semibold font-mono text-xs text-slate-900 dark:text-zinc-100">
                                      ${Number(itm.total ?? ((itm.quantity || 1) * (itm.unit_price || 0))).toFixed(2)}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })()}

              {/* Invoice Card */}
              {task.invoice && (
                <Card className="border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
                  <CardHeader className="py-3 px-4 border-b border-slate-100 dark:border-zinc-800">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-800 dark:text-zinc-200">
                      <ReceiptText className="h-4 w-4 text-indigo-600" /> Invoice #{task.invoice.id}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                    <DetailField label="Vendor" value={task.invoice.vendor} />
                    <DetailField label="Amount" value={`$${Number(task.invoice.amount || 0).toFixed(2)}`} />
                    <DetailField
                      label="Payment Status"
                      value={
                        task.invoice.paid_date || task.status === "COMPLETED" || task.invoice.payment_status === "PAID"
                          ? "PAID"
                          : task.invoice.payment_status === "WAITING_PAYMENT"
                          ? "WAITING_PAYMENT"
                          : task.invoice.payment_status || "UNPAID"
                      }
                      badge
                    />
                    <DetailField label="Bill Date" value={formatDate(task.invoice.invoice_date || task.invoice.paid_date)} />
                    <DetailField label="Date Arrived" value={formatDate(task.invoice.due_date || task.purchase_order?.goods_received_at)} />
                    <DetailField label="Paid Date" value={formatDate(task.invoice.paid_date)} />
                    <DetailField label="GL Code" value={formatGLCode(task.invoice.gl_code || task.gl_code)} badge />
                    <DetailField label={<span className="inline-flex items-center gap-1"><span>Asset Flag</span><HelpIcon text="Asset Flag designates whether this invoice represents a Capitalized Fixed Asset (CapEx) — such as equipment, hardware, lease/financing agreements, or software licenses — rather than an immediate operational expense (OpEx). When checked, the cost is capitalized on the balance sheet and depreciated/amortized over time instead of expensed in full in the current period. It automatically defaults to active for Scheduled Payments, Recurring obligations, and Accounts Payable." /></span>} value={task.invoice.asset_flag ? "Yes" : "No"} />
                  </CardContent>
                </Card>
              )}
            </div>
  );
}
