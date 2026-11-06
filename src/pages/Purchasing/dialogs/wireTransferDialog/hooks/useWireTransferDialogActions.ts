import { useState, useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";
import { getCountryBankingSpec, getRequest, type CountryBankingSpec } from "@/services/purchasingService";
import type { WireTransferInput } from "@/types/purchasing";
import { BANK_DETAILS_CATALOG, CLEARING_CODES_CATALOG } from "../constants";
import { getLocalCountryDefaults } from "../utils";
import type { WireTransferDialogProps } from "../types";

export function useWireTransferDialogActions(props: WireTransferDialogProps) {
  const { open, request, purchaseOrder, onConfirm, initialData, isEditMode = false, defaultTab = "general", visibleTabs } = props;
  // Normalize visible tabs: combine banking and international into "banking"
  const normalizedTabs = useMemo(() => {
    if (!visibleTabs) return ["general", "banking"];
    const set = new Set<string>();
    visibleTabs.forEach((t) => {
      if (t === "general") set.add("general");
      if (t === "banking" || t === "international") set.add("banking");
    });
    return Array.from(set);
  }, [visibleTabs]);
  const initialTab = defaultTab === "international" ? "banking" : (defaultTab || normalizedTabs[0] || "general");
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [validationErrors, setValidationErrors] = useState<Record<string, boolean>>({});
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  // Routing ACH same as Wire Routing checkbox
  const [achSameAsWire, setAchSameAsWire] = useState(false);
  // Dynamic field tracking (clean defaults matching AccountsPayableLog and schwifty)
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
  const [countrySpec, setCountrySpec] = useState<CountryBankingSpec | null>(null);
  // Available fields that are NOT currently displayed (prevents duplicates)
  const availableBankFields = useMemo(() => {
    return BANK_DETAILS_CATALOG.filter((f) => !visibleBankFields.includes(f.id));
  }, [visibleBankFields]);
  const availableClearingFields = useMemo(() => {
    return CLEARING_CODES_CATALOG.filter(
      (f) => !visibleClearingFields.includes(f.id)
    );
  }, [visibleClearingFields]);
  // Add field dropdown popovers & refs for in-tree scrolling
  const [addBankFieldOpen, setAddBankFieldOpen] = useState(false);
  const [addClearingFieldOpen, setAddClearingFieldOpen] = useState(false);
  const addBankRef = useRef<HTMLDivElement>(null);
  const bankScrollRef = useRef<HTMLDivElement>(null);
  const addClearingRef = useRef<HTMLDivElement>(null);
  const clearingScrollRef = useRef<HTMLDivElement>(null);
  // Close add-field menus on outside click
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
  // Non-passive wheel handler for guaranteed scroll on Add Clearing Code dropdown
  useEffect(() => {
    const el = clearingScrollRef.current;
    if (!addClearingFieldOpen || !el) return;
    const onWheel = (e: WheelEvent) => {
      e.stopPropagation();
      if (el.scrollHeight > el.clientHeight) {
        el.scrollTop += e.deltaY;
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [addClearingFieldOpen, availableClearingFields]);
  // Non-passive wheel handler for guaranteed scroll on Add Bank Field dropdown
  useEffect(() => {
    const el = bankScrollRef.current;
    if (!addBankFieldOpen || !el) return;
    const onWheel = (e: WheelEvent) => {
      e.stopPropagation();
      if (el.scrollHeight > el.clientHeight) {
        el.scrollTop += e.deltaY;
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [addBankFieldOpen, availableBankFields]);
  const todayStr = new Date().toISOString().split("T")[0];
  const isScheduledOrRecurring =
    request.request_type === "SCHEDULED_PAYMENT" ||
    request.request_type === "RECURRING" ||
    Boolean(request.recurring_schedule);
  const fallbackVendor = isScheduledOrRecurring
    ? ""
    : (purchaseOrder?.vendor || request.product_info?.vendor || request.requester || "");
  const [form, setForm] = useState<WireTransferInput>({
    entered_by: "",
    entered_by_user_id: undefined,
    entry_date: todayStr,
    due_date: request.due_date || "",
    payment_date: todayStr,
    vendor: initialData?.vendor || fallbackVendor,
    is_new_vendor: false,
    pay_date: "Same Day",
    amount: purchaseOrder?.amount || request.amount || undefined,
    currency: purchaseOrder?.currency || request.currency || "USD",
    pay_from: "",
    invoice_number: "",
    comments: request.title ? `Payment for ${request.title}` : "",
    vendor_address: "",
    vendor_email: "",
    bank_name: "",
    tax_id: "",
    bank_country: "",
    routing_wire: "",
    routing_ach: "",
    bank_account_number: "",
    swift_code: "",
    sort_code: "",
    transit_code_ca: "",
    institution_code: "",
    branch_code: "",
    bsb_australia: "",
    clearing_code: "",
    bank_code: "",
    iban: "",
    bic: "",
    region: "",
    contact_name_china: "",
    category: initialData?.category || "Others",
  });
  const [fetchedWireData, setFetchedWireData] = useState<WireTransferInput | null>(null);
  useEffect(() => {
    if (!open) {
      setFetchedWireData(null);
      return;
    }

    const directData = initialData || (request as any)?.wire_transfer;
    if (directData) {
      setFetchedWireData(directData);
      return;
    }

    if (request?.id) {
      getRequest(request.id)
        .then((fullReq) => {
          if (fullReq?.wire_transfer) {
            setFetchedWireData(fullReq.wire_transfer);
          }
        })
        .catch((err) => {
          console.warn("Could not fetch wire info for request:", err);
        });
    }
  }, [open, initialData, request?.id, (request as any)?.wire_transfer]);
  // Apply country spec dynamically
  const applyCountryIntelligence = (
    countryName: string,
    specData?: CountryBankingSpec | null,
    dataOverride?: WireTransferInput
  ) => {
    const currentData = dataOverride || form;
    if (specData) {
      setCountrySpec(specData);
      const reqs = new Set<string>(["bank_country"]);
      specData.default_bank_fields.forEach((f) => {
        if (f.required) reqs.add(f.id);
      });
      specData.default_clearing_fields.forEach((f) => {
        if (f.required) reqs.add(f.id);
      });
      setRequiredFieldKeys(reqs);

      // Union country defaults with currently populated values so user data is never hidden
      const bSet = new Set(specData.default_bank_fields.map((f) => f.id));
      const cSet = new Set(specData.default_clearing_fields.map((f) => f.id));

      // Include existing populated fields
      BANK_DETAILS_CATALOG.forEach((f) => {
        const val = currentData[f.id as keyof WireTransferInput];
        if (val && String(val).trim()) bSet.add(f.id);
      });
      CLEARING_CODES_CATALOG.forEach((f) => {
        const val = currentData[f.id as keyof WireTransferInput];
        if (val && String(val).trim()) cSet.add(f.id);
      });

      setVisibleBankFields(Array.from(bSet));
      setVisibleClearingFields(Array.from(cSet));
    } else {
      const local = getLocalCountryDefaults(countryName);
      const reqs = new Set<string>(local.required);
      setRequiredFieldKeys(reqs);

      const bSet = new Set(local.bankFields);
      const cSet = new Set(local.clearingFields);

      BANK_DETAILS_CATALOG.forEach((f) => {
        const val = currentData[f.id as keyof WireTransferInput];
        if (val && String(val).trim()) bSet.add(f.id);
      });
      CLEARING_CODES_CATALOG.forEach((f) => {
        const val = currentData[f.id as keyof WireTransferInput];
        if (val && String(val).trim()) cSet.add(f.id);
      });

      setVisibleBankFields(Array.from(bSet));
      setVisibleClearingFields(Array.from(cSet));
    }
  };
  const handleCountryChange = (
    countryName: string,
    _countryCode?: string,
    dataOverride?: WireTransferInput
  ) => {
    setForm((prev) => ({ ...prev, bank_country: countryName }));
    setValidationErrors((prev) => ({ ...prev, bank_country: false }));

    // Apply immediate local heuristics for instant responsiveness
    applyCountryIntelligence(countryName, null, dataOverride);

    // Call schwifty backend endpoint
    getCountryBankingSpec(countryName)
      .then((spec) => {
        if (spec && spec.code) {
          applyCountryIntelligence(countryName, spec, dataOverride);
        }
      })
      .catch((err) => {
        console.warn("Could not load backend country banking spec:", err);
      });
  };
  // Sync ACH routing if checkbox is checked
  useEffect(() => {
    if (achSameAsWire && form.routing_wire !== undefined) {
      setForm((prev) => ({ ...prev, routing_ach: prev.routing_wire || "" }));
    }
  }, [achSameAsWire, form.routing_wire]);
  const isEffectiveEditMode =
    isEditMode ||
    Boolean(initialData) ||
    Boolean((request as any)?.wire_transfer) ||
    Boolean(fetchedWireData);
  useEffect(() => {
    if (open) {
      const nextTab = defaultTab === "international" ? "banking" : (defaultTab || normalizedTabs[0] || "general");
      setActiveTab(nextTab);
      setValidationErrors({});

      const effectiveData = initialData || (request as any)?.wire_transfer || fetchedWireData;

      const normalizeDateStr = (d?: string | null) => {
        if (!d || d === "null" || d === "undefined") return "";
        return String(d).split("T")[0];
      };

      if (effectiveData) {
        const initialCountry = effectiveData.bank_country || "United States";
        const isSame =
          Boolean(effectiveData.routing_wire) &&
          effectiveData.routing_wire === effectiveData.routing_ach;
        setAchSameAsWire(isSame);

        const mappedForm: WireTransferInput = {
          entered_by: effectiveData.entered_by || "",
          entered_by_user_id: effectiveData.entered_by_user_id || undefined,
          entry_date: normalizeDateStr(effectiveData.entry_date) || todayStr,
          due_date: normalizeDateStr(effectiveData.due_date || request.due_date),
          payment_date: normalizeDateStr(effectiveData.payment_date) || todayStr,
          vendor: effectiveData.vendor || fallbackVendor,
          is_new_vendor: !!effectiveData.is_new_vendor,
          pay_date: effectiveData.pay_date || "Same Day",
          amount: effectiveData.amount != null ? Number(effectiveData.amount) : (purchaseOrder?.amount || request.amount || undefined),
          currency: effectiveData.currency || purchaseOrder?.currency || request.currency || "USD",
          pay_from: effectiveData.pay_from || "",
          invoice_number: effectiveData.invoice_number || "",
          comments: effectiveData.comments || (request.title ? `Payment for ${request.title}` : ""),
          vendor_address: effectiveData.vendor_address || "",
          vendor_email: effectiveData.vendor_email || "",
          bank_name: effectiveData.bank_name || "",
          tax_id: effectiveData.tax_id || "",
          bank_country: initialCountry,
          routing_wire: effectiveData.routing_wire || "",
          routing_ach: effectiveData.routing_ach || "",
          bank_account_number: effectiveData.bank_account_number || "",
          swift_code: effectiveData.swift_code || effectiveData.bic || "",
          sort_code: effectiveData.sort_code || "",
          transit_code_ca: effectiveData.transit_code_ca || "",
          institution_code: effectiveData.institution_code || "",
          branch_code: effectiveData.branch_code || "",
          bsb_australia: effectiveData.bsb_australia || "",
          clearing_code: effectiveData.clearing_code || "",
          bank_code: effectiveData.bank_code || "",
          iban: effectiveData.iban || "",
          bic: effectiveData.bic || effectiveData.swift_code || "",
          region: effectiveData.region || "",
          contact_name_china: effectiveData.contact_name_china || "",
          category: effectiveData.category || (effectiveData as any).payment_type || "Others",
        };

        setForm(mappedForm);
        handleCountryChange(initialCountry, undefined, mappedForm);
      } else {
        const defaultCountry = "United States";
        setForm((prev) => ({
          ...prev,
          entry_date: todayStr,
          payment_date: todayStr,
          vendor: fallbackVendor,
          amount: purchaseOrder?.amount || request.amount || prev.amount,
          currency: purchaseOrder?.currency || request.currency || prev.currency || "USD",
          bank_country: defaultCountry,
        }));
        handleCountryChange(defaultCountry);
      }
    }
  }, [open, request, purchaseOrder, todayStr, initialData, fetchedWireData, defaultTab, normalizedTabs, fallbackVendor]);
  const cleanDate = (d?: string | null) => {
    if (!d || d.trim() === "" || d === "null" || d === "undefined") return undefined;
    return d.trim();
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, boolean> = {};

    // Validate Tab 1 if visible
    if (normalizedTabs.includes("general")) {
      if (!form.entered_by?.trim()) newErrors.entered_by = true;
      if (!form.entry_date?.trim()) newErrors.entry_date = true;
      if (!form.vendor?.trim()) newErrors.vendor = true;
      if (!form.amount || Number(form.amount) <= 0) newErrors.amount = true;
      if (!form.pay_from?.trim()) newErrors.pay_from = true;

      if (Object.keys(newErrors).length > 0) {
        setValidationErrors(newErrors);
        toast.error("Please fill in all required fields marked with * in General & Payment.");
        setActiveTab("general");
        return;
      }
    }

    // Validate Bank & Clearing required fields
    for (const reqKey of requiredFieldKeys) {
      const val = form[reqKey as keyof WireTransferInput];
      if (val === undefined || val === null || String(val).trim() === "") {
        newErrors[reqKey] = true;
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setValidationErrors(newErrors);
      if (normalizedTabs.includes("banking")) {
        setActiveTab("banking");
      }
      toast.error("Please fill in all required fields marked with *.");
      return;
    }

    setValidationErrors({});

    onConfirm({
      ...form,
      amount: Number(form.amount) || 0,
      entry_date: cleanDate(form.entry_date),
      due_date: cleanDate(form.due_date),
      payment_date: cleanDate(form.payment_date),
      bic: form.swift_code || form.bic, // keep bic synced
    });
  };
  // Add / Remove Field Handlers (NO DUPLICATES ALLOWED)
  const addBankField = (fieldId: string) => {
    if (!visibleBankFields.includes(fieldId)) {
      setVisibleBankFields((prev) => [...prev, fieldId]);
    }
    setAddBankFieldOpen(false);
  };
  const removeBankField = (fieldId: string) => {
    if (requiredFieldKeys.has(fieldId)) return;
    setVisibleBankFields((prev) => prev.filter((id) => id !== fieldId));
    setForm((prev) => ({ ...prev, [fieldId]: "" }));
  };
  const addClearingField = (fieldId: string) => {
    if (!visibleClearingFields.includes(fieldId)) {
      setVisibleClearingFields((prev) => [...prev, fieldId]);
    }
    setAddClearingFieldOpen(false);
  };
  const removeClearingField = (fieldId: string) => {
    if (requiredFieldKeys.has(fieldId)) return;
    setVisibleClearingFields((prev) => prev.filter((id) => id !== fieldId));
    setForm((prev) => ({ ...prev, [fieldId]: "" }));
  };
  return { normalizedTabs, activeTab, setActiveTab, validationErrors, setValidationErrors, showDiscardConfirm, setShowDiscardConfirm, achSameAsWire, setAchSameAsWire, visibleBankFields, visibleClearingFields, requiredFieldKeys, countrySpec, availableBankFields, availableClearingFields, addBankFieldOpen, setAddBankFieldOpen, addClearingFieldOpen, setAddClearingFieldOpen, addBankRef, bankScrollRef, addClearingRef, clearingScrollRef, form, setForm, handleCountryChange, isEffectiveEditMode, handleSubmit, addBankField, removeBankField, addClearingField, removeClearingField };
}
