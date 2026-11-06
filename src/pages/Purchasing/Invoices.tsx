import HelpIcon from "@/components/ui/HelpIcon";
import { Button } from "@/components/ui/button";
import { Landmark, Plus, RefreshCw } from "lucide-react";
import { formatMoney } from "./utils/purchasingMeta";
import { useInvoices } from "./invoices/hooks/useInvoices";
import { KpiSummaryCards } from "./invoices/sections/KpiSummaryCards";
import { FiltersSearchToolbar } from "./invoices/sections/FiltersSearchToolbar";
import { TableCard } from "./invoices/sections/TableCard";
import { ReadOnlyWireInfo } from "./invoices/sections/ReadOnlyWireInfo";
import { CreateWireTransferDialog } from "./dialogs/CreateWireTransferDialog";

export default function Invoices() {
  const s = useInvoices();
  const { isLoading, fetchTasks, metrics, canCreateWire, isCreateWireOpen, setIsCreateWireOpen, createPrefill, setCreatePrefill } = s;
  return (
    <div className="w-full flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out pb-8">
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-xs">
              <Landmark className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
                  A/P
                </h1>
                <HelpIcon text="Track and manage wire payment instructions, vendor bank accounts, and invoices awaiting AP settlement across all purchasing workflows." />
              </div>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Monitoring {metrics.totalCount} payment requests &bull; Outstanding AP Balance:{" "}
            <span className="font-semibold text-slate-900 dark:text-zinc-100">{formatMoney(metrics.pendingAmount)}</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchTasks}
            disabled={isLoading}
            className="h-9 gap-1.5 text-xs font-medium bg-white dark:bg-zinc-900 shadow-2xs hover:bg-slate-50 dark:hover:bg-zinc-800"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${isLoading ? "animate-spin text-indigo-600" : ""}`} />
            <span>Refresh</span>
          </Button>
          {canCreateWire && (
          <Button
            size="sm"
            onClick={() => {
              setCreatePrefill(null);
              setIsCreateWireOpen(true);
            }}
            className="h-9 gap-1.5 text-xs font-medium shadow-sm bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Create Wire Transfer</span>
          </Button>
          )}
        </div>
      </div>

      {/* ── KPI Summary Cards ── */}
      <KpiSummaryCards s={s} />

      {/* ── Filters & Search Toolbar ── */}
      <FiltersSearchToolbar s={s} />

      {/* ── Table Card ── */}
      <TableCard s={s} />

      {/* ── Create Wire Transfer ── */}
      {canCreateWire && <CreateWireTransferDialog open={isCreateWireOpen} onOpenChange={setIsCreateWireOpen} onCreated={fetchTasks} prefill={createPrefill} />}

      {/* ── Read-Only Wire Info Details Dialog ── */}
      <ReadOnlyWireInfo s={s} />
    </div>
  );
}
