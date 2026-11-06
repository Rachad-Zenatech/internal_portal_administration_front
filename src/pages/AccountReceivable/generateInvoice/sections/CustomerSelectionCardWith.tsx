import { Edit3, Loader2, Sparkles, User } from "lucide-react";
import { Button } from "../../../../components/ui/button";
import { Badge } from "../../../../components/ui/badge";
import { ARCustomerAutocomplete } from "../../fields/ARCustomerAutocomplete";
import type { GenerateInvoiceState } from "../hooks/useGenerateInvoice";

export function CustomerSelectionCardWith({ s }: { s: GenerateInvoiceState }) {
  const { handleSelectCustomerOption, customerSearch, selectedCustomer, templateLoadedToast, isTemplateLoading, billToName, handleOpenQuickEdit } = s;
  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-card border border-border shadow-sm space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <span>Select Accounts Receivable (A/R) Customer</span>
                  {selectedCustomer && (
                    <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-normal text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800">
                      Active
                    </Badge>
                  )}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Select an existing customer to automatically populate their profile, PO#, and default billing information.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Quick Edit Customer Button */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleOpenQuickEdit}
                disabled={!selectedCustomer && !customerSearch && !billToName}
                className="text-xs gap-1.5 h-8 border-blue-200 dark:border-blue-900 bg-blue-50/60 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Quick Edit Customer</span>
              </Button>

              {isTemplateLoading ? (
                <Badge
                  variant="outline"
                  className="text-[11px] bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-300 flex items-center gap-1.5"
                >
                  <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
                  <span>Loading template...</span>
                </Badge>
              ) : templateLoadedToast ? (
                <Badge
                  variant="outline"
                  className="text-[11px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-300 flex items-center gap-1.5"
                >
                  <Sparkles className="w-3 h-3 text-emerald-500" />
                  <span>{templateLoadedToast}</span>
                </Badge>
              ) : null}
            </div>
          </div>

          <div className="pt-1">
            <ARCustomerAutocomplete
              customerId={selectedCustomer?.id || ""}
              customerName={selectedCustomer?.name || customerSearch}
              onSelect={handleSelectCustomerOption}
              className="w-full"
            />
          </div>
        </div>
  );
}
