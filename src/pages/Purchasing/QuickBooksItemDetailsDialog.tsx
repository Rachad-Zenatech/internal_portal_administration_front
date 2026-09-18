import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  History,
  X,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Copy,
  Layers,
  Paperclip,
  Calendar,
  Code2,
  Download,
  Check,
  Loader2,
  Zap,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Database,
  ArrowRight,
  Eye,
  CreditCard,
  Building2,
  Tag,
  ShieldCheck,
  Split,
} from "lucide-react";
import type { QuickBooksPreviewItem, QuickBooksPreviewPart } from "@/services/purchasingService";

interface QuickBooksItemDetailsDialogProps {
  item: QuickBooksPreviewItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSync?: (item: QuickBooksPreviewItem) => Promise<void> | void;
  isSyncing?: boolean;
  onDelete?: (item: QuickBooksPreviewItem) => Promise<void> | void;
  isDeleting?: boolean;
  isConnected?: boolean;
}

export function QuickBooksItemDetailsDialog({
  item,
  open,
  onOpenChange,
  onSync,
  isSyncing = false,
  isConnected = true,
}: QuickBooksItemDetailsDialogProps) {
  const [viewMode, setViewMode] = useState<"form" | "mapping" | "json">("form");
  const [copied, setCopied] = useState(false);
  const [categoryDetailsOpen, setCategoryDetailsOpen] = useState(true);
  const [topFieldsCollapsed, setTopFieldsCollapsed] = useState(false);

  if (!item) return null;

  const isReady = item.readiness === "READY" || item.readiness === "READY_WITH_NOTES";
  const isSynced = item.readiness === "ALREADY_SYNCED" || item.is_already_synced;
  const isError = item.readiness === "ERROR" || (item.validation_errors && item.validation_errors.length > 0);

  const formattedAmountNumber = item.amount?.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) || "0.00";

  // Derive split lines / parts
  const displayLines: QuickBooksPreviewPart[] = (item.parts && item.parts.length > 0)
    ? item.parts
    : (item.projected_payload?.Line && Array.isArray(item.projected_payload.Line) && item.projected_payload.Line.length > 0)
      ? item.projected_payload.Line.map((l: any, idx: number) => ({
          line_num: idx + 1,
          description: l.Description || item.product_name,
          amount: Number(l.Amount) || (item.amount / item.projected_payload.Line.length),
          formatted_amount: `$${(Number(l.Amount) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          category: l.AccountBasedExpenseLineDetail?.AccountRef?.name || item.expense_account_resolution?.name || item.category || "Expense",
          account_name: l.AccountBasedExpenseLineDetail?.AccountRef?.name || item.expense_account_resolution?.name,
          account_id: l.AccountBasedExpenseLineDetail?.AccountRef?.value,
          acct_num: item.expense_account_resolution?.acct_num,
          customer: item.department || "Internal",
        }))
      : [{
          line_num: 1,
          description: item.product_name || item.raw_payee,
          amount: item.amount,
          formatted_amount: formattedAmountNumber,
          category: item.expense_account_resolution?.name || item.category || "Expense",
          account_name: item.expense_account_resolution?.name,
          acct_num: item.expense_account_resolution?.acct_num,
          customer: item.department || "Internal",
        }];

  const isMultiPart = displayLines.length > 1;

  const handleCopyJson = () => {
    if (!item.projected_payload) return;
    navigator.clipboard.writeText(JSON.stringify(item.projected_payload, null, 2));
    setCopied(true);
    toast.success("QuickBooks JSON payload copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-[98vw] max-w-[1520px] sm:max-w-[98vw] md:max-w-[98vw] lg:max-w-[1520px] h-[95vh] max-h-[96vh] flex flex-col p-0 gap-0 overflow-hidden bg-[#f4f5f8] dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 border border-slate-300 dark:border-zinc-800 shadow-2xl rounded-lg font-sans z-50 text-xs"
      >
        <DialogDescription className="sr-only">
          QuickBooks Online Expense Form and Synchronization Details for Purchase Request #{item.request_id}
        </DialogDescription>

        {/* ========================================================================= */}
        {/* QuickBooks Online Top App Header */}
        {/* ========================================================================= */}
        <div className="bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 px-5 py-2.5 flex items-center justify-between shrink-0 select-none">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="p-1 rounded-full text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
              title="Transaction History / Audit"
            >
              <History className="h-4 w-4" />
            </button>
            <DialogTitle className="text-lg font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2 m-0 p-0">
              <span>Expense</span>
              {isSynced ? (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 flex items-center gap-1">
                  <Database className="h-3 w-3" />
                  <span>QBO #{item.existing_purchase_id || item.doc_number}</span>
                </span>
              ) : isError ? (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-700 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3 text-rose-600 dark:text-rose-400" />
                  <span>Validation Error</span>
                </span>
              ) : isReady ? (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                  <span>Staged for QBO</span>
                </span>
              ) : (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  <span>Requires Mapping</span>
                </span>
              )}
              {isMultiPart && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1">
                  <Split className="h-3 w-3 text-indigo-500" />
                  <span>{displayLines.length} Split Parts</span>
                </span>
              )}
            </DialogTitle>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-slate-100 dark:bg-zinc-800 p-0.5 rounded-md border border-slate-200 dark:border-zinc-700 text-[11px]">
              <button
                type="button"
                onClick={() => setViewMode("form")}
                className={`px-2.5 py-1 rounded font-medium transition-colors flex items-center gap-1.5 ${
                  viewMode === "form"
                    ? "bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-2xs font-semibold"
                    : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100"
                }`}
              >
                <Eye className="h-3.5 w-3.5 text-[#2ca01c]" />
                <span>QuickBooks Form</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("mapping")}
                className={`px-2.5 py-1 rounded font-medium transition-colors flex items-center gap-1.5 ${
                  viewMode === "mapping"
                    ? "bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-2xs font-semibold"
                    : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100"
                }`}
              >
                <Layers className="h-3.5 w-3.5 text-blue-600" />
                <span>GL &amp; Account Mapping</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("json")}
                className={`px-2.5 py-1 rounded font-medium transition-colors flex items-center gap-1.5 ${
                  viewMode === "json"
                    ? "bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-2xs font-semibold"
                    : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100"
                }`}
              >
                <Code2 className="h-3.5 w-3.5 text-purple-600" />
                <span>REST JSON</span>
              </button>
            </div>

            {/* Quick action tools */}
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-zinc-400">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 rounded hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors ml-1"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* Scrollable Body */}
        {/* ========================================================================= */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {viewMode === "form" && (
            <div className="space-y-4 max-w-[1460px] mx-auto">
              {/* TOP HERO & FORM FIELDS (White Card) */}
              <div className="bg-white dark:bg-zinc-900 rounded-md p-4 border border-slate-200 dark:border-zinc-800 shadow-2xs space-y-3">
                {/* Row 1: Payee + Payment Account + AMOUNT */}
                <div className="flex flex-wrap lg:flex-nowrap items-start justify-between gap-4">
                  {/* Left inputs */}
                  <div className="flex flex-wrap items-start gap-4 flex-1 min-w-0">
                    {/* Payee */}
                    <div className="w-full sm:w-[260px] space-y-1">
                      <label className="text-[11px] font-medium text-slate-600 dark:text-zinc-400 block">
                        Payee
                      </label>
                      <div className="flex items-center justify-between px-2.5 py-1.5 bg-white dark:bg-zinc-900 rounded border border-[#2ca01c] dark:border-emerald-600 text-xs font-medium text-slate-900 dark:text-white shadow-2xs h-8">
                        <span className="truncate">
                          {item.vendor_resolution?.name || item.raw_payee || "Who did you pay?"}
                        </span>
                        <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0 ml-1.5" />
                      </div>
                      {item.vendor_resolution?.id && (
                        <div className="text-[10px] text-slate-500 dark:text-zinc-400 font-mono truncate">
                          QBO Vendor ID: {item.vendor_resolution.id} {item.vendor_resolution.status ? `(${item.vendor_resolution.status})` : ""}
                        </div>
                      )}
                    </div>

                    {/* Payment account */}
                    <div className="w-full sm:w-[260px] space-y-1">
                      <label className="text-[11px] font-medium text-slate-600 dark:text-zinc-400 block">
                        Payment account
                      </label>
                      <div className="flex items-center justify-between px-2.5 py-1.5 bg-white dark:bg-zinc-900 rounded border border-slate-300 dark:border-zinc-700 text-xs font-medium text-slate-900 dark:text-white shadow-2xs h-8">
                        <span className="truncate">
                          {item.payment_account_resolution?.name || "Business Credit Card"}
                        </span>
                        <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0 ml-1.5" />
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium">
                        Balance <strong className="text-slate-800 dark:text-zinc-200">${formattedAmountNumber}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Amount on Right */}
                  <div className="text-right shrink-0 min-w-[160px]">
                    <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 dark:text-zinc-400">
                      AMOUNT
                    </div>
                    <div className="text-3xl font-extrabold text-slate-900 dark:text-white font-sans tracking-tight pt-0.5">
                      ${formattedAmountNumber}
                    </div>
                  </div>
                </div>

                {/* Row 2: Secondary Fields */}
                {!topFieldsCollapsed && (
                  <div className="flex flex-wrap items-start gap-4 pt-2 border-t border-slate-100 dark:border-zinc-800/80">
                    {/* Payment Date */}
                    <div className="w-full sm:w-[160px] space-y-1">
                      <label className="text-[11px] font-medium text-slate-600 dark:text-zinc-400 block">
                        Payment Date
                      </label>
                      <div className="flex items-center justify-between px-2.5 py-1.5 bg-white dark:bg-zinc-900 rounded border border-slate-300 dark:border-zinc-700 text-xs text-slate-900 dark:text-white shadow-2xs h-8">
                        <span>{item.payment_date || item.txn_date_api || "09/18/2026"}</span>
                        <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0 ml-1" />
                      </div>
                    </div>

                    {/* Payment Method */}
                    <div className="w-full sm:w-[160px] space-y-1">
                      <label className="text-[11px] font-medium text-slate-600 dark:text-zinc-400 block">
                        Payment Method
                      </label>
                      <div className="flex items-center justify-between px-2.5 py-1.5 bg-white dark:bg-zinc-900 rounded border border-slate-300 dark:border-zinc-700 text-xs text-slate-900 dark:text-white shadow-2xs h-8">
                        <span>{item.payment_method || "Credit Card"}</span>
                        <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0 ml-1" />
                      </div>
                    </div>

                    {/* Ref no. */}
                    <div className="w-full sm:w-[160px] space-y-1">
                      <label className="text-[11px] font-medium text-slate-600 dark:text-zinc-400 block">
                        Ref no.
                      </label>
                      <div className="px-2.5 py-1.5 bg-white dark:bg-zinc-900 rounded border border-slate-300 dark:border-zinc-700 text-xs text-slate-900 dark:text-white font-mono shadow-2xs h-8 flex items-center">
                        {item.doc_number || item.ref_no || `REQ-${item.request_id}`}
                      </div>
                    </div>
                  </div>
                )}

                {/* Centered Chevron Toggle */}
                <div className="flex justify-center -mb-2 pt-0.5">
                  <button
                    type="button"
                    onClick={() => setTopFieldsCollapsed(!topFieldsCollapsed)}
                    className="p-0.5 rounded text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                    title={topFieldsCollapsed ? "Expand form fields" : "Collapse form fields"}
                  >
                    {topFieldsCollapsed ? (
                      <ChevronDown className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronUp className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* ========================================================================= */}
              {/* SECTION: CATEGORY DETAILS (Multi-Line & Split Support) */}
              {/* ========================================================================= */}
              <div className="bg-white dark:bg-zinc-900 rounded-md border border-slate-200 dark:border-zinc-800 shadow-2xs overflow-hidden">
                <div className="px-4 py-2 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-white dark:bg-zinc-900">
                  <button
                    type="button"
                    onClick={() => setCategoryDetailsOpen(!categoryDetailsOpen)}
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white hover:text-slate-700"
                  >
                    {categoryDetailsOpen ? (
                      <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
                    ) : (
                      <ChevronUp className="h-3.5 w-3.5 text-slate-500" />
                    )}
                    <span>Category details {isMultiPart && `(${displayLines.length} Itemized Split Lines)`}</span>
                  </button>

                  <div className="flex items-center gap-2 text-slate-400">
                    <button type="button" className="hover:text-slate-700 dark:hover:text-zinc-200 p-0.5" title="Copy Table Lines">
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {categoryDetailsOpen && (
                  <div className="overflow-x-auto">
                    <table className="w-full table-fixed text-xs text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-900/60 text-[10px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                          <th className="w-9 py-1.5 px-2 text-center shrink-0">#</th>
                          <th className="py-1.5 px-2.5 w-[28%]">CATEGORY</th>
                          <th className="py-1.5 px-2.5 w-[42%]">DESCRIPTION</th>
                          <th className="py-1.5 px-2.5 w-28 text-right">AMOUNT</th>
                          <th className="py-1.5 px-2.5 w-16 text-center">BILLABLE</th>
                          <th className="py-1.5 px-2.5 w-32">CUSTOMER / DEPT</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-zinc-800">
                        {displayLines.map((line, idx) => {
                          const lineAmountStr = (line.amount !== undefined)
                            ? line.amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                            : formattedAmountNumber;
                          const lineCatName = line.account_name || line.category || item.expense_account_resolution?.name || item.category || "Expense";
                          const lineAcctNum = line.acct_num || item.expense_account_resolution?.acct_num;

                          return (
                            <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/50 transition-colors">
                              <td className="py-2 px-2 text-center text-slate-400">
                                <div className="flex items-center justify-center gap-0.5">
                                  <GripVertical className="h-3 w-3 text-slate-300 dark:text-zinc-600" />
                                  <span className="font-semibold text-slate-600 dark:text-zinc-400 text-[11px]">
                                    {line.line_num || idx + 1}
                                  </span>
                                </div>
                              </td>
                              <td className="py-2 px-2.5 min-w-0">
                                <div
                                  title={`${lineCatName} ${lineAcctNum ? `(${lineAcctNum})` : ''}`}
                                  className="flex items-center justify-between px-2.5 py-1 rounded border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-2xs h-7 min-w-0"
                                >
                                  <div className="truncate text-xs min-w-0">
                                    <span className="font-semibold text-slate-900 dark:text-white">
                                      {lineCatName}
                                    </span>
                                    {lineAcctNum && (
                                      <span className="text-[10px] text-muted-foreground ml-1 font-mono">
                                        ({lineAcctNum})
                                      </span>
                                    )}
                                  </div>
                                  <ChevronDown className="h-3 w-3 text-slate-400 ml-1 shrink-0" />
                                </div>
                              </td>
                              <td className="py-2 px-2.5 min-w-0">
                                <div
                                  title={line.description || item.product_name}
                                  className="px-2.5 py-1 rounded border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 truncate shadow-2xs text-xs h-7 flex items-center min-w-0 cursor-default"
                                >
                                  <span className="truncate">{line.description || item.product_name}</span>
                                </div>
                              </td>
                              <td className="py-2 px-2.5 text-right">
                                <div className="px-2.5 py-1 rounded border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-900 dark:text-white font-mono font-semibold text-right shadow-2xs text-xs h-7 flex items-center justify-end">
                                  {lineAmountStr}
                                </div>
                              </td>
                              <td className="py-2 px-2.5 text-center">
                                <input
                                  type="checkbox"
                                  readOnly
                                  className="rounded border-slate-300 text-[#2ca01c] focus:ring-[#2ca01c] h-3.5 w-3.5"
                                />
                              </td>
                              <td className="py-2 px-2.5 min-w-0">
                                <div
                                  title={line.customer || item.department || "Internal"}
                                  className="flex items-center justify-between px-2.5 py-1 rounded border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 shadow-2xs text-xs h-7 min-w-0"
                                >
                                  <span className="truncate">{line.customer || item.department || "General"}</span>
                                  <ChevronDown className="h-3 w-3 text-slate-400 ml-1 shrink-0" />
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>

                    {/* Category Details Bottom Total */}
                    <div className="p-3 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-slate-50/40 dark:bg-zinc-900/60">
                      <div className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium flex items-center gap-2">
                        <span>{displayLines.length} category {displayLines.length === 1 ? 'line' : 'lines'}</span>
                        {isMultiPart && (
                          <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                            Split Parts Preserved
                          </span>
                        )}
                      </div>

                      <div className="flex items-baseline gap-2 text-right">
                        <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Total</span>
                        <span className="text-xl font-bold text-slate-900 dark:text-white font-sans">
                          ${formattedAmountNumber}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ========================================================================= */}
              {/* SECTION: MEMO & ATTACHMENTS (QuickBooks Bottom Layout) */}
              {/* ========================================================================= */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-1">
                {/* Memo Box */}
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-600 dark:text-zinc-400 block">
                    Memo
                  </label>
                  <textarea
                    rows={3}
                    readOnly
                    value={item.memo || `${item.raw_payee} - ${item.product_name} - ${item.location || 'HQ'} - ${item.ref_no}${item.department ? ` - ${item.department}` : ''}`}
                    className="w-full p-2.5 rounded border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-slate-800 dark:text-zinc-200 focus:outline-hidden resize-none shadow-2xs font-mono leading-relaxed"
                  />
                </div>

                {/* Attachments Dropzone Box */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-medium text-slate-600 dark:text-zinc-400 block">
                      Attachments
                    </label>
                    <span className="text-[10px] text-slate-500 dark:text-zinc-400">
                      {item.attachments?.length || item.attachments_count || 0} file(s)
                    </span>
                  </div>

                  {item.attachments && item.attachments.length > 0 ? (
                    <div className="p-2 rounded border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 space-y-1.5 min-h-[80px]">
                      {item.attachments.map((att: any) => (
                        <div
                          key={att.id}
                          className="flex items-center justify-between p-1.5 rounded bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/60 text-xs"
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Paperclip className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span className="truncate font-medium text-slate-800 dark:text-zinc-200">
                              {att.filename}
                            </span>
                            {att.size_bytes && (
                              <span className="text-[10px] text-slate-500 font-mono">
                                ({(att.size_bytes / 1024).toFixed(1)} KB)
                              </span>
                            )}
                          </div>
                          <a
                            href={`/api/purchasing/requests/${item.request_id}/attachments/${att.id}/download`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-[#2ca01c] hover:underline font-medium shrink-0 ml-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Download className="h-3 w-3" />
                            <span>Download</span>
                          </a>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded border-2 border-dashed border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900/40 p-3 flex flex-col items-center justify-center text-center space-y-0.5 min-h-[80px]">
                      <Paperclip className="h-4 w-4 text-slate-400 mb-0.5" />
                      <div className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 cursor-pointer hover:underline">
                        Add attachment
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Max file size: 20 MB
                      </div>
                      <div className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                        Show existing
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: LIVE REST JSON PAYLOAD */}
          {/* ========================================================================= */}
          {viewMode === "json" && (
            <div className="space-y-3 max-w-[1460px] mx-auto">
              <div className="flex items-center justify-between bg-white dark:bg-zinc-900 p-3 rounded border border-slate-200 dark:border-zinc-800 shadow-2xs">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                    <Code2 className="h-3.5 w-3.5 text-purple-600" />
                    <span>QuickBooks Online REST API Purchase Payload</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                    Payload sent directly to <code className="font-mono text-purple-600 dark:text-purple-400 font-semibold">POST /v3/company/purchase</code>.
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyJson}
                  className="h-7 text-xs gap-1.5 font-semibold"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? "Copied!" : "Copy JSON"}</span>
                </Button>
              </div>

              <div className="rounded border border-zinc-800 bg-zinc-950 p-3 font-mono text-[11px] text-zinc-200 overflow-x-auto max-h-[580px] shadow-inner leading-relaxed">
                <pre>{JSON.stringify(item.projected_payload, null, 2)}</pre>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: GL ACCOUNT MAPPING & AUDIT BREAKDOWN */}
          {/* ========================================================================= */}
          {viewMode === "mapping" && (
            <div className="space-y-3 max-w-[1460px] mx-auto">
              <div className="rounded border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 space-y-0.5 shadow-2xs">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-blue-600" />
                  <span>Local Portal to QuickBooks Online Data Pipeline</span>
                </h4>
                <p className="text-slate-500 dark:text-zinc-400 text-[11px] leading-relaxed">
                  Every field from purchase request #{item.request_id} is dynamically matched against live QuickBooks Chart of Accounts, active Vendors, and Bank/Credit Card payment methods.
                </p>
              </div>

              {/* Table of Mappings */}
              <div className="rounded border border-slate-200 dark:border-zinc-800 divide-y divide-slate-200 dark:divide-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs overflow-hidden text-xs">
                <div className="p-2.5 grid grid-cols-12 items-center gap-3 bg-slate-50 dark:bg-zinc-800/60 font-semibold text-[10px] text-slate-600 dark:text-zinc-400 uppercase tracking-wider">
                  <div className="col-span-3">Target Field</div>
                  <div className="col-span-4">Source Value</div>
                  <div className="col-span-5">QuickBooks Target Ledger / ID</div>
                </div>

                {/* Payee / Vendor */}
                <div className="p-2.5 grid grid-cols-12 items-center gap-3">
                  <div className="col-span-3 font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                    <span>Vendor / Payee</span>
                  </div>
                  <div className="col-span-4 text-slate-600 dark:text-zinc-300 truncate" title={item.raw_payee}>
                    {item.raw_payee}
                  </div>
                  <div className="col-span-5 flex items-center gap-2">
                    <ArrowRight className="h-3 w-3 text-emerald-600 shrink-0" />
                    <div className="truncate">
                      <span className="font-semibold text-slate-900 dark:text-white">{item.vendor_resolution?.name || item.raw_payee}</span>
                      <span className="text-[10px] text-slate-500 dark:text-zinc-400 block font-mono">
                        QBO ID: {item.vendor_resolution?.id || "Auto-Create"} ({item.vendor_resolution?.status})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Expense Account (or Itemized Split Lines) */}
                {isMultiPart ? (
                  <div className="p-3 space-y-2 bg-slate-50/40 dark:bg-zinc-900/40">
                    <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Split className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                      <span>Expense Accounts (Itemized {displayLines.length} Split Lines)</span>
                    </div>
                    <div className="rounded border border-slate-200 dark:border-zinc-800 overflow-hidden">
                      <div className="p-2 grid grid-cols-12 gap-2 bg-slate-100 dark:bg-zinc-800 font-semibold text-[10px] text-slate-600 dark:text-zinc-400 uppercase">
                        <div className="col-span-1">#</div>
                        <div className="col-span-4">Line Description</div>
                        <div className="col-span-2 text-right">Amount</div>
                        <div className="col-span-5">Target QBO Expense Account</div>
                      </div>
                      <div className="divide-y divide-slate-200 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
                        {displayLines.map((line, lIdx) => (
                          <div key={lIdx} className="p-2 grid grid-cols-12 gap-2 items-center text-xs">
                            <div className="col-span-1 font-mono font-bold text-slate-500">{line.line_num || lIdx + 1}</div>
                            <div className="col-span-4 truncate font-medium text-slate-800 dark:text-zinc-200" title={line.description}>
                              {line.description}
                            </div>
                            <div className="col-span-2 text-right font-mono font-semibold text-slate-900 dark:text-white">
                              ${(line.amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <div className="col-span-5 flex items-center gap-1.5 truncate">
                              <ArrowRight className="h-3 w-3 text-emerald-600 shrink-0" />
                              <div className="truncate">
                                <span className="font-semibold text-slate-900 dark:text-white">
                                  {line.account_name || line.category || item.expense_account_resolution?.name || "Expense"}
                                </span>
                                <span className="text-[10px] text-slate-500 dark:text-zinc-400 block font-mono">
                                  QBO ID: {line.account_id || item.expense_account_resolution?.id || "Auto-Match"}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 grid grid-cols-12 items-center gap-3">
                    <div className="col-span-3 font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Tag className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      <span>Expense Account (GL)</span>
                    </div>
                    <div className="col-span-4 text-slate-600 dark:text-zinc-300 truncate" title={item.category}>
                      {item.category}
                    </div>
                    <div className="col-span-5 flex items-center gap-2">
                      <ArrowRight className="h-3 w-3 text-emerald-600 shrink-0" />
                      <div className="truncate">
                        <span className="font-semibold text-slate-900 dark:text-white">{item.expense_account_resolution?.name || "Expense"}</span>
                        <span className="text-[10px] text-slate-500 dark:text-zinc-400 block font-mono">
                          QBO Account ID: {item.expense_account_resolution?.id || "Auto-Match"} ({item.expense_account_resolution?.account_type || "Expense"})
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Payment Account */}
                <div className="p-2.5 grid grid-cols-12 items-center gap-3">
                  <div className="col-span-3 font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <CreditCard className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                    <span>Payment Settlement</span>
                  </div>
                  <div className="col-span-4 text-slate-600 dark:text-zinc-300 truncate" title={item.payment_method}>
                    {item.payment_method}
                  </div>
                  <div className="col-span-5 flex items-center gap-2">
                    <ArrowRight className="h-3 w-3 text-emerald-600 shrink-0" />
                    <div className="truncate">
                      <span className="font-semibold text-slate-900 dark:text-white">{item.payment_account_resolution?.name || "Business Checking"}</span>
                      <span className="text-[10px] text-slate-500 dark:text-zinc-400 block font-mono">
                        QBO Account ID: {item.payment_account_resolution?.id || "Auto"} ({item.payment_account_resolution?.payment_type})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Transaction Date */}
                <div className="p-2.5 grid grid-cols-12 items-center gap-3">
                  <div className="col-span-3 font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                    <span>Txn Date</span>
                  </div>
                  <div className="col-span-4 text-slate-600 dark:text-zinc-300">
                    {item.payment_date}
                  </div>
                  <div className="col-span-5 flex items-center gap-2">
                    <ArrowRight className="h-3 w-3 text-emerald-600 shrink-0" />
                    <span className="font-mono font-semibold text-slate-900 dark:text-white">{item.txn_date_api}</span>
                  </div>
                </div>

                {/* DocNumber */}
                <div className="p-2.5 grid grid-cols-12 items-center gap-3">
                  <div className="col-span-3 font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                    <span>DocNumber / Ref</span>
                  </div>
                  <div className="col-span-4 text-slate-600 dark:text-zinc-300">
                    {item.ref_no || `REQ-${item.request_id}`}
                  </div>
                  <div className="col-span-5 flex items-center gap-2">
                    <ArrowRight className="h-3 w-3 text-emerald-600 shrink-0" />
                    <span className="font-mono font-semibold text-slate-900 dark:text-white">{item.doc_number}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* QuickBooks Style Bottom Action Bar */}
        {/* ========================================================================= */}
        <div className="bg-white dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800 px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <Link
              to={`/purchasing/requests/${item.request_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:text-[#2ca01c] transition-colors"
            >
              <span>View Portal Request #{item.request_id}</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs font-semibold border-slate-300 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 h-8 px-3"
            >
              Close
            </Button>

            {onSync && (
              <button
                type="button"
                disabled={!isConnected || isSyncing}
                onClick={async () => {
                  await onSync(item);
                }}
                className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded text-xs font-bold text-white transition-all shadow-xs h-8 ${
                  !isConnected || isSyncing
                    ? "bg-slate-400 cursor-not-allowed opacity-60"
                    : "bg-[#2ca01c] hover:bg-[#248816] active:bg-[#1d6f12]"
                }`}
              >
                {isSyncing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Zap className="h-3.5 w-3.5" />
                )}
                <span>{isSynced ? "Re-Sync to QuickBooks" : "Save & Sync to QuickBooks"}</span>
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
