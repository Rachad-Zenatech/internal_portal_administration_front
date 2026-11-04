import { ArrowLeft, AlertCircle, RefreshCw } from "lucide-react";
import { getApiErrorStatus } from "@/services/helper";
import { Button } from "@/components/ui/button";
import { usePurchaseRequestDetail } from "./purchaseRequestDetail/hooks/usePurchaseRequestDetail";
import { PurchaseRequestDetailBody } from "./purchaseRequestDetail/PurchaseRequestDetailBody";
import type { PurchaseRequestDetailGuardedState } from "./purchaseRequestDetail/hooks/usePurchaseRequestDetail";

export default function PurchaseRequestDetail() {
  const s = usePurchaseRequestDetail();
  const { isLoading, navigate, refetch, error, id, request } = s;
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-slate-500">
        <RefreshCw className="h-8 w-8 animate-spin text-indigo-600" />
        <p className="text-sm font-medium">Loading recurring request details...</p>
      </div>
    );
  }
  if (error || !request) {
    const status = getApiErrorStatus(error);
    const [title, message] =
      status === 401 ? ["Session Expired", "Your session has expired. Redirecting to login..."] :
      status === 403 ? ["Access Denied", `You don't have permission to view request #${id}.`] :
      status === 404 || !error ? ["Request Not Found", `The request #${id} could not be located.`] :
      ["Could Not Load Request", `Request #${id} could not be loaded. Please try again.`];
    const canRetry = Boolean(error) && status !== 401 && status !== 403 && status !== 404;
    return (
      <div className="p-8 max-w-2xl mx-auto text-center space-y-4">
        <AlertCircle className="h-12 w-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-zinc-100">{title}</h2>
        <p className="text-sm text-slate-500">{message}</p>
        {canRetry && (
          <Button onClick={() => refetch()} variant="outline" className="gap-2 mr-2">
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        )}
        <Button onClick={() => navigate("/purchasing/recurring")} variant="outline" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Recurring Payments
        </Button>
      </div>
    );
  }
  return <PurchaseRequestDetailBody s={s as PurchaseRequestDetailGuardedState} />;
}
