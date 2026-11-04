import { Building2, FileSpreadsheet, ShieldCheck, User, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { QuoteNotesThread } from "../../components/QuoteNotesThread";
import { calculateRowPricing } from "../../utils/lineItemPricingUtils";
import type { QuoteDetailPageViewState } from "../hooks/useQuoteDetailPageTail";

export function QuoteContentColumn({ v }: { v: QuoteDetailPageViewState }) {
  const { quote, isChanges, isSigned, effectiveTotal, effectiveTax, effectiveDiscount, effectiveSubtotal, isPaid, isRenewalQuote } = v;
  return (
    <div className="lg:col-span-2 space-y-6 print:w-full print:max-w-none print:space-y-6 print:m-0 print:p-0">
          {/* Brand Logo & Company Header if present */}
          {(quote.logo_url || quote.company_name) && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-2 print:border-none print:shadow-none print:p-0 print:rounded-none">
              {quote.logo_url && (
                <div className="h-16 max-w-[280px] flex items-center">
                  <img
                    src={quote.logo_url}
                    alt={quote.company_name || "Company Logo"}
                    className="max-h-full max-w-full h-auto w-auto object-contain object-left"
                  />
                </div>
              )}
              {quote.company_name && (
                <div className="text-base font-bold text-slate-900 dark:text-white">
                  {quote.company_name}
                </div>
              )}
            </div>
          )}

          {/* Customer & Prepared By Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs grid grid-cols-1 sm:grid-cols-2 gap-6 print:border-none print:shadow-none print:p-0 print:rounded-none">
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 uppercase tracking-wider">
                <Building2 className="w-3.5 h-3.5 text-amber-600" />
                <span>Quotation For</span>
              </span>
              <div className="text-xs space-y-1 text-slate-600 dark:text-zinc-300">
                {quote.customer_name && <p className="font-semibold text-slate-900 dark:text-white text-sm">{quote.customer_name}</p>}
                {quote.customer_contact_person && <p>Contact: {quote.customer_contact_person} {quote.customer_contact_title ? `(${quote.customer_contact_title})` : ""}</p>}
                {quote.customer_email && <p>Email: {quote.customer_email}</p>}
                {quote.customer_phone && <p>Phone: {quote.customer_phone}</p>}
                {quote.customer_billing_address && <p className="text-slate-400 whitespace-pre-line pt-1">{quote.customer_billing_address}</p>}
                {!quote.customer_name && !quote.customer_contact_person && !quote.customer_email && (
                  <p className="text-slate-400 italic">—</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 uppercase tracking-wider">
                <User className="w-3.5 h-3.5 text-amber-600" />
                <span>Prepared By</span>
              </span>
              <div className="text-xs space-y-1 text-slate-600 dark:text-zinc-300">
                {quote.company_name && <p className="text-slate-900 dark:text-white font-medium"><span className="text-slate-500 font-normal">Company:</span> {quote.company_name}</p>}
                {quote.prepared_by_name && <p className="font-semibold text-slate-900 dark:text-white text-sm"><span className="text-slate-500 font-normal">Prepared By:</span> {quote.prepared_by_name}</p>}
                {quote.prepared_by_email && <p>Email: {quote.prepared_by_email}</p>}
                {!quote.prepared_by_name && !quote.prepared_by_email && !quote.company_name && (
                  <p className="text-slate-400 italic">—</p>
                )}
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden print:border-none print:shadow-none print:rounded-none print:p-0">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between print:px-0">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-wider">
                <FileSpreadsheet className="w-4 h-4 text-amber-600" />
                <span>Line Items ({quote.line_items?.length || 0})</span>
              </h3>
            </div>

            <div className="overflow-x-auto print:overflow-visible">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-slate-500 font-medium print:bg-[#f8f9fa] print:text-slate-900 uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4 font-bold text-left w-[40%]">Item &amp; Description</th>
                    <th className="py-3 px-3 text-right font-bold w-[14%]">Unit Price</th>
                    <th className="py-3 px-2 text-center font-bold w-[10%]">Currency</th>
                    <th className="py-3 px-2 text-center font-bold w-[8%]">Qty</th>
                    <th className="py-3 px-3 text-center font-bold w-[10%]">Discount</th>
                    <th className="py-3 px-4 text-right font-bold w-[18%]">Net Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 print:divide-slate-200 text-[12px]">
                  {quote.line_items?.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No line items recorded for this quotation.
                      </td>
                    </tr>
                  ) : (
                    quote.line_items?.map((item: any, i: number) => {
                      const isLineRenewal = isRenewalQuote || !!item.is_renewal || item.badge === "Renewal";
                      const pricing = calculateRowPricing({
                        quantity: item.quantity !== undefined && item.quantity !== null && item.quantity !== "" ? item.quantity : 1,
                        unit_price: item.price !== undefined && item.price !== null && item.price !== "" ? item.price : (item.unit_price || 0),
                        unit_discount: item.unit_discount ?? 0,
                        discount_type: item.discount_type || "%",
                        billing_frequency: item.billing_frequency || item.billing_type || "",
                        term: item.term ?? 1,
                        billing_start_date: item.billing_start_date || item.service_period_start || "",
                        tax_rate: item.tax_rate ?? 0,
                        is_renewal: isLineRenewal,
                        is_prorated: isLineRenewal ? false : item.is_prorated,
                        quote_type: quote.quote_type || (isRenewalQuote ? "RENEWAL" : "STANDARD"),
                      });
                      const formulaStr = isLineRenewal ? pricing.formulaString : (item.calculation || pricing.formulaString);
                      const displaySubtotal = isLineRenewal ? pricing.amount : (Number(item.subtotal) || pricing.amount);

                      return (
                        <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <td className="py-3 px-4 align-top">
                            <div className="font-semibold text-slate-900 dark:text-white text-[12.5px]">{item.name || "—"}</div>
                            {item.description && (
                              <div className="text-[11px] text-slate-500 mt-0.5 whitespace-pre-line leading-relaxed">{item.description}</div>
                            )}
                            {pricing.isProrated && pricing.proratedNote && (
                              <div className="text-[10.5px] text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded font-medium inline-flex items-center gap-1 mt-1">
                                <span>ℹ️ {pricing.proratedNote}</span>
                              </div>
                            )}
                            {isLineRenewal && (
                              <div className="text-[10.5px] text-indigo-800 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 px-2 py-0.5 rounded font-semibold inline-flex items-center gap-1 mt-1">
                                <span>🔄 Annual Renewal Term (Full Catalogue Price)</span>
                              </div>
                            )}
                            {(item.billing_frequency || item.term || (item.tax_rate !== "" && item.tax_rate !== undefined && Number(item.tax_rate) > 0) || item.status === "Paid" || item.service_status === "Paid" || isPaid) && (
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[10.5px] text-slate-500">
                                {(item.status === "Paid" || item.service_status === "Paid" || isPaid) && (
                                  <Badge className="text-[9.5px] px-1.5 py-0 bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 font-semibold">
                                    Paid
                                  </Badge>
                                )}
                                {item.billing_frequency && (
                                  <span className="inline-flex items-center gap-1 font-medium">
                                    <span className="text-slate-400 font-normal">Frequency:</span>
                                    <Badge variant="outline" className="text-[9.5px] px-1.5 py-0">
                                      {item.billing_frequency}
                                    </Badge>
                                  </span>
                                )}
                                {item.term && (
                                  <span className="inline-flex items-center gap-1">
                                    <span className="text-slate-400 font-normal">Term:</span>
                                    <span className="font-medium text-slate-700 dark:text-zinc-300">
                                      {item.term} {typeof item.term === "number" || !isNaN(Number(item.term)) ? (Number(item.term) === 1 ? "month" : "months") : ""}
                                    </span>
                                  </span>
                                )}
                                {item.tax_rate !== "" && item.tax_rate !== undefined && Number(item.tax_rate) > 0 && (
                                  <span className="inline-flex items-center gap-1">
                                    <span className="text-slate-400 font-normal">Tax Rate:</span>
                                    <span className="font-medium text-slate-700 dark:text-zinc-300">{item.tax_rate}%</span>
                                  </span>
                                )}
                              </div>
                            )}
                            {formulaStr && (
                              <div className="mt-1 font-mono text-[10px] text-slate-500 bg-slate-50 dark:bg-slate-800/60 px-2 py-0.5 rounded inline-block border border-slate-200/60 dark:border-slate-700/50">
                                {formulaStr}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-slate-700 dark:text-zinc-300 align-top">
                            ${Number(item.price || 0).toFixed(2)}
                          </td>
                          <td className="py-3 px-2 text-center font-mono align-top text-slate-800 dark:text-zinc-200 font-semibold">
                            {item.currency || quote.currency || "USD"}
                          </td>
                          <td className="py-3 px-2 text-center font-mono text-slate-700 dark:text-zinc-300 align-top">
                            {item.quantity}
                          </td>
                          <td className="py-3 px-3 text-center align-top font-mono text-slate-700 dark:text-zinc-300">
                            {Number(item.unit_discount || 0) > 0 ? (
                              <span className="text-emerald-600 font-medium">
                                {item.unit_discount}{item.discount_type === "$" ? "$" : "%"}
                              </span>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white align-top">
                            ${displaySubtotal.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Financial Summary */}
            <div className="p-4 bg-slate-50/50 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800 flex justify-end print:bg-white print:border-slate-200">
              <div className="w-64 space-y-2 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal</span>
                  <span className="font-mono font-medium">${effectiveSubtotal.toFixed(2)}</span>
                </div>
                {effectiveDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount</span>
                    <span className="font-mono">- ${effectiveDiscount.toFixed(2)}</span>
                  </div>
                )}
                {effectiveTax > 0 && (
                  <div className="flex justify-between text-slate-500">
                    <span>Tax</span>
                    <span className="font-mono">+ ${effectiveTax.toFixed(2)}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between font-bold text-sm text-slate-900 dark:text-white">
                  <span>Total</span>
                  <span className="font-mono text-amber-600 dark:text-amber-400">
                    ${effectiveTotal.toFixed(2)} {quote.currency}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Closing Message, Notes & Sign-off Card */}
          {(quote.closing_message || quote.notes || quote.prepared_by_name) && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4 print:border-none print:shadow-none print:p-0 print:space-y-3">
              {quote.closing_message && (
                <div className="text-xs text-slate-700 dark:text-zinc-300 whitespace-pre-line leading-relaxed">
                  {quote.closing_message}
                </div>
              )}
              {quote.notes && (
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                  <div className="font-semibold text-slate-900 dark:text-white mb-1">Notes &amp; Terms:</div>
                  <p className="whitespace-pre-line leading-relaxed">{quote.notes}</p>
                </div>
              )}
              <div className="space-y-0.5 pt-1 text-xs">
                <div className="text-slate-500">Thank you,</div>
                <div className="font-bold text-slate-900 dark:text-white">{quote.prepared_by_name || "Steve Rhode"}</div>
                {quote.prepared_by_email && <div className="text-slate-500 font-mono text-[11px]">{quote.prepared_by_email}</div>}
              </div>
            </div>
          )}

          {/* Signature Verification Certificate */}
          {isSigned && (
            <div className="bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl p-5 space-y-4 print:bg-white print:border-slate-200 print:rounded-none">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                    Cryptographic Acceptance &amp; Signature Certificate
                  </h4>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                    Legally binding electronic signature verified with SHA-256 audit hashing.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-white dark:bg-slate-900 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/40 print:border-slate-200">
                <div className="space-y-1">
                  <span className="text-slate-400">Signer Name</span>
                  <p className="font-bold text-slate-900 dark:text-white">{quote.signer_name || "Customer"}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400">Signer Title / Designation</span>
                  <p className="font-medium text-slate-800 dark:text-zinc-200">{quote.signer_title || "Authorized Representative"}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400">Timestamp</span>
                  <p className="font-mono text-slate-800 dark:text-zinc-200">
                    {quote.signed_at ? new Date(quote.signed_at).toLocaleString() : "—"}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400">IP Address</span>
                  <p className="font-mono text-slate-800 dark:text-zinc-200">{quote.signed_ip || "127.0.0.1"}</p>
                </div>
                {quote.signed_document_hash && (
                  <div className="sm:col-span-2 space-y-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400">Document SHA-256 Hash</span>
                    <p className="font-mono text-[10px] text-slate-600 dark:text-zinc-400 break-all bg-slate-50 dark:bg-slate-800 p-2 rounded-lg">
                      {quote.signed_document_hash}
                    </p>
                  </div>
                )}
                {quote.signature_data_url && (
                  <div className="sm:col-span-2 space-y-1 pt-1">
                    <span className="text-slate-400">Handwritten Signature</span>
                    <div className="p-3 bg-white border border-slate-200 rounded-xl max-w-sm">
                      <img
                        src={quote.signature_data_url}
                        alt="Customer Signature"
                        className="max-h-20 h-auto w-auto object-contain"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Customer Change Request Notice */}
          {isChanges && quote.change_request_message && (
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-2xl p-5 space-y-2 print:hidden">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs">
                <XCircle className="w-4 h-4 text-amber-600" />
                <span>Customer Requested Changes</span>
              </div>
              <p className="text-xs text-amber-900 dark:text-amber-200 bg-white dark:bg-slate-900 p-3 rounded-xl border border-amber-100 dark:border-amber-900/40">
                "{quote.change_request_message}"
              </p>
            </div>
          )}

          {/* Documents Required & Messages Thread */}
          <div className="print:hidden">
            <QuoteNotesThread
              quoteId={quote.id}
              authorType="SALES"
              defaultAuthorName={quote.prepared_by_name || "Sales Team"}
              defaultAuthorEmail={quote.prepared_by_email || ""}
            />
          </div>
        </div>
  );
}
