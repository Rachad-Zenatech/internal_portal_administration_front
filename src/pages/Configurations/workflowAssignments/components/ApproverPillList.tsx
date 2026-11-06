import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronDown } from "lucide-react";
import type { ApproverSummary } from "../types";
import { ApproverPill } from "./ApproverPill";

/** Approver Pill List with +X More Popover Dropdown */
export function ApproverPillList({
  approvers,
  maxVisible = 2,
}: {
  approvers: ApproverSummary[];
  maxVisible?: number;
}) {
  if (!approvers || approvers.length === 0) return null;

  const visible = approvers.slice(0, maxVisible);
  const remaining = approvers.slice(maxVisible);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {visible.map((appr) => (
        <ApproverPill
          key={appr.id}
          name={appr.full_name}
          email={appr.email}
          title={appr.job_title}
        />
      ))}

      {remaining.length > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-100/90 text-emerald-900 hover:bg-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-900/60 border border-emerald-300/80 dark:border-emerald-700/80 shadow-2xs transition-colors cursor-pointer"
            >
              <span>+{remaining.length} more</span>
              <ChevronDown className="h-3.5 w-3.5 opacity-70" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-2.5 shadow-xl" align="start">
            <div className="flex items-center justify-between px-1.5 pb-2 border-b border-slate-100 dark:border-slate-800 mb-1.5">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                All Approvers ({approvers.length})
              </span>
              <span className="text-[10px] text-muted-foreground font-medium">Level 1</span>
            </div>
            <div className="max-h-64 overflow-y-auto space-y-1.5 p-0.5" onWheelCapture={(e) => e.stopPropagation()}>
              {approvers.map((appr) => {
                const displayName = appr.full_name || appr.email || "User";
                const initials = displayName
                  .split(" ")
                  .map((p) => p[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase();
                return (
                  <div
                    key={appr.id}
                    className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800/80 transition-colors"
                  >
                    <div className="h-7 w-7 rounded-full bg-emerald-200 text-emerald-800 dark:bg-emerald-800 dark:text-emerald-100 flex items-center justify-center text-[10px] font-bold shrink-0 shadow-2xs">
                      {initials}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate">
                        {displayName}
                      </span>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground truncate">
                        <span>{appr.email}</span>
                        {appr.job_title && (
                          <>
                            <span>&middot;</span>
                            <span className="text-emerald-700 dark:text-emerald-400 truncate font-medium">
                              {appr.job_title}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
