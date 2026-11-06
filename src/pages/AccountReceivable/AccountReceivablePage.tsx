import { Building2, CheckCircle2, ChevronDown, ChevronRight, CreditCard, Eye, FileText, Loader2, Mail, PenTool, Plus, Receipt, RefreshCw, Sparkles, TrendingUp } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import { Textarea } from "../../components/ui/textarea";
import { Card, CardContent } from "../../components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "../../components/ui/tabs";
import HelpIcon from "../../components/ui/HelpIcon";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../../components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { SendQuoteModal } from "./modals/SendQuoteModal";
import type { ARTab } from "./accountReceivable/types";
import { useAccountReceivable } from "./accountReceivable/hooks/useAccountReceivable";
import { Tab1Overview } from "./accountReceivable/sections/Tab1Overview";
import { Tab2Quotes } from "./accountReceivable/sections/Tab2Quotes";
import { TabARCompanies } from "./accountReceivable/sections/TabARCompanies";
import { Tab4InvoicesGrouped } from "./accountReceivable/sections/Tab4InvoicesGrouped";
import { RecordInvoicePaymentDialog } from "./accountReceivable/sections/RecordInvoicePaymentDialog";

export default function AccountReceivablePage() {
  const s = useAccountReceivable();
  const { sendInvoiceEmailMutation, emailRecipient, setIsInvoiceEmailModalOpen, setEmailCustomMessage, emailCustomMessage, setEmailSubject, emailSubject, setEmailRecipient, selectedInvoiceForEmail, isInvoiceEmailModalOpen, setBannerSuccess, setQuoteToSend, quoteToSend, navigate, generateRenewalQuoteMutation, completedRecords, activeTab, handleOpenRecordInvoicePayment, awaitingPaymentInvoices, convertInvoiceMutation, toInvoiceQuotes, allHubspotCompaniesTotal, setActiveTab, invoices, pipelineStages, refetchInvoices, refetchQuotes, bannerSuccess } = s;
  return (
    <div className="w-full">
      <div className="w-full flex flex-col gap-3.5 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
        {/* Banner Alert */}
        {bannerSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{bannerSuccess}</span>
          </div>
        )}

        {/* Header & Global Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
                Accounts Receivable
              </h2>
              <HelpIcon text="Track every receivable from quote to cash: proposal quotes, customer signing, invoice dispatch and payment recording." />
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              End-to-end management of proposal quotes, customer link signing, invoice dispatch, and payment recording.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={() => {
                refetchQuotes();
                refetchInvoices();
              }}
              className="gap-2 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              <span>Refresh</span>
            </Button>

            {/* Generate Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="gap-2 font-medium shadow-sm bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 cursor-pointer">
                  <Plus className="w-4 h-4" />
                  <span>Generate</span>
                  <ChevronDown className="w-3.5 h-3.5 opacity-70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 text-xs">
                <DropdownMenuItem
                  onClick={() => navigate("/account-receivable/generate-quote")}
                  className="gap-2 cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-amber-600" />
                  <span>Generate Quote</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => navigate("/account-receivable/generate")}
                  className="gap-2 cursor-pointer"
                >
                  <Receipt className="w-4 h-4 text-indigo-600" />
                  <span>Generate Invoice</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Pipeline: Quote -> Signed -> Invoiced -> Awaiting Payment -> Paid (stages double as navigation) */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-3 animate-in fade-in duration-300">
          {pipelineStages.map((stage, idx) => {
            const Icon = stage.icon;
            const isSelected = activeTab === stage.tab;
            return (
              <Card
                key={stage.tab}
                role="button"
                tabIndex={0}
                onClick={() => setActiveTab(stage.tab)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setActiveTab(stage.tab);
                  }
                }}
                className={`group border border-l-4 transition-all cursor-pointer rounded-lg hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 ${
                  isSelected ? stage.active : `border-slate-200 dark:border-zinc-800 ${stage.card}`
                }`}
              >
                <CardContent className="p-2.5 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[11px] font-semibold text-slate-600 dark:text-zinc-300 block">
                      {idx + 1}. {stage.label}
                    </span>
                    <div className="text-lg sm:text-xl font-bold text-slate-900 dark:text-zinc-100 leading-tight mt-0.5">
                      {stage.value}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-zinc-400 mt-0.5 truncate">{stage.sub}</div>
                  </div>
                  <div className="flex flex-col items-end justify-between self-stretch shrink-0">
                    <div className={`p-1.5 rounded-md ${stage.iconBg}`}>
                      <Icon className={`h-4 w-4 ${stage.tint}`} />
                    </div>
                    <span className={`flex items-center text-[10px] font-semibold ${stage.tint} ${isSelected ? "opacity-100" : "opacity-70 group-hover:opacity-100"}`}>
                      {isSelected ? "Viewing" : "View"}
                      <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Collection progress across all invoices */}
        <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-zinc-400">
          <span className="whitespace-nowrap font-medium">
            Collection progress: {completedRecords.length} of {invoices.length} invoice{invoices.length === 1 ? "" : "s"} paid
          </span>
          <div className="flex-1 h-1.5 rounded-full bg-slate-200 dark:bg-zinc-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${invoices.length > 0 ? Math.min(100, Math.round((completedRecords.length / invoices.length) * 100)) : 0}%` }}
            />
          </div>
          <span className="font-mono">
            {invoices.length > 0 ? Math.min(100, Math.round((completedRecords.length / invoices.length) * 100)) : 0}%
          </span>
        </div>

        {/* Non-pipeline views */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ARTab)} className="gap-0">
          <TabsList className="h-auto p-1 gap-1 bg-slate-100 dark:bg-zinc-900">
            <TabsTrigger value="overview" className="gap-1.5 text-xs px-3 py-1.5 cursor-pointer">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="hubspot_companies" className="gap-1.5 text-xs px-3 py-1.5 cursor-pointer">
              <Building2 className="w-3.5 h-3.5 text-orange-500" />
              <span>A/R Companies</span>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 border-none font-bold">
                {allHubspotCompaniesTotal}
              </Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* TAB 1: OVERVIEW */}
        <Tab1Overview s={s} />

        {/* TAB 2: QUOTES */}
        <Tab2Quotes s={s} />

        {/* TAB 3: TO INVOICE */}
        {activeTab === "to_invoice" && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <PenTool className="w-4 h-4 text-amber-600" />
                    <span>Quotes Awaiting Invoice Generation</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    These quotes have been signed by the client and are ready for conversion into formal accounts receivable invoices.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 font-bold border-b border-slate-200/80">
                    <tr>
                      <th className="py-3 px-4">Quote #</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Signer Name</th>
                      <th className="py-3 px-4">Signed Date</th>
                      <th className="py-3 px-4 text-right">Amount</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {toInvoiceQuotes.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400">
                          No signed quotes currently pending invoice generation.
                        </td>
                      </tr>
                    ) : (
                      toInvoiceQuotes.map((q) => (
                        <tr
                          key={q.id}
                          onClick={() => navigate(`/account-receivable/quotes/${q.id}`)}
                          className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                        >
                          <td className="py-3 px-4 font-mono font-bold text-amber-700 dark:text-amber-400 hover:underline">
                            {q.quote_number}
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">{q.customer_name}</td>
                          <td className="py-3 px-4">{q.signer_name}</td>
                          <td className="py-3 px-4 text-slate-500 font-mono">
                            {q.signed_at ? new Date(q.signed_at).toLocaleString() : "—"}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold">
                            ${Number(q.total_amount).toFixed(2)} {q.currency}
                          </td>
                          <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/account-receivable/quotes/${q.id}`)}
                                className="h-7 text-xs gap-1 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                <span>Details</span>
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => convertInvoiceMutation.mutate(q.id)}
                                disabled={convertInvoiceMutation.isPending}
                                className="h-7 text-xs bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg shadow-xs cursor-pointer gap-1"
                              >
                                <Receipt className="w-3.5 h-3.5" />
                                <span>Create Invoice</span>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB: A/R COMPANIES & TEMPLATES */}
        <TabARCompanies s={s} />

        {/* TAB 4: INVOICES (Grouped by A/R Customer Accordion, Default Collapsed, Sorted by Due Date) */}
        <Tab4InvoicesGrouped s={s} />

        {/* TAB 5: AWAITING PAYMENT */}
        {activeTab === "awaiting_payment" && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 font-bold border-b border-slate-200/80">
                    <tr>
                      <th className="py-3 px-4">Invoice #</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Invoice Date</th>
                      <th className="py-3 px-4 text-right">Total Amount</th>
                      <th className="py-3 px-4 text-right">Balance Due</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {awaitingPaymentInvoices.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400">
                          No invoices currently awaiting payment.
                        </td>
                      </tr>
                    ) : (
                      awaitingPaymentInvoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-slate-50/70">
                          <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">{inv.invoice_number}</td>
                          <td className="py-3 px-4 font-semibold">{inv.customer_name}</td>
                          <td className="py-3 px-4 text-slate-500 font-mono">{inv.invoice_date}</td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                            ${Number(inv.total_amount).toFixed(2)} {inv.currency || "USD"}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold">
                            <span className={Number(inv.balance_due !== undefined ? inv.balance_due : (inv.total_amount - (inv.amount_paid || 0))) === 0 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}>
                              ${Number(inv.balance_due !== undefined ? inv.balance_due : (inv.total_amount - (inv.amount_paid || 0))).toFixed(2)} {inv.currency || "USD"}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Button
                              size="sm"
                              onClick={() => handleOpenRecordInvoicePayment(inv)}
                              className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs cursor-pointer gap-1"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>Record Payment</span>
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: COMPLETED */}
        {activeTab === "completed" && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 font-bold border-b border-slate-200/80">
                    <tr>
                      <th className="py-3 px-4">Invoice #</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Bill To / Contact</th>
                      <th className="py-3 px-4 text-right">Paid Amount</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {completedRecords.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400">
                          No completed &amp; fully paid invoices yet.
                        </td>
                      </tr>
                    ) : (
                      completedRecords.map((item) => (
                        <tr
                          key={item.id}
                          onClick={() => navigate(item.viewUrl)}
                          className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                        >
                          <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                            {item.number}
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">{item.customer_name}</td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{item.contact_person}</td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                            ${Number(item.paid_amount).toFixed(2)} {item.currency}
                          </td>
                          <td className="py-3 px-4">
                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-300 text-[10px]">
                              {item.status.toUpperCase().includes("PRORATED") ? "Paid (Prorated)" : "Completed & Paid"}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              {item.is_recurring && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => generateRenewalQuoteMutation.mutate(item.id)}
                                  disabled={generateRenewalQuoteMutation.isPending}
                                  className="h-7 text-xs gap-1 border-indigo-200 text-indigo-700 bg-indigo-50/70 hover:bg-indigo-100 dark:border-indigo-800 dark:text-indigo-300 dark:bg-indigo-950/40 cursor-pointer font-semibold"
                                  title="Generate full-term renewal quote consolidating base products and active add-ons"
                                >
                                  {generateRenewalQuoteMutation.isPending && (generateRenewalQuoteMutation.variables as any) === item.id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                                  ) : (
                                    <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                                  )}
                                  <span>Generate Next Quote</span>
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(item.viewUrl)}
                                className="h-7 text-xs gap-1 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                <span>Details</span>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Send Quote Modal */}
      {quoteToSend && (
        <SendQuoteModal
          quote={quoteToSend}
          isOpen={!!quoteToSend}
          onClose={() => setQuoteToSend(null)}
          onSentSuccess={(msg) => {
            setBannerSuccess(msg);
            setTimeout(() => setBannerSuccess(null), 5000);
          }}
        />
      )}

      {/* Send Invoice Email Modal */}
      <Dialog open={isInvoiceEmailModalOpen} onOpenChange={setIsInvoiceEmailModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-indigo-600" />
              <span>Send Invoice Statement</span>
            </DialogTitle>
            <DialogDescription>
              Email invoice statement <strong>{selectedInvoiceForEmail?.invoice_number}</strong> to customer.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label htmlFor="send-invoice-recipient-email" className="text-[11px] font-semibold">Recipient Email *</Label>
              <Input
                id="send-invoice-recipient-email"
                name="recipientEmail"
                type="email"
                value={emailRecipient}
                onChange={(e) => setEmailRecipient(e.target.value)}
                placeholder="client@example.com"
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="send-invoice-subject-line" className="text-[11px] font-semibold">Subject Line</Label>
              <Input
                id="send-invoice-subject-line"
                name="subjectLine"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="send-invoice-custom-message" className="text-[11px] font-semibold">Custom Message (Optional)</Label>
              <Textarea
                id="send-invoice-custom-message"
                name="customMessage"
                value={emailCustomMessage}
                onChange={(e) => setEmailCustomMessage(e.target.value)}
                rows={3}
                placeholder="Add special notes or payment reminder..."
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsInvoiceEmailModalOpen(false)}
              className="text-xs rounded-xl"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => sendInvoiceEmailMutation.mutate()}
              disabled={sendInvoiceEmailMutation.isPending || !emailRecipient.trim()}
              className="text-xs rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {sendInvoiceEmailMutation.isPending ? "Sending..." : "Send Invoice Email"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Record Invoice Payment Dialog (Centered modal dialog for invoices) */}
      <RecordInvoicePaymentDialog s={s} />

      {/* Add Seats / Add-ons Modal from AR list */}
    </div>
  );
}

export type { ARTab } from "./accountReceivable/types";
