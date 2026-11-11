import type {
  WorkflowActionField,
  WorkflowComboSource,
  WorkflowStepNode,
} from "@/services/experimentalWorkflowService";

/**
 * Field id / label -> live directory used by the real request forms
 * (/purchasing/requests and /purchasing/invoices). Order matters: first match wins.
 */
const RULES: Array<[RegExp, WorkflowComboSource]> = [
  [/^(entered_by)$|entered by/i, "ap_user"],
  [/^(requester|approver)$|^requester$|reviewer|approver/i, "user"],
  [/^pay_from$|pay from/i, "pay_from"],
  [/^bank_account$|^bank account$/i, "bank_account"],
  [/^bank_country$|bank country/i, "bank_country"],
  [/^(vendor|selected_vendor)$|vendor \/ beneficiary|^vendor$|selected vendor/i, "vendor"],
  [/^department$|^department$|^class$/i, "department"],
  [/^from_location$|^shipped_to_location$|from location|shipped to location|ship to region/i, "location"],
  [/^gl_code$|gl account|^category$/i, "gl_code"],
  [/^project_name$|group project/i, "project"],
];

/** Fields whose id is "department" but whose label is "Class" use the Classes master table. */
export function inferComboSource(fld: Pick<WorkflowActionField, "id" | "label"> & { type?: string }): WorkflowComboSource | null {
  if (fld.type && fld.type !== "text" && fld.type !== "combobox") return null;
  if (/^class$/i.test(fld.label.trim())) return "class";
  // A/P "Payment Type" uses id "category" but is a fixed Others / Rent / Note dropdown
  if (/payment type/i.test(fld.label)) return null;
  for (const [re, src] of RULES) {
    if (re.test(fld.id) || re.test(fld.label.trim())) return src;
  }
  return null;
}

/** Statuses every A/P auto flow must cover (the 7 lifecycle states). */
export const REQUIRED_STATUSES = [
  "CREATE", "INITIAL", "WAITING_APPROVAL", "WAITING_PAYMENT", "COMPLETED", "ON_HOLD", "REJECTED",
];

/** Purchase Request flows (/purchasing/requests) add review, purchase, shipping and receiving states (12 total). */
export const PURCHASE_REQUIRED_STATUSES = [
  "CREATE", "INITIAL", "NEW", "UNDER_REVIEW", "WAITING_APPROVAL", "WAITING_PAYMENT",
  "PURCHASED", "SHIPPED", "GOODS_RECEIVED", "COMPLETED", "ON_HOLD", "REJECTED",
];

export const requiredStatusesFor = (domain?: string) =>
  domain?.startsWith("purchasing") ? PURCHASE_REQUIRED_STATUSES : REQUIRED_STATUSES;

export interface CompletenessItem {
  stage: string;
  action?: string;
  label: string;
  ok: boolean;
  hint?: string;
}

/** Scores a workflow: all lifecycle states present, every action target exists, every directory field is a bound combobox. */
export function computeWorkflowCompleteness(nodes: WorkflowStepNode[], domain?: string) {
  const items: CompletenessItem[] = [];
  const ids = new Set(nodes.map((n) => n.id));
  const statuses = new Set(nodes.map((n) => (n as any).statusKey));

  for (const s of requiredStatusesFor(domain)) {
    items.push({ stage: "Workflow", label: `State ${s}`, ok: statuses.has(s), hint: statuses.has(s) ? undefined : "Add this stage" });
  }

  for (const n of nodes) {
    for (const a of n.actions || []) {
      if (a.targetStep) {
        const ok = ids.has(a.targetStep);
        items.push({ stage: n.title, action: a.label, label: `Target → ${a.targetStep}`, ok, hint: ok ? undefined : "Target stage missing" });
      }
      for (const f of a.fields || []) {
        const src = inferComboSource(f);
        if (!src) continue;
        const ok = f.type === "combobox" && f.source === src;
        items.push({ stage: n.title, action: a.label, label: f.label, ok, hint: ok ? undefined : `Should be combobox (${src})` });
      }
    }
  }
  const done = items.filter((i) => i.ok).length;
  return { items, done, total: items.length, percent: items.length ? Math.round((done / items.length) * 100) : 100 };
}

/** Converts every directory-backed field of a workflow to the correct combobox (one-click "Fix all"). */
export function applyComboSources(nodes: WorkflowStepNode[]): WorkflowStepNode[] {
  return nodes.map((n) => ({
    ...n,
    actions: (n.actions || []).map((a) => ({
      ...a,
      fields: (a.fields || []).map((f) => {
        const src = inferComboSource(f);
        return src ? { ...f, type: "combobox" as const, source: src, options: [] } : f;
      }),
    })),
  }));
}
