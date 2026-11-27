import { useEffect, useState } from "react";
import { Building2, Loader2 } from "lucide-react";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Label } from "../../../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../../../components/ui/dialog";
import type { HubSpotCompanyItem } from "../../../../services/oauthService";

interface Props {
  company: HubSpotCompanyItem | null;
  brands: Array<{ brand: string; count: number }>;
  isSaving: boolean;
  onClose: () => void;
  onSave: (hubspotId: string, payload: {
    name: string;
    brand: string;
    contact_name: string;
    billing_email: string;
    phone: string;
    address: string;
    domain: string;
    industry: string;
    currency: string;
  }) => Promise<void>;
}

export function ARCompanyEditDialog({ company, brands, isSaving, onClose, onSave }: Props) {
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [contactName, setContactName] = useState("");
  const [billingEmail, setBillingEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [domain, setDomain] = useState("");
  const [industry, setIndustry] = useState("");
  const [currency, setCurrency] = useState("USD");

  useEffect(() => {
    if (!company) return;
    setName(company.name || "");
    const firstBrand = (company.brand || "").split(",")[0]?.trim() || "";
    setBrand(firstBrand);
    setContactName(company.contact_name || "");
    setBillingEmail(company.billing_email || company.contact_email || "");
    setPhone(company.phone || company.contact_phone || "");
    setAddress(company.address || "");
    setDomain(company.domain || "");
    setIndustry(company.industry || "");
    setCurrency(company.currency || "USD");
  }, [company]);

  const brandOptions = Array.from(new Set([...(brand ? [brand] : []), ...brands.map((b) => b.brand).filter(Boolean)]));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company || !name.trim()) return;
    await onSave(company.hubspot_id, {
      name: name.trim(),
      brand: brand.trim(),
      contact_name: contactName.trim(),
      billing_email: billingEmail.trim(),
      phone: phone.trim(),
      address: address.trim(),
      domain: domain.trim(),
      industry: industry.trim(),
      currency: currency.trim() || "USD",
    });
  };

  return (
    <Dialog open={!!company} onOpenChange={(open) => { if (!open && !isSaving) onClose(); }}>
      <DialogContent className="sm:max-w-lg w-[94vw] p-6">
        <DialogHeader>
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <Building2 className="w-4 h-4 text-orange-600" />
            <span>Edit A/R Company</span>
          </DialogTitle>
          <DialogDescription className="text-xs">
            Update company billing details and brand for <strong className="font-mono">{company?.hubspot_id}</strong>.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 text-xs pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold">Company Name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required className="h-8 text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold">Brand</Label>
              <Select value={brand} onValueChange={setBrand}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select brand..." /></SelectTrigger>
                <SelectContent>
                  {brandOptions.map((b) => <SelectItem key={b} value={b} className="text-xs">{b}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold">Contact Name</Label>
              <Input value={contactName} onChange={(e) => setContactName(e.target.value)} className="h-8 text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold">Billing Email</Label>
              <Input type="email" value={billingEmail} onChange={(e) => setBillingEmail(e.target.value)} className="h-8 text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold">Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="h-8 text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold">Domain</Label>
              <Input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="example.com" className="h-8 text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold">Industry</Label>
              <Input value={industry} onChange={(e) => setIndustry(e.target.value)} className="h-8 text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold">Currency</Label>
              <Input value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} maxLength={6} className="h-8 text-xs font-mono" />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-[11px] font-semibold">Billing Address</Label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} className="h-8 text-xs" />
          </div>
          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSaving} className="text-xs rounded-xl">Cancel</Button>
            <Button type="submit" size="sm" disabled={isSaving || !name.trim()} className="text-xs rounded-xl bg-orange-600 hover:bg-orange-700 text-white gap-1.5 cursor-pointer">
              {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isSaving ? "Saving..." : "Save Changes"}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
