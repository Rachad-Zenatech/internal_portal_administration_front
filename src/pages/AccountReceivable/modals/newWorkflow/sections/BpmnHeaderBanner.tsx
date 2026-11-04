import { ShoppingCart, Plus, Trash2, CheckCircle2, FileText, Sparkles, Loader2, Landmark, User, HelpCircle } from "lucide-react";
import { Button } from "../../../../../components/ui/button";
import { Badge } from "../../../../../components/ui/badge";
import { Input } from "../../../../../components/ui/input";
import { Label } from "../../../../../components/ui/label";
import { UserAutocomplete } from "../../../fields/UserAutocomplete";
import { CurrencyAutocomplete } from "../../../../Purchasing/fields/CurrencyAutocomplete";
import { GLCodeAutocomplete } from "../../../../Purchasing/fields/GLCodeAutocomplete";
import type { NewWorkflowState } from "../hooks/useNewWorkflow";

export function BpmnHeaderBanner({ s }: { s: NewWorkflowState }) {
  const { currency, lineItems, calculateLineItemsTotal, handleAddLineItem, handleRemoveLineItem, handleUpdateLineItem, setCurrency, setPaymentTerms, paymentTerms, templateLoadedMsg, isTemplateLoading, setPoNumber, poNumber, poRequired, setPoRequired, setAccountNumber, accountNumber, setQuoteNumber, quoteNumber, setSalesRep, salesRep, selectedType } = s;
  return (
    <>
      {selectedType === "INITIAL_SALE" && (
              <div className="space-y-4 border border-blue-500/20 bg-blue-500/5 p-4 rounded-xl">
                {/* BPMN Header Banner */}
                <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-blue-500/20">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      <ShoppingCart className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-foreground">
                        Initial Sale • Sales Order & Invoicing Pipeline
                      </h4>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-300">
                    Quote / Contract Accepted
                  </Badge>
                </div>

                {/* Sales Rep, Quote Reference & Account # */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 items-start">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-blue-500" />
                      Sales Representative <span className="text-red-500 font-bold">*</span>
                    </Label>
                    <UserAutocomplete
                      value={salesRep}
                      onChange={(val) => setSalesRep(val)}
                      placeholder="Select Sales Representative..."
                      roleHint="Sales representative originator"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-blue-500" />
                      Quote / Sales Order #
                    </Label>
                    <Input
                      placeholder="e.g. QTE-2026-0912 / SO-1049"
                      value={quoteNumber}
                      onChange={(e) => setQuoteNumber(e.target.value)}
                      className="h-8 text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Landmark className="w-3.5 h-3.5 text-blue-500" />
                      A/R GL Account <span className="text-red-500 font-bold">*</span>
                    </Label>
                    <GLCodeAutocomplete
                      value={accountNumber || "1100"}
                      onChange={(val) => setAccountNumber(val)}
                      placeholder="Select A/R GL Account..."
                      showDetailCard={false}
                    />
                  </div>
                </div>

                {/* BPMN Gateway: PO Required? */}
                <div className="p-3.5 rounded-xl bg-background/90 border border-blue-500/30 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
                        <HelpCircle className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                          <span>PO Required Gateway</span>
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400">
                            BPMN Rule
                          </Badge>
                        </div>
                        <span className="text-[11px] text-muted-foreground">Does the customer mandate an official Purchase Order prior to invoicing?</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-zinc-800 p-1 rounded-lg border border-border">
                      <button
                        type="button"
                        onClick={() => setPoRequired(false)}
                        className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                          !poRequired
                            ? "bg-white dark:bg-zinc-900 text-foreground shadow-2xs"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        No PO Required
                      </button>
                      <button
                        type="button"
                        onClick={() => setPoRequired(true)}
                        className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                          poRequired
                            ? "bg-blue-600 text-white shadow-2xs"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        Yes, PO Required
                      </button>
                    </div>
                  </div>

                  {poRequired ? (
                    <div className="pt-2.5 border-t border-border/60 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                      <div className="sm:col-span-5 space-y-1">
                        <Label className="text-[11px] text-foreground font-semibold">
                          Customer Purchase Order (PO) # <span className="text-red-500 font-bold">*</span>
                        </Label>
                        <Input
                          placeholder="e.g. PO-CUST-88392"
                          value={poNumber}
                          onChange={(e) => setPoNumber(e.target.value)}
                          className="h-8 text-xs font-mono border-blue-400 focus-visible:ring-blue-500"
                          required
                        />
                      </div>
                      <div className="sm:col-span-7 text-[11px] text-blue-700 dark:text-blue-300 bg-blue-500/10 p-2.5 rounded-lg border border-blue-500/20">
                        <span>PO reference will be verified by Account Receivable assigned user and printed directly on the generated invoice.</span>
                      </div>
                    </div>
                  ) : (
                    <div className="pt-2 border-t border-border/60 text-[11px] text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20 flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Direct Invoicing Path: Workflow will advance directly to invoice dispatch upon submission.</span>
                    </div>
                  )}
                </div>

                {/* Payment Terms & Currency Header Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 pb-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-blue-500" />
                      <span>Product & Service Line Items (Linked Customer Template)</span>
                    </h4>
                    {isTemplateLoading ? (
                      <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-300 animate-pulse flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Fetching Saved Template...</span>
                      </Badge>
                    ) : templateLoadedMsg ? (
                      <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-300 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-emerald-500" />
                        <span>Recurring Template Linked</span>
                      </Badge>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <Label className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
                        Terms:
                      </Label>
                      <select
                        value={paymentTerms}
                        onChange={(e) => setPaymentTerms(e.target.value)}
                        className="h-8 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
                      >
                        <option value="Due on Receipt">Due on Receipt</option>
                        <option value="Net 15">Net 15</option>
                        <option value="Net 30">Net 30</option>
                        <option value="Net 60">Net 60</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Label className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
                        Currency:
                      </Label>
                      <div className="w-44">
                        <CurrencyAutocomplete
                          value={currency}
                          onChange={setCurrency}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Line Items Table */}
                <div className="space-y-2.5">
                  <div className="grid grid-cols-12 gap-2 text-[10.5px] font-bold text-muted-foreground uppercase px-2 py-1 bg-muted/40 rounded-md border border-border/40 items-center">
                    <span className="col-span-6">Item Description</span>
                    <span className="col-span-2">Quantity</span>
                    <span className="col-span-2">Unit Price</span>
                    <span className="col-span-1 text-right">Subtotal</span>
                    <span className="col-span-1 text-center">Action</span>
                  </div>

                  {lineItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-12 gap-2 items-center bg-background p-2 rounded-lg border border-border/80 shadow-2xs"
                    >
                      <Input
                        placeholder="Item or service description..."
                        value={item.description || item.item_description || ""}
                        onChange={(e) =>
                          handleUpdateLineItem(idx, "description", e.target.value)
                        }
                        className="col-span-6 h-8 text-xs"
                        required
                      />
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity || item.default_quantity || 1}
                        onChange={(e) =>
                          handleUpdateLineItem(
                            idx,
                            "quantity",
                            parseFloat(e.target.value) || 1
                          )
                        }
                        className="col-span-2 h-8 text-xs font-mono text-center px-1"
                        required
                      />
                      <Input
                        type="number"
                        step="0.01"
                        value={item.unit_price || 0}
                        onChange={(e) =>
                          handleUpdateLineItem(
                            idx,
                            "unit_price",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="col-span-2 h-8 text-xs font-mono"
                        required
                      />
                      <div className="col-span-1 text-right font-mono text-xs font-bold text-foreground truncate">
                        ${(Number(item.amount) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveLineItem(idx)}
                          disabled={lineItems.length <= 1}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  <div className="flex items-center justify-between pt-2 px-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddLineItem}
                      className="h-8 text-xs gap-1.5 border-dashed"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Line Item</span>
                    </Button>
                    <div className="flex items-center gap-3 bg-blue-50/60 dark:bg-blue-950/30 px-3.5 py-1.5 rounded-lg border border-blue-200 dark:border-blue-800/60">
                      <span className="text-xs font-semibold text-muted-foreground">
                        Total Order Amount:
                      </span>
                      <span className="font-mono text-sm font-bold text-blue-700 dark:text-blue-300">
                        ${calculateLineItemsTotal(lineItems).toLocaleString(undefined, { minimumFractionDigits: 2 })} {currency}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
    </>
  );
}
