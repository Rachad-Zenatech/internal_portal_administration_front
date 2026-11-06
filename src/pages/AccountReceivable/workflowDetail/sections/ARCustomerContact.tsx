import { Building2, User, Mail, Phone, MapPin } from "lucide-react";
import { Badge } from "../../../../components/ui/badge";
import { Card, CardHeader, CardContent } from "../../../../components/ui/card";
import type { WorkflowDetailViewState } from "../hooks/useWorkflowDetailTail";

export function ARCustomerContact({ v }: { v: WorkflowDetailViewState }) {
  const { customerDetails, workflow } = v;
  return (
    <Card className="shadow-xs border-slate-200 dark:border-zinc-800">
            <CardHeader className="bg-blue-50/40 dark:bg-blue-950/20 border-b border-slate-100 dark:border-zinc-800 px-6 py-3.5 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2 text-blue-900 dark:text-blue-200 font-semibold text-base">
                <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span>A/R Customer Contact Details</span>
              </div>
              <Badge variant="outline" className="text-xs bg-white dark:bg-zinc-900 border-blue-200 text-blue-700">
                {workflow.customer_id}
              </Badge>
            </CardHeader>
            <CardContent className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div className="space-y-1">
                  <span className="text-muted-foreground font-medium text-xs block flex items-center gap-1">
                    <User className="w-3 h-3 text-blue-500" />
                    Primary Contact
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-zinc-100 text-xs block break-words">
                    {customerDetails.contact_person}
                  </span>
                  <span className="text-[11px] text-muted-foreground block truncate">
                    {customerDetails.name}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-muted-foreground font-medium text-xs block flex items-center gap-1">
                    <Mail className="w-3 h-3 text-blue-500" />
                    Email Address
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-zinc-100 text-xs block break-words">
                    {customerDetails.email}
                  </span>
                  <span className="text-[11px] text-muted-foreground block">
                    Direct Invoicing & Reminders
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-muted-foreground font-medium text-xs block flex items-center gap-1">
                    <Phone className="w-3 h-3 text-blue-500" />
                    Telephone
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-zinc-100 text-xs block break-words">
                    {customerDetails.phone}
                  </span>
                  <span className="text-[11px] text-muted-foreground block">
                    Finance & Collections
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-muted-foreground font-medium text-xs block flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-blue-500" />
                    Billing Address
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-zinc-100 text-xs block break-words">
                    {customerDetails.billing_address}
                  </span>
                  <span className="text-[11px] text-muted-foreground block">
                    Tax / VAT: {customerDetails.tax_id}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
  );
}
