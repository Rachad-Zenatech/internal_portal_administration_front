import { Landmark, Copy, Check } from "lucide-react";

interface Props {
  task: any;
  copiedKey: string | null;
  handleCopy: (text: string, key: string, label: string) => void;
}

export function WireBankingDetailsCell({ task, copiedKey, handleCopy }: Props) {
  const wt = task.wire_transfer;
  if (!wt) {
    return <span className="text-xs text-slate-400 italic">No wire details</span>;
  }

  return (
    <div className="flex flex-col gap-1.5 p-2 rounded-lg bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100/60 dark:border-indigo-900/40 max-w-[280px]">
      <div className="flex items-center justify-between gap-1">
        <span className="font-bold text-xs text-indigo-950 dark:text-indigo-200 truncate flex items-center gap-1">
          <Landmark className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <span className="truncate">{wt.bank_name || "Bank Listed"}</span>
        </span>
        {wt.bank_country && (
          <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium whitespace-nowrap">
            {wt.bank_country}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-0.5 text-[11px] font-mono">
        {wt.bank_account_number && (
          <div className="flex items-center justify-between gap-2 text-slate-700 dark:text-zinc-300">
            <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-sans">Acct:</span>
            <span className="truncate flex-1 text-right">{wt.bank_account_number}</span>
            <button
              type="button"
              onClick={() => handleCopy(wt.bank_account_number!, `acct-${task.id}`, "Account Number")}
              className="text-slate-400 hover:text-indigo-600 p-0.5 rounded cursor-pointer"
              title="Copy Account Number"
            >
              {copiedKey === `acct-${task.id}` ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
            </button>
          </div>
        )}
        {wt.routing_wire && (
          <div className="flex items-center justify-between gap-2 text-slate-600 dark:text-zinc-400">
            <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-sans">Routing:</span>
            <span className="truncate flex-1 text-right">{wt.routing_wire}</span>
            <button
              type="button"
              onClick={() => handleCopy(wt.routing_wire!, `route-${task.id}`, "Routing Number")}
              className="text-slate-400 hover:text-indigo-600 p-0.5 rounded cursor-pointer"
              title="Copy Routing Number"
            >
              {copiedKey === `route-${task.id}` ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
            </button>
          </div>
        )}
        {wt.swift_code && !wt.routing_wire && (
          <div className="flex items-center justify-between gap-2 text-slate-600 dark:text-zinc-400">
            <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-sans">SWIFT:</span>
            <span className="truncate flex-1 text-right">{wt.swift_code}</span>
            <button
              type="button"
              onClick={() => handleCopy(wt.swift_code!, `swift-${task.id}`, "SWIFT Code")}
              className="text-slate-400 hover:text-indigo-600 p-0.5 rounded cursor-pointer"
              title="Copy SWIFT Code"
            >
              {copiedKey === `swift-${task.id}` ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
