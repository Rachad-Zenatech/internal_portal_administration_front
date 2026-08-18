import { useChartOfAccounts } from "@/hooks/useChartOfAccount";
import AddAccountDialog from "@/components/ChartOfAccounts/AddAccountDialog";
import COATable from "@/components/ChartOfAccounts/COATable";
import { useAuth } from "@/lib/AuthContext";

export default function ChartOfAccounts() {
  const { data: result, isPending: loadingData } = useChartOfAccounts(true);
  const { hasPermission } = useAuth();
  
  const canCreate = hasPermission("CONFIG_CHART_OF_ACCOUNTS_CREATE") || hasPermission("CHART_OF_ACCOUNTS_CREATE");

  return (
    <div className="w-full space-y-6 pb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">Chart of Accounts</h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
            General ledger accounts used across purchasing, purchase requests, and accounts payable.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {canCreate && <AddAccountDialog />}
        </div>
      </div>

      <COATable result={result} loadingData={loadingData} />
    </div>
  );
}
