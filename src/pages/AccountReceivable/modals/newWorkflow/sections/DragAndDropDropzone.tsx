import { Trash2, FileText, Paperclip, Upload, Eye } from "lucide-react";
import { Button } from "../../../../../components/ui/button";
import type { NewWorkflowState } from "../hooks/useNewWorkflow";

export function DragAndDropDropzone({ s }: { s: NewWorkflowState }) {
  const { handleRemoveCashAttachment, handlePreviewAttachment, cashAttachments, handleFilesSelected, fileInputRef, isDragging, handleDrop, handleDragLeave, handleDragOver } = s;
  return (
    <div className="pt-2 border-t border-emerald-500/20 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                      <Paperclip className="w-3.5 h-3.5 text-emerald-500" />
                      Invoice & Bank Attachments ({cashAttachments.length})
                    </h4>
                  </div>

                  {/* Drag and Drop Dropzone with Single Upload Button */}
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                      isDragging
                        ? "border-emerald-500 bg-emerald-500/10 scale-[1.01]"
                        : "border-emerald-500/30 bg-background/60 hover:bg-emerald-500/5 hover:border-emerald-500/50"
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
                    <div className="flex flex-col items-center justify-center gap-1.5 pointer-events-none">
                      <div className="p-2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        <Upload className="w-4 h-4" />
                      </div>
                      <p className="text-xs text-foreground font-semibold">
                        <span className="text-emerald-600 dark:text-emerald-400 underline decoration-emerald-500/40 underline-offset-2">Click to browse</span> or drag & drop attachments here
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Supports Invoice PDFs, Bank Wire Deposit Slips, and Remittance Receipts (up to 25MB each)
                      </p>
                    </div>
                  </div>

                  {cashAttachments.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {cashAttachments.map((att, idx) => (
                        <div
                          key={att.id || idx}
                          onClick={() => handlePreviewAttachment(att)}
                          className="flex items-center justify-between p-2 rounded-lg bg-background border border-border text-xs hover:border-primary/50 transition-all cursor-pointer group shadow-2xs"
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <FileText className="w-3.5 h-3.5 text-primary shrink-0 group-hover:scale-110 transition-transform" />
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-foreground truncate text-[11px] group-hover:text-primary transition-colors">
                                {att.filename}
                              </p>
                              <span className="text-[10px] text-muted-foreground">
                                {att.file_size ? `${(att.file_size / 1024).toFixed(0)} KB • ` : ""}{att.note || "Attached"}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePreviewAttachment(att);
                              }}
                              className="h-6 w-6 p-0 text-muted-foreground hover:text-primary"
                              title="Preview file"
                            >
                              <Eye className="w-3 h-3" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveCashAttachment(idx);
                              }}
                              className="h-6 w-6 p-0 text-muted-foreground hover:text-red-500"
                              title="Delete attachment"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
  );
}
