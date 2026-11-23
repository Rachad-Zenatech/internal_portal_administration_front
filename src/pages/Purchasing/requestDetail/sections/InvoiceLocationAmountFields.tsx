import { Input } from "@/components/ui/input";
import LocationAutocomplete from "../../fields/LocationAutocomplete";
import { TwoUp } from "../components/TwoUp";
import type { InvoiceInput } from "@/types/purchasing";

interface Props {
  invoice: InvoiceInput;
  setInvoice: React.Dispatch<React.SetStateAction<InvoiceInput>>;
  currency: string;
}

export function InvoiceLocationAmountFields({ invoice, setInvoice, currency }: Props) {
  return (
    <TwoUp>
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Location <span className="text-red-500">*</span>
        </label>
        <LocationAutocomplete
          value={invoice.from_location || ""}
          onChange={(v) => setInvoice({ ...invoice, from_location: v })}
          placeholder="Select or enter location *"
          required
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Payment Amount ({invoice.currency || currency || "USD"}) <span className="text-red-500">*</span>
        </label>
        <Input
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          value={invoice.amount !== undefined && invoice.amount !== null ? String(invoice.amount) : ""}
          onChange={(e) => setInvoice({ ...invoice, amount: e.target.value === "" ? 0 : Number(e.target.value) })}
        />
      </div>
    </TwoUp>
  );
}
