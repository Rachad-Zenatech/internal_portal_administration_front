import { ShieldAlert, AlertTriangle } from "lucide-react";
import Stepper from "@/components/common/Stepper";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { RequestStatus } from "@/types/purchasing";
import { formatDate } from "../../utils/purchasingMeta";
import type { RequestDetailViewState } from "../hooks/useRequestDetailTail";

export function WorkflowStepperSection({ v }: { v: RequestDetailViewState }) {
  const { flow, request, isSelfApprovalBlocked } = v;
  const isUrgentOverride = Boolean((request.quote_data as Record<string, unknown> | null | undefined)?.is_urgent_override);

  return (
    <div className="space-y-4">
      {/* Workflow Stepper */}
      <Card className="border border-slate-200 dark:border-zinc-800 shadow-sm">
        <CardContent className="py-5 px-6">
          <Stepper flow={flow} requestStatus={request.status} isUrgentOverride={isUrgentOverride} />
          {request.status === "REJECTED" && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm font-medium text-red-600 dark:text-red-400">
              This request was rejected.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Self-Approval Restriction Banner */}
      {isSelfApprovalBlocked && (
        <Alert className="bg-amber-50/90 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200">
          <ShieldAlert className="h-4 w-4 !text-amber-600 dark:!text-amber-400" />
          <AlertTitle className="font-semibold text-xs sm:text-sm">Self-Approval Restriction</AlertTitle>
          <AlertDescription className="text-xs text-amber-800 dark:text-amber-300 mt-1">
            As the requester of this purchase request, you cannot approve or reject your own request. Another eligible approver must review and take action on this submission.
          </AlertDescription>
        </Alert>
      )}

      {request.status === RequestStatus.OnHold && request.hold_reason && (
        <Alert className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300">
          <AlertTriangle className="h-4 w-4 !text-amber-600 dark:!text-amber-400" />
          <AlertTitle className="flex items-center justify-between font-semibold">
            <span>On Hold</span>
            {request.hold_date && <span className="text-xs font-normal opacity-75">{formatDate(request.hold_date)}</span>}
          </AlertTitle>
          <AlertDescription className="mt-2 whitespace-pre-wrap">
            {request.hold_reason}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
