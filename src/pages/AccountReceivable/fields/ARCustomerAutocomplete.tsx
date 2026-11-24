import { useState, useEffect, useMemo, useRef, type FormEvent, type KeyboardEvent } from "react";
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
import { oauthService } from "@/services/oauthService";
import { useARCompaniesDirectory } from "@/hooks/useHubSpotCompanies";
import { useQuery, useQueryClient } from "@tanstack/react-query";

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
  hubspot_id?: string | null;
  is_hubspot?: boolean;
  brand?: string | null;
  domain?: string | null;
  currency?: string | null;
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

interface ARCustomerAutocompleteProps {
  customerId: string;
  customerName: string;
  onSelect: (customer: ARCustomerOption) => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

const CUSTOMER_PAGE_SIZE = 100;

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
  const [createdCustomers, setCreatedCustomers] = useState<ARCustomerOption[]>([]);
  const [visibleCount, setVisibleCount] = useState(CUSTOMER_PAGE_SIZE);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const { data: directoryData, isLoading: isDirectoryLoading } = useARCompaniesDirectory();
  const { data: brandsData } = useQuery({
    queryKey: ["hubspot-companies", "brands"],
    queryFn: () => oauthService.getHubSpotCompanyBrands(),
    staleTime: 5 * 60 * 1000,
  });
  const availableBrands = useMemo(() => {
    const set = new Set<string>();
    (brandsData?.brands || []).forEach((b) => { if (b.brand?.trim()) set.add(b.brand.trim()); });
    (directoryData?.items || []).forEach((c) => {
      (c.brand || "").split(/[;,]/).forEach((b) => { if (b.trim()) set.add(b.trim()); });
    });
    const list = Array.from(set).sort((a, b) => a.localeCompare(b));
    return list.length > 0 ? list : ["General"];
  }, [brandsData, directoryData]);
  const isLoading = isDirectoryLoading || (open && query.trim() !== debouncedQuery);
  const isLoadingMore = false;

  // New Customer Dialog state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState({
    display_name: "",
    brand: "",
    full_name: "",
    email: "",
    phone_numbers: "",
    bill_address: "",
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<number, HTMLButtonElement>>(new Map());

  // True while the user is editing the text; stops prop-driven syncing from overwriting their edits.
  const isTypingRef = useRef(false);

