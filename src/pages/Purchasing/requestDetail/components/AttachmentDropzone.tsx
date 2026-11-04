import { useState, useRef } from "react";
import { Paperclip, ReceiptText, Upload, X, Trash2, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { AttachmentInfo } from "@/types/purchasing";
import { ATTACHMENT_ACCEPT } from "../constants";

export function AttachmentDropzone({
  files,
  onFilesSelected,
  onRemove,
  onPreviewFile,
  existingAttachments,
  onPreviewAttachment,
  onRemoveAttachment,
}: {
  files: File[];
  onFilesSelected: (files: File[]) => void;
  onRemove: (index: number) => void;
  onPreviewFile?: (file: File) => void;
  existingAttachments?: AttachmentInfo[];
  onPreviewAttachment?: (att: AttachmentInfo) => void;
  onRemoveAttachment?: (attId: string) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium">Receipts &amp; Invoices Attachments</label>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files?.length) onFilesSelected(Array.from(e.dataTransfer.files));
        }}
        className={cn(
          "flex flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed p-4 text-center cursor-pointer transition-colors",
          isDragging
            ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-950/30"
            : "border-slate-300 dark:border-zinc-700 hover:border-slate-400 dark:hover:border-zinc-600"
        )}
      >
        <Upload className="h-5 w-5 text-slate-400" />
        <p className="text-xs text-slate-600 dark:text-zinc-300">
          Drag & drop receipt/invoice files here, or click to browse
        </p>
        <p className="text-[11px] text-slate-400 dark:text-zinc-500">
          Supports PDF invoices, images (.png, .jpg, .jpeg), and document receipts
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ATTACHMENT_ACCEPT}
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) onFilesSelected(Array.from(e.target.files));
            e.target.value = "";
          }}
        />
      </div>

      {/* Staged files for current action */}
      {files.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <div className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300 uppercase tracking-wider flex items-center justify-between">
            <span>Selected Files to Upload ({files.length})</span>
            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-normal">Will save with this bill</span>
          </div>
          <ul className="space-y-1.5">
            {files.map((file, index) => (
              <li
                key={`${file.name}-${index}`}
                className="flex items-center justify-between gap-2 text-xs bg-slate-50 dark:bg-zinc-800/50 rounded-lg px-3 py-2 border border-slate-200 dark:border-zinc-800"
              >
                <span className="flex items-center gap-2 min-w-0">
                  <Paperclip className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <span className="truncate font-medium text-slate-800 dark:text-zinc-200">{file.name}</span>
                  <span className="text-[10px] text-slate-400 shrink-0">({(file.size / 1024).toFixed(1)} KB)</span>
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  {onPreviewFile && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-[11px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 gap-1 cursor-pointer"
                      onClick={() => onPreviewFile(file)}
                    >
                      <Eye className="h-3 w-3" />
                      <span>Preview</span>
                    </Button>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(index);
                    }}
                    className="p-1 text-slate-400 hover:text-red-500 rounded cursor-pointer transition-colors"
                    title="Remove file"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Previously uploaded attachments on this request */}
      {existingAttachments && existingAttachments.length > 0 && (
        <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-zinc-800">
          <div className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300 uppercase tracking-wider flex items-center justify-between">
            <span>Saved Receipts &amp; Documents ({existingAttachments.length})</span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-normal">Saved in this spot</span>
          </div>
          <ul className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {existingAttachments.map((att) => (
              <li
                key={att.id}
                className="flex items-center justify-between gap-2 text-xs bg-emerald-50/50 dark:bg-emerald-950/20 rounded-lg px-3 py-1.5 border border-emerald-100 dark:border-emerald-900/30"
              >
                <span className="flex items-center gap-2 min-w-0">
                  <ReceiptText className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span className="truncate text-slate-800 dark:text-zinc-200" title={att.filename}>{att.filename}</span>
                  {att.size ? <span className="text-[10px] text-slate-400 shrink-0">({(att.size / 1024).toFixed(1)} KB)</span> : null}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  {onPreviewAttachment && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-[11px] text-emerald-700 dark:text-emerald-300 hover:text-emerald-800 gap-1 cursor-pointer"
                      onClick={() => onPreviewAttachment(att)}
                    >
                      <Eye className="h-3 w-3" />
                      <span>Preview</span>
                    </Button>
                  )}
                  {onRemoveAttachment && (
                    <button
                      type="button"
                      onClick={() => onRemoveAttachment(att.id)}
                      className="p-1 text-slate-400 hover:text-red-500 rounded cursor-pointer transition-colors"
                      title="Remove saved attachment"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
