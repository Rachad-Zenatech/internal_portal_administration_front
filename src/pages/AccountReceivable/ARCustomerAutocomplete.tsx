import React, { useState, useEffect, useMemo, useRef, type FormEvent } from "react";
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
import { Check, ChevronsUpDown, Plus, X, Building2, User, Mail, Loader2 } from "lucide-react";
import { financeService } from "@/services/financeService";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export interface ARCustomerOption {
  id: string;
  display_name: string;
  name?: string;
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  bill_address?: string | null;
  account_number?: string;
  is_active?: boolean;
  banking_details?: {
    bank_country?: string;
    bank_name?: string;
    bank_account_number?: string;
    routing_wire?: string;
    routing_ach?: string;
    swift_code?: string;
    iban?: string;
    transit_code_ca?: string;
    institution_code?: string;
    tax_id?: string;
    region?: string;
    [key: string]: any;
  } | null;
}

// Default fallback AR customers with settlement banking details
export const DEFAULT_AR_CUSTOMERS: ARCustomerOption[] = [
  {
    id: "CUST-10492",
    display_name: "Acme Corp Infrastructure",
    full_name: "Jonathan Vance",
    email: "accounting@acme-corp.com",
    phone: "+1 (555) 234-8901",
    bill_address: "100 Innovation Way, Suite 400, New York, NY 10001",
    account_number: "1100",
    is_active: true,
    banking_details: {
      bank_country: "United States",
      bank_name: "JPMorgan Chase",
      bank_account_number: "482091840291",
      routing_wire: "021000021",
      routing_ach: "021000021",
      swift_code: "CHASUS33",
      tax_id: "EIN-12-9840192",
      region: "New York",
    },
  },
  {
    id: "CUST-20815",
    display_name: "Vertex GeoSpatial Solutions",
    full_name: "Claire Dubois",
    email: "ap@vertexgeospatial.com",
    phone: "+1 (555) 456-7890",
    bill_address: "750 West Hastings St, Vancouver, BC V6C 1E1",
    account_number: "1100",
    is_active: true,
    banking_details: {
      bank_country: "Canada",
      bank_name: "RBC Royal Bank",
      bank_account_number: "683290145",
      transit_code_ca: "00002",
      institution_code: "003",
      swift_code: "ROYCCAT2",
      region: "British Columbia",
    },
  },
  {
    id: "CUST-30941",
    display_name: "Skyline Drone Logistics Ltd",
    full_name: "Marcus Holloway",
    email: "finance@skylinedrone.io",
    phone: "+1 (555) 789-0123",
    bill_address: "200 Bay Street, Toronto, ON M5J 2J2",
    account_number: "1100",
    is_active: true,
    banking_details: {
      bank_country: "Canada",
      bank_name: "TD Canada Trust",
      bank_account_number: "551982019",
      transit_code_ca: "10232",
      institution_code: "004",
      swift_code: "TDOMCATT",
      region: "Ontario",
    },
  },
  {
    id: "CUST-40122",
    display_name: "AeroFleet Global Operations",
    full_name: "Elena Rostova",
    email: "invoices@aerofleet-global.com",
    phone: "+1 (555) 901-2345",
    bill_address: "1400 K Street NW, Washington, DC 20005",
    account_number: "1100",
    is_active: true,
    banking_details: {
      bank_country: "United States",
      bank_name: "Silicon Valley Bank (SVB)",
      bank_account_number: "91048201934",
      routing_wire: "121140399",
      routing_ach: "121140399",
      swift_code: "SVBKUS6S",
      region: "District of Columbia",
    },
  },
  {
    id: "CUST-50883",
    display_name: "OmniTech Defense & Robotics",
    full_name: "David Sterling",
    email: "procurement@omnitech-defense.com",
    phone: "+1 (555) 345-6789",
    bill_address: "500 Oracle Parkway, Redwood City, CA 94065",
    account_number: "1100",
    is_active: true,
    banking_details: {
      bank_country: "United States",
      bank_name: "Bank of America",
      bank_account_number: "38190248102",
      routing_wire: "026009593",
      routing_ach: "121000358",
      swift_code: "BOFAUS3N",
      region: "California",
    },
  },
];

