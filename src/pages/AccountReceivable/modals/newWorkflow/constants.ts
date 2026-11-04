import React from "react";
import { Banknote, ShoppingCart, Layers, Repeat, RotateCw } from "lucide-react";
import type { ARWorkflowType } from "../../../../types/ar";
import type { CurrencyOption, BankFieldDef } from "./types";

export const AR_CURRENCY_OPTIONS: CurrencyOption[] = [
  { code: "USD", name: "US Dollar", symbol: "$", flag: "🇺🇸" },
  { code: "CAD", name: "Canadian Dollar", symbol: "CA$", flag: "🇨🇦" },
  { code: "EUR", name: "Euro", symbol: "€", flag: "🇪🇺" },
  { code: "GBP", name: "British Pound", symbol: "£", flag: "🇬🇧" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$", flag: "🇦🇺" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥", flag: "🇯🇵" },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF", flag: "🇨🇭" },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$", flag: "🇸🇬" },
  { code: "HKD", name: "Hong Kong Dollar", symbol: "HK$", flag: "🇭🇰" },
];

export const BANK_DETAILS_CATALOG: BankFieldDef[] = [
  { id: "bank_country", label: "Bank Country", helperText: "Beneficiary bank jurisdiction" },
  { id: "bank_name", label: "Bank Name", placeholder: "e.g. CIBC, JPMorgan Chase, HSBC" },
  { id: "bank_account_number", label: "Bank Account #", placeholder: "Beneficiary account number", isMono: true },
  { id: "tax_id", label: "Tax ID / EIN", placeholder: "Tax ID or national business number" },
  { id: "region", label: "Region / Province / State", placeholder: "e.g. California, Ontario, New York" },
  { id: "routing_wire", label: "Routing (Wire / ABA)", placeholder: "9-digit Wire Routing Number", isMono: true },
  { id: "routing_ach", label: "Routing (ACH)", placeholder: "9-digit ACH Routing Number", isMono: true },
  { id: "swift_code", label: "SWIFT / BIC Code", placeholder: "8 or 11 character SWIFT/BIC", isMono: true, isUpper: true },
  { id: "iban", label: "IBAN", placeholder: "International Bank Account Number", isMono: true, isUpper: true },
  { id: "transit_code_ca", label: "Transit Code (CA)", placeholder: "5-digit Canadian Transit Code", isMono: true },
  { id: "institution_code", label: "Institution Code (CA)", placeholder: "3-digit Canadian Institution Code", isMono: true },
];

export const WORKFLOW_TYPE_CONFIGS: Array<{
  type: ARWorkflowType;
  title: string;
  shortDesc: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  badgeColor: string;
}> = [
  {
    type: "CASH",
    title: "Cash Reconciliation",
    shortDesc: "Inbound Payment & Bank Matching",
    description:
      "Match inbound wire/check deposits against open invoices, update general ledger, and dispatch confirmation.",
    icon: Banknote,
    color: "text-emerald-500 dark:text-emerald-400",
    bgColor: "bg-emerald-500/10 border-emerald-500/30 hover:border-emerald-500/60",
    badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  },
  {
    type: "INITIAL_SALE",
    title: "Initial Sale",
    shortDesc: "Sales Order & Direct Invoicing",
    description:
      "Intake new customer sales order, validate itemized line amounts, issue invoice, and trigger fulfillment upon payment.",
    icon: ShoppingCart,
    color: "text-blue-500 dark:text-blue-400",
    bgColor: "bg-blue-500/10 border-blue-500/30 hover:border-blue-500/60",
    badgeColor: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  },
  {
    type: "ADD_ON",
    title: "Add-On / Upgrade",
    shortDesc: "Contract Amendment & Pro-Rata",
    description:
      "Attach additional licenses/services to an existing contract, generate pro-rated invoice, and provision features.",
    icon: Layers,
    color: "text-indigo-500 dark:text-indigo-400",
    bgColor: "bg-indigo-500/10 border-indigo-500/30 hover:border-indigo-500/60",
    badgeColor: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
  },
  {
    type: "MONTHLY_SUBSCRIPTION",
    title: "Monthly Subscription",
    shortDesc: "Recurring Billing & Auto-Charge",
    description:
      "Orchestrate recurring SaaS / DaaS billing cycles, usage calculations, automatic charge processing, and dunning retry loops.",
    icon: Repeat,
    color: "text-violet-500 dark:text-violet-400",
    bgColor: "bg-violet-500/10 border-violet-500/30 hover:border-violet-500/60",
    badgeColor: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
  },
  {
    type: "RENEWAL",
    title: "Contract Renewal",
    shortDesc: "Term Extension & Quote Review",
    description:
      "Process expiring customer contracts, review adjusted term pricing, dispatch renewal terms, and extend service periods.",
    icon: RotateCw,
    color: "text-amber-500 dark:text-amber-400",
    bgColor: "bg-amber-500/10 border-amber-500/30 hover:border-amber-500/60",
    badgeColor: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
];
