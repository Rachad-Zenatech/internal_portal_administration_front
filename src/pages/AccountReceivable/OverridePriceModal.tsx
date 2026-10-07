import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Edit3, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  arInvoiceService,
  type AddonHierarchyChildRow,
} from "../../services/arInvoiceService";

interface OverridePriceModalProps {
  isOpen: boolean;
  onClose: () => void;
  addon: AddonHierarchyChildRow | null;
  onSuccess: () => void;
}

export const OverridePriceModal: React.FC<OverridePriceModalProps> = ({
  isOpen,
  onClose,
  addon,
  onSuccess,
}) => {
  const [overridePrice, setOverridePrice] = useState<string>(
    addon ? String(addon.charge) : ""
  );
  const [overrideReason, setOverrideReason] = useState<string>(
    addon?.override_reason || ""
  );

  React.useEffect(() => {
    if (addon) {
      setOverridePrice(String(addon.charge));
      setOverrideReason(addon.override_reason || "");
    }
  }, [addon]);

  const overrideMutation = useMutation({
    mutationFn: async () => {
      if (!addon) throw new Error("No add-on selected");
      return arInvoiceService.applyAddonOverride(addon.id, {
        override_charge: parseFloat(overridePrice) || 0,
        override_reason: overrideReason.trim(),
      });
    },
    onSuccess: () => {
      onSuccess();
      onClose();
    },
    onError: (err: any) => {
      alert(`Failed to apply override: ${err.message || err}`);
    },
  });

  if (!addon) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-6 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-purple-600" />
            <span>Manual Price Override</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Override the calculated charge for <strong>{addon.title}</strong>. An audit log will record the reason and author.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-2 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 space-y-1">
            <div className="text-slate-500">Original Calculation:</div>
            <div className="font-mono font-bold text-slate-800 dark:text-slate-200">
              {addon.calculation} = ${Number(addon.charge).toFixed(2)}
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">
              New Confirmed Charge Amount ($) <span className="text-red-500">*</span>
            </Label>
            <Input
              type="number"
              step="0.01"
              value={overridePrice}
              onChange={(e) => setOverridePrice(e.target.value)}
              className="h-8 text-xs font-mono font-bold"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">
              Justification / Reason <span className="text-red-500">*</span>
            </Label>
            <Input
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              placeholder="e.g. Approved sales discount / contract renegotiation"
              className="h-8 text-xs"
            />
          </div>
        </div>

        <DialogFooter className="pt-3 gap-2">
          <Button variant="outline" size="sm" onClick={onClose} className="h-8 text-xs">
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={() => overrideMutation.mutate()}
            disabled={overrideMutation.isPending || !overrideReason.trim() || !overridePrice}
            className="h-8 text-xs bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-xs gap-1.5"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Save Override</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
