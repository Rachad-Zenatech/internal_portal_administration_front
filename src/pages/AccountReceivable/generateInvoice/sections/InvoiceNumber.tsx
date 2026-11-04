import { format, addDays } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "../../../../components/ui/popover";
import { Calendar } from "../../../../components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../components/ui/select";
import type { GenerateInvoiceState } from "../hooks/useGenerateInvoice";

export function InvoiceNumber({ s }: { s: GenerateInvoiceState }) {
  const { isFieldVisible, setPoNumber, poNumber, renderFieldHeader, terms, handleTermsChange, setIsDueDatePopoverOpen, setDueDate, invoiceDate, parseFlexibleDate, getSelectedDueDate, dueDate, isDueDatePopoverOpen, setIsDatePopoverOpen, setInvoiceDate, getSelectedCalendarDate, isDatePopoverOpen, setInvoiceNumber, invoiceNumber } = s;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Invoice Number */}
            <div className="space-y-1.5">
              {renderFieldHeader("Invoice Number", "invoice_number", true)}
              <Input
                id="invoice_number"
                name="invoice_number"
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="e.g. 18067"
                className={`font-mono text-xs ${!isFieldVisible("invoice_number") ? "opacity-60 bg-muted/40" : ""}`}
              />
            </div>

            {/* Invoice Date Calendar Picker */}
            <div className="space-y-1.5">
              {renderFieldHeader("Invoice Date", "invoice_date", true)}
              <Popover open={isDatePopoverOpen} onOpenChange={setIsDatePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={`w-full h-8 justify-start text-left font-normal text-xs px-2.5 bg-card hover:bg-muted border-input cursor-pointer ${
                      !isFieldVisible("invoice_date") ? "opacity-60 bg-muted/40" : ""
                    }`}
                  >
                    <CalendarIcon className="mr-2 h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span className="font-semibold text-foreground truncate">
                      {invoiceDate || "Select Date"}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-3" align="start">
                  <div className="space-y-3">
                    <Calendar
                      mode="single"
                      selected={getSelectedCalendarDate()}
                      onSelect={(date) => {
                        if (date) {
                          setInvoiceDate(format(date, "MM/dd/yyyy"));
                          setIsDatePopoverOpen(false);
                        }
                      }}
                    />
                    {/* Quick Preset Buttons */}
                    <div className="flex items-center justify-between border-t border-border pt-2 gap-1 text-[11px]">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setInvoiceDate(format(new Date(), "MM/dd/yyyy"));
                          setIsDatePopoverOpen(false);
                        }}
                        className="h-6 text-[11px] px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 cursor-pointer"
                      >
                        Today
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setInvoiceDate(format(addDays(new Date(), 15), "MM/dd/yyyy"));
                          setIsDatePopoverOpen(false);
                        }}
                        className="h-6 text-[11px] px-2 cursor-pointer"
                      >
                        +15 Days
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setInvoiceDate(format(addDays(new Date(), 30), "MM/dd/yyyy"));
                          setIsDatePopoverOpen(false);
                        }}
                        className="h-6 text-[11px] px-2 cursor-pointer"
                      >
                        +30 Days
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Due Date Calendar Picker */}
            <div className="space-y-1.5">
              {renderFieldHeader("Due Date", "due_date", true)}
              <Popover open={isDueDatePopoverOpen} onOpenChange={setIsDueDatePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={`w-full h-8 justify-start text-left font-normal text-xs px-2.5 bg-card hover:bg-muted border-input cursor-pointer ${
                      !isFieldVisible("due_date") ? "opacity-60 bg-muted/40" : ""
                    }`}
                  >
                    <CalendarIcon className="mr-2 h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span className="font-semibold text-foreground truncate">
                      {dueDate || "Select Due Date"}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-3" align="start">
                  <div className="space-y-3">
                    <Calendar
                      mode="single"
                      selected={getSelectedDueDate()}
                      onSelect={(date) => {
                        if (date) {
                          setDueDate(format(date, "MM/dd/yyyy"));
                          setIsDueDatePopoverOpen(false);
                        }
                      }}
                    />
                    {/* Quick Presets for Due Date */}
                    <div className="flex items-center justify-between border-t border-border pt-2 gap-1 text-[11px]">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setDueDate(invoiceDate || format(new Date(), "MM/dd/yyyy"));
                          setIsDueDatePopoverOpen(false);
                        }}
                        className="h-6 text-[11px] px-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 cursor-pointer"
                      >
                        Same Date
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const base = parseFlexibleDate(invoiceDate);
                          setDueDate(format(addDays(base, 15), "MM/dd/yyyy"));
                          setIsDueDatePopoverOpen(false);
                        }}
                        className="h-6 text-[11px] px-2 cursor-pointer"
                      >
                        +15 Days
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const base = parseFlexibleDate(invoiceDate);
                          setDueDate(format(addDays(base, 30), "MM/dd/yyyy"));
                          setIsDueDatePopoverOpen(false);
                        }}
                        className="h-6 text-[11px] px-2 cursor-pointer"
                      >
                        +30 Days
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Terms Field */}
            <div className="space-y-1.5">
              {renderFieldHeader("Terms", "terms")}
              <Select value={terms} onValueChange={handleTermsChange}>
                <SelectTrigger
                  id="terms"
                  className={`h-9 text-xs border-slate-200 dark:border-slate-800 ${
                    !isFieldVisible("terms") ? "opacity-60 bg-muted/40" : ""
                  }`}
                >
                  <SelectValue placeholder="Select terms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15 days">15 days</SelectItem>
                  <SelectItem value="30 days">30 days</SelectItem>
                  {terms && !["15 days", "30 days"].includes(terms) && (
                    <SelectItem value={terms}>{terms}</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* P/O Number */}
            <div className="space-y-1.5">
              {renderFieldHeader("P/O Number", "po_number")}
              <Input
                id="po_number"
                name="po_number"
                type="text"
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
                placeholder="e.g. PO-89214"
                className={`font-mono text-xs ${!isFieldVisible("po_number") ? "opacity-60 bg-muted/40" : ""}`}
              />
            </div>
          </div>
  );
}
