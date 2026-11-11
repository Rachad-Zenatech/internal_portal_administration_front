import { useMemo, useState } from "react";
import { CheckCircle2, ChevronDown, ChevronRight, Circle, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { WorkflowStepNode } from "@/services/experimentalWorkflowService";
import { applyComboSources, computeWorkflowCompleteness } from "../constants/workflowComboSources";

/** Percentage checklist: lifecycle states present, action targets valid, directory fields bound to the right combobox. */
export function WorkflowCompletenessCard({
  nodes,
  domain,
  onApplyFix,
  saving,
}: {
  nodes: WorkflowStepNode[];
  domain?: string;
  onApplyFix: (next: WorkflowStepNode[]) => void;
  saving?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const { items, done, total, percent } = useMemo(() => computeWorkflowCompleteness(nodes, domain), [nodes, domain]);
  const barColor = percent === 100 ? "bg-emerald-500" : percent >= 70 ? "bg-amber-500" : "bg-rose-500";
  const pending = items.filter((i) => !i.ok);

  return (
    <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <button type="button" onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 text-left">
          {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          <span className="font-semibold text-sm">Workflow Alignment Checklist</span>
          <span className="text-xs text-muted-foreground">{done} / {total} checks</span>
        </button>
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold tabular-nums">{percent}%</span>
          {pending.some((i) => i.hint?.startsWith("Should be combobox")) && (
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1" disabled={saving}
              onClick={() => onApplyFix(applyComboSources(nodes))}>
              <Wand2 className="w-3.5 h-3.5" /> Fix all comboboxes
            </Button>
          )}
        </div>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
        <div className={`h-full ${barColor} transition-all`} style={{ width: `${percent}%` }} />
      </div>
      {open && (
        <ul className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-zinc-800 text-xs">
          {[...pending, ...items.filter((i) => i.ok)].map((i, k) => (
            <li key={k} className="flex items-center gap-2 py-1.5">
              {i.ok ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> : <Circle className="w-3.5 h-3.5 text-rose-500 shrink-0" />}
              <span className="text-slate-500 shrink-0">{i.stage}{i.action ? ` › ${i.action}` : ""}</span>
              <span className="font-medium truncate">{i.label}</span>
              {i.hint && <span className="ml-auto text-rose-600 shrink-0">{i.hint}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
