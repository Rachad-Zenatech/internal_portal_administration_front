import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { FileText, Upload, AlertTriangle, Building2, CheckCircle2, Truck, Loader2 } from "lucide-react";
import { LinkifiedText } from "@/components/common/LinkifiedText";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatMoney } from "../../utils/purchasingMeta";
import type { RequestDetailViewState } from "../hooks/useRequestDetailTail";

export function Tab2LineItems({ v }: { v: RequestDetailViewState }) {
  const { statedGrandTotalUsd, isForeignQuote, quoteNativeCurrency, statedGrandTotalNative, quoteExchangeRate, quoteDiscountNative, quoteTaxNative, quoteShippingNative, itemsSumNative, calculatedQuoteTotalNative, totalsMatch, getItemGLCode, renderCategory, request, customerCompanyName, vendorCompanyName, extractQuoteMutation, quoteDetailFileInputRef, refetch, canEditRequest, hasItemsTab } = v;
  return (
    <>
      {hasItemsTab && (
              <TabsContent value="items" className="m-0 focus-visible:outline-none space-y-6">
                <Card className="border border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-b from-indigo-50/20 to-transparent shadow-sm">
                  <CardHeader className="pb-3 border-b border-indigo-100 dark:border-indigo-900/40">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-indigo-950 dark:text-indigo-200">
                        <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        <span className="font-semibold text-base">Items &amp; Parts Breakdown ({(request.items?.length || request.quote_data?.items?.length || 0)})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {canEditRequest && (
                          <>
                            <input
                              type="file"
                              ref={quoteDetailFileInputRef}
                              accept=".pdf"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                try {
                                  toast.info("Extracting and saving quote PDF to request...");
                                  await extractQuoteMutation.mutateAsync({ file, requestId: request.id });
                                  toast.success("Quote PDF uploaded, extracted, and saved to request!");
                                  refetch?.();
                                } catch (err: any) {
                                  toast.error(err?.message || "Failed to extract and save quote PDF");
                                } finally {
                                  if (quoteDetailFileInputRef.current) quoteDetailFileInputRef.current.value = "";
                                }
                              }}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={extractQuoteMutation.isPending}
                              onClick={() => quoteDetailFileInputRef.current?.click()}
                              className="h-7 text-xs px-2.5 gap-1.5 border-dashed border-indigo-300 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-300 cursor-pointer"
                            >
                              {extractQuoteMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                              <span>{extractQuoteMutation.isPending ? "Saving Quote..." : "Upload Quote PDF"}</span>
                            </Button>
                          </>
                        )}
                        <Badge variant="outline" className="bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border-indigo-200 font-mono text-xs font-semibold">
                          {isForeignQuote
                            ? `Currency: ${quoteNativeCurrency} (Converted @ 1 ${quoteNativeCurrency} = $${quoteExchangeRate} USD)`
                            : `Currency: ${quoteNativeCurrency || request.currency || "USD"}`}
                        </Badge>
                      </div>
                    </div>

                    {/* Company & Quote Metadata (if present) */}
                    {(vendorCompanyName || customerCompanyName || request.quote_data?.quote_number || request.quote_data?.quote_date) && (
                      <div className="text-xs text-slate-600 dark:text-zinc-400 flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-2 border-t border-indigo-100/60 dark:border-indigo-900/30 mt-1">
                        {vendorCompanyName && (
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                            <strong>Vendor:</strong>
                            <span className="font-medium text-slate-900 dark:text-zinc-100">{vendorCompanyName}</span>
                          </span>
                        )}
                        {customerCompanyName && (
                          <span><strong>Bill To:</strong> {customerCompanyName}</span>
                        )}
                        {request.quote_data?.quote_number && (
                          <span><strong>Quote Ref:</strong> <span className="font-mono font-medium text-slate-800 dark:text-zinc-200">{request.quote_data.quote_number}</span></span>
                        )}
                        {request.quote_data?.quote_date && (
                          <span><strong>Date:</strong> {request.quote_data.quote_date}</span>
                        )}
                        {request.quote_data?.valid_until && (
                          <span><strong>Valid Until:</strong> {request.quote_data.valid_until}</span>
                        )}
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4 pt-4">
                    <div className="rounded-lg border border-slate-200 dark:border-zinc-800 overflow-hidden">
                      <Table>
                        <TableHeader className="bg-slate-50 dark:bg-zinc-800/60">
                          <TableRow>
                            <TableHead className="w-10 text-center text-xs">#</TableHead>
                            <TableHead className="w-24 text-xs font-semibold">SKU / Part #</TableHead>
                            <TableHead className="text-xs font-semibold">Description</TableHead>
                            <TableHead className="w-16 text-right text-xs font-semibold">Qty</TableHead>
                            <TableHead className="w-28 text-right text-xs font-semibold">Unit Price ({quoteNativeCurrency})</TableHead>
                            <TableHead className="w-28 text-right text-xs font-semibold pr-6">Total ({quoteNativeCurrency})</TableHead>
                            <TableHead className="w-48 text-xs font-semibold pl-4 border-l border-slate-200 dark:border-zinc-700">Category</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(request.items?.length ? request.items : (request.quote_data?.items || [])).map((itm: any, idx: number) => {
                            const rawPrice = Number(itm.original_unit_price ?? itm.unit_price ?? 0);
                            const rawTot = Number(itm.original_total ?? itm.total ?? (rawPrice * (Number(itm.quantity) || 1)));
                            const convPrice = Number(itm.converted_unit_price ?? (rawPrice * quoteExchangeRate));
                            const convTot = Number(itm.converted_total ?? (rawTot * quoteExchangeRate));

                            return (
                              <TableRow key={itm.id || idx} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/30">
                                <TableCell className="text-xs text-slate-400 font-mono text-center">{idx + 1}</TableCell>
                                <TableCell className="text-xs text-slate-500 font-mono">{itm.sku || "—"}</TableCell>
                                <TableCell className="font-medium text-slate-900 dark:text-zinc-100 text-xs">
                                  <LinkifiedText text={itm.description} />
                                </TableCell>
                                <TableCell className="text-right text-xs text-slate-600 dark:text-zinc-400">{itm.quantity}</TableCell>
                                <TableCell className="text-right text-xs text-slate-600 dark:text-zinc-400">
                                  <div>{formatMoney(rawPrice)} {quoteNativeCurrency}</div>
                                  {isForeignQuote && (
                                    <div className="text-[10px] text-slate-400 font-mono">
                                      ({formatMoney(convPrice)})
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell className="text-right text-xs font-semibold font-mono text-slate-900 dark:text-zinc-100 pr-6">
                                  <div>{formatMoney(rawTot)} {quoteNativeCurrency}</div>
                                  {isForeignQuote && (
                                    <div className="text-[10px] text-slate-400 font-mono font-normal">
                                      ({formatMoney(convTot)})
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell className="text-xs text-slate-700 dark:text-zinc-300 pl-4 border-l border-slate-100 dark:border-zinc-800">
                                  {renderCategory(getItemGLCode(itm, idx))}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Totals Breakdown and Math Matching */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2 border-t border-slate-100 dark:border-zinc-800">
                      <div className="text-xs">
                        {totalsMatch ? (
                          <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 bg-emerald-50/80 dark:bg-emerald-950/40 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-900/60 font-medium">
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                            <span>
                              Calculated sum matches Grand Total ({formatMoney(statedGrandTotalNative)} {quoteNativeCurrency}
                              {isForeignQuote ? ` / ${formatMoney(statedGrandTotalUsd)}` : ""})
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-md border border-amber-200 dark:border-amber-900/60">
                            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                            <span>
                              Discrepancy: Calculated sum is {formatMoney(calculatedQuoteTotalNative)} {quoteNativeCurrency} vs stated {formatMoney(statedGrandTotalNative)} {quoteNativeCurrency}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="text-right space-y-1 text-xs min-w-[220px]">
                        <div className="text-slate-500 flex justify-between gap-4">
                          <span>Items Subtotal:</span>
                          <span className="font-medium font-mono text-slate-700 dark:text-zinc-300">
                            {formatMoney(itemsSumNative)} {quoteNativeCurrency}
                            {isForeignQuote && <span className="text-[10px] text-slate-400 ml-1">({formatMoney(itemsSumNative * quoteExchangeRate)})</span>}
                          </span>
                        </div>
                        {quoteShippingNative > 0 && (
                          <div className="text-slate-600 dark:text-zinc-300 flex justify-between gap-4 font-medium">
                            <span className="flex items-center gap-1"><Truck className="h-3 w-3 text-indigo-500" /> Shipping Fee:</span>
                            <span className="font-mono">
                              {formatMoney(quoteShippingNative)} {quoteNativeCurrency}
                              {isForeignQuote && <span className="text-[10px] text-slate-400 ml-1">({formatMoney(quoteShippingNative * quoteExchangeRate)})</span>}
                            </span>
                          </div>
                        )}
                        {quoteTaxNative > 0 && (
                          <div className="text-slate-500 flex justify-between gap-4">
                            <span>Tax &amp; Fees:</span>
                            <span className="font-medium font-mono">
                              {formatMoney(quoteTaxNative)} {quoteNativeCurrency}
                              {isForeignQuote && <span className="text-[10px] text-slate-400 ml-1">({formatMoney(quoteTaxNative * quoteExchangeRate)})</span>}
                            </span>
                          </div>
                        )}
                        {quoteDiscountNative > 0 && (
                          <div className="text-emerald-600 flex justify-between gap-4">
                            <span>Discount:</span>
                            <span className="font-medium font-mono">
                              -{formatMoney(quoteDiscountNative)} {quoteNativeCurrency}
                              {isForeignQuote && <span className="text-[10px] text-emerald-500 ml-1">(-{formatMoney(quoteDiscountNative * quoteExchangeRate)})</span>}
                            </span>
                          </div>
                        )}
                        <div className="pt-1.5 border-t border-slate-200 dark:border-zinc-800 text-sm flex justify-between gap-4 items-baseline">
                          <span className="text-slate-900 dark:text-zinc-100 font-semibold">Grand Total:</span>
                          <div className="text-right">
                            <div className="font-bold text-slate-900 dark:text-zinc-100 text-base font-mono">
                              {formatMoney(statedGrandTotalNative)} {quoteNativeCurrency}
                            </div>
                            {isForeignQuote && (
                              <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                                ({formatMoney(statedGrandTotalUsd)})
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
    </>
  );
}
