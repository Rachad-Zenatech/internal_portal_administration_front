import { CreditCard } from "lucide-react";
import { Input } from "../../../../components/ui/input";
import { Textarea } from "../../../../components/ui/textarea";
import type { GenerateInvoiceState } from "../hooks/useGenerateInvoice";

export function Notes({ s }: { s: GenerateInvoiceState }) {
  const { isFieldVisible, setWireRouting, wireRouting, renderFieldHeader, setAchRouting, achRouting, setBankAddress, bankAddress, setBankAccount, bankAccount, setBankName, bankName, setNotes, notes } = s;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Notes */}
            <div className="space-y-2">
              {renderFieldHeader("Invoice Notes / Greeting", "notes")}
              <Textarea
                id="notes"
                name="notes"
                rows={5}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. We appreciate your business!"
                className={`text-xs resize-none ${!isFieldVisible("notes") ? "opacity-60 bg-muted/40" : ""}`}
              />
            </div>

            {/* Banking Details */}
            <div className="p-4 sm:p-5 rounded-xl bg-slate-50 dark:bg-zinc-900/60 border border-border/80 space-y-3">
              <div className="flex items-center gap-2 pb-1 border-b border-border">
                <CreditCard className="w-4 h-4 text-blue-600" />
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Payment / Remittance Information
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  {renderFieldHeader("Bank Name", "bank_name")}
                  <Input
                    id="bank_name"
                    name="bank_name"
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g. Bank of America"
                    className={`text-xs bg-card ${!isFieldVisible("bank_name") ? "opacity-60 bg-muted/40" : ""}`}
                  />
                </div>

                <div className="space-y-1.5">
                  {renderFieldHeader("Account Number", "bank_account")}
                  <Input
                    id="bank_account"
                    name="bank_account"
                    type="text"
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value)}
                    placeholder="e.g. 2910 2819 7458"
                    className={`text-xs font-mono bg-card ${!isFieldVisible("bank_account") ? "opacity-60 bg-muted/40" : ""}`}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                {renderFieldHeader("Bank Address / Branch", "bank_address")}
                <Input
                  id="bank_address"
                  name="bank_address"
                  type="text"
                  value={bankAddress}
                  onChange={(e) => setBankAddress(e.target.value)}
                  placeholder="e.g. 896 N Route 59, Aurora, IL 60504"
                  className={`text-xs bg-card ${!isFieldVisible("bank_address") ? "opacity-60 bg-muted/40" : ""}`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  {renderFieldHeader("ACH Routing Number", "ach_routing")}
                  <Input
                    id="ach_routing"
                    name="ach_routing"
                    type="text"
                    value={achRouting}
                    onChange={(e) => setAchRouting(e.target.value)}
                    placeholder="e.g. 026009593"
                    className={`text-xs font-mono bg-card ${!isFieldVisible("ach_routing") ? "opacity-60 bg-muted/40" : ""}`}
                  />
                </div>
                <div className="space-y-1.5">
                  {renderFieldHeader("Wire Routing Number", "wire_routing")}
                  <Input
                    id="wire_routing"
                    name="wire_routing"
                    type="text"
                    value={wireRouting}
                    onChange={(e) => setWireRouting(e.target.value)}
                    placeholder="e.g. 026009593"
                    className={`text-xs font-mono bg-card ${!isFieldVisible("wire_routing") ? "opacity-60 bg-muted/40" : ""}`}
                  />
                </div>
              </div>
            </div>
          </div>
  );
}
