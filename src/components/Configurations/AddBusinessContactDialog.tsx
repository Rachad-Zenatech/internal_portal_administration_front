import { useState, type FormEvent } from "react";
import { Plus, User, Landmark } from "lucide-react";

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
import { useCreateBusinessContact } from "@/hooks/useBusinessContact";
import { PayeeBankingEditor } from "./PayeeBankingEditor";
import type { BankingDetails } from "@/types/businessContact";

const emptyForm = {
  display_name: "",
  full_name: "",
  email: "",
  phone_numbers: "",
  bill_address: "",
  ship_address: "",
};

export function AddBusinessContactDialog({ accountSide }: { accountSide: "ar" | "ap" }) {
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
  const mutation = useCreateBusinessContact();
  const isAr = accountSide === "ar";

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
        <Button size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          {isAr ? "New A/R Customer" : "New A/P Payee"}
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
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor={`${accountSide}-display-name`} className="text-xs font-semibold">
                    Business / Vendor Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id={`${accountSide}-display-name`}
                    required
                    placeholder="e.g. Acme Corp"
                    value={form.display_name}
                    onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                    className="h-9 text-xs"
                  />
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