  // Adopt a customer name set from outside (loaded document, URL params, selection elsewhere).
  useEffect(() => {
    if (customerName && customerName !== query && !isTypingRef.current) {
      setQuery(customerName);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerName]);

  // Use the cached local A/R Companies table (no per-keystroke server/HubSpot fetch).
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQuery(query.trim());
      setVisibleCount(CUSTOMER_PAGE_SIZE);
    }, 2000);
    return () => clearTimeout(t);
  }, [query]);

  const allCustomers = useMemo<ARCustomerOption[]>(() => {
    const items = directoryData?.items || [];
    const fromDir = items
      .filter((c) => Boolean(c.brand && c.brand.trim()))
      .map((c) => ({
        id: `CUST-${c.hubspot_id}`,
        display_name: c.name,
        name: c.name,
        full_name: c.contact_name || null,
        email: c.billing_email || c.contact_email || null,
        phone: c.phone || c.contact_phone || null,
        bill_address: c.address || null,
        account_number: "HUBSPOT",
        is_active: true,
        hubspot_id: c.hubspot_id ?? null,
        is_hubspot: true,
        brand: c.brand || null,
        domain: c.domain || null,
        currency: c.currency || null,
      }));
    return createdCustomers.length ? [...createdCustomers, ...fromDir] : fromDir;
  }, [directoryData, createdCustomers]);

  // Resolve the display name from customerId only when no name was given and the user isn't typing.
  useEffect(() => {
    if (customerName || isTypingRef.current || !customerId || allCustomers.length === 0) return;
    const match = allCustomers.find(
      (c) =>
        c.id.toLowerCase() === customerId.toLowerCase() ||
        `CUST-${c.id}`.toLowerCase() === customerId.toLowerCase() ||
        c.id.toLowerCase().endsWith(customerId.toLowerCase())
    );
    if (match) setQuery(match.display_name);
  }, [customerName, customerId, allCustomers]);

  const matchingCustomers = useMemo(() => {
    if (!debouncedQuery) return allCustomers;
    const q = debouncedQuery.toLowerCase();
    return allCustomers.filter(
      (c) =>
        c.display_name.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        (c.email || "").toLowerCase().includes(q) ||
        (c.full_name || "").toLowerCase().includes(q) ||
        (c.domain || "").toLowerCase().includes(q) ||
        (c.brand || "").toLowerCase().includes(q)
    );
  }, [allCustomers, debouncedQuery]);

  const customers = useMemo(() => matchingCustomers.slice(0, visibleCount), [matchingCustomers, visibleCount]);
  const totalCount = matchingCustomers.length;
  const hasMore = visibleCount < matchingCustomers.length;

  const handleListScroll = () => {
    const el = listRef.current;
    if (el && hasMore && el.scrollHeight - el.scrollTop - el.clientHeight < 48) {
      setVisibleCount((prev) => prev + CUSTOMER_PAGE_SIZE);
    }
  };

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

  // Results are already filtered server-side.
  const filteredCustomers = customers;

  const isExactMatch = useMemo(() => {
    if (!trimmedQuery) return false;
    return customers.some(
      (c) => c.display_name.toLowerCase() === trimmedQuery.toLowerCase()
    );
  }, [customers, trimmedQuery]);

  const showAddOption = trimmedQuery.length > 0 && !isExactMatch;
  const totalItemsCount = (showAddOption ? 1 : 0) + filteredCustomers.length;

  const handleSelectCustomer = (customer: ARCustomerOption) => {
    isTypingRef.current = false;
    setQuery(customer.display_name);
    onSelect(customer);
    setOpen(false);
  };

  const handleOpenCreateModal = () => {
    setCreateForm({
      display_name: trimmedQuery,
      brand: availableBrands[0] || "General",
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
      const created = await oauthService.createARCompany({
        name: custName,
        brand: createForm.brand.trim() || "General",
        contact_name: createForm.full_name.trim() || undefined,
        billing_email: createForm.email.trim() || undefined,
        phone: createForm.phone_numbers.trim() || undefined,
        address: createForm.bill_address.trim() || undefined,
      });

      const newCustOption: ARCustomerOption = {
        id: created.customer_id || `CUST-${created.hubspot_id}`,
        display_name: created.display_name || created.name || custName,
        name: created.name || custName,
        full_name: created.contact_name || null,
        email: created.billing_email || null,
        phone: created.phone || null,
        bill_address: created.address || null,
        account_number: "HUBSPOT",
        is_active: true,
        hubspot_id: created.hubspot_id ?? null,
        is_hubspot: true,
        brand: created.brand || createForm.brand.trim() || "General",
        currency: created.currency || "USD",
      };

      setCreatedCustomers((prev) => [newCustOption, ...prev]);
      handleSelectCustomer(newCustOption);
      queryClient.invalidateQueries({ queryKey: ["hubspot-companies"] });
      queryClient.invalidateQueries({ queryKey: ["ar-customers"] });
      setCreateModalOpen(false);
    } catch (err: any) {
      console.error("Failed to create AR customer:", err);
      setCreateError(err?.response?.data?.detail || err?.message || "Failed to save A/R company.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
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
            ref={inputRef} autoComplete="new-password" data-lpignore="true" data-form-type="other"
            disabled={disabled}
            required={required}
            value={query}
            onChange={(e) => {
              const val = e.target.value;
              isTypingRef.current = true;
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
              <Loader2 className="w-3.5 h-3.5 animate-spin text-primary mr-1" />
            )}
            {query && !disabled && (
              <button
                type="button"
                onClick={() => {
                  isTypingRef.current = true;
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
              <span className="text-[10px] opacity-80 inline-flex items-center gap-1">
                {isLoading ? (<><Loader2 className="w-3 h-3 animate-spin text-primary" /> Searching...</>) : `${filteredCustomers.length}${totalCount > filteredCustomers.length ? ` of ${totalCount}` : ""} contact(s)`}
              </span>
            </div>

            <div
              ref={listRef}
              onScroll={handleListScroll}
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
                        {cust.brand &&
                          cust.brand.split(",").map((b) => b.trim()).filter(Boolean).map((b) => (
                            <span
                              key={b}
                              className="text-[9px] px-1.5 py-0.2 rounded font-semibold bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300"
                            >
                              {b}
                            </span>
                          ))}
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

              {isLoadingMore && (
                <div className="px-3 py-2 flex items-center justify-center gap-1.5 text-muted-foreground text-[11px]">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Loading more...
                </div>
              )}

              {filteredCustomers.length === 0 && !showAddOption && (
                <div className="px-3 py-4 text-center text-muted-foreground text-xs flex items-center justify-center gap-1.5">
                  {isLoading ? (<><Loader2 className="w-3.5 h-3.5 animate-spin text-primary" /> Searching AR customers...</>) : "No matching AR customers found."}
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

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-foreground">Brand <span className="text-red-500">*</span></Label>
                <select value={createForm.brand} onChange={(e) => setCreateForm({ ...createForm, brand: e.target.value })} className="h-8 w-full rounded-md border border-input bg-background px-2.5 text-xs">
                  {availableBrands.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-foreground">Phone Number</Label>
                <Input placeholder="+1 (555) 000-0000" value={createForm.phone_numbers} onChange={(e) => setCreateForm({ ...createForm, phone_numbers: e.target.value })} className="h-8 text-xs" />
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
