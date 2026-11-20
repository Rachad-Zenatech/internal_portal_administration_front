import { Landmark, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  task: any;
  setSelectedWireTask: (t: any) => void;
  navigate: (url: string) => void;
}

export function InvoiceActionsCell({ task, setSelectedWireTask, navigate }: Props) {
  const hasWire = Boolean(task.wire_transfer);

  return (
    <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
      {hasWire && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSelectedWireTask(task)}
          title="View Wire Banking Info"
          className="h-7 w-7 p-0 rounded-md border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/60"
        >
          <Landmark className="h-3.5 w-3.5" />
        </Button>
      )}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(`/purchasing/requests/${task.id}`)}
        title="Open Full Request"
        className="h-7 w-7 p-0 rounded-md text-slate-500 hover:text-slate-900 dark:hover:text-zinc-100"
      >
        <ArrowUpRight className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
