import { useEffect, useRef } from "react";
import { Pencil } from "lucide-react";
import { Input } from "../../../components/ui/input";
import { sanitizeHtml } from "../../../lib/sanitizeHtml";

const SAMPLE_QUOTE_LINK = "https://portal.zenatech.com/q/sample-secure-token";

interface QuoteEmailVisualEditorProps {
  recipientEmail: string;
  subject: string;
  onSubjectChange: (value: string) => void;
  renderedHtml: string;
  templateVersionKey: string;
  onBodyHtmlEdit: (newHtml: string) => void;
}

export function QuoteEmailVisualEditor({
  recipientEmail,
  subject,
  onSubjectChange,
  renderedHtml,
  templateVersionKey,
  onBodyHtmlEdit,
}: QuoteEmailVisualEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const lastAppliedKeyRef = useRef<string>("");

  useEffect(() => {
    if (!editorRef.current) return;
    if (lastAppliedKeyRef.current !== templateVersionKey) {
      editorRef.current.innerHTML = sanitizeHtml(renderedHtml);
      lastAppliedKeyRef.current = templateVersionKey;
    }
  }, [renderedHtml, templateVersionKey]);

  const handleSyncBack = () => {
    if (!editorRef.current) return;
    const edited = editorRef.current.innerHTML.replace(
      new RegExp(SAMPLE_QUOTE_LINK.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
      "{{quote_link}}"
    );
    onBodyHtmlEdit(edited);
  };

  return (
    <div className="space-y-2.5">
      <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2 text-xs text-slate-600 dark:text-slate-300">
        <div className="flex items-center gap-2">
          <span className="font-semibold w-14 shrink-0">To:</span>
          <span className="text-slate-800 dark:text-slate-100">{recipientEmail || "(No email specified)"}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-semibold w-14 shrink-0">Subject:</span>
          <Input
            value={subject}
            onChange={(e) => onSubjectChange(e.target.value)}
            className="h-7 text-xs bg-white dark:bg-slate-900 flex-1"
            placeholder="Email subject..."
          />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100/70 dark:bg-slate-900/60 overflow-hidden shadow-xs">
        <div className="px-3.5 py-1.5 bg-white/90 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
          <span className="inline-flex items-center gap-1.5 font-medium text-indigo-600 dark:text-indigo-400">
            <Pencil className="w-3 h-3" />
            <span>Direct Edit Preview — click any text below to edit before sending</span>
          </span>
          <span className="text-[10px] text-slate-400">Secure link auto-generated on send</span>
        </div>

        <div className="p-4 sm:p-5 overflow-x-auto">
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={handleSyncBack}
            onBlur={handleSyncBack}
            className="outline-none focus:ring-2 focus:ring-indigo-400/50 rounded-xl transition-shadow"
          />
        </div>
      </div>
    </div>
  );
}
