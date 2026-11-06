import { useState, useEffect, useMemo, useRef } from "react";
import { getCountryBankingSpec, type CountryBankingSpec } from "@/services/purchasingService";
import { BANK_DETAILS_CATALOG, CLEARING_CODES_CATALOG } from "../constants";
import { getLocalCountryDefaults } from "../utils";
import type { WireBankingFieldsProps } from "../types";

export function useWireBankingFieldsActions(props: WireBankingFieldsProps) {
  const { setForm, setValidationErrors } = props;
  const [achSameAsWire, setAchSameAsWire] = useState(false);
  const [countrySpec, setCountrySpec] = useState<CountryBankingSpec | null>(null);
  const [visibleBankFields, setVisibleBankFields] = useState<string[]>([
    "bank_country",
    "bank_name",
    "bank_account_number",
  ]);
  const [visibleClearingFields, setVisibleClearingFields] = useState<string[]>([
    "routing_wire",
    "routing_ach",
    "swift_code",
  ]);
  const [requiredFieldKeys, setRequiredFieldKeys] = useState<Set<string>>(
    new Set(["bank_country", "bank_name", "bank_account_number", "routing_wire"])
  );
  const availableBankFields = useMemo(() => {
    return BANK_DETAILS_CATALOG.filter((f) => !visibleBankFields.includes(f.id));
  }, [visibleBankFields]);
  const availableClearingFields = useMemo(() => {
    return CLEARING_CODES_CATALOG.filter(
      (f) => !visibleClearingFields.includes(f.id)
    );
  }, [visibleClearingFields]);
  const [addBankFieldOpen, setAddBankFieldOpen] = useState(false);
  const [addClearingFieldOpen, setAddClearingFieldOpen] = useState(false);
  const addBankRef = useRef<HTMLDivElement>(null);
  const addClearingRef = useRef<HTMLDivElement>(null);
  const bankScrollRef = useRef<HTMLDivElement>(null);
  const clearingScrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (addBankRef.current && !addBankRef.current.contains(e.target as Node)) {
        setAddBankFieldOpen(false);
      }
      if (addClearingRef.current && !addClearingRef.current.contains(e.target as Node)) {
        setAddClearingFieldOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const handleCountryChange = async (country: string) => {
    setForm((prev) => ({ ...prev, bank_country: country }));
    setValidationErrors?.((prev) => ({ ...prev, bank_country: false }));

    const local = getLocalCountryDefaults(country);
    let spec: CountryBankingSpec | null = null;
    try {
      spec = await getCountryBankingSpec(country);
    } catch {
      // Fallback to local defaults
    }
    setCountrySpec(spec);

    const reqSet = new Set<string>(local.required);
    const bankSet = new Set<string>(local.bankFields);
    const clrSet = new Set<string>(local.clearingFields);

    if (spec) {
      if (spec.default_bank_fields) {
        spec.default_bank_fields.forEach((f) => {
          if (f.required) reqSet.add(f.id);
          bankSet.add(f.id);
        });
      }
      if (spec.default_clearing_fields) {
        spec.default_clearing_fields.forEach((f) => {
          if (f.required) reqSet.add(f.id);
          clrSet.add(f.id);
        });
      }
    }

    setRequiredFieldKeys(reqSet);
    setVisibleBankFields(Array.from(bankSet));
    setVisibleClearingFields(Array.from(clrSet));
  };
  const addBankField = (id: string) => {
    if (!visibleBankFields.includes(id)) {
      setVisibleBankFields((prev) => [...prev, id]);
    }
    setAddBankFieldOpen(false);
  };
  const removeBankField = (id: string) => {
    setVisibleBankFields((prev) => prev.filter((k) => k !== id));
    setForm((prev) => ({ ...prev, [id]: "" }));
    setValidationErrors?.((prev) => ({ ...prev, [id]: false }));
  };
  const addClearingField = (id: string) => {
    if (!visibleClearingFields.includes(id)) {
      setVisibleClearingFields((prev) => [...prev, id]);
    }
    setAddClearingFieldOpen(false);
  };
  const removeClearingField = (id: string) => {
    setVisibleClearingFields((prev) => prev.filter((k) => k !== id));
    setForm((prev) => ({ ...prev, [id]: "" }));
    setValidationErrors?.((prev) => ({ ...prev, [id]: false }));
  };
  return { achSameAsWire, setAchSameAsWire, countrySpec, visibleBankFields, visibleClearingFields, requiredFieldKeys, availableBankFields, availableClearingFields, addBankFieldOpen, setAddBankFieldOpen, addClearingFieldOpen, setAddClearingFieldOpen, addBankRef, addClearingRef, bankScrollRef, clearingScrollRef, handleCountryChange, addBankField, removeBankField, addClearingField, removeClearingField };
}
