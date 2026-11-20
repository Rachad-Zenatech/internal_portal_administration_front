import { Button } from "@/components/ui/button";
import HelpIcon from "@/components/ui/HelpIcon";
import { formatMoney } from "../../utils/purchasingMeta";
import { ReceiptText, Plane } from "lucide-react";
import { InvoicesHeaderActions } from "./InvoicesHeaderActions";

interface InvoicesHeaderProps {
  metrics: { totalCount: number; pendingAmount: number };
  activeTab: "all" | "stipends";
  handleTabChange: (tab: "all" | "stipends") => void;
  fetchTasks: () => void;
  isLoading: boolean;
  canCreateWire: boolean;
  setCreatePrefill: (prefill: any) => void;
  setCreateWireTitle: (title: string) => void;
  setIsCreateWireOpen: (open: boolean) => void;
}

export function InvoicesHeader({
  metrics,
  activeTab,
  handleTabChange,
  fetchTasks,
  isLoading,
  canCreateWire,
  setCreatePrefill,
  setCreateWireTitle,
  setIsCreateWireOpen,
}: InvoicesHeaderProps) {
  return (
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

        <InvoicesHeaderActions
          fetchTasks={fetchTasks}
          isLoading={isLoading}
          canCreateWire={canCreateWire}
          setCreatePrefill={setCreatePrefill}
          setCreateWireTitle={setCreateWireTitle}
          setIsCreateWireOpen={setIsCreateWireOpen}
        />
      </div>
    </div>
  );
}
