import { useState } from "react";
import { WorkflowAutoCanvas } from "./WorkflowAutoCanvas";
import { Receipt, Landmark } from "lucide-react";
import type { WorkflowDomain } from "@/services/experimentalWorkflowService";

interface FlowOption {
  key: WorkflowDomain;
  title: string;
  badge: string;
  label: string;
  icon: typeof Receipt;
  description: string;
  subtitle: string;
}

const AP_FLOW_OPTIONS: FlowOption[] = [
  {
    key: "invoices_payable",
    title: "Create a Payable Workflow",
    badge: "Invoices & Payables",
    label: "Create a Payable Flow",
    icon: Receipt,
    description: "Standard vendor bill intake, GL account coding, invoice verification, approval and disbursement.",
    subtitle: "Interactive customizable workflow builder for Create a Payable / Vendor Invoices. Configure GL coding steps, PO matching, and payment release.",
  },
  {
    key: "invoices",
    title: "Wire Transfer Workflow",
    badge: "Wire Transfers & Banking",
    label: "Wire Transfer Flow",
    icon: Landmark,
    description: "Domestic and international wire payments: beneficiary banking details, SWIFT/IBAN, and dual approval routing.",
    subtitle: "Interactive customizable workflow builder for Wire Transfers. Add stages, configure matching and wire payment actions with clearing codes.",
  },
];

export default function APInvoicesWorkflowAuto() {
  const [activeFlowKey, setActiveFlowKey] = useState<WorkflowDomain>("invoices_payable");

  const currentFlow = AP_FLOW_OPTIONS.find((f) => f.key === activeFlowKey) || AP_FLOW_OPTIONS[0];

  return (
    <div className="space-y-4">
      {/* Sub-flow Switcher Tabs */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-3 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              Select A/P & Invoices Workflow Type
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Switch between Create a Payable and Wire Transfer workflows to manage stages, GL review checkpoints, and action buttons independently.
            </p>
          </div>
          <div className="inline-flex p-1 bg-slate-100 dark:bg-zinc-800 rounded-lg border border-slate-200 dark:border-zinc-700">
            {AP_FLOW_OPTIONS.map((flow) => {
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

