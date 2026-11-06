import { Check, Loader2, Pencil } from "lucide-react";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Label } from "../../../../components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../../../components/ui/dialog";
import type { GenerateInvoiceState } from "../hooks/useGenerateInvoice";

export function RenameTemplatePreset({ s }: { s: GenerateInvoiceState }) {
  const { renamePresetMutation, renamePresetValue, selectedTemplateId, setIsRenamePresetDialogOpen, setRenamePresetValue, selectedCustomer, templateName, isRenamePresetDialogOpen } = s;
  return (
    <Dialog open={isRenamePresetDialogOpen} onOpenChange={setIsRenamePresetDialogOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
              <Pencil className="w-5 h-5 text-blue-600" />
              <span>Rename Template Preset</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Update the name of preset &quot;{templateName}&quot; for {selectedCustomer?.name || "this customer"}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Preset Name <span className="text-red-500">*</span>
              </Label>
              <Input
                type="text"
                value={renamePresetValue}
                onChange={(e) => setRenamePresetValue(e.target.value)}
                placeholder="e.g. Standard Retainer, Project Billing..."
                className="text-xs"
                autoFocus
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsRenamePresetDialogOpen(false)}
              className="text-xs cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                if (selectedTemplateId && renamePresetValue.trim()) {
                  renamePresetMutation.mutate({
                    templateId: selectedTemplateId,
                    newName: renamePresetValue.trim(),
                  });
                }
              }}
              disabled={renamePresetMutation.isPending || !renamePresetValue.trim()}
              className="text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer"
            >
              {renamePresetMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              <span>Save Name</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
  );
}
