import { useState, useRef } from "react";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ATTACHMENT_ACCEPT } from "../constants";

// Direct uploader for the Attachments tab. Unlike AttachmentDropzone (which stages
// files for submission alongside a workflow form), this uploads immediately so files
// can be attached without running a transition.
export function InlineAttachmentUploader({
  onUpload,
  isUploading,
}: {
  onUpload: (files: File[]) => void;
  isUploading: boolean;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!isUploading) setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        if (isUploading) return;
        if (e.dataTransfer.files?.length) onUpload(Array.from(e.dataTransfer.files));
      }}
      className={cn(
        "flex items-center justify-between gap-2 rounded-lg border border-dashed px-3 py-2 mb-3 transition-colors",
        isDragging
          ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-950/30"
          : "border-slate-300 dark:border-zinc-700"
      )}
    >
      <p className="text-[11px] text-slate-500 dark:text-zinc-400 min-w-0">
        Drag &amp; drop files here, or browse to attach.
      </p>
      <Button
        size="sm"
        variant="outline"
        disabled={isUploading}
        onClick={() => inputRef.current?.click()}
        className="h-7 px-2.5 text-xs gap-1.5 shrink-0 cursor-pointer"
      >
        <Upload className="h-3 w-3" />
        {isUploading ? "Uploading..." : "Upload Files"}
      </Button>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ATTACHMENT_ACCEPT}
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) onUpload(Array.from(e.target.files));
          e.target.value = "";
        }}
      />
    </div>
  );
}
