import { useState, useMemo, useEffect, useRef } from "react";
import {
  Landmark,
  Plus,
  X,
  Sparkles,
} from "lucide-react";
import { CountryAutocomplete } from "@/pages/Purchasing/CountryAutocomplete";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { BankingDetails } from "@/types/businessContact";

export interface PayeeBankingEditorProps {
  banking: BankingDetails;
  onChange: (updated: BankingDetails) => void;
}

interface BankFieldDef {
  id: string;
  label: string;
  category: "bank" | "clearing";
  placeholder: string;
  description: string;
  badge?: string;
}

const BANK_DETAILS_CATALOG: BankFieldDef[] = [
  { id: "bank_name", label: "Bank Name", category: "bank", placeholder: "e.g. CIBC, JPMorgan Chase, HSBC", description: "Full legal institution name" },
  { id: "bank_country", label: "Bank Country", category: "bank", placeholder: "Country", description: "Country where bank account resides" },
  { id: "bank_account_number", label: "Bank Account #", category: "bank", placeholder: "Account Number", description: "Beneficiary bank account number" },
  { id: "tax_id", label: "Tax ID / EIN / VAT", category: "bank", placeholder: "Tax ID / EIN", description: "Vendor corporate tax ID or EIN" },
  { id: "region", label: "State / Province / Region", category: "bank", placeholder: "e.g. Ontario, CA, TX", description: "Geographic division of the bank" },
  { id: "bank_address", label: "Bank Branch Address", category: "bank", placeholder: "Street, City, Country", description: "Physical bank branch address" },
];

const CLEARING_CODES_CATALOG: BankFieldDef[] = [
  { id: "routing_wire", label: "Routing (Wire)", category: "clearing", placeholder: "9-digit Wire Routing Number", description: "US Fedwire 9-digit routing transit number", badge: "US" },
  { id: "routing_ach", label: "Routing (ACH)", category: "clearing", placeholder: "9-digit ACH Routing Number", description: "US ACH direct deposit routing number", badge: "US" },
  { id: "swift_code", label: "SWIFT / BIC Code", category: "clearing", placeholder: "8 or 11 chars (e.g. BOFAUS3N)", description: "ISO 9362 international bank identifier", badge: "GLOBAL" },
  { id: "iban", label: "IBAN", category: "clearing", placeholder: "e.g. GB29 XAAA 2000 0123 4567 89", description: "International Bank Account Number", badge: "EU / UK / INTL" },
  { id: "sort_code", label: "Sort Code", category: "clearing", placeholder: "6 digits (e.g. 20-00-00)", description: "UK 6-digit domestic clearing code", badge: "UK" },
  { id: "transit_code_ca", label: "Transit Number", category: "clearing", placeholder: "5 digits (e.g. 12345)", description: "Canadian 5-digit branch transit code", badge: "CA" },
  { id: "institution_code", label: "Institution Code", category: "clearing", placeholder: "3 digits (e.g. 004)", description: "Canadian 3-digit financial institution code", badge: "CA" },
  { id: "branch_code", label: "Branch Code", category: "clearing", placeholder: "Branch / Sub-office Code", description: "Domestic branch clearing identifier", badge: "APAC" },
  { id: "bsb_australia", label: "BSB Number", category: "clearing", placeholder: "6 digits (e.g. 062-000)", description: "Australian Bank State Branch clearing code", badge: "AU" },
  { id: "bank_code", label: "Bank Code", category: "clearing", placeholder: "Domestic Bank Code", description: "National central bank clearing code", badge: "ASIA" },
  { id: "aba", label: "ABA Number", category: "clearing", placeholder: "9-digit ABA code", description: "American Bankers Association transit code", badge: "US" },
  { id: "clearing_code", label: "Clearing Code", category: "clearing", placeholder: "Regional Clearing Code", description: "Generic regional domestic clearing identifier", badge: "REGIONAL" },
  { id: "contact_name_china", label: "CNAPS / Contact Name", category: "clearing", placeholder: "Chinese Clearing / Contact Name", description: "China National Advanced Payment System identifier", badge: "CN" },
];

