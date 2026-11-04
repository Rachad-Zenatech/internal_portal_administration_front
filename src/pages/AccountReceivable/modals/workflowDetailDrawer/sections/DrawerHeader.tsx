import { CheckCircle2 } from "lucide-react";
import { SheetDescription, SheetHeader, SheetTitle } from "../../../../../components/ui/sheet";
import { STEP_SEQUENCE, STATE_COLORS } from "../constants";
import type { WorkflowDetailDrawerViewState } from "../hooks/useWorkflowDetailDrawerTail";

export function DrawerHeader({ v }: { v: WorkflowDetailDrawerViewState }) {
  const { activeTab, setActiveTab, workflow, currentStepIdx, typeConfig, TypeIcon } = v;
  return (
    <SheetHeader className="p-6 border-b border-border bg-muted/20">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl bg-primary/10 ${typeConfig.color}`}>
                <TypeIcon className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <SheetTitle className="text-base font-bold text-foreground font-mono">
                    {workflow?.reference_id || "Workflow Detail"}
                  </SheetTitle>
                  {workflow && (
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        STATE_COLORS[workflow.state].bg
                      } ${STATE_COLORS[workflow.state].text} ${
                        STATE_COLORS[workflow.state].border
                      }`}
                    >
                      {STATE_COLORS[workflow.state].label}
                    </span>
                  )}
                </div>
                <SheetDescription className="text-xs text-muted-foreground mt-0.5">
                  {typeConfig.label} • Customer:{" "}
                  <strong className="text-foreground">
                    {workflow?.customer_name || workflow?.customer_id}
                  </strong>
                </SheetDescription>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-muted-foreground block">Amount</span>
              <span className="text-lg font-bold font-mono text-foreground">
                ${workflow?.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}{" "}
                <span className="text-xs font-medium text-muted-foreground">
                  {workflow?.currency}
                </span>
              </span>
            </div>
          </div>

          {/* Visual Step Progression Stepper */}
          <div className="mt-6 pt-4 border-t border-border/60">
            <div className="flex items-center justify-between relative">
              {/* Stepper connecting line */}
              <div className="absolute top-3 left-3 right-3 h-0.5 bg-muted z-0" />
              <div
                className="absolute top-3 left-3 h-0.5 bg-primary transition-all duration-300 z-0"
                style={{
                  width: `${
                    currentStepIdx < 0
                      ? 0
                      : Math.min(100, (currentStepIdx / (STEP_SEQUENCE.length - 1)) * 100)
                  }%`,
                }}
              />

              {STEP_SEQUENCE.map((st, idx) => {
                const isPassed = currentStepIdx > idx;
                const isCurrent = currentStepIdx === idx;
                return (
                  <div
                    key={st}
                    className="flex flex-col items-center relative z-10 group"
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                        isPassed
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : isCurrent
                          ? "bg-primary text-primary-foreground ring-4 ring-primary/20 shadow-xs"
                          : "bg-muted text-muted-foreground border border-border"
                      }`}
                    >
                      {isPassed ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
                    </div>
                    <span
                      className={`text-[9px] font-medium mt-1.5 transition-colors text-center ${
                        isCurrent
                          ? "text-primary font-bold"
                          : isPassed
                          ? "text-foreground"
                          : "text-muted-foreground"
                      }`}
                    >
                      {STATE_COLORS[st].label.split(" ")[0]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 mt-5 border-b border-border -mb-6 pb-0 text-xs">
            <button
              onClick={() => setActiveTab("timeline")}
              className={`pb-2.5 font-medium border-b-2 transition-colors ${
                activeTab === "timeline"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Audit History ({workflow?.logs?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab("metadata")}
              className={`pb-2.5 font-medium border-b-2 transition-colors ${
                activeTab === "metadata"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Payload & Metadata
            </button>
            <button
              onClick={() => setActiveTab("actions")}
              className={`pb-2.5 font-medium border-b-2 transition-colors ${
                activeTab === "actions"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Transition & Actions
            </button>
          </div>
        </SheetHeader>
  );
}
