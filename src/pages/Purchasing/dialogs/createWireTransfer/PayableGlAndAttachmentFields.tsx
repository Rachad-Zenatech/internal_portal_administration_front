import { BookOpen, Loader2, Receipt } from "lucide-react";
import { Input } from "@/components/ui/input";
import { GLCodeAutocomplete } from "../../fields/GLCodeAutocomplete";

interface Props {
  glCode: string;
  onGlCodeChange: (val: string) => void;
  attachmentLabel: string;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileChange: (file: File | null) => void;
  isSubmitting: boolean;
  isExtractingOcr?: boolean;
}

/** GL Account / Category selector and bill/receipt file upload for CreateWireTransferDialog. */
export function PayableGlAndAttachmentFields({
  glCode,
  onGlCodeChange,
  attachmentLabel,
  fileInputRef,
  onFileChange,
  isSubmitting,
  isExtractingOcr,
}: Props) {
  return (
    <>
      <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800 space-y-2">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          <label className="text-xs font-semibold text-slate-800 dark:text-zinc-200 uppercase tracking-wider">GL Account / Category</label>
        </div>
        <GLCodeAutocomplete
          value={glCode}
          onChange={onGlCodeChange}
          disabled={isSubmitting}
          placeholder="Select or search GL Category (e.g. 6340 - Office Supplies)"
          showDetailCard={false}
        />
      </div>

      <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <label className="text-xs font-semibold text-slate-800 dark:text-zinc-200 uppercase tracking-wider">{attachmentLabel}</label>
          </div>
          {isExtractingOcr && (
            <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium inline-flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              Extracting Date of Invoice...
            </span>
          )}
        </div>
        <Input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx"
          onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
          className="cursor-pointer file:cursor-pointer text-xs bg-white dark:bg-zinc-900"
        />
      </div>
    </>
  );
}
