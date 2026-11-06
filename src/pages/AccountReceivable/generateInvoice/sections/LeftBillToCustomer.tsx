import { Building2, Receipt } from "lucide-react";
import { Input } from "../../../../components/ui/input";
import { Textarea } from "../../../../components/ui/textarea";
import type { GenerateInvoiceState } from "../hooks/useGenerateInvoice";

export function LeftBillToCustomer({ s }: { s: GenerateInvoiceState }) {
  const { isFieldVisible, setFromAddress, fromAddress, renderFieldHeader, setFromEmail, fromEmail, setFromPhone, fromPhone, setFromCompany, fromCompany, setBillToAddress, billToAddress, setBillToEmail, billToEmail, setBillToPhone, billToPhone, setBillToName, billToName } = s;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Left: Bill To (Customer Details) */}
            <div className="p-4 sm:p-5 rounded-xl bg-slate-50 dark:bg-zinc-900/60 border border-border/80 space-y-3.5">
              <div className="flex items-center gap-2 pb-1 border-b border-border">
                <Receipt className="w-4 h-4 text-blue-600" />
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Bill To (Customer Information)
                </h4>
              </div>

              <div className="space-y-1.5">
                {renderFieldHeader("Customer / Recipient Name", "bill_to_name")}
                <Input
                  id="bill_to_name"
                  name="bill_to_name"
                  type="text"
                  value={billToName}
                  onChange={(e) => setBillToName(e.target.value)}
                  placeholder="e.g. 4 Directions / ST Jay Associates, Inc."
                  className={`text-xs bg-card ${!isFieldVisible("bill_to_name") ? "opacity-60 bg-muted/40" : ""}`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  {renderFieldHeader("Phone Number", "bill_to_phone")}
                  <Input
                    id="bill_to_phone"
                    name="bill_to_phone"
                    type="text"
                    value={billToPhone}
                    onChange={(e) => setBillToPhone(e.target.value)}
                    placeholder="e.g. +1 (555) 019-2834"
                    className={`text-xs bg-card ${!isFieldVisible("bill_to_phone") ? "opacity-60 bg-muted/40" : ""}`}
                  />
                </div>
                <div className="space-y-1.5">
                  {renderFieldHeader("Email Address", "bill_to_email")}
                  <Input
                    id="bill_to_email"
                    name="bill_to_email"
                    type="email"
                    value={billToEmail}
                    onChange={(e) => setBillToEmail(e.target.value)}
                    placeholder="e.g. billing@client.com"
                    className={`text-xs bg-card ${!isFieldVisible("bill_to_email") ? "opacity-60 bg-muted/40" : ""}`}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                {renderFieldHeader("Billing Address", "bill_to_address")}
                <Textarea
                  id="bill_to_address"
                  name="bill_to_address"
                  rows={2}
                  value={billToAddress}
                  onChange={(e) => setBillToAddress(e.target.value)}
                  placeholder="e.g. Four Directions&#10;PO Box 10908&#10;Scottsdale, AZ 85271"
                  className={`text-xs bg-card resize-none ${!isFieldVisible("bill_to_address") ? "opacity-60 bg-muted/40" : ""}`}
                />
              </div>
            </div>

            {/* Right: From (Issuer Details) */}
            <div className="p-4 sm:p-5 rounded-xl bg-slate-50 dark:bg-zinc-900/60 border border-border/80 space-y-3.5">
              <div className="flex items-center gap-2 pb-1 border-b border-border">
                <Building2 className="w-4 h-4 text-blue-600" />
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  From (Issuer Information)
                </h4>
              </div>

              <div className="space-y-1.5">
                {renderFieldHeader("Company Name", "from_company")}
                <Input
                  id="from_company"
                  name="from_company"
                  type="text"
                  value={fromCompany}
                  onChange={(e) => setFromCompany(e.target.value)}
                  placeholder="e.g. Pace Plus Inc. / interlinkONE"
                  className={`text-xs bg-card font-semibold ${!isFieldVisible("from_company") ? "opacity-60 bg-muted/40" : ""}`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  {renderFieldHeader("Company Phone", "from_phone")}
                  <Input
                    id="from_phone"
                    name="from_phone"
                    type="text"
                    value={fromPhone}
                    onChange={(e) => setFromPhone(e.target.value)}
                    placeholder="e.g. (312) 614-1288 | ext 1098"
                    className={`text-xs bg-card ${!isFieldVisible("from_phone") ? "opacity-60 bg-muted/40" : ""}`}
                  />
                </div>
                <div className="space-y-1.5">
                  {renderFieldHeader("Company Email", "from_email")}
                  <Input
                    id="from_email"
                    name="from_email"
                    type="email"
                    value={fromEmail}
                    onChange={(e) => setFromEmail(e.target.value)}
                    placeholder="e.g. Accounting@paceplus.com"
                    className={`text-xs bg-card ${!isFieldVisible("from_email") ? "opacity-60 bg-muted/40" : ""}`}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                {renderFieldHeader("Company Address", "from_address")}
                <Input
                  id="from_address"
                  name="from_address"
                  type="text"
                  value={fromAddress}
                  onChange={(e) => setFromAddress(e.target.value)}
                  placeholder="e.g. 602B W 5th Ave, Naperville, IL 60563 USA"
                  className={`text-xs bg-card ${!isFieldVisible("from_address") ? "opacity-60 bg-muted/40" : ""}`}
                />
              </div>
            </div>
          </div>
  );
}
