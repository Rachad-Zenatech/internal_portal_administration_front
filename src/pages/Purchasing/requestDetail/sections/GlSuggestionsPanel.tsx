import { useState } from "react";
import { Sparkles, Check, ArrowRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { rerunGlSuggestions } from "@/services/productAiService";
import type { GLSuggestion, GLSuggestions } from "@/types/productAi";

const CARD_BASE = "group relative p-2.5 rounded-lg border text-left cursor-pointer transition-all shadow-sm";
const CARD_BEST = "bg-amber-50/90 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 hover:border-amber-400";
const CARD_OTHER = "bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 hover:border-indigo-300 dark:hover:border-indigo-700";

type Props = {
  requestId: string | number;
  suggestions: GLSuggestions | null | undefined;
  appliedCode: string | null;
  onApply: (accountNumber: string, accountName: string) => void;
  refetch?: () => unknown;
};

/** The saved AI chart-of-accounts suggestions (worked out once on the server), with a button to work them out again. */
export function GlSuggestionsPanel({ requestId, suggestions, appliedCode, onApply, refetch }: Props) {
  const [rerunning, setRerunning] = useState(false);
  const list = suggestions?.suggestions ?? [];

  const rerun = () => {
    setRerunning(true);
    rerunGlSuggestions(String(requestId))
      .then(() => {
        toast.success("Chart of accounts suggestions updated");
        refetch?.();
      })
      .catch(() => toast.error("Could not update the suggestions"))
      .finally(() => setRerunning(false));
  };

  return (
    <div className="sm:col-span-2 pt-3 border-t border-indigo-100/80 dark:border-indigo-900/50 space-y-2">
      <PanelHeader rerunning={rerunning} onRerun={rerun} />
      {rerunning ? (
        <div className="text-xs text-slate-500 animate-pulse py-1">
          Running Finance 5-step classification &amp; MongoDB Atlas vector analysis...
        </div>
      ) : list.length > 0 ? (
        <div className="space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {list.map((s, idx) => (
              <SuggestionCard key={s.account_number} s={s} idx={idx} applied={appliedCode === s.account_number} onApply={onApply} />
            ))}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-zinc-400 italic">{suggestions?.evidence_summary}</div>
        </div>
      ) : (
        <NoSuggestions pending={!suggestions} onApply={onApply} />
      )}
    </div>
  );
}

function PanelHeader({ rerunning, onRerun }: { rerunning: boolean; onRerun: () => void }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 dark:text-indigo-200">
        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
        <span>AI Suggested Chart of Accounts (Top 3 Candidates)</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-muted-foreground">Click any suggestion to apply to Invoice Category</span>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={rerunning}
          onClick={onRerun}
          className="h-6 px-2 text-[10px] border-indigo-200 text-indigo-700 hover:bg-indigo-100 dark:border-indigo-800 dark:text-indigo-300"
        >
          <RefreshCw className={`w-3 h-3 mr-1 ${rerunning ? "animate-spin" : ""}`} />
          {rerunning ? "Running..." : "Re-run"}
        </Button>
      </div>
    </div>
  );
}

function SuggestionCard({ s, idx, applied, onApply }: { s: GLSuggestion; idx: number; applied: boolean; onApply: Props["onApply"] }) {
  const isBest = idx === 0;
  return (
    <div
      onClick={() => onApply(s.account_number, s.account_name)}
      className={`${CARD_BASE} ${isBest ? CARD_BEST : CARD_OTHER} ${applied ? "ring-2 ring-emerald-500" : ""}`}
    >
      <div className="flex items-center justify-between gap-1 mb-1">
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-mono">
          {s.account_number}
        </span>
        <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">{(s.confidence * 100).toFixed(0)}% match</span>
      </div>
      <div className="text-xs font-semibold text-slate-800 dark:text-zinc-200 line-clamp-1" title={s.account_name}>
        {s.account_name}
      </div>
      <p className="text-[10px] text-slate-500 dark:text-zinc-400 mt-1 line-clamp-2 leading-tight">{s.reason}</p>
      <div className="mt-2 pt-1 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-[10px] font-medium">
        <span className={isBest ? "text-amber-700 dark:text-amber-400 font-bold" : "text-slate-400"}>
          {isBest ? "★ Best Match" : `Option #${idx + 1}`}
        </span>
        <span className="flex items-center gap-0.5 text-indigo-600 dark:text-indigo-400 group-hover:translate-x-0.5 transition-transform">
          {applied ? (
            <span className="text-emerald-600 font-bold flex items-center gap-0.5">
              <Check className="w-3 h-3" /> Applied
            </span>
          ) : (
            <>
              Use this <ArrowRight className="w-2.5 h-2.5" />
            </>
          )}
        </span>
      </div>
    </div>
  );
}

function NoSuggestions({ pending, onApply }: { pending: boolean; onApply: Props["onApply"] }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {pending && <span className="text-xs text-slate-500">Suggestions are being worked out in the background.</span>}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onApply("6340", "Office Expense:Office Supplies")}
        className="h-7 text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-100"
      >
        <Sparkles className="w-3 h-3 mr-1 text-amber-500" />
        Default to 6340 (Office Supplies)
      </Button>
    </div>
  );
}
