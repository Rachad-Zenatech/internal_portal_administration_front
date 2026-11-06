import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Input } from "../../../../components/ui/input";
import { Label } from "../../../../components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "../../../../components/ui/popover";
import { Calendar } from "../../../../components/ui/calendar";
import { ARCustomerAutocomplete } from "../../fields/ARCustomerAutocomplete";
import { UserAutocomplete } from "../../fields/UserAutocomplete";
import { parseDateOnly, formatDateOnly } from "../../utils/lineItemPricingUtils";
import type { GenerateQuotePageState } from "../hooks/useGenerateQuotePage";

export function LeftColumnQuotationFor({ s }: { s: GenerateQuotePageState }) {
  const { preparedByEmail, preparedByName, quoteValidity, quoteNumber, quoteDate, setPreparedByEmail, setPreparedByName, setQuoteValidity, servicePeriodLabel, sourceInvoiceNumber, quoteType, setQuoteNumber, setIsDateOpen, setQuoteDate, isDateOpen, clientEmail, contactPerson, clientCompanyName, contactTitle, clientPhone, setClientEmail, setContactTitle, setContactPerson, setClientPhone, handleClientNameChange, handleSelectCustomerOption, customerSearch, customerId } = s;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-start pt-1">
          {/* Left Column: Quotation for: */}
          <div className="space-y-1.5 text-slate-900">
            {/* Screen Interactive Mode */}
            <div className="print:hidden space-y-1.5">
              <div className="font-bold text-[15px] mb-1 text-slate-900 flex items-center justify-between">
                <span>Quotation for:</span>
              </div>

              {/* Quick Customer Autocomplete Picker */}
              <div className="pb-1">
                <ARCustomerAutocomplete
                  customerId={customerId}
                  customerName={customerSearch || clientCompanyName}
                  onSelect={handleSelectCustomerOption}
                  className="w-full"
                />
              </div>

              <Input
                id="quote-client-company-name"
                name="clientCompanyName"
                value={clientCompanyName}
                onChange={(e) => handleClientNameChange(e.target.value)}
                placeholder="Client Company Name (e.g. JP Furniture)"
                className="h-7 text-[14px] font-medium border-slate-200 focus:border-amber-500 bg-transparent px-2"
              />

              <Input
                id="quote-client-phone"
                name="clientPhone"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                placeholder="Client Phone (e.g. [Client.Phone])"
                className="h-7 text-[14px] text-slate-700 border-slate-200 focus:border-amber-500 bg-transparent px-2"
              />

              <Input
                id="quote-contact-person"
                name="contactPerson"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="Contact Person (e.g. Jasper O. I)"
                className="h-7 text-[14px] border-slate-200 focus:border-amber-500 bg-transparent px-2"
              />

              <Input
                id="quote-contact-title"
                name="contactTitle"
                value={contactTitle}
                onChange={(e) => setContactTitle(e.target.value)}
                placeholder="Job Title (e.g. Senior Project Manager)"
                className="h-7 text-[14px] border-slate-200 focus:border-amber-500 bg-transparent px-2"
              />

              <Input
                id="quote-client-email"
                name="clientEmail"
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="Contact Email (e.g. jpchrisfurniture@gmail.com)"
                className="h-7 text-[14px] text-slate-700 border-slate-200 focus:border-amber-500 bg-transparent px-2"
              />
            </div>

            {/* Print Mode: Clean Document Typography */}
            <div className="hidden print:block space-y-1 text-slate-900">
              <div className="font-bold text-base mb-1.5">Quotation for:</div>
              {clientCompanyName && <div className="text-[14px] leading-snug font-semibold text-slate-900">{clientCompanyName}</div>}
              {clientPhone && <div className="text-[14px] leading-snug text-slate-700">{clientPhone}</div>}
              {contactPerson && <div className="text-[14px] leading-snug text-slate-800">{contactPerson}</div>}
              {contactTitle && <div className="text-[14px] leading-snug text-slate-700">{contactTitle}</div>}
              {clientEmail && <div className="text-[14px] leading-snug text-slate-700">{clientEmail}</div>}
              {!clientCompanyName && !contactPerson && !clientEmail && (
                <div className="text-[14px] text-slate-400 italic font-light">—</div>
              )}
            </div>
          </div>

          {/* Right Column: Date, Quotation No., Quote Validity, Prepared By */}
          <div className="space-y-2 text-slate-900 sm:pl-4">
            {/* Screen Interactive Mode */}
            <div className="print:hidden space-y-2">
              <div className="flex items-center gap-2 text-[14px]">
                <span className="font-bold w-32 shrink-0">Date</span>
                <Popover open={isDateOpen} onOpenChange={setIsDateOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="h-7 text-[14px] text-left border border-slate-200 hover:border-amber-500 focus:border-amber-500 rounded-md bg-transparent px-2 flex-1 flex items-center justify-between text-slate-900 cursor-pointer font-normal"
                    >
                      <span>{quoteDate || format(new Date(), "MM / dd / yyyy")}</span>
                      <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-xl" align="start">
                    <Calendar
                      mode="single"
                      selected={parseDateOnly(quoteDate) || new Date()}
                      onSelect={(d) => {
                        if (d) {
                          setQuoteDate(formatDateOnly(format(d, "yyyy-MM-dd"), "MM / dd / yyyy"));
                          setIsDateOpen(false);
                        }
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex items-center gap-2 text-[14px]">
                <Label htmlFor="quote-number-field" className="font-bold w-32 shrink-0 text-[14px]">Quotation No.:</Label>
                <Input
                  id="quote-number-field"
                  name="quoteNumber"
                  value={quoteNumber}
                  onChange={(e) => setQuoteNumber(e.target.value)}
                  placeholder="Quote# 29771"
                  className="h-7 text-[14px] font-mono border-slate-200 focus:border-amber-500 bg-transparent px-2 flex-1"
                />
              </div>

              {quoteType === "RENEWAL" && (
                <div className="flex items-center gap-2 text-[13px]">
                  <span className="font-bold w-32 shrink-0 text-indigo-700">Quote Type:</span>
                  <div className="flex-1 flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded text-xs font-semibold bg-indigo-50 border border-indigo-200 text-indigo-800 inline-flex items-center gap-1">
                      <span>🔄 Renewal Quote</span>
                      {sourceInvoiceNumber && <span className="font-normal">(From Inv #{sourceInvoiceNumber})</span>}
                    </span>
                    {servicePeriodLabel && (
                      <span className="text-[11.5px] text-slate-600 font-medium">
                        Period: {servicePeriodLabel}
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 text-[14px]">
                <Label htmlFor="quote-validity-field" className="font-bold w-32 shrink-0 text-[14px]">Quote Validity:</Label>
                <div className="flex items-center gap-1.5 flex-1">
                  <Input
                    id="quote-validity-field"
                    name="quoteValidity"
                    type="number"
                    min={1}
                    value={quoteValidity}
                    onChange={(e) => {
                      const val = e.target.value;
                      setQuoteValidity(val === "" ? "" : Math.max(1, parseInt(val) || 0));
                    }}
                    placeholder="30"
                    className="h-7 text-[14px] border-slate-200 focus:border-amber-500 bg-transparent px-2 w-24"
                  />
                  <span className="text-slate-600 text-[14px]">days</span>
                </div>
              </div>

              <div className="pt-3 space-y-1.5 border-t border-slate-100 mt-2">
                <div className="flex items-center gap-2 text-[14px]">
                  <Label htmlFor="quote-prepared-by-name" className="font-bold w-32 shrink-0 text-[14px]">Prepared By:</Label>
                  <div className="flex-1">
                    <UserAutocomplete
                      value={preparedByName}
                      onChange={(val, selectedUser) => {
                        setPreparedByName(val);
                        if (selectedUser?.email) {
                          setPreparedByEmail(selectedUser.email);
                        }
                      }}
                      placeholder="Search & select user..."
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[14px]">
                  <span className="w-32 shrink-0 text-slate-400"></span>
                  <Input
                    id="quote-prepared-by-email"
                    name="preparedByEmail"
                    type="email"
                    value={preparedByEmail}
                    onChange={(e) => setPreparedByEmail(e.target.value)}
                    placeholder="User email address..."
                    className="h-7 text-[13px] text-slate-700 border-slate-200 focus:border-amber-500 bg-transparent px-2 flex-1 font-sans"
                  />
                </div>
              </div>
            </div>

            {/* Print Mode: Clean Document Typography */}
            <div className="hidden print:block space-y-1.5 text-slate-900 sm:pl-4">
              <div className="text-[14px] leading-snug">
                <span className="font-bold">Date</span>{" "}
                <span className="ml-2">{quoteDate || format(new Date(), "MM / dd / yyyy")}</span>
              </div>
              <div className="text-[14px] leading-snug">
                <span className="font-bold">Quotation No.:</span>{" "}
                <span className="ml-2 font-mono font-semibold">{quoteNumber || "Quote# 29771"}</span>
              </div>
              <div className="text-[14px] leading-snug">
                <span className="font-bold">Quote Validity:</span>{" "}
                <span className="ml-2 italic text-slate-700">{quoteValidity ? `${quoteValidity} days` : "30 days"}</span>
              </div>

              {(preparedByName || preparedByEmail) && (
                <div className="pt-3 space-y-1 border-t border-slate-200/60 mt-2">
                  {preparedByName && (
                    <div className="text-[14px] leading-snug">
                      <span className="font-bold">Prepared By:</span>{" "}
                      <span className="ml-2 font-medium">{preparedByName}</span>
                    </div>
                  )}
                  {preparedByEmail && (
                    <div className="text-[14px] leading-snug text-slate-700">
                      <span className="ml-2">{preparedByEmail}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
  );
}
