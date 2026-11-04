import { Landmark, Globe } from "lucide-react";
import { Badge } from "../../../../components/ui/badge";
import { Card, CardHeader, CardContent } from "../../../../components/ui/card";
import type { WorkflowDetailViewState } from "../hooks/useWorkflowDetailTail";

export function BeneficiaryBankSettlementAccount({ v }: { v: WorkflowDetailViewState }) {
  const { bankingDetails } = v;
  return (
    <Card className="shadow-xs border-slate-200 dark:border-zinc-800">
            <CardHeader className="bg-emerald-50/40 dark:bg-emerald-950/20 border-b border-slate-100 dark:border-zinc-800 px-6 py-3.5 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200 font-semibold text-base">
                <Landmark className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Beneficiary Bank Settlement Account</span>
              </div>
              <Badge variant="outline" className="text-xs bg-white dark:bg-zinc-900 border-emerald-200 text-emerald-700">
                A/R Settlement Account
              </Badge>
            </CardHeader>
            <CardContent className="p-5">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 text-xs">
                <div className="space-y-1">
                  <span className="text-muted-foreground font-medium text-xs block">Bank Name</span>
                  <span className="font-bold text-slate-900 dark:text-zinc-100 text-xs block break-words">
                    {bankingDetails.bank_name}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-muted-foreground font-medium text-xs block">Bank Account #</span>
                  <span className="font-semibold font-mono text-slate-900 dark:text-zinc-100 text-xs block break-words">
                    {bankingDetails.bank_account_number && bankingDetails.bank_account_number !== "—"
                      ? bankingDetails.bank_account_number.trim().length > 4
                        ? `•••• •••• ${bankingDetails.bank_account_number.trim().slice(-4)}`
                        : bankingDetails.bank_account_number
                      : "—"}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-muted-foreground font-medium text-xs block flex items-center gap-1">
                    <Globe className="w-3 h-3 text-emerald-500" />
                    Bank Country
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-zinc-100 text-xs block break-words">
                    {bankingDetails.bank_country}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-muted-foreground font-medium text-xs block">Routing (Wire / ABA)</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-zinc-100 text-xs block break-words">
                    {bankingDetails.routing_wire}
                  </span>
                </div>

                {bankingDetails.routing_ach !== "—" && (
                  <div className="space-y-1">
                    <span className="text-muted-foreground font-medium text-xs block">Routing (ACH)</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-zinc-100 text-xs block break-words">
                      {bankingDetails.routing_ach}
                    </span>
                  </div>
                )}

                {bankingDetails.swift_code !== "—" && (
                  <div className="space-y-1">
                    <span className="text-muted-foreground font-medium text-xs block">SWIFT / BIC Code</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-zinc-100 text-xs block break-words">
                      {bankingDetails.swift_code}
                    </span>
                  </div>
                )}

                {bankingDetails.iban !== "—" && (
                  <div className="space-y-1">
                    <span className="text-muted-foreground font-medium text-xs block">IBAN</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-zinc-100 text-xs block break-words">
                      {bankingDetails.iban}
                    </span>
                  </div>
                )}

                {bankingDetails.transit_code_ca !== "—" && (
                  <div className="space-y-1">
                    <span className="text-muted-foreground font-medium text-xs block">Transit Code (CA)</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-zinc-100 text-xs block break-words">
                      {bankingDetails.transit_code_ca}
                    </span>
                  </div>
                )}

                {bankingDetails.institution_code !== "—" && (
                  <div className="space-y-1">
                    <span className="text-muted-foreground font-medium text-xs block">Institution Code (CA)</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-zinc-100 text-xs block break-words">
                      {bankingDetails.institution_code}
                    </span>
                  </div>
                )}

                {bankingDetails.region !== "—" && (
                  <div className="space-y-1">
                    <span className="text-muted-foreground font-medium text-xs block">Region / State / Province</span>
                    <span className="font-semibold text-slate-900 dark:text-zinc-100 text-xs block break-words">
                      {bankingDetails.region}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
  );
}
