import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FileText,
  Plus,
  Search,
  Building2,
  DollarSign,
  Calendar,
  Trash2,
  Users,
  CheckCircle2,
  Receipt,
  Eye,
  TrendingUp,
  RefreshCw,
  Mail,
  Phone,
  MapPin,
  Layers,
  Send,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Badge } from "../../components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import {
  arInvoiceService,
} from "../../services/arInvoiceService";
import type { GeneratedInvoiceSummary } from "../../services/arInvoiceService";

export default function AccountReceivablePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"invoices" | "customers">("invoices");
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Send Email Dialog State
  const [isSendEmailModalOpen, setIsSendEmailModalOpen] = useState(false);
  const [selectedInvoiceForEmail, setSelectedInvoiceForEmail] = useState<GeneratedInvoiceSummary | null>(null);
  const [emailSender, setEmailSender] = useState("test-invoices@zenatech.com");
  const [emailRecipient, setEmailRecipient] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailCustomMessage, setEmailCustomMessage] = useState("");
  const [emailSuccessMsg, setEmailSuccessMsg] = useState<string | null>(null);

  // Queries
  const {
    data: invoices = [],
    isLoading: isInvoicesLoading,
    refetch: refetchInvoices,
    isRefetching: isRefetchingInvoices,
  } = useQuery({
    queryKey: ["ar-invoices"],
    queryFn: () => arInvoiceService.listInvoices(),
  });

  const {
    data: customers = [],
  } = useQuery({
    queryKey: ["ar-customers"],
    queryFn: () => arInvoiceService.getCustomers(),
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => arInvoiceService.deleteInvoice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ar-invoices"] });
      setDeleteConfirmId(null);
    },
  });

  // Send Email Mutation
  const sendEmailMutation = useMutation({
    mutationFn: async () => {
      if (!selectedInvoiceForEmail) throw new Error("No invoice selected");
      return arInvoiceService.sendInvoiceEmail(selectedInvoiceForEmail.id, {
        from_email: emailSender.trim() || "test-invoices@zenatech.com",
        to_email: emailRecipient.trim(),
        subject: emailSubject.trim(),
        custom_message: emailCustomMessage.trim(),
      });
    },
    onSuccess: (res) => {
      setIsSendEmailModalOpen(false);
      setEmailSuccessMsg(res.message);
      setTimeout(() => setEmailSuccessMsg(null), 5000);
    },
  });

  const handleOpenSendEmail = (inv: GeneratedInvoiceSummary) => {
    setSelectedInvoiceForEmail(inv);
    setEmailSender("test-invoices@zenatech.com");
    const cust = customers.find((c) => c.id === inv.customer_id || c.id === `CUST-${inv.customer_id}`);
    setEmailRecipient(cust?.email || "");
    setEmailSubject(`Invoice ${inv.invoice_number} from ZenaTech Inc.`);
    setEmailCustomMessage("");
    setIsSendEmailModalOpen(true);
  };

  // Filter Invoices
  const filteredInvoices = invoices.filter((inv) => {
    const q = searchTerm.toLowerCase();
    return (
      inv.invoice_number.toLowerCase().includes(q) ||
      inv.customer_name.toLowerCase().includes(q) ||
      (inv.po_number && inv.po_number.toLowerCase().includes(q))
    );
  });

  // Filter Customers
  const filteredCustomers = customers.filter((cust) => {
    const q = searchTerm.toLowerCase();
    return (
      cust.name.toLowerCase().includes(q) ||
      cust.id.toLowerCase().includes(q) ||
      (cust.email && cust.email.toLowerCase().includes(q)) ||
      (cust.contact_person && cust.contact_person.toLowerCase().includes(q))
    );
  });

  // Aggregate Metrics
  const totalInvoicedAmount = invoices.reduce(
    (sum, inv) => sum + (Number(inv.total_amount) || Number(inv.subtotal) || 0),
    0
  );
  const totalInvoicesCount = invoices.length;
  const customersWithTemplatesCount = customers.filter(
    (c) => c.has_template || localStorage.getItem(`ar_template_${c.id}`)
  ).length;

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950 p-4 sm:p-6 lg:p-8">
      <div className="w-full space-y-6">
        {/* Email Success Notification */}
        {emailSuccessMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{emailSuccessMsg}</span>
          </div>
        )}

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 dark:bg-blue-950/70 border border-blue-200/60 dark:border-blue-800/60 rounded-xl text-blue-600 dark:text-blue-400">
                <Receipt className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Account Receivable
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  Manage customer quote estimates, invoice templates, auto-formatting, and generated billing statements.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchInvoices()}
              disabled={isRefetchingInvoices}
              className="gap-2 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <RefreshCw
                className={`w-4 h-4 text-slate-500 ${
                  isRefetchingInvoices ? "animate-spin" : ""
                }`}
              />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white shadow-md shadow-blue-500/20 font-medium px-5 py-2.5 rounded-xl transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Generate</span>
                  <ChevronDown className="w-3.5 h-3.5 opacity-80" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xl">
                <DropdownMenuItem
                  onClick={() => navigate("/account-receivable/generate-quote")}
                  className="flex items-start gap-2.5 p-2.5 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-800 focus:bg-slate-50 dark:focus:bg-zinc-800"
                >
                  <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-zinc-100">
                      Generate Quote
                    </div>
                    <div className="text-[10.5px] text-slate-500 dark:text-zinc-400 mt-0.5">
                      Create customer estimate &amp; quote
                    </div>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => navigate("/account-receivable/generate")}
                  className="flex items-start gap-2.5 p-2.5 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-800 focus:bg-slate-50 dark:focus:bg-zinc-800"
                >
                  <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-zinc-100">
                      Generate Invoice
                    </div>
                    <div className="text-[10.5px] text-slate-500 dark:text-zinc-400 mt-0.5">
                      Create billing invoice statement
                    </div>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Metrics Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Total Invoices
              </span>
              <div className="p-2 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-lg">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {totalInvoicesCount}
              </span>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center">
                <TrendingUp className="w-3 h-3 mr-0.5" /> Active
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Total Receivables
              </span>
              <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-lg">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                $
                {totalInvoicedAmount.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                A/R Customers
              </span>
              <div className="p-2 bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 rounded-lg">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {customers.length}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Registered profiles
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Saved Templates
              </span>
              <div className="p-2 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-lg">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {customersWithTemplatesCount}
              </span>
              <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                Auto-fill ready
              </span>
            </div>
          </div>
        </div>

        {/* Content Tabs & Controls */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            {/* Tabs */}
            <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl max-w-fit">
              <button
                onClick={() => setActiveTab("invoices")}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === "invoices"
                    ? "bg-white dark:bg-slate-750 text-blue-600 dark:text-blue-400 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Generated Invoices ({invoices.length})</span>
              </button>
              <button
                onClick={() => setActiveTab("customers")}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === "customers"
                    ? "bg-white dark:bg-slate-750 text-blue-600 dark:text-blue-400 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>A/R Customers & Templates ({customers.length})</span>
              </button>
            </div>

            {/* Search Box */}
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                type="text"
                placeholder={
                  activeTab === "invoices"
                    ? "Search invoice #, customer, P/O..."
                    : "Search customer name, ID, contact..."
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 text-xs h-9 bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>

          {/* TAB 1: Generated Invoices Table */}
          {activeTab === "invoices" && (
            <div className="overflow-x-auto">
              {isInvoicesLoading ? (
                <div className="p-12 text-center text-sm text-slate-500 flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                  <span>Loading generated invoices...</span>
                </div>
              ) : filteredInvoices.length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center justify-center">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-3">
                    <Receipt className="w-7 h-7" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                    No Generated Invoices Found
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1 mb-5">
                    {searchTerm
                      ? "No invoices match your search filter."
                      : "Create your first customer invoice using the custom template generator."}
                  </p>
                  <Button
                    onClick={() => navigate("/account-receivable/generate")}
                    className="gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Generate New Invoice</span>
                  </Button>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      <th className="py-3.5 px-4 sm:px-6">Invoice #</th>
                      <th className="py-3.5 px-4">Customer</th>
                      <th className="py-3.5 px-4">Issue Date</th>
                      <th className="py-3.5 px-4">P/O No.</th>
                      <th className="py-3.5 px-4 text-right">Amount</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                      <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
                    {filteredInvoices.map((inv) => (
                      <tr
                        key={inv.id}
                        className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors group cursor-pointer"
                        onClick={() =>
                          navigate(
                            `/account-receivable/generate?invoiceId=${encodeURIComponent(
                              inv.id
                            )}`
                          )
                        }
                      >
                        <td className="py-3.5 px-4 sm:px-6 font-semibold text-blue-600 dark:text-blue-400">
                          <div className="flex items-center gap-2">
                            <FileText className="w-3.5 h-3.5 text-slate-400" />
                            <span className="group-hover:underline">{inv.invoice_number}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-white">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            <span>{inv.customer_name}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>{inv.invoice_date || "—"}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-300">
                          {inv.po_number || "—"}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-slate-900 dark:text-white">
                          $
                          {(Number(inv.total_amount) || Number(inv.subtotal) || 0).toLocaleString(
                            "en-US",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <Badge
                            variant="secondary"
                            className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 text-[10px] font-semibold uppercase tracking-wider"
                          >
                            <CheckCircle2 className="w-2.5 h-2.5 mr-1" />
                            {inv.status || "Generated"}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 sm:px-6 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenSendEmail(inv)}
                              className="h-8 px-2.5 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 border-indigo-200 dark:border-indigo-900 cursor-pointer"
                              title="Send invoice statement via SendGrid email"
                            >
                              <Mail className="w-3.5 h-3.5 mr-1 text-indigo-600 dark:text-indigo-400" />
                              <span>Send Email</span>
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                navigate(
                                  `/account-receivable/generate?invoiceId=${encodeURIComponent(
                                    inv.id
                                  )}`
                                )
                              }
                              className="h-8 px-2.5 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/60 border-blue-200 dark:border-blue-900 cursor-pointer"
                              title="View / Edit this Generated Invoice"
                            >
                              <Eye className="w-3.5 h-3.5 mr-1" />
                              <span>View / Edit</span>
                            </Button>
                            {deleteConfirmId === inv.id ? (
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => deleteMutation.mutate(inv.id)}
                                  disabled={deleteMutation.isPending}
                                  className="h-7 px-2 text-[11px]"
                                >
                                  Confirm
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setDeleteConfirmId(null)}
                                  className="h-7 px-2 text-[11px]"
                                >
                                  Cancel
                                </Button>
                              </div>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteConfirmId(inv.id)}
                                className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg"
                                title="Delete Invoice"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* TAB 2: A/R Customers & Quick Launch */}
          {activeTab === "customers" && (
            <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCustomers.map((cust) => {
                const hasSaved =
                  cust.has_template || !!localStorage.getItem(`ar_template_${cust.id}`);
                return (
                  <div
                    key={cust.id}
                    className="p-5 bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700 flex flex-col justify-between hover:border-blue-300 dark:hover:border-blue-700 transition-all hover:shadow-sm group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <Badge
                            variant="outline"
                            className="text-[10px] font-mono text-slate-500 mb-1"
                          >
                            {cust.id}
                          </Badge>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                            {cust.name}
                          </h4>
                        </div>
                        {hasSaved ? (
                          <Badge className="bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 text-[10px] whitespace-nowrap">
                            <CheckCircle2 className="w-2.5 h-2.5 mr-1" />
                            Template Saved
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="text-[10px] text-slate-500 whitespace-nowrap"
                          >
                            Default
                          </Badge>
                        )}
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                        {cust.contact_person && (
                          <div className="flex items-center gap-2">
                            <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{cust.contact_person}</span>
                          </div>
                        )}
                        {cust.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{cust.email}</span>
                          </div>
                        )}
                        {cust.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{cust.phone}</span>
                          </div>
                        )}
                        {cust.billing_address && (
                          <div className="flex items-start gap-2">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                            <span className="line-clamp-2">{cust.billing_address}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            className="w-full gap-2 bg-slate-900 dark:bg-blue-600 hover:bg-blue-700 text-white text-xs h-9 rounded-xl shadow-xs transition-all cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Generate</span>
                            <ChevronDown className="w-3.5 h-3.5 opacity-70 ml-auto" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52 p-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xl">
                          <DropdownMenuItem
                            onClick={() =>
                              navigate(
                                `/account-receivable/generate-quote?customerId=${encodeURIComponent(
                                  cust.id
                                )}`
                              )
                            }
                            className="flex items-center gap-2 p-2 text-xs rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-800 focus:bg-slate-50 dark:focus:bg-zinc-800"
                          >
                            <FileText className="w-3.5 h-3.5 text-amber-600" />
                            <span>Generate Quote</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              navigate(
                                `/account-receivable/generate?customerId=${encodeURIComponent(
                                  cust.id
                                )}`
                              )
                            }
                            className="flex items-center gap-2 p-2 text-xs rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-800 focus:bg-slate-50 dark:focus:bg-zinc-800"
                          >
                            <Receipt className="w-3.5 h-3.5 text-blue-600" />
                            <span>Generate Invoice</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Send Invoice Statement Email Dialog ── */}
      <Dialog open={isSendEmailModalOpen} onOpenChange={setIsSendEmailModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
              <Mail className="w-5 h-5 text-indigo-600" />
              <span>Send Invoice Statement via SendGrid</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Send invoice {selectedInvoiceForEmail?.invoice_number} directly to the customer using role-based email.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>Sender Role-Based Email <span className="text-red-500">*</span></span>
                <span className="text-[10px] text-muted-foreground font-normal">Role Mailer Address</span>
              </Label>
              <Input
                type="email"
                value={emailSender}
                onChange={(e) => setEmailSender(e.target.value)}
                placeholder="test-invoices@zenatech.com"
                className="text-xs font-mono"
              />
              <p className="text-[11px] text-muted-foreground">
                Default: <code className="bg-muted px-1 py-0.5 rounded text-foreground">test-invoices@zenatech.com</code>
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Recipient Email (To) <span className="text-red-500">*</span>
              </Label>
              <Input
                type="email"
                value={emailRecipient}
                onChange={(e) => setEmailRecipient(e.target.value)}
                placeholder="customer-billing@client.com"
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Subject Line
              </Label>
              <Input
                type="text"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Invoice Statement from ZenaTech Inc."
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Optional Message / Notes
              </Label>
              <Textarea
                rows={3}
                value={emailCustomMessage}
                onChange={(e) => setEmailCustomMessage(e.target.value)}
                placeholder="Add a custom note or payment instructions to include in the email body..."
                className="text-xs resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsSendEmailModalOpen(false)}
              className="text-xs cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => sendEmailMutation.mutate()}
              disabled={sendEmailMutation.isPending || !emailRecipient.trim() || !emailSender.trim()}
              className="text-xs gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold cursor-pointer"
            >
              {sendEmailMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>Send Email</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
