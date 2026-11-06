import { Check, Loader2, UserCheck } from "lucide-react";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Label } from "../../../../components/ui/label";
import { Textarea } from "../../../../components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../../../components/ui/dialog";
import type { GenerateInvoiceState } from "../hooks/useGenerateInvoice";

export function QuickEditAR({ s }: { s: GenerateInvoiceState }) {
  const { updateCustomerMutation, editCustDisplayName, setIsQuickEditOpen, setEditCustAddress, editCustAddress, setEditCustEmail, editCustEmail, setEditCustPhone, editCustPhone, setEditCustContact, editCustContact, setEditCustDisplayName, isQuickEditOpen } = s;
  return (
    <Dialog open={isQuickEditOpen} onOpenChange={setIsQuickEditOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
              <UserCheck className="w-5 h-5 text-blue-600" />
              <span>Quick Edit A/R Customer Profile</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Update this customer&apos;s contact details and billing address. Saving will immediately refresh the populated invoice data.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Company / Display Name <span className="text-red-500">*</span>
              </Label>
              <Input
                type="text"
                value={editCustDisplayName}
                onChange={(e) => setEditCustDisplayName(e.target.value)}
                placeholder="e.g. Acme Corporation"
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Contact Person / Attention
              </Label>
              <Input
                type="text"
                value={editCustContact}
                onChange={(e) => setEditCustContact(e.target.value)}
                placeholder="e.g. Jane Smith"
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">
                  Phone Number
                </Label>
                <Input
                  type="text"
                  value={editCustPhone}
                  onChange={(e) => setEditCustPhone(e.target.value)}
                  placeholder="e.g. +1 (555) 234-5678"
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">
                  Email Address
                </Label>
                <Input
                  type="email"
                  value={editCustEmail}
                  onChange={(e) => setEditCustEmail(e.target.value)}
                  placeholder="e.g. billing@acme.com"
                  className="text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Billing Address
              </Label>
              <Textarea
                rows={3}
                value={editCustAddress}
                onChange={(e) => setEditCustAddress(e.target.value)}
                placeholder="e.g. 100 Main Street, Suite 500&#10;San Francisco, CA 94105"
                className="text-xs resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsQuickEditOpen(false)}
              className="text-xs cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => updateCustomerMutation.mutate()}
              disabled={updateCustomerMutation.isPending || !editCustDisplayName.trim()}
              className="text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer"
            >
              {updateCustomerMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              <span>Save & Refresh Invoice</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
  );
}