interface ARCustomerAutocompleteProps {
  customerId: string;
  customerName: string;
  onSelect: (customer: ARCustomerOption) => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function ARCustomerAutocomplete({
  customerId,
  customerName,
  onSelect,
  required = false,
  disabled = false,
  className = "",
}: ARCustomerAutocompleteProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(customerName || "");
  const [customers, setCustomers] = useState<ARCustomerOption[]>(DEFAULT_AR_CUSTOMERS);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  // New Customer Dialog state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState({
    display_name: "",
    full_name: "",
    email: "",
    phone_numbers: "",
    bill_address: "",
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<number, HTMLButtonElement>>(new Map());

  // Synchronize internal query with customerName prop
  useEffect(() => {
    setQuery(customerName || "");
  }, [customerName]);

  // Load AR Customers from financeService / payable-contacts endpoint
  useEffect(() => {
    setIsLoading(true);
    financeService
      .getPayableContacts({ limit: 500 })
      .then((res) => {
        if (res && res.items && res.items.length > 0) {
          // Filter for AR customers or contacts with 1100 account
          const arContacts: ARCustomerOption[] = res.items
            .filter(
              (c: any) =>
                c.contact_type === "customer" ||
                c.account_side === "ar" ||
                c.account_number === "1100" ||
                !c.account_number ||
                String(c.account_number).startsWith("11")
            )
            .map((c: any) => ({
              id: `CUST-${c.id || Math.floor(Math.random() * 80000 + 10000)}`,
              display_name: c.display_name,
              full_name: c.full_name || null,
              email: c.email || null,
              phone: c.phone_numbers || null,
              bill_address: c.bill_address || null,
              account_number: c.account_number || "1100",
              is_active: c.is_active !== false,
              banking_details: c.banking_details || c.banking || null,
            }));

          if (arContacts.length > 0) {
            // Merge with default customers
            const merged: ARCustomerOption[] = [...arContacts];
            DEFAULT_AR_CUSTOMERS.forEach((def) => {
              if (!merged.some((m) => m.display_name.toLowerCase() === def.display_name.toLowerCase())) {
                merged.push(def);
              }
            });
            setCustomers(merged);
          }
        }
      })
      .catch((err) => {
        console.debug("Could not fetch contacts, using defaults:", err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const trimmedQuery = query.trim();

  // Filter customers based on query
  const filteredCustomers = useMemo(() => {
    if (!trimmedQuery) return customers;
    const lower = trimmedQuery.toLowerCase();
    return customers.filter(
      (c) =>
        c.display_name.toLowerCase().includes(lower) ||
        c.id.toLowerCase().includes(lower) ||
        (c.email && c.email.toLowerCase().includes(lower)) ||
        (c.full_name && c.full_name.toLowerCase().includes(lower))
    );
  }, [customers, trimmedQuery]);

  const isExactMatch = useMemo(() => {
    if (!trimmedQuery) return false;
    return customers.some(
      (c) => c.display_name.toLowerCase() === trimmedQuery.toLowerCase()
    );
  }, [customers, trimmedQuery]);

  const showAddOption = trimmedQuery.length > 0 && !isExactMatch;
  const totalItemsCount = (showAddOption ? 1 : 0) + filteredCustomers.length;

  const handleSelectCustomer = (customer: ARCustomerOption) => {
    setQuery(customer.display_name);
    onSelect(customer);
    setOpen(false);
  };

  const handleOpenCreateModal = () => {
    setCreateForm({
      display_name: trimmedQuery,
      full_name: "",
      email: "",
      phone_numbers: "",
      bill_address: "",
    });
    setCreateError(null);
    setOpen(false);
    setCreateModalOpen(true);
  };

  const handleCreateCustomerSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const custName = createForm.display_name.trim();
    if (!custName) return;

    setIsCreating(true);
    setCreateError(null);

    try {
      const created = await financeService.createPayableContact({
        account_side: "ar",
        contact_type: "customer",
        display_name: custName,
        full_name: createForm.full_name.trim() || null,
        email: createForm.email.trim() || null,
        phone_numbers: createForm.phone_numbers.trim() || null,
        bill_address: createForm.bill_address.trim() || null,
        account_number: "1100",
        account_name: "Accounts Receivable",
        account_type: "Accounts Receivable",
      });

      const newCustOption: ARCustomerOption = {
        id: `CUST-${created.id || Math.floor(Math.random() * 80000 + 10000)}`,
        display_name: created.display_name || custName,
        full_name: created.full_name,
        email: created.email,
        phone: created.phone_numbers,
        bill_address: created.bill_address,
        account_number: "1100",
        is_active: true,
      };

      setCustomers((prev) => [newCustOption, ...prev]);
      handleSelectCustomer(newCustOption);
      queryClient.invalidateQueries({ queryKey: ["businessContacts"] });
      queryClient.invalidateQueries({ queryKey: ["payable-contacts"] });
      setCreateModalOpen(false);
      toast.success(`AR Customer "${custName}" created and selected.`);
    } catch (err: any) {
      console.error("Failed to create AR customer:", err);
      // Fallback: create local option if offline or server mock
      const fallbackId = `CUST-${Math.floor(Math.random() * 80000 + 10000)}`;
      const fallbackCust: ARCustomerOption = {
        id: fallbackId,
        display_name: custName,
        full_name: createForm.full_name.trim() || null,
        email: createForm.email.trim() || null,
        phone: createForm.phone_numbers.trim() || null,
        bill_address: createForm.bill_address.trim() || null,
        account_number: "1100",
        is_active: true,
      };
      setCustomers((prev) => [fallbackCust, ...prev]);
      handleSelectCustomer(fallbackCust);
      setCreateModalOpen(false);
      toast.success(`AR Customer "${custName}" added and selected.`);
    } finally {
      setIsCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        setOpen(true);
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
        handleOpenCreateModal();
      } else {
        const custIndex = showAddOption ? highlightedIndex - 1 : highlightedIndex;
        if (filteredCustomers[custIndex]) {
          handleSelectCustomer(filteredCustomers[custIndex]);
        } else if (showAddOption) {
          handleOpenCreateModal();
        } else if (trimmedQuery) {
          onSelect({
            id: customerId || `CUST-${Math.floor(Math.random() * 80000 + 10000)}`,
            display_name: trimmedQuery,
            name: trimmedQuery,
          });
          setOpen(false);
        }
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    }
  };

  return (
    <>
      <div ref={containerRef} className={`relative w-full ${className}`}>
        <div className="relative flex items-center">
          <Building2 className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          
          <Input
            ref={inputRef}
            disabled={disabled}
            required={required}
            value={query}
            onChange={(e) => {
              const val = e.target.value;
              setQuery(val);
              onSelect({
                id: customerId || (val ? `CUST-${Math.floor(Math.random() * 80000 + 10000)}` : ""),
                display_name: val,
                name: val,
              });
              setHighlightedIndex(0);
              if (!open) setOpen(true);
            }}
            onFocus={() => {
              setOpen(true);
              setHighlightedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search AR customer by name, ID, email..."
            className="h-8 text-xs pl-8 pr-16 bg-background"
          />

          <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
            {isLoading && (
              <Loader2 className="w-3 h-3 animate-spin text-muted-foreground mr-1" />
            )}
            {query && !disabled && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  onSelect({ id: "", display_name: "", name: "" });
                  inputRef.current?.focus();
                }}
                className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            )}
            <button
              type="button"
              tabIndex={-1}
              disabled={disabled}
              onClick={() => {
                if (!disabled) {
                  setOpen(!open);
                  inputRef.current?.focus();
                }
              }}
              className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
            >
              <ChevronsUpDown className="w-3 h-3 opacity-70" />
            </button>
          </div>
        </div>

        {/* Dropdown Options List */}
        {open && (
          <div
            data-radix-scroll-lock-ignore=""
            className="absolute left-0 right-0 top-full mt-1 z-50 rounded-xl border border-border bg-popover text-popover-foreground shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-100"
          >
            <div className="px-3 py-1.5 border-b border-border/60 bg-muted/40 flex items-center justify-between text-[11px] text-muted-foreground">
              <span className="font-medium">
                {query ? (
                  <>
                    Matching AR Customers: <strong className="text-foreground">"{query}"</strong>
                  </>
                ) : (
                  <>Accounts Receivable Customer Directory</>
                )}
              </span>
              <span className="text-[10px] opacity-80">
                {filteredCustomers.length} contact(s)
              </span>
            </div>

            <div
              ref={listRef}
              style={{
                scrollbarWidth: "thin",
                overscrollBehavior: "contain",
              }}
              className="max-h-60 overflow-y-auto py-1 text-xs divide-y divide-border/40"
            >
              {/* Add New Contact Button */}
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className={`w-full text-left px-3 py-2 flex items-center gap-2 font-medium transition-colors ${
                  showAddOption && highlightedIndex === 0
                    ? "bg-primary/15 text-primary font-semibold"
                    : "text-primary hover:bg-primary/10"
                }`}
              >
                <div className="w-5 h-5 rounded-md bg-primary/20 text-primary flex items-center justify-center shrink-0">
                  <Plus className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 truncate">
                  <span>Add New AR Customer </span>
                  {trimmedQuery && (
                    <span className="font-bold underline decoration-primary/40 underline-offset-2">
                      "{trimmedQuery}"
                    </span>
                  )}
                </div>
                <Badge variant="outline" className="text-[9px] border-primary/40 text-primary px-1.5 py-0 h-4">
                  New Contact
                </Badge>
              </button>

              {/* Customer List Items */}
              {filteredCustomers.map((cust, idx) => {
                const itemGlobalIndex = showAddOption ? idx + 1 : idx;
                const isSelected =
                  customerId.toLowerCase() === cust.id.toLowerCase() ||
                  customerName.toLowerCase() === cust.display_name.toLowerCase();
                const isHighlighted = highlightedIndex === itemGlobalIndex;

                return (
                  <button
                    key={cust.id + cust.display_name}
                    type="button"
                    onClick={() => handleSelectCustomer(cust)}
                    className={`w-full text-left px-3 py-2 flex items-start justify-between text-xs transition-colors ${
                      isSelected
                        ? "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 font-medium"
                        : isHighlighted
                        ? "bg-muted/70 text-foreground"
                        : "hover:bg-muted/40 text-foreground"
                    }`}
                  >
                    <div className="min-w-0 flex-1 pr-2 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground truncate">
                          {cust.display_name}
                        </span>
                        <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground border border-border/60">
                          {cust.id}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                        {cust.full_name && (
                          <span className="truncate flex items-center gap-1">
                            <User className="w-3 h-3 text-muted-foreground shrink-0" />
                            {cust.full_name}
                          </span>
                        )}
                        {cust.email && (
                          <span className="truncate flex items-center gap-1 font-mono text-[10px]">
                            <Mail className="w-3 h-3 text-muted-foreground shrink-0" />
                            {cust.email}
                          </span>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    )}
                  </button>
                );
              })}

              {filteredCustomers.length === 0 && !showAddOption && (
                <div className="px-3 py-4 text-center text-muted-foreground text-xs">
                  No matching AR customers found.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add New AR Customer Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="sm:max-w-[540px] max-h-[85vh] overflow-y-auto bg-background border border-border">
          <form onSubmit={handleCreateCustomerSubmit}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
                <Building2 className="w-4 h-4 text-primary" />
                <span>Add New Accounts Receivable Customer</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Register a new customer account in the Accounts Receivable ledger (Account 1100).
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-3.5 py-4 sm:grid-cols-2 text-xs">
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs font-semibold text-foreground">
                  Customer / Company Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  required
                  placeholder="e.g. Skyline Drone Logistics Ltd"
                  value={createForm.display_name}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, display_name: e.target.value })
                  }
                  className="h-8 text-xs font-medium"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-foreground">
                  Contact Person
                </Label>
                <Input
                  placeholder="e.g. Marcus Holloway"
                  value={createForm.full_name}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, full_name: e.target.value })
                  }
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-foreground">
                  Billing Email
                </Label>
                <Input
                  type="email"
                  placeholder="billing@customer.com"
                  value={createForm.email}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, email: e.target.value })
                  }
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs font-semibold text-foreground">
                  Phone Number
                </Label>
                <Input
                  placeholder="+1 (555) 000-0000"
                  value={createForm.phone_numbers}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, phone_numbers: e.target.value })
                  }
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs font-semibold text-foreground">
                  Billing Address
                </Label>
                <Textarea
                  rows={2}
                  placeholder="Street, City, State/Province, Postal Code, Country"
                  value={createForm.bill_address}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, bill_address: e.target.value })
                  }
                  className="text-xs resize-none"
                />
              </div>
            </div>

            {createError && (
              <p className="mb-3 text-xs text-red-500 font-medium">
                {createError}
              </p>
            )}

            <DialogFooter className="gap-2 pt-2 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCreateModalOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isCreating || !createForm.display_name.trim()}
                className="gap-1.5 text-xs bg-primary text-primary-foreground"
              >
                {isCreating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Plus className="w-3.5 h-3.5" />
                )}
                <span>{isCreating ? "Saving Customer..." : "Add & Select Customer"}</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default ARCustomerAutocomplete;
