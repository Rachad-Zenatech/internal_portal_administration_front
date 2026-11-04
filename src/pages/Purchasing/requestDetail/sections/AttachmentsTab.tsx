import { Paperclip, Trash2, Download, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TabsContent } from "@/components/ui/tabs";
import * as purchasingService from "@/services/purchasingService";
import { formatDateTime } from "../../utils/purchasingMeta";
import { InlineAttachmentUploader } from "../components/InlineAttachmentUploader";
import type { RequestDetailViewState } from "../hooks/useRequestDetailTail";

export function AttachmentsTab({ v }: { v: RequestDetailViewState }) {
  const { deleteAttachment, request, isLoadingPreview, handlePreviewAttachment, data, uploadAttachments, canAttachFiles } = v;
  return (
    <TabsContent value="attachments" className="m-0">
                  {canAttachFiles && (
                    <InlineAttachmentUploader
                      isUploading={uploadAttachments.isPending}
                      onUpload={(files) => uploadAttachments.mutate(files)}
                    />
                  )}
                  {(!data.attachments || data.attachments.length === 0) ? (
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
                    <div className="max-h-64 overflow-y-auto space-y-2 pr-1 divide-y divide-slate-100 dark:divide-zinc-800/60">
                      {data.attachments.map((att) => (
                        <div
                          key={att.id}
                          className="flex items-start justify-between gap-2.5 pt-2.5 first:pt-0 group hover:bg-slate-50/60 dark:hover:bg-zinc-800/40 p-2 rounded-lg transition-colors"
                        >
                          <div className="flex items-start gap-2.5 min-w-0 flex-1">
                            <div className="p-1.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 shrink-0 mt-0.5">
                              <Paperclip className="h-3.5 w-3.5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium text-slate-900 dark:text-zinc-100 break-all whitespace-normal leading-snug" title={att.filename}>
                                {att.filename}
                              </p>
                              <div className="flex items-center gap-1.5 text-[10.5px] text-slate-400 dark:text-zinc-500 flex-wrap">
                                {att.size ? <span>{(att.size / 1024).toFixed(1)} KB</span> : null}
                                {att.uploader_name ? (
                                  <>
                                    <span>•</span>
                                    <span className="font-medium text-slate-600 dark:text-zinc-400">By {att.uploader_name}</span>
                                  </>
                                ) : null}
                                {att.uploaded_at ? (
                                  <>
                                    <span>•</span>
                                    <span>{formatDateTime(att.uploaded_at)}</span>
                                  </>
                                ) : null}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 gap-1 cursor-pointer"
                              onClick={() => handlePreviewAttachment(att)}
                              disabled={isLoadingPreview}
                              title="Preview attachment"
                            >
                              <Eye className="h-3 w-3" />
                              <span>Preview</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 gap-1 cursor-pointer"
                              onClick={() => purchasingService.downloadAttachment(request.id, att.id, att.filename)}
                              title="Download attachment"
                            >
                              <Download className="h-3 w-3" />
                              <span className="hidden sm:inline">Download</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-1.5 text-xs text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer"
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to remove "${att.filename}"?`)) {
                                  deleteAttachment.mutate(att.id);
                                }
                              }}
                              title="Remove attachment"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
  );
}
