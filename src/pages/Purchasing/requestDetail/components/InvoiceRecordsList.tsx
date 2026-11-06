import { useMemo, useState, type ReactNode } from "react";
import { CheckCircle2, ChevronDown, ChevronRight, ReceiptText, Search } from "lucide-react";
import HelpIcon from "@/components/ui/HelpIcon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Invoice } from "@/types/purchasing";
import { PAYMENT_BADGE, PAYMENT_LABEL, STATUS_BADGE, formatDate, formatMoney } from "../../utils/purchasingMeta";
import { Field } from "./Field";

/** records shown before "Show all": enough to see the recent history without a long page */
const INITIAL_VISIBLE = 8;
/** the search box only appears once the list is long enough to need it */
const SEARCH_FROM = 6;
/** a long list scrolls inside its own area instead of stretching the page */
const SCROLL_FROM = 12;

interface Props {
  invoices: Invoice[];
  /** wire transfers: what the request has to pay in total, so the summary can show what is left */
  amountDue?: number | null;
  amountDueCurrency?: string | null;
  renderBankAccount: (val: string | null | undefined) => ReactNode;
  renderCategory: (val: string | null | undefined) => ReactNode;
}

const recordDate = (r: Invoice) => r.paid_date || r.invoice_date;

/**
 * Every payment / invoice recorded against a request, newest first. A compact row per record (date, amount, bank,
 * category, status); a row opens to its full details. Built for requests with many payments: the newest record is
 * open, long lists show the first few and scroll, and a search box narrows them down.
 */