function getCountryDefaultFields(countryName: string) {
  const c = countryName.toLowerCase();
  if (c.includes("united states") || c === "us" || c === "usa") {
    return {
      bankFields: ["bank_country", "bank_name", "bank_account_number"],
      clearingFields: ["routing_wire", "routing_ach", "swift_code"],
    };
  }
  if (c.includes("canada") || c === "ca") {
    return {
      bankFields: ["bank_country", "bank_name", "bank_account_number"],
      clearingFields: ["transit_code_ca", "institution_code", "swift_code"],
    };
  }
  if (c.includes("united kingdom") || c === "gb" || c === "uk") {
    return {
      bankFields: ["bank_country", "bank_name", "bank_account_number"],
      clearingFields: ["iban", "sort_code", "swift_code"],
    };
  }
  if (c.includes("australia") || c === "au") {
    return {
      bankFields: ["bank_country", "bank_name", "bank_account_number"],
      clearingFields: ["bsb_australia", "swift_code"],
    };
  }
  const ibanCountries = [
    "germany", "france", "ireland", "spain", "italy", "netherlands", "poland", "belgium",
    "switzerland", "austria", "portugal", "sweden", "norway", "denmark", "finland",
  ];
  if (ibanCountries.some((name) => c.includes(name))) {
    return {
      bankFields: ["bank_country", "bank_name"],
      clearingFields: ["iban", "swift_code"],
    };
  }
  return {
    bankFields: ["bank_country", "bank_name", "bank_account_number"],
    clearingFields: ["swift_code", "clearing_code"],
  };
}

