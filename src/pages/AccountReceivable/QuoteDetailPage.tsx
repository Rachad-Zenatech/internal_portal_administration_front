import { ArrowLeft, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuoteDetailPage } from "./quoteDetailPage/hooks/useQuoteDetailPage";
import { QuoteDetailPageBody } from "./quoteDetailPage/QuoteDetailPageBody";
import type { QuoteDetailPageGuardedState } from "./quoteDetailPage/hooks/useQuoteDetailPage";

export default function QuoteDetailPage() {
  const s = useQuoteDetailPage();
  const { isLoading, navigate, quote, isError } = s;
  if (isLoading) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-6 animate-pulse">
        <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded-md" />
        <div className="h-12 w-96 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl md:col-span-2" />
          <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        </div>
      </div>
    );
  }
  if (isError || !quote) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Quotation Not Found</h2>
        <p className="text-xs text-slate-500">
          The requested quote does not exist, was removed, or you lack access permission.
        </p>
        <Button
          variant="outline"
          onClick={() => navigate("/account-receivable?tab=quotes")}
          className="text-xs gap-1.5 rounded-xl cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Quotations</span>
        </Button>
      </div>
    );
  }
  return <QuoteDetailPageBody s={s as QuoteDetailPageGuardedState} />;
}
