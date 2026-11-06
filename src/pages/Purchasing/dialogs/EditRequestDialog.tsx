import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText, AlertTriangle, Landmark, ShoppingCart, Clock, FileSpreadsheet } from "lucide-react";
import { useEditRequestDialog } from "./editRequestDialog/hooks/useEditRequestDialog";
import type { EditRequestDialogProps } from "./editRequestDialog/types";
import { MultiItemTable } from "./editRequestDialog/sections/MultiItemTable";
import { RequestTitleAndPriority } from "./editRequestDialog/sections/RequestTitleAndPriority";
import { AccountAndWireSection } from "./editRequestDialog/sections/AccountAndWireSection";
import { FullScreenLineItems } from "./editRequestDialog/sections/FullScreenLineItems";

export function EditRequestDialog(props: EditRequestDialogProps) {
  const s = useEditRequestDialog(props);
  const { onOpenChange, setShowUnsavedConfirm, showUnsavedConfirm, updateMutation, handleRequestClose, formData, setFormData, isLinkEditable, itemMode, items, isMulti, setItemMode, handleSubmit, request, isDirty, open } = s;
  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            handleRequestClose();
          } else {
            onOpenChange(true);
          }
        }}
      >
        <DialogContent
          aria-describedby={undefined}
          onPointerDownOutside={(e) => {
            if (isDirty) {
              e.preventDefault();
              setShowUnsavedConfirm(true);
            }
          }}
          onEscapeKeyDown={(e) => {
            if (isDirty) {
              e.preventDefault();
              setShowUnsavedConfirm(true);
            }
          }}
          className="!w-[92vw] !max-w-[1000px] sm:!max-w-[1000px] max-h-[90vh] overflow-y-auto"
          style={{ width: "92vw", maxWidth: "1000px" }}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>{formData.request_type === "RECURRING" ? "Edit Recurring Payment Request" : formData.request_type === "ACCOUNTS_PAYABLE" ? "Edit Wire Transfer Request" : "Edit Purchase Request"} #{request?.id}</span>
              {itemMode === "MULTIPLE" && formData.request_type !== "RECURRING" && (
                <Badge className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 border-indigo-200">
                  <FileText className="h-3 w-3 mr-1" /> Multi-Part Quote
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-1">
            {/* 1. Request Type Selector (Clean Segmented Cards at Top) */}
            <div className="space-y-1.5 pb-3 border-b border-slate-100 dark:border-zinc-800">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                Request Type <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { value: "SPEND", label: "Spend Request", icon: ShoppingCart, desc: "Hardware & purchases" },
                  { value: "RECURRING", label: "Recurring", icon: Clock, desc: "Scheduled cycles" },
                  { value: "QUOTE", label: "Quote Request", icon: FileSpreadsheet, desc: "Estimates & RFQs" },
                  { value: "ADMIN", label: "Admin Triage", icon: FileText, desc: "Administrative & misc" },
                  { value: "ACCOUNTS_PAYABLE", label: "Wire Transfer", icon: Landmark, desc: "Vendor invoices & wires" },
                ].map((opt) => {
                  const isSelected = formData.request_type === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, request_type: opt.value }));
                        if (opt.value === "ACCOUNTS_PAYABLE" || opt.value === "RECURRING") {
                          setItemMode("SINGLE");
                        }
                      }}
                      className={`flex flex-col items-start p-2.5 rounded-lg border text-left transition-all relative ${
                        isSelected
                          ? "bg-indigo-50/80 border-indigo-500 dark:bg-indigo-950/40 dark:border-indigo-500 shadow-2xs ring-1 ring-indigo-500/30"
                          : "bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800/60"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-0.5 w-full">
                        <opt.icon className={`h-3.5 w-3.5 shrink-0 ${isSelected ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400"}`} />
                        <span className={`text-xs font-semibold ${isSelected ? "text-indigo-900 dark:text-indigo-100" : "text-slate-800 dark:text-zinc-200"}`}>
                          {opt.label}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 dark:text-zinc-400 leading-tight line-clamp-1">
                        {opt.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Mode Switcher (Single vs Multiple) - Only for Spend, Quote, Admin */}
            {formData.request_type !== "ACCOUNTS_PAYABLE" && formData.request_type !== "RECURRING" && (
              <div className="p-3 bg-slate-50/70 dark:bg-zinc-800/40 rounded-lg border border-slate-200 dark:border-zinc-700 space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 block">
                  Item Configuration
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={itemMode === "SINGLE" ? "default" : "outline"}
                    className="w-full text-xs font-medium justify-center h-9"
                    onClick={() => setItemMode("SINGLE")}
                    disabled={isMulti}
                  >
                    Single Item (Direct entry)
                  </Button>
                  <Button
                    type="button"
                    variant={itemMode === "MULTIPLE" ? "default" : "outline"}
                    className="w-full text-xs font-medium justify-center h-9"
                    onClick={() => setItemMode("MULTIPLE")}
                    disabled={!isMulti}
                  >
                    <FileText className="h-3.5 w-3.5 mr-1.5" /> Multiple Parts ({items.length} parts)
                  </Button>
                </div>
              </div>
            )}

            {/* 3. Multiple Parts Line Items Table */}
            <MultiItemTable s={s} />

            {/* Product / Website Link (Placed directly above Request Title) */}
            {(formData.request_type === "ACCOUNTS_PAYABLE" || (formData.request_type !== "RECURRING" && itemMode === "SINGLE")) && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                    Product / Website Link <span className="text-slate-400 font-normal">(optional, e.g. Amazon URL or Vendor invoice link)</span>
                  </label>
                  {!isLinkEditable && formData.request_type !== "ACCOUNTS_PAYABLE" && (
                    <span className="text-[11px] text-slate-400 dark:text-zinc-500 font-normal">
                      Locked (not editable from Waiting Approval onward)
                    </span>
                  )}
                </div>
                <Input
                  type="url"
                  value={formData.item_url || ""}
                  onChange={(e) => setFormData({ ...formData, item_url: e.target.value })}
                  placeholder="https://..."
                  disabled={!isLinkEditable && formData.request_type !== "ACCOUNTS_PAYABLE"}
                  className={`h-9 text-base sm:text-xs ${!isLinkEditable && formData.request_type !== "ACCOUNTS_PAYABLE" ? "bg-slate-100 dark:bg-zinc-800/60 cursor-not-allowed text-slate-500 dark:text-zinc-400" : ""}`}
                />
              </div>
            )}

            {/* 4. General Details: Title + 3-Column Meta Row (Requester | Department | Priority) */}
            <RequestTitleAndPriority s={s} />

            {/* 5. Conditional Type Fields: ACCOUNTS_PAYABLE vs RECURRING vs SINGLE ITEM */}
            <AccountAndWireSection s={s} />



            {/* 6. Description / Terms */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                {formData.request_type === "RECURRING" ? "Description / Terms" : "Description / Notes"}
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="text-xs bg-white dark:bg-zinc-900"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={handleRequestClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Full Screen Line Items Table Dialog (Screen-Wide) */}
      <FullScreenLineItems s={s} />

      {/* Unsaved Changes Confirmation Dialog */}
      <AlertDialog open={showUnsavedConfirm} onOpenChange={setShowUnsavedConfirm}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-5 w-5" />
              Unsaved Changes
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-slate-600 dark:text-zinc-300 pt-1">
              You have unsaved changes in this request. If you leave now, your edits will not be saved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex items-center justify-end gap-2 pt-3">
            <AlertDialogCancel
              onClick={() => setShowUnsavedConfirm(false)}
              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300"
            >
              Stay
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                setShowUnsavedConfirm(false);
                onOpenChange(false);
              }}
            >
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
