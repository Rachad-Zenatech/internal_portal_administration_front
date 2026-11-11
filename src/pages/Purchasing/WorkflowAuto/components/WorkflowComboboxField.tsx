import { useId } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import * as purchasing from "@/services/purchasingService";
import { masterTablesService } from "@/services/masterTablesService";
import type { WorkflowComboSource } from "@/services/experimentalWorkflowService";

const CURRENCIES = ["USD", "CAD", "EUR", "GBP", "AUD", "CNY", "JPY", "MXN", "INR"];

export const COMBO_SOURCE_LABELS: Record<WorkflowComboSource, string> = {
  vendor: "Vendors (Payable Contacts)",
  department: "Departments",
  user: "Users (Requesters)",
  ap_user: "A/P Users",
  class: "Classes",
  location: "Locations",
  bank_account: "Bank Accounts (Chart of Accounts)",
  gl_code: "GL Categories (Chart of Accounts)",
  project: "Projects",
  pay_from: "Pay From Entities",
  bank_country: "Banking Countries",
  currency: "Currencies",
};

const isBankAccount = (g: { account_type?: string; bank_name?: string | null }) =>
  !!g.bank_name || /bank|credit card/i.test(g.account_type || "");

async function loadOptions(source: WorkflowComboSource): Promise<string[]> {
  switch (source) {
    case "vendor": return purchasing.getKnownVendors();
    case "department": return purchasing.listDepartments();
    case "project": return purchasing.listProjects();
    case "pay_from": return purchasing.getPayFromEntities();
    case "user": return (await purchasing.getUsers()).map((u) => u.full_name || u.email || "").filter(Boolean);
    case "ap_user": return (await purchasing.getAPUsers()).map((u) => u.full_name || u.email);
    case "class": return (await masterTablesService.getClasses()).items.filter((i) => i.is_active).map((i) => i.name);
    case "location": return (await masterTablesService.getLocations()).items.filter((i) => i.is_active).map((i) => i.name);
    case "gl_code": return (await purchasing.getGLCodes()).filter((g) => !isBankAccount(g)).map((g) => g.display_label);
    case "bank_account": return (await purchasing.getGLCodes()).filter(isBankAccount).map((g) => g.display_label);
    case "bank_country": return (await purchasing.getBankingCountries()).map((c) => c.name);
    case "currency": return CURRENCIES;
  }
}

/** Searchable input whose suggestions come from the live directory (same source as the real request form). */
export function WorkflowComboboxField({
  source, value, placeholder, onChange, className,
}: {
  source: WorkflowComboSource;
  value: string;
  placeholder?: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  const listId = useId();
  const { data = [], isLoading } = useQuery({
    queryKey: ["workflow-combo", source],
    queryFn: () => loadOptions(source),
    staleTime: 5 * 60 * 1000,
  });
  return (
    <>
      <Input
        list={listId}
        value={value}
        placeholder={isLoading ? "Loading..." : placeholder || `Search ${COMBO_SOURCE_LABELS[source]}...`}
        onChange={(e) => onChange(e.target.value)}
        className={className}
      />
      <datalist id={listId}>
        {Array.from(new Set(data)).map((opt) => <option key={opt} value={opt} />)}
      </datalist>
    </>
  );
}

