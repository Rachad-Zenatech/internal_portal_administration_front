import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  id: string;
  value: string;
  onChange: (val: string) => void;
}

export function BusinessContactPaymentTermsField({ id, value, onChange }: Props) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-semibold">Payment Terms</Label>
      <Input
        id={id}
        list={`${id}-options`}
        placeholder="e.g. Net 30, Due on Receipt"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 text-xs"
      />
      <datalist id={`${id}-options`}>
        <option value="Due on Receipt" />
        <option value="Net 15" />
        <option value="Net 30" />
        <option value="Net 45" />
        <option value="Net 60" />
        <option value="Prepaid" />
      </datalist>
    </div>
  );
}
