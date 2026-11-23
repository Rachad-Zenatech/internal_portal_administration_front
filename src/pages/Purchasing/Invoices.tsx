import { useSearchParams } from "react-router-dom";
import { useInvoices } from "./invoices/hooks/useInvoices";
import { InvoicesHeader } from "./invoices/sections/InvoicesHeader";
import { KpiSummaryCards } from "./invoices/sections/KpiSummaryCards";
import { PayablesDueCollapsibleTab } from "./invoices/sections/PayablesDueCollapsibleTab";
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
      <InvoicesHeader
        metrics={metrics}
        activeTab={activeTab}
        handleTabChange={handleTabChange}
        fetchTasks={fetchTasks}
        isLoading={isLoading}
        canCreateWire={canCreateWire}
        setCreatePrefill={setCreatePrefill}
        setCreateWireTitle={setCreateWireTitle}
        setIsCreateWireOpen={setIsCreateWireOpen}
      />

      {activeTab === "stipends" ? (
        /* ── Travel Stipends View ── */
        <TravelStipendsTable onCreatePayableForStipend={handleCreatePayableForStipend} />
      ) : (
        /* ── Standard AP Invoices View ── */
        <>
          {/* ── KPI Summary Cards ── */}
          <KpiSummaryCards s={s} />

          {/* ── Collapsible Due Payables Tab ── */}
          <PayablesDueCollapsibleTab s={s} />

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