export function InvoiceRecordsList({ invoices, amountDue, amountDueCurrency, renderBankAccount, renderCategory }: Props) {
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set(invoices[0] ? [invoices[0].id] : []));
  const [showAll, setShowAll] = useState(false);
  const [query, setQuery] = useState("");

  const totals = useMemo(() => {
    const byCurrency = new Map<string, number>();
    for (const r of invoices) {
      const cur = (r.currency || "USD").toUpperCase();
      byCurrency.set(cur, Math.round(((byCurrency.get(cur) ?? 0) + (Number(r.actual_cost_after_tax ?? r.amount) || 0)) * 100) / 100);
    }
    return [...byCurrency.entries()];
  }, [invoices]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return invoices;
    return invoices.filter((r) =>
      [r.id, r.amount, r.bank_account, r.gl_code, r.department, r.from_location, r.description, r.vendor, formatDate(recordDate(r))]
        .some((x) => String(x ?? "").toLowerCase().includes(q)),
    );
  }, [invoices, query]);

  const visible = showAll || query.trim() ? filtered : filtered.slice(0, INITIAL_VISIBLE);
  const hiddenCount = filtered.length - visible.length;
  const allOpen = visible.length > 0 && visible.every((r) => openIds.has(r.id));

  const toggle = (id: string) =>
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // wire transfers: how much of the amount due has been paid
  const dueCur = (amountDueCurrency || "USD").toUpperCase();
  const recordedInDueCurrency = totals.find(([cur]) => cur === dueCur)?.[1] ?? 0;
  const hasDue = amountDue != null && amountDue > 0;
  const remaining = hasDue ? Math.round((amountDue! - recordedInDueCurrency) * 100) / 100 : 0;
  const paidInFull = hasDue && remaining <= 0.005;
  const partlyPaid = hasDue && !paidInFull && invoices.length > 0;

  return (
    <>
      <CardHeader className="pb-3 border-b border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/30">
        <CardTitle className="text-base font-semibold flex items-center justify-between gap-3 text-slate-900 dark:text-zinc-100">
          <div className="flex items-center gap-2">
            <ReceiptText className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <span>Invoice &amp; Bill</span>
            <Badge variant="secondary" className="text-[11px] px-1.5 py-0 h-5">
              {invoices.length} {invoices.length === 1 ? "record" : "records"}
            </Badge>
          </div>
          {paidInFull ? (
            <Badge variant="outline" className={`gap-1 ${STATUS_BADGE.COMPLETED}`}>
              <CheckCircle2 className="h-3 w-3" /> Paid in full
            </Badge>
          ) : partlyPaid ? (
            <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
              Partially paid
            </Badge>
          ) : null}
        </CardTitle>
      </CardHeader>

      <CardContent className="p-5 space-y-4">
        {/* summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <SummaryTile label="Payments recorded" value={String(invoices.length)} />
          <SummaryTile label="Total recorded" value={totals.map(([cur, amt]) => formatMoney(amt, cur)).join(" + ") || "—"} />
          {hasDue && <SummaryTile label="Amount due" value={formatMoney(amountDue!, dueCur)} />}
          {hasDue && (
            <SummaryTile
              label="Remaining"
              value={paidInFull ? "Nothing left" : formatMoney(remaining, dueCur)}
              tone={paidInFull ? "good" : "warn"}
            />
          )}
        </div>

        {/* toolbar: only when there is something to search or fold */}
        {(invoices.length >= SEARCH_FROM || visible.length > 1) && (
          <div className="flex flex-wrap items-center justify-between gap-2">
            {invoices.length >= SEARCH_FROM ? (
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search date, amount, bank, category..."
                  className="h-8 pl-8 text-xs"
                />
              </div>
            ) : (
              <span />
            )}
            {visible.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-slate-600 dark:text-zinc-400 cursor-pointer"
                onClick={() => setOpenIds(allOpen ? new Set() : new Set(visible.map((r) => r.id)))}
              >
                {allOpen ? "Collapse all" : "Expand all"}
              </Button>
            )}
          </div>
        )}

        {/* records */}
        {filtered.length === 0 ? (
          <p className="text-sm text-center text-slate-500 dark:text-zinc-400 py-6">No records match "{query}".</p>
        ) : (
          <div
            className={`rounded-xl border border-slate-200 dark:border-zinc-800 overflow-hidden ${
              visible.length > SCROLL_FROM ? "max-h-[640px] overflow-y-auto" : ""
            }`}
          >
            <div className="hidden md:grid grid-cols-[28px_120px_110px_130px_1fr_130px_28px] gap-3 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 bg-slate-50 dark:bg-zinc-900/60 border-b border-slate-200 dark:border-zinc-800 sticky top-0 z-10">
              <span />
              <span>Date</span>
              <span>Record</span>
              <span className="text-right pr-4">Amount</span>
              <span>Bank account / Category</span>
              <span>Status</span>
              <span />
            </div>
            <ul className="divide-y divide-slate-100 dark:divide-zinc-800">
              {visible.map((rec) => {
                const open = openIds.has(rec.id);
                const settled = Boolean(rec.paid_date);
                return (
                  <li key={rec.id} className={open ? "bg-slate-50/60 dark:bg-zinc-900/30" : ""}>
                    <button
                      type="button"
                      onClick={() => toggle(rec.id)}
                      aria-expanded={open}
                      className="w-full text-left px-4 py-2.5 grid grid-cols-[28px_1fr_auto] md:grid-cols-[28px_120px_110px_130px_1fr_130px_28px] items-center gap-x-3 gap-y-1 hover:bg-slate-50 dark:hover:bg-zinc-800/40 transition-colors cursor-pointer"
                    >
                      <span className="text-slate-400">{open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</span>
                      <span className="text-sm font-medium text-slate-800 dark:text-zinc-200">{formatDate(recordDate(rec))}</span>
                      <span className="font-mono text-xs text-slate-500 dark:text-zinc-400 hidden md:block">#{rec.id}</span>
                      <span className="md:text-right md:pr-4 font-mono text-sm font-semibold text-slate-900 dark:text-zinc-100 justify-self-end md:justify-self-stretch">
                        {formatMoney(rec.actual_cost_after_tax ?? rec.amount, rec.currency || "USD")}
                      </span>
                      <span className="hidden md:block text-xs text-slate-600 dark:text-zinc-400 truncate" title={[rec.bank_account, rec.gl_code].filter(Boolean).join(" · ")}>
                        {[rec.bank_account, rec.gl_code].filter(Boolean).join(" · ") || "—"}
                      </span>
                      <span className="hidden md:block">
                        <Badge variant="outline" className={`text-[11px] ${settled ? STATUS_BADGE.COMPLETED : PAYMENT_BADGE[rec.payment_status]}`}>
                          {settled ? "Settled" : PAYMENT_LABEL[rec.payment_status] || rec.payment_status}
                        </Badge>
                      </span>
                      <span className="hidden md:block" />
                    </button>

                    {open && (
                      <div className="px-4 pb-4 pt-1 md:pl-[52px] space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-6 text-sm">
                          <Field label="Vendor" value={rec.vendor} />
                          <Field label="Amount" value={formatMoney(rec.actual_cost_after_tax ?? rec.amount, rec.currency || "USD")} />
                          <Field label={settled ? "Paid On" : "Bill Date"} value={formatDate(recordDate(rec))} />
                          <Field label="Due Date / Date Arrived" value={formatDate(rec.due_date)} />
                          <Field label="Bank Account" value={renderBankAccount(rec.bank_account)} />
                          <Field
                            label="Category"
                            value={
                              rec.items && rec.items.length > 1 ? (
                                <Badge variant="outline" className="bg-slate-50 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-slate-300 dark:border-zinc-700 text-xs font-normal">
                                  Split ({rec.items.length} lines)
                                </Badge>
                              ) : (
                                renderCategory(rec.gl_code)
                              )
                            }
                          />
                          <Field label="Class (Department)" value={rec.department || "—"} />
                          <Field label="From Location" value={rec.from_location || "—"} />
                          <Field
                            label={
                              <span className="flex items-center gap-1">
                                <span>Asset Flag</span>
                                <HelpIcon text="Asset Flag designates whether this invoice represents a Capitalized Fixed Asset (CapEx), such as equipment, hardware, lease/financing agreements, or software licenses, rather than an immediate operational expense (OpEx). When checked, the cost is capitalized on the balance sheet and depreciated/amortized over time instead of expensed in full in the current period. It automatically defaults to active for Scheduled Payments, Recurring obligations, and Accounts Payable." />
                              </span>
                            }
                            value={rec.asset_flag ? "Yes" : "No"}
                          />
                        </div>

                        {rec.description && (
                          <div className="pt-3 border-t border-slate-100 dark:border-zinc-800">
                            <div className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Description</div>
                            <div className="text-sm text-slate-800 dark:text-zinc-200 whitespace-pre-wrap">{rec.description}</div>
                          </div>
                        )}

                        {rec.items && rec.items.length > 0 && (
                          <div className="pt-3 border-t border-slate-100 dark:border-zinc-800">
                            <div className="text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-2">Itemized Category Allocations ({rec.items.length} items)</div>
                            <div className="border border-slate-200 dark:border-zinc-800 rounded-lg overflow-hidden divide-y divide-slate-100 dark:divide-zinc-800 text-xs">
                              <div className="bg-slate-50 dark:bg-zinc-800/50 px-3 py-1.5 grid grid-cols-12 gap-2 font-medium text-slate-500">
                                <div className="col-span-5">Item</div>
                                <div className="col-span-2 text-right pr-6">Amount</div>
                                <div className="col-span-4 pl-4 border-l border-slate-200 dark:border-zinc-700">Category</div>
                                <div className="col-span-1 flex items-center justify-center gap-0.5">
                                  <span>Asset</span>
                                  <HelpIcon text="Mark as Capitalized Fixed Asset (CapEx)" iconClassName="h-3 w-3" />
                                </div>
                              </div>
                              {rec.items.map((it, idx) => (
                                <div key={idx} className="px-3 py-2 grid grid-cols-12 gap-2 items-center bg-white dark:bg-zinc-900">
                                  <div className="col-span-5 break-words whitespace-normal leading-snug font-medium text-slate-800 dark:text-zinc-200" title={it.description}>
                                    {it.sku ? <span className="font-mono text-indigo-600 dark:text-indigo-400 mr-1">[{it.sku}]</span> : null}
                                    {it.description}
                                  </div>
                                  <div className="col-span-2 text-right pr-6 font-mono font-medium text-slate-700 dark:text-zinc-300">{formatMoney(it.amount, rec.currency || "USD")}</div>
                                  <div className="col-span-4 pl-4 border-l border-slate-100 dark:border-zinc-800">{renderCategory(it.gl_code)}</div>
                                  <div className="col-span-1 text-center">
                                    {it.asset_flag ? (
                                      <Badge variant="outline" className="text-[10px] px-1 py-0 bg-emerald-50 text-emerald-700 border-emerald-200">Asset</Badge>
                                    ) : (
                                      "—"
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {(hiddenCount > 0 || (showAll && !query.trim() && filtered.length > INITIAL_VISIBLE)) && (
          <div className="flex justify-center">
            <Button type="button" variant="outline" size="sm" className="h-8 text-xs cursor-pointer" onClick={() => setShowAll((s) => !s)}>
              {showAll ? "Show fewer records" : `Show all ${filtered.length} records (${hiddenCount} older)`}
            </Button>
          </div>
        )}
      </CardContent>
    </>
  );
}

function SummaryTile({ label, value, tone }: { label: string; value: string; tone?: "good" | "warn" }) {
  const toneClass =
    tone === "good"
      ? "border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/50 dark:bg-emerald-950/20"
      : tone === "warn"
        ? "border-amber-200 bg-amber-50/60 dark:border-amber-900/50 dark:bg-amber-950/20"
        : "border-slate-200 bg-slate-50/60 dark:border-zinc-800 dark:bg-zinc-900/30";
  return (
    <div className={`rounded-lg border px-3 py-2 min-w-0 ${toneClass}`}>
      <div className="text-[11px] text-slate-500 dark:text-zinc-400">{label}</div>
      <div className="text-sm font-semibold text-slate-900 dark:text-zinc-100 truncate" title={value}>
        {value}
      </div>
    </div>
  );
}
