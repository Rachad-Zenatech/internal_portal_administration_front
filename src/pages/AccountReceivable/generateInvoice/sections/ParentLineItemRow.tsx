import { Fragment } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Plus, Trash2 } from "lucide-react";
import { Button } from "../../../../components/ui/button";
import { Badge } from "../../../../components/ui/badge";
import { Input } from "../../../../components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "../../../../components/ui/popover";
import { Calendar } from "../../../../components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../components/ui/select";
import { CurrencyAutocomplete } from "../../../Purchasing/fields/CurrencyAutocomplete";
import { ProductServiceAutocomplete } from "../../fields/ProductServiceAutocomplete";
import { BillingStartDatePicker } from "../../fields/BillingStartDatePicker";
import { normalizeBillingFrequencyForSelect } from "../../utils/lineItemPricingUtils";
import type { GenerateInvoiceState } from "../hooks/useGenerateInvoice";

export function ParentLineItemRow({ s }: { s: GenerateInvoiceState }) {
  const { handleRemoveSubItem, handleUpdateSubItem, currency, selectedCustomer, handleSelectSubProduct, parseFlexibleDate, computeItemProration, invoiceDate, lineItems, handleRemoveLine, handleAddSubItem, handleUpdateLine, handleSelectProduct } = s;
  return (
    <>
      {lineItems.map((item, idx) => {
                    const isItemPaid = (item.status === "Paid" || item.service_status === "Paid") && item.status !== "Unpaid" && item.service_status !== "Unpaid";
                    const effectiveStartDate = item.billing_start_date || item.date || invoiceDate;
                    const parentProration = computeItemProration(
                      item.quantity,
                      item.unit_price,
                      item.unit_discount,
                      item.discount_type,
                      item.billing_frequency,
                      effectiveStartDate,
                      item.tax_rate,
                      item.term,
                      isItemPaid
                    );

                    return (
                      <Fragment key={item.id || idx}>
                        {/* Parent Line Item Row */}
                        <tr className="hover:bg-muted/30 transition-colors group">
                          {/* Date Picker */}
                          <td className="py-2 px-2.5 align-top">
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  type="button"
                                  variant="outline"
                                  className="w-full h-7 justify-start text-left font-normal text-xs px-2 bg-card hover:bg-muted border-input cursor-pointer"
                                >
                                  <CalendarIcon className="mr-1 h-3 w-3 text-muted-foreground shrink-0" />
                                  <span className="truncate font-medium text-foreground">
                                    {item.date || "Select"}
                                  </span>
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-3" align="start">
                                <div className="space-y-2">
                                  <Calendar
                                    mode="single"
                                    selected={item.date ? parseFlexibleDate(item.date) : undefined}
                                    onSelect={(date) => {
                                      handleUpdateLine(
                                        idx,
                                        "date",
                                        date ? format(date, "MM/dd/yyyy") : ""
                                      );
                                    }}
                                  />
                                  <div className="flex items-center justify-between border-t border-border pt-2 gap-1 text-[11px]">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        handleUpdateLine(
                                          idx,
                                          "date",
                                          format(new Date(), "MM/dd/yyyy")
                                        )
                                      }
                                      className="h-6 text-[11px] px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 cursor-pointer"
                                    >
                                      Today
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleUpdateLine(idx, "date", "")}
                                      className="h-6 text-[11px] px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
                                    >
                                      Clear Date
                                    </Button>
                                  </div>
                                </div>
                              </PopoverContent>
                            </Popover>
                          </td>

                          {/* Activity Name & Description */}
                          <td className="py-2 px-3 space-y-1 align-top">
                            <div className="flex items-center gap-1.5">
                              <ProductServiceAutocomplete
                                value={item.activity || item.name || ""}
                                onChange={(val) => {
                                  handleUpdateLine(idx, "activity", val);
                                  handleUpdateLine(idx, "name", val);
                                }}
                                onSelectProduct={(product) => handleSelectProduct(idx, product)}
                                placeholder="Item name..."
                                companyId={selectedCustomer?.hubspot_id || selectedCustomer?.name || selectedCustomer?.id}
                                className="text-xs h-7 font-medium flex-1"
                              />
                              {isItemPaid ? (
                                <Badge className="text-[9.5px] px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-700 font-bold shrink-0">
                                  Paid
                                </Badge>
                              ) : (
                                <Badge className="text-[9.5px] px-1.5 py-0.5 bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-700 font-bold shrink-0">
                                  Unpaid
                                </Badge>
                              )}
                              {item.billing_frequency && item.billing_frequency !== "One-Time" && item.billing_frequency !== "none" ? (
                                parentProration.isProrated ? (
                                  <Badge className="text-[9px] px-1.5 py-0 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 shrink-0">
                                    Prorated
                                  </Badge>
                                ) : (
                                  <Badge className="text-[9px] px-1.5 py-0 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border-indigo-200 shrink-0">
                                    Recurring
                                  </Badge>
                                )
                              ) : (
                                <Badge className="text-[9px] px-1.5 py-0 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 shrink-0">
                                  One-Time
                                </Badge>
                              )}
                            </div>
                            <textarea
                              value={item.description}
                              onChange={(e) =>
                                handleUpdateLine(idx, "description", e.target.value)
                              }
                              placeholder="Description..."
                              rows={1}
                              className="w-full text-[11px] text-muted-foreground border border-input rounded-md bg-transparent px-2 py-1 resize-y min-h-[28px] focus:outline-none focus:border-blue-500 leading-relaxed"
                            />
                            {parentProration.isProrated && parentProration.proratedNote && (
                              <div className="text-[10.5px] text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded font-medium inline-flex items-center gap-1 mt-0.5">
                                <span>ℹ️ {parentProration.proratedNote}</span>
                              </div>
                            )}
                            {item.service_period && (
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-indigo-600 dark:text-indigo-400 font-medium pt-0.5 leading-snug">
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
                              <div className="text-[11px] text-blue-600 dark:text-blue-400 italic font-mono mt-0.5 tracking-tight break-words">
                                Formula: {parentProration.formulaString || item.calculation}
                              </div>
                            )}
                          </td>

                          {/* Unit Price */}
                          <td className="py-2 px-2 align-top">
                            <Input
                              type="number"
                              step="0.01"
                              value={item.unit_price ?? ""}
                              onChange={(e) => handleUpdateLine(idx, "unit_price", e.target.value)}
                              placeholder="0.00"
                              className="text-xs h-7 font-mono text-left px-2"
                            />
                          </td>

                          {/* Currency */}
                          <td className="py-2 px-2 align-top">
                            <CurrencyAutocomplete
                              value={item.currency || currency || "USD"}
                              onChange={(val) => handleUpdateLine(idx, "currency", val)}
                              className="h-7 text-xs px-2"
                            />
                          </td>

                          {/* Quantity */}
                          <td className="py-2 px-2 align-top">
                            <Input
                              type="number"
                              step="1"
                              min="1"
                              value={item.quantity ?? ""}
                              onChange={(e) => handleUpdateLine(idx, "quantity", e.target.value)}
                              placeholder="1"
                              className="text-xs h-7 font-mono text-left px-2"
                            />
                          </td>

                          {/* Unit Discount */}
                          <td className="py-2 px-2 align-top">
                            <div className="flex items-center rounded-md border border-input bg-card focus-within:border-blue-500 overflow-hidden h-7">
                              <select
                                value={item.discount_type || "%"}
                                onChange={(e) => handleUpdateLine(idx, "discount_type", e.target.value as "%" | "$")}
                                className="h-full bg-muted/60 text-[11px] text-foreground px-1 border-r border-border focus:outline-none cursor-pointer"
                              >
                                <option value="%">%</option>
                                <option value="$">$</option>
                              </select>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={item.unit_discount ?? ""}
                                onChange={(e) => handleUpdateLine(idx, "unit_discount", e.target.value)}
                                placeholder="0"
                                className="w-full h-full text-xs text-left px-1.5 bg-transparent focus:outline-none font-mono"
                              />
                            </div>
                          </td>

                          {/* Billing Frequency */}
                          <td className="py-2 px-2 align-top">
                            <Select
                              value={normalizeBillingFrequencyForSelect(item.billing_frequency || item.billing_type)}
                              onValueChange={(val) => handleUpdateLine(idx, "billing_frequency", val === "none" ? "" : val)}
                            >
                              <SelectTrigger className="h-7 text-xs border-input bg-card px-2">
                                <SelectValue placeholder="Select..." />
                              </SelectTrigger>
                              <SelectContent className="bg-popover border-border z-50">
                                <SelectItem value="none">Select...</SelectItem>
                                <SelectItem value="One-Time">One-Time</SelectItem>
                                <SelectItem value="Monthly">Monthly</SelectItem>
                                <SelectItem value="Annually">Annually</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>

                          {/* Term */}
                          <td className="py-2 px-2 align-top">
                            <Input
                              type="number"
                              step="1"
                              min="1"
                              value={item.term ?? ""}
                              onChange={(e) => handleUpdateLine(idx, "term", e.target.value)}
                              placeholder="1"
                              className="h-7 text-xs text-left font-normal border-input bg-card px-2"
                            />
                          </td>

                          {/* Billing Start Date */}
                          <td className="py-2 px-2 align-top">
                            <BillingStartDatePicker
                              value={item.billing_start_date || ""}
                              onChange={(val) => handleUpdateLine(idx, "billing_start_date", val)}
                              size="xs"
                            />
                          </td>

                          {/* Tax Rate */}
                          <td className="py-2 px-2 align-top">
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.tax_rate ?? ""}
                              onChange={(e) => handleUpdateLine(idx, "tax_rate", e.target.value)}
                              placeholder="0%"
                              className="h-7 text-xs text-left font-mono border-input bg-card px-2"
                            />
                          </td>

                          {/* Net Price / Amount */}
                          <td className="py-2 px-2 align-top">
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.total !== undefined && item.total !== "" ? item.total : parentProration.amount}
                              onChange={(e) => handleUpdateLine(idx, "total", e.target.value)}
                              placeholder="0.00"
                              className="h-7 text-xs text-right font-mono font-bold border-input bg-card px-2"
                            />
                          </td>

                          {/* Actions: Add Sub-item & Delete */}
                          <td className="py-2 px-2 text-center align-top pt-1.5">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleAddSubItem(idx)}
                                className="h-7 w-7 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg cursor-pointer"
                                title="Add prorated charge or sub-service under this item"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveLine(idx)}
                                disabled={lineItems.length <= 1}
                                className="h-7 w-7 text-muted-foreground hover:text-red-600 disabled:opacity-30 cursor-pointer"
                                title="Delete line item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>

                        {/* Indented Sub-items / Prorated Charges under this parent activity */}
                        {item.sub_items && item.sub_items.map((sub, sIdx) => {
                          const isSubPaid = (sub.status === "Paid" || sub.service_status === "Paid") && sub.status !== "Unpaid" && sub.service_status !== "Unpaid";
                          const effectiveSubDate = sub.billing_start_date || sub.date || item.billing_start_date || item.date || invoiceDate;
                          const subProration = computeItemProration(
                            sub.quantity,
                            sub.unit_price,
                            sub.unit_discount,
                            sub.discount_type,
                            sub.billing_frequency,
                            effectiveSubDate,
                            sub.tax_rate,
                            sub.term,
                            isSubPaid
                          );
                          const activeFormula = subProration.formulaString || sub.calculation;

                          return (
                            <tr key={sub.id || sIdx} className="bg-blue-50/20 dark:bg-blue-950/10 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-colors border-l-2 border-l-blue-500">
                              {/* Sub-item Date Picker */}
                              <td className="py-1.5 px-2.5 align-top">
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      className="w-full h-6 justify-start text-left font-normal text-[11px] px-1.5 bg-card hover:bg-muted border-input cursor-pointer"
                                    >
                                      <CalendarIcon className="mr-1 h-3 w-3 text-muted-foreground shrink-0" />
                                      <span className="truncate font-medium text-foreground">
                                        {sub.date || "Select"}
                                      </span>
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-3" align="start">
                                    <div className="space-y-2">
                                      <Calendar
                                        mode="single"
                                        selected={sub.date ? parseFlexibleDate(sub.date) : undefined}
                                        onSelect={(date) => {
                                          handleUpdateSubItem(
                                            idx,
                                            sIdx,
                                            "date",
                                            date ? format(date, "MM/dd/yyyy") : ""
                                          );
                                        }}
                                      />
                                      <div className="flex items-center justify-between border-t border-border pt-2 gap-1 text-[11px]">
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() =>
                                            handleUpdateSubItem(
                                              idx,
                                              sIdx,
                                              "date",
                                              format(new Date(), "MM/dd/yyyy")
                                            )
                                          }
                                          className="h-6 text-[11px] px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 cursor-pointer"
                                        >
                                          Today
                                        </Button>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleUpdateSubItem(idx, sIdx, "date", "")}
                                          className="h-6 text-[11px] px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
                                        >
                                          Clear Date
                                        </Button>
                                      </div>
                                    </div>
                                  </PopoverContent>
                                </Popover>
                              </td>

                              {/* Sub-item Activity Name & Description with Tree Indicator */}
                              <td className="py-1.5 px-3 align-top space-y-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-blue-500 font-mono text-xs leading-none shrink-0">└──</span>
                                  <ProductServiceAutocomplete
                                    value={sub.activity || sub.name || ""}
                                    onChange={(val) => {
                                      handleUpdateSubItem(idx, sIdx, "activity", val);
                                      handleUpdateSubItem(idx, sIdx, "name", val);
                                    }}
                                    onSelectProduct={(product) => handleSelectSubProduct(idx, sIdx, product)}
                                    placeholder="Prorated charge / sub-item name..."
                                    companyId={selectedCustomer?.hubspot_id || selectedCustomer?.name || selectedCustomer?.id}
                                    className="text-xs h-6 font-medium bg-card flex-1"
                                  />
                                  {isSubPaid ? (
                                    <Badge className="text-[9px] px-1.5 py-0 bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-700 font-bold shrink-0">
                                      Paid
                                    </Badge>
                                  ) : (
                                    <Badge className="text-[9px] px-1.5 py-0 bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-700 font-bold shrink-0">
                                      Unpaid
                                    </Badge>
                                  )}
                                  {sub.billing_frequency && sub.billing_frequency !== "One-Time" && sub.billing_frequency !== "none" ? (
                                    subProration.isProrated ? (
                                      <Badge className="text-[9px] px-1.5 py-0 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 shrink-0">
                                        Prorated
                                      </Badge>
                                    ) : (
                                      <Badge className="text-[9px] px-1.5 py-0 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border-indigo-200 shrink-0">
                                        Recurring
                                      </Badge>
                                    )
                                  ) : (
                                    <Badge className="text-[9px] px-1.5 py-0 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 shrink-0">
                                      One-Time
                                    </Badge>
                                  )}
                                  {sub.is_reference_only && (
                                    <Badge className="text-[9px] px-1.5 py-0 bg-amber-100 text-amber-800 border-amber-200 shrink-0">
                                      Ref Only
                                    </Badge>
                                  )}
                                </div>
                                <div className="pl-4 space-y-0.5">
                                  <textarea
                                    value={sub.description}
                                    onChange={(e) => handleUpdateSubItem(idx, sIdx, "description", e.target.value)}
                                    placeholder="Description..."
                                    rows={1}
                                    className="w-full text-[11px] text-muted-foreground border border-input rounded bg-card px-2 py-0.5 resize-y min-h-[24px] focus:outline-none focus:border-blue-500 leading-relaxed"
                                  />
                                  {subProration.isProrated && subProration.proratedNote && (
                                    <div className="text-[10.5px] text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded font-medium inline-flex items-center gap-1 mt-0.5">
                                      <span>ℹ️ {subProration.proratedNote}</span>
                                    </div>
                                  )}
                                  {sub.service_period && (
                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-indigo-600 dark:text-indigo-400 font-medium pt-0.5 leading-snug">
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
                                    <div className="text-[11px] text-blue-600 dark:text-blue-400 italic font-mono tracking-tight break-words">
                                      Formula: {activeFormula}
                                    </div>
                                  )}
                                </div>
                              </td>

                          {/* Sub-item Unit Price */}
                          <td className="py-1.5 px-2 align-top">
                            <Input
                              type="number"
                              step="0.01"
                              value={sub.unit_price ?? ""}
                              onChange={(e) => handleUpdateSubItem(idx, sIdx, "unit_price", e.target.value)}
                              placeholder="0.00"
                              className="text-xs h-6 font-mono text-left px-1.5 bg-card"
                            />
                          </td>

                          {/* Sub-item Currency */}
                          <td className="py-1.5 px-2 align-top">
                            <CurrencyAutocomplete
                              value={sub.currency || item.currency || currency || "USD"}
                              onChange={(val) => handleUpdateSubItem(idx, sIdx, "currency", val)}
                              className="h-6 text-[11px] px-1.5"
                            />
                          </td>

                          {/* Sub-item Quantity */}
                          <td className="py-1.5 px-2 align-top">
                            <Input
                              type="number"
                              step="1"
                              min="1"
                              value={sub.quantity ?? ""}
                              onChange={(e) => handleUpdateSubItem(idx, sIdx, "quantity", e.target.value)}
                              placeholder="1"
                              className="text-xs h-6 font-mono text-left px-1.5 bg-card"
                            />
                          </td>

                          {/* Sub-item Unit Discount */}
                          <td className="py-1.5 px-2 align-top">
                            <div className="flex items-center rounded-md border border-input bg-card focus-within:border-blue-500 overflow-hidden h-6">
                              <select
                                value={sub.discount_type || "%"}
                                onChange={(e) => handleUpdateSubItem(idx, sIdx, "discount_type", e.target.value as "%" | "$")}
                                className="h-full bg-muted/60 text-[10px] text-foreground px-1 border-r border-border focus:outline-none cursor-pointer"
                              >
                                <option value="%">%</option>
                                <option value="$">$</option>
                              </select>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={sub.unit_discount ?? ""}
                                onChange={(e) => handleUpdateSubItem(idx, sIdx, "unit_discount", e.target.value)}
                                placeholder="0"
                                className="w-full h-full text-[11px] text-left px-1 bg-transparent focus:outline-none font-mono"
                              />
                            </div>
                          </td>

                          {/* Sub-item Billing Frequency */}
                          <td className="py-1.5 px-2 align-top">
                            <Select
                              value={normalizeBillingFrequencyForSelect(sub.billing_frequency || sub.billing_type)}
                              onValueChange={(val) => handleUpdateSubItem(idx, sIdx, "billing_frequency", val === "none" ? "" : val)}
                            >
                              <SelectTrigger className="h-6 text-[11px] border-input bg-card px-1.5">
                                <SelectValue placeholder="Select..." />
                              </SelectTrigger>
                              <SelectContent className="bg-popover border-border z-50">
                                <SelectItem value="none">Select...</SelectItem>
                                <SelectItem value="One-Time">One-Time</SelectItem>
                                <SelectItem value="Monthly">Monthly</SelectItem>
                                <SelectItem value="Annually">Annually</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>

                          {/* Sub-item Term */}
                          <td className="py-1.5 px-2 align-top">
                            <Input
                              type="number"
                              step="1"
                              min="1"
                              value={sub.term ?? ""}
                              onChange={(e) => handleUpdateSubItem(idx, sIdx, "term", e.target.value)}
                              placeholder="1"
                              className="h-6 text-[11px] text-left font-normal border-input bg-card px-1.5"
                            />
                          </td>

                          {/* Sub-item Billing Start Date */}
                          <td className="py-1.5 px-2 align-top">
                            <BillingStartDatePicker
                              value={sub.billing_start_date || ""}
                              onChange={(val) => handleUpdateSubItem(idx, sIdx, "billing_start_date", val)}
                              size="xs"
                            />
                          </td>

                          {/* Sub-item Tax Rate */}
                          <td className="py-1.5 px-2 align-top">
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={sub.tax_rate ?? ""}
                              onChange={(e) => handleUpdateSubItem(idx, sIdx, "tax_rate", e.target.value)}
                              placeholder="0%"
                              className="h-6 text-[11px] text-left font-mono border-input bg-card px-1.5"
                            />
                          </td>

                          {/* Sub-item Total */}
                          <td className="py-1.5 px-2 align-top">
                            {sub.is_reference_only ? (
                              <div className="text-[10px] text-muted-foreground italic font-normal text-right pt-1 px-1.5">
                                Ref: ${(Number(sub.reference_amount) || (sub.total !== undefined && sub.total !== "" ? Number(sub.total) : subProration.amount)).toFixed(2)}
                              </div>
                            ) : (
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={sub.total !== undefined && sub.total !== "" ? sub.total : subProration.amount}
                                onChange={(e) => handleUpdateSubItem(idx, sIdx, "total", e.target.value)}
                                placeholder="0.00"
                                className="h-6 text-[11px] text-right font-mono font-bold border-input bg-card px-1.5"
                              />
                            )}
                          </td>

                          {/* Sub-item Delete Action */}
                          <td className="py-1.5 px-2 text-center align-top pt-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveSubItem(idx, sIdx)}
                              className="h-6 w-6 text-muted-foreground hover:text-red-600 cursor-pointer"
                              title="Delete sub-item"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
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
