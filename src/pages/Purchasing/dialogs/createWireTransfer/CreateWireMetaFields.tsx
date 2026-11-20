import { Receipt } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { WireTransferInput } from "@/types/purchasing";

interface Props {
  dialogTitle?: string;
  title: string;
  setTitle: (val: string) => void;
  wire: WireTransferInput;
  setWire: React.Dispatch<React.SetStateAction<WireTransferInput>>;
  requester: string;
  setRequester: (val: string) => void;
  department: string;
  setDepartment: (val: string) => void;
}

export function CreateWireMetaFields({
  dialogTitle,
  title,
  setTitle,
  wire,
  setWire,
  requester,
  setRequester,
  department,
  setDepartment,
}: Props) {
  const isPayable = dialogTitle === "Create a payable";

  return (
    <div className="space-y-4">
      {isPayable && (
        <div className="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 text-xs flex items-start gap-2.5">
          <Receipt className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold text-indigo-950 dark:text-indigo-200">
              AP Three-Way Matching Workflow (Approved PO • Department Confirmation • Vendor Invoice)
            </span>
            <p className="text-[11px] text-indigo-800 dark:text-indigo-300">
              AP focus is on invoice processing &amp; 3-way matching; account coding is pre-assigned to requesting department &amp; approved PO.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className={`space-y-1.5 ${isPayable ? "md:col-span-3" : "md:col-span-6"}`}>
          <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Title</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={wire.vendor ? `Payment for ${wire.vendor}` : 'Leave blank to use "Payment for <vendor>"'}
            className="h-9 text-sm"
          />
        </div>
        {isPayable && (
          <div className="space-y-1.5 md:col-span-3">
            <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">PO # / Match Ref</label>
            <Input
              value={wire.po_number || ""}
              onChange={(e) => setWire({ ...wire, po_number: e.target.value })}
              placeholder="e.g. PO-2026-0012"
              className="h-9 text-sm"
            />
          </div>
        )}
        <div className="space-y-1.5 md:col-span-3">
          <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
            Requester <span className="text-red-500">*</span>
          </label>
          <Input value={requester} onChange={(e) => setRequester(e.target.value)} className="h-9 text-sm" />
        </div>
        <div className="space-y-1.5 md:col-span-3">
          <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
            Department <span className="text-red-500">*</span>
          </label>
          <Input value={department} onChange={(e) => setDepartment(e.target.value)} className="h-9 text-sm" />
        </div>
      </div>
    </div>
  );
}
