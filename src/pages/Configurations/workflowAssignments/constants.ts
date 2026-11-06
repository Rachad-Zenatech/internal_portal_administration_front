import { Building2, ShoppingCart, CreditCard, Landmark, SlidersHorizontal, ShieldCheck, ReceiptText } from "lucide-react";

export const ROLE_STATES_MAP: Record<string, string[]> = {
  "COMPANY_LEVEL_2_APPROVER": ["Waiting Approval (>= $10k or Escalated, Company Level 2)"],
  "PURCHASING": ["New Request", "Under Review", "Purchased / Ordered", "Goods Received (CC)", "Waiting Payment (Credit Card)"],
  "MANAGER": ["Waiting Approval (< $10k)"],
  "EXECUTIVE": ["Waiting Approval (>= $10k)"],
  "DIRECTOR": ["Waiting Approval"],
  "VP": ["Waiting Approval"],
  "AP": ["Goods Received (Debit / Wire)", "Waiting Payment (Debit Card / Invoices)", "Waiting Payment (Wire Transfer)"],
  "ACCOUNT_RECEIVABLE": ["Clerk Review"],
  "RECEIVING": ["Shipped", "Goods Received"],
  "TREASURY": ["Draft", "Pending Review", "Deposited", "Matched", "Reconciled", "Completed", "Waiting Payment (Wire Transfer)"],
};

export const PRIMARY_ROLE_TABS = [
  {
    key: "departments",
    label: "Level 1 Department Approvers",
    shortLabel: "Level 1 Approvers",
    icon: Building2,
    color: "text-emerald-600 dark:text-emerald-400",
    badgeColor: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
  },
  {
    key: "COMPANY_LEVEL_2_APPROVER",
    label: "Level 2 Company Approvers",
    shortLabel: "Level 2 Approvers",
    icon: ShieldCheck,
    color: "text-purple-600 dark:text-purple-400",
    badgeColor: "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800",
    roleCode: "COMPANY_LEVEL_2_APPROVER",
    desc: "Executive / Company-wide final sign-off for requests ≥ $10k, escalated amounts, or corporate oversight.",
    states: ["Waiting Approval (>= $10k or Escalated, Company Level 2)"]
  },
  {
    key: "PURCHASING",
    label: "Purchasing Team",
    shortLabel: "Purchasing",
    icon: ShoppingCart,
    color: "text-indigo-600 dark:text-indigo-400",
    roleCode: "PURCHASING",
    desc: "Procurement, vendor quote negotiations, purchasing orders, and credit card settlements.",
    states: ["New Request", "Under Review", "Purchased / Ordered", "Goods Received (CC)", "Waiting Payment (Credit Card)"]
  },
  {
    key: "AP",
    label: "Accounts Payable (AP)",
    shortLabel: "Accounts Payable",
    icon: CreditCard,
    color: "text-amber-600 dark:text-amber-400",
    roleCode: "AP",
    desc: "Invoice matching, vendor statement review, GL validation, and debit/wire handling.",
    states: ["Goods Received (Debit / Wire)", "Waiting Payment (Debit Card / Invoices)", "Waiting Payment (Wire Transfer)"]
  },
  {
    key: "ACCOUNT_RECEIVABLE",
    label: "Account Receivable (AR)",
    shortLabel: "Account Receivable",
    icon: ReceiptText,
    color: "text-blue-600 dark:text-blue-400",
    roleCode: "ACCOUNT_RECEIVABLE",
    desc: "Payment shortfall review, customer deduction dispute resolution, and AR clerk discrepancy investigation.",
    states: ["Clerk Review"]
  },
  {
    key: "TREASURY",
    label: "Treasury",
    shortLabel: "Treasury",
    icon: Landmark,
    color: "text-sky-600 dark:text-sky-400",
    roleCode: "TREASURY",
    desc: "Inbound cash reconciliation, deposit matching, wire settlement, bank disbursement, and high-value release.",
    states: ["Draft", "Pending Review", "Deposited", "Matched", "Reconciled", "Completed", "Waiting Payment (Wire Transfer)"]
  },
  {
    key: "all_roles",
    label: "All Operational Roles",
    shortLabel: "All Roles",
    icon: SlidersHorizontal,
    color: "text-slate-600 dark:text-slate-400"
  },
];

export const SUGGESTED_ROLES = [
  { code: "COMPANY_LEVEL_2_APPROVER", label: "Level 2 Approver", desc: "Company Level 2 executive approval (≥ $10k)" },
  { code: "PURCHASING", label: "Purchasing", desc: "Purchasing and procurement processing" },
  { code: "AP", label: "Accounts Payable", desc: "Invoice payment and debit/wire handling" },
  { code: "ACCOUNT_RECEIVABLE", label: "Account Receivable", desc: "Clerk review, invoice matching, and receivables processing" },
  { code: "TREASURY", label: "Treasury", desc: "Treasury and high-value payment approval" },
  { code: "ADMIN", label: "Administrator", desc: "Workflow and system administration" },
];
