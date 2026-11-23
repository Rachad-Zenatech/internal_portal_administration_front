import { Paperclip, Trash2, Download, Eye, FileText, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TabsContent } from "@/components/ui/tabs";
import * as purchasingService from "@/services/purchasingService";
import { formatDateTime } from "../../utils/purchasingMeta";
import { InlineAttachmentUploader } from "../components/InlineAttachmentUploader";
import type { RequestDetailViewState } from "../hooks/useRequestDetailTail";

function formatFileSize(bytes?: number | null): string | null {
  if (!bytes || bytes <= 0) return null;
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function getFileExtension(filename?: string | null): string | null {
  if (!filename || !filename.includes(".")) return null;
  const ext = filename.split(".").pop()?.trim().toUpperCase();
  return ext && ext.length <= 5 ? ext : null;
}

interface AttachmentCardProps {
  att: RequestDetailViewState["data"]["attachments"][number];
  requestId: string;
  isLoadingPreview: boolean;
  onPreview: () => void;
  onDelete: () => void;
}

function AttachmentItemCard({ att, requestId, isLoadingPreview, onPreview, onDelete }: AttachmentCardProps) {
  const ext = getFileExtension(att.filename);
  const sizeText = formatFileSize(att.size);
  const isImage = Boolean(ext && ["PNG", "JPG", "JPEG", "WEBP", "GIF"].includes(ext));
  const Icon = isImage ? ImageIcon : ext === "PDF" ? FileText : Paperclip;

  return (
    <div className="rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-900/40 hover:bg-slate-50 dark:hover:bg-zinc-800/40 p-3 space-y-2.5 transition-colors">
      <div className="flex items-start gap-2.5 min-w-0">
        <div className="h-8 w-8 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200/80 dark:border-zinc-700/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <button
              type="button"
              onClick={onPreview}
              disabled={isLoadingPreview}
              title={att.filename}
              className="text-xs font-semibold text-slate-900 dark:text-zinc-100 hover:text-indigo-600 dark:hover:text-indigo-400 truncate text-left transition-colors cursor-pointer"
            >
              {att.filename}
            </button>
            {ext && (
              <span className="px-1.5 py-0.2 rounded text-[9.5px] font-semibold uppercase tracking-wide bg-slate-200/70 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 shrink-0">
                {ext}
              </span>
            )}
          </div>
          <div className="flex items-center gap-x-1.5 gap-y-0.5 text-[11px] text-slate-500 dark:text-zinc-400 flex-wrap">
            {sizeText && <span className="shrink-0">{sizeText}</span>}
            {att.uploader_name && (
              <>
                {sizeText && <span className="text-slate-300 dark:text-zinc-700">•</span>}
                <span className="font-medium text-slate-600 dark:text-zinc-300 truncate max-w-[140px]">
                  {att.uploader_name}
                </span>
              </>
            )}
            {att.uploaded_at && (
              <>
                {(sizeText || att.uploader_name) && <span className="text-slate-300 dark:text-zinc-700">•</span>}
                <span className="shrink-0">{formatDateTime(att.uploaded_at)}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/60 dark:border-zinc-800/80">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2.5 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:bg-indigo-50/70 dark:hover:bg-indigo-950/40 gap-1.5 cursor-pointer"
            onClick={onPreview}
            disabled={isLoadingPreview}
            title="Preview attachment"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Preview</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2.5 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50/70 dark:hover:bg-blue-950/40 gap-1.5 cursor-pointer"
            onClick={() => purchasingService.downloadAttachment(requestId, att.id, att.filename)}
            title="Download attachment"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download</span>
          </Button>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50/70 dark:hover:bg-rose-950/40 cursor-pointer"
          onClick={onDelete}
          title="Remove attachment"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

export function AttachmentsTab({ v }: { v: RequestDetailViewState }) {
  const { deleteAttachment, request, isLoadingPreview, handlePreviewAttachment, data, uploadAttachments, canAttachFiles } = v;
  const attachments = data.attachments || [];

  return (
    <TabsContent value="attachments" className="m-0 space-y-3">
      {canAttachFiles && (
        <InlineAttachmentUploader
          isUploading={uploadAttachments.isPending}
          onUpload={(files) => uploadAttachments.mutate(files)}
        />
      )}
      {attachments.length === 0 ? (
        <div className="py-4 text-center">
          <div className="inline-flex p-2 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 mb-1.5">
            <Paperclip className="h-4 w-4" />
          </div>
          <p className="text-xs font-medium text-slate-600 dark:text-zinc-400">No attachments uploaded</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Uploaded quotes, documents, or files will appear here.
          </p>
        </div>
      ) : (
        <div className="max-h-72 overflow-y-auto space-y-2.5 pr-1">
          {attachments.map((att) => (
            <AttachmentItemCard
              key={att.id}
              att={att}
              requestId={String(request.id)}
              isLoadingPreview={isLoadingPreview}
              onPreview={() => handlePreviewAttachment(att)}
              onDelete={() => {
                if (window.confirm(`Are you sure you want to remove "${att.filename}"?`)) {
                  deleteAttachment.mutate(att.id);
                }
              }}
            />
          ))}
        </div>
      )}
    </TabsContent>
  );
}
