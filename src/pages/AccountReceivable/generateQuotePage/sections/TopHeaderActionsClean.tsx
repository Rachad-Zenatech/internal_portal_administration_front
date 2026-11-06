import { ArrowLeft, Check, Eye, FileSpreadsheet, Loader2, Printer, RotateCcw, Save, Send, Trash2 } from "lucide-react";
import { Button } from "../../../../components/ui/button";
import { Badge } from "../../../../components/ui/badge";
import type { GenerateQuotePageState } from "../hooks/useGenerateQuotePage";

export function TopHeaderActionsClean({ s }: { s: GenerateQuotePageState }) {
  const { setIsSendModalOpen, quoteId, publicationState, isSaving, handlePublishQuote, handleDeleteDraft, handleSaveDraft, handlePrintPdf, handleClearQuoteForm, navigate, sourceInvoiceNumber, quoteType, quoteNumber, formTopRef } = s;
  return (
    <div
        ref={formTopRef}
        className="bg-card border border-border/80 px-4 py-3 rounded-2xl shadow-xs flex flex-wrap lg:flex-nowrap items-center justify-between gap-3 print:hidden w-full"
      >
        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (quoteId) {
                navigate(`/account-receivable/quotes/${quoteId}`);
              } else {
                navigate("/account-receivable?tab=quotes");
              }
            }}
            className="text-xs gap-1.5 h-8 px-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{quoteId ? "Back to Details" : "Back to Quotes"}</span>
          </Button>

          <div className="h-4 w-px bg-border shrink-0" />

          {quoteId ? (
            <Badge
              variant="outline"
              className="text-xs px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800 gap-1.5 font-medium font-mono"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Editing {quoteNumber}</span>
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="text-xs px-2.5 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 gap-1.5 font-medium"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Quote Generator</span>
            </Badge>
          )}

          {publicationState === "PUBLISHED" ? (
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-300 text-[10px] h-6">
              Published
            </Badge>
          ) : (
            <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 text-[10px] h-6">
              Draft
            </Badge>
          )}

          {quoteType === "RENEWAL" && (
            <Badge
              variant="outline"
              className="text-xs px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 gap-1.5 font-semibold"
            >
              <span>🔄 Renewal Quotation</span>
              {sourceInvoiceNumber && (
                <span className="text-[10px] font-normal text-indigo-600/80 dark:text-indigo-400">
                  (From #{sourceInvoiceNumber})
                </span>
              )}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
          {quoteId && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/account-receivable/quotes/${quoteId}`)}
              className="text-xs gap-1.5 h-8 px-3 bg-card hover:bg-muted text-foreground cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>View Details</span>
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleClearQuoteForm}
            className="text-xs gap-1.5 h-8 px-3 text-muted-foreground hover:text-foreground cursor-pointer"
            title="Clear all fields and reset quotation form"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear Form</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handlePrintPdf}
            className="text-xs gap-1.5 h-8 px-3 bg-card hover:bg-muted text-foreground cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / PDF</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveDraft}
            disabled={isSaving}
            className="text-xs gap-1.5 h-8 px-3 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 bg-amber-50/50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/50 cursor-pointer"
          >
            {isSaving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>Save Draft</span>
          </Button>

          {quoteId && publicationState === "DRAFT" && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeleteDraft}
              disabled={isSaving}
              className="text-xs gap-1.5 h-8 px-3 border-rose-200 text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 dark:border-rose-800 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Delete Draft</span>
            </Button>
          )}

          <Button
            size="sm"
            onClick={handlePublishQuote}
            disabled={isSaving}
            className="text-xs gap-1.5 h-8 px-3.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-xs cursor-pointer"
          >
            {isSaving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
            <span>Publish Quote</span>
          </Button>

          {publicationState === "PUBLISHED" && quoteId && (
            <Button
              size="sm"
              onClick={() => setIsSendModalOpen(true)}
              className="text-xs gap-1.5 h-8 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send to Customer</span>
            </Button>
          )}
        </div>
      </div>
  );
}
