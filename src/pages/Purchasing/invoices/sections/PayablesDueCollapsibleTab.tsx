import { useState, useMemo } from "react";
import { ChevronDown, ChevronUp, Mail, ArrowRight, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { apiClient as api } from "@/services/apiClient";
import { formatMoney } from "../../utils/purchasingMeta";
import { PayablesDueRow } from "./PayablesDueRow";
import type { InvoicesState } from "../hooks/useInvoices";

export function PayablesDueCollapsibleTab({ s }: { s: InvoicesState }) {
  const { tasks, setQuickFilter, quickFilter, isDueToday, isOverdue } = s;
  const [isOpen, setIsOpen] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const dueItems = useMemo(() => {
    return tasks.filter((t) => isDueToday(t.due_date, t.status) || isOverdue(t.due_date, t.status));
  }, [tasks, isDueToday, isOverdue]);

  const dueCount = dueItems.length;
  if (dueCount === 0) return null;

  const overdueCount = dueItems.filter((t) => isOverdue(t.due_date, t.status)).length;
  const dueTodayCount = dueItems.filter((t) => isDueToday(t.due_date, t.status)).length;
  const totalDueAmount = dueItems.reduce((acc, t) => acc + Number(t.amount || 0), 0);

  const handleSendMorningEmail = async () => {
    setIsSendingEmail(true);
    try {
      const res: any = await api.post("/api/purchasing/payables/send-due-digest?force=true");
      if (res?.data?.sent) {
        toast.success(`Morning Payables Digest email sent to ${res.data.emails_sent} AP & Treasury recipient(s)!`);
      } else {
        toast.info(res?.data?.message || "No email was sent.");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to dispatch morning digest email.");
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <div className="rounded-xl border border-amber-200/90 dark:border-amber-900/60 bg-gradient-to-r from-amber-50/70 via-orange-50/40 to-amber-50/60 dark:from-amber-950/30 dark:via-zinc-900 dark:to-amber-950/20 shadow-xs overflow-hidden transition-all duration-200">
      <div
        onClick={() => setIsOpen((prev) => !prev)}
        className="px-4 py-3 flex items-center justify-between cursor-pointer select-none hover:bg-amber-100/40 dark:hover:bg-amber-900/30 transition-colors"
      >
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="h-7 w-7 rounded-lg bg-amber-500/15 dark:bg-amber-500/25 flex items-center justify-center text-amber-700 dark:text-amber-300 font-bold text-xs shrink-0">
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-zinc-100">
                Payables Due ({dueCount} Due)
              </span>
              <Badge className="bg-red-500 hover:bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 shadow-2xs">
                {overdueCount > 0 ? `${overdueCount} Overdue` : `${dueTodayCount} Due Today`}
              </Badge>
              {overdueCount > 0 && dueTodayCount > 0 && (
                <Badge variant="outline" className="border-amber-400 text-amber-800 dark:text-amber-300 text-[10px] font-medium px-2 py-0.5">
                  {dueTodayCount} Today
                </Badge>
              )}
            </div>
            <p className="text-[11px] text-slate-600 dark:text-zinc-400 mt-0.5">
              Outstanding volume: <span className="font-semibold text-slate-900 dark:text-zinc-200">{formatMoney(totalDueAmount)}</span> &bull; Click tab to expand / collapse
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              handleSendMorningEmail();
            }}
            disabled={isSendingEmail}
            title="Dispatch the morning payables digest email to AP & Treasury now"
            className="h-7 text-[11px] gap-1 px-2.5 bg-white/80 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 shadow-2xs hover:bg-white cursor-pointer hidden sm:inline-flex"
          >
            <Mail className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
            <span>{isSendingEmail ? "Sending..." : "Send Morning Email"}</span>
          </Button>

          <Button type="button" size="sm" variant="ghost" className="h-7 w-7 p-0 rounded-full text-slate-500">
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {isOpen && (
        <div className="p-3 sm:p-4 border-t border-amber-200/60 dark:border-amber-900/40 bg-white/80 dark:bg-zinc-900/90 space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-zinc-800 text-[11px] text-muted-foreground">
            <span>Items requiring settlement:</span>
            <Button
              type="button"
              variant="link"
              size="sm"
              onClick={() => setQuickFilter(quickFilter === "DUE_TODAY" ? "ALL" : "DUE_TODAY")}
              className="h-auto p-0 text-[11px] text-amber-700 dark:text-amber-400 font-semibold cursor-pointer gap-1"
            >
              <span>{quickFilter === "DUE_TODAY" ? "Clear Table Filter" : "Filter Main Table to Due Items"}</span>
              <ArrowRight className="w-3 h-3" />
            </Button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-zinc-800 max-h-60 overflow-y-auto pr-1">
            {dueItems.map((item) => (
              <PayablesDueRow key={item.id} item={item} isOverdue={isOverdue} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
