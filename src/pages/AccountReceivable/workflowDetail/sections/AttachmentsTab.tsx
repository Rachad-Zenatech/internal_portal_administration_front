import { FileText, Paperclip, Upload, Eye } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../../../../components/ui/card";
import type { ARAttachment } from "../../../../types/ar";
import { Button } from "../../../../components/ui/button";
import type { WorkflowDetailViewState } from "../hooks/useWorkflowDetailTail";

export function AttachmentsTab({ v }: { v: WorkflowDetailViewState }) {
  const { handlePreviewAttachment, workflow, attachmentMutation, handleFilesSelected, fileInputRef, isDragging, handleDrop, handleDragLeave, handleDragOver, activeTab } = v;
  return (
    <>
      {activeTab === "attachments" && (
        <Card className="shadow-xs border-slate-200 dark:border-zinc-800">
          <CardHeader className="border-b border-slate-100 dark:border-zinc-800 px-6 py-3.5 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Paperclip className="h-4 w-4 text-indigo-600" />
              <CardTitle className="text-base font-bold text-slate-900 dark:text-zinc-100">
                Invoice & Bank Attachments ({workflow.metadata?.attachments?.length || 0})
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            {/* Drag and Drop Dropzone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                isDragging
                  ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 scale-[1.01]"
                  : "border-slate-300 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-900/40 hover:bg-slate-100/50 dark:hover:bg-zinc-800/40 hover:border-indigo-400"
              }`}
            >
              <input
                type="file"
                multiple
                ref={fileInputRef}
                onChange={(e) => handleFilesSelected(e.target.files)}
                className="hidden"
                accept=".pdf,.png,.jpg,.jpeg,.docx,.xlsx,.csv"
              />
              <div className="flex flex-col items-center justify-center gap-2 pointer-events-none">
                <div className="p-3 rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-xs text-slate-800 dark:text-zinc-200 font-semibold">
                  <span className="text-indigo-600 dark:text-indigo-400 underline decoration-indigo-400 underline-offset-2">
                    {attachmentMutation.isPending ? "Uploading attachments..." : "Click to browse"}
                  </span>{" "}
                  or drag & drop attachments here
                </p>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                  Supports Invoice PDFs, Bank Wire Deposit Slips, and Remittance Receipts (up to 25MB each)
                </p>
              </div>
            </div>

            {workflow.metadata?.attachments && workflow.metadata.attachments.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {workflow.metadata.attachments.map((att: ARAttachment, idx: number) => (
                  <div
                    key={att.id || idx}
                    onClick={() => handlePreviewAttachment(att)}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/80 flex items-start justify-between gap-2.5 text-xs hover:border-indigo-400 hover:bg-slate-100/60 dark:hover:bg-zinc-800 transition-all cursor-pointer group shadow-2xs"
                  >
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-slate-900 dark:text-zinc-100 truncate text-xs group-hover:text-indigo-600 transition-colors" title={att.filename}>
                          {att.filename}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-zinc-400 mt-0.5 truncate">
                          {att.file_size ? `${(att.file_size / 1024).toFixed(0)} KB • ` : ""}
                          {att.uploaded_by || "Treasury"}
                        </p>
                        {att.uploaded_at && (
                          <span className="text-[9px] font-mono text-slate-400 block mt-1">
                            {new Date(att.uploaded_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePreviewAttachment(att);
                      }}
                      className="h-7 px-2 text-[11px] gap-1 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-zinc-700 rounded-lg shrink-0 opacity-80 group-hover:opacity-100"
                      title="Preview document"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline font-semibold">Preview</span>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
}
