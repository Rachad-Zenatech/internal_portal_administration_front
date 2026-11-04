import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Landmark, Building2, Globe2, FileText, AlertCircle, SendHorizontal, ShieldCheck, Plus } from "lucide-react";
import { WireGeneralPaymentFields } from "../fields/WireGeneralPaymentFields";
import type { WireTransferDialogProps } from "./wireTransferDialog/types";
import { useWireTransferDialog } from "./wireTransferDialog/hooks/useWireTransferDialog";
import { Card1BeneficiaryBank } from "./wireTransferDialog/sections/Card1BeneficiaryBank";
import { DynamicClearingCodesGrid } from "./wireTransferDialog/sections/DynamicClearingCodesGrid";

export function WireTransferDialog(props: WireTransferDialogProps) {
  const s = useWireTransferDialog(props);
  const { onOpenChange, setShowDiscardConfirm, showDiscardConfirm, isEffectiveEditMode, submitLabel, isSubmitting, addClearingField, availableClearingFields, clearingScrollRef, addClearingFieldOpen, setAddClearingFieldOpen, addClearingRef, form, normalizedTabs, setValidationErrors, validationErrors, setForm, setActiveTab, activeTab, handleSubmit, request, title, open } = s;
  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setShowDiscardConfirm(true);
          } else {
            onOpenChange(true);
          }
        }}
      >
        <DialogContent
          aria-describedby={undefined}
          onPointerDownOutside={(e) => {
            e.preventDefault();
            setShowDiscardConfirm(true);
          }}
          onEscapeKeyDown={(e) => {
            e.preventDefault();
            setShowDiscardConfirm(true);
          }}
          className="!w-[92vw] !max-w-[1000px] sm:!max-w-[1000px] h-[90vh] max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 shadow-2xl rounded-2xl"
          style={{ width: "92vw", maxWidth: "1000px" }}
        >
          {/* FIXED HEADER */}
          <div className="px-6 py-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50/90 dark:bg-zinc-900/70 shrink-0">
            <DialogHeader className="p-0">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-200/50 dark:border-indigo-800/50">
                    <Landmark className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <DialogTitle className="text-base sm:text-lg font-bold text-slate-900 dark:text-zinc-100 truncate flex items-center gap-2">
                      <span>{title || (isEffectiveEditMode ? "Edit Wire Transfer" : "Wire Transfer Information")}</span>
                      <span className="text-muted-foreground font-normal text-sm">· Request #{request.id}</span>
                    </DialogTitle>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {isEffectiveEditMode
                        ? "Update wire payment instructions, routing, and beneficiary clearing details."
                        : "Complete the wire transfer and clearing details according to the beneficiary bank jurisdiction."}
                    </p>
                  </div>
                </div>

              </div>
            </DialogHeader>
          </div>

          {/* FORM */}
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
              {/* TABS SELECTOR (Hidden if only 1 tab is visible, saving space) */}
              {normalizedTabs.length > 1 && (
                <div className="px-6 pt-3.5 pb-2.5 bg-white dark:bg-zinc-950 border-b border-slate-100 dark:border-zinc-800/80 shrink-0">
                  <TabsList className="grid grid-cols-2 max-w-sm w-full h-9">
                    {normalizedTabs.includes("general") && (
                      <TabsTrigger value="general" className="flex items-center gap-1.5 text-xs">
                        <FileText className="w-3.5 h-3.5" />
                        General &amp; Payment
                      </TabsTrigger>
                    )}
                    {normalizedTabs.includes("banking") && (
                      <TabsTrigger value="banking" className="flex items-center gap-1.5 text-xs">
                        <Building2 className="w-3.5 h-3.5" />
                        Bank &amp; Clearing Details
                      </TabsTrigger>
                    )}
                  </TabsList>
                </div>
              )}

              {/* SCROLLABLE BODY */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3.5">
                {/* TAB 1: GENERAL & PAYMENT */}
                {normalizedTabs.includes("general") && (
                  <TabsContent value="general" className="space-y-4 mt-0">
                    <WireGeneralPaymentFields
                      form={form}
                      setForm={setForm}
                      validationErrors={validationErrors}
                      onClearValidationError={(k) =>
                        setValidationErrors((prev) => ({ ...prev, [k]: false }))
                      }
                      isSubmitting={isSubmitting}
                    />
                  </TabsContent>
                )}

                {/* COMBINED TAB 2: BANK & CLEARING DETAILS */}
                {normalizedTabs.includes("banking") && (
                  <TabsContent value="banking" className="space-y-4 mt-0">
                    {/* CARD 1: BENEFICIARY BANK DETAILS */}
                    <Card1BeneficiaryBank s={s} />

                    {/* CARD 2: GLOBAL & REGIONAL CLEARING CODES */}
                    <div className="rounded-xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-4 shadow-2xs space-y-4">
                      {/* CARD HEADER */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-zinc-800">
                        <div className="flex items-center gap-2.5">
                          <div className="h-7 w-7 rounded-md bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                            <Globe2 className="h-4 w-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-zinc-200 flex items-center gap-2">
                              <span>Global &amp; Regional Clearing Codes</span>
                              <Badge variant="outline" className="text-[10px] text-indigo-600 border-indigo-300 dark:text-indigo-400">
                                {form.bank_country || "Selected Country"}
                              </Badge>
                            </h4>
                            <p className="text-[11px] text-slate-400 dark:text-zinc-500">
                              Routing numbers, SWIFT/BIC, IBAN, and domestic clearing identifiers
                            </p>
                          </div>
                        </div>

                        {/* ADD CLEARING FIELD BUTTON (NO DUPLICATES, IN-TREE SCROLLABLE DROPDOWN) */}
                        <div ref={addClearingRef} className="relative flex items-center gap-2 shrink-0">
                          {availableClearingFields.length > 0 ? (
                            <>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setAddClearingFieldOpen(!addClearingFieldOpen)}
                                className="h-8 text-xs font-medium gap-1.5 border-dashed border-slate-300 dark:border-zinc-700 hover:bg-emerald-50/50 hover:text-emerald-600 hover:border-emerald-300"
                              >
                                <Plus className="h-3.5 w-3.5" />
                                <span>Add Clearing Code</span>
                              </Button>

                              {addClearingFieldOpen && (
                                <div
                                  data-radix-scroll-lock-ignore=""
                                  className="absolute right-0 top-full mt-1 w-60 p-1 z-50 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-2xl flex flex-col overflow-hidden"
                                  style={{
                                    boxShadow: "0 10px 30px -5px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.05)",
                                  }}
                                >
                                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2.5 py-1.5 border-b border-slate-100 dark:border-zinc-800">
                                    Available Clearing Codes
                                  </div>
                                  <div
                                    ref={clearingScrollRef}
                                    data-radix-scroll-lock-ignore=""
                                    className="py-1 max-h-56 overflow-y-auto overscroll-contain"
                                    style={{
                                      scrollbarWidth: "thin",
                                      overscrollBehavior: "contain",
                                      WebkitOverflowScrolling: "touch",
                                    }}
                                  >
                                    {availableClearingFields.map((f) => (
                                      <button
                                        key={f.id}
                                        type="button"
                                        onClick={() => addClearingField(f.id)}
                                        className="w-full text-left px-2.5 py-1.5 text-xs hover:bg-slate-100 dark:hover:bg-zinc-800 rounded flex items-center justify-between transition-colors"
                                      >
                                        <span>{f.label}</span>
                                        <Plus className="h-3 w-3 text-slate-400" />
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">All clearing codes active</span>
                          )}
                        </div>
                      </div>

                      {/* DYNAMIC CLEARING CODES GRID */}
                      <DynamicClearingCodesGrid s={s} />
                  </div>
                </TabsContent>
              )}
              </div>
            </Tabs>

            {/* FIXED FOOTER WITH GENEROUS PADDING & MARGIN */}
            <div className="px-8 py-5 border-t border-slate-200 dark:border-zinc-800 bg-slate-50/95 dark:bg-zinc-900/80 shrink-0 mt-auto">
              <DialogFooter className="p-0 m-0 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-muted-foreground flex items-center gap-2 py-1">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Treasury & AP settlement audit trail will be logged upon submission.</span>
                </div>
                <div className="flex items-center gap-3 shrink-0 my-0.5">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowDiscardConfirm(true)}
                    disabled={isSubmitting}
                    className="h-10 px-5 text-sm font-medium rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-10 px-6 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition-all rounded-lg flex items-center gap-2"
                  >
                    <SendHorizontal className="h-4 w-4" />
                    {submitLabel || (isEffectiveEditMode ? "Save Changes" : "Confirm Wire & Mark Purchased")}
                  </Button>
                </div>
              </DialogFooter>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* DISCARD CONFIRMATION MODAL */}
      <AlertDialog open={showDiscardConfirm} onOpenChange={setShowDiscardConfirm}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <AlertDialogTitle>Discard Wire Information?</AlertDialogTitle>
                <AlertDialogDescription className="text-xs mt-1">
                  You have unsaved wire transfer details. Are you sure you want to discard your changes and close?
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogAction
              type="button"
              onClick={() => setShowDiscardConfirm(false)}
            >
              Stay
            </AlertDialogAction>
            <AlertDialogCancel
              type="button"
              onClick={() => {
                setShowDiscardConfirm(false);
                onOpenChange(false);
              }}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50"
            >
              Discard
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
