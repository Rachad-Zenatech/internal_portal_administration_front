import type { ARWorkflowState, ARWorkflowType, MatchedInvoiceItem } from "../../../../types/ar";
import { DEFAULT_STEP_SEQUENCE, CASH_STEP_SEQUENCE, CASH_CLERK_STEP_SEQUENCE, STATE_CONFIG, TYPE_CONFIGS } from "../constants";
import type { WorkflowDetailGuardedState } from "./useWorkflowDetail";

export function useWorkflowDetailActions3(ctx: WorkflowDetailGuardedState) {
  const { resolvedCustomer, workflow, treasuryList } = ctx;
  const customerDetails = {
    contact_person:
      workflow.metadata?.customer_details?.contact_person ||
      workflow.metadata?.customer_details?.name ||
      resolvedCustomer?.contact_person ||
      workflow.customer_name ||
      "—",
    name:
      workflow.metadata?.customer_details?.name ||
      resolvedCustomer?.name ||
      workflow.customer_name ||
      "—",
    email:
      workflow.metadata?.customer_details?.email ||
      resolvedCustomer?.email ||
      "—",
    phone:
      workflow.metadata?.customer_details?.phone ||
      resolvedCustomer?.phone ||
      "—",
    billing_address:
      workflow.metadata?.customer_details?.billing_address ||
      workflow.metadata?.customer_details?.address ||
      resolvedCustomer?.billing_address ||
      "—",
    tax_id:
      workflow.metadata?.customer_details?.tax_id ||
      resolvedCustomer?.tax_id ||
      "—",
  };
  const rawBank = workflow.metadata?.banking_details || workflow.metadata || {};
  const resolvedBank = resolvedCustomer?.banking_details || {};
  const bankingDetails = {
    bank_name: rawBank.bank_name || resolvedBank.bank_name || "—",
    bank_account_number:
      rawBank.bank_account_number || resolvedBank.bank_account_number || "—",
    bank_country: rawBank.bank_country || resolvedBank.bank_country || "—",
    routing_wire:
      rawBank.routing_wire ||
      rawBank.bank_transit_routing ||
      resolvedBank.routing_wire ||
      resolvedBank.bank_transit_routing ||
      "—",
    routing_ach: rawBank.routing_ach || resolvedBank.routing_ach || "—",
    swift_code:
      rawBank.swift_code ||
      rawBank.bank_swift_bic ||
      resolvedBank.swift_code ||
      resolvedBank.bank_swift_bic ||
      "—",
    iban:
      rawBank.iban ||
      rawBank.bank_iban ||
      resolvedBank.iban ||
      resolvedBank.bank_iban ||
      "—",
    transit_code_ca:
      rawBank.transit_code_ca || resolvedBank.transit_code_ca || "—",
    institution_code:
      rawBank.institution_code || resolvedBank.institution_code || "—",
    region: rawBank.region || resolvedBank.region || "—",
  };
  const currentType = workflow.workflow_type;
  const currentState = workflow.state;
  const typeConfig = TYPE_CONFIGS[currentType] || TYPE_CONFIGS.CASH;
  const stateConfig = STATE_CONFIG[currentState] || STATE_CONFIG.DRAFT;
  const TypeIcon = typeConfig.icon;
  // FSM allowed targets
  const getAllowedTargetStates = (type: ARWorkflowType, state: ARWorkflowState): ARWorkflowState[] => {
    if (state === "COMPLETED" || state === "CANCELLED") return [];
    if (type === "CASH") {
      if (state === "DRAFT") return ["PENDING_REVIEW", "CLERK_REVIEW", "RECONCILED", "CANCELLED"];
      if (state === "PENDING_REVIEW") return ["CLERK_REVIEW", "RECONCILED", "COMPLETED", "CANCELLED"];
      if (state === "CLERK_REVIEW") return ["RECONCILED", "CANCELLED"];
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
  const allowedStates = getAllowedTargetStates(currentType, currentState);
  const matchedInvoices: MatchedInvoiceItem[] = workflow.metadata?.matched_invoices || [];
  const totalRemaining = matchedInvoices.reduce((sum, inv) => sum + Number(inv.balance_remaining || 0), 0);
  const allInvoicesFullyPaid =
    matchedInvoices.length > 0 &&
    matchedInvoices.every((inv) => Number(inv.balance_remaining || 0) <= 0.009);
  // A CASH workflow is only partially paid if an actual shortfall exists and invoices are not fully paid
  const isPartiallyPaid =
    !allInvoicesFullyPaid &&
    (totalRemaining > 0.009 ||
      workflow.metadata?.payment_match_type === "PARTIAL_PAID" ||
      matchedInvoices.some(
        (inv) => inv.status === "PARTIALLY_PAID" && Number(inv.balance_remaining || 0) > 0.009
      ));
  const isValueReconciled = !isPartiallyPaid;
  // Dynamic step sequence for CASH (shows Clerk Review conditionally when assigned or in clerk review)
  const isClerkWorkflow =
    (currentState === "CLERK_REVIEW" && isPartiallyPaid) ||
    Boolean(workflow.metadata?.ar_clerk_assigned_to && isPartiallyPaid) ||
    isPartiallyPaid;
  const stepSequence =
    currentType === "CASH"
      ? isClerkWorkflow
        ? CASH_CLERK_STEP_SEQUENCE
        : CASH_STEP_SEQUENCE
      : DEFAULT_STEP_SEQUENCE;
  const getStepIndex = (type: ARWorkflowType, state: ARWorkflowState) => {
    if (type === "CASH") {
      if (isClerkWorkflow) {
        if (state === "DRAFT" || state === "PENDING_REVIEW") return 0;
        if (state === "CLERK_REVIEW") return 1;
        if (state === "RECONCILED") return 2;
        if (state === "COMPLETED") return 3;
        return 0;
      }
      if (state === "DRAFT" || state === "PENDING_REVIEW") return 0;
      if (state === "RECONCILED") return 1;
      if (state === "COMPLETED") return 2;
      return 0;
    }
    if (state === "DUNNING_REMINDER") return 3;
    return DEFAULT_STEP_SEQUENCE.indexOf(state);
  };
  const currentStepIdx = getStepIndex(currentType, currentState);
  const getStepLabel = (type: ARWorkflowType, st: ARWorkflowState) => {
    if (type === "CASH") {
      if (st === "PENDING_REVIEW") return "Treasury Matching";
      if (st === "CLERK_REVIEW") return "Clerk Review";
      if (st === "RECONCILED") return "Reconciled & Marked";
      if (st === "COMPLETED") return "Settled & Posted";
    } else if (type === "INITIAL_SALE") {
      if (st === "DRAFT") return "Customer & Product Setup";
      if (st === "PENDING_REVIEW") return "PO Review & Invoicing";
      if (st === "INVOICE_SENT") return "Invoice Dispatched";
      if (st === "AWAITING_PAYMENT") return "Await Payment";
      if (st === "DUNNING_REMINDER") return "Overdue Follow-up";
      if (st === "RECONCILED") return "Apply Cash [Paid]";
      if (st === "COMPLETED") return "Paid – AR Updated";
    } else if (type === "ADD_ON") {
      if (st === "DRAFT") return "Validate Contract & Product";
      if (st === "PENDING_REVIEW") return "Determine Prorated Amount";
      if (st === "INVOICE_SENT") return "Issue & Send Invoice";
      if (st === "AWAITING_PAYMENT") return "Await Payment";
      if (st === "DUNNING_REMINDER") return "Overdue Follow-up";
      if (st === "RECONCILED") return "Apply Cash [Paid]";
      if (st === "COMPLETED") return "Consolidate Renewal Total";
    }
    return STATE_CONFIG[st]?.label || st;
  };
  const rawAcct = (workflow.metadata?.account_number || "").trim();
  let glAccountNumber = "1100";
  let rawGlAccountTitle = (workflow.metadata?.account_name || "Accounts Receivable (A/R)").trim();
  if (rawAcct.includes(" - ")) {
    const parts = rawAcct.split(" - ");
    glAccountNumber = parts[0].trim() || "1100";
    rawGlAccountTitle = parts.slice(1).join(" - ").trim() || rawGlAccountTitle;
  } else if (rawAcct.includes(":")) {
    const parts = rawAcct.split(":");
    glAccountNumber = parts[0].trim() || "1100";
    rawGlAccountTitle = parts.slice(1).join(":").trim() || rawGlAccountTitle;
  } else if (/^\d+$/.test(rawAcct)) {
    glAccountNumber = rawAcct;
  } else if (rawAcct) {
    rawGlAccountTitle = rawAcct;
  }
  if (rawGlAccountTitle.startsWith(`${glAccountNumber} - `)) {
    rawGlAccountTitle = rawGlAccountTitle.replace(`${glAccountNumber} - `, "").trim();
  }
  // A/R GL Account Name formatted as "Account # - account name"
  const glAccountCombinedName = `${glAccountNumber} - ${rawGlAccountTitle}`;
  const clerkAssignLog = workflow.logs?.find(
    (l) => (l.to_state === "CLERK_REVIEW" || l.payload?.ar_clerk_assigned_to) && l.note
  );
  const clerkAssignmentDescription =
    isPartiallyPaid && (workflow.metadata?.discrepancy_reason || workflow.metadata?.ar_clerk_remarks || clerkAssignLog?.note)
      ? (workflow.metadata?.discrepancy_reason || workflow.metadata?.ar_clerk_remarks || clerkAssignLog?.note)
      : workflow.metadata?.notes || typeConfig.desc;
  const activeTreasuryAssignee =
    workflow.metadata?.treasury_assigned_to ||
    (treasuryList.length > 0
      ? `${treasuryList[0].name} (${treasuryList[0].email})`
      : "Treasury Operations");
  return { customerDetails, bankingDetails, currentType, currentState, typeConfig, stateConfig, TypeIcon, allowedStates, totalRemaining, isPartiallyPaid, isValueReconciled, stepSequence, currentStepIdx, getStepLabel, glAccountNumber, glAccountCombinedName, clerkAssignmentDescription, activeTreasuryAssignee };
}
