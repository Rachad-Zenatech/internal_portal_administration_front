import { Send, CheckCircle2, Receipt } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { MatchHeaderBanner } from "./MatchHeaderBanner";
import { MatchComponentCard } from "./MatchComponentCard";
import { RouteToPaymentBanner } from "./RouteToPaymentBanner";
import { useThreeWayMatching } from "./useThreeWayMatching";
import type { RequestDetailViewState } from "../../hooks/useRequestDetailTail";

interface Props {
  v: RequestDetailViewState;
}

export function ThreeWayMatchingCard({ v }: Props) {
  const { onAction } = v;
  const {
    summary,
    togglePo,
    toggleReceipt,
    toggleInvoice,
    handleRouteToDepartment,
    handleConfirmReceipt,
    handleRouteToPaymentQueue,
    isRoutingToDept,
    isRoutingToPayment,
    isTransitionPending,
  } = useThreeWayMatching(v);

  return (
    <Card className="border border-slate-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900">
      <CardHeader className="py-3 px-5 border-b border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/30">
        <CardTitle className="text-sm font-bold flex items-center justify-between text-slate-900 dark:text-zinc-100">
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span>AP Three-Way Matching Workflow</span>
          </div>
          <span className="text-xs font-normal text-muted-foreground hidden sm:inline">
            Automated PO, Service Confirmation &amp; Invoice Reconciliation
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-5 space-y-4">
        <MatchHeaderBanner summary={summary} />

        {/* 3-Way Match Components Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* Component 1: Approved PO */}
          <MatchComponentCard
            component={summary.po}
            onToggleReady={togglePo}
            actionButton={summary.po.state !== "PRESENT" && v.available_actions.includes("APPROVE") ? {
              label: "Approve PO",
              onClick: () => onAction("APPROVE"),
              disabled: isTransitionPending,
              icon: CheckCircle2,
            } : undefined}
          />

          {/* Component 2: Goods receipt / department confirmation */}
          <MatchComponentCard
            component={summary.receipt}
            onToggleReady={toggleReceipt}
            actionButton={summary.receipt.state !== "PRESENT" ? {
              label: isRoutingToDept ? "Routing..." : "Route to Department for Confirmation",
              onClick: handleRouteToDepartment,
              disabled: isRoutingToDept,
              icon: Send,
            } : {
              label: "Confirmed (Update Notes)",
              onClick: handleConfirmReceipt,
              disabled: isTransitionPending,
              icon: CheckCircle2,
            }}
          />

          {/* Component 3: Vendor invoice */}
          <MatchComponentCard
            component={summary.invoice}
            onToggleReady={toggleInvoice}
            actionButton={summary.invoice.state !== "PRESENT" && v.available_actions.includes("RECORD_INVOICE") ? {
              label: "Record Invoice / Receipt",
              onClick: () => onAction("RECORD_INVOICE"),
              disabled: isTransitionPending,
              icon: Receipt,
            } : undefined}
          />
        </div>

        {/* Payment-Ready Queue Routing Banner */}
        <RouteToPaymentBanner
          summary={summary}
          onRouteToPayment={handleRouteToPaymentQueue}
          isRouting={isRoutingToPayment}
        />
      </CardContent>
    </Card>
  );
}
