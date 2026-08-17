import { useCurrencies } from "@/hooks/usePurchasing";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Currency } from "@/types/purchasing";

export function CurrencyAutocomplete({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const { data: currencies = [] } = useCurrencies();
  
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800">
        <SelectValue placeholder="Select currency..." />
      </SelectTrigger>
      <SelectContent>
        {currencies.map((c: Currency) => (
          <SelectItem key={c.code} value={c.code}>
            {c.code} - {c.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
