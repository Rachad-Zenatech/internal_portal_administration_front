import { useState, useMemo, type FormEvent } from "react";
import { Plus, User, Landmark, Building, Check, ChevronsUpDown, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBusinessContacts, useCreateBusinessContact } from "@/hooks/useBusinessContact";
import { useKnownVendors } from "@/hooks/usePurchasing";
import { PayeeBankingEditor } from "./PayeeBankingEditor";
import type { BankingDetails, BusinessContactReference } from "@/types/businessContact";

const emptyForm = {
  display_name: "",
  full_name: "",
  email: "",
  phone_numbers: "",
  bill_address: "",
  ship_address: "",
};

interface AddBusinessContactDialogProps {
  accountSide: "ar" | "ap";
  triggerLabel?: string;
  triggerClassName?: string;
  onSuccess?: () => void;
}

export function AddBusinessContactDialog({
  accountSide,
  triggerLabel,
  triggerClassName,
  onSuccess,
}: AddBusinessContactDialogProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("general");
  const [form, setForm] = useState(emptyForm);
  const [banking, setBanking] = useState<BankingDetails>({
    bank_country: "United States",
    bank_name: "",
    bank_account_number: "",
    routing_wire: "",
    routing_ach: "",
    swift_code: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [vendorDropdownOpen, setVendorDropdownOpen] = useState(false);
  const mutation = useCreateBusinessContact();
  const isAr = accountSide === "ar";

  const { data: contactsData, isLoading: isLoadingContacts } = useBusinessContacts(undefined, isAr ? "ar" : "ap");
  const { data: knownVendors = [] } = useKnownVendors();

  const existingContacts = useMemo<BusinessContactReference[]>(() => {
    return contactsData?.items || [];
  }, [contactsData]);

  // Combined options: existing contacts + known vendors
  const autocompleteOptions = useMemo(() => {
    const map = new Map<string, BusinessContactReference | null>();
    existingContacts.forEach((c) => {
      if (c.display_name?.trim()) {
        map.set(c.display_name.trim().toLowerCase(), c);
      }
    });
    if (!isAr) {
      knownVendors.forEach((v) => {
        if (v && v.trim() && !map.has(v.trim().toLowerCase())) {
          map.set(v.trim().toLowerCase(), null);
        }
      });
    }
    return map;
  }, [existingContacts, knownVendors, isAr]);

  const filteredVendorOptions = useMemo(() => {
    const q = (form.display_name || "").trim().toLowerCase();
    const list: Array<{ name: string; contact: BusinessContactReference | null }> = [];
    autocompleteOptions.forEach((contact, key) => {
      const displayName = contact?.display_name || key;
      if (!q || displayName.toLowerCase().includes(q)) {
        list.push({ name: contact?.display_name || displayName, contact });
      }
    });
    return list.slice(0, 50);
  }, [autocompleteOptions, form.display_name]);

  const selectExistingContact = (name: string, contact: BusinessContactReference | null) => {
    if (contact) {
      setForm((prev) => ({
        ...prev,
        display_name: contact.display_name || name,
        full_name: contact.full_name || prev.full_name,
        email: contact.email || prev.email,
        phone_numbers: contact.phone_numbers || prev.phone_numbers,
        bill_address: contact.bill_address || prev.bill_address,
        ship_address: contact.ship_address || prev.ship_address,
      }));
      if (contact.banking_details && Object.keys(contact.banking_details).length > 0) {
        setBanking((prev) => ({
          ...prev,
          ...(contact.banking_details as any),
        }));
      }
    } else {
      setForm((prev) => ({ ...prev, display_name: name }));
    }
    setVendorDropdownOpen(false);
  };

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      const hasBanking = Object.entries(banking).some(
        ([k, v]) => k !== "bank_country" && typeof v === "string" && v.trim().length > 0
      ) || Boolean(banking.bank_name?.trim());

      await mutation.mutateAsync({
        account_side: accountSide,
        contact_type: isAr ? "customer" : "vendor",
        display_name: form.display_name.trim(),
        full_name: form.full_name.trim() || null,
        email: form.email.trim() || null,
        phone_numbers: form.phone_numbers.trim() || null,
        bill_address: form.bill_address.trim() || null,
        ship_address: form.ship_address.trim() || null,
        banking_details: hasBanking ? banking : null,
      });
      setForm(emptyForm);
      setBanking({
        bank_country: "United States",
        bank_name: "",
        bank_account_number: "",
        routing_wire: "",
        routing_ach: "",
        swift_code: "",
      });
      setOpen(false);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create business contact.");
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        if (!value) {
          setError(null);
          setActiveTab("general");
        }
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" className={triggerClassName || "gap-1.5"}>
          <Plus className="h-4 w-4" />
          {triggerLabel || (isAr ? "New A/R Customer" : "New A/P Payee")}
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[96vw] max-w-[96vw] sm:max-w-[760px] max-h-[90vh] overflow-y-auto p-6 rounded-2xl">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              {isAr ? "New A/R Customer" : "New A/P Payee"}
            </DialogTitle>
            <DialogDescription>
              This contact will be assigned to {isAr ? "1100 Accounts Receivable" : "2000 Accounts Payable"}.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
            <TabsList className="grid grid-cols-2 w-full max-w-sm">
              <TabsTrigger value="general" className="text-xs gap-1.5 font-semibold">
                <User className="h-3.5 w-3.5" />
                General Details
              </TabsTrigger>
              <TabsTrigger value="banking" className="text-xs gap-1.5 font-semibold">
                <Landmark className="h-3.5 w-3.5 text-indigo-600" />
                Banking & Clearing
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4 pt-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2 relative">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={`${accountSide}-display-name`} className="text-xs font-semibold flex items-center gap-1.5">
                      <Building className="h-3.5 w-3.5 text-slate-400" />
                      <span>Business / Vendor Name <span className="text-red-500">*</span></span>
                    </Label>
                    <span className="text-[10px] text-slate-400">Search existing or type new vendor</span>
                  </div>
                  <div className="relative">
                    <Input
                      id={`${accountSide}-display-name`}
                      required
                      placeholder="e.g. Acme Corp (search or enter new vendor)"
                      value={form.display_name}
                      autoComplete="off"
                      onChange={(e) => {
                        setForm({ ...form, display_name: e.target.value });
                        setVendorDropdownOpen(true);
                      }}
                      onFocus={() => setVendorDropdownOpen(true)}
                      className="h-9 text-xs pr-8"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setVendorDropdownOpen(!vendorDropdownOpen)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
                    >
                      <ChevronsUpDown className="h-3.5 w-3.5 opacity-60" />
                    </button>
                  </div>

                  {vendorDropdownOpen && (
                    <div
                      data-radix-scroll-lock-ignore=""
                      onMouseDown={(e) => e.preventDefault()}
                      className="absolute z-50 left-0 right-0 top-full mt-1 max-h-56 overflow-y-auto overscroll-contain bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg shadow-xl py-1 text-xs"
                      style={{ scrollbarWidth: "thin" }}
                    >
                      {filteredVendorOptions.map((opt) => {
                        const isSelected =
                          form.display_name.trim().toLowerCase() === opt.name.toLowerCase();
                        return (
                          <button
                            key={opt.name}
                            type="button"
                            className={`w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 dark:hover:bg-zinc-800 flex items-center justify-between transition-colors ${
                              isSelected ? "font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50/40 dark:bg-indigo-950/20" : "text-slate-700 dark:text-zinc-300"
                            }`}
                            onClick={() => selectExistingContact(opt.name, opt.contact)}
                          >
                            <div className="truncate">
                              <span className="font-medium text-slate-800 dark:text-zinc-200">{opt.name}</span>
                              {opt.contact?.email && (
                                <span className="text-[10px] text-muted-foreground ml-2">({opt.contact.email})</span>
                              )}
                            </div>
                            {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0 ml-2" />}
                          </button>
                        );
                      })}

                      {filteredVendorOptions.length === 0 && !form.display_name.trim() && (
                        <div className="px-3 py-2 text-slate-400 text-center text-xs">
                          {isLoadingContacts ? (
                            <span className="flex items-center justify-center gap-1.5">
                              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading contacts...
                            </span>
                          ) : (
                            "No contacts found. Type a name to enter one."
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Contact Person</Label>
                  <Input
                    placeholder="e.g. John Doe"
                    value={form.full_name}
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Email</Label>
                  <Input
                    type="email"
                    placeholder="vendor@example.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs font-semibold">Phone</Label>
                  <Input
                    placeholder="+1 (555) 000-0000"
                    value={form.phone_numbers}
                    onChange={(e) => setForm({ ...form, phone_numbers: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Billing Address</Label>
                  <Textarea
                    placeholder="Street, City, State, ZIP"
                    rows={3}
                    value={form.bill_address}
                    onChange={(e) => setForm({ ...form, bill_address: e.target.value })}
                    className="text-xs resize-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Shipping Address</Label>
                  <Textarea
                    placeholder="Street, City, State, ZIP"
                    rows={3}
                    value={form.ship_address}
                    onChange={(e) => setForm({ ...form, ship_address: e.target.value })}
                    className="text-xs resize-none"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="banking" className="pt-4">
              <PayeeBankingEditor banking={banking} onChange={setBanking} />
            </TabsContent>
          </Tabs>

          {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending || !form.display_name.trim()}>
              {mutation.isPending ? "Adding..." : "Add contact"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
