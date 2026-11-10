import { useEffect, useState } from "react";
import { ExternalLink, Package, Sparkles, Check, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney } from "../../utils/purchasingMeta";
import { ChartOfAccountService } from "@/services/ChartOfAccountService";
import { toast } from "sonner";
import type { RequestDetailViewState } from "../hooks/useRequestDetailTail";

export function ProductVendorUrlAi({ v }: { v: RequestDetailViewState }) {
  const { request, crawledOrigCurr, crawledOrigPrice, hasCrawledForeignPrice, isDraft, purchase_order, setInvoice, setInvoiceItems } = v;

  const [predictionData, setPredictionData] = useState<{
    best_category: string;
    best_account_number: string;
    best_account_name: string;
    suggestions: Array<{
      account_number: string;
      account_name: string;
      confidence: number;
      reason: string;
      source: string;
      is_best_match: boolean;
    }>;
    evidence_summary: string;
  } | null>(null);
  const [loadingPrediction, setLoadingPrediction] = useState(false);
  const [appliedCode, setAppliedCode] = useState<string | null>(null);

  // Auto-fetch Top 3 GL suggestions when product info is present
  useEffect(() => {
    if (!request.product_info) return;

    let isMounted = true;
    setLoadingPrediction(true);

    const priceNum = request.product_info.price
      ? parseFloat(String(request.product_info.price).replace(/[^0-9.]/g, ""))
      : request.amount || undefined;

    ChartOfAccountService.getPredictedGLSuggestions({
      product_name: request.product_info.name || request.title,
      vendor: request.product_info.vendor || purchase_order?.vendor || "",
      amount: isNaN(priceNum as any) ? undefined : priceNum,
      category: request.product_info.category || undefined,
      description: request.product_info.description || request.description || undefined,
      item_url: request.item_url || purchase_order?.item_url || undefined,
    })
      .then((res) => {
        if (isMounted) {
          setPredictionData(res);
        }
      })
      .catch((err) => {
        console.warn("Could not fetch GL predictions:", err);
      })
      .finally(() => {
        if (isMounted) setLoadingPrediction(false);
      });

    return () => {
      isMounted = false;
    };
  }, [
    request.product_info,
    request.title,
    request.amount,
    request.description,
    request.item_url,
    purchase_order?.vendor,
    purchase_order?.item_url,
  ]);

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

                        {!isDraft && request.product_info && (
                          <Card className="border-indigo-100 bg-indigo-50/50 dark:border-indigo-900/50 dark:bg-indigo-950/20 shadow-sm">
                            <CardHeader className="py-2.5 px-4 border-b border-indigo-100 dark:border-indigo-900/50">
                              <CardTitle className="text-sm font-semibold flex items-center justify-between text-indigo-900 dark:text-indigo-100">
                                <div className="flex items-center gap-2">
                                  <Package className="h-4 w-4 text-indigo-600" />
                                  <span>Extracted Product Information</span>
                                </div>
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

                              {/* Top 3 Predicted GL Code Suggestions (from Finance 5-step + MongoDB Atlas) */}
                              <div className="sm:col-span-2 pt-3 border-t border-indigo-100/80 dark:border-indigo-900/50 space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 dark:text-indigo-200">
                                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                    <span>AI Suggested Chart of Accounts (Top 3 Candidates)</span>
                                  </div>
                                  <span className="text-[10px] text-muted-foreground">
                                    Click any suggestion to apply to Invoice Category
                                  </span>
                                </div>

                                {loadingPrediction ? (
                                  <div className="text-xs text-slate-500 animate-pulse py-1">
                                    Running Finance 5-step classification &amp; MongoDB Atlas vector analysis...
                                  </div>
                                ) : predictionData && predictionData.suggestions.length > 0 ? (
                                  <div className="space-y-2">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                      {predictionData.suggestions.map((s, idx) => {
                                        const isApplied = appliedCode === s.account_number;
                                        return (
                                          <div
                                            key={s.account_number}
                                            onClick={() => handleApplyGLCode(s.account_number, s.account_name)}
                                            className={`group relative p-2.5 rounded-lg border text-left cursor-pointer transition-all shadow-sm ${
                                              idx === 0
                                                ? "bg-amber-50/90 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 hover:border-amber-400"
                                                : "bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 hover:border-indigo-300 dark:hover:border-indigo-700"
                                            } ${isApplied ? "ring-2 ring-emerald-500" : ""}`}
                                          >
                                            <div className="flex items-center justify-between gap-1 mb-1">
                                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-mono">
                                                {s.account_number}
                                              </span>
                                              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                                                {(s.confidence * 100).toFixed(0)}% match
                                              </span>
                                            </div>
                                            <div className="text-xs font-semibold text-slate-800 dark:text-zinc-200 line-clamp-1" title={s.account_name}>
                                              {s.account_name}
                                            </div>
                                            <p className="text-[10px] text-slate-500 dark:text-zinc-400 mt-1 line-clamp-2 leading-tight">
                                              {s.reason}
                                            </p>
                                            <div className="mt-2 pt-1 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-[10px] font-medium">
                                              <span className={idx === 0 ? "text-amber-700 dark:text-amber-400 font-bold" : "text-slate-400"}>
                                                {idx === 0 ? "★ Best Match" : `Option #${idx + 1}`}
                                              </span>
                                              <span className="flex items-center gap-0.5 text-indigo-600 dark:text-indigo-400 group-hover:translate-x-0.5 transition-transform">
                                                {isApplied ? (
                                                  <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                                                    <Check className="w-3 h-3" /> Applied
                                                  </span>
                                                ) : (
                                                  <>
                                                    Use this <ArrowRight className="w-2.5 h-2.5" />
                                                  </>
                                                )}
                                              </span>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                    <div className="text-[10px] text-slate-500 dark:text-zinc-400 italic">
                                      {predictionData.evidence_summary}
                                    </div>
                                  </div>
                                ) : (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleApplyGLCode("6340", "Office Expense:Office Supplies")}
                                    className="h-7 text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-100"
                                  >
                                    <Sparkles className="w-3 h-3 mr-1 text-amber-500" />
                                    Default to 6340 (Office Supplies)
                                  </Button>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    </div>
                  )}
    </>
  );
}
