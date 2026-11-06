import { Info, Plus, Trash2 } from "lucide-react";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../components/ui/select";
import { calculateRowPricing, normalizeBillingFrequencyForSelect } from "../../utils/lineItemPricingUtils";
import { CurrencyAutocomplete } from "../../../Purchasing/fields/CurrencyAutocomplete";
import { ProductServiceAutocomplete } from "../../fields/ProductServiceAutocomplete";
import type { GenerateQuotePageState } from "../hooks/useGenerateQuotePage";

export function LineItemsTable({ s }: { s: GenerateQuotePageState }) {
  const { formatCurrency, currency, quoteType, lineItems, handleAddLineItem, handleRemoveLineItem, handleLineItemChange, clientCompanyName, customerId, handleClearLineItem, handleSelectProduct } = s;
  return (
    <div className="pt-2">
          {/* Screen Interactive Table */}
          <div className="print:hidden">
            <div className="overflow-x-auto border border-slate-200/90 rounded-xl bg-white shadow-2xs">
              <table className="w-full text-left border-collapse min-w-[980px]">
                <thead>
                  <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-900 text-[12px] font-bold">
                    <th className="py-2.5 px-3 font-bold min-w-[240px] text-left">Item &amp; Description</th>
                    <th className="py-2.5 px-2 font-bold w-24 min-w-[95px] text-left">Unit price</th>
                    <th className="py-2.5 px-2 font-bold w-28 min-w-[105px] text-left">Currency</th>
                    <th className="py-2.5 px-2 font-bold w-20 min-w-[75px] text-left">Quantity</th>
                    <th className="py-2.5 px-2 font-bold w-28 min-w-[110px] text-left">Unit discount</th>
                    <th className="py-2.5 px-2 font-bold w-36 min-w-[130px] text-left">Billing frequency</th>
                    <th className="py-2.5 px-2 font-bold w-20 min-w-[70px] text-left">Term</th>
                    <th className="py-2.5 px-2 font-bold w-24 min-w-[80px] text-left">
                      <span className="inline-flex items-center gap-1">
                        <span>Tax rate</span>
                        <Info className="w-3 h-3 text-slate-400" />
                      </span>
                    </th>
                    <th className="py-2.5 px-2 font-bold w-28 min-w-[110px] text-right">Net price</th>
                    <th className="py-2.5 px-1 w-8 print:hidden"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[12.5px]">
                  {lineItems.map((itm, i) => {
                    const isLineRenewal = quoteType === "RENEWAL" || !!itm.is_renewal;
                    const rowPricing = calculateRowPricing({
                      quantity: itm.quantity,
                      unit_price: itm.price,
                      unit_discount: itm.unit_discount,
                      discount_type: itm.discount_type,
                      billing_frequency: itm.billing_frequency,
                      term: itm.term,
                      billing_start_date: itm.billing_start_date,
                      tax_rate: itm.tax_rate,
                      is_renewal: isLineRenewal,
                      is_prorated: isLineRenewal ? false : itm.is_prorated,
                      quote_type: quoteType,
                    });

                    return (
                      <tr key={i} className="hover:bg-slate-50/50 group">
                        <td className="py-2 px-3 space-y-1.5 align-top">
                          <ProductServiceAutocomplete
                            id={`quote-line-name-${i}`}
                            name={`line_name_${i}`}
                            value={itm.name}
                            onChange={(val) => handleLineItemChange(i, "name", val)}
                            onSelectProduct={(product) => handleSelectProduct(i, product)}
                            onClear={() => handleClearLineItem(i)}
                            placeholder="Item name..."
                            companyId={customerId || clientCompanyName}
                            className="h-7 text-xs border-slate-200 focus:border-amber-500 bg-transparent px-2"
                          />
                          <textarea
                            id={`quote-line-desc-${i}`}
                            name={`line_desc_${i}`}
                            value={itm.description}
                            onChange={(e) => handleLineItemChange(i, "description", e.target.value)}
                            placeholder="Description (optional)..."
                            rows={1}
                            className="w-full text-[11px] font-light text-slate-600 border border-slate-200 focus:border-amber-500 rounded-md bg-transparent px-2 py-1 resize-y min-h-[28px] focus:outline-none leading-relaxed"
                          />
                          {rowPricing.isProrated && rowPricing.proratedNote && (
                            <div className="text-[10.5px] text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded font-medium inline-flex items-center gap-1 mt-0.5">
                              <span>ℹ️ {rowPricing.proratedNote}</span>
                            </div>
                          )}
                          {isLineRenewal && (
                            <div className="text-[10.5px] text-indigo-800 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 px-2 py-0.5 rounded font-semibold inline-flex items-center gap-1 mt-0.5">
                              <span>🔄 Annual Renewal Term (Full Catalogue Price)</span>
                            </div>
                          )}
                          {itm.calculation && (
                            <div className="text-[10.5px] text-slate-500 dark:text-slate-400 italic font-mono tracking-tight pl-0.5">
                              Formula: {itm.calculation}
                            </div>
                          )}
                        </td>
                        <td className="py-2 px-2 align-top">
                          <Input
                            id={`quote-line-price-${i}`}
                            name={`line_price_${i}`}
                            type="number"
                            step="0.01"
                            min="0"
                            value={itm.price}
                            onChange={(e) => handleLineItemChange(i, "price", e.target.value)}
                            placeholder="0.00"
                            className="h-7 text-xs text-left font-normal border-slate-200 focus:border-amber-500 bg-transparent px-2"
                          />
                        </td>
                        <td className="py-2 px-2 align-top">
                          <CurrencyAutocomplete
                            value={itm.currency || currency || "USD"}
                            onChange={(val) => handleLineItemChange(i, "currency", val)}
                            className="h-7 text-xs px-2"
                          />
                        </td>
                        <td className="py-2 px-2 align-top">
                          <Input
                            id={`quote-line-qty-${i}`}
                            name={`line_qty_${i}`}
                            type="number"
                            step="1"
                            min="1"
                            value={itm.quantity}
                            onChange={(e) => handleLineItemChange(i, "quantity", e.target.value)}
                            placeholder="1"
                            className="h-7 text-xs text-left font-normal border-slate-200 focus:border-amber-500 bg-transparent px-2"
                          />
                        </td>
                        <td className="py-2 px-2 align-top">
                          <div className="flex items-center rounded-md border border-slate-200 bg-white dark:bg-slate-900 focus-within:border-amber-500 overflow-hidden h-7">
                            <select
                              id={`quote-line-discount-type-${i}`}
                              name={`line_discount_type_${i}`}
                              value={itm.discount_type || "%"}
                              onChange={(e) => handleLineItemChange(i, "discount_type", e.target.value as "%" | "$")}
                              className="h-full bg-slate-50 dark:bg-slate-800 text-[11px] text-slate-700 dark:text-zinc-300 px-1 border-r border-slate-200 dark:border-slate-700 focus:outline-none cursor-pointer"
                            >
                              <option value="%">%</option>
                              <option value="$">$</option>
                            </select>
                            <input
                              id={`quote-line-discount-val-${i}`}
                              name={`line_discount_val_${i}`}
                              type="number"
                              step="0.01"
                              min="0"
                              value={itm.unit_discount}
                              onChange={(e) => handleLineItemChange(i, "unit_discount", e.target.value)}
                              placeholder="0"
                              className="w-full h-full text-xs text-left px-1.5 bg-transparent focus:outline-none"
                            />
                          </div>
                        </td>
                        <td className="py-2 px-2 align-top">
                          <Select
                            value={normalizeBillingFrequencyForSelect(itm.billing_frequency)}
                            onValueChange={(val) => handleLineItemChange(i, "billing_frequency", val === "none" ? "" : val)}
                          >
                            <SelectTrigger className="h-7 text-xs border-slate-200 focus:border-amber-500 bg-transparent px-2">
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 z-50">
                              <SelectItem value="none">Select...</SelectItem>
                              <SelectItem value="One-Time">One-Time</SelectItem>
                              <SelectItem value="Monthly">Monthly</SelectItem>
                              <SelectItem value="Annually">Annually</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="py-2 px-2 align-top">
                          <Input
                            id={`quote-line-term-${i}`}
                            name={`line_term_${i}`}
                            type="number"
                            step="1"
                            min="1"
                            value={itm.term}
                            onChange={(e) => handleLineItemChange(i, "term", e.target.value)}
                            placeholder="1"
                            className="h-7 text-xs text-left font-normal border-slate-200 focus:border-amber-500 bg-transparent px-2"
                          />
                        </td>
                        <td className="py-2 px-2 align-top">
                          <div className="flex items-center rounded-md border border-slate-200 bg-white dark:bg-slate-900 focus-within:border-amber-500 overflow-hidden h-7">
                            <input
                              id={`quote-line-tax-rate-${i}`}
                              name={`line_tax_rate_${i}`}
                              type="number"
                              step="0.01"
                              min="0"
                              value={itm.tax_rate}
                              onChange={(e) => handleLineItemChange(i, "tax_rate", e.target.value)}
                              placeholder="0"
                              className="w-full h-full text-xs text-left px-1.5 bg-transparent focus:outline-none"
                            />
                            <span className="text-[10px] text-slate-400 px-1">%</span>
                          </div>
                        </td>
                        <td className="py-2 px-2 align-top">
                          <Input
                            id={`quote-line-subtotal-${i}`}
                            name={`line_subtotal_${i}`}
                            type="number"
                            step="0.01"
                            min="0"
                            value={itm.subtotal !== undefined ? itm.subtotal : ""}
                            onChange={(e) => handleLineItemChange(i, "subtotal", e.target.value)}
                            placeholder="0.00"
                            className="h-7 text-xs text-right font-mono font-bold border-slate-200 focus:border-amber-500 bg-transparent px-2"
                          />
                        </td>
                        <td className="py-2 px-1 text-center align-top pt-2 print:hidden">
                          <button
                            type="button"
                            onClick={() => handleRemoveLineItem(i)}
                            className="p-1 text-slate-300 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            title="Remove item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleAddLineItem}
                className="text-xs text-amber-700 hover:bg-amber-50 gap-1.5 h-7 px-2 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Line Item</span>
              </Button>
            </div>
          </div>

          {/* Print Mode: Clean Document Table (Fits 100% of printable page width) */}
          <div className="hidden print:block overflow-hidden border-t border-b border-slate-300">
            <table className="w-full text-left border-collapse text-[11.5px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-300 text-slate-900 font-bold uppercase tracking-wider text-[10.5px]">
                  <th className="py-2.5 px-3 font-bold text-left w-[40%]">Item &amp; Description</th>
                  <th className="py-2.5 px-2.5 font-bold text-right w-[14%]">Unit Price</th>
                  <th className="py-2.5 px-2 font-bold text-center w-[10%]">Currency</th>
                  <th className="py-2.5 px-2 text-center font-bold w-[8%]">Qty</th>
                  <th className="py-2.5 px-2.5 text-center font-bold w-[10%]">Discount</th>
                  <th className="py-2.5 px-3 font-bold text-right w-[18%]">Net Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {lineItems.map((itm, i) => {
                  const isLineRenewal = quoteType === "RENEWAL" || !!itm.is_renewal;
                  const printPricing = calculateRowPricing({
                    quantity: itm.quantity,
                    unit_price: itm.price,
                    unit_discount: itm.unit_discount,
                    discount_type: itm.discount_type,
                    billing_frequency: itm.billing_frequency,
                    term: itm.term,
                    billing_start_date: itm.billing_start_date,
                    tax_rate: itm.tax_rate,
                    is_renewal: isLineRenewal,
                    is_prorated: isLineRenewal ? false : itm.is_prorated,
                    quote_type: quoteType,
                  });

                  return (
                    <tr key={i}>
                      <td className="py-2.5 px-3 align-top">
                        <div className="font-semibold text-slate-900 text-[12px]">{itm.name || `Item ${i + 1}`}</div>
                        {itm.description && (
                          <div className="text-[10.5px] text-slate-600 mt-0.5 whitespace-pre-line leading-relaxed">
                            {itm.description}
                          </div>
                        )}
                        {printPricing.isProrated && printPricing.proratedNote && (
                          <div className="text-[10px] text-amber-800 font-medium italic mt-0.5">
                            ℹ️ {printPricing.proratedNote}
                          </div>
                        )}
                        {(itm.billing_frequency || itm.term || (itm.tax_rate !== "" && itm.tax_rate !== undefined && Number(itm.tax_rate) > 0)) && (
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[10px] text-slate-600 print:text-slate-700">
                            {itm.billing_frequency && (
                              <span className="inline-flex items-center gap-1 font-medium">
                                <span className="text-slate-500 font-normal">Frequency:</span>
                                <span className="px-1.5 py-0.2 bg-slate-100 rounded text-slate-800 border border-slate-300 font-semibold text-[9.5px]">
                                  {itm.billing_frequency}
                                </span>
                              </span>
                            )}
                            {itm.term && (
                              <span className="inline-flex items-center gap-1">
                                <span className="text-slate-500 font-normal">Term:</span>
                                <span className="font-medium text-slate-800">
                                  {itm.term} {typeof itm.term === "number" || !isNaN(Number(itm.term)) ? (Number(itm.term) === 1 ? "month" : "months") : ""}
                                </span>
                              </span>
                            )}
                            {itm.tax_rate !== "" && itm.tax_rate !== undefined && Number(itm.tax_rate) > 0 && (
                              <span className="inline-flex items-center gap-1">
                                <span className="text-slate-500 font-normal">Tax Rate:</span>
                                <span className="font-medium text-slate-800">{itm.tax_rate}%</span>
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-2.5 text-right font-mono align-top text-slate-800">
                        ${(Number(itm.price) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono align-top text-slate-800 font-semibold">
                        {itm.currency || currency || "USD"}
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono align-top text-slate-800">
                        {itm.quantity !== "" && itm.quantity !== undefined ? itm.quantity : 1}
                      </td>
                      <td className="py-2.5 px-2.5 text-center align-top text-slate-800 font-mono">
                        {Number(itm.unit_discount) > 0 ? `${itm.unit_discount}${itm.discount_type || "%"}` : "—"}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold align-top text-slate-900">
                        {formatCurrency(itm.subtotal || 0)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
  );
}
