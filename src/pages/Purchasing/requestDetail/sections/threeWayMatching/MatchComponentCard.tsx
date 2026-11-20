import { CheckCircle2, AlertCircle, AlertTriangle, Send, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatMoney } from "../../../utils/purchasingMeta";
import type { ComponentDetails } from "./types";

interface Props {
  component: ComponentDetails;
  onToggleReady?: () => void;
  actionButton?: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
    variant?: "default" | "outline" | "secondary";
    icon?: typeof Send;
  };
}

export function MatchComponentCard({ component, onToggleReady, actionButton }: Props) {
  const { title, subtitle, state, stateLabel, primaryInfo, secondaryInfo, amount, currency, date, actor, department, notes } = component;

  return (
    <div className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
      state === "PRESENT"
        ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50"
        : state === "MISMATCHED"
        ? "bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50"
        : "bg-slate-50/70 dark:bg-zinc-900/40 border-slate-200 dark:border-zinc-800"
    }`}>
      <div className="space-y-3">
        {/* Header with Title and Component Status Badge */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100">{title}</h4>
            <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onToggleReady}
            title={onToggleReady ? (state === "PRESENT" ? "Click to toggle pending" : "Click to mark ready") : undefined}
            className={onToggleReady ? "cursor-pointer hover:opacity-85 transition-opacity" : ""}
          >
            <Badge
              variant="outline"
              className={`text-[10px] font-semibold px-2 py-0.5 shrink-0 gap-1 ${
                state === "PRESENT"
                  ? "bg-emerald-100/70 text-emerald-800 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-300"
                  : state === "MISMATCHED"
                  ? "bg-rose-100/70 text-rose-800 border-rose-300 dark:bg-rose-900/40 dark:text-rose-300"
                  : "bg-amber-100/70 text-amber-800 border-amber-300 dark:bg-amber-900/40 dark:text-amber-300"
              }`}
            >
              {state === "PRESENT" && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
              {state === "MISMATCHED" && <AlertTriangle className="w-3 h-3 text-rose-600" />}
              {state === "MISSING" && <AlertCircle className="w-3 h-3 text-amber-600" />}
              <span>{stateLabel}</span>
            </Badge>
          </button>
        </div>

        {/* Component Body Details */}
        <div className="p-2.5 rounded-lg bg-white/80 dark:bg-zinc-800/60 border border-slate-100 dark:border-zinc-700/60 text-xs space-y-1.5 shadow-2xs">
          <div className="font-semibold text-slate-800 dark:text-zinc-200 break-words">{primaryInfo}</div>
          {secondaryInfo && <div className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">{secondaryInfo}</div>}
          {amount !== undefined && amount > 0 && (
            <div className="font-mono font-bold text-slate-900 dark:text-zinc-100 text-xs">
              Total: {formatMoney(amount, currency)}
            </div>
          )}
          {date && <div className="text-[10.5px] text-slate-400">Date: {date}</div>}
          {actor && <div className="text-[10.5px] text-slate-500 dark:text-zinc-400">By: {actor}</div>}
          {department && !actor && <div className="text-[10.5px] text-slate-500 dark:text-zinc-400">Dept: {department}</div>}
          {notes && <div className="text-[10.5px] italic text-slate-600 dark:text-zinc-300 border-t pt-1 mt-1">{notes}</div>}
        </div>
      </div>

      {/* Action Button if available */}
      {actionButton && (
        <div className="pt-3 mt-3 border-t border-slate-200/60 dark:border-zinc-800/80">
          <Button
            size="sm"
            variant={actionButton.variant || "outline"}
            disabled={actionButton.disabled}
            onClick={actionButton.onClick}
            className="w-full h-7 text-xs font-medium gap-1.5 cursor-pointer shadow-2xs"
          >
            {actionButton.icon ? <actionButton.icon className="w-3 h-3" /> : <Check className="w-3 h-3" />}
            <span>{actionButton.label}</span>
          </Button>
        </div>
      )}
    </div>
  );
}
