import { useState } from "react";
import { WorkflowAutoCanvas } from "./WorkflowAutoCanvas";
import { ShoppingCart, FileSpreadsheet } from "lucide-react";
import type { WorkflowDomain } from "@/services/experimentalWorkflowService";

interface FlowOption {
  key: WorkflowDomain;
  title: string;
  badge: string;
  label: string;
  icon: typeof ShoppingCart;
  description: string;
  subtitle: string;
}

const FLOW_OPTIONS: FlowOption[] = [
  {
    key: "purchasing",
    title: "Spend Requests Workflow",
    badge: "Spend & Hardware",
    label: "Spend Request Flow",
    icon: ShoppingCart,
    description: "Standard purchase requests: parts, hardware, supplies, approvals, PO and payment.",
    subtitle: "Interactive workflow builder for standard Spend Requests. Add or reorder stages, customize actions, dropdowns, and review controls.",
  },
  {
    key: "purchasing_quote",
    title: "Quote Requests Workflow",
    badge: "RFQ & Estimates",
    label: "Quote Request Flow (RFQ)",
    icon: FileSpreadsheet,
    description: "Vendor quotations & estimates: RFQ dispatch, intake, comparison, approval & PO conversion.",
    subtitle: "Interactive workflow builder for Quote Requests & RFQs. Configure vendor bidding stages, quote comparison controls, and approval gates.",
  },
];

export default function PurchaseRequestsWorkflowAuto() {
  const [activeFlowKey, setActiveFlowKey] = useState<WorkflowDomain>("purchasing");

  const currentFlow = FLOW_OPTIONS.find((f) => f.key === activeFlowKey) || FLOW_OPTIONS[0];

  return (
    <div className="space-y-4">
      {/* Sub-flow Switcher Tabs */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-3 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              Select Purchasing Workflow Type
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Switch between purchasing request flows to customize stages, action buttons, and review checkpoints independently.
            </p>
          </div>
          <div className="inline-flex p-1 bg-slate-100 dark:bg-zinc-800 rounded-lg border border-slate-200 dark:border-zinc-700">
            {FLOW_OPTIONS.map((flow) => {
              const isSelected = activeFlowKey === flow.key;
              const Icon = flow.icon;
              return (
                <button
                  key={flow.key}
                  type="button"
                  onClick={() => setActiveFlowKey(flow.key)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    isSelected
                      ? "bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-2xs font-bold"
                      : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{flow.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Workflow Canvas for the selected flow */}
      <WorkflowAutoCanvas
        key={currentFlow.key}
        domain={currentFlow.key}
        title={currentFlow.title}
        subtitle={currentFlow.subtitle}
      />
    </div>
  );
}