export function PayeeBankingEditor({ banking, onChange }: PayeeBankingEditorProps) {
  const currentCountry = banking.bank_country || "United States";

  const [visibleBankFields, setVisibleBankFields] = useState<string[]>(() => {
    const defaults = getCountryDefaultFields(currentCountry).bankFields;
    const existing = Object.keys(banking).filter(
      (k) => Boolean(banking[k]) && BANK_DETAILS_CATALOG.some((f) => f.id === k)
    );
    return Array.from(new Set([...defaults, ...existing]));
  });

  const [visibleClearingFields, setVisibleClearingFields] = useState<string[]>(() => {
    const defaults = getCountryDefaultFields(currentCountry).clearingFields;
    const existing = Object.keys(banking).filter(
      (k) => Boolean(banking[k]) && CLEARING_CODES_CATALOG.some((f) => f.id === k)
    );
    return Array.from(new Set([...defaults, ...existing]));
  });

  const [achSameAsWire, setAchSameAsWire] = useState<boolean>(() => {
    return Boolean(banking.routing_wire) && banking.routing_wire === banking.routing_ach;
  });

  const [addBankFieldOpen, setAddBankFieldOpen] = useState(false);
  const [addClearingFieldOpen, setAddClearingFieldOpen] = useState(false);

  const addBankRef = useRef<HTMLDivElement>(null);
  const addClearingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (addClearingRef.current && !addClearingRef.current.contains(event.target as Node)) {
        setAddClearingFieldOpen(false);
      }
      if (addBankRef.current && !addBankRef.current.contains(event.target as Node)) {
        setAddBankFieldOpen(false);
      }
    }
    if (addClearingFieldOpen || addBankFieldOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [addClearingFieldOpen, addBankFieldOpen]);

  const handleCountrySelect = (countryName: string) => {
    const updated = { ...banking, bank_country: countryName };
    const countryRules = getCountryDefaultFields(countryName);

    setVisibleBankFields((prev) => Array.from(new Set([...prev, ...countryRules.bankFields])));
    setVisibleClearingFields((prev) => Array.from(new Set([...prev, ...countryRules.clearingFields])));
    onChange(updated);
  };

  const updateField = (key: string, value: any) => {
    const updated = { ...banking, [key]: value };
    if (key === "routing_wire" && achSameAsWire) {
      updated.routing_ach = value;
    }
    onChange(updated);
  };

  const addBankField = (fieldId: string) => {
    if (!visibleBankFields.includes(fieldId)) {
      setVisibleBankFields([...visibleBankFields, fieldId]);
    }
    setAddBankFieldOpen(false);
  };

  const removeBankField = (fieldId: string) => {
    setVisibleBankFields(visibleBankFields.filter((id) => id !== fieldId));
    const next = { ...banking };
    delete next[fieldId];
    onChange(next);
  };

  const addClearingField = (fieldId: string) => {
    if (!visibleClearingFields.includes(fieldId)) {
      setVisibleClearingFields([...visibleClearingFields, fieldId]);
    }
    setAddClearingFieldOpen(false);
  };

  const removeClearingField = (fieldId: string) => {
    setVisibleClearingFields(visibleClearingFields.filter((id) => id !== fieldId));
    const next = { ...banking };
    delete next[fieldId];
    onChange(next);
  };

  const availableBankFields = useMemo(() => {
    return BANK_DETAILS_CATALOG.filter((f) => !visibleBankFields.includes(f.id));
  }, [visibleBankFields]);

  const availableClearingFields = useMemo(() => {
    return CLEARING_CODES_CATALOG.filter((f) => !visibleClearingFields.includes(f.id));
  }, [visibleClearingFields]);

  return (
    <div className="space-y-5 text-slate-800 dark:text-zinc-200">
      {/* ── CARD 1: BENEFICIARY BANK DETAILS ── */}
      <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800/80">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/40 shrink-0">
              <Landmark className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-zinc-100 flex items-center gap-1.5">
                Beneficiary Bank Details
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Bank jurisdiction, institution identity, and beneficiary account
              </p>
            </div>
          </div>

          <div className="relative" ref={addBankRef}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setAddBankFieldOpen(!addBankFieldOpen)}
              disabled={availableBankFields.length === 0}
              className="h-8 text-xs px-2.5 gap-1 border-dashed border-slate-300 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:border-indigo-400"
            >
              <Plus className="h-3.5 w-3.5 text-indigo-600" />
              <span>Add Bank Field</span>
            </Button>

            {addBankFieldOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-64 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl z-50 p-1.5 space-y-1">
                <div className="px-2.5 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Available Bank Fields
                </div>
                {availableBankFields.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => addBankField(f.id)}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-800 dark:text-zinc-200 flex items-center justify-between"
                  >
                    <span>{f.label}</span>
                    <Plus className="h-3 w-3 text-indigo-600 opacity-60" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Bank Fields Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Bank Country */}
          {visibleBankFields.includes("bank_country") && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Bank Country <span className="text-red-500">*</span>
              </Label>
              <CountryAutocomplete
                value={banking.bank_country || "United States"}
                onChange={handleCountrySelect}
                placeholder="Select bank country..."
              />
            </div>
          )}

          {/* Bank Name */}
          {visibleBankFields.includes("bank_name") && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Bank Name <span className="text-red-500">*</span>
              </Label>
              <Input
                value={banking.bank_name || ""}
                onChange={(e) => updateField("bank_name", e.target.value)}
                placeholder="e.g. CIBC, JPMorgan Chase, HSBC"
                className="h-9 text-xs"
              />
            </div>
          )}

          {/* Bank Account Number */}
          {visibleBankFields.includes("bank_account_number") && (
            <div className="space-y-1.5 sm:col-span-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Bank Account # <span className="text-red-500">*</span>
                </Label>
                {visibleBankFields.length > 3 && (
                  <button
                    type="button"
                    onClick={() => removeBankField("bank_account_number")}
                    className="text-slate-400 hover:text-red-500 text-xs"
                    title="Remove field"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <Input
                value={banking.bank_account_number || ""}
                onChange={(e) => updateField("bank_account_number", e.target.value)}
                placeholder="Account Number"
                className="h-9 text-xs font-mono"
              />
            </div>
          )}

          {/* Tax ID */}
          {visibleBankFields.includes("tax_id") && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Tax ID / EIN</Label>
                <button
                  type="button"
                  onClick={() => removeBankField("tax_id")}
                  className="text-slate-400 hover:text-red-500 text-xs"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <Input
                value={banking.tax_id || ""}
                onChange={(e) => updateField("tax_id", e.target.value)}
                placeholder="Tax ID / EIN"
                className="h-9 text-xs font-mono"
              />
            </div>
          )}

          {/* State / Region */}
          {visibleBankFields.includes("region") && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">State / Region</Label>
                <button
                  type="button"
                  onClick={() => removeBankField("region")}
                  className="text-slate-400 hover:text-red-500 text-xs"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <Input
                value={banking.region || ""}
                onChange={(e) => updateField("region", e.target.value)}
                placeholder="e.g. Ontario, CA, NY"
                className="h-9 text-xs"
              />
            </div>
          )}

          {/* Bank Address */}
          {visibleBankFields.includes("bank_address") && (
            <div className="space-y-1.5 sm:col-span-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Bank Address</Label>
                <button
                  type="button"
                  onClick={() => removeBankField("bank_address")}
                  className="text-slate-400 hover:text-red-500 text-xs"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <Input
                value={banking.bank_address || ""}
                onChange={(e) => updateField("bank_address", e.target.value)}
                placeholder="Bank street address, city, postal code"
                className="h-9 text-xs"
              />
            </div>
          )}
        </div>
      </div>

      {/* ── CARD 2: GLOBAL & REGIONAL CLEARING CODES ── */}
      <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800/80">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/40 shrink-0">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-zinc-100">
                  Global & Regional Clearing Codes
                </h3>
                <Badge variant="outline" className="text-[10px] bg-indigo-50/70 text-indigo-700 border-indigo-200">
                  {currentCountry}
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Routing numbers, SWIFT/BIC, IBAN, and domestic clearing identifiers
              </p>
            </div>
          </div>

          <div className="relative" ref={addClearingRef}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setAddClearingFieldOpen(!addClearingFieldOpen)}
              disabled={availableClearingFields.length === 0}
              className="h-8 text-xs px-2.5 gap-1 border-dashed border-slate-300 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:border-emerald-400"
            >
              <Plus className="h-3.5 w-3.5 text-emerald-600" />
              <span>Add Clearing Code</span>
            </Button>

            {addClearingFieldOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-72 max-h-64 overflow-y-auto rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl z-50 p-1.5 space-y-1">
                <div className="px-2.5 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Available Clearing Codes
                </div>
                {availableClearingFields.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => addClearingField(f.id)}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-800 dark:text-zinc-200 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-medium">{f.label}</div>
                      <div className="text-[10px] text-muted-foreground">{f.description}</div>
                    </div>
                    {f.badge && (
                      <span className="text-[9px] font-mono bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-zinc-400 shrink-0 ml-2">
                        {f.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Clearing Codes Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Routing Wire */}
          {visibleClearingFields.includes("routing_wire") && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Routing (Wire) <span className="text-red-500">*</span>
                </Label>
                <button
                  type="button"
                  onClick={() => removeClearingField("routing_wire")}
                  className="text-slate-400 hover:text-red-500 text-xs"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <Input
                value={banking.routing_wire || ""}
                onChange={(e) => updateField("routing_wire", e.target.value)}
                placeholder="9-digit Wire Routing Num"
                className="h-9 text-xs font-mono"
              />
            </div>
          )}

          {/* Routing ACH */}
          {visibleClearingFields.includes("routing_ach") && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Routing (ACH)</Label>
                <button
                  type="button"
                  onClick={() => removeClearingField("routing_ach")}
                  className="text-slate-400 hover:text-red-500 text-xs"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <Input
                value={banking.routing_ach || ""}
                onChange={(e) => updateField("routing_ach", e.target.value)}
                placeholder="9-digit ACH Routing Num"
                disabled={achSameAsWire}
                className="h-9 text-xs font-mono disabled:bg-slate-50 dark:disabled:bg-zinc-900"
              />
              <div className="flex items-center gap-1.5 pt-0.5">
                <Checkbox
                  id="ach-same-wire"
                  checked={achSameAsWire}
                  onCheckedChange={(val) => {
                    const checked = Boolean(val);
                    setAchSameAsWire(checked);
                    if (checked) {
                      updateField("routing_ach", banking.routing_wire || "");
                    }
                  }}
                  className="h-3.5 w-3.5"
                />
                <label htmlFor="ach-same-wire" className="text-[11px] text-muted-foreground cursor-pointer select-none">
                  Routing (ACH) is same as Routing (Wire)
                </label>
              </div>
            </div>
          )}

          {/* SWIFT / BIC */}
          {visibleClearingFields.includes("swift_code") && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">SWIFT / BIC Code</Label>
                <button
                  type="button"
                  onClick={() => removeClearingField("swift_code")}
                  className="text-slate-400 hover:text-red-500 text-xs"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <Input
                value={banking.swift_code || banking.bic || ""}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase();
                  onChange({ ...banking, swift_code: val, bic: val });
                }}
                placeholder="8 OR 11 CHARS (E.G. BOFAUS3N)"
                className="h-9 text-xs font-mono uppercase"
              />
            </div>
          )}

          {/* IBAN */}
          {visibleClearingFields.includes("iban") && (
            <div className="space-y-1.5 sm:col-span-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">IBAN</Label>
                <button
                  type="button"
                  onClick={() => removeClearingField("iban")}
                  className="text-slate-400 hover:text-red-500 text-xs"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <Input
                value={banking.iban || ""}
                onChange={(e) => updateField("iban", e.target.value.toUpperCase())}
                placeholder="e.g. GB29 XAAA 2000 0123 4567 89"
                className="h-9 text-xs font-mono uppercase"
              />
            </div>
          )}

          {/* Sort Code (UK) */}
          {visibleClearingFields.includes("sort_code") && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Sort Code (UK)</Label>
                <button
                  type="button"
                  onClick={() => removeClearingField("sort_code")}
                  className="text-slate-400 hover:text-red-500 text-xs"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <Input
                value={banking.sort_code || ""}
                onChange={(e) => updateField("sort_code", e.target.value)}
                placeholder="6 digits (e.g. 20-00-00)"
                className="h-9 text-xs font-mono"
              />
            </div>
          )}

          {/* Transit Code (CA) */}
          {visibleClearingFields.includes("transit_code_ca") && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Transit Code (CA)</Label>
                <button
                  type="button"
                  onClick={() => removeClearingField("transit_code_ca")}
                  className="text-slate-400 hover:text-red-500 text-xs"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <Input
                value={banking.transit_code_ca || ""}
                onChange={(e) => updateField("transit_code_ca", e.target.value)}
                placeholder="5 digits (e.g. 12345)"
                className="h-9 text-xs font-mono"
              />
            </div>
          )}

          {/* Institution Code (CA) */}
          {visibleClearingFields.includes("institution_code") && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Institution Code (CA)</Label>
                <button
                  type="button"
                  onClick={() => removeClearingField("institution_code")}
                  className="text-slate-400 hover:text-red-500 text-xs"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <Input
                value={banking.institution_code || ""}
                onChange={(e) => updateField("institution_code", e.target.value)}
                placeholder="3 digits (e.g. 004)"
                className="h-9 text-xs font-mono"
              />
            </div>
          )}

          {/* BSB Australia */}
          {visibleClearingFields.includes("bsb_australia") && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">BSB (Australia)</Label>
                <button
                  type="button"
                  onClick={() => removeClearingField("bsb_australia")}
                  className="text-slate-400 hover:text-red-500 text-xs"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <Input
                value={banking.bsb_australia || ""}
                onChange={(e) => updateField("bsb_australia", e.target.value)}
                placeholder="6 digits (e.g. 062-000)"
                className="h-9 text-xs font-mono"
              />
            </div>
          )}

          {/* Generic Clearing Code */}
          {visibleClearingFields.includes("clearing_code") && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Clearing Code</Label>
                <button
                  type="button"
                  onClick={() => removeClearingField("clearing_code")}
                  className="text-slate-400 hover:text-red-500 text-xs"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <Input
                value={banking.clearing_code || ""}
                onChange={(e) => updateField("clearing_code", e.target.value)}
                placeholder="Regional Clearing Code"
                className="h-9 text-xs font-mono"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
