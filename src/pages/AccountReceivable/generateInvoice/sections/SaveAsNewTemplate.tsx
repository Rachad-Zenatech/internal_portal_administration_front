import { Bookmark, BookmarkCheck, Loader2 } from "lucide-react";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Label } from "../../../../components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../../../components/ui/dialog";
import type { GenerateInvoiceState } from "../hooks/useGenerateInvoice";

export function SaveAsNewTemplate({ s }: { s: GenerateInvoiceState }) {
  const { saveNewPresetMutation, newPresetName, setNewPresetName, setIsSavePresetDialogOpen, setNewPresetIsDefault, newPresetIsDefault, selectedCustomer, isSavePresetDialogOpen } = s;
  return (
    <Dialog open={isSavePresetDialogOpen} onOpenChange={setIsSavePresetDialogOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
              <Bookmark className="w-5 h-5 text-indigo-600" />
              <span>Save as New Template Preset</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Save the current line items, notes, terms, and chosen layout theme as a reusable preset for {selectedCustomer?.name || "this customer"}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Preset Name <span className="text-red-500">*</span>
              </Label>
              <Input
                type="text"
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                placeholder="e.g. Monthly Retainer, Hardware Delivery, etc."
                className="text-xs"
                autoFocus
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="preset-is-default"
                checked={newPresetIsDefault}
                onChange={(e) => setNewPresetIsDefault(e.target.checked)}
                className="rounded border-input text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
              />
              <Label htmlFor="preset-is-default" className="text-xs text-foreground cursor-pointer">
                Set as default template for this customer
              </Label>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setIsSavePresetDialogOpen(false);
                setNewPresetName("");
              }}
              className="text-xs cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => saveNewPresetMutation.mutate()}
              disabled={saveNewPresetMutation.isPending || !newPresetName.trim()}
              className="text-xs gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold cursor-pointer"
            >
              {saveNewPresetMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <BookmarkCheck className="w-3.5 h-3.5" />
              )}
              <span>Save Preset</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
  );
}
