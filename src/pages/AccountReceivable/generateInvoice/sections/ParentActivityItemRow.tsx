import { Fragment } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import type { GenerateInvoiceState } from "../hooks/useGenerateInvoice";

export function ParentActivityItemRow({ s }: { s: GenerateInvoiceState }) {
  const { showTaxCol, showDiscountCol, showQtyCol, currency, showCurrencyCol, showUnitPriceCol, getChargeablePeriodLabel, invoiceDate, showDateCol, computeItemProration, lineItems } = s;
  return (
    <>
      {lineItems.map((item, idx) => {
                      const isItemPaid = (item.status === "Paid" || item.service_status === "Paid") && item.status !== "Unpaid" && item.service_status !== "Unpaid";
                      const parentProration = computeItemProration(
                        item.quantity,
                        item.unit_price,
                        item.unit_discount,
                        item.discount_type,
                        item.billing_frequency,
                        item.billing_start_date,
                        item.tax_rate,
                        item.term,
                        isItemPaid
                      );

                      return (
                        <Fragment key={idx}>
                          {/* Parent Activity / Item Row */}
                          <tr className="bg-white hover:bg-slate-50/30">
                            {showDateCol && (
                              <td className="py-2.5 px-2 border-r border-[#dce6f1] text-slate-700 align-top text-[11px] whitespace-nowrap">
                                {item.date || invoiceDate}
                              </td>
                            )}
                            <td className="py-2.5 px-3 border-r border-[#dce6f1] text-slate-900 align-top">
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-slate-900 text-xs">{item.activity || item.name || `Item ${idx + 1}`}</span>
                                  {isItemPaid ? (
                                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-300 font-bold">
                                      Paid
                                    </span>
                                  ) : (
                                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 border border-rose-300 font-bold">
                                      Unpaid
                                    </span>
                                  )}
                                  {item.billing_frequency && item.billing_frequency !== "One-Time" && item.billing_frequency !== "none" ? (
                                    parentProration.isProrated ? (
                                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                                        Prorated
                                      </span>
                                    ) : (
                                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium">
                                        Recurring
                                      </span>
                                    )
                                  ) : (
                                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-300 font-medium">
                                      One-Time
                                    </span>
                                  )}
                                </div>
                                {item.description && (
                                  <div className="text-slate-700 text-[11px] whitespace-pre-line leading-relaxed">{item.description}</div>
                                )}
                                {/* Frequency, Chargeable period, Start Billing note */}
                                {(item.billing_frequency || (item.term !== undefined && item.term !== null && String(item.term).trim() !== "") || item.billing_start_date) && (
                                  <div className="text-[10.5px] text-slate-600 flex flex-wrap items-center gap-x-2 gap-y-0.5 pt-0.5">
                                    {item.billing_frequency && item.billing_frequency !== "—" && (
                                      <span>
                                        <strong className="font-semibold text-slate-800">Frequency:</strong> {item.billing_frequency}
                                      </span>
                                    )}
                                    {item.term !== undefined && item.term !== null && String(item.term).trim() !== "" && (
                                      <>
                                        {item.billing_frequency && item.billing_frequency !== "—" && <span className="text-slate-400">•</span>}
                                        <span>
                                          <strong className="font-semibold text-slate-800">Chargeable period:</strong> {getChargeablePeriodLabel(item.term, item.billing_frequency)}
                                        </span>
                                      </>
                                    )}
                                    {item.billing_start_date && item.billing_start_date !== "—" && (
                                      <>
                                        {((item.billing_frequency && item.billing_frequency !== "—") || (item.term !== undefined && item.term !== null && String(item.term).trim() !== "")) && (
                                          <span className="text-slate-400">•</span>
                                        )}
                                        <span>
                                          <strong className="font-semibold text-slate-800">Start Billing:</strong> {item.billing_start_date}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                )}
                                {parentProration.isProrated && parentProration.proratedNote && (
                                  <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 text-[10px] text-amber-800 font-medium mt-0.5">
                                    <span>ℹ️ {parentProration.proratedNote}</span>
                                  </div>
                                )}
                                {item.service_period && (
                                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10.5px] text-indigo-600 font-medium pt-0.5 leading-snug">
                                    <span className="inline-flex items-center gap-1 shrink-0">
                                      <CalendarIcon className="w-3 h-3 shrink-0" />
                                      <span>Service Period: {item.service_period}</span>
                                    </span>
                                    {item.next_billing_date && (
                                      <span className="text-muted-foreground whitespace-nowrap">• Next Billing Date: {item.next_billing_date}</span>
                                    )}
                                  </div>
                                )}
                                {(parentProration.formulaString || item.calculation) && (
                                  <div className="text-[10px] text-blue-600 italic font-mono mt-0.5 tracking-tight break-words">
                                    Formula: {parentProration.formulaString || item.calculation}
                                  </div>
                                )}
                              </div>
                            </td>
                            {showUnitPriceCol && (
                              <td className="py-2.5 px-2 text-right border-r border-[#dce6f1] font-mono text-slate-800 align-top text-xs whitespace-nowrap">
                                ${(Number(item.unit_price) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                            )}
                            {showCurrencyCol && (
                              <td className="py-2.5 px-1 text-center border-r border-[#dce6f1] text-slate-700 align-top text-xs whitespace-nowrap">
                                {item.currency || currency || "USD"}
                              </td>
                            )}
                            {showQtyCol && (
                              <td className="py-2.5 px-1 text-center border-r border-[#dce6f1] font-mono text-slate-800 align-top text-xs whitespace-nowrap">
                                {item.quantity !== "" && item.quantity !== undefined ? item.quantity : 1}
                              </td>
                            )}
                            {showDiscountCol && (
                              <td className="py-2.5 px-1.5 text-center border-r border-[#dce6f1] font-mono text-slate-700 align-top text-xs whitespace-nowrap">
                                {item.unit_discount ? `${item.unit_discount}${item.discount_type || "%"}` : "0%"}
                              </td>
                            )}
                            {showTaxCol && (
                              <td className="py-2.5 px-1 text-center border-r border-[#dce6f1] font-mono text-slate-700 align-top text-xs whitespace-nowrap">
                                {item.tax_rate !== "" && item.tax_rate !== undefined && Number(item.tax_rate) > 0 ? `${item.tax_rate}%` : "0%"}
                              </td>
                            )}
                            <td className="py-2.5 px-2.5 text-right font-mono text-slate-900 font-bold align-top text-xs whitespace-nowrap">
                              ${((item.total !== undefined && item.total !== "") ? (Number(item.total) || 0) : parentProration.amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </tr>

                          {/* Indented Child Sub-items / Prorated Charges under this parent */}
                          {item.sub_items && item.sub_items.map((sub, sIdx) => {
                            const isSubPaid = (sub.status === "Paid" || sub.service_status === "Paid") && sub.status !== "Unpaid" && sub.service_status !== "Unpaid";
                            const subProration = computeItemProration(
                              sub.quantity,
                              sub.unit_price,
                              sub.unit_discount,
                              sub.discount_type,
                              sub.billing_frequency,
                              sub.billing_start_date,
                              sub.tax_rate,
                              sub.term,
                              isSubPaid
                            );
                            const activeFormula = subProration.formulaString || sub.calculation;

                            return (
                              <tr key={sub.id || sIdx} className="bg-slate-50/60 hover:bg-slate-50/90 border-l-2 border-l-blue-400">
                                {showDateCol && (
                                  <td className="py-2.5 px-2 border-r border-[#dce6f1] text-slate-600 align-top text-[11px] whitespace-nowrap">
                                    {sub.date_range || sub.date || item.date || invoiceDate}
                                  </td>
                                )}
                                <td className="py-2.5 px-3 border-r border-[#dce6f1] text-slate-900 align-top">
                                  <div className="pl-2 space-y-1">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="text-blue-500 font-mono text-xs leading-none shrink-0">└──</span>
                                      <span className="font-bold text-slate-900 text-xs">{sub.title || sub.activity || sub.name || "Additional Service"}</span>
                                      {isSubPaid ? (
                                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-300 font-bold">
                                          Paid
                                        </span>
                                      ) : (
                                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 border border-rose-300 font-bold">
                                          Unpaid
                                        </span>
                                      )}
                                          {sub.billing_frequency && sub.billing_frequency !== "One-Time" && sub.billing_frequency !== "none" ? (
                                            subProration.isProrated ? (
                                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200">
                                                Prorated
                                              </span>
                                            ) : (
                                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                                                Recurring
                                              </span>
                                            )
                                          ) : (
                                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-300">
                                              One-Time
                                            </span>
                                          )}

                                      {sub.is_reference_only && (
                                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200">
                                          Ref Only
                                        </span>
                                      )}
                                    </div>
                                    {sub.description && (
                                      <div className="pl-4 text-slate-700 text-[11px] whitespace-pre-line leading-relaxed">{sub.description}</div>
                                    )}
                                    {/* Frequency, Chargeable period, Start Billing note */}
                                    {((sub.billing_frequency || item.billing_frequency) || (sub.term !== undefined || item.term !== undefined) || (sub.billing_start_date || item.billing_start_date)) && (
                                      <div className="pl-4 text-[10.5px] text-slate-600 flex flex-wrap items-center gap-x-2 gap-y-0.5 pt-0.5">
                                        {(sub.billing_frequency || item.billing_frequency) && (sub.billing_frequency || item.billing_frequency) !== "—" && (
                                          <span>
                                            <strong className="font-semibold text-slate-800">Frequency:</strong> {sub.billing_frequency || item.billing_frequency}
                                          </span>
                                        )}
                                        {((sub.term !== undefined && sub.term !== null && String(sub.term).trim() !== "") || (item.term !== undefined && item.term !== null && String(item.term).trim() !== "")) && (
                                          <>
                                            {(sub.billing_frequency || item.billing_frequency) && (sub.billing_frequency || item.billing_frequency) !== "—" && <span className="text-slate-400">•</span>}
                                            <span>
                                              <strong className="font-semibold text-slate-800">Chargeable period:</strong> {getChargeablePeriodLabel(sub.term ?? item.term, sub.billing_frequency || item.billing_frequency)}
                                            </span>
                                          </>
                                        )}
                                        {(sub.billing_start_date || item.billing_start_date) && (sub.billing_start_date || item.billing_start_date) !== "—" && (
                                          <>
                                            <span className="text-slate-400">•</span>
                                            <span>
                                              <strong className="font-semibold text-slate-800">Start Billing:</strong> {sub.billing_start_date || item.billing_start_date}
                                            </span>
                                          </>
                                        )}
                                      </div>
                                    )}
                                    {subProration.isProrated && subProration.proratedNote && (
                                      <div className="pl-4 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 text-[10px] text-amber-800 font-medium mt-0.5">
                                        <span>ℹ️ {subProration.proratedNote}</span>
                                      </div>
                                    )}
                                    {sub.service_period && (
                                      <div className="pl-4 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10.5px] text-indigo-600 font-medium pt-0.5 leading-snug">
                                        <span className="inline-flex items-center gap-1 shrink-0">
                                          <CalendarIcon className="w-3 h-3 shrink-0" />
                                          <span>Service Period: {sub.service_period}</span>
                                        </span>
                                        {sub.next_billing_date && (
                                          <span className="text-muted-foreground whitespace-nowrap">• Next Billing Date: {sub.next_billing_date}</span>
                                        )}
                                      </div>
                                    )}
                                    {(activeFormula || subProration.formulaString) && (
                                      <div className="pl-4 text-[10px] text-blue-600 italic font-mono mt-0.5 tracking-tight break-words">
                                        Formula: {activeFormula}
                                      </div>
                                    )}
                                  </div>
                                </td>
                                {showUnitPriceCol && (
                                  <td className="py-2.5 px-2 text-right border-r border-[#dce6f1] font-mono text-slate-800 align-top text-xs whitespace-nowrap">
                                    ${(Number(sub.unit_price) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </td>
                                )}
                                {showCurrencyCol && (
                                  <td className="py-2.5 px-1 text-center border-r border-[#dce6f1] text-slate-700 align-top text-xs whitespace-nowrap">
                                    {sub.currency || item.currency || currency || "USD"}
                                  </td>
                                )}
                                {showQtyCol && (
                                  <td className="py-2.5 px-1 text-center border-r border-[#dce6f1] font-mono text-slate-800 align-top text-xs whitespace-nowrap">
                                    {sub.quantity !== "" && sub.quantity !== undefined ? sub.quantity : 1}
                                  </td>
                                )}
                                {showDiscountCol && (
                                  <td className="py-2.5 px-1.5 text-center border-r border-[#dce6f1] font-mono text-slate-700 align-top text-xs whitespace-nowrap">
                                    {sub.unit_discount ? `${sub.unit_discount}${sub.discount_type || "%"}` : "0%"}
                                  </td>
                                )}
                                {showTaxCol && (
                                  <td className="py-2.5 px-1 text-center border-r border-[#dce6f1] font-mono text-slate-700 align-top text-xs whitespace-nowrap">
                                    {sub.tax_rate !== "" && sub.tax_rate !== undefined && Number(sub.tax_rate) > 0 ? `${sub.tax_rate}%` : "0%"}
                                  </td>
                                )}
                                <td className="py-2.5 px-2.5 text-right font-mono text-slate-900 font-bold align-top text-xs whitespace-nowrap">
                                  {sub.is_reference_only ? (
                                    <span className="text-[10px] text-slate-500 font-normal italic">
                                      Ref: ${(Number(sub.reference_amount ?? sub.charge ?? sub.total ?? 0)).toFixed(2)}
                                    </span>
                                  ) : (
                                    `$${((sub.total !== undefined && sub.total !== "") ? (Number(sub.total) || 0) : subProration.amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </Fragment>
                      );
                    })}
    </>
  );
}
