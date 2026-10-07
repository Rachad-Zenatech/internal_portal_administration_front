import React from "react";
import {
  Layers,
  Sparkles,
  CheckCircle2,
  Clock,
  CornerDownRight,
  Info,
  Edit3,
} from "lucide-react";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import type {
  InvoiceHierarchyResponse,
  AddonHierarchyChildRow,
} from "../../services/arInvoiceService";

interface InvoiceHierarchyItemsTableProps {
  hierarchy: InvoiceHierarchyResponse;
  onOpenAddModal?: () => void;
  onOpenOverrideModal?: (addon: AddonHierarchyChildRow) => void;
  isEditable?: boolean;
}

export const InvoiceHierarchyItemsTable: React.FC<InvoiceHierarchyItemsTableProps> = ({
  hierarchy,
  onOpenAddModal,
  onOpenOverrideModal,
  isEditable = true,
}) => {
  const { invoice, hierarchy_tree, totals, next_renewal } = hierarchy;
  const { parent_row, child_rows } = hierarchy_tree;

  return (
    <div className="space-y-6">
      {/* Supplemental Reference Banner if Viewing Supplemental Invoice */}
      {invoice.is_supplemental && invoice.parent_invoice_number && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              This is a <strong>Supplemental Invoice ({invoice.invoice_number})</strong> for prorated additions to parent invoice{" "}
              <strong>{invoice.parent_invoice_number}</strong>.
            </span>
          </div>
          <Badge className="bg-amber-600 text-white text-[10px]">Supplemental</Badge>
        </div>
      )}

      {/* Main Hierarchical Items Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Subscription &amp; Service Line Items
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Parent contracted subscription with indented prorated additions and recurring add-ons.
              </p>
            </div>
          </div>

          {isEditable && onOpenAddModal && (
            <Button
              size="sm"
              onClick={onOpenAddModal}
              className="gap-2 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs cursor-pointer font-semibold"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Add Seats / Add-ons</span>
            </Button>
          )}
        </div>

        {/* Tree Table Layout */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {/* 1. PARENT SUBSCRIPTION ROW */}
          <div
            className={`p-4 sm:p-5 transition-colors ${
              parent_row.is_reference_only
                ? "bg-slate-50/70 dark:bg-slate-800/30"
                : "bg-indigo-50/30 dark:bg-indigo-950/20"
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {parent_row.title}
                  </span>
                  <Badge variant="outline" className="text-[10px] font-semibold border-indigo-200 text-indigo-700 dark:text-indigo-300">
                    {parent_row.service_name}
                  </Badge>
                  {parent_row.is_reference_only && (
                    <Badge className="bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200 text-[9px] uppercase font-bold tracking-wider">
                      Previously Invoiced — Reference Only
                    </Badge>
                  )}
                </div>

                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 flex-wrap">
                  <span>{parent_row.subtitle}</span>
                  <span>•</span>
                  <span className="font-mono text-[11px] text-slate-600 dark:text-slate-300">
                    {parent_row.invoice_badge}
                  </span>
                </div>
              </div>

              <div className="text-left sm:text-right">
                <div
                  className={`text-base font-bold font-mono ${
                    parent_row.is_reference_only
                      ? "text-slate-400 line-through"
                      : "text-slate-900 dark:text-white"
                  }`}
                >
                  ${Number(parent_row.charge_amount).toFixed(2)} {invoice.currency}
                </div>
                {parent_row.is_reference_only ? (
                  <div className="text-[10px] font-semibold text-slate-400 italic">
                    Reference only (Not billed here)
                  </div>
                ) : (
                  <div className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                    Primary Service Charge
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 2. INDENTED CHILD ROWS */}
          {child_rows.length === 0 ? (
            <div className="p-4 sm:p-5 pl-8 sm:pl-10 text-xs text-slate-400 italic">
              No add-ons or additional seats added to this subscription yet.
            </div>
          ) : (
            child_rows.map((child, idx) => {
              const isCurrent = child.is_current_invoice;
              return (
                <div
                  key={child.id || idx}
                  className={`p-4 sm:p-5 pl-7 sm:pl-10 relative transition-colors ${
                    isCurrent
                      ? "bg-white dark:bg-slate-900 hover:bg-slate-50/60 dark:hover:bg-slate-800/40"
                      : "bg-slate-50/40 dark:bg-slate-800/20 opacity-85"
                  }`}
                >
                  {/* Subtle Vertical Connector */}
                  <div className="absolute left-4 sm:left-5 top-0 bottom-0 w-0.5 bg-indigo-200 dark:bg-indigo-900" />
                  <div className="absolute left-4 sm:left-5 top-6 w-3 h-0.5 bg-indigo-300 dark:bg-indigo-800" />

                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1.5 max-w-2xl">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CornerDownRight className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">
                          {child.title}
                        </span>

                        <Badge
                          className={`text-[10px] px-1.5 py-0 ${
                            child.badge === "Prorated"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                              : "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                          }`}
                        >
                          {child.badge}
                        </Badge>

                        {child.is_manual_override && (
                          <Badge variant="outline" className="text-[10px] bg-purple-50 text-purple-700 border-purple-200">
                            Manual Override
                          </Badge>
                        )}

                        {child.is_reference_only && (
                          <Badge className="bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300 text-[9px]">
                            Reference only (Billed elsewhere)
                          </Badge>
                        )}
                      </div>

                      {/* Supporting Details */}
                      <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 space-y-0.5 pl-5">
                        <div>{child.date_range}</div>
                        <div className="font-mono text-slate-600 dark:text-slate-300">
                          {child.calculation}
                        </div>
                        <div className="text-indigo-600 dark:text-indigo-400 font-medium">
                          {child.full_recurring_label}
                        </div>
                        {child.is_manual_override && child.override_reason && (
                          <div className="text-purple-600 dark:text-purple-400 italic">
                            Override reason: {child.override_reason}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right-Aligned Charge Amount & Actions */}
                    <div className="text-left sm:text-right pl-5 sm:pl-0 space-y-1">
                      <div className="text-xs text-slate-400 font-semibold uppercase">
                        {isCurrent ? "Charge Due" : "Billed Previously"}
                      </div>
                      <div
                        className={`text-base font-extrabold font-mono ${
                          isCurrent
                            ? "text-indigo-600 dark:text-indigo-400"
                            : "text-slate-400"
                        }`}
                      >
                        ${Number(child.charge).toFixed(2)} {invoice.currency}
                      </div>

                      {isEditable && onOpenOverrideModal && isCurrent && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onOpenOverrideModal(child)}
                          className="h-6 px-2 text-[10px] text-slate-500 hover:text-indigo-600 gap-1 rounded-md"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Override</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 3. SUMMARY & TOTALS BLOCK */}
        <div className="p-4 sm:p-6 bg-slate-50/80 dark:bg-slate-900/90 border-t border-slate-200/80 dark:border-slate-800">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            {/* Left: Explanation */}
            <div className="space-y-1.5 max-w-sm text-xs text-slate-500 dark:text-slate-400">
              <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Payable Charges Separation</span>
              </div>
              <p>
                Only charges belonging directly to this invoice (
                <strong>{invoice.invoice_number}</strong>) are included in the balance due.
                Previously invoiced subscription baselines remain for audit reference only.
              </p>
            </div>

            {/* Right: Calculated Totals */}
            <div className="w-full md:w-80 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>New Charges Subtotal:</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">
                  ${Number(totals.new_charges_subtotal).toFixed(2)} {invoice.currency}
                </span>
              </div>

              {totals.reference_charges_subtotal > 0 && (
                <div className="flex justify-between text-slate-400 italic">
                  <span>Previously Invoiced (Reference):</span>
                  <span className="font-mono">
                    ${Number(totals.reference_charges_subtotal).toFixed(2)}
                  </span>
                </div>
              )}

              {totals.discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Applicable Discounts:</span>
                  <span className="font-mono font-semibold">
                    -${Number(totals.discount).toFixed(2)}
                  </span>
                </div>
              )}

              {totals.tax > 0 && (
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Estimated Tax:</span>
                  <span className="font-mono font-semibold">
                    +${Number(totals.tax).toFixed(2)}
                  </span>
                </div>
              )}

              {totals.amount_paid > 0 && (
                <div className="flex justify-between text-blue-600">
                  <span>Payments Applied:</span>
                  <span className="font-mono font-semibold">
                    -${Number(totals.amount_paid).toFixed(2)}
                  </span>
                </div>
              )}

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between items-baseline">
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  Amount Due on this Invoice:
                </span>
                <span className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">
                  ${Number(totals.amount_due).toFixed(2)} {invoice.currency}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. NEXT RENEWAL — NOT DUE NOW SECTION */}
      {next_renewal && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-50 to-blue-50/40 dark:from-slate-900 dark:to-blue-950/20 border border-blue-200/80 dark:border-blue-900/40 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600 shrink-0" />
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                Next Renewal — Not Due Now
              </h4>
            </div>
            <Badge variant="outline" className="text-[10px] bg-white dark:bg-slate-900 text-blue-700 border-blue-200">
              Future Projection
            </Badge>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-300">
            <div>
              <p>{next_renewal.summary_text}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Calculated using full contracted recurring rates without historical proration.
              </p>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-base font-bold text-slate-900 dark:text-white font-mono">
                ${Number(next_renewal.total_renewal_amount).toFixed(2)} {next_renewal.currency}
              </span>
              <div className="text-[10px] text-slate-400">
                {next_renewal.frequency_label}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
