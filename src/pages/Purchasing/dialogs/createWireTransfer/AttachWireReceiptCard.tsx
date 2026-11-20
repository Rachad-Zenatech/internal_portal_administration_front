import { Receipt } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Props {
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  setFile: (file: File | null) => void;
}

export function AttachWireReceiptCard({ fileInputRef, setFile }: Props) {
  return (
    <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800 space-y-2">
      <div className="flex items-center gap-2">
        <Receipt className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        <label className="text-xs font-semibold text-slate-800 dark:text-zinc-200 uppercase tracking-wider">
          Attach Wire Invoice / Payment Receipt
        </label>
      </div>
      <Input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        className="cursor-pointer file:cursor-pointer text-xs bg-white dark:bg-zinc-900"
      />
    </div>
  );
}
