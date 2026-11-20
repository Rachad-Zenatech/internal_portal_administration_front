import { useState } from "react";
import { ChevronDown, Hash, Loader2, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getNextPurchaseOrderNumber } from "@/services/purchasingService";

interface Props {
  currentPoNumber?: string;
  isSaving: boolean;
  onSave: (poNumber: string) => Promise<boolean>;
}

export function PoNumberGeneratorPopover({ currentPoNumber, isSaving, onSave }: Props) {
  const [open, setOpen] = useState(false);
  const [poInput, setPoInput] = useState(currentPoNumber || "");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      const nextPo = await getNextPurchaseOrderNumber();
      setPoInput(nextPo);
    } catch (err) {
      toast.error((err as Error).message || "Failed to generate PO number");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      setPoInput(currentPoNumber || "");
    }
  };

  const handleInsert = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = poInput.trim();
    if (!trimmed) {
      toast.error("Please enter or generate a PO number");
      return;
    }
    const ok = await onSave(trimmed);
    if (ok) setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="h-6 px-2 text-[11px] font-medium gap-1 cursor-pointer shrink-0">
          <Hash className="w-3 h-3 text-indigo-600" />
          <span>PO No.</span>
          <ChevronDown className="w-3 h-3 opacity-70" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground">Generate or Insert PO No.</span>
          <Button type="button" variant="ghost" size="sm" onClick={handleGenerate} disabled={isGenerating || isSaving} className="h-6 px-2 text-[11px] gap-1 text-indigo-600 cursor-pointer">
            {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
            <span>Auto-Generate</span>
          </Button>
        </div>
        <form onSubmit={handleInsert} className="flex items-center gap-1.5">
          <Input value={poInput} onChange={(e) => setPoInput(e.target.value)} placeholder="e.g. PO-2026-0001" className="h-8 text-xs font-mono" />
          <Button type="submit" size="sm" disabled={isSaving || isGenerating} className="h-8 px-3 text-xs font-semibold cursor-pointer shrink-0">
            {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : "Insert"}
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  );
}
