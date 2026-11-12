import { useState } from "react";
import { ExternalLink, Package, RefreshCw, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney } from "../../utils/purchasingMeta";
import { extractProductInfo } from "@/services/purchasingService";
import { toast } from "sonner";
import type { RequestDetailViewState } from "../hooks/useRequestDetailTail";
import { GlSuggestionsPanel } from "./GlSuggestionsPanel";

export function ProductVendorUrlAi({ v }: { v: RequestDetailViewState }) {
  const { request, crawledOrigCurr, crawledOrigPrice, hasCrawledForeignPrice, isDraft, purchase_order, setInvoice, setInvoiceItems, refetch } = v;

  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [isRetryingExtraction, setIsRetryingExtraction] = useState(false);

  const hasExtractedInfo = Boolean(request.product_info && request.product_info.name && request.product_info.name !== "N/A");
  // Extraction and the chart-of-accounts suggestions run once on the server (when the request is created, or in
  // the one-time startup pass for older requests) and are saved on it; the buttons below run them again.
  const runExtraction = () => {
    setIsRetryingExtraction(true);
    extractProductInfo(String(request.id))
      .then(() => {
        toast.success("Product specifications retrieved!");
        refetch?.();
      })
      .catch(() => toast.error("Could not fetch product information"))
      .finally(() => setIsRetryingExtraction(false));
  };

  const handleApplyGLCode = (accountNumber: string, accountName: string) => {
    const formattedCode = `${accountNumber} - ${accountName}`;
    if (setInvoice) {
      setInvoice((prev) => ({ ...prev, gl_code: formattedCode }));
    }
    if (setInvoiceItems) {
      setInvoiceItems((prev) =>
        prev.map((item) => ({ ...item, gl_code: formattedCode }))
      );
    }
    setAppliedCode(accountNumber);
    toast.success(`Applied GL Category "${formattedCode}" to invoice and line items`);
  };

  return (
    <>
      {(request.item_url || purchase_order?.item_url) && (
                    <div className="pt-4 border-t border-slate-100 dark:border-zinc-800 space-y-3">
                      <div className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                        Vendor Listing &amp; Product Extraction
                      </div>
                      <div className="flex flex-col gap-3">
                        <a
                          href={(request.item_url || purchase_order?.item_url || "").startsWith("http") ? (request.item_url || purchase_order?.item_url || "#") : `https://${request.item_url || purchase_order?.item_url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={request.item_url || purchase_order?.item_url || undefined}
                          className="inline-flex max-w-full items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800 transition-colors self-start"
                        >
                          <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                          <span className="min-w-0 truncate">Open Vendor Product Page</span>
                        </a>

                        {!isDraft && !hasExtractedInfo && (
                          <div className="flex items-center justify-between p-3 rounded-lg border border-dashed border-indigo-200 dark:border-indigo-800 bg-indigo-50/30 dark:bg-indigo-950/20 text-xs">
                            <div className="flex items-center gap-2">
                              <AlertCircle className="w-4 h-4 text-indigo-500 animate-pulse" />
                              <span className="text-slate-600 dark:text-zinc-300">
                                {isRetryingExtraction
                                  ? "Retrieving live product specifications and pricing in background..."
                                  : "Product extraction has not completed yet."}
                              </span>
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={isRetryingExtraction}
                              onClick={runExtraction}
                              className="h-7 text-xs border-indigo-300 text-indigo-700 hover:bg-indigo-100 dark:border-indigo-700 dark:text-indigo-300"
                            >
                              <RefreshCw className={`w-3 h-3 mr-1 ${isRetryingExtraction ? "animate-spin" : ""}`} />
                              {isRetryingExtraction ? "Extracting..." : "Retrieve Info Now"}
                            </Button>
                          </div>
                        )}

                        {!isDraft && request.product_info && (
                          <Card className="border-indigo-100 bg-indigo-50/50 dark:border-indigo-900/50 dark:bg-indigo-950/20 shadow-sm">
                            <CardHeader className="py-2.5 px-4 border-b border-indigo-100 dark:border-indigo-900/50">
                              <CardTitle className="text-sm font-semibold flex items-center justify-between text-indigo-900 dark:text-indigo-100">
                                <div className="flex items-center gap-2">
                                  <Package className="h-4 w-4 text-indigo-600" />
                                  <span>Extracted Product Information</span>
                                </div>
                                <Button type="button" size="sm" variant="ghost" disabled={isRetryingExtraction} onClick={runExtraction} className="h-6 px-2 text-[10px] text-indigo-700 dark:text-indigo-300">
                                  <RefreshCw className={`w-3 h-3 mr-1 ${isRetryingExtraction ? "animate-spin" : ""}`} />
                                  {isRetryingExtraction ? "Extracting..." : "Re-extract"}
                                </Button>
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                              <div className="sm:col-span-2">
                                <div className="text-xs text-indigo-500 dark:text-indigo-400 font-medium mb-0.5">Product Name</div>
                                <div className="font-medium text-slate-900 dark:text-slate-100">{request.product_info.name}</div>
                              </div>
                              <div>
                                <div className="text-xs text-indigo-500 dark:text-indigo-400 font-medium mb-0.5">Price</div>
                                <div className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-baseline gap-2 flex-wrap">
                                  <span>
                                    {request.product_info.price ? (request.product_info.price.startsWith("$") ? request.product_info.price : `$${request.product_info.price}`) : "—"}
                                    {request.product_info.currency && request.product_info.currency.toUpperCase() !== "N/A" ? ` ${request.product_info.currency}` : ""}
                                  </span>
                                  {hasCrawledForeignPrice && (
                                    <span className="text-xs font-semibold text-slate-600 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded border border-slate-200 dark:border-zinc-700">
                                      ({formatMoney(crawledOrigPrice!)} {crawledOrigCurr})
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-indigo-500 dark:text-indigo-400 font-medium mb-0.5">Brand</div>
                                <div className="text-slate-700 dark:text-slate-300">{request.product_info.brand}</div>
                              </div>
                              <div>
                                <div className="text-xs text-indigo-500 dark:text-indigo-400 font-medium mb-0.5">Vendor</div>
                                <div className="text-slate-700 dark:text-slate-300">{request.product_info.vendor}</div>
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs text-indigo-500 dark:text-indigo-400 font-medium mb-0.5">Category</div>
                                <Badge variant="outline" className="bg-white dark:bg-zinc-900 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 max-w-full truncate inline-block" title={request.product_info.category}>{request.product_info.category}</Badge>
                              </div>
                              {request.product_info.description && request.product_info.description !== "N/A" && (
                                <div className="sm:col-span-2">
                                  <div className="text-xs text-indigo-500 dark:text-indigo-400 font-medium mb-0.5">Description</div>
                                  <div className="text-slate-600 dark:text-slate-400 leading-relaxed text-xs">{request.product_info.description}</div>
                                </div>
                              )}

                              <GlSuggestionsPanel requestId={request.id} suggestions={request.gl_suggestions} appliedCode={appliedCode} onApply={handleApplyGLCode} refetch={refetch} />
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    </div>
                  )}
    </>
  );
}
