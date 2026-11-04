import { getApiErrorStatus } from "@/services/helper";
import { ArrowLeft } from "lucide-react";
import PurchaseRequestDetail from "./PurchaseRequestDetail";
import { Button } from "@/components/ui/button";
import { useRequestDetail } from "./requestDetail/hooks/useRequestDetail";
import { RequestDetailBody } from "./requestDetail/RequestDetailBody";
import type { RequestDetailGuardedState } from "./requestDetail/hooks/useRequestDetail";

export default function RequestDetail() {
  const s = useRequestDetail();
  const { isLoading, refetch, backUrl, navigate, isError, error, data, isRecurring } = s;
  if (isLoading) {
    return <div className="p-8 text-sm text-muted-foreground">Loading request...</div>;
  }
  if (isError || !data) {
    const status = getApiErrorStatus(error);
    const message =
      status === 401 ? "Your session has expired. Redirecting to login..." :
      status === 403 ? "You don't have permission to view this request." :
      status === 404 || !isError ? "This request doesn't exist, has been deleted, or you don't have access to it." :
      "Could not load this request. Please try again.";
    const canRetry = isError && status !== 401 && status !== 403 && status !== 404;
    return (
      <div className="p-8">
        <Button variant="outline" onClick={() => navigate(backUrl)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <p className="mt-4 text-sm text-red-600">{message}</p>
        {canRetry && (
          <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
            Retry
          </Button>
        )}
      </div>
    );
  }
  if (isRecurring) {
    return <PurchaseRequestDetail />;
  }
  return <RequestDetailBody s={s as RequestDetailGuardedState} />;
}
