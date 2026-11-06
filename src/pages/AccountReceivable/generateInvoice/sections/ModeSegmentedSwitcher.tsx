import { Bookmark, Plus, Sparkles } from "lucide-react";
import { Button } from "../../../../components/ui/button";
import { Badge } from "../../../../components/ui/badge";
import { Input } from "../../../../components/ui/input";
import { Label } from "../../../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../components/ui/select";
import type { GenerateInvoiceState } from "../hooks/useGenerateInvoice";

export function ModeSegmentedSwitcher({ s }: { s: GenerateInvoiceState }) {
  const { invoiceNumber, currentInvoiceId, setApplySetAsDefault, applySetAsDefault, calculatedTotals, currency, lineItems, layoutStyle, setApplyNewPresetName, applyNewPresetName, sortedCustomerTemplates, setTargetTemplateIdToOverwrite, targetTemplateIdToOverwrite, setApplyTemplateMode, applyTemplateMode } = s;
  return (
    <div className="space-y-4 py-2">
            {/* Mode Segmented Switcher */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-muted/60 rounded-xl border border-border/60">
              <button
                type="button"
                onClick={() => setApplyTemplateMode("existing")}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  applyTemplateMode === "existing"
                    ? "bg-background text-foreground shadow-xs border border-border/80"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                }`}
              >
                <Bookmark className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Update Existing Preset</span>
              </button>
              <button
                type="button"
                onClick={() => setApplyTemplateMode("new")}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  applyTemplateMode === "new"
                    ? "bg-background text-foreground shadow-xs border border-border/80"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                }`}
              >
                <Plus className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Create New Preset</span>
              </button>
            </div>

            {applyTemplateMode === "existing" ? (
              <div className="space-y-3.5">
                {sortedCustomerTemplates.length === 0 ? (
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs space-y-2">
                    <p className="font-semibold">No existing saved presets found for this customer.</p>
                    <p className="text-[11px] opacity-90">
                      You can create a new preset to store these line items, notes, terms, and chosen layout styling for future invoices.
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setApplyTemplateMode("new")}
                      className="text-xs h-7 gap-1 bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 mt-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Switch to Create New Preset</span>
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-foreground">
                        Select Existing Preset to Overwrite <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={targetTemplateIdToOverwrite || sortedCustomerTemplates[0]?.id || ""}
                        onValueChange={(val) => {
                          setTargetTemplateIdToOverwrite(val);
                          const found = sortedCustomerTemplates.find((t) => t.id === val);
                          if (found) {
                            setApplySetAsDefault(!!found.is_default);
                          }
                        }}
                      >
                        <SelectTrigger className="h-9 text-xs bg-background">
                          <SelectValue placeholder="Choose preset to overwrite" />
                        </SelectTrigger>
                        <SelectContent>
                          {sortedCustomerTemplates.map((t) => (
                            <SelectItem key={t.id || 'default'} value={t.id || 'default'} className="text-xs">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{t.template_name || "Standard Template"}</span>
                                {t.layout_style && (
                                  <Badge variant="outline" className="text-[9px] px-1 py-0 uppercase">
                                    {t.layout_style === 'interlinkone' ? 'interlinkONE' : 'Pace+'}
                                  </Badge>
                                )}
                                {t.is_default && (
                                  <Badge variant="secondary" className="text-[9px] px-1 py-0 font-normal">
                                    Default
                                  </Badge>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Summary Info */}
                    <div className="p-3 bg-muted/40 rounded-xl border border-border/60 text-xs space-y-1.5">
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span>Active Layout Style:</span>
                        <span className="font-semibold text-foreground">
                          {layoutStyle === "interlinkone" ? "interlinkONE (Theme 2)" : "Pace+ (Theme 1)"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span>Line Items in Preset:</span>
                        <span className="font-semibold text-foreground">{lineItems.length} item(s)</span>
                      </div>
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span>Currency & Subtotal:</span>
                        <span className="font-semibold text-foreground">
                          {currency} ${calculatedTotals.newChargesSubtotal.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="apply-template-is-default-existing"
                        checked={applySetAsDefault}
                        onChange={(e) => setApplySetAsDefault(e.target.checked)}
                        className="rounded border-input text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
                      />
                      <Label htmlFor="apply-template-is-default-existing" className="text-xs text-foreground cursor-pointer">
                        Set as default template preset for this customer
                      </Label>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-3.5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">
                    New Preset Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    value={applyNewPresetName}
                    onChange={(e) => setApplyNewPresetName(e.target.value)}
                    placeholder="e.g. Monthly Retainer, Hardware Delivery, Software Support..."
                    className="text-xs h-9"
                    autoFocus
                  />
                </div>

                {/* Summary Info */}
                <div className="p-3 bg-muted/40 rounded-xl border border-border/60 text-xs space-y-1.5">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Active Layout Style:</span>
                    <span className="font-semibold text-foreground">
                      {layoutStyle === "interlinkone" ? "interlinkONE (Theme 2)" : "Pace+ (Theme 1)"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Line Items to Save:</span>
                    <span className="font-semibold text-foreground">{lineItems.length} item(s)</span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Currency & Subtotal:</span>
                    <span className="font-semibold text-foreground">
                      {currency} ${calculatedTotals.newChargesSubtotal.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="apply-template-is-default-new"
                    checked={applySetAsDefault}
                    onChange={(e) => setApplySetAsDefault(e.target.checked)}
                    className="rounded border-input text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
                  />
                  <Label htmlFor="apply-template-is-default-new" className="text-xs text-foreground cursor-pointer">
                    Set as default template preset for this customer
                  </Label>
                </div>
              </div>
            )}

            {currentInvoiceId && (
              <div className="text-[11px] text-blue-600 dark:text-blue-400 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg p-2.5 flex items-start gap-2">
                <Sparkles className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>
                  Applying changes will also update the saved snapshot for invoice <strong>{invoiceNumber || "snapshot"}</strong>.
                </span>
              </div>
            )}
          </div>
  );
}
