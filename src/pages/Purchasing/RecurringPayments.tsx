import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";
import { useRecurringPayments } from "./recurringPayments/hooks/useRecurringPayments";
import { RecurringPaymentsBody } from "./recurringPayments/RecurringPaymentsBody";
import type { RecurringPaymentsGuardedState } from "./recurringPayments/hooks/useRecurringPayments";

export default function RecurringPayments() {
  const s = useRecurringPayments();
  const { navigate, canAccess } = s;
  if (!canAccess) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <ShieldAlert className="w-16 h-16 text-amber-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-800 dark:text-zinc-100">
          Access Restricted
        </h2>
        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
          The Recurring Payments dashboard is only accessible to users with the{" "}
          <strong>TREASURY</strong> or <strong>AP (Accounts Payable)</strong>{" "}
          roles.
        </p>
        <Button className="mt-6" onClick={() => navigate("/purchasing/requests")}>
          Return to Purchase Requests
        </Button>
      </div>
    );
  }
  return <RecurringPaymentsBody s={s as RecurringPaymentsGuardedState} />;
}
