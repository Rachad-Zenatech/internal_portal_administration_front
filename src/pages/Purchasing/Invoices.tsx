import HelpIcon from "@/components/ui/HelpIcon";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw, Plane, ReceiptText } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { formatMoney } from "./utils/purchasingMeta";
import { useInvoices } from "./invoices/hooks/useInvoices";
import { KpiSummaryCards } from "./invoices/sections/KpiSummaryCards";
import { FiltersSearchToolbar } from "./invoices/sections/FiltersSearchToolbar";
import { TableCard } from "./invoices/sections/TableCard";
import { ReadOnlyWireInfo } from "./invoices/sections/ReadOnlyWireInfo";
import { CreateWireTransferDialog } from "./dialogs/CreateWireTransferDialog";
import { TravelStipendsTable } from "./invoices/sections/TravelStipendsTable";
import type { TravelStipend } from "./invoices/sections/TravelStipendsTable";

export default function Invoices() {
  const s = useInvoices();
  const { isLoading, fetchTasks, metrics, canCreateWire, isCreateWireOpen, setIsCreateWireOpen, createWireTitle, setCreateWireTitle, createPrefill, setCreatePrefill } = s;
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") === "stipends" ? "stipends" : "all";

  const handleTabChange = (tab: "all" | "stipends") => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (tab === "stipends") {
        next.set("tab", "stipends");
      } else {
        next.delete("tab");
      }
      return next;
    });
  };

  const handleCreatePayableForStipend = (stipend: TravelStipend) => {
    setCreatePrefill(null);
    setCreateWireTitle(`Create payable - Stipend for ${stipend.recipient_name}`);
    setIsCreateWireOpen(true);
  };

  return (
    <div className="w-full flex flex-col gap-3 sm:gap-3.5 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
              A/P &amp; Invoices
            </h1>
            <HelpIcon text="Track and manage wire payment instructions, vendor bank accounts, traveler stipends, and invoices awaiting AP settlement across all purchasing workflows." />
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Monitoring {metrics.totalCount} payment requests &bull; Outstanding AP Balance:{" "}
            <span className="font-semibold text-slate-900 dark:text-zinc-100">{formatMoney(metrics.pendingAmount)}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Sub-View Toggle (Invoices & Payables vs Travel Stipends) */}
          <div className="flex items-center bg-slate-100 dark:bg-zinc-800/80 p-1 rounded-lg border border-slate-200 dark:border-zinc-700">
            <Button
              variant={activeTab === "all" ? "default" : "ghost"}
              size="sm"
              className={`h-8 gap-1.5 text-xs font-semibold transition-all ${
                activeTab === "all"
                  ? "bg-primary text-primary-foreground shadow-xs hover:bg-primary/95"
                  : "text-muted-foreground hover:text-foreground hover:bg-slate-200/60 dark:hover:bg-zinc-700/60"
              }`}
              onClick={() => handleTabChange("all")}
            >
              <ReceiptText size={14} />
              <span>Invoices &amp; Payables</span>
            </Button>
            <Button
              variant={activeTab === "stipends" ? "default" : "ghost"}
              size="sm"
              className={`h-8 gap-1.5 text-xs font-semibold transition-all ${
                activeTab === "stipends"
                  ? "bg-primary text-primary-foreground shadow-xs hover:bg-primary/95"
                  : "text-muted-foreground hover:text-foreground hover:bg-slate-200/60 dark:hover:bg-zinc-700/60"
              }`}
              onClick={() => handleTabChange("stipends")}
            >
              <Plane size={14} />
              <span>Travel Stipends</span>
            </Button>
          </div>

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
                setCreateWireTitle("Create a payable");
                setIsCreateWireOpen(true);
              }}
              className="h-9 gap-1.5 text-xs font-medium shadow-sm bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Create a payable</span>
            </Button>
          )}
          {canCreateWire && (
            <Button
              size="sm"
              onClick={() => {
                setCreatePrefill(null);
                setCreateWireTitle("Create Wire Transfer");
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

      {activeTab === "stipends" ? (
        /* ── Travel Stipends View ── */
        <TravelStipendsTable onCreatePayableForStipend={handleCreatePayableForStipend} />
      ) : (
        /* ── Standard AP Invoices View ── */
        <>
          {/* ── KPI Summary Cards ── */}
          <KpiSummaryCards s={s} />

          {/* ── Filters & Search Toolbar ── */}
          <FiltersSearchToolbar s={s} />

          {/* ── Table Card ── */}
          <TableCard s={s} />
        </>
      )}

      {/* ── Create Wire Transfer / Create a payable ── */}
      {canCreateWire && (
        <CreateWireTransferDialog
          open={isCreateWireOpen}
          onOpenChange={setIsCreateWireOpen}
          onCreated={fetchTasks}
          prefill={createPrefill}
          dialogTitle={createWireTitle}
        />
      )}

      {/* ── Read-Only Wire Info Details Dialog ── */}
      <ReadOnlyWireInfo s={s} />
    </div>
  );
}
