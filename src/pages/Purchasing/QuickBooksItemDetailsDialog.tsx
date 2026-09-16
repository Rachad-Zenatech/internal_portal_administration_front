import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  CreditCard,
  Tag,
  ExternalLink,
  Code2,
  Copy,
  ArrowRight,
  Database,
  Layers,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Calendar,
  DollarSign,
  Loader2,
  Zap,
  Trash2,
  MapPin,
  Check,
} from "lucide-react";
import type { QuickBooksPreviewItem } from "@/services/purchasingService";

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
  onDelete,
  isDeleting = false,
  isConnected = true,
}: QuickBooksItemDetailsDialogProps) {
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [copied, setCopied] = useState(false);

  if (!item) return null;

  const isReady = item.readiness === "READY" || item.readiness === "READY_WITH_NOTES";
  const isSynced = item.readiness === "ALREADY_SYNCED" || item.is_already_synced;
  const isError = item.readiness === "ERROR" || (item.validation_errors && item.validation_errors.length > 0);

  const handleCopyJson = () => {
    if (!item.projected_payload) return;
    navigator.clipboard.writeText(JSON.stringify(item.projected_payload, null, 2));
    setCopied(true);
    toast.success("QuickBooks JSON payload copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl lg:max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-background text-foreground border-border shadow-2xl rounded-2xl">
        {/* Modal Header */}
        <DialogHeader className="p-5 pb-4 border-b border-border/80 bg-muted/20">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 flex-wrap">
              <Badge variant="outline" className="font-mono text-xs px-2.5 py-1 bg-background border-border/80 font-bold">
                REQ-#{item.request_id}
              </Badge>

              {isSynced ? (
                <Badge variant="secondary" className="text-xs px-2.5 py-0.5 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 gap-1 font-semibold">
                  <Database className="h-3.5 w-3.5" />
                  <span>In QuickBooks {item.existing_purchase_id ? `(#${item.existing_purchase_id})` : ""}</span>
                </Badge>
              ) : isReady ? (
                <Badge className="text-xs px-2.5 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 gap-1 font-semibold">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Ready to Sync</span>
                </Badge>
              ) : (
                <Badge variant="destructive" className="text-xs px-2.5 py-0.5 gap-1 font-semibold">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>Action Required</span>
                </Badge>
              )}

              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                <span>Date: {item.payment_date || item.txn_date_api}</span>
              </span>
            </div>

            <div className="flex items-baseline gap-1 text-right">
              <span className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {item.formatted_amount || `$${item.amount?.toFixed(2)}`}
              </span>
              <span className="text-xs text-muted-foreground font-semibold">USD</span>
            </div>
          </div>

          <DialogTitle className="text-base font-bold text-foreground mt-2 text-left">
            Purchase Request #{item.request_id} — QuickBooks Export &amp; Sync Details
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground text-left mt-0.5">
            Full procurement metadata, account categorization, and live QuickBooks Online REST mappings.
          </DialogDescription>

          {/* Navigation Tabs */}
          <div className="pt-3">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-3 h-8 text-xs bg-muted/60 p-1">
                <TabsTrigger value="overview" className="text-xs gap-1.5 data-[state=active]:bg-background">
                  <FileText className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Overview &amp; Details</span>
                </TabsTrigger>
                <TabsTrigger value="mapping" className="text-xs gap-1.5 data-[state=active]:bg-background">
                  <Layers className="h-3.5 w-3.5 text-blue-600" />
                  <span>QuickBooks Mapping</span>
                </TabsTrigger>
                <TabsTrigger value="json" className="text-xs gap-1.5 data-[state=active]:bg-background">
                  <Code2 className="h-3.5 w-3.5 text-purple-600" />
                  <span>REST JSON Payload</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </DialogHeader>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {activeTab === "overview" && (
            <div className="space-y-4 text-xs">
              {/* Product / Line Item Hero Box */}
              <div className="p-4 rounded-xl border border-border/80 bg-muted/20 space-y-2">
                <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 text-primary" />
                  <span>Line Item / Purchased Product</span>
                </div>
                <div className="text-sm font-bold text-foreground leading-snug">
                  {item.product_name}
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                  {item.department && (
                    <Badge variant="secondary" className="px-2 py-0.5 text-[11px] font-medium">
                      Class: {item.department}
                    </Badge>
                  )}
                  {item.location && (
                    <Badge variant="outline" className="px-2 py-0.5 text-[11px] font-medium flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span>{item.location}</span>
                    </Badge>
                  )}
                  {item.ref_no && (
                    <Badge variant="outline" className="px-2 py-0.5 text-[11px] font-mono">
                      Ref: {item.ref_no}
                    </Badge>
                  )}
                </div>
              </div>

              {/* 4 Core Classification Tiles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Vendor / Payee */}
                <div className="p-3.5 rounded-xl border border-border/70 bg-card space-y-2">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="flex items-center gap-1.5 font-semibold text-[11px] uppercase tracking-wider">
                      <Building2 className="h-3.5 w-3.5 text-indigo-500" />
                      <span>Vendor / Payee</span>
                    </span>
                    {item.vendor_resolution?.status === "EXISTS" ? (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200">
                        Mapped in QBO
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border-sky-200">
                        Auto-Create in QBO
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm font-bold text-foreground truncate" title={item.vendor_resolution?.name || item.raw_payee}>
                    {item.vendor_resolution?.name || item.raw_payee}
                  </div>
                  <div className="text-[11px] text-muted-foreground space-y-0.5">
                    <div>QuickBooks Vendor ID: <span className="font-mono font-medium text-foreground">{item.vendor_resolution?.id || "Auto-Generated"}</span></div>
                    {item.vendor_resolution?.notes && (
                      <div className="text-[10px] text-muted-foreground/80 italic">{item.vendor_resolution.notes}</div>
                    )}
                  </div>
                </div>

                {/* Expense Account (GL) */}
                <div className="p-3.5 rounded-xl border border-border/70 bg-card space-y-2">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="flex items-center gap-1.5 font-semibold text-[11px] uppercase tracking-wider">
                      <Tag className="h-3.5 w-3.5 text-emerald-500" />
                      <span>Expense Account (GL)</span>
                    </span>
                    {item.expense_account_resolution?.acct_num ? (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-mono">
                        GL: {item.expense_account_resolution.acct_num}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {item.expense_account_resolution?.account_type || "Expense"}
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm font-bold text-foreground truncate" title={item.expense_account_resolution?.name || item.category}>
                    {item.expense_account_resolution?.name || item.category}
                  </div>
                  <div className="text-[11px] text-muted-foreground space-y-0.5">
                    <div className="truncate">Category: <span className="font-medium text-foreground">{item.category}</span></div>
                    <div>QuickBooks Account ID: <span className="font-mono font-medium text-foreground">{item.expense_account_resolution?.id || "Auto-Resolved"}</span></div>
                  </div>
                </div>

                {/* Payment Account */}
                <div className="p-3.5 rounded-xl border border-border/70 bg-card space-y-2">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="flex items-center gap-1.5 font-semibold text-[11px] uppercase tracking-wider">
                      <CreditCard className="h-3.5 w-3.5 text-amber-500" />
                      <span>Payment Settlement</span>
                    </span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono">
                      {item.payment_method || "Credit Card"}
                    </Badge>
                  </div>
                  <div className="text-sm font-bold text-foreground truncate" title={item.payment_account_resolution?.name}>
                    {item.payment_account_resolution?.name || "Business Credit Card / Checking"}
                  </div>
                  <div className="text-[11px] text-muted-foreground space-y-0.5">
                    <div>Payment Type: <span className="font-medium text-foreground">{item.payment_account_resolution?.payment_type || "CreditCard"}</span></div>
                    <div>QuickBooks Account ID: <span className="font-mono font-medium text-foreground">{item.payment_account_resolution?.id || "Auto-Resolved"}</span></div>
                  </div>
                </div>

                {/* Department & Audit References */}
                <div className="p-3.5 rounded-xl border border-border/70 bg-card space-y-2">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="flex items-center gap-1.5 font-semibold text-[11px] uppercase tracking-wider">
                      <ShieldCheck className="h-3.5 w-3.5 text-purple-500" />
                      <span>Document &amp; Class</span>
                    </span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono">
                      Doc #{item.doc_number || item.ref_no}
                    </Badge>
                  </div>
                  <div className="text-sm font-bold text-foreground">
                    Class: {item.department || "General Administration"}
                  </div>
                  <div className="text-[11px] text-muted-foreground space-y-0.5">
                    <div>Location: <span className="font-medium text-foreground">{item.location || "Default"}</span></div>
                    <div>Reference ID: <span className="font-mono font-medium text-foreground">{item.ref_no || "-"}</span></div>
                  </div>
                </div>
              </div>

              {/* Memo & Private Note */}
              <div className="p-3.5 rounded-xl border border-border/70 bg-muted/20 space-y-1.5">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                  QuickBooks Private Note / Memo Line
                </span>
                <p className="font-mono text-xs text-foreground/90 bg-background/60 p-2.5 rounded-lg border border-border/50 break-words leading-relaxed">
                  {item.memo || `${item.raw_payee} - ${item.product_name} - ${item.location || 'HQ'} - ${item.ref_no}`}
                </p>
              </div>

              {/* Validation Notes & Audit Status */}
              {(item.validation_notes?.length > 0 || isSynced || isError) && (
                <div className="p-3.5 rounded-xl border border-border/70 bg-card space-y-2">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                    Sync Readiness &amp; Audit Trail
                  </span>

                  {isSynced && (
                    <div className="flex items-start gap-2 p-2.5 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-300">
                      <Database className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-xs">Transaction is Recorded in QuickBooks Online</div>
                        <div className="text-[11px] opacity-90 mt-0.5">
                          Synced with DocNumber <strong>{item.doc_number || item.ref_no}</strong> (Purchase ID: <strong>#{item.existing_purchase_id || item.projected_payload?.Id || "Confirmed"}</strong>).
                        </div>
                      </div>
                    </div>
                  )}

                  {item.validation_notes?.map((note, nIdx) => (
                    <div key={nIdx} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
                      <span>{note}</span>
                    </div>
                  ))}

                  {item.validation_errors?.map((err, eIdx) => (
                    <div key={eIdx} className="flex items-center gap-2 text-xs text-rose-600 font-medium">
                      <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>{err}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "mapping" && (
            <div className="space-y-4 text-xs">
              <div className="rounded-xl border border-border/80 bg-muted/20 p-3.5 space-y-1">
                <h4 className="font-bold text-foreground text-xs flex items-center gap-1.5">
                  <Layers className="h-4 w-4 text-blue-600" />
                  <span>Local Portal to QuickBooks Online Data Pipeline</span>
                </h4>
                <p className="text-muted-foreground text-[11px] leading-relaxed">
                  Every field from purchase request #{item.request_id} is dynamically matched against live QuickBooks Chart of Accounts, active Vendors, and Bank/Credit Card payment methods.
                </p>
              </div>

              {/* Table of Mappings */}
              <div className="rounded-xl border border-border/80 divide-y divide-border/60 bg-card overflow-hidden">
                <div className="p-3 grid grid-cols-12 items-center gap-3 bg-muted/40 font-semibold text-[11px] text-muted-foreground uppercase tracking-wider">
                  <div className="col-span-3">Target Field</div>
                  <div className="col-span-4">Source Value</div>
                  <div className="col-span-5">QuickBooks Target Ledger / ID</div>
                </div>

                {/* Payee / Vendor */}
                <div className="p-3 grid grid-cols-12 items-center gap-3">
                  <div className="col-span-3 font-semibold text-foreground flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-indigo-500 flex-shrink-0" />
                    <span>Vendor / Payee</span>
                  </div>
                  <div className="col-span-4 text-muted-foreground truncate" title={item.raw_payee}>
                    {item.raw_payee}
                  </div>
                  <div className="col-span-5 flex items-center gap-2">
                    <ArrowRight className="h-3 w-3 text-emerald-600 flex-shrink-0" />
                    <div className="truncate">
                      <span className="font-semibold text-foreground">{item.vendor_resolution?.name || item.raw_payee}</span>
                      <span className="text-[10px] text-muted-foreground block">
                        QBO ID: {item.vendor_resolution?.id || "Auto-Create"} ({item.vendor_resolution?.status})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Expense Account */}
                <div className="p-3 grid grid-cols-12 items-center gap-3">
                  <div className="col-span-3 font-semibold text-foreground flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                    <span>Expense Account (GL)</span>
                  </div>
                  <div className="col-span-4 text-muted-foreground truncate" title={item.category}>
                    {item.category}
                  </div>
                  <div className="col-span-5 flex items-center gap-2">
                    <ArrowRight className="h-3 w-3 text-emerald-600 flex-shrink-0" />
                    <div className="truncate">
                      <span className="font-semibold text-foreground">{item.expense_account_resolution?.name || "Expense"}</span>
                      <span className="text-[10px] text-muted-foreground block">
                        QBO Account ID: {item.expense_account_resolution?.id || "Auto-Match"} ({item.expense_account_resolution?.account_type || "Expense"})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Payment Account */}
                <div className="p-3 grid grid-cols-12 items-center gap-3">
                  <div className="col-span-3 font-semibold text-foreground flex items-center gap-1.5">
                    <CreditCard className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                    <span>Payment Settlement</span>
                  </div>
                  <div className="col-span-4 text-muted-foreground truncate" title={item.payment_method}>
                    {item.payment_method}
                  </div>
                  <div className="col-span-5 flex items-center gap-2">
                    <ArrowRight className="h-3 w-3 text-emerald-600 flex-shrink-0" />
                    <div className="truncate">
                      <span className="font-semibold text-foreground">{item.payment_account_resolution?.name || "Business Checking"}</span>
                      <span className="text-[10px] text-muted-foreground block">
                        QBO Account ID: {item.payment_account_resolution?.id || "Auto"} ({item.payment_account_resolution?.payment_type})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Transaction Date */}
                <div className="p-3 grid grid-cols-12 items-center gap-3">
                  <div className="col-span-3 font-semibold text-foreground flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                    <span>Txn Date</span>
                  </div>
                  <div className="col-span-4 text-muted-foreground">
                    {item.payment_date}
                  </div>
                  <div className="col-span-5 flex items-center gap-2">
                    <ArrowRight className="h-3 w-3 text-emerald-600 flex-shrink-0" />
                    <span className="font-mono font-semibold text-foreground">{item.txn_date_api}</span>
                  </div>
                </div>

                {/* DocNumber */}
                <div className="p-3 grid grid-cols-12 items-center gap-3">
                  <div className="col-span-3 font-semibold text-foreground flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-slate-500 flex-shrink-0" />
                    <span>DocNumber / Ref</span>
                  </div>
                  <div className="col-span-4 text-muted-foreground">
                    {item.ref_no || `REQ-${item.request_id}`}
                  </div>
                  <div className="col-span-5 flex items-center gap-2">
                    <ArrowRight className="h-3 w-3 text-emerald-600 flex-shrink-0" />
                    <span className="font-mono font-semibold text-foreground">{item.doc_number}</span>
                  </div>
                </div>

                {/* Amount */}
                <div className="p-3 grid grid-cols-12 items-center gap-3">
                  <div className="col-span-3 font-semibold text-foreground flex items-center gap-1.5">
                    <DollarSign className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                    <span>Total Amount</span>
                  </div>
                  <div className="col-span-4 text-muted-foreground font-mono">
                    {item.formatted_amount}
                  </div>
                  <div className="col-span-5 flex items-center gap-2">
                    <ArrowRight className="h-3 w-3 text-emerald-600 flex-shrink-0" />
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      ${item.amount?.toFixed(2)} USD
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "json" && (
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-foreground text-xs flex items-center gap-1.5">
                    <Code2 className="h-3.5 w-3.5 text-purple-600" />
                    <span>QuickBooks Online REST API Purchase Payload</span>
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    Payload sent directly to <code className="font-mono text-foreground">POST /v3/company/purchase</code>.
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyJson}
                  className="h-7 text-xs gap-1.5"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? "Copied!" : "Copy JSON"}</span>
                </Button>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 font-mono text-[11px] text-zinc-200 overflow-x-auto max-h-[380px] shadow-inner">
                <pre>{JSON.stringify(item.projected_payload, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <DialogFooter className="p-4 border-t border-border/80 bg-muted/20 flex flex-wrap items-center justify-between gap-2.5">
          <Link
            to={`/purchasing/requests/${item.request_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
          >
            <span>Open Purchase Request #{item.request_id}</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs"
            >
              Close
            </Button>

            {isSynced && onDelete && (
              <Button
                variant="outline"
                size="sm"
                disabled={!isConnected || isDeleting}
                onClick={async () => {
                  await onDelete(item);
                }}
                className="text-xs font-semibold gap-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 border-rose-200 dark:border-rose-900"
              >
                {isDeleting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                <span>Remove from QuickBooks</span>
              </Button>
            )}

            {onSync && (
              <Button
                size="sm"
                disabled={!isConnected || isSyncing}
                onClick={async () => {
                  await onSync(item);
                }}
                className={`text-xs font-semibold gap-1.5 ${
                  !isSynced ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs" : ""
                }`}
              >
                {isSyncing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Zap className="h-3.5 w-3.5" />
                )}
                <span>{isSynced ? "Re-Sync to QuickBooks" : "Sync to QuickBooks"}</span>
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
