import type { FieldDef } from "./types";

export const BANK_DETAILS_CATALOG: FieldDef[] = [
  { id: "bank_country", label: "Bank Country", helperText: "Beneficiary bank jurisdiction" },
  { id: "bank_name", label: "Bank Name", placeholder: "e.g. CIBC, JPMorgan Chase, HSBC" },
  { id: "bank_account_number", label: "Bank Account #", placeholder: "Beneficiary account number", isMono: true },
  { id: "tax_id", label: "Tax ID / EIN", placeholder: "Tax ID or national business number" },
  { id: "region", label: "Region / Province / State", placeholder: "e.g. California, Ontario, Bavaria" },
];

export const CLEARING_CODES_CATALOG: FieldDef[] = [
  { id: "routing_wire", label: "Routing (Wire)", placeholder: "9-digit Wire Routing Number", isMono: true },
  { id: "routing_ach", label: "Routing (ACH)", placeholder: "9-digit ACH Routing Number", isMono: true },
  { id: "aba", label: "ABA Number", placeholder: "ABA Routing Number", isMono: true },
  { id: "swift_code", label: "SWIFT/BIC Code", placeholder: "8 or 11 character SWIFT/BIC", isMono: true, isUpper: true },
  { id: "iban", label: "IBAN", placeholder: "International Bank Account Number", isMono: true, isUpper: true },
  { id: "sort_code", label: "Sort Code", placeholder: "6-digit clearing code (e.g. 12-34-56)", isMono: true },
  { id: "transit_code_ca", label: "Transit Code", placeholder: "5-digit Canadian Transit Code", isMono: true },
  { id: "institution_code", label: "Institution Code", placeholder: "3-digit Canadian Institution Code", isMono: true },
  { id: "branch_code", label: "Branch Code", placeholder: "Branch / sub-branch code", isMono: true },
  { id: "bsb_australia", label: "BSB", placeholder: "6-digit BSB code (e.g. 123-456)", isMono: true },
  { id: "clearing_code", label: "Clearing Code", placeholder: "Local clearing or national routing code", isMono: true },
  { id: "bank_code", label: "Bank Code", placeholder: "National bank code / CNAPS", isMono: true },
  { id: "contact_name_china", label: "Contact Name", placeholder: "Local recipient contact name" },
];
