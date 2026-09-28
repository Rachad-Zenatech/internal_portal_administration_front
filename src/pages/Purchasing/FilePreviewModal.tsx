import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  Download,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  FileCode,
} from "lucide-react";

export interface PreviewFileTarget {
  name: string;
  size?: number;
  url: string;
  contentType?: string;
  onDownload?: () => void;
}

interface FilePreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: PreviewFileTarget | null;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  open,
  onOpenChange,
  target,
}) => {
  const [zoom, setZoom] = useState<number>(1);

  if (!target) return null;

  const name = target.name || "Attachment Preview";
  const ext = name.includes(".") ? name.split(".").pop()?.toLowerCase() || "" : "";
  const mime = (target.contentType || "").toLowerCase();

  const isPdf = mime.includes("pdf") || ext === "pdf";
  const isImage =
    mime.startsWith("image/") ||
    ["png", "jpg", "jpeg", "webp", "gif", "svg", "bmp"].includes(ext);
  const isSpreadsheet = ["xlsx", "xls", "csv"].includes(ext) || mime.includes("spreadsheet") || mime.includes("excel");
  const isWord = ["docx", "doc"].includes(ext) || mime.includes("word");

  const formatSize = (bytes?: number) => {
    if (!bytes || bytes <= 0) return null;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleDownload = () => {
    if (target.onDownload) {
      target.onDownload();
      return;
    }
    const a = document.createElement("a");
    a.href = target.url;
    a.download = target.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleOpenExternal = () => {
    window.open(target.url, "_blank", "noopener,noreferrer");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        aria-describedby={undefined}
        className="w-[95vw] md:w-[88vw] max-w-6xl h-[90vh] max-h-[90vh] p-0 flex flex-col gap-0 overflow-hidden rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-2xl bg-white dark:bg-zinc-950"
      >
        {/* Header Bar */}
        <DialogHeader className="px-5 py-3.5 border-b border-slate-200/80 dark:border-zinc-800/80 bg-slate-50/80 dark:bg-zinc-900/60 flex flex-row items-center justify-between shrink-0 space-y-0">
          <div className="flex items-center gap-3 min-w-0 pr-4">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 shrink-0 border border-indigo-100 dark:border-indigo-900/40">
              {isImage ? (
                <ImageIcon className="h-4 w-4" />
              ) : isSpreadsheet ? (
                <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
            </div>

            <div className="min-w-0">
              <DialogTitle className="text-sm font-bold text-slate-900 dark:text-zinc-100 truncate max-w-md md:max-w-xl">
                {name}
              </DialogTitle>
              <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                {ext ? (
                  <Badge
                    variant="outline"
                    className="text-[10px] uppercase font-mono font-bold tracking-wider px-1.5 py-0 bg-white dark:bg-zinc-900"
                  >
                    {ext}
                  </Badge>
                ) : null}
                {formatSize(target.size) && (
                  <span>{formatSize(target.size)}</span>
                )}
                <span>• Preview Mode</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 pr-8">
            {isImage && (
              <div className="hidden sm:flex items-center gap-1 mr-2 px-2 py-1 rounded-lg bg-slate-200/60 dark:bg-zinc-800/60 text-xs">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded"
                  onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
                  title="Zoom Out"
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                </Button>
                <span className="text-[10px] font-mono px-1 min-w-[3rem] text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded"
                  onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
                  title="Zoom In"
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded"
                  onClick={() => setZoom(1)}
                  title="Reset Zoom"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenExternal}
              className="h-8 px-2.5 text-xs gap-1.5 border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
              title="Open full view in new tab"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">New Tab</span>
            </Button>

            <Button
              variant="default"
              size="sm"
              onClick={handleDownload}
              className="h-8 px-3 text-xs gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer shadow-xs"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download</span>
            </Button>
          </div>
        </DialogHeader>

        {/* Content Body */}
        <div className="flex-1 overflow-auto bg-slate-100/70 dark:bg-zinc-900/60 flex items-center justify-center p-4 min-h-0 relative">
          {isPdf ? (
            <div className="w-full h-full rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-800 shadow-md bg-white dark:bg-zinc-950 flex flex-col">
              <iframe
                src={target.url}
                title={name}
                className="w-full h-full border-0 rounded-xl"
              />
            </div>
          ) : isImage ? (
            <div className="w-full h-full flex items-center justify-center overflow-auto p-2">
              <img
                src={target.url}
                alt={name}
                style={{ transform: `scale(${zoom})`, transformOrigin: "center center" }}
                className="max-h-[75vh] max-w-full object-contain rounded-lg shadow-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 transition-transform duration-150 ease-out"
              />
            </div>
          ) : (
            <div className="max-w-md w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-8 text-center shadow-lg space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center border border-amber-200/80 dark:border-amber-900/50 shadow-inner">
                {isSpreadsheet ? (
                  <FileSpreadsheet className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                ) : isWord ? (
                  <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                ) : (
                  <FileCode className="h-8 w-8" />
                )}
              </div>

              <div className="space-y-1.5">
                <h4 className="text-base font-bold text-slate-900 dark:text-zinc-100 break-words">
                  {name}
                </h4>
                <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed max-w-sm mx-auto">
                  Inline browser preview is not supported for{" "}
                  <span className="font-semibold text-slate-700 dark:text-zinc-300">.{ext.toUpperCase()}</span>{" "}
                  files. You can download the file to view it on your device.
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-2.5 justify-center">
                <Button
                  onClick={handleDownload}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs h-9 px-5 gap-1.5"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download File
                </Button>
                <Button
                  variant="outline"
                  onClick={handleOpenExternal}
                  className="text-xs h-9 px-4 gap-1.5 border-slate-300 dark:border-zinc-700"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Try Opening in Browser
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
