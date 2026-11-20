import type { RefObject } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ReceiptText, Upload, Eye, Download, Trash2 } from "lucide-react";
import * as purchasingService from "@/services/purchasingService";

interface Tab3AttachmentsCardProps {
  data: any;
  request: any;
  invoiceReceiptInputRef: RefObject<HTMLInputElement | null>;
  uploadAttachments: any;
  refetch?: () => void;
  handlePreviewAttachment: (att: any) => void;
  isLoadingPreview: boolean;
  deleteAttachment: any;
}

function AttachmentItemRow({
  att,
  requestId,
  onPreview,
  isLoadingPreview,
  onDelete,
}: {
  att: any;
  requestId: string | number;
  onPreview: (att: any) => void;
  isLoadingPreview: boolean;
  onDelete: (att: any) => void;
}) {
  return (
    <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800/40 transition-colors gap-3">
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 shrink-0 border border-emerald-100 dark:border-emerald-900/30">
          <ReceiptText className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-slate-900 dark:text-zinc-100 truncate" title={att.filename}>
            {att.filename}
          </p>
          <div className="flex items-center gap-1.5 text-[10.5px] text-slate-400 dark:text-zinc-500 flex-wrap">
            {att.size ? <span>{(att.size / 1024).toFixed(1)} KB</span> : null}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 gap-1 cursor-pointer"
          onClick={() => onPreview(att)}
          disabled={isLoadingPreview}
          title="Preview Receipt"
        >
          <Eye className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Preview</span>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 cursor-pointer"
          onClick={() => purchasingService.downloadAttachment(String(requestId), att.id, att.filename)}
          title="Download Receipt"
        >
          <Download className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer"
          onClick={() => onDelete(att)}
          title="Remove Receipt"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

export function Tab3AttachmentsCard({
  data,
  request,
  invoiceReceiptInputRef,
  uploadAttachments,
  refetch,
  handlePreviewAttachment,
  isLoadingPreview,
  deleteAttachment,
}: Tab3AttachmentsCardProps) {
  const attachments = data?.attachments || [];

  const handleDelete = (att: any) => {
    if (window.confirm(`Are you sure you want to remove receipt "${att.filename}"?`)) {
      deleteAttachment.mutate(att.id, {
        onSuccess: () => refetch?.(),
      });
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-900/30 p-5 space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-zinc-800/80">
        <div className="flex items-center gap-2">
          <ReceiptText className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-200 tracking-tight uppercase text-[11px]">
            Attached Receipts &amp; Invoice Files
          </h3>
          {attachments.length > 0 && (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-300"
            >
              {attachments.length} {attachments.length === 1 ? "file" : "files"}
            </Badge>
          )}
        </div>

        <div>
          <input
            type="file"
            ref={invoiceReceiptInputRef}
            className="hidden"
            multiple
            accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                uploadAttachments.mutate(Array.from(e.target.files), {
                  onSuccess: () => {
                    refetch?.();
                  },
                });
                e.target.value = "";
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploadAttachments.isPending}
            onClick={() => invoiceReceiptInputRef.current?.click()}
            className="h-7 text-xs px-2.5 gap-1.5 border-dashed border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 cursor-pointer"
          >
            <Upload className="h-3 w-3" />
            <span>{uploadAttachments.isPending ? "Uploading..." : "Upload Receipt"}</span>
          </Button>
        </div>
      </div>

      {attachments.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-4 text-center">
          <div className="inline-flex p-2 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 mb-1.5">
            <ReceiptText className="h-4 w-4" />
          </div>
          <p className="text-xs font-medium text-slate-600 dark:text-zinc-400">
            No receipts or invoice documents attached yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {attachments.map((att: any) => (
            <AttachmentItemRow
              key={att.id}
              att={att}
              requestId={request.id}
              onPreview={handlePreviewAttachment}
              isLoadingPreview={isLoadingPreview}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
