import { toast } from "sonner";
import { CheckCircle2, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PurchaseRequestsState } from "../hooks/usePurchaseRequestsPage";

export function ProductLinkField({ s }: { s: PurchaseRequestsState }) {
  const { extractedProductInfo, setForm, isExtractingUrl, form, handleUrlExtraction, urlExtractionTimeoutRef, itemMode } = s;
  return (
    <>
      {(form.request_type === "ACCOUNTS_PAYABLE" || form.request_type === "RECURRING" || itemMode === "SINGLE") && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    <span>Product / Website Link</span>
                    <span className="text-slate-400 font-normal text-[11px]">(Auto-fills Title, Price & Details)</span>
                  </label>
                  {isExtractingUrl && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-primary animate-pulse">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>Extracting details...</span>
                    </span>
                  )}
                </div>

                <div className="relative">
                  <Input
                    value={form.item_url ?? ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setForm({ ...form, item_url: val });
                      if (urlExtractionTimeoutRef.current) {
                        clearTimeout(urlExtractionTimeoutRef.current);
                      }
                      if (val && val.trim().length > 10) {
                        urlExtractionTimeoutRef.current = setTimeout(() => {
                          handleUrlExtraction(val);
                        }, 700);
                      }
                    }}
                    onBlur={(e) => {
                      if (e.target.value && e.target.value.trim().length > 10) {
                        handleUrlExtraction(e.target.value);
                      }
                    }}
                    placeholder="https://www.amazon.ca/... (paste product link to auto-populate title & pricing)"
                    className="h-9 text-base sm:text-xs pr-24 font-mono"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={isExtractingUrl || !form.item_url}
                    onClick={() => {
                      if (form.item_url) {
                        handleUrlExtraction(form.item_url, true);
                      }
                    }}
                    className="absolute right-1 top-1 h-7 px-2 text-[11px] text-primary hover:text-primary hover:bg-primary/10 gap-1 font-semibold"
                  >
                    {isExtractingUrl ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Sparkles className="h-3 w-3" />
                    )}
                    <span>{isExtractingUrl ? "Extracting" : "Auto-fill"}</span>
                  </Button>
                </div>

                {/* AI Extracted Product Preview Banner */}
                {extractedProductInfo && extractedProductInfo.name && extractedProductInfo.name !== "N/A" && (
                  <div className="p-2.5 rounded-lg border border-emerald-500/30 bg-emerald-50/70 dark:bg-emerald-950/20 flex items-start justify-between gap-2 text-xs animate-in fade-in duration-200">
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 font-semibold text-emerald-800 dark:text-emerald-300 text-[11px]">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span>AI Auto-Populated from Product Link</span>
                      </div>
                      <div className="font-medium text-foreground truncate text-xs" title={extractedProductInfo.name}>
                        {extractedProductInfo.name}
                      </div>
                      <div className="text-[11px] text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-0.5 break-words">
                        {extractedProductInfo.price && extractedProductInfo.price !== "N/A" && (
                          <span>Price: <strong className="text-foreground font-mono">{extractedProductInfo.price.startsWith("$") ? extractedProductInfo.price : `$${extractedProductInfo.price}`} {extractedProductInfo.currency && extractedProductInfo.currency !== "N/A" ? extractedProductInfo.currency : ""}</strong></span>
                        )}
                        {extractedProductInfo.vendor && extractedProductInfo.vendor !== "N/A" && (
                          <span>• Vendor: <strong className="text-foreground">{extractedProductInfo.vendor}</strong></span>
                        )}
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setForm((prev) => ({
                          ...prev,
                          title: extractedProductInfo.name,
                          unit_price: parseFloat(extractedProductInfo.price) || prev.unit_price,
                          amount: (parseFloat(extractedProductInfo.price) || 0) * (prev.quantity || 1) || prev.amount,
                          currency: extractedProductInfo.currency || prev.currency,
                          description: extractedProductInfo.description || prev.description,
                        }));
                        toast.success("Re-applied extracted title & details to request");
                      }}
                      className="h-6 text-[10px] px-2 shrink-0 border-emerald-300 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:text-emerald-300"
                    >
                      Re-Apply
                    </Button>
                  </div>
                )}
              </div>
            )}
    </>
  );
}
