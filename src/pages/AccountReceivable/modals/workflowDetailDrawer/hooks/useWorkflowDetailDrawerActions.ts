import type { ARWorkflowState, ARWorkflowType } from "../../../../../types/ar";
import { STEP_SEQUENCE, TYPE_CONFIGS } from "../constants";
import type { WorkflowDetailDrawerGuardedState } from "./useWorkflowDetailDrawer";

export function useWorkflowDetailDrawerActions(ctx: WorkflowDetailDrawerGuardedState) {
  const { workflow } = ctx;
  const currentType = workflow?.workflow_type || "INITIAL_SALE";
  const currentState = workflow?.state || "DRAFT";
  const typeConfig = TYPE_CONFIGS[currentType];
  const TypeIcon = typeConfig.icon;
  // Allowed transitions determination
  const getAllowedTargetStates = (type: ARWorkflowType, state: ARWorkflowState): ARWorkflowState[] => {
    if (state === "COMPLETED" || state === "CANCELLED") return [];
    if (type === "CASH") {
      if (state === "DRAFT") return ["PENDING_REVIEW", "RECONCILED", "CANCELLED"];
      if (state === "PENDING_REVIEW") return ["RECONCILED", "COMPLETED", "CANCELLED"];
      if (state === "RECONCILED") return ["COMPLETED", "CANCELLED"];
    }
    if (state === "DRAFT") return ["PENDING_REVIEW", "INVOICE_SENT", "CANCELLED"];
    if (state === "PENDING_REVIEW") return ["INVOICE_SENT", "CANCELLED"];
    if (state === "INVOICE_SENT") return ["AWAITING_PAYMENT", "DUNNING_REMINDER", "RECONCILED", "COMPLETED", "CANCELLED"];
    if (state === "AWAITING_PAYMENT") return ["DUNNING_REMINDER", "RECONCILED", "COMPLETED", "CANCELLED"];
    if (state === "DUNNING_REMINDER") return ["AWAITING_PAYMENT", "RECONCILED", "COMPLETED", "CANCELLED"];
    if (state === "RECONCILED") return ["COMPLETED", "CANCELLED"];
    return ["CANCELLED"];
  };
  const allowedStates = workflow ? getAllowedTargetStates(currentType, currentState) : [];
  const getStepIndex = (state: ARWorkflowState) => {
    if (state === "DUNNING_REMINDER") return 3; // within awaiting payment
    return STEP_SEQUENCE.indexOf(state);
  };
  const currentStepIdx = getStepIndex(currentState);
  return { currentType, currentState, typeConfig, TypeIcon, allowedStates, currentStepIdx };
}
