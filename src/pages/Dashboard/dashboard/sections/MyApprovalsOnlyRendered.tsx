import { ChevronRight } from "lucide-react";
import { formatMoney } from "@/pages/Purchasing/utils/purchasingMeta";
import { UserCheck, CheckCircle2, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { DashboardState } from "../hooks/useDashboard";

export function MyApprovalsOnlyRendered({ s }: { s: DashboardState }) {
  const { myApprovals, navigate, isMyApprovalsLoading, purchasingSummary, isLevelApprover } = s;
  return (
    <>
      {isLevelApprover && (
        <Card className="border border-slate-200 dark:border-zinc-800 shadow-xs overflow-hidden w-full flex flex-col">
          <CardContent className="p-3.5 sm:p-4 flex flex-col gap-3 w-full">
            <div className="flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400 shrink-0">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">My Approvals</span>
                  <span className="text-[11px] text-muted-foreground truncate">
                    {purchasingSummary?.is_company_approver ? "Company Level 2 approver" : "Department Level 1 approver"}
                  </span>
                </div>
                {myApprovals.length > 0 && (
                  <Badge variant="secondary" className="ml-1 shrink-0">{myApprovals.length}</Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0"
                onClick={() => navigate("/purchasing/my-approvals")}
              >
                View all
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            {isMyApprovalsLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-6 justify-center">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading your approvals…
              </div>
            ) : myApprovals.length === 0 ? (
              <div className="flex flex-col items-center gap-1.5 py-6 text-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">You're all caught up</span>
                <span className="text-[11px] text-muted-foreground">No requests are waiting on your approval.</span>
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-slate-100 dark:divide-zinc-800">
                {myApprovals.slice(0, 5).map((req) => (
                  <button
                    key={req.id}
                    type="button"
                    onClick={() => navigate(`/purchasing/requests/${req.id}`)}
                    className="flex items-center justify-between gap-3 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-colors rounded-md px-1.5 -mx-1.5"
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{req.title}</span>
                      <span className="text-[11px] text-muted-foreground truncate">
                        #{req.id} · {req.requester}
                        {req.department ? ` · ${req.department}` : ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-semibold tabular-nums">{formatMoney(req.amount ?? 0)}</span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </button>
                ))}
                {myApprovals.length > 5 && (
                  <button
                    type="button"
                    onClick={() => navigate("/purchasing/my-approvals")}
                    className="py-2.5 text-xs font-medium text-violet-600 dark:text-violet-400 hover:underline text-center"
                  >
                    {myApprovals.length - 5} more awaiting your approval
                  </button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
}
