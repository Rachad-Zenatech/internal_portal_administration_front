import { useEffect, useState, type FormEvent } from "react";
import { Pencil, User, Landmark } from "lucide-react";
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
import { useUpdateBusinessContact } from "@/hooks/useBusinessContact";
import { PayeeBankingEditor } from "./PayeeBankingEditor";
import type { BusinessContactReference, BankingDetails } from "@/types/businessContact";

export function EditBusinessContactDialog({ contact }: { contact: BusinessContactReference }) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("general");
  const [form, setForm] = useState({
    display_name: contact.display_name,
    full_name: contact.full_name || "",
    email: contact.email || "",
    phone_numbers: contact.phone_numbers || "",
    bill_address: contact.bill_address || "",
    ship_address: contact.ship_address || "",
  });
  const [banking, setBanking] = useState<BankingDetails>(() => {
    return (
      contact.banking_details || {
        bank_country: "United States",
        bank_name: "",
        bank_account_number: "",
        routing_wire: "",
        routing_ach: "",
        swift_code: "",
      }
    );
  });
  const [error, setError] = useState<string | null>(null);
  const mutation = useUpdateBusinessContact();

  useEffect(() => {
    if (open) {
      setForm({
        display_name: contact.display_name,
        full_name: contact.full_name || "",
        email: contact.email || "",
        phone_numbers: contact.phone_numbers || "",
        bill_address: contact.bill_address || "",
        ship_address: contact.ship_address || "",
      });
      setBanking(
        contact.banking_details || {
          bank_country: "United States",
          bank_name: "",
          bank_account_number: "",
          routing_wire: "",
          routing_ach: "",
          swift_code: "",
        }
      );
    }
  }, [contact, open]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      const hasBanking = Object.entries(banking).some(
        ([k, v]) => k !== "bank_country" && typeof v === "string" && v.trim().length > 0
      ) || Boolean(banking.bank_name?.trim());

      await mutation.mutateAsync({
        id: contact.id,
        payload: {
          display_name: form.display_name.trim(),
          full_name: form.full_name.trim() || null,
          email: form.email.trim() || null,
          phone_numbers: form.phone_numbers.trim() || null,
          bill_address: form.bill_address.trim() || null,
          ship_address: form.ship_address.trim() || null,
          banking_details: hasBanking ? banking : null,
        },
      });
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update contact.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
          aria-label={`Edit ${contact.display_name}`}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[96vw] max-w-[96vw] sm:max-w-[760px] max-h-[90vh] overflow-y-auto p-6 rounded-2xl">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              Edit {contact.contact_type === "customer" ? "A/R Customer" : "A/P Payee"}: {contact.display_name}
            </DialogTitle>
            <DialogDescription>
              The accounting side remains {contact.account_number} {contact.account_name}.
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
                  <Label className="text-xs font-semibold">
                    Business / Vendor Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    required
                    value={form.display_name}
                    onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Contact Person</Label>
                  <Input
                    value={form.full_name}
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Email</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs font-semibold">Phone</Label>
                  <Input
                    value={form.phone_numbers}
                    onChange={(e) => setForm({ ...form, phone_numbers: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Billing Address</Label>
                  <Textarea
                    rows={3}
                    value={form.bill_address}
                    onChange={(e) => setForm({ ...form, bill_address: e.target.value })}
                    className="text-xs resize-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Shipping Address</Label>
                  <Textarea
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
              {mutation.isPending ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
