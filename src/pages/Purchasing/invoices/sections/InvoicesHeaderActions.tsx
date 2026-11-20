import { Button } from "@/components/ui/button";
import { RefreshCw, Plus } from "lucide-react";

interface InvoicesHeaderActionsProps {
  fetchTasks: () => void;
  isLoading: boolean;
  canCreateWire: boolean;
  setCreatePrefill: (prefill: any) => void;
  setCreateWireTitle: (title: string) => void;
  setIsCreateWireOpen: (open: boolean) => void;
}

export function InvoicesHeaderActions({
  fetchTasks,
  isLoading,
  canCreateWire,
  setCreatePrefill,
  setCreateWireTitle,
  setIsCreateWireOpen,
}: InvoicesHeaderActionsProps) {
  return (
    <>
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
    </>
  );
}
