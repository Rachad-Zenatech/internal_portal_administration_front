import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useManualPrice } from "@/hooks/usePurchasing";
import { CurrencyAutocomplete } from "./CurrencyAutocomplete";

type Props = {
  requestId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ManualPriceDialog({ requestId, isOpen, onOpenChange }: Props) {
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [currency, setCurrency] = useState<string>("USD");

  const manualPriceMutation = useManualPrice(requestId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    manualPriceMutation.mutate(
      { unit_price: unitPrice, currency },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Extraction Failed</DialogTitle>
          <DialogDescription>
            We couldn't automatically determine the price from the provided link. Please enter the price and currency manually.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Unit Price</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={unitPrice || ""}
                onChange={(e) => setUnitPrice(Number(e.target.value))}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Currency</label>
              <CurrencyAutocomplete value={currency} onChange={setCurrency} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={manualPriceMutation.isPending}>
              {manualPriceMutation.isPending ? "Saving..." : "Save Price"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
