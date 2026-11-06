import { ArrowLeft, CheckCircle2, ChevronDown, CreditCard, Eye, FileSpreadsheet, Loader2, Mail, MoreHorizontal, Palette, Printer, Save, Sparkles, Trash2 } from "lucide-react";
import { Button } from "../../../../components/ui/button";
import { Badge } from "../../../../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "../../../../components/ui/dropdown-menu";
import type { InvoiceLayoutStyle } from "../types";
import type { GenerateInvoiceState } from "../hooks/useGenerateInvoice";

export function TopHeaderActionsClean({ s }: { s: GenerateInvoiceState }) {
  const { handleOpenSendEmail, currentInvoiceId, generateRenewalQuoteMutation, invoiceAmountPaid, calculatedTotals, generateInvoiceMutation, handleGenerateInvoice, deleteInvoiceMutation, handleDeleteInvoice, handleOpenRecordPayment, saveTemplateMutation, billToName, selectedCustomer, handleOpenApplyTemplateDialog, handlePrint, handlePreviewAndScroll, handleSelectInvoiceTemplate, layoutStyle, invoiceStatus, invoiceNumber, navigate, formTopRef } = s;
  return (
    <div
        ref={formTopRef}
        className="bg-card border border-border/80 px-4 py-3 rounded-2xl shadow-xs flex flex-wrap lg:flex-nowrap items-center justify-between gap-3 print:hidden w-full"
      >
        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/account-receivable")}
            className="text-xs gap-1.5 h-8 px-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </Button>

          <div className="h-4 w-px bg-border shrink-0" />

          {currentInvoiceId ? (
            <Badge
              variant="outline"
              className="text-xs px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800 gap-1.5 font-medium"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Editing {invoiceNumber} {invoiceStatus ? `(${invoiceStatus})` : ""}</span>
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="text-xs px-2.5 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 gap-1.5 font-medium"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Invoice Generator</span>
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
          {/* Quick Template Switcher in Header */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-muted/60 border border-border/80">
            <Palette className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span className="text-[11px] font-medium text-muted-foreground shrink-0 hidden sm:inline">Template:</span>
            <Select
              value={layoutStyle === "modern" ? "pace_plus" : layoutStyle === "classic" ? "interlinkone" : layoutStyle}
              onValueChange={(val) => {
                handleSelectInvoiceTemplate(val as InvoiceLayoutStyle);
              }}
            >
              <SelectTrigger className="h-6 text-xs min-w-[125px] border-0 bg-transparent focus:ring-0 shadow-none px-1 font-semibold cursor-pointer text-foreground">
                <SelectValue placeholder="Select Template" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pace_plus" className="text-xs font-medium cursor-pointer">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#1B365D] inline-block" />
                    <span>Pace+</span>
                  </div>
                </SelectItem>
                <SelectItem value="interlinkone" className="text-xs font-medium cursor-pointer">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#008080] inline-block" />
                    <span>interlinkONE</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Preview PDF */}
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviewAndScroll}
            className="text-xs gap-1.5 h-8 px-3 bg-card hover:bg-muted text-foreground cursor-pointer shadow-2xs"
            title="Preview PDF layout"
          >
            <Eye className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Preview PDF</span>
          </Button>

          {/* More Actions Dropdown (Print, Apply to Template, Delete) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="text-xs gap-1 h-8 px-2.5 bg-card hover:bg-muted text-foreground cursor-pointer shadow-2xs"
                title="More actions & options"
              >
                <MoreHorizontal className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                <span className="hidden sm:inline">More</span>
                <ChevronDown className="w-3 h-3 text-muted-foreground opacity-70" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem
                onClick={handlePrint}
                className="text-xs gap-2 py-2 cursor-pointer font-medium"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                <span>Print / Save as PDF</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleOpenApplyTemplateDialog}
                disabled={saveTemplateMutation.isPending || (!selectedCustomer && !billToName)}
                className="text-xs gap-2 py-2 cursor-pointer font-medium text-blue-700 dark:text-blue-400"
              >
                {saveTemplateMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5 text-blue-600" />
                )}
                <span>{currentInvoiceId ? "Apply Changes to Template" : "Save Changes as Template"}</span>
              </DropdownMenuItem>

              {currentInvoiceId && calculatedTotals.effectiveBalanceDue > 0 && (
                <DropdownMenuItem
                  onClick={handleOpenRecordPayment}
                  className="text-xs gap-2 py-2 cursor-pointer font-medium text-emerald-700 dark:text-emerald-400"
                >
                  <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Record Payment</span>
                </DropdownMenuItem>
              )}

              {currentInvoiceId && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleDeleteInvoice}
                    disabled={deleteInvoiceMutation.isPending}
                    className="text-xs gap-2 py-2 cursor-pointer font-medium text-rose-600 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/40"
                  >
                    {deleteInvoiceMutation.isPending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    )}
                    <span>Delete Invoice</span>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Primary Action: Save / Generate Invoice */}
          <Button
            size="sm"
            onClick={handleGenerateInvoice}
            disabled={generateInvoiceMutation.isPending}
            className="text-xs gap-1.5 h-8 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs cursor-pointer"
          >
            {generateInvoiceMutation.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5" />
            )}
            <span>{currentInvoiceId ? "Save Invoice Changes" : "Generate Invoice"}</span>
          </Button>

          {/* Contextual Action: Generate Next Quotes (Renewal Quote) - only shown when invoice is settled/paid */}
          {currentInvoiceId && calculatedTotals.effectiveBalanceDue === 0 && Number(invoiceAmountPaid) > 0 && (
            <Button
              size="sm"
              onClick={() => generateRenewalQuoteMutation.mutate()}
              disabled={generateRenewalQuoteMutation.isPending}
              className="text-xs gap-1.5 h-8 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs cursor-pointer"
              title="Generate full-term renewal quote combining base products and accepted add-ons"
            >
              {generateRenewalQuoteMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              <span>Generate Next Quotes</span>
            </Button>
          )}

          {/* Send Email */}
          {currentInvoiceId && (
            <Button
              size="sm"
              onClick={handleOpenSendEmail}
              className="text-xs gap-1.5 h-8 px-3.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold shadow-xs cursor-pointer"
              title="Send invoice statement to client via SendGrid"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Send Email</span>
            </Button>
          )}
        </div>
      </div>
  );
}
