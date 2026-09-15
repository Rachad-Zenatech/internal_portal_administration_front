import { useState, useEffect, useMemo, useRef, type FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Check, ChevronsUpDown, Plus, X, Building, Loader2 } from "lucide-react";
import type { BusinessContactReference } from "@/types/businessContact";
import { WireBankingFields } from "./WireBankingFields";
import type { WireTransferInput } from "@/types/purchasing";
import { financeService } from "@/services/financeService";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface CreatableComboboxProps {
  value?: string;
  onChange: (value: string) => void;
  options?: string[];
  fetchOptions?: () => Promise<string[]>;
  placeholder?: string;
  addLabelPrefix?: string; // e.g. "Add new vendor"
  entityTypeLabel?: string; // e.g. "Vendor" or "Entity"
  icon?: React.ReactNode;
  hasError?: boolean;
  disabled?: boolean;
  className?: string;
  required?: boolean;
  name?: string;
  enableCreationModal?: boolean;
  onSelectContact?: (contact: BusinessContactReference) => void;
}

export function CreatableCombobox({
  value = "",
  onChange,
  options: initialOptions = [],
  fetchOptions,
  placeholder = "Type or select...",
  addLabelPrefix = "Add new",
  entityTypeLabel = "item",
  icon,
  hasError = false,
  disabled = false,
  className = "",
  required = false,
  name,
  enableCreationModal,
  onSelectContact,
}: CreatableComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value || "");
  const [optionsList, setOptionsList] = useState<string[]>(initialOptions);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const queryClient = useQueryClient();

  // Modal State for Vendor / Payee Creation
  const isVendorEntity =
    entityTypeLabel.toLowerCase().includes("vendor") ||
    entityTypeLabel.toLowerCase().includes("payee") ||
    enableCreationModal === true;

  const [contactMap, setContactMap] = useState<Record<string, BusinessContactReference>>({});
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    display_name: "",
    full_name: "",
    email: "",
    phone_numbers: "",
    bill_address: "",
    ship_address: "",
  });
  const [bankingForm, setBankingForm] = useState<WireTransferInput>({
    bank_name: "",
    bank_country: "",
    bank_account_number: "",
    bank_address: "",
    routing_wire: "",
    routing_ach: "",
    swift_code: "",
    iban: "",
  });
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<number, HTMLButtonElement>>(new Map());

  // Keep internal query synchronized with external value
  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  // Keep options synchronized when initialOptions changes
  useEffect(() => {
    if (initialOptions && initialOptions.length > 0) {
      setOptionsList((prev) => {
        const merged = Array.from(new Set([...initialOptions, ...prev]));
        return merged.filter(Boolean);
      });
    }
  }, [initialOptions]);

  const loadRemoteOptions = () => {
    if (!fetchOptions) return;
    setIsLoading(true);
    fetchOptions()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setOptionsList((prev) => {
            const merged = Array.from(new Set([...prev, ...data]));
            return merged.filter(Boolean);
          });
        }
      })
      .catch((err) => {
        console.debug("Failed to load options:", err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  // Pre-load payable contacts map when isVendorEntity
  useEffect(() => {
    if (isVendorEntity) {
      financeService
        .getPayableContacts({ limit: 500 })
        .then((res) => {
          if (res && res.items) {
            const map: Record<string, BusinessContactReference> = {};
            const names: string[] = [];
            res.items.forEach((c) => {
              if (c.display_name) {
                map[c.display_name.toLowerCase()] = c;
                names.push(c.display_name);
              }
            });
            setContactMap((prev) => ({ ...prev, ...map }));
            setOptionsList((prev) =>
              Array.from(new Set([...prev, ...names])).filter(Boolean)
            );
          }
        })
        .catch(() => {});
    }
  }, [isVendorEntity]);

  // Fetch remote options on mount
  useEffect(() => {
    loadRemoteOptions();
  }, [fetchOptions]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const trimmedQuery = query.trim();

  // Filter options based on query
  const filteredOptions = useMemo(() => {
    if (!trimmedQuery) return optionsList;
    const lower = trimmedQuery.toLowerCase();
    return optionsList.filter((opt) => opt.toLowerCase().includes(lower));
  }, [optionsList, trimmedQuery]);

  // Check if query is an exact match for an existing option
  const isExactMatch = useMemo(() => {
    if (!trimmedQuery) return false;
    return optionsList.some(
      (opt) => opt.toLowerCase() === trimmedQuery.toLowerCase()
    );
  }, [optionsList, trimmedQuery]);

  // Should we show the "+ Create new" button?
  const showAddOption = trimmedQuery.length > 0 && !isExactMatch;

  const totalItemsCount = (showAddOption ? 1 : 0) + filteredOptions.length;

  const selectOption = (val: string, customContact?: BusinessContactReference) => {
    setQuery(val);
    onChange(val);
    setOpen(false);
    const matched = customContact || contactMap[val.toLowerCase()];
    if (matched) {
      onSelectContact?.(matched);
    }
  };

  const handleAddNew = () => {
    if (!trimmedQuery) return;

    if (isVendorEntity) {
      // Open detailed Vendor Creation Modal
      setCreateForm({
        display_name: trimmedQuery,
        full_name: "",
        email: "",
        phone_numbers: "",
        bill_address: "",
        ship_address: "",
      });
      setBankingForm({
        bank_name: "",
        bank_country: "",
        bank_account_number: "",
        bank_address: "",
        routing_wire: "",
        routing_ach: "",
        swift_code: "",
        iban: "",
      });
      setCreateError(null);
      setOpen(false);
      setCreateModalOpen(true);
    } else {
      // Standard quick add for other entities
      if (!optionsList.includes(trimmedQuery)) {
        setOptionsList((prev) => [trimmedQuery, ...prev]);
      }
      selectOption(trimmedQuery);
    }
  };

  const handleCreateVendorSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const vendorName = createForm.display_name.trim();
    if (!vendorName) return;

    setIsCreating(true);
    setCreateError(null);

    try {
      const banking_details: Record<string, any> = {};
      Object.entries(bankingForm).forEach(([k, v]) => {
        if (v !== undefined && v !== null && String(v).trim() !== "") {
          banking_details[k] = typeof v === "string" ? v.trim() : v;
        }
      });

      const created = await financeService.createPayableContact({
        account_side: "ap",
        contact_type: "vendor",
        display_name: vendorName,
        full_name: createForm.full_name.trim() || null,
        email: createForm.email.trim() || null,
        phone_numbers: createForm.phone_numbers.trim() || null,
        bill_address: createForm.bill_address.trim() || null,
        ship_address: createForm.ship_address.trim() || null,
        banking_details: Object.keys(banking_details).length > 0 ? banking_details : undefined,
      });

      const fullContact: BusinessContactReference = {
        ...created,
        banking_details: Object.keys(banking_details).length > 0 ? banking_details : undefined,
      };

      setContactMap((prev) => ({
        ...prev,
        [vendorName.toLowerCase()]: fullContact,
      }));

      // Invalidate queries so other components update
      queryClient.invalidateQueries({ queryKey: ["purchasing_vendors"] });
      queryClient.invalidateQueries({ queryKey: ["businessContacts"] });

      // Add to local options and select
      setOptionsList((prev) => [
        vendorName,
        ...prev.filter((o) => o.toLowerCase() !== vendorName.toLowerCase()),
      ]);
      selectOption(vendorName, fullContact);
      setCreateModalOpen(false);
      toast.success(`Vendor "${vendorName}" created and selected.`);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create vendor.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        setOpen(true);
        if (optionsList.length === 0) loadRemoteOptions();
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => {
        const next = prev < totalItemsCount - 1 ? prev + 1 : 0;
        itemRefs.current.get(next)?.scrollIntoView({ block: "nearest" });
        return next;
      });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => {
        const next = prev > 0 ? prev - 1 : Math.max(0, totalItemsCount - 1);
        itemRefs.current.get(next)?.scrollIntoView({ block: "nearest" });
        return next;
      });
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (showAddOption && highlightedIndex === 0) {
        handleAddNew();
      } else {
        const optionIndex = showAddOption ? highlightedIndex - 1 : highlightedIndex;
        if (filteredOptions[optionIndex]) {
          selectOption(filteredOptions[optionIndex]);
        } else if (showAddOption) {
          handleAddNew();
        } else if (trimmedQuery) {
          selectOption(trimmedQuery);
        }
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    }
  };

  return (
    <>
      <div ref={containerRef} className="relative w-full">
        <div className="relative flex items-center">
          {icon && (
            <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              {icon}
            </div>
          )}
          <Input
            ref={inputRef}
            name={name}
            required={required}
            disabled={disabled}
            value={query}
            onChange={(e) => {
              const val = e.target.value;
              setQuery(val);
              onChange(val);
              setHighlightedIndex(0);
              if (!open) setOpen(true);
            }}
            onFocus={() => {
              setOpen(true);
              setHighlightedIndex(0);
              if (optionsList.length === 0) {
                loadRemoteOptions();
              }
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={`h-9 text-xs font-medium bg-slate-50/50 dark:bg-zinc-800/50 transition-all ${
              icon ? "pl-8" : "pl-3"
            } ${query ? "pr-14" : "pr-8"} ${
              hasError ? "border-red-500 focus-visible:ring-red-500" : ""
            } ${className}`}
          />

          <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
            {isLoading && (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400 mr-1" />
            )}
            {query && !disabled && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  onChange("");
                  inputRef.current?.focus();
                }}
                aria-label="Clear"
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 rounded transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              tabIndex={-1}
              disabled={disabled}
              onClick={() => {
                if (!disabled) {
                  const nextOpen = !open;
                  setOpen(nextOpen);
                  if (nextOpen && optionsList.length === 0) {
                    loadRemoteOptions();
                  }
                  inputRef.current?.focus();
                }
              }}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 rounded transition-colors"
            >
              <ChevronsUpDown className="w-3.5 h-3.5 opacity-60" />
            </button>
          </div>
        </div>

        {open && (
          <div
            data-radix-scroll-lock-ignore=""
            className="absolute left-0 right-0 top-full mt-1 z-50 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-100"
          >
            {/* Header info badge if query is typed */}
            <div className="px-3 py-1.5 border-b border-slate-100 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-800/50 flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400">
              <span>
                {query ? (
                  <>
                    Searching:{" "}
                    <strong className="text-slate-800 dark:text-zinc-200">
                      {query}
                    </strong>
                  </>
                ) : (
                  <>Known {entityTypeLabel}s</>
                )}
              </span>
              <span className="text-[10px] text-slate-400">
                {isLoading ? "Loading..." : `${filteredOptions.length} available`}
              </span>
            </div>

            <div
              ref={listRef}
              data-radix-scroll-lock-ignore=""
              tabIndex={-1}
              style={{
                scrollbarWidth: "thin",
                overscrollBehavior: "contain",
                WebkitOverflowScrolling: "touch",
              }}
              className="max-h-56 overflow-y-auto overscroll-contain py-1 text-xs"
            >
              {/* + Add New Option if not exact match */}
              {showAddOption && (
                <button
                  ref={(el) => {
                    if (el) itemRefs.current.set(0, el);
                    else itemRefs.current.delete(0);
                  }}
                  type="button"
                  onClick={handleAddNew}
                  className={`w-full text-left px-3 py-2 flex items-center gap-2 border-b border-indigo-100 dark:border-indigo-900/40 font-medium transition-colors ${
                    highlightedIndex === 0
                      ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold"
                      : "text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50/70 dark:hover:bg-indigo-950/40"
                  }`}
                >
                  <div className="w-5 h-5 rounded-md bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shrink-0">
                    <Plus className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 truncate">
                    <span>{addLabelPrefix} </span>
                    <span className="font-bold underline decoration-indigo-400 underline-offset-2">
                      "{trimmedQuery}"
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-[10px] border-indigo-300 text-indigo-600 dark:border-indigo-700 dark:text-indigo-300 px-1.5 py-0 h-4"
                  >
                    New
                  </Badge>
                </button>
              )}

              {/* Existing Options */}
              {filteredOptions.map((opt, idx) => {
                const itemGlobalIndex = showAddOption ? idx + 1 : idx;
                const isSelected =
                  value?.trim().toLowerCase() === opt.trim().toLowerCase();
                const isHighlighted = highlightedIndex === itemGlobalIndex;

                return (
                  <button
                    key={opt}
                    ref={(el) => {
                      if (el) itemRefs.current.set(itemGlobalIndex, el);
                      else itemRefs.current.delete(itemGlobalIndex);
                    }}
                    type="button"
                    onClick={() => selectOption(opt)}
                    className={`w-full text-left px-3 py-1.5 flex items-center justify-between text-xs transition-colors ${
                      isHighlighted
                        ? "bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 font-medium"
                        : "text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800/60"
                    } ${
                      isSelected
                        ? "font-semibold text-indigo-600 dark:text-indigo-400"
                        : ""
                    }`}
                  >
                    <span className="truncate">{opt}</span>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0 ml-2" />
                    )}
                  </button>
                );
              })}

              {/* Loading indicator if loading and empty */}
              {isLoading && filteredOptions.length === 0 && (
                <div className="px-3 py-4 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Loading {entityTypeLabel.toLowerCase()}s...</span>
                </div>
              )}

              {/* No matches and no add option */}
              {!isLoading &&
                filteredOptions.length === 0 &&
                !showAddOption && (
                  <div className="px-3 py-4 text-center text-slate-400 text-xs">
                    No matching {entityTypeLabel.toLowerCase()}s found
                  </div>
                )}
            </div>
          </div>
        )}
      </div>

      {/* Create New Vendor Dialog */}
      {isVendorEntity && (
        <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
          <DialogContent className="sm:max-w-[700px] max-h-[88vh] overflow-y-auto">
            <form onSubmit={handleCreateVendorSubmit}>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  <span>Create New Vendor / Payee</span>
                </DialogTitle>
                <DialogDescription>
                  This vendor will be added to Accounts Payable references (Account 2000) and selected for this request.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4 sm:grid-cols-2 text-xs">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label
                    htmlFor="create-vendor-name"
                    className="text-xs font-semibold"
                  >
                    Vendor / Beneficiary Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="create-vendor-name"
                    required
                    placeholder="e.g. Acme Corporation"
                    value={createForm.display_name}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        display_name: e.target.value,
                      })
                    }
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="create-contact-name"
                    className="text-xs font-semibold"
                  >
                    Contact Person
                  </Label>
                  <Input
                    id="create-contact-name"
                    placeholder="e.g. Jane Doe"
                    value={createForm.full_name}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        full_name: e.target.value,
                      })
                    }
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="create-email" className="text-xs font-semibold">
                    Email
                  </Label>
                  <Input
                    id="create-email"
                    type="email"
                    placeholder="vendor@example.com"
                    value={createForm.email}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        email: e.target.value,
                      })
                    }
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="create-phone" className="text-xs font-semibold">
                    Phone Number
                  </Label>
                  <Input
                    id="create-phone"
                    placeholder="+1 (555) 000-0000"
                    value={createForm.phone_numbers}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        phone_numbers: e.target.value,
                      })
                    }
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label
                    htmlFor="create-bill-address"
                    className="text-xs font-semibold"
                  >
                    Billing Address
                  </Label>
                  <Textarea
                    id="create-bill-address"
                    rows={2}
                    placeholder="Street, City, State, ZIP"
                    value={createForm.bill_address}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        bill_address: e.target.value,
                      })
                    }
                    className="text-xs resize-none"
                  />
                </div>

                {/* Beneficiary Bank Details & Global & Regional Clearing Codes */}
                <div className="sm:col-span-2 pt-2 border-t border-slate-200 dark:border-zinc-800">
                  <WireBankingFields
                    form={bankingForm}
                    setForm={setBankingForm}
                  />
                </div>
              </div>

              {createError && (
                <p className="mb-3 text-xs text-red-500 font-medium">
                  {createError}
                </p>
              )}

              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCreateModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isCreating || !createForm.display_name.trim()}
                  className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {isCreating && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  )}
                  {isCreating ? "Creating..." : "Create & Select Vendor"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
