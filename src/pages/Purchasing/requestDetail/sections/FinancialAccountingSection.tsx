import { renderPaymentMethodBadge, parseGLAccount, isBankAccountOption, mapPaymentMethodToBankAccount } from "@/utils/glAccountUtils";
import { FREQUENCY_LABELS, type FrequencyType } from "../../utils/recurringScheduleUtils";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "../../utils/purchasingMeta";
import { Field } from "../components/Field";
import type { RequestDetailViewState } from "../hooks/useRequestDetailTail";

export function FinancialAccountingSection({ v }: { v: RequestDetailViewState }) {
  const { request, reqTax, hasCrawledForeignPrice, crawledOrigCurr, crawledOrigPrice, actualCostInvoice, isRecurring, isScheduledPayment, glCodes, data, purchase_order, renderBankAccount, renderCategory, multiPartsList, isMulti } = v;
  return (
    <div className="pt-4 border-t border-slate-100 dark:border-zinc-800">
                    <div className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-3">
                      Accounting &amp; Payment Details
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-6 text-sm">
                      {!isRecurring && (
                        isMulti ? (
                          <div>
                            <div className="text-xs text-slate-500 dark:text-zinc-400 mb-1">Category</div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <Badge variant="outline" className="bg-indigo-50/80 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800 text-xs font-normal">
                                Itemized per Part ({multiPartsList.length} parts)
                              </Badge>
                              {data?.invoice?.items && data.invoice.items.length > 0 && (
                                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                                  • Recorded in Bill
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <Field label="Category" value={renderCategory(request.gl_code || data?.purchase_order?.gl_code || data?.invoice?.gl_code)} />
                        )
                      )}

                      <Field
                        label="Payment Method"
                        value={
                          (data?.purchase_order?.payment_method || (request as any)?.payment_method)
                            ? renderPaymentMethodBadge(data?.purchase_order?.payment_method || (request as any)?.payment_method)
                            : (data?.wire_transfer ? renderPaymentMethodBadge("WIRE") : "—")
                        }
                      />

                      {(data?.wire_transfer || (request as any)?.wire_transfer || request.request_type === "ACCOUNTS_PAYABLE" || (request as any)?.payment_type) && (
                        <Field
                          label="Payment Type"
                          value={
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200">
                              {data?.wire_transfer?.category || (data?.wire_transfer as any)?.payment_type || (request as any)?.wire_transfer?.category || (request as any)?.payment_type || "Others"}
                            </span>
                          }
                        />
                      )}

                      <Field
                        label="Bank Account"
                        value={renderBankAccount(
                          data?.invoice?.bank_account ||
                          (request as any)?.bank_account ||
                          (purchase_order as any)?.bank_account ||
                          (isBankAccountOption(parseGLAccount(request.gl_code, glCodes)) ? request.gl_code : null) ||
                          (isBankAccountOption(parseGLAccount(data?.purchase_order?.gl_code, glCodes)) ? data?.purchase_order?.gl_code : null) ||
                          mapPaymentMethodToBankAccount(data?.purchase_order?.payment_method || (request as any)?.payment_method, glCodes)
                        )}
                      />

                      {/* Financial Totals for Single Items */}
                      {!isRecurring && !(request.item_mode === "MULTIPLE" || (request.items && request.items.length > 0)) && (
                        <>
                          {!isRecurring && <Field label="SKU / Part #" value={request.sku || request.items?.[0]?.sku || "—"} />}
                          {!isRecurring && <Field label="Quantity" value={String(request.quantity ?? 1)} />}
                          <Field
                            label={isRecurring ? "Amount / Cycle" : "Unit Price"}
                            value={
                              <span>
                                {formatMoney(request.unit_price ?? 0, request.currency || "USD")}
                                {hasCrawledForeignPrice && (
                                  <span className="text-slate-500 text-xs ml-1.5 font-normal">
                                    ({formatMoney(crawledOrigPrice!)} {crawledOrigCurr})
                                  </span>
                                )}
                              </span>
                            }
                          />
                        </>
                      )}

                      {isScheduledPayment ? (
                        <>
                          <Field
                            label="Active Milestone Amount"
                            value={
                              <span className="font-semibold text-slate-900 dark:text-zinc-100">
                                {formatMoney(
                                  request.recurring_schedule?.schedule_dates?.[request.recurring_schedule?.completed_installments || 0]?.amount ||
                                  request.recurring_schedule?.amount_per_cycle ||
                                  request.amount ||
                                  0
                                )} {request.currency || "USD"}
                              </span>
                            }
                          />
                          <Field
                            label="Total Contract Commitment"
                            value={
                              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                {formatMoney(
                                  request.recurring_schedule?.total_amount ||
                                  (request.recurring_schedule?.schedule_dates && request.recurring_schedule.schedule_dates.length > 0
                                    ? request.recurring_schedule.schedule_dates.reduce((s: number, it: any) => s + (Number(it.amount) || 0), 0)
                                    : (request.recurring_schedule?.total_installments
                                        ? (request.recurring_schedule.amount_per_cycle || request.amount || 0) * request.recurring_schedule.total_installments
                                        : (request.amount || 0)))
                                )} {request.currency || "USD"}
                              </span>
                            }
                          />
                          <Field
                            label="Milestone Progress"
                            value={
                              <span className="font-medium text-slate-700 dark:text-zinc-300">
                                Installment {(request.recurring_schedule?.completed_installments || 0) + 1} of {request.recurring_schedule?.total_installments || request.recurring_schedule?.schedule_dates?.length || 1}
                              </span>
                            }
                          />
                        </>
                      ) : isRecurring ? (
                        <>
                          <Field
                            label="Cycle Amount"
                            value={
                              <span className="font-semibold text-slate-900 dark:text-zinc-100">
                                {formatMoney(
                                  request.recurring_schedule?.amount_per_cycle ||
                                  request.amount ||
                                  0,
                                  request.currency || "USD"
                                )}
                              </span>
                            }
                          />
                          <Field
                            label="Cadence & Frequency"
                            value={
                              <span className="font-medium text-slate-700 dark:text-zinc-300">
                                {FREQUENCY_LABELS[(request.recurring_schedule?.frequency as FrequencyType) || "MONTHLY"] || "Monthly"}
                              </span>
                            }
                          />
                          <Field
                            label="Total Commitment"
                            value={
                              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                {formatMoney(
                                  request.recurring_schedule?.total_amount ||
                                  ((request.recurring_schedule?.amount_per_cycle || request.amount || 0) * (request.recurring_schedule?.total_installments || 24)),
                                  request.currency || "USD"
                                )}
                              </span>
                            }
                          />
                        </>
                      ) : (
                        <>
                          <Field
                            label="Total"
                            value={
                              <span className="font-semibold text-slate-900 dark:text-zinc-100">
                                {hasCrawledForeignPrice
                                  ? formatMoney(crawledOrigPrice! * (Number(request.quantity) || 1), crawledOrigCurr || "USD")
                                  : formatMoney(request.amount ?? 0, request.currency || "USD")}
                                {hasCrawledForeignPrice && (
                                  <span className="text-slate-500 text-xs ml-1.5 font-normal">
                                    ({formatMoney(request.amount ?? 0, request.currency || "USD")})
                                  </span>
                                )}
                              </span>
                            }
                          />

                          <Field
                            label={actualCostInvoice ? "Total (After-Tax · Actual)" : `Total (After-Tax · ${reqTax.label})`}
                            value={
                              actualCostInvoice ? (
                                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                  {formatMoney(actualCostInvoice.actual_cost_after_tax, actualCostInvoice.currency || request.currency || "USD")}
                                </span>
                              ) : (
                                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                  {hasCrawledForeignPrice
                                    ? formatMoney(crawledOrigPrice! * (Number(request.quantity) || 1) * (1 + reqTax.rate), crawledOrigCurr || "USD")
                                    : formatMoney((request.amount ?? 0) * (1 + reqTax.rate), request.currency || "USD")}
                                  {hasCrawledForeignPrice && (
                                    <span className="text-slate-500 text-xs ml-1.5 font-normal">
                                      ({formatMoney((request.amount ?? 0) * (1 + reqTax.rate), request.currency || "USD")})
                                    </span>
                                  )}
                                </span>
                              )
                            }
                          />
                        </>
                      )}

                      <Field label="Currency" value={request.currency || "USD"} />
                    </div>
                  </div>
  );
}
