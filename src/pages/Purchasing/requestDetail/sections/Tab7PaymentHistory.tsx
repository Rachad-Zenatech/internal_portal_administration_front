import { useNavigate } from "react-router-dom";
import { History, Loader2, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useWireSeriesPayments } from "@/hooks/usePurchasing";
import { useAuth } from "@/lib/AuthContext";
import { formatDate, formatMoney, getStatusBadge, getStatusLabel } from "../../utils/purchasingMeta";
import type { RequestDetailViewState } from "../hooks/useRequestDetailTail";

/**
 * "All Payments" card of a Rent / Note wire transfer: every payment of the series (same vendor and payment type),
 * oldest first, with the one being viewed highlighted. Each wire payment is its own request, so a row opens it.
 */
export function Tab7PaymentHistory({ v }: { v: RequestDetailViewState }) {
  const { request, hasPaymentsTab } = v;
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  const { data, isLoading } = useWireSeriesPayments(request.id, hasPaymentsTab);
  if (!hasPaymentsTab) return null;

  const series = data?.series;
  const payments = data?.payments ?? [];
  const paid = Object.entries(series?.paid_to_date ?? {});
  // the next period starts from the latest payment, once it has been paid
  const latest = payments[payments.length - 1];
  const canCreateNext = Boolean(
    series && latest?.is_current && latest.status === "COMPLETED" && (user?.is_super_admin || hasPermission("PURCHASING_CREATE")),
  );

  return (
    <div id="wire-payments" className="scroll-mt-4">
      <Card className="border border-slate-200 dark:border-zinc-800 shadow-sm">
        <CardHeader className="bg-teal-50/40 dark:bg-teal-950/20 border-b border-slate-100 dark:border-zinc-800 px-6 py-3.5 flex flex-row items-center justify-between gap-3 space-y-0">
          <div className="flex items-center gap-2 text-teal-900 dark:text-teal-200 font-semibold text-base">
            <History className="h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0" />
            <span>Payment History</span>
            {series?.label && (
              <Badge variant="outline" className="ml-1 text-[11px] font-medium bg-teal-50 text-teal-800 dark:bg-teal-950/50 dark:text-teal-300 border-teal-200 dark:border-teal-800">
                This is the {series.label}
              </Badge>
            )}
          </div>
          {canCreateNext && series && (
            <Button
              type="button"
              size="sm"
              onClick={() => navigate(`/purchasing/invoices?newFrom=${request.id}&category=${encodeURIComponent(series.category)}`)}
              className="h-8 gap-1.5 text-xs bg-teal-600 text-white hover:bg-teal-700 cursor-pointer shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
              Create next payment
            </Button>
          )}
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading payments...
            </div>
          ) : payments.length === 0 ? (
            <p className="px-6 py-10 text-sm text-center text-slate-500 dark:text-zinc-400">No payments recorded for this series yet.</p>
          ) : (
            <>
              <p className="px-6 pt-3 text-[11px] text-slate-500 dark:text-zinc-400">
                When a payment is recorded in full, the next one is created automatically in Waiting Payment, due one month later, with the same bank details.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 px-6 py-4 border-b border-slate-100 dark:border-zinc-800">
                <SummaryItem label="Payee" value={series?.vendor || "—"} />
                <SummaryItem label="Type" value={series?.category || "—"} />
                <SummaryItem label="Payments" value={`${series?.payments_count ?? payments.length}${series?.since ? ` since ${formatDate(series.since)}` : ""}`} />
                <SummaryItem label="Paid to date" value={paid.length ? paid.map(([cur, amt]) => formatMoney(amt, cur)).join(" + ") : "—"} />
              </div>

              {/* columns stay on one line; narrow screens scroll sideways instead of wrapping dates and amounts */}
              <Table className="min-w-[960px] [&_td]:whitespace-nowrap [&_th]:whitespace-nowrap">
                <TableHeader>
                  <TableRow className="text-[11px] uppercase tracking-wider">
                    <TableHead className="w-16">#</TableHead>
                    <TableHead>Request</TableHead>
                    <TableHead className="w-32">Due Date</TableHead>
                    <TableHead className="w-32">Payment Date</TableHead>
                    <TableHead className="w-40 text-right">Amount</TableHead>
                    <TableHead className="w-36">Status</TableHead>
                    <TableHead className="w-32">Paid On</TableHead>
                    <TableHead className="w-32">Invoice #</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((p) => (
                    <TableRow
                      key={p.request_id}
                      onClick={() => !p.is_current && navigate(`/purchasing/requests/${p.request_id}`)}
                      className={p.is_current ? "bg-teal-50/60 dark:bg-teal-950/20" : "cursor-pointer hover:bg-slate-50/70 dark:hover:bg-zinc-800/40"}
                    >
                      <TableCell className="font-semibold text-slate-700 dark:text-zinc-300">{p.sequence}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 min-w-0 max-w-[320px]">
                          <span className="font-mono text-xs text-blue-600 dark:text-blue-400 shrink-0">#{p.request_id}</span>
                          <span className="truncate text-sm">{p.title || "Untitled"}</span>
                          {p.is_current && (
                            <Badge className="text-[10px] px-1.5 py-0 bg-teal-600 text-white hover:bg-teal-600 shrink-0">This payment</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{p.due_date ? formatDate(p.due_date) : "—"}</TableCell>
                      <TableCell className="text-sm">{p.payment_date ? formatDate(p.payment_date) : "—"}</TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {p.amount != null ? formatMoney(p.amount, p.currency) : "—"}
                        {p.status !== "COMPLETED" && p.paid_amount > 0 && (
                          <div className="text-[11px] font-sans text-amber-700 dark:text-amber-400">Paid {formatMoney(p.paid_amount, p.currency)}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[11px] font-medium ${getStatusBadge(p.status)}`}>
                          {getStatusLabel(p.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{p.completed_at ? formatDate(p.completed_at) : "—"}</TableCell>
                      <TableCell className="text-sm font-mono">{p.invoice_number || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <div className="text-[11px] text-slate-500 dark:text-zinc-400">{label}</div>
      <div className="text-sm font-semibold text-slate-900 dark:text-zinc-100 truncate" title={value}>
        {value}
      </div>
    </div>
  );
}
